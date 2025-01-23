---
'@hono/vite-build': minor
---

Added a new Netlify Functions build adapter.

This adapter can be imported from `@hono/vite-build/netlify-functions` and will
compile your Hono app to comply with the requirements of the Netlify Functions
runtime.

* The default export will have the `hono/netlify` adapter applied to it.
* A `config` object will be exported, setting the function path to `'/*'` and
  `preferStatic` to `true`.

Please note, this is for the Netlify Functions runtime, not the Netlify Edge
Functions runtime.

Example:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import devServer from "@hono/vite-dev-server";
import build from "@hono/vite-build/netlify-functions";

export default defineConfig({
  plugins: [
    devServer({
      entry: "./src/index.ts",
    }),
    build({
      entry: "./src/index.ts",
      output: "functions/server/index.js"
    })
  ],
});
```

If you also have a `public/publish` directory for your assets that should be
published to the corresponding Netlify site, then after running a build, you
would end up with a directory structure like:

```
dist/
  functions/
    server/
      index.js
  publish/
    robots.txt
    ....
```

then you can use a netlify.toml that looks like:

```toml
# https://ntl.fyi/file-based-build-config
[build]
command = "vite build"
functions = "dist/functions"
publish = "dist/publish"
```
