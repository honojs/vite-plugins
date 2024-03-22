---
"@hono/vite-dev-server": minor
---

Added `.mf` to `ignoreWatching` in `vite-plugin` to fix unnecessary server reloads on file changes. This update prevents the Vite server from restarting when `.mf` files are modified, improving development experience.
