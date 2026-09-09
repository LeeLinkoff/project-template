// routes/items_router.ts
//
// Item endpoints. Mounted at /api/items in server.ts.
//
// Routes here do only three things: apply middleware (auth/validation),
// await the corresponding service function, and return its result. No
// error-shaping, no try/catch, no status-code decisions, no not-found
// checks — getItemById throws NotFoundError itself (see services/items.ts).
// Every service call below is async now (services/items.ts runs real
// Postgres queries via db/pool.ts), so asyncHandler is genuinely doing
// work here: if any of these awaited calls rejects, asyncHandler catches
// that rejection and forwards it to the central errorHandler in
// middleware/errors.ts.
//
// Auth is not yet wired on any route below — import whichever of
// authenticateJwt / authenticateApiKey / authenticateSession this app
// ends up using and add it to the relevant route's middleware chain,
// e.g.: router.post("/", authenticateApiKey, validate(createItemSchema), handler)


import { Router, Request, Response } from "express";

// NodeNext/ESM requires explicit file extensions for relative imports.
// Local TypeScript modules therefore use the runtime .js extension even
// though the corresponding source files have a .ts extension. TypeScript
// resolves these imports to the .ts source during compilation, while the
// emitted JavaScript retains .js so it can run directly under Node.js.
import { createItem, getItemById, listItems, CreateItemRequest } from "../services/items.js";
import { validate } from "../middleware/validate.js";
import { createItemSchema, itemIdParamsSchema } from "../schemas/items.js";
import { asyncHandler } from "../middleware/async-handler.js";
// import { authenticateJwt, authenticateApiKey, authenticateSession } from "../middleware/auth.js";


const router = Router();

/**

 * GET /api/items
 */
router.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({ items: await listItems() });
  })
);

/**
 * GET /api/items/:id
 */
router.get(
  "/:id",
  validate(itemIdParamsSchema, "params"),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await getItemById(req.params.id));
  })
);

/**
 * POST /api/items
 */
router.post(
  "/",
  validate(createItemSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const item = await createItem(req.body as CreateItemRequest);
    res.status(201).json(item);
  })
);


export default router;
