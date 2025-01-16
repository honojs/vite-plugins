---
'@hono/vite-dev-server': patch
---

dev-server plugin getRequestListener fetchCallback now always returns Promise<Response> instead of sometimes returning Promise<null>
