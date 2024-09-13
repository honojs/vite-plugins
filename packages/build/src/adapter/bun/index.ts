import type { Plugin } from 'vite'
import type { BuildOptions } from '../../base'
import { buildPlugin } from '../../base'

export type BunBuildOptions = {
  staticRoot?: string | undefined
} & BuildOptions

export const bunBuildPlugin = (options: BuildOptions): Plugin => {
  return {
    ...buildPlugin({
      ...{
        entryContentBeforeHook: async (appName, options) => {
          // eslint-disable-next-line quotes
          let code = "import { serveStatic } from 'hono/bun'\n"
          for (const path of options?.staticFilePaths ?? []) {
            code += `${appName}.use('${path}', serveStatic({ root: './' }))\n`
          }
          return code
        },
      },
      ...options,
    }),
    name: '@hono/vite-build/bun',
  }
}

export default bunBuildPlugin

const foo = async () => {}
