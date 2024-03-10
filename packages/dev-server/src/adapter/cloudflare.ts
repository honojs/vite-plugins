import { getPlatformProxy } from 'wrangler'
import type { Adapter, Env } from '../types.js'

let proxy: Awaited<ReturnType<typeof getPlatformProxy<Env>>>

export const cloudflareAdapter: () => Promise<Adapter> = async () => {
  proxy ??= await getPlatformProxy()
  return {
    env: proxy.env,
    onServerClose: proxy.dispose,
  }
}

export default cloudflareAdapter
