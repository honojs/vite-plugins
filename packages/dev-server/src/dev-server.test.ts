import { devServer, defaultOptions } from './dev-server'

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
