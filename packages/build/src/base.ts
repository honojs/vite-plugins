import type { ConfigEnv, Plugin, ResolvedConfig, UserConfig } from 'vite'
import { builtinModules } from 'module'
import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { getEntryContent } from './entry/index.js'
import type { GetEntryContentOptions } from './entry/index.js'

export type BuildOptions = {
  /**
   * @default ['src/index.ts', './src/index.tsx', './app/server.ts']
   */
  entry?: string | string[]
  /**
   * @default './dist'
   */
  output?: string
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
  Omit<
    BuildOptions,
    'entryContentAfterHooks' | 'entryContentBeforeHooks' | 'entryContentDefaultExportHook'
  >
> = {
  entry: ['src/index.ts', './src/index.tsx', './app/server.ts'],
  output: 'index.js',
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
  staticPaths: [],
  preset: 'hono',
}

const buildPlugin = (options: BuildOptions): Plugin => {
  const virtualEntryId = 'virtual:build-entry-module'
  const resolvedVirtualEntryId = '\0' + virtualEntryId
  let config: ResolvedConfig
  const output = options.output ?? defaultOptions.output
  const preset = options.preset ?? defaultOptions.preset

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
        const staticPaths: string[] = options.staticPaths ?? []
        const direntPaths = []
        try {
          const publicDirPaths = readdirSync(resolve(config.root, config.publicDir), {
            withFileTypes: true,
          })
          direntPaths.push(...publicDirPaths)
          const buildOutDirPaths = readdirSync(resolve(config.root, config.build.outDir), {
            withFileTypes: true,
          })
          direntPaths.push(...buildOutDirPaths)
        } catch {}

        const uniqueStaticPaths = new Set<string>()

        direntPaths.forEach((p) => {
          if (p.isDirectory()) {
            uniqueStaticPaths.add(`/${p.name}/*`)
          } else {
            if (p.name === output) {
              return
            }
            uniqueStaticPaths.add(`/${p.name}`)
          }
        })

        staticPaths.push(...Array.from(uniqueStaticPaths))

        const entry = options.entry ?? defaultOptions.entry
        return await getEntryContent({
          entry: Array.isArray(entry) ? entry : [entry],
          entryContentBeforeHooks: options.entryContentBeforeHooks,
          entryContentAfterHooks: options.entryContentAfterHooks,
          entryContentDefaultExportHook: options.entryContentDefaultExportHook,
          staticPaths,
          preset,
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
              entryFileNames: output,
            },
          },
        },
      }
    },
  }
}

export default buildPlugin
