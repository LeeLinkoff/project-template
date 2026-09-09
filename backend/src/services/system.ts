// services/system.ts
//
// System-level service functions. getHealthStatus is genuinely async: it
// checks both DB connectivity (via db/pool.ts) and outbound internet
// connectivity (via clients/http-client.ts) — two real dependencies most
// deployed apps care about and that fail independently of each other.
//
// A health check's whole purpose is to report status, not to fail itself
// just because one of the things it's checking is down. So both checks
// below catch their own errors and report { connected: false, error }
// instead of throwing — /health keeps responding with 200 even if the DB
// was never configured, or outbound network access is blocked (a real,
// common issue in containers, VPCs, and locked-down environments).


// NodeNext/ESM requires explicit file extensions for relative imports.
// Local TypeScript modules therefore use the runtime .js extension even
// though the corresponding source files have a .ts extension. TypeScript
// resolves these imports to the .ts source during compilation, while the
// emitted JavaScript retains .js so it can run directly under Node.js.
import { pool } from "../db/pool.js";
import { fetchJson } from "../clients/http-client.js";


/**
 * Health and dependency status returned by GET /health.
 *
 * @openapi
 */
export interface HealthStatus {
  ok: boolean;
  service: string;
  timestamp: string;
  database: {
    connected: boolean;
    error?: string;
  };
  outboundInternet: {
    connected: boolean;
    ip?: string;
    error?: string;
  };
}

async function checkDatabaseConnection(): Promise<{
  connected: boolean;
  error?: string;
}> {
  // A database connection is optional in the generic template.
  // Report an unconfigured database clearly instead of attempting a
  // connection and returning a low-level PostgreSQL authentication error.
  if (!process.env.DATABASE_URL) {
    return {
      connected: false,
      error: "Database not configured"
    };
  }

  try {
    // SELECT 1 checks connectivity without depending on application tables.
    await pool.query("SELECT 1");
    return { connected: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { connected: false, error: message };
  }
}

async function checkOutboundInternet(): Promise<{
  connected: boolean;
  ip?: string;
  error?: string;
}> {
  try {
    // A free, no-auth endpoint that just echoes back the caller's public
    // IP. Genuinely useful beyond just "does this work" — it confirms
    // the server actually has outbound internet access at all, which
    // matters in containerized deployments, restrictive VPCs, or
    // corporate firewalls where outbound traffic can be silently blocked.
    const result = await fetchJson<{ ip: string }>(
      "https://api.ipify.org?format=json",
      { timeoutMs: 5000 }
    );
    return { connected: true, ip: result.ip };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { connected: false, error: message };
  }
}

export async function getHealthStatus(): Promise<HealthStatus> {
  const [database, outboundInternet] = await Promise.all([
    checkDatabaseConnection(),
    checkOutboundInternet()
  ]);

  return {
    ok: true,
    service: "generic-backend",
    timestamp: new Date().toISOString(),
    database,
    outboundInternet
  };
}
