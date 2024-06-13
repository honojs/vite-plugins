import { builtinModules } from 'module'
import type { Plugin, UserConfig, ResolvedConfig } from 'vite'
import { getEntryContent } from './entry.js'

type BunOptions = {
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

export const defaultOptions: Required<Omit<BunOptions, 'serveStaticDir'>> = {
  entry: ['./src/index.tsx', './app/server.ts'],
  outputDir: './dist',
  external: [],
  minify: true,
  emptyOutDir: false,
}

const FUNCTION_JS_NAME = 'server.js'

export const bunPlugin = (options?: BunOptions): Plugin => {
  const virtualEntryId = 'virtual:bun-entry-module'
  const resolvedVirtualEntryId = '\0' + virtualEntryId

  return {
    name: '@hono/bun',
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
              entryFileNames: FUNCTION_JS_NAME,
            },
          },
        },
      }
    },
  }
}
