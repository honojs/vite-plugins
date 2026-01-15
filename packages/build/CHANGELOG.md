# @hono/vite-build

## 1.9.1

### Patch Changes

- [#330](https://github.com/honojs/vite-plugins/pull/330) [`11107bc013ac40c891b4a57d0ef718d822b1fa2c`](https://github.com/honojs/vite-plugins/commit/11107bc013ac40c891b4a57d0ef718d822b1fa2c) Thanks [@ryuapp](https://github.com/ryuapp)! - Add vite-plugin keyword for [Vite plugin registry](https://registry.vite.dev/)

## 1.9.0

### Minor Changes

- [#328](https://github.com/honojs/vite-plugins/pull/328) [`3e9010da1687c46e610a5ea9ec7a80c9be57684a`](https://github.com/honojs/vite-plugins/commit/3e9010da1687c46e610a5ea9ec7a80c9be57684a) Thanks [@yusukebe](https://github.com/yusukebe)! - feat: add `ssrTarget` option

## 1.8.0

### Minor Changes

- [#315](https://github.com/honojs/vite-plugins/pull/315) [`d9ecb01ac8220d85c539081b139e4117b53ba711`](https://github.com/honojs/vite-plugins/commit/d9ecb01ac8220d85c539081b139e4117b53ba711) Thanks [@chadxz](https://github.com/chadxz)! - Added `shutdownTimeoutMs` option to the Node adapter for graceful shutdown on SIGINT/SIGTERM signals. Set to a timeout in milliseconds to enable graceful shutdown, or 0 to wait indefinitely for connections to close.

## 1.7.0

### Minor Changes

- [#279](https://github.com/honojs/vite-plugins/pull/279) [`b45925cf08f82d607f850191589ff154d0c1ea5f`](https://github.com/honojs/vite-plugins/commit/b45925cf08f82d607f850191589ff154d0c1ea5f) Thanks [@yusukebe](https://github.com/yusukebe)! - feat: add `preset` option

## 1.6.2

### Patch Changes

- [#266](https://github.com/honojs/vite-plugins/pull/266) [`7e51cc7f29d0d64dc4bd9c27e0f6c5491ccba5c8`](https://github.com/honojs/vite-plugins/commit/7e51cc7f29d0d64dc4bd9c27e0f6c5491ccba5c8) Thanks [@yusukebe](https://github.com/yusukebe)! - fix: fix the option types of Cloudflare Workers adapter

## 1.6.1

### Patch Changes

- [#261](https://github.com/honojs/vite-plugins/pull/261) [`c116701a2423eb9882de6559223304b66305a281`](https://github.com/honojs/vite-plugins/commit/c116701a2423eb9882de6559223304b66305a281) Thanks [@yusukebe](https://github.com/yusukebe)! - fix: correct `CloudflareWorkersBuildOptions` type

## 1.6.0

### Minor Changes

- [#254](https://github.com/honojs/vite-plugins/pull/254) [`ee00f8b93a480ab332245c6d661b8001f24028e2`](https://github.com/honojs/vite-plugins/commit/ee00f8b93a480ab332245c6d661b8001f24028e2) Thanks [@yusukebe](https://github.com/yusukebe)! - feat: export `defaultOptions` from Cloudflare Workers adpater

## 1.5.0

### Minor Changes

- [#247](https://github.com/honojs/vite-plugins/pull/247) [`e7f58050840cf2f6a1ec446e3e4e89b0b0a85014`](https://github.com/honojs/vite-plugins/commit/e7f58050840cf2f6a1ec446e3e4e89b0b0a85014) Thanks [@toga4](https://github.com/toga4)! - feat(build): support non-fetch handlers for Cloudflare Workers

## 1.4.0

### Minor Changes

- [#241](https://github.com/honojs/vite-plugins/pull/241) [`314c66da2b656d4705c4d0636cd1623b643dbd61`](https://github.com/honojs/vite-plugins/commit/314c66da2b656d4705c4d0636cd1623b643dbd61) Thanks [@justblender](https://github.com/justblender)! - Added a new Vercel build adapter.

  This adapter can be imported from `@hono/vite-build/vercel` and will compile
  your Hono app to comply with the specification requirements of the Vercel Build Output API.

  Please note that this adapter produces output suitable only for Vercel Serverless Functions.
  It does not support the Edge Runtime, which appears to be gradually phased out in favor of Vercel's Fluid compute architecture.

  The default export will have the `@hono/node-server/vercel` adapter applied to it.

### Patch Changes

- [#244](https://github.com/honojs/vite-plugins/pull/244) [`2d8d6d202a106de6049febc524c29ec24f6911b9`](https://github.com/honojs/vite-plugins/commit/2d8d6d202a106de6049febc524c29ec24f6911b9) Thanks [@yusukebe](https://github.com/yusukebe)! - fix: enable `staticPaths` option

## 1.3.1

### Patch Changes

- [#242](https://github.com/honojs/vite-plugins/pull/242) [`88ca94493ebb39cafe0d42bb741cce870ef58c68`](https://github.com/honojs/vite-plugins/commit/88ca94493ebb39cafe0d42bb741cce870ef58c68) Thanks [@yusukebe](https://github.com/yusukebe)! - fix: support `fetch` export

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
