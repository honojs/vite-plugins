# @hono/vite-build

## 1.3.0

### Minor Changes

- [#218](https://github.com/honojs/vite-plugins/pull/218) [`65e2f768a26d0665aaa05f60abf36bb66a6b6fa9`](https://github.com/honojs/vite-plugins/commit/65e2f768a26d0665aaa05f60abf36bb66a6b6fa9) Thanks [@chadxz](https://github.com/chadxz)! - Added a new Netlify Functions build adapter.

  This adapter can be imported from `@hono/vite-build/netlify-functions` and will
  compile your Hono app to comply with the requirements of the Netlify Functions
  runtime.

  - The default export will have the `hono/netlify` adapter applied to it.
  - A `config` object will be exported, setting the function path to `'/*'` and
    `preferStatic` to `true`.

  Please note, this is for the Netlify Functions runtime, not the Netlify Edge
  Functions runtime.

  Example:

  ```ts
  // vite.config.ts
  import { defineConfig } from 'vite'
  import devServer from '@hono/vite-dev-server'
  import build from '@hono/vite-build/netlify-functions'

  export default defineConfig({
    plugins: [
      devServer({
        entry: './src/index.ts',
      }),
      build({
        entry: './src/index.ts',
        output: 'functions/server/index.js',
      }),
    ],
  })
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

## 1.2.1

### Patch Changes

- [#204](https://github.com/honojs/vite-plugins/pull/204) [`adcdd9ad7a3c7ef6a828dfa1210ba5d08eadc576`](https://github.com/honojs/vite-plugins/commit/adcdd9ad7a3c7ef6a828dfa1210ba5d08eadc576) Thanks [@jonz94](https://github.com/jonz94)! - fix(build): remove `console.log`

## 1.2.0

### Minor Changes

- [#198](https://github.com/honojs/vite-plugins/pull/198) [`f08c6586018c0da828158ec252be4d889f8c32e8`](https://github.com/honojs/vite-plugins/commit/f08c6586018c0da828158ec252be4d889f8c32e8) Thanks [@yusukebe](https://github.com/yusukebe)! - feat: Node.js adapter supports `port` option

## 1.1.1

### Patch Changes

- [#196](https://github.com/honojs/vite-plugins/pull/196) [`ead8c3255f2d7fb68084b8d30c3fbe9fcaabb3ec`](https://github.com/honojs/vite-plugins/commit/ead8c3255f2d7fb68084b8d30c3fbe9fcaabb3ec) Thanks [@yusukebe](https://github.com/yusukebe)! - fix: support latest `hono`

## 1.1.0

### Minor Changes

- [#181](https://github.com/honojs/vite-plugins/pull/181) [`fc15f718c0172f84748f8717f53abba40470baed`](https://github.com/honojs/vite-plugins/commit/fc15f718c0172f84748f8717f53abba40470baed) Thanks [@nakasyou](https://github.com/nakasyou)! - Added Deno adapter

## 1.0.0

### Major Changes

- [#177](https://github.com/honojs/vite-plugins/pull/177) [`1ceb95757f1151e9f08cebd992447fb67b470957`](https://github.com/honojs/vite-plugins/commit/1ceb95757f1151e9f08cebd992447fb67b470957) Thanks [@yusukebe](https://github.com/yusukebe)! - Initial release
