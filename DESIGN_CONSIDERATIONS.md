# Design Considerations

This document records the architectural decisions embodied in the generic project template. It is intentionally application-neutral. When a real application is created from the template, update or replace these sections so they describe the actual application's requirements, constraints, and tradeoffs rather than preserving template assumptions that no longer apply.

## Template philosophy: establish a working baseline first

The template provides a small but functioning full-stack baseline before application-specific business logic is introduced. The intent is to make infrastructure, routing, validation, logging, API documentation, database connectivity, and build behavior independently testable before domain complexity is added.

The baseline includes:

1. An Express + TypeScript backend that compiles under `strict: true`.
2. Thin HTTP routers under `src/routes/` and application logic under `src/services/`.
3. A system health endpoint and Swagger/OpenAPI documentation.
4. Example `/api/items` endpoints demonstrating a basic resource flow and a simple one-to-many database starting point.
5. Zod runtime validation for incoming request data.
6. Centralized error handling and configurable request logging.
7. A PostgreSQL connection layer and setup/seed scripts that can be used when the application needs a database.
8. A thin React/Vite frontend that defaults to JavaScript and can be expanded or converted to TypeScript when the application's client-side complexity justifies it.
9. Docker, CI/CD, git-hook, and VPS deployment scaffolding that must be reviewed and customized for the application and target environment before production use.

The principle is simple: start from a known-working structure, then change the parts that are application-specific.

## First-run project initialization

The repository root includes `IMPORTANT_RUN_FIRST.bat` for the one-time initialization of a new project created from this template. Run it from the project root immediately after copying/creating the project from the template.

The script deliberately does only dependency installation:

1. Enters `backend/` and runs `npm install`.
2. Stops with an error if backend dependency installation fails.
3. Enters `frontend/` and runs `npm install`.
4. Stops with an error if frontend dependency installation fails.
5. Reports that project setup is complete when both installations succeed.

It is not a normal application startup script and does not need to be run before every development session. Run it again only when dependencies need to be reinstalled. When a real application is built from this template, update the script and this documentation if first-run initialization gains additional requirements such as environment-file creation, generated assets, database initialization, or other application-specific setup.

## Backend language: TypeScript

The backend uses TypeScript as its only source language and compiles to JavaScript in `dist/`. Production runs the compiled JavaScript, not the `.ts` source.

The backend uses:

- `strict: true`
- `module: NodeNext`
- `moduleResolution: NodeNext`
- explicit service interfaces for API/domain contracts
- generated OpenAPI component schemas derived from selected exported TypeScript interfaces

TypeScript is appropriate here because the backend is the primary location for business rules, service contracts, persistence logic, external integrations, and API response shapes. Compile-time checking provides useful protection as those responsibilities grow.

### NodeNext relative-import convention

The backend follows native Node ESM semantics. Relative imports in TypeScript source use the runtime `.js` extension even though the source file itself is `.ts`.

Example:

```typescript
// Source file on disk: routes/items_router.ts
import itemsRouter from "./routes/items_router.js";
```

TypeScript resolves the import to the TypeScript source while the emitted JavaScript retains the `.js` path required by Node. Package imports such as `express` and `pg` remain bare package specifiers and do not use file extensions.

This convention is intentional and should be kept consistent throughout the backend unless the application's module/build strategy is deliberately changed.

## Thin routing layer

`server.ts` is intentionally limited to application wiring:

- Express initialization
- global middleware
- router mounting
- central error-handler registration
- server startup

Resource-specific HTTP behavior belongs in `routes/`, while application behavior belongs in `services/`. This avoids turning `server.ts` into a monolithic controller and makes services easier to test or reuse independently of Express.

The template's example flow is:

```text
request
  -> route
  -> validation/auth middleware as needed
  -> service
  -> database/client as needed
  -> service result
  -> HTTP response
```

When the template becomes a real application, replace the example Items resource with domain-specific routes, schemas, and services while preserving the separation where it remains useful.

## Runtime validation and static typing solve different problems

TypeScript checks code during development/build time. It does not prove that incoming HTTP payloads contain valid runtime data. The template therefore uses Zod schemas for request validation and TypeScript interfaces for compile-time contracts.

The two should remain aligned, but they serve different purposes:

- TypeScript: developer/compiler contract.
- Zod: runtime boundary validation.

Application-specific validation should be added as the real request contracts become known.

## Centralized error handling

Routes should not independently shape error responses. Errors flow to `middleware/errors.ts`, where known application error types are mapped to appropriate HTTP status codes.

The template distinguishes known failures such as not-found, validation, and external-API errors from unexpected failures. Unexpected failures return a generic `500 Internal server error` response rather than exposing internal implementation details to API callers.

Actual errors are written to the console regardless of `LOG_LEVEL`. Routine request/diagnostic logging is separately controlled by the logging configuration.

As the application grows, add application-specific error classes and mappings rather than scattering status-code decisions throughout route handlers.

## Logging: optional diagnostics, visible failures

Backend request logging supports:

```text
none
summary
verbose
```

`LOG_LEVEL=none` suppresses routine request/diagnostic logging. It does not suppress startup information or actual errors. This keeps a quiet default without making failures invisible.

Startup output always identifies the listening port, Swagger URL, and active logging level. Actual application failures use `console.error()` through the central error path so they remain visible even when routine logging is disabled.

