# Generic Full-Stack Application Template

Reusable starting point for React + Node/Express applications with a clean frontend/backend split, health monitoring, Swagger/OpenAPI, generated schemas, configurable logging, and Docker deployment.

## Included

### Frontend

- React + Vite
- reusable light-theme card layout
- application header card
- backend health/status card
- generic two-tab main content component
- reusable `ErrorMessage` component
- centralized `src/api/client.js`
- centralized configurable logging in `src/logging/logger.js`
- frontend logging levels: `none`, `summary`, `verbose`
- frontend logging defaults to `none`

### Backend

- Node.js + Express + TypeScript
- TypeScript `strict: true`
- thin routes in `server.ts`
- application logic under `src/services/`
- centralized configurable logging in `src/logging/logger.ts`
- automatic logging middleware for every `/api` request
- backend logging levels: `none`, `summary`, `verbose`
- backend logging defaults to `none`
- `GET /api/health`
- Swagger UI at `GET /api/docs`
- example REST endpoints under `/api/items`
- OpenAPI schemas generated dynamically from TypeScript service interfaces
- Docker deployment

## Structure

```text
IMPORTANT_RUN_FIRST.bat (one-time dependency setup after copying the template)

backend/
├── scripts/
│   └── generate-openapi-schemas.ts
├── src/
│   ├── logging/
│   │   └── logger.ts
│   ├── services/
│   │   └── items.ts
│   ├── schemas.generated.ts
│   ├── server.ts
│   └── swagger-spec.ts
├── Dockerfile
├── package.json
├── package-lock.json
└── tsconfig.json

frontend/
├── src/
│   ├── api/
│   │   └── client.js
│   ├── components/
│   │   ├── AppHeaderCard.jsx
│   │   ├── BackendHealthCard.jsx
│   │   ├── ErrorMessage.jsx
│   │   ├── GenericTabs.jsx
│   │   └── MainContentCard.jsx
│   ├── logging/
│   │   └── logger.js
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── package.json
├── package-lock.json
└── vite.config.js
```

## Backend Pattern

The backend deliberately separates HTTP routing from application logic:

```text
HTTP request
    ↓
server.ts
    ↓
service function
    ↓
plain data result
    ↓
HTTP response
```

`server.ts` should remain thin. It handles Express configuration, middleware, request parsing, service invocation, HTTP status codes, and response formatting.

Business rules, persistence, external APIs, queues, and other application behavior belong under `src/services/`.

## Generic API Endpoints

The baseline backend provides:

```text
GET  /api/health
GET  /api/docs
GET  /api/items
GET  /api/items/:id
POST /api/items
```

The `/api/items` endpoints are examples. Replace them with application-specific endpoints while normally retaining `/api/health` and `/api/docs`.

## Logging

Logging is centralized on both the backend and frontend.

Supported levels:

```text
none
summary
verbose
```

The default is intentionally:

```text
none
```

If the corresponding environment variable is missing or invalid, the logger falls back to `none`.

### Backend Logging

Backend logging lives in:

```text
backend/src/logging/logger.ts
```

Configure it with:

```env
LOG_LEVEL=none
```

Available values:

```env
LOG_LEVEL=none
LOG_LEVEL=summary
LOG_LEVEL=verbose
```

Behavior:

- `none` — no application/request logging.
- `summary` — startup information plus one completion line for every API request.
- `verbose` — summary logging plus request and response diagnostic details.

Example `summary` output:

```text
generic-backend listening on port 3002
Swagger docs: http://localhost:3002/api/docs
Logging: summary
[request] GET /api/health -> 200 (3ms)
[request] GET /api/items -> 200 (2ms)
[request] GET /api/items/1 -> 200 (1ms)
[request] POST /api/items -> 201 (5ms)
```

Request logging is implemented as Express middleware:

```typescript
app.use("/api", requestLogger);
```

The middleware is registered before the API routes. Therefore every request under `/api` automatically passes through `requestLogger`; individual route handlers do not need their own repetitive summary logging calls.

The middleware records the start time, calls `next()`, and waits for the response `finish` event. At that point it can log the final HTTP status code and elapsed processing time.

Verbose mode can include:

- request headers
- query parameters
- route parameters
- parsed request body
- response status
- response content type
- response content length

Common sensitive values are redacted before verbose request data is written. The generic logger includes redaction for common authorization headers, cookies, API keys, passwords, tokens, and secrets.

Application-specific sensitive fields should be added to the logger's redaction lists when necessary.

### Frontend Logging

Frontend logging lives in:

```text
frontend/src/logging/logger.js
```

Configure it with:

```env
VITE_LOG_LEVEL=none
```

Available values:

```env
VITE_LOG_LEVEL=none
VITE_LOG_LEVEL=summary
VITE_LOG_LEVEL=verbose
```

The frontend logger exports:

```javascript
logSummary()
logVerbose()
logError()
```

Use these functions from API/client code, components, or other frontend modules instead of scattering direct `console.log()` and `console.error()` calls throughout the application.

`summary` is intended for important application events and errors.

`verbose` includes summary messages plus additional diagnostic details.

`none` suppresses application logging.

Because Vite exposes `VITE_*` environment variables to browser code, never place API keys, passwords, access tokens, secrets, or other sensitive values in a `VITE_*` variable.

### Logging and Error Handling

