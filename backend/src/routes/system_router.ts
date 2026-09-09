// routes/system_router.ts
//
// System/infra routes — liveness check and API docs. Mounted at the root
// in server.ts (not under /api), matching convention for health checks
// used by load balancers, container orchestrators, etc.
//
// This router does nothing but call a service and return its result —
// see services/system.ts for the actual health payload logic. The health
// route is wrapped in asyncHandler since getHealthStatus is now genuinely
// async (it queries the DB pool to check connectivity), so a rejected
// promise here — though unlikely, since checkDatabaseConnection catches
// its own errors internally — would still be caught and forwarded to
// errorHandler rather than left as an unhandled rejection.


import { Router, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";

// NodeNext/ESM requires explicit file extensions for relative imports.
// Local TypeScript modules therefore use the runtime .js extension even
// though the corresponding source files have a .ts extension. TypeScript
// resolves these imports to the .ts source during compilation, while the
// emitted JavaScript retains .js so it can run directly under Node.js.
import swaggerSpec from "../swagger-spec.js";
import { getHealthStatus } from "../services/system.js";
import { asyncHandler } from "../middleware/async-handler.js";


const router = Router();


/**
 * GET /health
 */
router.get(
  "/health",
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await getHealthStatus());
  })
);

/**
 * GET /docs
 */
router.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));


export default router;
