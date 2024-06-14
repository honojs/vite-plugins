# @hono/vite-netlify

`@hono/vite-netlify` is a Vite plugin to build your Hono application for Bun.

## Usage

### Installation

You can install `vite` and `@hono/vite-netlify` via npm.

```plain
npm i -D vite @hono/vite-netlify
```

Or you can install them with Bun.

```plain
bun add vite @hono/vite-netlify
```

### Settings

Add `"type": "module"` to your `package.json`. Then, create `vite.config.ts` and edit it.

```ts
import { defineConfig } from 'vite'
import pages from '@hono/vite-netlify/functions'
// or: import pages from '@hono/vite-netlify/edge-functions'

export default defineConfig({
  plugins: [pages()],
})
```

### Build

Just run `vite build`.

```text
npm exec vite build
```

Or

```text
bunx --bun vite build
```

### Deploy to Netlify

Run the `netlify` command.

```text
netlify deploy --prod
```

## Options

The options are below.

```ts
type NetlifyOptions = {
  entry?: string | string[]
  outputDir?: string
  external?: string[]
  minify?: boolean
  emptyOutDir?: boolean
}
```

Default values:

```ts
export const defaultOptions = {
  entry: ['./src/index.tsx', './app/server.ts'],
  outputDir: './dist',
  external: [],
  minify: true,
  emptyOutDir: false,
}
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

```text
vite build --mode client && vite build
```

## Authors

- Clément Songis <https://github.com/chtibizoux>

## License

MIT
