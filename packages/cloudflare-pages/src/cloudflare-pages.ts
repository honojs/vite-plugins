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
  /**
   * @description The directory includes static files.
   * The default is `config.build.outDir`, but if you don't include built files, you can specify a different directory, e.g., `public` or set `undefined` to disable it.
   * @default config.build.outDir
   */
  serveStaticDir?: string | undefined
  external?: string[]
  /**
   * @default true
   */
  minify?: boolean
  emptyOutDir?: boolean
  /**
   * @description Create `_routes.json` or not.
   * @default true
   */
  routesJson?: boolean
}

export const defaultOptions: Required<Omit<CloudflarePagesOptions, 'serveStaticDir'>> = {
  entry: ['./src/index.tsx', './app/server.ts'],
  outputDir: './dist',
  external: [],
  minify: true,
  emptyOutDir: false,
  routesJson: true,
}

type StaticRoutes = { version: number; include: string[]; exclude: string[] }

export const cloudflarePagesPlugin = (options?: CloudflarePagesOptions): Plugin => {
  const virtualEntryId = 'virtual:cloudflare-pages-entry-module'
  const resolvedVirtualEntryId = '\0' + virtualEntryId
  let config: ResolvedConfig
  let staticRoutes: StaticRoutes
  let serveStaticDir = options?.serveStaticDir
  const staticPaths: string[] = []

  return {
    name: '@hono/vite-cloudflare-pages',
    configResolved: async (resolvedConfig) => {
      config = resolvedConfig
      serveStaticDir ??= config.build.outDir
    },
    resolveId(id) {
      if (id === virtualEntryId) {
        return resolvedVirtualEntryId
      }
    },
    async load(id) {
      if (id === resolvedVirtualEntryId) {
        if (typeof serveStaticDir === 'string') {
          const paths = await readdir(resolve(config.root, serveStaticDir!), {
            withFileTypes: true,
          })
          paths.forEach((p) => {
            if (p.isDirectory()) {
              staticPaths.push(`/${p.name}/*`)
            } else {
              staticPaths.push(`/${p.name}`)
            }
          })
        }
        return await getEntryContent({
          entry: options?.entry
            ? Array.isArray(options.entry)
              ? options.entry
              : [options.entry]
            : [...defaultOptions.entry],
          staticPaths,
        })
      }
    },
    writeBundle: async () => {
      if (!options?.routesJson === false) {
        return
      }
      staticRoutes = {
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
              entryFileNames: '_worker.js',
            },
          },
        },
      }
    },
  }
}
