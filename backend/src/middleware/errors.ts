// middleware/errors.ts
//
// Centralizes the mapping from "what went wrong" to "what HTTP status/body
// gets sent." Routes should never build error responses themselves — they
// either return a service's result directly or throw one of these errors
// (or let a service's thrown error bubble up) and let errorHandler below
// do the translation. This is what keeps routes down to: middleware, call
// service, return result.
//
// asyncHandler lives in ./async-handler.ts, not here — it's a handler
// wrapper that runs on every request, not an error-handling decision.


import { Request, Response, NextFunction } from "express";


/**
 * Thrown when a requested resource doesn't exist (e.g. an item ID that
 * isn't in the store). Caught by errorHandler below and turned into a
 * 404 response — routes/services should throw this instead of building
 * a 404 response themselves.
 */
export class NotFoundError extends Error {
  constructor(message = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

/**
 * Thrown when incoming data fails a business-rule check that isn't
 * already covered by schema validation (see middleware/validate.ts,
 * which handles shape/type validation before a handler even runs).
 * Caught by errorHandler below and turned into a 400 response.
 */
export class ValidationFailedError extends Error {
  constructor(message = "Validation failed") {
    super(message);
    this.name = "ValidationFailedError";
  }
}

/**
 * Thrown when a call to an external HTTP API fails — network error,
 * timeout, or a non-2xx response (see clients/http-client.ts). Caught by
 * errorHandler below and turned into a 502, since the failure originates
 * from a dependency this service called out to, not from the incoming
 * request itself.
 */
export class ExternalApiError extends Error {
  constructor(message = "External API call failed") {
    super(message);
    this.name = "ExternalApiError";
  }
}

/**
 * Central error-handling middleware. Register this LAST in server.ts,
 * after all routes, with app.use(errorHandler).
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const message = err instanceof Error ? err.message : String(err);

  // Errors are always written to the console, regardless of LOG_LEVEL.
  // LOG_LEVEL controls routine request/diagnostic logging; it should never
  // suppress actual application failures that require developer attention.
  console.error("ERROR:", err);

  if (err instanceof NotFoundError) {
    res.status(404).json({ ok: false, error: message });
    return;
  }

  if (err instanceof ValidationFailedError) {
    res.status(400).json({ ok: false, error: message });
    return;
  }

  if (err instanceof ExternalApiError) {
    res.status(502).json({ ok: false, error: message });
    return;
  }

  // Anything else thrown by a service (e.g. a plain Error from createItem)
  // is treated as a bad request, matching the original behavior. Adjust
  // this default if services start throwing errors that should map
  // elsewhere (e.g. 409 for conflicts, 500 for genuine server faults).
  res.status(400).json({ ok: false, error: message });
}
