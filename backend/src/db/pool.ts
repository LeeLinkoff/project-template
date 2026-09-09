// db/pool.ts
//
// Real Postgres connection pool (via the `pg` package — run `npm install pg` and `npm install -D @types/pg` if not already present).
//
// Reads connection info from DATABASE_URL. If that's unset, or points at
// a DB that isn't running/reachable, queries against this pool will
// reject with a real connection error the first time they're attempted —
// nothing here silently falls back to fake data.
//
// DATABASE_URL is optional in the generic template. The backend can start
// without a configured database; database-dependent routes will fail until
// a database is configured, while /health reports the database status.
//
// Database creation, schema setup, and seed data are handled separately by
// the scripts under scripts/ and seeds/. Applications built from this
// template should replace or extend those scripts for their actual schema.

import { Pool } from "pg";


export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
