// server.ts
//
// Generic API backend. Thin routing layer only: routes live in routes/,
// business logic lives in services/, error-response mapping lives in
// middleware/errors.ts. This file just wires everything together and
// starts the server.
//
// Endpoints:
//
//   GET  /health             — liveness check           (routes/system_router.ts)
//   GET  /docs               — Swagger UI               (routes/system_router.ts)
//
//   GET  /api/items          — example list endpoint    (routes/items_router.ts)
//   GET  /api/items/:id      — example lookup endpoint  (routes/items_router.ts)
//   POST /api/items          — example create endpoint  (routes/items_router.ts)


import "dotenv/config";
import express from "express";
import cors from "cors";

// NodeNext/ESM requires explicit file extensions for relative imports.
// Local TypeScript modules therefore use the runtime .js extension even
// though the corresponding source files have a .ts extension. TypeScript
// resolves these imports to the .ts source during compilation, while the
// emitted JavaScript retains .js so it can run directly under Node.js.
import { LOG_LEVEL, logSummary, requestLogger } from "./logging/logger.js";
import { errorHandler } from "./middleware/errors.js";
import systemRouter from "./routes/system_router.js";
import itemsRouter from "./routes/items_router.js";


const app = express();
const PORT = process.env.PORT || 3002;


app.use(cors());
app.use(express.json());

// Global request logger.
//
// Because this middleware is registered with app.use() before the API
// routes below, every request that reaches those routes passes through
// requestLogger automatically. Individual route handlers therefore do
// not need their own summary logging calls.
//
// At LOG_LEVEL=summary, requestLogger writes one completion line containing
// the HTTP method, URL, final response status, and elapsed time.
// At LOG_LEVEL=verbose, it also writes request/response diagnostic details.
// At LOG_LEVEL=none, it immediately calls next() without logging anything.
app.use(requestLogger);


// System/infra routes — unversioned, not under /api.
app.use("/", systemRouter);

// Business API routes.
app.use("/api/items", itemsRouter);


// Central error handler
// !! must be registered LAST, after all routes. !!
app.use(errorHandler);


app.listen(PORT, () => 
{
  console.log(`generic-backend listening on port ${PORT}`);
  console.log(`Swagger docs: http://localhost:${PORT}/docs`);
  console.log(`Logging: ${LOG_LEVEL}`);
});
