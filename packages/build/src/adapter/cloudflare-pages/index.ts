import { readdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Plugin, ResolvedConfig } from 'vite'
import type { BuildOptions } from '../../base.js'
import buildPlugin, { defaultOptions } from '../../base.js'

export type CloudflarePagesBuildOptions = BuildOptions

const WORKER_JS_NAME = '_worker.js'
const ROUTES_JSON_NAME = '_routes.json'

type StaticRoutes = { version: number; include: string[]; exclude: string[] }

const cloudflarePagesBuildPlugin = (pluginOptions?: CloudflarePagesBuildOptions): Plugin => {
  let config: ResolvedConfig
  const staticPaths: string[] = []

  return {
    ...buildPlugin({
      ...pluginOptions,
      output: WORKER_JS_NAME,
    }),
    configResolved: async (resolvedConfig) => {
      config = resolvedConfig
    },
    writeBundle: async () => {
      const paths = await readdir(resolve(config.root, config.build.outDir), {
        withFileTypes: true,
      })
      // If _routes.json already exists, don't create it
      if (paths.some((p) => p.name === ROUTES_JSON_NAME)) {
        return
      } else {
        paths.forEach((p) => {
          if (p.isDirectory()) {
            staticPaths.push(`/${p.name}/*`)
          } else {
            if (p.name === WORKER_JS_NAME) {
              return
            }
            staticPaths.push(`/${p.name}`)
          }
        })
        const staticRoutes: StaticRoutes = {
          version: 1,
          include: ['/*'],
          exclude: staticPaths,
        }
        const path = resolve(
          config.root,
          pluginOptions?.outputDir ?? defaultOptions.outputDir,
          '_routes.json'
        )
        await writeFile(path, JSON.stringify(staticRoutes))
      }
    },
    name: '@hono/vite-build/cloudflare-pages',
  }
}

export default cloudflarePagesBuildPlugin
