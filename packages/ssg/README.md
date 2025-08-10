# @hono/vite-ssg

`@hono/vite-ssg` is a Vite plugin to generate a static site from your Hono application.

## Usage

### Installation

You can install `vite` and `@hono/vite-ssg` via npm.

```plain
npm i -D vite @hono/vite-ssg
```

Or you can install them with Bun.

```plain
bun add vite @hono/vite-ssg
```

### Settings

Add `"type": "module"` to your `package.json`. Then, create `vite.config.ts` and edit it.

```ts
import { defineConfig } from 'vite'
import ssg from '@hono/vite-ssg'

export default defineConfig({
  plugins: [ssg()],
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
type SSGOptions = {
  entry?: string
  /**
   * Hono SSG plugins to use.
   * These are not Vite plugins, but plugins for Hono's static site generation.
   * @see https://hono.dev/docs/helpers/ssg#plugins
   */
  plugins?: SSGPlugin[]
}
```

Default values:

```ts
const defaultOptions = {
  entry: './src/index.tsx',
  plugins: [],
}
```

## Authors

- Yusuke Wada <https://github.com/yusukebe>

## License

MIT
