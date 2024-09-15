import type { Plugin } from 'vite'
import type { BuildOptions } from '../../base.js'
import buildPlugin from '../../base.js'
import { serveStaticHook } from '../../entry/serve-static.js'

export type BunBuildOptions = {
  staticRoot?: string | undefined
} & BuildOptions

const bunBuildPlugin = (pluginOptions?: BunBuildOptions): Plugin => {
  return {
    ...buildPlugin({
      ...{
        entryContentBeforeHooks: [
          async (appName, options) => {
            // eslint-disable-next-line quotes
            let code = "import { serveStatic } from 'hono/bun'\n"
            code += serveStaticHook(appName, {
              filePaths: options?.staticPaths,
              root: pluginOptions?.staticRoot,
            })
            return code
          },
        ],
      },
      ...pluginOptions,
    }),
    name: '@hono/vite-build/bun',
  }
}

export default bunBuildPlugin
