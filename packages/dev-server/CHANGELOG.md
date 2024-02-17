# @hono/vite-dev-server

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
