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
            const preset = pluginOptions?.preset ?? 'hono'
            let code = `import { serveStatic } from '${preset}/deno'\n`
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
    name: '@hono/vite-build/deno',
  }
}

export default denoBuildPlugin