Logging and user-facing errors are separate concerns.

The reusable frontend `ErrorMessage` component is responsible for displaying appropriate errors to the user. The logging layer is diagnostic infrastructure.

A typical flow is:

```text
API failure
    ↓
logError(...)
    ↓
set component error state
    ↓
ErrorMessage
```

## Frontend API Client

Frontend API access is centralized in:

```text
frontend/src/api/client.js
```

Components should use API-client functions rather than scattering raw `fetch()` calls throughout the component tree.

The API client is also a natural place to use `logSummary`, `logVerbose`, and `logError` for frontend API diagnostics.

## OpenAPI / Swagger

Swagger UI is available at:

```text
/api/docs
```

The OpenAPI specification is defined in:

```text
backend/src/swagger-spec.ts
```

HTTP-specific metadata remains hand-maintained, including paths, methods, request bodies, response codes, descriptions, and tags.

Reusable data schemas are generated from exported TypeScript service interfaces.

## Dynamic OpenAPI Schema Generation

The generator is:

```text
backend/scripts/generate-openapi-schemas.ts
```

Run:

```bash
npm run generate:schemas
```

It generates:

```text
backend/src/schemas.generated.ts
```

Do not manually maintain `schemas.generated.ts`.

The service interfaces are the source of truth.

Generation flow:

```text
services/*.ts
    ↓
exported TypeScript interfaces
    ↓
generate-openapi-schemas.ts
    ↓
schemas.generated.ts
    ↓
swagger-spec.ts
    ↓
/api/docs
```

Schema generation must occur before TypeScript compilation because `swagger-spec.ts` imports the generated schema module.

## First-Time Project Setup

Immediately after creating a new project from this template, run from the project root:

```bat
IMPORTANT_RUN_FIRST.bat
```

This is a **one-time bootstrap step**. It runs `npm install` in both `backend/` and `frontend/`, stops with an error if either installation fails, and reports when project setup is complete. After it succeeds, normal development and build commands can be used without running it again unless dependencies need to be reinstalled.

As the template is adapted into a real application, update this script if that application gains additional first-run setup requirements.

## Local Development

### Backend

After the one-time root setup above:

```bash
cd backend
npm run dev
```

The build process runs OpenAPI schema generation before TypeScript compilation. Run `npm run generate:schemas` directly only when you specifically want to regenerate the schema module without performing a full build.

Default backend:

```text
http://localhost:3002
```

Health:

```text
http://localhost:3002/api/health
```

Swagger:

```text
http://localhost:3002/api/docs
```

To enable summary logging locally:

```env
LOG_LEVEL=summary
```

To enable verbose backend diagnostics:

```env
LOG_LEVEL=verbose
```

### Frontend

After the one-time root setup above:

```bash
cd frontend
npm run dev
```

Typical Vite development server:

```text
http://localhost:5174
```

To enable frontend summary logging:

```env
VITE_LOG_LEVEL=summary
```

To enable verbose frontend diagnostics:

```env
VITE_LOG_LEVEL=verbose
```

## API Path Pattern

The frontend can be hosted under an application-specific subpath such as:

```text
/apps/my-app/
```

A public API request:

```text
/apps/my-app/api/health
```

is rewritten/proxied to the backend as:

```text
/api/health
```

Conceptually:

```text
/apps/my-app/api/health
        ↓
reverse proxy / Vite proxy
        ↓
/api/health
        ↓
backend
```

This allows multiple applications to share one host without competing for a single public root `/api/` namespace.

## Docker

The backend is packaged as a Docker container.

The build sequence is:

```text
npm install
    ↓
npm run generate:schemas
    ↓
TypeScript compilation
    ↓
dist/
```

Production executes:

```text
node dist/server.js
```

When the backend should only be reachable through a reverse proxy, bind it to loopback:

```bash
docker run -d \
  --name my-app-backend \
  --restart unless-stopped \
  -p 127.0.0.1:3002:3002 \
  --env-file .env \
  my-app-backend
```

`EXPOSE 3002` documents the container port; it does not itself publish the port publicly.

## Production Reverse Proxy

A typical deployment is:

```text
Browser
   |
   v
HTTPS / Reverse Proxy
   |
   |-- /apps/my-app/*       → static frontend
   |
   `-- /apps/my-app/api/*   → backend /api/*
```

Use an application-specific prefix for each application sharing the host.

## Environment Example

Backend:

```env
PORT=3002
LOG_LEVEL=none
```

Frontend:

```env
VITE_LOG_LEVEL=none
```

Add application-specific backend secrets as needed. Do not commit production secrets to source control.

Do not use `VITE_*` variables for secrets.

## Creating a New Application

Copy the template, run `IMPORTANT_RUN_FIRST.bat` once from the project root, and then replace:

1. application name and description
2. deployment path
3. example `items` service
4. example API routes
5. Swagger paths
6. schema-generator target interfaces
7. generic frontend tab contents

Normally retain:

- application header/card structure
- backend health/status card
- reusable `ErrorMessage`
- frontend API client
- frontend logger
- backend logger and `/api` request middleware
- `none | summary | verbose` logging levels
- default logging level of `none`
- thin route/service separation
- `/api/health`
- `/api/docs`
- generated OpenAPI schema workflow
- Docker structure
- reverse-proxy pattern
