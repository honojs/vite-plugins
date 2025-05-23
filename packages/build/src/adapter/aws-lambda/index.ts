import type { Plugin } from 'vite'
import type { BuildOptions } from '../../base.js'
import buildPlugin from '../../base.js'
import { serveStaticHook } from '../../entry/serve-static.js'

export type AwsLambdaBuildOptions = {
  staticRoot?: string | undefined
} & BuildOptions

const awsLambdaBuildPlugin = (pluginOptions?: AwsLambdaBuildOptions): Plugin => {
  return {
    ...buildPlugin({
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
          let code = "import { handle } from 'hono/aws-lambda'\n"
          code += `export const handler = handle(${appName})\n`
          return code
        },
      ],
      // To avoid `Runtime.UserCodeSyntaxError: SyntaxError: Cannot use import statement outside a module`,
      // the output file is specified as .mjs.
      output: 'index.mjs',
      ...pluginOptions,
    }),
    name: '@hono/vite-build/aws-lambda',
  }
}

export default awsLambdaBuildPlugin
