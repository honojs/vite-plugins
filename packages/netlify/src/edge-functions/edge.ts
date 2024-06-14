import { builtinModules } from 'module'
import { readdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Plugin, ResolvedConfig, UserConfig } from 'vite'
import { getEntryContent } from './entry.js'
import { BaseNetlifyOptions, baseDefaultOptions } from '../netlify.js'

type EdgeOptions = {
  /**
   * @default './dist'
   */
  outputDir?: string
  /**
   * @default './netlify/edge-functions'
   */
  functionsDir?: string
} & BaseNetlifyOptions

export const defaultOptions: Required<EdgeOptions> = {
  ...baseDefaultOptions,
  outputDir: './dist',
  functionsDir: './netlify/edge-functions',
}

const FUNCTION_JS_NAME = 'index.js'
const NETLIFY_MANIFEST_NAME = 'manifest.json'

export const netlifyEdgePlugin = (options?: EdgeOptions): Plugin => {
  const virtualEntryId = 'virtual:netlify-edge-functions-entry-module'
  const resolvedVirtualEntryId = '\0' + virtualEntryId
  let config: ResolvedConfig
  const staticPaths: string[] = []

  return {
    name: '@hono/vite-netlify/edge-functions',
    configResolved: async (resolvedConfig) => {
      config = resolvedConfig
    },
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
    writeBundle: async () => {
      const paths = await readdir(
        resolve(config.root, options?.outputDir ?? defaultOptions.outputDir),
        {
          withFileTypes: true,
        }
      )

      paths.forEach((p) => {
        if (p.isDirectory()) {
          staticPaths.push(`/${p.name}/*`)
        } else {
          staticPaths.push(`/${p.name}`)
        }
      })

      const manifestContent = {
        functions: [
          {
            function: 'index',
            path: '/*',
            excludedPath: staticPaths,
          },
        ],
        version: 1,
      }
      const path = resolve(
        config.root,
        options?.functionsDir ?? defaultOptions.functionsDir,
        NETLIFY_MANIFEST_NAME
      )
      await writeFile(path, JSON.stringify(manifestContent))
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
