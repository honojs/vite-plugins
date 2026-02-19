import { build as viteBuild } from 'vite'
import type { Plugin, ResolvedConfig } from 'vite'
import { existsSync, mkdirSync } from 'node:fs'
import { cp, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { BuildOptions } from '../../base.js'
import buildPlugin from '../../base.js'
import type { VercelBuildConfigV3, VercelNodejsServerlessFunctionConfig } from './types.js'

type VercelSourceRoute = Extract<NonNullable<VercelBuildConfigV3['routes']>[number], { src: string }>

export type VercelFunctionBuildConfig = {
  name: string
  entry: BuildOptions['entry']
  routes?: Array<Omit<VercelSourceRoute, 'dest'> & { dest?: string }>
  function?: Partial<VercelNodejsServerlessFunctionConfig>
}

export type VercelBuildOptions = {
  vercel?: {
    config?: VercelBuildConfigV3
    function?: Partial<VercelNodejsServerlessFunctionConfig>
    functions?: VercelFunctionBuildConfig[]
  }
} & Omit<BuildOptions, 'output' | 'outputDir'>

const BUNDLE_NAME = 'index.js'
const FUNCTION_NAME = '__hono'

const functionEntryHooks = {
  entryContentAfterHooks: [
    // eslint-disable-next-line quotes
    () => "import { handle } from '@hono/node-server/vercel'",
  ],
  entryContentDefaultExportHook: (appName: string) => `export default handle(${appName})`,
}

const writeJSON = (path: string, data: Record<string, unknown>) => {
  const dir = resolve(path, '..')
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return writeFile(path, JSON.stringify(data))
}

const getRuntimeVersion = () => {
  try {
    const systemNodeVersion = process.versions.node.split('.')[0]
    return `nodejs${Number(systemNodeVersion)}.x` as const
  } catch {
    return 'nodejs22.x' as const
  }
}

const escapeRegex = (value: string) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const getDefaultRoutePattern = (functionName: string) => {
  return `^/${escapeRegex(functionName)}(?:/.*)?$`
}

const getFunctionConfig = (
  config: ResolvedConfig,
  commonConfig: Partial<VercelNodejsServerlessFunctionConfig> | undefined,
  functionConfig: Partial<VercelNodejsServerlessFunctionConfig> | undefined
): VercelNodejsServerlessFunctionConfig => {
  return {
    ...commonConfig,
    ...functionConfig,
    runtime: getRuntimeVersion(),
    launcherType: 'Nodejs',
    handler: BUNDLE_NAME,
    shouldAddHelpers: Boolean(functionConfig?.shouldAddHelpers ?? commonConfig?.shouldAddHelpers),
    shouldAddSourcemapSupport: Boolean(config.build.sourcemap),
    supportsResponseStreaming: true,
  }
}

const vercelBuildPlugin = (pluginOptions?: VercelBuildOptions): Plugin => {
  let config: ResolvedConfig
  const configuredFunctions = pluginOptions?.vercel?.functions ?? []
  const hasMultiFunctionConfig = configuredFunctions.length > 0
  const primaryFunction = hasMultiFunctionConfig
    ? configuredFunctions[0]
    : {
        name: FUNCTION_NAME,
        entry: pluginOptions?.entry,
      }

  if (hasMultiFunctionConfig) {
    const seen = new Set<string>()
    for (const currentFunction of configuredFunctions) {
      if (!currentFunction.name) {
        throw new Error('`vercel.functions[].name` is required and cannot be empty.')
      }
      if (seen.has(currentFunction.name)) {
        throw new Error(`Duplicate Vercel function name: "${currentFunction.name}".`)
      }
      seen.add(currentFunction.name)
    }
  }

  return {
    ...buildPlugin({
      ssrTarget: 'node',
      entry: primaryFunction.entry,
      output: `functions/${primaryFunction.name}.func/${BUNDLE_NAME}`,
      outputDir: '.vercel/output',
      ...{
        ...functionEntryHooks,
      },
      ...pluginOptions,
    }),
    configResolved: (resolvedConfig: ResolvedConfig) => {
      config = resolvedConfig
    },
    writeBundle: async () => {
      const outputDir = resolve(config.root, config.build.outDir)
      const firstFunctionDir = resolve(outputDir, 'functions', `${primaryFunction.name}.func`)

      if (hasMultiFunctionConfig) {
        for (const currentFunction of configuredFunctions.slice(1)) {
          await viteBuild({
            root: config.root,
            configFile: false,
            plugins: [
              buildPlugin({
                ssrTarget: 'node',
                output: `functions/${currentFunction.name}.func/${BUNDLE_NAME}`,
                outputDir: config.build.outDir,
                entry: currentFunction.entry,
                minify: pluginOptions?.minify,
                emptyOutDir: false,
                ...functionEntryHooks,
              }),
            ],
            build: {
              sourcemap: config.build.sourcemap,
            },
            publicDir: false,
          })
        }
      }

      const routes = hasMultiFunctionConfig
        ? configuredFunctions.flatMap((currentFunction) =>
            (currentFunction.routes && currentFunction.routes.length > 0
              ? currentFunction.routes
              : [{ src: getDefaultRoutePattern(currentFunction.name) }]
            ).map((route) => ({
              ...route,
              dest: route.dest ?? `/${currentFunction.name}`,
            }))
          )
        : [
            {
              src: '/(.*)',
              dest: `/${FUNCTION_NAME}`,
            },
          ]

      const buildConfig: VercelBuildConfigV3 = {
        ...pluginOptions?.vercel?.config,
        version: 3,
        routes: [
          ...(pluginOptions?.vercel?.config?.routes ?? []),
          {
            handle: 'filesystem',
          },
          ...routes,
        ],
      }

      const functionConfigs = hasMultiFunctionConfig
        ? configuredFunctions.map((currentFunction) => ({
            name: currentFunction.name,
            config: getFunctionConfig(config, pluginOptions?.vercel?.function, currentFunction.function),
          }))
        : [
            {
              name: FUNCTION_NAME,
              config: getFunctionConfig(config, pluginOptions?.vercel?.function, undefined),
            },
          ]

      const publicDirPath = resolve(config.root, config.publicDir)

      const functionConfigWrites = functionConfigs.map((item) => {
        const functionDir = hasMultiFunctionConfig
          ? resolve(outputDir, 'functions', `${item.name}.func`)
          : firstFunctionDir

        return Promise.all([
          writeJSON(resolve(functionDir, '.vc-config.json'), item.config),
          writeJSON(resolve(functionDir, 'package.json'), {
            type: 'module',
          }),
        ])
      })

      await Promise.all([
        // Copy static files to the .vercel/output/static directory
        ...(existsSync(publicDirPath)
          ? [cp(publicDirPath, resolve(outputDir, 'static'), { recursive: true })]
          : []),
        // Write the all necessary config files
        writeJSON(resolve(outputDir, 'config.json'), buildConfig),
        ...functionConfigWrites,
      ])
    },
    name: '@hono/vite-build/vercel',
  }
}

export default vercelBuildPlugin
