import type { Plugin, ResolvedConfig } from 'vite'
import { readdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
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
      // If _routes.json already exists in public, don't create it
      if (config.publicDir) {
        const publicFiles = await readdir(config.publicDir)
        if (publicFiles.includes(ROUTES_JSON_NAME)) {
          return
        }
      }

      // Process files in public directory (not dist directory)
      if (config.publicDir) {
        const publicPaths = await readdir(config.publicDir, {
          withFileTypes: true,
        })
        publicPaths.forEach((p) => {
          if (p.isDirectory()) {
            staticPaths.push(`/${p.name}/*`)
          } else {
            if (p.name === ROUTES_JSON_NAME) {
              return
            }
            staticPaths.push(`/${p.name}`)
          }
        })
      }
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
    },
    name: '@hono/vite-build/cloudflare-pages',
  }
}

export default cloudflarePagesBuildPlugin
