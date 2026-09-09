// middleware/async-handler.ts
//
// A general request-handler wrapper, not an error-handling concern per se —
// it runs on every request, error or not. It only touches error handling
// in the unhappy path (forwarding a rejected promise to next()), which is
// why it might look like it belongs in errors.ts, but its job is wrapping
// handlers, not deciding what an error becomes. Kept separate so errors.ts
// stays focused on "what does this error turn into," not "how do handlers
// get invoked."


import { Request, Response, NextFunction, RequestHandler } from "express";


/**
 * In plain English: this function takes whatever route handler you give it
 * and calls it normally, no different than calling it directly.
 *
 * The reason it exists: if that handler is declared as `async` and
 * something inside it throws (or a promise it's waiting on rejects),
 * Express has no built-in way to notice that and turn it into an error
 * response. The request would just hang forever with nothing sent back.
 * This wrapper catches that specific case and forwards it to next(), the
 * normal Express way of saying "something went wrong, let the
 * error-handling middleware deal with it."
 *
 * Technically this works with any handler that returns a Promise, not
 * specifically ones using the `async` keyword — Promise.resolve() just
 * passes through whatever's returned. In practice you'll always use
 * `async`, since that's what lets you `await` inside the handler at all.
 *
 * --- Case 1: wrapping a SYNCHRONOUS handler (does nothing extra) ---
 *
 *   router.get("/", asyncHandler((req, res) => {
 *     const items = listItemsSync();   // plain function, no await
 *     res.json({ items });
 *   }));
 *
 *   If listItemsSync() throws, that throw happens immediately, inside
 *   handler(req, res, next) — before Promise.resolve() is even reached.
 *   Express already catches synchronous throws in route handlers on its
 *   own (true since Express 4) and forwards them to error-handling
 *   middleware itself. asyncHandler's .catch(next) never gets a chance
 *   to run here, because there's never a rejected promise to catch —
 *   Promise.resolve(undefined) just resolves immediately. Wrapping a
 *   sync handler like this is harmless, but functionally a no-op.
 *
 * --- Case 2: wrapping an ASYNC handler (this is where it matters) ---
 *
 *   router.get("/:id", asyncHandler(async (req, res) => {
 *     const item = await getItemById(req.params.id);   // can reject
 *     res.json(item);
 *   }));
 *
 *   Calling an async function always returns a promise, even though
 *   there's no explicit `return somePromise` anywhere. If getItemById
 *   rejects (throws inside an async function, or awaits something that
 *   rejects), that becomes a rejected promise. Without this wrapper,
 *   Express would NOT catch that — it would be an unhandled rejection,
 *   and the request would hang with no response ever sent. With this
 *   wrapper, Promise.resolve(handler(...)) is that same rejected
 *   promise, and .catch(next) catches it and calls next(err), which is
 *   what lets errorHandler (see errors.ts) actually send a response.
 *
 * Bottom line: safe to wrap every handler with this regardless of
 * whether it's sync or async — sync handlers pay no real cost, async
 * handlers get the error-forwarding they'd otherwise be missing.
 */
export function asyncHandler(handler: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
