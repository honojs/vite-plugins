import { builtinModules } from 'module'
import type { Plugin, UserConfig } from 'vite'
import { getEntryContent } from './entry.js'
import { BaseNetlifyOptions, baseDefaultOptions } from '../netlify.js'

type ServerlessOptions = {
  /**
   * @default './netlify/functions'
   */
  functionsDir?: string
} & BaseNetlifyOptions

export const defaultOptions: Required<ServerlessOptions> = {
  ...baseDefaultOptions,
  functionsDir: './netlify/functions',
}

const FUNCTION_JS_NAME = 'index.js'

export const netlifyServerlessPlugin = (options?: ServerlessOptions): Plugin => {
  const virtualEntryId = 'virtual:netlify-serverless-functions-entry-module'
  const resolvedVirtualEntryId = '\0' + virtualEntryId

  return {
    name: '@hono/vite-netlify/functions',
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
          outDir: options?.functionsDir ?? defaultOptions.functionsDir,
          emptyOutDir: options?.emptyOutDir ?? defaultOptions.emptyOutDir,
          minify: options?.minify ?? defaultOptions.minify,
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
