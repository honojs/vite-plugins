import type { Miniflare, MiniflareOptions, WorkerOptions } from 'miniflare'
import type { GetEnv, Plugin } from '../types.js'

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

let mf: Miniflare | undefined = undefined

export const getEnv: GetEnv<Options> = (options) => async () => {
  if (!mf) {
    // Dynamic import Miniflare for environments like Bun.
    const { Miniflare } = await import('miniflare')
    mf = new Miniflare({
      modules: true,
      script: nullScript,
      ...options,
    })
  }

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

export const disposeMf = async () => {
  mf?.dispose()
  mf = undefined
}

const plugin = (options?: Options): Plugin => {
  const env = getEnv(options ?? {})
  return {
    env,
    onServerClose: async () => {
      await disposeMf()
    },
  }
}

export default plugin
