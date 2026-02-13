---
'@hono/vite-build': patch
---

Fix Bun adapter build output to preserve an entry's `websocket` handler in the generated default export.
This prevents Bun runtime WebSocket upgrade failures when apps export `{ fetch, websocket }`.
