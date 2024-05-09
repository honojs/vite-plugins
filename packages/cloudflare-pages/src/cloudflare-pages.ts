import { builtinModules } from 'module'
import { readdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Plugin, UserConfig, ResolvedConfig } from 'vite'
import { getEntryContent } from './entry.js'

type CloudflarePagesOptions = {
  /**
   * @default ['./src/index.tsx', './app/server.ts']
   */
  entry?: string | string[]
  /**
   * @default './dist'
   */
  outputDir?: string
  external?: string[]
  /**
   * @default true
   */
  minify?: boolean
  emptyOutDir?: boolean
}

export const defaultOptions: Required<Omit<CloudflarePagesOptions, 'serveStaticDir'>> = {
  entry: ['./src/index.tsx', './app/server.ts'],
  outputDir: './dist',
  external: [],
  minify: true,
  emptyOutDir: false,
}

const WORKER_JS_NAME = '_worker.js'
const ROUTES_JSON_NAME = '_routes.json'

type StaticRoutes = { version: number; include: string[]; exclude: string[] }

export const cloudflarePagesPlugin = (options?: CloudflarePagesOptions): Plugin => {
  const virtualEntryId = 'virtual:cloudflare-pages-entry-module'
  const resolvedVirtualEntryId = '\0' + virtualEntryId
  let config: ResolvedConfig
  const staticPaths: string[] = []

  return {
    name: '@hono/vite-cloudflare-pages',
    configResolved: async (resolvedConfig) => {
      config = resolvedConfig
    },
    resolveId(id) {
      if (id === virtualEntryId) {
        return resolvedVirtualEntryId
      }
    },
    async load(id) {
      if (id === resolvedVirtualEntryId) {
        return await getEntryContent({
          entry: options?.entry
            ? Array.isArray(options.entry)
              ? options.entry
              : [options.entry]
            : [...defaultOptions.entry],
        })
      }
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
          options?.outputDir ?? defaultOptions.outputDir,
          '_routes.json'
        )
        await writeFile(path, JSON.stringify(staticRoutes))
      }
    },
    config: async (): Promise<UserConfig> => {
      return {
        ssr: {
          external: options?.external ?? defaultOptions.external,
          noExternal: true,
        },
        build: {
          outDir: options?.outputDir ?? defaultOptions.outputDir,
          emptyOutDir: options?.emptyOutDir ?? defaultOptions.emptyOutDir,
          minify: options?.minify ?? defaultOptions.minify,
          ssr: true,
          rollupOptions: {
            external: [...builtinModules, /^node:/],
            input: virtualEntryId,
            output: {
              entryFileNames: WORKER_JS_NAME,
            },
          },
        },
      }
    },
  }
}
