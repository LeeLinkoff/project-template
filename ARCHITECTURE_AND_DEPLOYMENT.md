# Generic Project Template — Architecture and Deployment

This document describes the architecture supplied by the generic project template and the deployment scaffolding included with it. It is deliberately application-neutral.

**Important:** when a real application is created from this template, update this document to describe that application's actual architecture and deployment. Names, routes, ports, dependencies, public paths, secrets, infrastructure, and operational assumptions shown here are starting points, not permanent requirements.

# PART 1: ARCHITECTURE

## 1.1 System overview

The template is a conventional thin-client web application:

```text
Browser
  |
  v
React/Vite frontend
  |
  | HTTP/JSON
  v
Express + TypeScript backend
  |
  +--> services/
  |      |
  |      +--> db/       (optional PostgreSQL persistence)
  |      +--> clients/  (external HTTP integrations)
  |
  +--> /health          (service/dependency diagnostics)
  +--> /docs            (Swagger UI)
  +--> /api/items       (example business resource)
```

The frontend is intentionally thin. The backend owns the primary service/business boundaries and provides an example Items API that should be replaced with the real application's domain functionality.

## 1.2 Repository structure

At a high level:

```text
<project>/
├── backend/
│   ├── scripts/
│   ├── seeds/
│   ├── src/
│   │   ├── clients/
│   │   ├── db/
│   │   ├── logging/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── server.ts
│   │   ├── swagger-spec.ts
│   │   └── schemas.generated.ts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── logging/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── .github/workflows/
├── .githooks/
├── dev_scripts/
├── IMPORTANT_RUN_FIRST.bat
├── README.md
├── DESIGN_CONSIDERATIONS.md
└── ARCHITECTURE_AND_DEPLOYMENT.md
```

## 1.3 First-run setup

Immediately after creating a new project from the template, run the repository-root `IMPORTANT_RUN_FIRST.bat` once:

```bat
IMPORTANT_RUN_FIRST.bat
```

The script installs the dependencies declared by both application halves, running `npm install` first in `backend/` and then in `frontend/`. It exits with an error if either installation fails and reports completion only after both succeed.

This is a bootstrap step, not the command used to start the application. Normal development/build commands can be used after it completes, and the script does not need to be run again unless dependencies need reinstalling. When adapting the template to a real application, revise this script if that application's initial setup requires additional steps.

## 1.4 Backend architecture

The backend is Express + TypeScript. TypeScript is the source of record and is compiled to JavaScript in `dist/`.

Current compiler characteristics include:

```text
target: ES2022
module: NodeNext
moduleResolution: NodeNext
strict: true
```

Because the backend uses NodeNext/native ESM semantics, relative TypeScript imports use the runtime `.js` extension. For example, a TypeScript source file may contain:

```typescript
import systemRouter from "./routes/system_router.js";
```

while the source file on disk is `system_router.ts`. TypeScript resolves the source correctly and emits JavaScript whose import remains valid when executed by Node.

### Backend responsibilities

- **`src/server.ts`** — application wiring only: Express setup, global middleware, router mounting, error handler, and startup.
- **`src/routes/`** — HTTP routing and request/response wiring. Routes should remain thin.
- **`src/services/`** — application/service logic and TypeScript contracts.
- **`src/schemas/`** — Zod runtime-validation schemas for incoming request data.
- **`src/middleware/`** — validation, authentication scaffold, async handling, and centralized HTTP error mapping.
- **`src/db/pool.ts`** — PostgreSQL pool/connection boundary.
- **`src/clients/http-client.ts`** — generic outbound HTTP client with timeout/error handling.
- **`src/logging/logger.ts`** — configurable request/diagnostic logging.
- **`src/swagger-spec.ts`** — OpenAPI document and explicit API paths.
- **`src/schemas.generated.ts`** — generated OpenAPI component schemas; do not hand-edit.
- **`scripts/generate-openapi-schemas.ts`** — build-time schema generator.

### Request flow

The intended application flow is:

```text
HTTP request
    |
    v
route
    |
    +--> middleware (validation/auth as applicable)
    |
    v
service
    |
    +--> database and/or external client as needed
    |
    v
result
    |
    v
HTTP response
```

Thrown errors flow through `asyncHandler` to the centralized `errorHandler`, which maps known errors to HTTP responses. Unexpected failures are treated as server errors rather than being shaped independently by every route.

## 1.5 Current template endpoints

The template currently exposes:

```text
GET  /health
GET  /docs
GET  /api/items
GET  /api/items/:id
POST /api/items
```

`/health` and `/docs` are system/infrastructure routes. `/api/items` is example application functionality and is expected to be replaced or expanded in a real project.

When routes change, update both the implementation and `swagger-spec.ts` so Swagger describes the API that actually exists.

## 1.6 Health and dependency diagnostics

