// server.ts
//
// Generic API backend. Thin routing layer only: each endpoint parses the
// request, calls a service function, and shapes the response. Business logic
// lives in services/ so routes remain small, testable, and easy to replace
// or move later without changing the underlying application logic.
//
// Endpoints:
//   GET  /api/health        — liveness check
//   GET  /api/docs          — Swagger UI
//   GET  /api/items         — example list endpoint
//   GET  /api/items/:id     — example lookup endpoint
//   POST /api/items         — example create endpoint

import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger-spec";
import { LOG_LEVEL, logSummary, requestLogger } from "./logging/logger";

import {
  createItem,
  getItemById,
  listItems,
  CreateItemRequest
} from "./services/items";

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

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

/**
 * GET /api/health
 */
app.get("/api/health", (_req: Request, res: Response) => {
app.use(requestLogger);

/**
 * GET /api/health
 */
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: "generic-backend",
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/docs
 */
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * GET /api/items
 */
app.get("/api/items", (_req: Request, res: Response) => {
  res.json({
    items: listItems()
  });
});

/**
 * GET /api/items/:id
 */
app.get("/api/items/:id", (req: Request, res: Response) => {
  const item = getItemById(req.params.id);

  if (!item) {
    res.status(404).json({
      ok: false,
      error: "Item not found"
    });
    return;
  }

  res.json(item);
});

/**
 * POST /api/items
 */
app.post("/api/items", (req: Request, res: Response) => {
  try {
    const payload = req.body as CreateItemRequest;
    const item = createItem(payload);
    res.status(201).json(item);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({
      ok: false,
      error: message
    });
  }
});

app.listen(PORT, () => {
  logSummary(`generic-backend listening on port ${PORT}`);
  logSummary(`Swagger docs: http://localhost:${PORT}/api/docs`);
  logSummary(`Logging: ${LOG_LEVEL}`);
});
