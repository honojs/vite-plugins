import type { Plugin } from 'vite'
import type { BuildOptions } from '../../base.js'
import buildPlugin from '../../base.js'

export type CloudflareWorkersBuildOptions = BuildOptions

const cloudflareWorkersBuildPlugin = (pluginOptions?: CloudflareWorkersBuildOptions): Plugin => {
  return {
    ...buildPlugin({
      ...pluginOptions,
    }),
    name: '@hono/vite-build/cloudflare-workers',
  }
}

export default cloudflareWorkersBuildPlugin
