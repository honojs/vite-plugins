import { WebSocketPair } from 'miniflare'
import { getPlatformProxy } from 'wrangler'
import type { Adapter, Env } from '../types.js'

// We detect if the environment is `worked` by checking if the WebSocketPair is available.
Object.assign(globalThis, { WebSocketPair })

type CloudflareAdapterOptions = {
  proxy: Parameters<typeof getPlatformProxy>[0]
}

let proxy: Awaited<ReturnType<typeof getPlatformProxy<Env>>>

export const cloudflareAdapter: (options?: CloudflareAdapterOptions) => Promise<Adapter> = async (
  options
) => {
  proxy ??= await getPlatformProxy(options?.proxy)
  return {
    env: proxy.env,
    executionContext: proxy.ctx,
    onServerClose: proxy.dispose,
  }
}

export default cloudflareAdapter
