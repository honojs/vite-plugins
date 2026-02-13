import type { Hono } from 'hono'
import { toSSG, defaultExtensionMap } from 'hono/ssg'
import type { SSGPlugin } from 'hono/ssg'
import type { Plugin, ResolvedConfig } from 'vite'
import { createServer } from 'vite'
import { relative } from 'node:path'

type SSGOptions = {
  entry?: string
  /**
   * Hono SSG plugins to use.
   * These are not Vite plugins, but plugins for Hono's static site generation.
   * @see https://hono.dev/docs/helpers/ssg#plugins
   */
  plugins?: SSGPlugin[]
  extensionMap?: Record<string, string>
}

export const defaultOptions: Required<SSGOptions> = {
  entry: './src/index.tsx',
  plugins: [],
  extensionMap: defaultExtensionMap,
}

export const ssgBuild = (options?: SSGOptions): Plugin => {
  const virtualId = 'virtual:ssg-void-entry'
  const resolvedVirtualId = '\0' + virtualId

  const entry = options?.entry ?? defaultOptions.entry
  let config: ResolvedConfig
  return {
    name: '@hono/vite-ssg',
    apply: 'build',
    enforce: 'post',
    async config() {
      return {
        build: {
          rollupOptions: {
            input: [virtualId],
          },
        },
      }
    },
    configResolved(resolved) {
      config = resolved
    },
    resolveId(id) {
      if (id === virtualId) {
        return resolvedVirtualId
      }
    },
    load(id) {
      if (id === resolvedVirtualId) {
        return 'console.log("suppress empty chunk message")'
      }
    },
    async generateBundle(_outputOptions, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type === 'chunk' && chunk.moduleIds.includes(resolvedVirtualId)) {
          delete bundle[chunk.fileName]
        }
      }

      // Create a server to load the module
      const server = await createServer({
        resolve: {
          ...config.resolve,
          builtins: [...config.resolve.builtins, /^node:/],
        },
        plugins: [],
        build: { ssr: true },
        mode: config.mode,
      })
      const module = await server.ssrLoadModule(entry)

      const app = module['default'] as Hono

      if (!app) {
        throw new Error(`Failed to find a named export "default" from ${entry}`)
      }

      const outDir = config.build.outDir

      const result = await toSSG(
        app,
        {
          writeFile: async (path, data) => {
            // delegate to Vite to emit the file
            this.emitFile({
              type: 'asset',
              fileName: relative(outDir, path),
              source: data,
            })
          },
          async mkdir() {
            return
          },
        },
        {
          dir: outDir,
          plugins: options?.plugins ?? defaultOptions.plugins,
          extensionMap: options?.extensionMap ?? defaultOptions.extensionMap,
        }
      )

      server.close()

      if (!result.success) {
        throw result.error
      }
    },
  }
}
