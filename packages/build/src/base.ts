import { builtinModules } from 'module'
import { readdir } from 'node:fs/promises'
import { resolve } from 'url'
import type { ConfigEnv, Plugin, ResolvedConfig, UserConfig } from 'vite'
import { getEntryContent } from './entry.js'
import type { GetEntryContentOptions } from './entry.js'

export type BuildOptions = {
  /**
   * @default ['./src/index.tsx', './app/server.ts']
   */
  entry: string | string[]
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
  apply?: ((this: void, config: UserConfig, env: ConfigEnv) => boolean) | undefined
} & Omit<GetEntryContentOptions, 'entry'>

export const defaultOptions: Required<
  Omit<BuildOptions, 'entry' | 'entryContentAfterHook' | 'entryContentBeforeHook'>
> = {
  outputDir: './dist',
  external: [],
  minify: true,
  emptyOutDir: false,
  apply: (_config, { command, mode }) => {
    if (command === 'build' && mode !== 'client') {
      return true
    }
    return false
  },
  staticPaths: [''],
}

const EntryFileName = 'app.js'

export const buildPlugin = (options: BuildOptions): Plugin => {
  const virtualEntryId = 'virtual:build-entry-module'
  const resolvedVirtualEntryId = '\0' + virtualEntryId
  let config: ResolvedConfig

  return {
    name: '@hono/vite-build',
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
        const staticPaths: string[] = []
        const paths = await readdir(resolve(config.root, config.publicDir), {
          withFileTypes: true,
        })
        paths.forEach((p) => {
          if (p.isDirectory()) {
            staticPaths.push(`/${p.name}/*`)
          } else {
            staticPaths.push(`/${p.name}`)
          }
        })
        return await getEntryContent({
          entry: Array.isArray(options.entry) ? options.entry : [options.entry],
          entryContentBeforeHook: options.entryContentBeforeHook,
          entryContentAfterHook: options.entryContentAfterHook,
          staticPaths,
        })
      }
    },
    apply: options?.apply ?? defaultOptions.apply,
    config: async (): Promise<UserConfig> => {
      return {
        ssr: {
          external: options?.external ?? defaultOptions.external,
          noExternal: true,
          target: 'webworker',
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
              entryFileNames: EntryFileName,
            },
          },
        },
      }
    },
  }
}
