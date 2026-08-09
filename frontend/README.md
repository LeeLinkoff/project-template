# Generic React App Template

Reusable frontend shell extracted from the existing React/Vite card-and-tabs pattern.

## Structure

- `src/App.jsx` — application composition and app-level identity
- `src/App.css` — reusable light theme and card/tab/error styling
- `src/main.jsx` — React entry point
- `src/api/client.js` — single frontend API boundary; includes `/api/health`
- `src/logging/logger.js` — centralized configurable frontend logging
- `src/components/AppHeaderCard.jsx` — generic app header card
- `src/components/BackendHealthCard.jsx` — automatic health check + refresh
- `src/components/MainContentCard.jsx` — generic body card
- `src/components/GenericTabs.jsx` — two placeholder Radix tabs
- `src/components/ErrorMessage.jsx` — reusable error/details component

## Dependency

The tab component uses `@radix-ui/react-tabs`, matching the existing app pattern.

```bash
npm install @radix-ui/react-tabs
```

## API routing

Production can use same-origin `/api/*` routing. For local development, optionally set:

```env
VITE_API_BASE=http://localhost:3001
```

The health endpoint is:

```text
GET /api/health
```

## Logging

Frontend logging is centralized in:

```text
src/logging/logger.js
```

Supported levels:

```text
none
summary
verbose
```

Logging defaults to `none`. If `VITE_LOG_LEVEL` is missing or invalid, no application logging is produced.

Configure the level in the frontend Vite environment:

```env
VITE_LOG_LEVEL=none
```

To enable summary logging:

```env
VITE_LOG_LEVEL=summary
```

To enable verbose diagnostic logging:

```env
VITE_LOG_LEVEL=verbose
```

The logger exports:

```javascript
logSummary()
logVerbose()
logError()
```

- `logSummary()` writes important application events when the level is `summary` or `verbose`.
- `logVerbose()` writes additional diagnostic information only when the level is `verbose`.
- `logError()` writes diagnostic errors when the level is `summary` or `verbose`.

Frontend modules should use the centralized logger instead of scattering direct `console.log()` and `console.error()` calls throughout components and API code.

The API client is a natural place to log request results or diagnostics when needed.

Logging and user-facing error handling remain separate concerns. `ErrorMessage.jsx` displays errors to the user; `logger.js` provides diagnostic output.

Because Vite exposes `VITE_*` environment variables to browser code, never store passwords, API keys, access tokens, or other secrets in `VITE_*` variables.

