import { builtinModules } from 'module'
import type { Plugin, UserConfig } from 'vite'
import { Options } from './entry.js'

export type NetlifyOptions = {
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

export const baseDefaultOptions: Required<Omit<NetlifyOptions, 'outputDir'>> = {
  entry: ['./src/index.tsx', './app/server.ts'],
  external: [],
  minify: true,
  emptyOutDir: false,
}

const FUNCTION_JS_NAME = 'index.js'

export const netlifyPlugin = (
  name: string,
  virtualEntryId: string,
  getEntryContent: (options: Options) => string,
  defaultOutputDir: string,
  options?: NetlifyOptions
): Plugin => {
  const resolvedVirtualEntryId = '\0' + virtualEntryId

  return {
    name,
    resolveId(id) {
      if (id === virtualEntryId) {
        return resolvedVirtualEntryId
      }
    },
    load(id) {
      if (id === resolvedVirtualEntryId) {
        return getEntryContent({
          entry: options?.entry
            ? Array.isArray(options.entry)
              ? options.entry
              : [options.entry]
            : [...baseDefaultOptions.entry],
        })
      }
    },
    config: async (): Promise<UserConfig> => {
      return {
        ssr: {
          external: options?.external ?? baseDefaultOptions.external,
          noExternal: true,
        },
        build: {
          outDir: options?.outputDir ?? defaultOutputDir,
          emptyOutDir: options?.emptyOutDir ?? baseDefaultOptions.emptyOutDir,
          minify: options?.minify ?? baseDefaultOptions.minify,
          ssr: true,
          copyPublicDir: false,
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
