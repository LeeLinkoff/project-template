// logging/logger.ts
//
// Generic configurable backend logging.
//
// This module centralizes backend application/request logging so individual
// Express route handlers and service functions do not need their own
// repetitive console.log() calls.
//
// LOG_LEVEL controls how much information is written:
//
//   none
//     Disables application logging entirely.
//
//   summary
//     Writes application startup messages and one completion line for each
//     request handled by requestLogger(), for example:
//
//       [request] GET /api/health -> 200 (3ms)
//
//   verbose
//     Includes everything from summary plus request and response diagnostic
//     information such as headers, query parameters, route parameters,
//     request body, response content type, and response content length.
//
// If LOG_LEVEL is missing or contains an unsupported value, logging defaults
// to "none". This keeps logging opt-in for applications created from this
// template.

import { NextFunction, Request, Response } from "express";

export type LogLevel = "none" | "summary" | "verbose";

const VALID_LEVELS: LogLevel[] = [
  "none",
  "summary",
  "verbose"
];

// Read the configured logging level once when the application starts.
//
// Examples:
//
//   LOG_LEVEL=none
//   LOG_LEVEL=summary
//   LOG_LEVEL=verbose
//
// Converting to lowercase makes values such as SUMMARY or Verbose work as
// expected.
const configuredLevel =
  (process.env.LOG_LEVEL || "none").toLowerCase();

// Invalid values intentionally fall back to "none" rather than enabling
// logging unexpectedly.
export const LOG_LEVEL: LogLevel =
  VALID_LEVELS.includes(configuredLevel as LogLevel)
    ? (configuredLevel as LogLevel)
    : "none";


// ---------------------------------------------------------------------------
// Sensitive-data redaction
// ---------------------------------------------------------------------------
//
// Verbose logging can expose considerably more request information than
// summary logging. Common credential-bearing headers and body properties are
// therefore redacted before they are written to the console.
//
// Applications can extend these sets with additional application-specific
// sensitive fields.

const REDACTED_HEADERS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key"
]);

const REDACTED_BODY_KEYS = new Set([
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "apiKey",
  "secret"
]);


// Return a copy of the request headers with known credential-bearing values
// replaced by [REDACTED].
function redactHeaders(headers: Request["headers"]) {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [
      key,
      REDACTED_HEADERS.has(key.toLowerCase())
        ? "[REDACTED]"
        : value
    ])
  );
}


// Recursively redact known sensitive properties from objects and arrays.
//
// Recursive processing is useful because credentials may appear inside nested
// request objects rather than only at the top level.
function redactBody(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactBody);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(
        value as Record<string, unknown>
      ).map(([key, child]) => [
        key,
        REDACTED_BODY_KEYS.has(key)
          ? "[REDACTED]"
          : redactBody(child)
      ])
    );
  }

  return value;
}


// ---------------------------------------------------------------------------
// Logging functions
// ---------------------------------------------------------------------------


// Write a summary-level message.
//
// Summary messages are produced when LOG_LEVEL is either:
//
//   summary
//   verbose
//
// LOG_LEVEL=none suppresses them.
export function logSummary(
  message: string,
  details?: unknown
): void {
  if (LOG_LEVEL === "none") {
    return;
  }

  details === undefined
    ? console.log(message)
    : console.log(message, details);
}


// Write verbose diagnostic information.
//
// Verbose messages are emitted ONLY when LOG_LEVEL=verbose.
export function logVerbose(
  message: string,
  details?: unknown
): void {
  if (LOG_LEVEL !== "verbose") {
    return;
  }

  details === undefined
    ? console.log(message)
    : console.log(message, details);
}


// Write an application error.
//
// Errors follow the same opt-in behavior as summary logging:
// LOG_LEVEL=none suppresses them.
//
// User-facing error handling should remain separate from logging. This
// function is only responsible for diagnostic output.
export function logError(
  message: string,
  error?: unknown
): void {
  if (LOG_LEVEL === "none") {
    return;
  }

  error === undefined
    ? console.error(message)
    : console.error(message, error);
}


// ---------------------------------------------------------------------------
// Express request logging middleware
// ---------------------------------------------------------------------------
//
// Register this middleware BEFORE the API routes in server.ts:
//
//   app.use("/api", requestLogger);
//
// Express executes middleware in registration order. Because requestLogger is
// mounted before the API routes, every request under /api automatically passes
// through this function. Individual API handlers therefore do NOT need their
// own summary logging calls.
//
// Example:
//
//   GET /api/health
//
// automatically produces:
//
//   [request] GET /api/health -> 200 (3ms)
//
// when LOG_LEVEL is summary or verbose.
//
// The middleware registers a listener for the response "finish" event before
// calling next(). The route then executes normally. When Express/Node finishes
// the response, the listener runs and can report the FINAL HTTP status code
// together with the elapsed request time.
//
// Processing sequence:
//
//   HTTP request
//        ↓
//   requestLogger()
//        ↓
//   record start time
//        ↓
//   optionally log verbose request details
//        ↓
//   register response "finish" listener
//        ↓
//   next()
//        ↓
//   Express route executes
//        ↓
//   response completes
//        ↓
//   "finish" listener runs
//        ↓
//   summary line is written
//
// At LOG_LEVEL=none the middleware immediately calls next() and performs no
// logging work beyond checking the configured level.

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {

  // Logging disabled: immediately continue through the Express pipeline.
  if (LOG_LEVEL === "none") {
    next();
    return;
  }

  // Used to calculate total request processing time.
  const startedAt = Date.now();


  // Verbose mode records incoming request diagnostics before the route runs.
  //
  // Sensitive headers/body fields are redacted before logging.
  if (LOG_LEVEL === "verbose") {
    logVerbose(
      `[request] ${req.method} ${req.originalUrl}`,
      {
        headers: redactHeaders(req.headers),
        query: req.query,
        params: req.params,
        body: redactBody(req.body)
      }
    );
  }


  // "finish" runs after the response has been completed.
  //
  // Waiting until this point means res.statusCode contains the final status
  // selected by the route (200, 201, 400, 404, 500, etc.).
  res.on("finish", () => {
    const elapsedMs =
      Date.now() - startedAt;

    // Summary logging produces exactly one completion line per request.
    logSummary(
      `[request] ${req.method} ${req.originalUrl} -> ` +
      `${res.statusCode} (${elapsedMs}ms)`
    );


    // Verbose mode supplements the summary with basic response metadata.
    //
    // The response body itself is deliberately not captured here. Capturing
    // arbitrary response bodies requires intercepting Express response
    // methods and can introduce unnecessary complexity and sensitive-data
    // exposure into a generic template.
    logVerbose(
      "[response]",
      {
        statusCode: res.statusCode,
        contentType:
          res.getHeader("content-type"),
        contentLength:
          res.getHeader("content-length")
      }
    );
  });


  // Continue to the next middleware or matching route handler.
  next();
}