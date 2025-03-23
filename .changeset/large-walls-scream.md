---
'@hono/vite-build': minor
---

Added a new Vercel build adapter.

This adapter can be imported from `@hono/vite-build/vercel` and will compile
your Hono app to comply with the specification requirements of the Vercel Build Output API.

Please note that this adapter produces output suitable only for Vercel Serverless Functions.
It does not support the Edge Runtime, which appears to be gradually phased out in favor of Vercel's Fluid compute architecture.

The default export will have the `@hono/node-server/vercel` adapter applied to it.
