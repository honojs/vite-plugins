import { getPlatformProxy } from 'wrangler'
import type { Adapter } from '../types.js'

export const cloudflareAdapter: () => Promise<Adapter> = async () => {
  const proxy = await getPlatformProxy()
  return {
    env: proxy.env,
    onServerClose: proxy.dispose,
  }
}

export default cloudflareAdapter
