import type { Plugin } from 'vite'
import type { BuildOptions } from '../../base.js'
import buildPlugin from '../../base.js'

export type LambdaBuildOptions = {
  staticRoot?: string | undefined
} & BuildOptions

// NOTE: Lambda requires the file to be named with .mjs extension because the file has ES modules syntax.
const WORKER_JS_NAME = 'worker.mjs'

const lambdaBuildPlugin = (pluginOptions?: LambdaBuildOptions): Plugin => {
  return {
    ...buildPlugin({
      ...{
        entryContentAfterHooks: [
          async (appName) => {
            let code = "import { handle } from 'hono/aws-lambda'\n"
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
    name: '@hono/vite-build/aws-lambda',
  }
}

export default lambdaBuildPlugin
