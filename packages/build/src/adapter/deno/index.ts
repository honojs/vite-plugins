import type { Plugin } from 'vite'
import type { BuildOptions } from '../../base.js'
import buildPlugin from '../../base.js'
import { serveStaticHook } from '../../entry/serve-static.js'

export type DenoBuildOptions = {
  staticRoot?: string | undefined
} & BuildOptions

const denoBuildPlugin = (pluginOptions?: DenoBuildOptions): Plugin => {
  return {
    ...buildPlugin({
      ...{
        entryContentBeforeHooks: [
          async (appName, options) => {
            // eslint-disable-next-line quotes
            let code = "import { serveStatic } from 'hono/deno'\n"
            code += serveStaticHook(appName, {
              filePaths: options?.staticPaths,
              root: pluginOptions?.staticRoot,
            })
            return code
          },
        ],
        entryContentAfterHooks: [
          async (appName) => {
            return `Deno.serve(${appName}.fetch)`
          },
        ],
      },
      ...pluginOptions,
    }),
    name: '@hono/vite-build/deno',
  }
}

export default denoBuildPlugin
