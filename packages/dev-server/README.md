# @hono/vite-dev-server

`@hono/vite-dev-server` is a Vite Plugin that provides a custom dev-server for `fetch`-based web applications like those using Hono. You can develop your application with Vite. It's fast.

## Features

- Support any `fetch`-based applications.
- Hono applications run on.
- Fast by Vite.
- HMR.
- Supporting Cloudflare Bindings.

## Supported applications

You can run any application on `@hono/vite-dev-server` that uses `fetch` and is built with Web Standard APIs. The minimal application is the following.

```ts
export default {
  fetch(_request: Request) {
    return new Response('Hello Vite!')
  },
}
```

This code can also run on Cloudflare Workers or Bun. And if you change the entry point, you can run on Deno, Vercel, Lagon, and other platforms.

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

### Settings

Create `vite.config.ts` and edit it.

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

## Options

The options are below. `WorkerOptions` imported from `miniflare` are used for Cloudflare Bindings.

```ts
import type { WorkerOptions } from 'miniflare'

export type DevServerOptions = {
  entry?: string
  injectClientScript?: boolean
  cf?: Partial<
    Omit<
      WorkerOptions,
      'name' | 'script' | 'scriptPath' | 'modules' | 'modulesRoot' | 'modulesRules'
    >
  >
}
```

### `injectClientScript`

If it's `true` and the response content-type is "HTML", inject the script that enables Hot-reload. default is `true`.

## Cloudflare Bindings

You can use Cloudflare Bindings like variables, KV, D1, and others.

```ts
export default defineConfig({
  plugins: [
    devServer({
      entry: './test/mock/worker.ts',
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

## Notes

### Depending on Miniflare

`@hono/vite-dev-server` depends on `miniflare` for certain platforms you may want to run on. For example, if you want to run your applications on Node.js, the `miniflare` is not needed. However, it's necessary for Cloudflare Workers/Pages, which are important platforms for Hono. And `miniflare` is needed just for development; it will not be bundled for production. So we allow including `miniflare` in `@hono/vite-dev-server`.

## Authors

- Yusuke Wada <https://github.com/yusukebe>

## License

MIT
