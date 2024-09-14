import type { Plugin } from 'vite'
import type { BuildOptions } from '../../base.js'
import buildPlugin from '../../base.js'
import { serveStaticHook } from '../../entry/serve-static.js'

export type NodeBuildOptions = {
  staticRoot?: string | undefined
} & BuildOptions

const nodeBuildPlugin = (pluginOptions?: NodeBuildOptions): Plugin => {
  return {
    ...buildPlugin({
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
            code += `serve(${appName})`
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
