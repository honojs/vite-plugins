import type { Plugin } from 'vite'
import type { BuildOptions } from '../../base.js'
import buildPlugin from '../../base.js'

export type NetlifyFunctionsBuildOptions = BuildOptions

export default function netlifyFunctionsBuildPlugin(
  pluginOptions?: NetlifyFunctionsBuildOptions
): Plugin {
  return {
    ...buildPlugin({
      ...{
        entryContentBeforeHooks: [() => 'import { handle } from "hono/netlify"'],
        entryContentAfterHooks: [() => 'export const config = { path: "/*", preferStatic: true }'],
        entryContentDefaultExportHook: (appName) => `export default handle(${appName})`,
      },
      ...pluginOptions,
    }),
    name: '@hono/vite-build/netlify-functions',
  }
}
