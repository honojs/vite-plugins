# @hono/vite-cloudflare-pages

`@hono/vite-cloudflare-pages` is a Vite plugin to build your Hono application for Cloudflare Pages.

## Usage

### Installation

You can install `vite` and `@hono/vite-cloudflare-pages` via npm.

```plain
npm i -D vite @hono/vite-cloudflare-pages
```

Or you can install them with Bun.

```plain
bun add vite @hono/vite-cloudflare-pages
```

### Settings

Add `"type": "module"` to your `package.json`. Then, create `vite.config.ts` and edit it.

```ts
import { defineConfig } from 'vite'
import pages from '@hono/vite-cloudflare-pages'

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

### Deploy to Cloudflare Pages

Run the `wrangler` command.

```text
wrangler pages deploy ./dist
```

## Options

The options are below.

```ts
type CloudflarePagesOptions = {
  entry?: string
  outputDir?: string
  external?: string[]
  minify?: boolean
  emptyOutDir?: boolean
}
```

Default values:

```ts
export const defaultOptions = {
  entry: '/src/index',
  outputDir: './dist',
  external: [],
  minify: true,
  emptyOutDir: true,
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
        emptyOutDir: false,
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
vite build && vite build --mode client
```

## Authors

- Yusuke Wada <https://github.com/yusukebe>

## License

MIT
