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
  console.log(`generic-backend listening on port ${PORT}`);
  console.log(`Swagger docs: http://localhost:${PORT}/api/docs`);
});
