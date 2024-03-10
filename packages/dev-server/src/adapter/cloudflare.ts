import { getPlatformProxy } from 'wrangler'
import type { Adapter, Env } from '../types.js'

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
    onServerClose: proxy.dispose,
  }
}

export default cloudflareAdapter
