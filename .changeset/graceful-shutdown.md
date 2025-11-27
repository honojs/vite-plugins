---
"@hono/vite-build": minor
---

Added `shutdownTimeoutMs` option to the Node adapter for graceful shutdown on SIGINT/SIGTERM signals. Set to a timeout in milliseconds to enable graceful shutdown, or 0 to wait indefinitely for connections to close.