`GET /health` is designed to remain useful even when optional dependencies are unavailable.

It reports:

```text
ok
service
timestamp
database.connected / database.error
outboundInternet.connected / outboundInternet.ip / outboundInternet.error
```

The database is optional at the generic-template stage. If `DATABASE_URL` is absent, the health response reports `Database not configured` rather than attempting authentication with incomplete configuration.

The outbound-internet check uses the shared HTTP client and is intended to expose a common deployment problem: a service can be running while outbound traffic is blocked by container, VPC, firewall, or corporate-network policy.

A real application should decide whether each dependency is merely diagnostic or required for readiness. If a dependency becomes mandatory, update health/readiness semantics accordingly.

## 1.7 Database layer

PostgreSQL support is included as a concrete starting point, not as a requirement that every derived application use PostgreSQL.

The template includes:

```text
backend/src/db/pool.ts
backend/scripts/setup-database.sql
backend/scripts/setup-database.bat
backend/scripts/seed-database.bat
backend/seeds/001_database_seed.sql
```

The example Items service demonstrates database-backed resource access. A new application should replace the example schema, seed data, and Items queries with its own domain model.

If the application does not need a database, the database layer and related health check can be removed. If another persistence technology is selected, replace the implementation rather than preserving PostgreSQL solely because the template included it.

## 1.8 OpenAPI / Swagger

Swagger UI is available at:

```text
GET /docs
```

The OpenAPI implementation deliberately combines generated schemas with explicit paths.

Exported TypeScript interfaces tagged with `@openapi` are converted at build time into reusable OpenAPI component schemas:

```text
TypeScript interfaces
    |
    v
scripts/generate-openapi-schemas.ts
    |
    v
src/schemas.generated.ts
    |
    v
swagger-spec.ts components.schemas
```

API paths, verbs, request bodies, status codes, summaries, and descriptions remain explicitly defined in `swagger-spec.ts`.

The generator is tolerant of zero tagged interfaces and can produce an empty schema module. That is useful when the example API is removed before replacement contracts are added. Once a real API exists, tag the contracts that should appear in Swagger and keep the path definitions aligned with the real routes.

## 1.9 Logging and errors

Backend logging levels are:

```text
none
summary
verbose
```

`LOG_LEVEL=none` disables routine request/diagnostic logging. Startup information remains visible, including the listening port, Swagger URL, and selected logging level.

Actual errors are also always written to the console through the centralized error path. Logging configuration should not make application failures invisible.

Known application error types are mapped centrally. Unexpected errors return a generic server-error response so internal implementation details are not unnecessarily exposed to API callers.

## 1.10 Frontend architecture

The frontend is React + Vite and intentionally defaults to JavaScript.

Current structure includes:

- `App.jsx` — top-level UI/state composition.
- `api/client.js` — backend communication boundary.
- `components/` — reusable presentation components.
- `logging/logger.js` — frontend diagnostic logging.
- `App.css` — application styling.

The template assumes a thin client with business/domain rules primarily behind the API boundary. JavaScript is therefore the lower-complexity default. If a real application's frontend develops substantial domain logic, complex state, shared models, larger team ownership, or significant refactoring risk, TypeScript should be reconsidered.

## 1.11 Security baseline

The template is not a finished security model.

Before production use, explicitly review:

- authentication and authorization;
- CORS restrictions;
- secret storage;
- TLS/reverse-proxy configuration;
- database credentials and network exposure;
- external API credentials;
- rate limiting and abuse controls where appropriate;
- error-response information disclosure;
- dependency and container patching;
- logging/redaction requirements.

`middleware/auth.ts` is scaffolding, not proof that authentication is configured.

# PART 2: BUILD AND LOCAL DEVELOPMENT

## 2.1 Backend

From `backend/`:

```bash
npm run build
npm run dev
```

`npm run build` performs schema generation before TypeScript compilation:

```text
npm run generate:schemas && tsc
```

The order matters because `swagger-spec.ts` imports the generated schema module.

The development command uses `tsx` to run/watch the TypeScript source. Production-style execution uses the compiled output:

```bash
npm start
```

which runs:

```text
node dist/server.js
```

The backend defaults to port `3002` unless `PORT` is supplied.

## 2.2 Frontend

From `frontend/`:

```bash
npm run dev
```

Use the frontend README and `vite.config.js` as the source of truth for local API proxy/base-path behavior. Update those values when the derived application's public path or backend port changes.

## 2.3 Optional database setup

If the derived application uses the included PostgreSQL starting point, configure `DATABASE_URL` and run the supplied setup/seed scripts as appropriate.

If no database is configured, the backend can still start and `/health` will report the database as not configured.

# PART 3: DOCKER

## 3.1 Backend image

`backend/Dockerfile` provides a repeatable build/runtime environment independent of the host's installed Node environment.

