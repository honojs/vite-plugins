import { WebSocketPair } from 'miniflare'
import { getPlatformProxy } from 'wrangler'
import type { Adapter, Env } from '../types.js'

Object.assign(globalThis, { WebSocketPair })

type CloudflareAdapterOptions = {
  proxy: Parameters<typeof getPlatformProxy>[0]
}

let proxy: Awaited<ReturnType<typeof getPlatformProxy<Env>>>

export const cloudflareAdapter: (options?: CloudflareAdapterOptions) => Promise<Adapter> = async (
  options
) => {
  proxy ??= await getPlatformProxy(options?.proxy)
  // Cache API provided by `getPlatformProxy` currently do nothing.
  Object.assign(globalThis, { caches: proxy.caches })
  Object.assign(globalThis, {
    navigator: {
      userAgent: 'Cloudflare-Workers',
    },
  })
  return {
    env: proxy.env,
    executionContext: proxy.ctx,
    onServerClose: async () => {
      try {
        await proxy.dispose()
      } catch {
        /**
         * It throws an error if server is not running.
         */
      }
    },
  }
}

export default cloudflareAdapter
