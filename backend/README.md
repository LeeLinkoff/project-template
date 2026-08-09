# Generic Backend Template

Reusable Express + TypeScript backend with:

- thin HTTP routing in `server.ts`
- business logic in `services/`
- `/api/health`
- Swagger UI at `/api/docs`
- example REST endpoints under `/api/items`
- OpenAPI schemas generated from TypeScript service interfaces
- centralized configurable logging (`none`, `summary`, `verbose`)
- automatic request summary logging for `/api/*` when enabled

## Structure

```text
scripts/
  generate-openapi-schemas.ts
src/
  logging/
    logger.ts
  services/
    items.ts
  schemas.generated.ts
  server.ts
  swagger-spec.ts
```

Replace `services/items.ts` and the `/api/items` routes with application-specific functionality while preserving the same route → service pattern.

## Run

```bash
npm install
npm run generate:schemas
npm run dev
```

Swagger:

```text
http://localhost:3002/api/docs
```

Health:

```text
http://localhost:3002/api/health
```

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

Logging defaults to `none`. If `LOG_LEVEL` is missing or invalid, application/request logging remains disabled.

Configure it with:

```env
LOG_LEVEL=none
```

To enable one-line API request summaries:

```env
LOG_LEVEL=summary
```

Example:

```text
[request] GET /api/health -> 200 (3ms)
[request] GET /api/items -> 200 (2ms)
[request] POST /api/items -> 201 (5ms)
```

To enable additional request/response diagnostics:

```env
LOG_LEVEL=verbose
```

Request logging is implemented as Express middleware and should be registered before the API routes:

```typescript
app.use("/api", requestLogger);
```

Because the middleware is mounted on `/api`, every API endpoint registered after it is logged automatically when logging is enabled. Individual route handlers do not need separate summary logging calls.

Verbose logging includes request/response diagnostic metadata. Common sensitive headers and body fields such as authorization values, cookies, API keys, passwords, tokens, and secrets are redacted before logging.

## OpenAPI Schema Generation

Reusable OpenAPI schemas are generated from exported TypeScript service interfaces rather than maintained separately by hand.

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

`schemas.generated.ts` is generated output and should not be edited manually. The exported service interfaces are the source of truth.

Schema generation must run before TypeScript compilation because `swagger-spec.ts` imports the generated schemas.

