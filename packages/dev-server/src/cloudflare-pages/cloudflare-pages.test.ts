import { getEnv } from './cloudflare-pages.js'

describe('getEnv()', () => {
  const envFunc = getEnv({
    bindings: {
      TOKEN: 'MY TOKEN',
    },
  })
  it('Should return the value for bindings', async () => {
    const env = await envFunc()
    expect(env['TOKEN']).toBe('MY TOKEN')
  })
  it('Should contains ASSETS', async () => {
    const env = await envFunc()
    expect((env['ASSETS'] as { fetch: typeof fetch }).fetch).toBeDefined()
  })
})
