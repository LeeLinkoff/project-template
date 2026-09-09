// services/items.ts
//
// Real Postgres queries via the pool in db/pool.ts. If DATABASE_URL isn't
// set, or the DB isn't running/reachable, or the `items` table doesn't
// exist yet, these calls will genuinely reject.  Nothing here fakes
// success. That's what makes asyncHandler (middleware/async-handler.ts)
// load-bearing: a real rejected promise from pool.query() is exactly
// what it exists to catch and forward to errorHandler.


// NodeNext/ESM requires explicit file extensions for relative imports.
// Local TypeScript modules therefore use the runtime .js extension even
// though the corresponding source files have a .ts extension. TypeScript
// resolves these imports to the .ts source during compilation, while the
// emitted JavaScript retains .js so it can run directly under Node.js.
import { pool } from "../db/pool.js";
import { NotFoundError } from "../middleware/errors.js";


/**
 * Request body used to create an item.
 *
 * @openapi
 */
export interface CreateItemRequest {
  orderId: number;
  name: string;
  description?: string;
}

/**
 * Item returned by the Items API.
 *
 * @openapi
 */
export interface Item extends CreateItemRequest {
  id: string;
  createdAt: string;
}

// Shape of a row exactly as Postgres returns it.
//
// Why this uses created_at instead of createdAt: Postgres lowercases any
// unquoted identifier (table name, column name, etc.). So a column
// declared as createdAt without quotes actually becomes createdat behind
// the scenes, all lowercase, camelCase silently lost. To genuinely keep
// createdAt as-written, you'd have to quote it ("createdAt") in the
// CREATE TABLE statement AND in every single query that touches it,
// forever, or Postgres looks for createdat and errors with "column does
// not exist." Using underscores instead (created_at) sidesteps that
// quoting requirement entirely, since lowercase-with-underscores survives
// Postgres's default lowercasing unchanged. That's why this convention
// (called "snake_case") is standard in Postgres schemas, not because
// underscores are inherently better, it avoids a real footgun.
//
// This project's schema (see scripts/setup-database.sql) follows that convention::
// created_at. The rest of this app's TypeScript code uses "camelCase"
// instead (createdAt, no underscore, each word after the first
// capitalized). These two naming styles do NOT convert automatically.
// That's what mapRow() below is for: it manually renames created_at
// (this schema's column name) to createdAt (this app's Item interface
// field name).
interface ItemRow {
  id: number;
  order_id: number;
  name: string;
  description: string | null;
  created_at: Date;
}

function mapRow(row: ItemRow): Item {
  return {
    id: String(row.id),
    orderId: row.order_id,
    name: row.name,
    description: row.description ?? undefined,
    createdAt: row.created_at.toISOString()
  };
}

export async function listItems(): Promise<Item[]> {
  const result = await pool.query<ItemRow>(
    "SELECT id, order_id, name, description, created_at FROM items ORDER BY created_at DESC"
  );
  return result.rows.map(mapRow);
}

export async function getItemById(id: string): Promise<Item> {
  const result = await pool.query<ItemRow>(
    "SELECT id, order_id, name, description, created_at FROM items WHERE id = $1",
    [id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError("Item not found");
  }

  return mapRow(result.rows[0]);
}

export async function createItem(payload: CreateItemRequest): Promise<Item> {
  const result = await pool.query<ItemRow>(
    "INSERT INTO items (order_id, name, description) VALUES ($1, $2, $3) RETURNING id, order_id, name, description, created_at",
    [payload.orderId, payload.name, payload.description ?? null]
  );
  return mapRow(result.rows[0]);
}
