# @hono/vite-build

`@hono/vite-build` is a set of Vite plugins for building Hono applications with Vite. It supports multiple runtimes and platforms, allowing you to build a project that includes JavaScript files for these platforms from a Hono app.

Here are the modules included:

- `@hono/vite-build/base`
- `@hono/vite-build/cloudflare-pages`
- `@hono/vite-build/cloudflare-workers`
- `@hono/vite-build/bun`
- `@hono/vite-build/node`
- `@hono/vite-build/netlify-functions`
- `@hono/vite-build/vercel`

## Usage

### Install

You can install `vite` and `@hono/vite-build` via the npm.

```bash
npm i -D vite @hono/vite-build
```

Or you can install them with Bun.

```bash
bun add -D vite @hono/vite-build
```

### Settings

Add `"type": "module"` to your package.json. Then, create `vite.config.ts` and edit it. The following is for Bun.

```ts
import { defineConfig } from 'vite'
import build from '@hono/vite-build/bun'
// import build from '@hono/vite-build/cloudflare-pages'
// import build from '@hono/vite-build/cloudflare-workers'
// import build from '@hono/vite-build/node'
// import build from '@hono/vite-build/netlify-functions'
// import build from '@hono/vite-build/vercel'

export default defineConfig({
  plugins: [
    build({
      // Defaults are `src/index.ts`,`./src/index.tsx`,`./app/server.ts`
      entry: './src/index.tsx',
      // port option is only for Node.js adapter. Default is 3000
      port: 3001,
    }),
  ],
})
```

### Build

Just run `vite build`.

```bash
npm exec vite build
```

Or

```bash
bunx --bun vite build
```

### Run

Run with the command on your runtime. For examples:

Cloudflare Pages:

```bash
wrangler pages dev ./dist
```

Bun:

```bash
cd ./dist
bun run ./index.js
```

Node.js:

```bash
cd ./dist
node ./index.js
```

## Common Options

```ts
type BuildOptions = {
  entry?: string | string[]
  output?: string
  outputDir?: string
  external?: string[]
  minify?: boolean
  emptyOutDir?: boolean
  preset?: 'hono' | 'hono/tiny' | 'hono/quick' '@hono/hono'
  preparedRouter?: { paths: string[] }
}
```

Default values:

```ts
export const defaultOptions = {
  entry: ['src/index.ts', './src/index.tsx', './app/server.ts'],
  output: 'index.js',
  outputDir: './dist',
  external: [],
  minify: true,
  emptyOutDir: false,
  staticPaths: [],
  preset: 'hono',
}
```

### Precompile routing paths

With Hono 4.9.11 or later, opt in to `PreparedRegExpRouter` by listing the paths your application registers:

```ts
import { defineConfig } from 'vite'
import build from '@hono/vite-build/cloudflare-workers'

export default defineConfig({
  plugins: [
    build({
      entry: './src/index.ts',
      preparedRouter: {
        paths: ['/', '/users/:id', '/users/:id/posts/:postId'],
      },
    }),
  ],
})
```

The plugin computes the routing matchers during the build and embeds them in the bundle. It uses the application's installed Hono for both compilation and runtime, so their internal router formats stay in sync. Application entry modules are not executed to discover routes.

The option applies to bundled ESM `RegExpRouter` instances from the installed Hono package, including those created by the default Hono preset. Each instance creates its own matcher tables on its first match. Mounted sub-app routers do not allocate those tables unless they are also queried directly. Explicit `RegExpRouter` instances still reject route and middleware registration after their first match. Existing custom routers and the `hono/tiny` and `hono/quick` presets retain their behavior. Without this option, older Hono versions remain supported.

Custom `getPath` routing keys such as `constructor`, `toString`, and `__proto__` retain ordinary wildcard matching.

Precompilation conservatively supports simple URI path segments, identifier-style parameter names, optional final parameters, and final `/*` wildcards. If the manifest contains unrecognized path syntax, custom parameter patterns, interior wildcards, or dynamic paths whose literal prefixes overlap a wildcard's prefix, the plugin emits a warning and keeps the original Hono router for that build. This preserves method-specific handlers and parameter captures when a shared prepared table cannot safely represent them. For example, `/users/:id/*` with `/users/:name` uses the original router; `/static/*` with `/users/:id` can still be precompiled.

