# Generic React App Template

Reusable frontend shell extracted from the existing React/Vite card-and-tabs pattern.

## Structure

- `src/App.jsx` — application composition and app-level identity
- `src/App.css` — reusable light theme and card/tab/error styling
- `src/main.jsx` — React entry point
- `src/api/client.js` — single frontend API boundary; includes `/api/health`
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
