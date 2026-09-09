# Backend

Express + TypeScript backend with:

- thin HTTP routing in `src/routes/`
- business logic in `src/services/`
- `GET /health` (health/dependency diagnostics, including DB and outbound-internet connectivity)
- Swagger UI at `GET /docs`
- example REST endpoints under `/api/items`
- OpenAPI schemas generated from TypeScript service interfaces
- centralized configurable logging (`none`, `summary`, `verbose`)
- automatic request summary logging for every route when enabled

## Structure

```text
backend/
├── .env
├── .env.example
├── Dockerfile
├── package.json
├── tsconfig.json
├── scripts/
│   ├── generate-openapi-schemas.ts
│   ├── setup-database.sql
│   ├── setup-database.bat
│   └── seed-database.bat
├── seeds/
│   └── 001_database_seed.sql
└── src/
    ├── server.ts
    ├── swagger-spec.ts
    ├── schemas.generated.ts
    ├── clients/
    │   └── http-client.ts
    ├── db/
    │   └── pool.ts
    ├── logging/
    │   └── logger.ts
    ├── middleware/
    │   ├── async-handler.ts
    │   ├── auth.ts
    │   ├── errors.ts
    │   └── validate.ts
    ├── routes/
    │   ├── items_router.ts
    │   └── system_router.ts
    ├── schemas/
    │   └── items.ts
    └── services/
        ├── items.ts
        └── system.ts
```

Replace `services/items.ts`, `schemas/items.ts`, and the `/api/items` routes
with application-specific functionality while preserving the same
route → service pattern described below.

## Architecture

Each folder under `src/` has one job. This keeps routes thin and makes it
possible to swap an implementation (a database driver, an external API
client) without touching business logic elsewhere.

| Folder | Responsibility |
|---|---|
| `routes/` | HTTP wiring only. Applies middleware (auth, validation), calls a service, and returns the result. No business logic, no error-shaping, no status-code decisions, no try/catch. Anything thrown is caught by `asyncHandler` and mapped to a response by the central `errorHandler`. |
| `middleware/` | Cross-cutting request handling that runs before or around a route handler: authentication (`auth.ts`), validation (`validate.ts`), error mapping (`errors.ts`), and the async-handler wrapper (`async-handler.ts`). Not business logic, and not specific to any one resource. |
| `schemas/` | Zod schemas describing the *shape* of valid input (request body, params, or query). Used by `middleware/validate.ts`. `schemas.generated.ts` at the `src/` root serves a separate purpose: OpenAPI documentation schemas generated from service interfaces (see "OpenAPI Schema Generation" below). |
| `services/` | Business logic. Decides what this app's rules are: what counts as valid, what happens when something isn't found, how raw data gets shaped into the app's own types. Allowed to call clients and the DB pool for raw data, then apply this app's logic on top. |
| `clients/` | Wrappers around talking to something *external* (an HTTP API, in `http-client.ts`). No opinion about what your app does with the data, only handles the mechanics of the outside conversation: sending the request, handling timeouts, checking status codes, parsing the response, throwing a generic error on failure. |
| `db/` | The database connection itself (the `pg.Pool` in `pool.ts`). Not a service, only provides the connection, doesn't decide what a query means or how to react to results. |

**Client vs. service, in one sentence:** a client knows how to talk to
something; a service knows what your app does with the answer.

## Run

```bash
npm install
npm run generate:schemas
npm run dev
```

Swagger:

```text
http://localhost:3002/docs
```

Health:

```text
http://localhost:3002/health
```

## Database setup

```text
scripts/setup-database.sql
scripts/setup-database.bat
scripts/seed-database.bat
```

Run setup before starting the server if `DATABASE_URL` points at a fresh database.
The example database schema, including the `customers`, `orders`, and `items` tables and their relationships, is created by `scripts/setup-database.sql`.

## Logging

Backend logging is centralized in:

```text
src/logging/logger.ts
```

Supported levels:

```text
none
summary
verbose
```

Logging defaults to `none`. If `LOG_LEVEL` is missing, it stays `none`
silently (this is the normal default-off case). If `LOG_LEVEL` is set to
something unrecognized, an error is printed at startup and logging still
falls back to `none`, so a typo doesn't fail silently.

Configure it with:

```env
LOG_LEVEL=none
```

To enable one-line request summaries:

```env
LOG_LEVEL=summary
```

Example:

```text
[request] GET /health -> 200 (3ms)
[request] GET /api/items -> 200 (2ms)
[request] POST /api/items -> 201 (5ms)
```

To enable additional request/response diagnostics:

```env
LOG_LEVEL=verbose
```

Request logging is implemented as Express middleware and is registered
before all routes, with no path prefix:

```typescript
app.use(requestLogger);
```

Because it's mounted globally, every route, `/health`, `/docs`, and
everything under `/api`, is logged automatically when logging is enabled.
Individual route handlers do not need separate summary logging calls.

Verbose logging includes request/response diagnostic metadata. Common
sensitive headers and body fields such as authorization values, cookies,
API keys, passwords, tokens, and secrets are redacted before logging.

## OpenAPI Schema Generation

Reusable OpenAPI schemas are generated from exported TypeScript service
interfaces rather than maintained separately by hand.

The generator is:

```text
scripts/generate-openapi-schemas.ts
```

Run it with:

```bash
npm run generate:schemas
```

It writes:

```text
src/schemas.generated.ts
```

`schemas.generated.ts` is generated output and should not be edited
manually. The exported service interfaces are the source of truth.

Schema generation must run before TypeScript compilation because
`swagger-spec.ts` imports the generated schemas.
