// middleware/validate.ts
//
// Generic, schema-agnostic-in-spirit (but Zod-backed) request validation.
// Pass any Zod schema and a target ("body" | "params" | "query") and this
// returns an Express middleware that validates that part of the request
// before the route handler runs. On success, the parsed (and type-coerced)
// value replaces the original so handlers receive already-validated data.
//
// Usage in a router:
//   router.post("/", validate(createItemSchema), (req, res) => { ... });
//
// Where the actual validation rules come from: a Zod schema (e.g. the
// `schema` parameter below) is built ahead of time with calls like
// z.object({ name: z.string() }) — that call returns an object with the
// rules ("must be an object", "name must be a string", etc.) stored
// inside it. `.safeParse(...)` is a method that comes attached to that
// schema object (Zod provides it, we don't write it) — when called, it
// reads the rules already stored on that specific schema and checks
// whatever value you pass it against them. Nothing here is inferring or
// guessing checks at runtime; the schema you built IS the checks, and
// safeParse just runs them.


import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";


// The three parts of an Express Request that can be validated. This
// controls which property of req[] gets checked and replaced below.
type ValidationTarget = "body" | "params" | "query";


/**
 * Returns Express middleware that validates part of the incoming request
 * (body, params, or query — whichever `target` specifies) against a Zod
 * schema, before the route handler ever runs.
 *
 * If validation fails, it responds with 400 and a list of what went wrong
 * (path + message per issue) and never calls next() — so the route handler
 * doesn't run at all on bad input.
 *
 * If validation succeeds, it replaces req[target] with the parsed result
 * from Zod (not the raw input), so the route handler receives data that's
 * already been coerced/defaulted according to the schema, then calls
 * next() to continue to the route handler.
 */
export function validate(schema: ZodSchema, target: ValidationTarget = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Runs the Zod schema against whichever part of the request `target`
    // points to (body, params, or query). safeParse never throws — it
    // always returns an object describing success or failure, which is
    // why the check right below reads result.success instead of a
    // try/catch.
    const result = schema.safeParse(req[target]);

    // result.success is false when the data didn't match the schema's
    // rules (wrong type, missing required field, failed a .min()/.max()
    // check, etc.) — result.error then holds the specific issues.
    if (!result.success) {
      // Cast is safe here: TypeScript can't narrow result.error's type
      // automatically just from checking result.success above, but Zod
      // guarantees error is populated whenever success is false.
      const zodError = result.error as ZodError;
      // Sends one issue per thing that failed validation, so the caller
      // sees exactly which field(s) were wrong and why, not just "bad
      // request."
      res.status(400).json({
        ok: false,
        error: "Validation failed",
        details: zodError.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      });
      return;
    }

    // Overwrites the original req[target] with result.data — the
    // Zod-parsed value, not the raw input. This matters when the schema
    // applies defaults or type coercion (e.g. z.coerce.number()): the
    // route handler sees the cleaned-up value, not what was actually sent.
    (req as any)[target] = result.data;
    next();
  };
}
