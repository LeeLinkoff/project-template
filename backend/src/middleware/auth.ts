// middleware/auth.ts
//
// Placeholder authentication middlewares. None of these are wired to a
// real verification mechanism yet — each is stubbed so routes can declare
// which auth strategy they expect, and the real logic can be dropped in
// later without changing route files again.
//
// Apply per-route, e.g.:
//   router.post("/", authenticateApiKey, validate(schema), handler);
//
// Only wire up the one(s) this app actually needs — these are independent,
// not meant to all be active at once.


import { Request, Response, NextFunction } from "express";


/**
 * Extends Express's Request type with an optional `auth` field, so that
 * once one of the authenticate* middlewares below successfully verifies a
 * request, it can attach who the request is from (subject) and how they
 * were authenticated (method) — and anything downstream (route handlers,
 * logging, etc.) can read req.auth without needing a type cast.
 *
 * This field is optional (`auth?`) because a request that hasn't been
 * through any auth middleware yet is still a valid Request — it just
 * won't have this property set until one of the authenticate* functions
 * runs.
 */
export interface AuthedRequest extends Request {
  auth?: {
    subject: string;
    method: "jwt" | "api-key" | "session";
  };
}


/**
 * JWT bearer token auth.
 * TODO: verify the token (e.g. with `jsonwebtoken` + a secret/public key),
 * decode claims, and reject on missing/invalid/expired tokens.
 */
export function authenticateJwt(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ ok: false, error: "Missing bearer token" });
    return;
  }

  const token = header.slice("Bearer ".length);

  // TODO: replace with real verification. Skeleton using `jsonwebtoken`:
  //
  //   import jwt from "jsonwebtoken";
  //
  //   let decoded: jwt.JwtPayload;
  //   try {
  //     decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
  //   } catch (err) {
  //     if (err instanceof jwt.TokenExpiredError) {
  //       res.status(401).json({ ok: false, error: "Token expired" });
  //       return;
  //     }
  //     res.status(401).json({ ok: false, error: "Invalid token" });
  //     return;
  //   }
  //
  //   req.auth = { subject: decoded.sub as string, method: "jwt" };
  //   next();
  //   return;

  if (!token) {
    res.status(401).json({ ok: false, error: "Invalid token" });
    return;
  }

  req.auth = { subject: "TODO-decoded-subject", method: "jwt" };
  next();
}

/**
 * API key auth, expected via an `x-api-key` header.
 * TODO: look up the key against a store (DB, env-configured allowlist,
 * secrets manager) instead of the placeholder check below.
 */
export function authenticateApiKey(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): void {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey || typeof apiKey !== "string") {
    res.status(401).json({ ok: false, error: "Missing API key" });
    return;
  }

  // TODO: replace with real lookup/verification. Skeleton against a DB:
  //
  //   const record = await db.apiKeys.findUnique({ where: { key: apiKey } });
  //
  //   if (!record || record.revoked) {
  //     res.status(401).json({ ok: false, error: "Invalid API key" });
  //     return;
  //   }
  //
  //   req.auth = { subject: record.ownerId, method: "api-key" };
  //   next();
  //   return;
  //
  // Skeleton against a static env-configured allowlist instead:
  //
  //   const allowedKeys = (process.env.API_KEYS ?? "").split(",");
  //   if (!allowedKeys.includes(apiKey)) {
  //     res.status(401).json({ ok: false, error: "Invalid API key" });
  //     return;
  //   }

  const isValid = apiKey.length > 0;
  if (!isValid) {
    res.status(401).json({ ok: false, error: "Invalid API key" });
    return;
  }

  req.auth = { subject: "TODO-key-owner", method: "api-key" };
  next();
}

/**
 * Session-based auth (e.g. cookie + server-side session store).
 * TODO: wire to whatever session middleware/store this app ends up using
 * (express-session, Redis-backed store, etc.) and read the real session.
 */
export function authenticateSession(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): void {
  const session = (req as any).session;

  // TODO: replace with real session validation. Skeleton assuming
  // `express-session` is registered globally in server.ts, e.g.:
  //
  //   import session from "express-session";
  //
  //   app.use(session({
  //     secret: process.env.SESSION_SECRET!,
  //     resave: false,
  //     saveUninitialized: false,
  //     cookie: { secure: process.env.NODE_ENV === "production" }
  //   }));
  //
  // Then here:
  //
  //   if (!req.session || !req.session.userId) {
  //     res.status(401).json({ ok: false, error: "No active session" });
  //     return;
  //   }
  //
  //   req.auth = { subject: req.session.userId, method: "session" };
  //   next();
  //   return;

  if (!session || !session.userId) {
    res.status(401).json({ ok: false, error: "No active session" });
    return;
  }

  req.auth = { subject: session.userId, method: "session" };
  next();
}
