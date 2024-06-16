# @hono/vite-dev-server

## 0.12.2

### Patch Changes

- [#144](https://github.com/honojs/vite-plugins/pull/144) [`728099d899fab5ff81adb126fcd39e47e7f13051`](https://github.com/honojs/vite-plugins/commit/728099d899fab5ff81adb126fcd39e47e7f13051) Thanks [@yusukebe](https://github.com/yusukebe)! - fix: handler cloudflare dispose error

## 0.12.1

### Patch Changes

- [#138](https://github.com/honojs/vite-plugins/pull/138) [`6dd041a94b955331e1bff049c8b9572d7b554d06`](https://github.com/honojs/vite-plugins/commit/6dd041a94b955331e1bff049c8b9572d7b554d06) Thanks [@yusukebe](https://github.com/yusukebe)! - use `ssrLoadModule` instead of Runtime API

## 0.12.0

### Minor Changes

- [#129](https://github.com/honojs/vite-plugins/pull/129) [`b4019f0f194d95a3e3d2a56aba649614b06a0135`](https://github.com/honojs/vite-plugins/commit/b4019f0f194d95a3e3d2a56aba649614b06a0135) Thanks [@alessandrojcm](https://github.com/alessandrojcm)! - Switched to executeEntrypoint instead of ssrLoadModule

### Patch Changes

- [#130](https://github.com/honojs/vite-plugins/pull/130) [`5b728da65de4b5588de07fd3d3656cbc09bf62df`](https://github.com/honojs/vite-plugins/commit/5b728da65de4b5588de07fd3d3656cbc09bf62df) Thanks [@yusukebe](https://github.com/yusukebe)! - fix: add caches which to do nothing to cloudflare adapter

- [#127](https://github.com/honojs/vite-plugins/pull/127) [`ac6d6c4cc4089c5555ae539c7c5467779d15808a`](https://github.com/honojs/vite-plugins/commit/ac6d6c4cc4089c5555ae539c7c5467779d15808a) Thanks [@naporin0624](https://github.com/naporin0624)! - fixed typesVersions in `@hono/vite-dev-server/cloudflare`

## 0.11.1

### Patch Changes

- [#122](https://github.com/honojs/vite-plugins/pull/122) [`d58ad511026840b2c5cef17a6121e022110a20c2`](https://github.com/honojs/vite-plugins/commit/d58ad511026840b2c5cef17a6121e022110a20c2) Thanks [@yusukebe](https://github.com/yusukebe)! - fix: bump `@hono/node-server`

## 0.11.0

### Minor Changes

- [#119](https://github.com/honojs/vite-plugins/pull/119) [`7365dc477f57ad2103d026b0e9b9fcbae9c1966b`](https://github.com/honojs/vite-plugins/commit/7365dc477f57ad2103d026b0e9b9fcbae9c1966b) Thanks [@yusukebe](https://github.com/yusukebe)! - feat: supports Bun

## 0.10.0

### Minor Changes

- [#111](https://github.com/honojs/vite-plugins/pull/111) [`fcc98f92cd45df52ce34380414072d0b10e8c701`](https://github.com/honojs/vite-plugins/commit/fcc98f92cd45df52ce34380414072d0b10e8c701) Thanks [@tseijp](https://github.com/tseijp)! - Added `.mf` to `ignoreWatching` in `vite-plugin` to fix unnecessary server reloads on file changes. This update prevents the Vite server from restarting when `.mf` files are modified, improving development experience.

## 0.9.0

### Minor Changes

- [#108](https://github.com/honojs/vite-plugins/pull/108) [`939eee515adf974f7491710f003383127e9d94a1`](https://github.com/honojs/vite-plugins/commit/939eee515adf974f7491710f003383127e9d94a1) Thanks [@yusukebe](https://github.com/yusukebe)! - feat: introduce Cloudflare Adapter

## 0.8.2

### Patch Changes

- [#105](https://github.com/honojs/vite-plugins/pull/105) [`0f44e181b1391754e369a8e07354213ac59ddb75`](https://github.com/honojs/vite-plugins/commit/0f44e181b1391754e369a8e07354213ac59ddb75) Thanks [@emirotin](https://github.com/emirotin)! - Add CSS to server excludes

## 0.8.1

### Patch Changes

- [#102](https://github.com/honojs/vite-plugins/pull/102) [`95564fe656d7e6ce590e7f9adf585837c0fe3736`](https://github.com/honojs/vite-plugins/commit/95564fe656d7e6ce590e7f9adf585837c0fe3736) Thanks [@yusukebe](https://github.com/yusukebe)! - fix: add `/\?t\=\d+$/` to `exclude`

- [#100](https://github.com/honojs/vite-plugins/pull/100) [`10b50e61a5d5586173705fb5f3fb37480b23e0d5`](https://github.com/honojs/vite-plugins/commit/10b50e61a5d5586173705fb5f3fb37480b23e0d5) Thanks [@yusukebe](https://github.com/yusukebe)! - fix: bump `@hono/node-server`

## 0.8.0

### Minor Changes

- [#96](https://github.com/honojs/vite-plugins/pull/96) [`88fe05f7a2e56f87e3ff12066104dcaee32372c5`](https://github.com/honojs/vite-plugins/commit/88fe05f7a2e56f87e3ff12066104dcaee32372c5) Thanks [@yusukebe](https://github.com/yusukebe)! - feat: add `ignoreWatching` option

- [`6897fd999340a462935213a14f886566e264ec18`](https://github.com/honojs/vite-plugins/commit/6897fd999340a462935213a14f886566e264ec18) Thanks [@KaiSpencer](https://github.com/KaiSpencer)! - feat: add `adapter` and merge `env`

### Patch Changes

- [#98](https://github.com/honojs/vite-plugins/pull/98) [`ff1f0b65c47db8b7776dcee693f95f19060560c9`](https://github.com/honojs/vite-plugins/commit/ff1f0b65c47db8b7776dcee693f95f19060560c9) Thanks [@yusukebe](https://github.com/yusukebe)! - fix: fixed `.wrangler` path

## 0.7.1

### Patch Changes

- [#90](https://github.com/honojs/vite-plugins/pull/90) [`73587e53d30eed82c4388ecfdc13ea5a1a019317`](https://github.com/honojs/vite-plugins/commit/73587e53d30eed82c4388ecfdc13ea5a1a019317) Thanks [@yusukebe](https://github.com/yusukebe)! - fix: fix `plugin.env` type

## 0.7.0

### Minor Changes

- [#86](https://github.com/honojs/vite-plugins/pull/86) [`f9e3545753c8a3cb8e90cb8123b070c0a8966de2`](https://github.com/honojs/vite-plugins/commit/f9e3545753c8a3cb8e90cb8123b070c0a8966de2) Thanks [@jxom](https://github.com/jxom)! - Added `export` property to `devServer`.

## 0.6.1

### Patch Changes

- [#87](https://github.com/honojs/vite-plugins/pull/87) [`5d562cce8baf4f9ff405d6d15f654401c8b54b4d`](https://github.com/honojs/vite-plugins/commit/5d562cce8baf4f9ff405d6d15f654401c8b54b4d) Thanks [@yusukebe](https://github.com/yusukebe)! - fix: bump `@hono/node-server`

## 0.6.0

### Minor Changes

- [#82](https://github.com/honojs/vite-plugins/pull/82) [`930fa87eeaef0a342bf4c7be5db6a31a5a4d6b46`](https://github.com/honojs/vite-plugins/commit/930fa87eeaef0a342bf4c7be5db6a31a5a4d6b46) Thanks [@yusukebe](https://github.com/yusukebe)! - feat: bump `@hono/node-server`

## 0.5.1

### Patch Changes

- [#77](https://github.com/honojs/vite-plugins/pull/77) [`b397fdd438081f4a2b98a042ac2f974c9b63c449`](https://github.com/honojs/vite-plugins/commit/b397fdd438081f4a2b98a042ac2f974c9b63c449) Thanks [@rutan](https://github.com/rutan)! - fix: initialize Miniflare only on the first run

## 0.5.0

### Minor Changes

- [#63](https://github.com/honojs/vite-plugins/pull/63) [`10a7ab5da5e61cf314cc7566ddfa53552bf3172a`](https://github.com/honojs/vite-plugins/commit/10a7ab5da5e61cf314cc7566ddfa53552bf3172a) Thanks [@marbemac](https://github.com/marbemac)! - Leverage vite error handling. To leverage this, return client errors in development like in the example below:

  ```ts
  honoApp.get('*', async c => {
    try {
      // react, solid, etc
      const app = await renderClientApp(<App />);

      return new Response(app, { headers: { 'Content-Type': 'text/html' } });
    } catch (err: any) {
      // in dev, pass the error back to the vite dev server to display in the error overlay
      if (import.meta.env.DEV) return err;

      throw err;
    }
  });
  ```

## 0.4.1

### Patch Changes

- [#64](https://github.com/honojs/vite-plugins/pull/64) [`47f3a1073036b8da2a1b405466e9a9b6d5ff9c1f`](https://github.com/honojs/vite-plugins/commit/47f3a1073036b8da2a1b405466e9a9b6d5ff9c1f) Thanks [@yusukebe](https://github.com/yusukebe)! - fix: peerDependencies

## 0.4.0

### Minor Changes

- [#53](https://github.com/honojs/vite-plugins/pull/53) [`4c0b96f908152ffc366ffba93a35e268008c0c4c`](https://github.com/honojs/vite-plugins/commit/4c0b96f908152ffc366ffba93a35e268008c0c4c) Thanks [@yusukebe](https://github.com/yusukebe)! - feat: introduce Plugins

## 0.3.5

### Patch Changes

- [#51](https://github.com/honojs/vite-plugins/pull/51) [`296c6782531a0b6780154a47dd1ac7a78ed1b910`](https://github.com/honojs/vite-plugins/commit/296c6782531a0b6780154a47dd1ac7a78ed1b910) Thanks [@yusukebe](https://github.com/yusukebe)! - fix: bump `@hono/node-server`

## 0.3.4

### Patch Changes

- [#47](https://github.com/honojs/vite-plugins/pull/47) [`0a8c34da171294376186f3bc716a9620e24d37df`](https://github.com/honojs/vite-plugins/commit/0a8c34da171294376186f3bc716a9620e24d37df) Thanks [@yusukebe](https://github.com/yusukebe)! - fix: use `toString()` for the error message

## 0.3.3

### Patch Changes

- [#45](https://github.com/honojs/vite-plugins/pull/45) [`05b9841b69f140b52a08b08803d0f717a4caf025`](https://github.com/honojs/vite-plugins/commit/05b9841b69f140b52a08b08803d0f717a4caf025) Thanks [@yusukebe](https://github.com/yusukebe)! - fix: handle invalid response

## 0.3.2

### Patch Changes

- [#43](https://github.com/honojs/vite-plugins/pull/43) [`c955dcfc7c42cf33b0c7c470ebcdb5c1f130e2f8`](https://github.com/honojs/vite-plugins/commit/c955dcfc7c42cf33b0c7c470ebcdb5c1f130e2f8) Thanks [@yusukebe](https://github.com/yusukebe)! - fix: don't crash when ssrLoadModule throw the error

## 0.3.1

### Patch Changes

- [#39](https://github.com/honojs/vite-plugins/pull/39) [`1f8d212f0d194e90a7a4133d11d29667a69942ff`](https://github.com/honojs/vite-plugins/commit/1f8d212f0d194e90a7a4133d11d29667a69942ff) Thanks [@yusukebe](https://github.com/yusukebe)! - fix: update `peerDependencies`

## 0.3.0

### Minor Changes

- [#30](https://github.com/honojs/vite-plugins/pull/30) [`12a8b15`](https://github.com/honojs/vite-plugins/commit/12a8b15f9d7347d622342e8dd0466ed1f56b0e4d) Thanks [@yusukebe](https://github.com/yusukebe)! - feat: introduce `env`

- [#36](https://github.com/honojs/vite-plugins/pull/36) [`6de0805`](https://github.com/honojs/vite-plugins/commit/6de08051e79f3b3dbebb7943dcb401ef47875b67) Thanks [@yusukebe](https://github.com/yusukebe)! - feat: support glob-matching for exclude option
