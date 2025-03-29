import type { Plugin } from 'vite'
import type { BuildOptions } from '../../base.js'
import buildPlugin from '../../base.js'

export type CloudflareWorkersBuildOptions = BuildOptions

const cloudflareWorkersBuildPlugin = (pluginOptions?: CloudflareWorkersBuildOptions): Plugin => {
  return {
    ...buildPlugin({
      entryContentAfterHooks: [
        () => `
        const merged = {}
        const definedHandlers = new Set()
        for (const [file, app] of Object.entries(modules)) {
          for (const [key, handler] of Object.entries(app)) {
            if (key !== 'fetch') {
              if (definedHandlers.has(key)) {
                throw new Error(\`Handler "\${key}" is defined in multiple entry files. Please ensure each handler (except fetch) is defined only once.\`);
              }
              definedHandlers.add(key)
              merged[key] = handler
            }
          }
        }
      `,
      ],
      entryContentDefaultExportHook: (appName) =>
        `export default { ...merged, fetch: ${appName}.fetch }`,
      ...pluginOptions,
    }),
    name: '@hono/vite-build/cloudflare-workers',
  }
}

export default cloudflareWorkersBuildPlugin
