import type { Plugin } from 'vite'
import type { BuildOptions } from '../../base.js'
import buildPlugin, { defaultOptions as baseDefaultOptions } from '../../base.js'
import { serveStaticHook } from '../../entry/serve-static.js'

export type BunBuildOptions = {
  staticRoot?: string | undefined
} & BuildOptions

export const defaultOptions: BunBuildOptions = {
  ...baseDefaultOptions,
  entryContentAfterHooks: [
    () => `
      let websocket
      for (const [, app] of Object.entries(modules)) {
        if (
          app &&
          typeof app === 'object' &&
          'websocket' in app &&
          app.websocket !== undefined
        ) {
          if (websocket !== undefined) {
            throw new Error(
              \`Handler "websocket" is defined in multiple entry files. Please ensure each handler is defined only once.\`
            )
          }
          websocket = app.websocket
        }
      }
    `,
  ],
  entryContentDefaultExportHook: (appName) =>
    `export default websocket !== undefined ? { fetch: ${appName}.fetch.bind(${appName}), websocket } : ${appName}`,
}

const bunBuildPlugin = (pluginOptions?: BunBuildOptions): Plugin => {
  return {
    ...buildPlugin({
      ...{
        entryContentBeforeHooks: [
          async (appName, options) => {
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
      entryContentAfterHooks:
        pluginOptions?.entryContentAfterHooks ?? defaultOptions.entryContentAfterHooks,
      entryContentDefaultExportHook:
        pluginOptions?.entryContentDefaultExportHook ??
        defaultOptions.entryContentDefaultExportHook,
    }),
    name: '@hono/vite-build/bun',
  }
}

export default bunBuildPlugin