The current Dockerfile:

1. installs dependencies, including build-time dev dependencies;
2. generates OpenAPI schemas;
3. compiles TypeScript;
4. starts `node dist/server.js`.

The supplied Dockerfile currently uses a Node Alpine base image and exposes the template backend port. When creating a real application, review the Node version, port, image naming, dependency-install strategy, runtime user, health check, and production hardening rather than treating the template values as permanent.

## 3.2 Container naming and ports

Use application-specific names when building and running a derived application:

```bash
docker build -t <app-name>-backend .

docker run -d \
  --name <app-name>-backend \
  --restart unless-stopped \
  -p 127.0.0.1:<host-port>:<container-port> \
  --env-file .env \
  <app-name>-backend
```

Binding to `127.0.0.1` is appropriate when a reverse proxy on the same host is intended to be the only public entry point. If the deployment architecture differs, change this deliberately.

# PART 4: CI/CD SCAFFOLDING

## 4.1 Code checks

`.github/workflows/code-checks.yml` is intended to provide early build verification for frontend and backend code.

A derived project should make sure the workflow checks the routes and artifacts that actually exist. Any inherited references to placeholder or previous-application endpoints must be updated before relying on the workflow as a meaningful quality gate.

Useful baseline checks include:

- dependency installation;
- frontend production build;
- OpenAPI schema generation;
- strict TypeScript type-check;
- backend compilation;
- compiled-server boot test;
- health response validation;
- Swagger availability;
- application-specific smoke tests.

## 4.2 Local workflow testing

The `dev_scripts/` directory includes helpers for running GitHub Actions locally with `act` and for linting workflows/git hooks.

These scripts are conveniences, not architectural requirements. Keep, modify, or remove them according to the derived project's development environment.

## 4.3 Deployment workflow

`.github/workflows/deploy-to-vps.yml` is **deployment scaffolding**, not a universal production deployment.

Before enabling it for a real application, review the entire workflow and replace all application/environment-specific values, including any inherited:

- application/container/image names;
- VPS paths;
- Apache/static-publication paths;
- backend ports;
- public health URLs;
- required and optional secrets;
- environment-file generation;
- smoke-test endpoints;
- reverse-proxy checks;
- frontend build/publication destinations.

Do not deploy the generic template workflow unchanged merely because local builds pass.

# PART 5: REVERSE PROXY / VPS DEPLOYMENT PATTERN

The included deployment material assumes one possible pattern:

```text
Internet
   |
 HTTPS
   v
Apache/reverse proxy
   |----------------------> static frontend files
   |
   +-- application API --> backend container bound to localhost
```

A derived application may use this pattern, a managed cloud platform, Kubernetes, serverless functions, a PaaS, another reverse proxy, or no container at all. The correct choice depends on the actual deployment environment.

If Apache on a shared VPS is used, give every application a unique public path and/or hostname and a unique internal port where necessary. Verify the real server's Apache layout and restart/reload procedure rather than assuming paths or commands from another host.

Example only:

```apache
<IfModule mod_proxy.c>
    ProxyPreserveHost On
    ProxyPass "/apps/<app-name>/api/" "http://127.0.0.1:<port>/api/"
    ProxyPassReverse "/apps/<app-name>/api/" "http://127.0.0.1:<port>/api/"
</IfModule>
```

This is a pattern to adapt, not a ready-to-paste universal configuration.

# PART 6: ENVIRONMENT AND SECRETS

The generic backend currently recognizes values such as:

```text
PORT
LOG_LEVEL
DATABASE_URL
```

The frontend has its own Vite environment values, which are exposed to browser code when prefixed with `VITE_`. Never place secrets in client-visible Vite variables.

As application-specific integrations are added, document each required/optional environment variable and its purpose. Do not carry secrets from the template or another application into a new repository.

A real deployment should clearly distinguish:

- required runtime configuration;
- optional feature configuration;
- secrets;
- public frontend build-time configuration;
- deployment-only credentials.

# PART 7: WHAT MUST BE UPDATED FOR A REAL APPLICATION

Before treating a project created from this template as deployable, replace template assumptions with real decisions for:

1. application name and purpose;
2. API routes and OpenAPI documentation;
3. example Items resource/schema/seed data;
4. database/persistence choice;
5. health/readiness semantics;
6. authentication and authorization;
7. CORS and other security controls;
8. external APIs and secrets;
9. frontend JavaScript vs. TypeScript decision;
10. backend/frontend ports and public base paths;
11. Docker image/container names and Node version;
12. CI smoke tests;
13. deployment target and workflow;
14. reverse-proxy/static-file configuration, if used;
15. logging, monitoring, backup, availability, and scaling requirements.

The template should make those decisions easier to implement, but it should not make them silently on behalf of an application whose requirements are not yet known.
