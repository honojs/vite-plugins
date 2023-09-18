# @hono/vite-dev-server

`@hono/vite-dev-server` is a Vite Plugin that provides a custom dev-server for `fetch`-based web applications like those using Hono.
You can develop your application with Vite. It's fast.

## Features

- Support any `fetch`-based applications.
- Hono applications run on.
- Fast by Vite.
- HMR.
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

```plain
npm i -D vite @hono/vite-dev-server
```

Or you can install them with Bun.

```plain
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

```plain
npm exec vite
```

Or

```plain
bunx --bun vite
```

## Options

The options are below. `WorkerOptions` imported from `miniflare` are used for Cloudflare Bindings.

```ts
import type { MiniflareOptions, WorkerOptions } from 'miniflare'

export type DevServerOptions = {
  entry?: string
  injectClientScript?: boolean
  exclude?: (string | RegExp)[]
  cf?: Partial<
    Omit<
      WorkerOptions,
      // We can ignore these properties:
      'name' | 'script' | 'scriptPath' | 'modules' | 'modulesRoot' | 'modulesRules'
    > &
      Pick<
        MiniflareOptions,
        'cachePersist' | 'd1Persist' | 'durableObjectsPersist' | 'kvPersist' | 'r2Persist'
      >
  >
}
```

Default values:

```ts
export const defaultOptions: Required<Omit<DevServerOptions, 'cf'>> = {
  entry: './src/index.ts',
  injectClientScript: true,
  exclude: ['.*.ts', '.*.tsx', '/@.+', '/node_modules/.*'],
}
```

### `injectClientScript`

If it's `true` and the response content-type is "HTML", inject the script that enables Hot-reload. default is `true`.

### `exclude`

The paths which are not served by the dev-server.

If you have static files in `public/static/*` and want to return them, exclude `/static/*` as follows:

```ts
import devServer, { defaultOptions } from '@hono/vite-dev-server'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    devServer({
      exclude: ['^/static/.*', ...defaultOptions.exclude],
    }),
  ],
})
```

## Cloudflare Bindings

You can use Cloudflare Bindings like variables, KV, D1, and others.

```ts
export default defineConfig({
  plugins: [
    devServer({
      entry: 'src/index.ts',
      cf: {
        bindings: {
          NAME: 'Hono',
        },
        kvNamespaces: ['MY_KV'],
      },
    }),
  ],
})
```

These Bindings are emulated by Miniflare in the local.

### D1

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

## Notes

### Depending on Miniflare

`@hono/vite-dev-server` depends on `miniflare` for certain platforms you may want to run on. For example, if you want to run your applications on Node.js, the `miniflare` is not needed. However, it's necessary for Cloudflare Workers/Pages, which are important platforms for Hono. And `miniflare` is needed just for development; it will not be bundled for production.

### `cf` option with Bun

If properties are set in the `cf` option and it's running on Bun, an error will be thrown.

## Authors

- Yusuke Wada <https://github.com/yusukebe>

## License

MIT
