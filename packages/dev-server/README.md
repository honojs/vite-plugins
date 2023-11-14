# @hono/vite-dev-server

`@hono/vite-dev-server` is a Vite Plugin that provides a custom dev-server for `fetch`-based web applications like those using Hono.
You can develop your application with Vite. It's fast.

## Features

- Support any `fetch`-based applications.
- Hono applications run on.
- Fast by Vite.
- HMR (Only for the Client-side. [Currently, Vite doesn't support HMR for SSR](https://github.com/vitejs/vite/issues/7887)).
- Supporting Cloudflare Bindings.
- Also runs on Bun.

## Demo

https://github.com/honojs/vite-plugins/assets/10682/a93ee4c5-2e1a-4b17-8bb2-64f955f2f0b0

## Supported applications

You can run any application on `@hono/vite-dev-server` that uses `fetch` and is built with Web Standard APIs. The minimal application is the following.

```ts
export default {
  fetch(_request: Request) {
    return new Response('Hello Vite!')
  },
}
```

This code can also run on Cloudflare Workers or Bun.
And if you change the entry point, you can run on Deno, Vercel, Lagon, and other platforms.

Hono is designed for `fetch`-based application like this.

```ts
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => c.text('Hello Vite!'))

export default app
```

So, any Hono application will run on `@hono/vite-dev-server`.

## Usage

### Installation

You can install `vite` and `@hono/vite-dev-server` via npm.

```text
npm i -D vite @hono/vite-dev-server
```

Or you can install them with Bun.

```text
bun add vite @hono/vite-dev-server
```

### Settings

Add `"type": "module"` to your `package.json`. Then, create `vite.config.ts` and edit it.

```ts
import { defineConfig } from 'vite'
import devServer from '@hono/vite-dev-server'

export default defineConfig({
  plugins: [
    devServer({
      entry: 'src/index.ts', // The file path of your application.
    }),
  ],
})
```

### Development

Just run `vite`.

```text
npm exec vite
```

Or

```text
bunx --bun vite
```

## Options

The options are below. `WorkerOptions` imported from `miniflare` are used for Cloudflare Bindings.

```ts
export type DevServerOptions = {
  entry?: string
  injectClientScript?: boolean
  exclude?: (string | RegExp)[]
  env?: Env | EnvFunc
}
```

Default values:

```ts
export const defaultOptions: Required<Omit<DevServerOptions, 'cf'>> = {
  entry: './src/index.ts',
  injectClientScript: true,
  exclude: [
    /.*\.ts$/,
    /.*\.tsx$/,
    /^\/@.+$/,
    /^\/favicon\.ico$/,
    /^\/static\/.+/,
    /^\/node_modules\/.*/,
  ],
}
```

### `injectClientScript`

If it's `true` and the response content-type is "HTML", inject the script that enables Hot-reload. default is `true`.

### `exclude`

The paths which are not served by the dev-server.

If you have static files in `public/assets/*` and want to return them, exclude `/assets/*` as follows:

```ts
import devServer, { defaultOptions } from '@hono/vite-dev-server'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    devServer({
      exclude: ['/assets/.*', ...defaultOptions.exclude],
    }),
  ],
})
```

### `env`

You can pass `ENV` variables to your application by setting the `env` option.
`ENV` values can be accessed using `c.env` in your Hono application.

Presets are available to define the `ENV`.

## `ENV` presets

### Cloudflare Pages

You can use Cloudflare Pages `ENV` presets, which allow you to access bindings such as variables, KV, D1, and others.

```ts
import { getEnv } from '@hono/vite-dev-server/cloudflare-pages'

export default defineConfig({
  plugins: [
    devServer({
      env: getEnv({
        bindings: {
          NAME: 'Hono',
        },
        kvNamespaces: ['MY_KV'],
      }),
    }),
  ],
})
```

These Bindings are emulated by Miniflare in the local.

#### D1

When using D1, your app will read `.mf/d1/DB/db.sqlite` which is generated automatically with the following configuration:

```ts
export default defineConfig({
  plugins: [
    devServer({
      cf: {
        d1Databases: ['DB'],
        d1Persist: true,
      },
    }),
  ],
})
```

## Client-side

You can write client-side scripts and import them into your application using Vite's features.
If `/src/client.ts` is the entry point, simply write it in the `script` tag.
Additionally, `import.meta.env.PROD` is useful for detecting whether it's running on a dev server or in the build phase.

```tsx
app.get('/', (c) => {
  return c.html(
    <html>
      <head>
        {import.meta.env.PROD ? (
          <>
            <script type='module' src='/static/client.js'></script>
          </>
        ) : (
          <>
            <script type='module' src='/src/client.ts'></script>
          </>
        )}
      </head>
      <body>
        <h1>Hello</h1>
      </body>
    </html>
  )
})
```

In order to build the script properly, you can use the example config file `vite.config.ts` as shown below.

```ts
import { defineConfig } from 'vite'
import devServer from '@hono/vite-dev-server'
import pages from '@hono/vite-cloudflare-pages'

export default defineConfig(({ mode }) => {
  if (mode === 'client') {
    return {
      build: {
        lib: {
          entry: './src/client.ts',
          formats: ['es'],
          fileName: 'client',
          name: 'client',
        },
        rollupOptions: {
          output: {
            dir: './dist/static',
          },
        },
        emptyOutDir: false,
        copyPublicDir: false,
      },
    }
  } else {
    return {
      plugins: [
        pages(),
        devServer({
          entry: 'src/index.tsx',
        }),
      ],
    }
  }
})
```

You can run the following command to build the client script.

```text
vite build --mode client
```

## Authors

- Yusuke Wada <https://github.com/yusukebe>

## License

MIT
