import type { Plugin } from 'vite'
import type { BuildOptions } from '../../base.js'
import buildPlugin from '../../base.js'
import { serveStaticHook } from '../../entry/serve-static.js'

export type NodeBuildOptions = {
  staticRoot?: string | undefined
  port?: number | undefined
  /**
   * Enable graceful shutdown on SIGINT and SIGTERM signals.
   * Set to a number to specify the timeout in milliseconds before forcing shutdown.
   * Set to 0 to wait indefinitely for connections to close.
   * Leave undefined to disable graceful shutdown.
   * @default undefined
   */
  shutdownTimeoutMs?: number | undefined
} & BuildOptions

const nodeBuildPlugin = (pluginOptions?: NodeBuildOptions): Plugin => {
  const port = pluginOptions?.port ?? 3000
  const shutdownTimeoutMs = pluginOptions?.shutdownTimeoutMs

  return {
    ...buildPlugin({
      ssrTarget: 'node',
      ...{
        entryContentBeforeHooks: [
          async (appName, options) => {
            // eslint-disable-next-line quotes
            let code = "import { serveStatic } from '@hono/node-server/serve-static'\n"
            code += serveStaticHook(appName, {
              filePaths: options?.staticPaths,
              root: pluginOptions?.staticRoot,
            })
            return code
          },
        ],
        entryContentAfterHooks: [
          async (appName) => {
            // eslint-disable-next-line quotes
            let code = "import { serve } from '@hono/node-server'\n"
            if (shutdownTimeoutMs !== undefined) {
              code += `const server = serve({ fetch: ${appName}.fetch, port: ${port.toString()} })\n`
              code += 'const gracefulShutdown = () => {\n'
              code += '  server.close(() => process.exit(0))\n'
              if (shutdownTimeoutMs > 0) {
                code += `  setTimeout(() => process.exit(1), ${shutdownTimeoutMs}).unref()\n`
              }
              code += '}\n'
              // eslint-disable-next-line quotes
              code += "process.on('SIGINT', gracefulShutdown)\n"
              // eslint-disable-next-line quotes
              code += "process.on('SIGTERM', gracefulShutdown)"
            } else {
              code += `serve({ fetch: ${appName}.fetch, port: ${port.toString()} })`
            }
            return code
          },
        ],
      },
      ...pluginOptions,
    }),
    name: '@hono/vite-build/node',
  }
}

export default nodeBuildPlugin
