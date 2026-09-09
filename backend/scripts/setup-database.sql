/*
 * Schema evolution note:
 *
 * This script intentionally uses simple, idempotent object-existence checks.
 * It is intended as a reusable starting point for a PostgreSQL application.
 * A production enhancement would use an application-aware migration process
 * that detects destructive schema changes and requires explicit confirmation
 * before removing or changing data-bearing objects.
 */

\set ON_ERROR_STOP on

\echo Checking application role example_app...

SELECT 'CREATE ROLE example_app LOGIN PASSWORD ''exampleUserPassword'''
WHERE NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_roles
    WHERE rolname = 'example_app'
)
\gexec

\echo Checking database exampledb...

SELECT 'CREATE DATABASE exampledb OWNER example_app'
WHERE NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_database
    WHERE datname = 'exampledb'
)
\gexec

\echo Checking database ownership...

SELECT 'ALTER DATABASE exampledb OWNER TO example_app'
WHERE EXISTS (
    SELECT 1
    FROM pg_catalog.pg_database
    WHERE datname = 'exampledb'
      AND pg_catalog.pg_get_userbyid(datdba) <> 'example_app'
)
\gexec

\echo Connecting to exampledb...
\connect exampledb

-- Create application objects as the application role so ownership is correct.
SET ROLE example_app;

\echo Checking/creating customers...

CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT customers_email_not_blank CHECK (BTRIM(email) <> '')
);

\echo Checking/creating orders...

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
    order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0
        CHECK (total_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

\echo Checking/creating items...

CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT items_name_not_blank
        CHECK (BTRIM(name) <> '')
);

/*
 * Relationship examples:
 *
 *   customers 1 ----< many orders
 *   orders    1 ----< many items
 *
 * The foreign keys above enforce referential integrity. ON DELETE RESTRICT on
 * orders.customer_id prevents deleting a customer that still owns orders.
 * ON DELETE CASCADE on items.order_id removes child rows when their
 * parent order is intentionally deleted.
 */

\echo Checking/creating indexes...

-- PostgreSQL does not automatically create indexes for foreign-key columns.
-- These support common relationship lookups and joins.
CREATE INDEX IF NOT EXISTS idx_orders_customer_id
    ON orders (customer_id);

CREATE INDEX IF NOT EXISTS idx_items_order_id
    ON items (order_id);

-- Example composite index for a common customer/order-history query pattern.
CREATE INDEX IF NOT EXISTS idx_orders_customer_order_date
    ON orders (customer_id, order_date DESC);

-- Example index for filtering or reporting by order status.
CREATE INDEX IF NOT EXISTS idx_orders_status
    ON orders (status);

RESET ROLE;

\echo
\echo Example database setup/update complete.
