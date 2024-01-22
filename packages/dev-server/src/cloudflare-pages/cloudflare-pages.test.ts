import type { EnvFunc } from '../types.js'
import { getEnv, disposeMf } from './cloudflare-pages.js'

describe('getEnv()', () => {
  let envFunc: EnvFunc

  beforeEach(() => {
    envFunc = getEnv({
      bindings: {
        TOKEN: 'MY TOKEN',
      },
    })
  })

  afterEach(() => {
    disposeMf()
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