For requests whose decoded paths contain line terminators, the router also checks the paths actually registered for that method or `ALL`. These checks use regular expressions compiled during the build, preserving ordinary method matching without including the runtime compiler.

When using several build plugin instances in one Vite build, pass the same complete path list to every instance that enables `preparedRouter`. Include the paths needed by all of their applications.

Include every registered path, including middleware, static-file hooks, sub-app paths, and their mounted paths. For example, mounting a sub-app with `/users/:id` at `/api` requires both `/users/:id` and `/api/users/:id`. Global `*` matching is added automatically. When paths are precompiled, registering an unlisted path fails when the application initializes its router.

Trailing wildcards must occupy a complete path segment, as in `/foo/*`. The build rejects `/foo*` and similar patterns because precompiled tables can otherwise skip handlers when paths belong to different HTTP methods. Disable `preparedRouter` for applications using these patterns.

For manifests eligible for precompilation, all paths must be compatible with a single regular-expression router, even when they belong to different HTTP methods or app instances. For example, `/:id` and `/:name` cannot be combined. Unsupported simple path combinations fail the build. Use the ordinary router for applications with paths that are only known at runtime. Hono must be bundled for this optimization to take effect.

## Platform specific things

### Cloudflare Pages

This plugin generates `_routes.json` automatically. The automatic generation can be overridden by creating a `public/_routes.json`. See [Create a `_routes.json` file](https://developers.cloudflare.com/pages/functions/routing/#create-a-_routesjson-file) on Cloudflare Docs for more details.

### Vercel

By default, the Vercel adapter emits a single function named `__hono` and a catch-all route.

To emit multiple functions, add the Vercel adapter multiple times in `plugins`.

```ts
import { defineConfig } from 'vite'
import build from '@hono/vite-build/vercel'

export default defineConfig({
  plugins: [
    build({
      entry: './src/server.ts',
      vercel: {
        name: 'api',
        routes: [{ src: '^/api(?:/.*)?$' }],
      },
    }),
    build({
      entry: './src/auth.ts',
      vercel: {
        name: 'auth',
        routes: [{ src: '^/auth(?:/.*)?$' }],
        function: {
          maxDuration: 30,
        },
      },
    }),
  ],
})
```

If `vercel.routes` is omitted, the adapter generates `^/<function-name>(?:/.*)?$`.
If `vercel.name` is omitted, the adapter uses `__hono`.

## Example project

`src/index.tsx`:

```tsx
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.html(
    <html>
      <head>
        <link href='/static/style.css' rel='stylesheet' />
      </head>
      <body>
        <h1>Hello!</h1>
      </body>
    </html>
  )
})

export default app
```

`public/static/style.css`:

```css
h1 {
  font-family: Arial, Helvetica, sans-serif;
}
```

The project with those file will be built to the following files with `@hono/vite-build/bun`:

```txt
dist
├── index.js
└── static
 └── style.css
```

## Build a client

If you also want to build a client-side script, you can configure it as follows.

```ts
export default defineConfig(({ mode }) => {
  if (mode === 'client') {
    return {
      build: {
        rollupOptions: {
          input: './src/client.ts',
          output: {
            dir: './dist/static',
            entryFileNames: 'client.js',
          },
        },
        copyPublicDir: false,
      },
    }
  } else {
    return {
      plugins: [build()],
    }
  }
})
```

The build command:

```bash
vite build --mode client && vite build
```

`import.meta.env.PROD` is helpful in detecting whether it is in development or production mode if you are using it on a Vite dev server.

```tsx
app.get('/', (c) => {
  return c.html(
    <html>
      <head>
        {import.meta.env.PROD ? (
          <script type='module' src='/static/client.js'></script>
        ) : (
          <script type='module' src='/src/client.ts'></script>
        )}
      </head>
      <body>Hello!</body>
    </html>
  )
})
```

## Example

You can see the example project here - [hono-vite-jsx](https://github.com/honojs/examples/tree/main/hono-vite-jsx)

## Authors

- Yusuke Wada <https://github.com/yusukebe>

## License

MIT
