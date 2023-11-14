import type { MiniflareOptions, WorkerOptions } from 'miniflare'
import type { GetEnv } from '../types.js'

type Options = Partial<
  Omit<
    WorkerOptions,
    // We can ignore these properties:
    'name' | 'script' | 'scriptPath' | 'modules' | 'modulesRoot' | 'modulesRules'
  > &
    Pick<
      MiniflareOptions,
      'cachePersist' | 'd1Persist' | 'durableObjectsPersist' | 'kvPersist' | 'r2Persist'
    > & {
      // Enable `env.ASSETS.fetch()` function for Cloudflare Pages.
      assets?: boolean
    }
>

const nullScript = 'export default { fetch: () => new Response(null, { status: 404 }) };'

export const getEnv: GetEnv<Options> = (options) => async () => {
  // Dynamic import Miniflare for environments like Bun.
  const { Miniflare } = await import('miniflare')
  const mf = new Miniflare({
    modules: true,
    script: nullScript,
    ...options,
  })

  const env = {
    ...(await mf.getBindings()),
    // `env.ASSETS.fetch()` function for Cloudflare Pages.
    ASSETS: {
      async fetch(input: RequestInfo | URL, init?: RequestInit | undefined) {
        try {
          return await fetch(new Request(input, init))
        } catch (e) {
          console.error('Failed to execute ASSETS.fetch: ', e)
          return new Response(null, { status: 500 })
        }
      },
    },
  }
  return env
}
