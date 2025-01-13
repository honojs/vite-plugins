import type { Plugin } from 'vite'
import type { BuildOptions } from '../../base.js'
import buildPlugin from '../../base.js'
import { serveStaticHook } from '../../entry/serve-static.js'

export type LambdaEdgeBuildOptions = {
  staticRoot?: string | undefined
} & BuildOptions

// NOTE: Lambda Edge requires the file to be named with .mjs extension because the file has ES modules syntax.
const WORKER_JS_NAME = 'worker.mjs'

const lambdaEdgeBuildPlugin = (pluginOptions?: LambdaEdgeBuildOptions): Plugin => {
  return {
    ...buildPlugin({
      ...{
        entryContentAfterHooks: [
          async (appName) => {
            let code = "import { handle } from 'hono/lambda-edge'\n"
            code += `export const handler = handle(${appName})`
            return code
          },
        ],
        // stop copying public dir to dist
        copyPublicDir: false,
      },
      ...pluginOptions,
      output: WORKER_JS_NAME,
    }),
    name: '@hono/vite-build/lambda-edge',
  }
}

export default lambdaEdgeBuildPlugin 