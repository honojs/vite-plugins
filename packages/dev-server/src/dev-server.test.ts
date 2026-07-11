import { devServer, defaultOptions } from './dev-server'
import { isExcluded } from './utils'

describe('Config in the dev-server plugin', () => {
  it('Should return the default patterns', () => {
    const plugin = devServer()
    // @ts-expect-error plugin.config() is not typed
    const config = plugin.config()
    expect(config.server.watch.ignored).toBe(defaultOptions.ignoreWatching)
  })

  it('Should return the user specified patterns', () => {
    const plugin = devServer({
      ignoreWatching: [/ignore_dir/],
    })
    // @ts-expect-error plugin.config() is not typed
    const config = plugin.config()
    expect(config.server.watch.ignored).toEqual([/ignore_dir/])
  })
})

describe('Default exclude patterns', () => {
  it.each([
    '/app/client.ts',
    '/app/client.tsx',
    '/app/client.js',
    '/app/client.jsx',
    '/app/client.mjs',
    '/style.css',
    '/app/routes/index.tsx?tsr-split=component',
    '/app/routes/index.tsx?tsr-shared=1',
    '/app/client.ts?tsr-shared=1',
    '/app/client.js?v=abc123',
    '/style.css?direct',
    '/app/client.ts?t=1750000000000',
    '/@vite/client',
    '/favicon.ico',
    '/static/image.png',
    '/node_modules/.vite/deps/react.js',
  ])('Should exclude "%s"', (url) => {
    expect(isExcluded(url, defaultOptions.exclude)).toBe(true)
  })

  it.each(['/', '/about', '/about?tab=1', '/api/users?limit=10'])(
    'Should not exclude "%s"',
    (url) => {
      expect(isExcluded(url, defaultOptions.exclude)).toBe(false)
    }
  )

  it('Should apply user-specified patterns to query-suffixed URLs as well', () => {
    expect(isExcluded('/app/foo.custom?query=1', [/.*\.custom$/])).toBe(true)
    expect(isExcluded('/app/foo.custom?query=1', ['/app/**'])).toBe(true)
    expect(isExcluded('/other/foo.custom2?query=1', [/.*\.custom$/, '/app/**'])).toBe(false)
  })
})