## Health endpoint: service status plus dependency diagnostics

`GET /health` is intentionally usable before every optional dependency is configured.

The current health response reports:

- whether the backend itself is responding (`ok`)
- service name
- timestamp
- database connectivity/configuration status
- outbound internet connectivity and observed public IP when available

The database is optional at the template stage. If `DATABASE_URL` is not set, health reports:

```json
{
  "connected": false,
  "error": "Database not configured"
}
```

rather than surfacing a low-level PostgreSQL authentication error.

The outbound-internet check is also diagnostic. A dependency check catches its own failure so `/health` can still describe what is wrong instead of failing to respond at all.

A real application should revisit the meaning of `ok`. If a configured database, queue, external API, or other dependency becomes mandatory for the application to function, the application's readiness semantics should reflect that requirement.

## Database: available, not mandatory for the template itself

The template includes PostgreSQL support (`pg`), a shared pool, setup SQL, seed SQL, and example Items persistence so a database-backed application has a concrete starting point.

That does not mean every application created from the template must use PostgreSQL. At template startup, `DATABASE_URL` may be absent and the backend can still boot and expose health/docs.

When creating a real application:

- keep PostgreSQL if it fits the requirements;
- replace it with another persistence mechanism if appropriate; or
- remove the database layer entirely if the application does not need persistence.

The example schema and seed data are scaffolding, not a domain model that should survive unchanged into unrelated applications.

## OpenAPI schema generation: generated contracts, hand-maintained paths

Swagger/OpenAPI is included as part of the baseline rather than added after the API is built.

Reusable component schemas are generated at build time from exported TypeScript interfaces tagged with `@openapi`. The current example contracts include the Items API and health response. `scripts/generate-openapi-schemas.ts` writes `src/schemas.generated.ts`; that generated file is a build artifact and should not be hand-maintained.

The OpenAPI `paths` section remains explicit in `swagger-spec.ts`. Express itself does not contain enough metadata to infer every route, request body, response status, and description without adopting a more opinionated controller/decorator framework.

This gives the template a practical split:

```text
TypeScript interfaces tagged @openapi
        -> generated components.schemas

Express routes/API behavior
        -> hand-maintained paths in swagger-spec.ts
```

When application-specific endpoints replace the Items example, update the OpenAPI paths and tag the actual reusable request/response interfaces that should appear in Swagger.

The generator intentionally tolerates a project with no `@openapi` interfaces and can emit an empty schema module. That makes removing the example API safe. A real API, however, should document the contracts it actually exposes.

## Frontend: JavaScript by default, TypeScript when justified

The frontend intentionally defaults to JavaScript while the backend defaults to TypeScript. This is not an assertion that one language is universally better.

The template assumes a thin client primarily responsible for presentation, user interaction, basic UI state, API calls, and displaying results/errors. Under that assumption, the additional static type layer on the client may provide less incremental value than it would in a large stateful frontend with substantial domain logic.

If an application develops complex client-side state, shared domain models, significant business rules, many contributors, or refactoring risk, converting the frontend to TypeScript can be appropriate. The choice should follow the application's actual complexity rather than being inherited blindly from the template.

## External HTTP client

`clients/http-client.ts` provides a generic boundary for outbound HTTP calls, including timeout/error behavior. `services/system.ts` uses it for the outbound-connectivity health check.

Application-specific external integrations should generally build on a client/service separation:

- client: how to communicate with the external system;
- service: what the application does with the result.

This keeps transport mechanics from becoming business logic.

## Authentication scaffold

`middleware/auth.ts` is scaffolding. The template does not assume a particular identity provider, token format, session strategy, or authorization model because those decisions depend on the application.

Authentication and authorization must be designed for the actual application before protected or sensitive functionality is deployed. Do not interpret the presence of the middleware file as production-ready security.

## Docker and deployment scaffolding

The backend Dockerfile provides a repeatable Node build/runtime environment and compiles the TypeScript backend before running `dist/server.js`.

The repository also contains GitHub Actions and VPS/Apache deployment scaffolding derived from an existing deployment pattern. Those files are **templates themselves** and must be reviewed before use. Application names, image/container names, ports, public paths, required secrets, health URLs, Apache paths, and environment variables must be changed to match the real application and hosting environment.

Do not assume the supplied VPS/Apache values are universally correct or production-ready merely because the generic application builds locally.

## CI/CD and pre-commit checks

The repository includes CI, deployment, local `act` helpers, and git-hook tooling as a starting point for early verification. The intent is to catch build/workflow problems before application-specific complexity is layered on top.

When the template becomes a real project, update the checks so they exercise the real endpoints and dependencies. Any workflow assertions inherited from a previous application or placeholder route must be removed or replaced rather than treated as authoritative.

## What should change when this becomes a real application

This document should evolve with the code. At minimum, revisit:

- application/domain purpose;
- actual routes and service boundaries;
- persistence choice and required dependencies;
- health/readiness semantics;
- authentication and authorization;
- external integrations and secrets;
- frontend JavaScript vs. TypeScript decision;
- deployment target, ports, paths, container names, and reverse proxy;
- CORS policy;
- OpenAPI paths and tagged schemas;
- logging/observability requirements;
- CI/CD tests and deployment gates;
- scalability, availability, backup, and security requirements.

The template is a starting architecture, not a requirement to preserve every initial decision.
