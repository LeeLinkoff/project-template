# Generic Backend Template

Reusable Express + TypeScript backend with:

- thin HTTP routing in `server.ts`
- business logic in `services/`
- `/api/health`
- Swagger UI at `/api/docs`
- example REST endpoints under `/api/items`
- reusable OpenAPI schemas

## Structure

```text
src/
  server.ts
  swagger-spec.ts
  schemas.generated.ts
  services/
    items.ts
```

Replace `services/items.ts` and the `/api/items` routes with application-specific functionality while preserving the same route → service pattern.

## Run

```bash
npm install
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
