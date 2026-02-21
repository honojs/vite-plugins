---
'@hono/vite-build': patch
---

Fix static path discovery when `publicDir` does not exist.
Split shared `try/catch` so a missing `publicDir` no longer prevents `outDir` from being read, which caused `serveStatic` middleware to not be injected.
