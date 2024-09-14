# @hono/vite-build

`@hono/vite-build` is a set of Vite plugins for building Hono applications with Vite. It supports multiple runtimes and platforms, allowing you to build a project that includes JavaScript files for these platforms from a Hono app.

Here are the modules included:

- `@hono/vite-build/base`
- `@hono/vite-build/cloudflare-pages`
- `@hono/vite-build/cloudflare-workers`
- `@hono/vite-build/bun`
- `@hono/vite-build/node`

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

export default defineConfig({
  plugins: [
    build({
      // Defaults are `src/index.ts`,`./src/index.tsx`,`./app/server.ts`
      entry: './src/index.tsx',
    }),
  ],
})
```

### Build

Just run `vite build`.

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
}
```

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

`public/static`:

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
      plugins: [pages()],
    }
  }
})
```

The build command:

```bash
vite build --mode client && vite build
```

## Authors

- Yusuke Wada <https://github.com/yusukebe>

## License

MIT
