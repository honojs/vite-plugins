import type { Plugin, ResolvedConfig, UserConfig } from 'vite'
import { builtinModules } from 'module'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { cp, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { BuildOptions } from '../../base.js'
import { defaultOptions } from '../../base.js'
import { getEntryContent } from '../../entry/index.js'
import type { VercelBuildConfigV3, VercelNodejsServerlessFunctionConfig } from './types.js'

type VercelSourceRoute = Extract<NonNullable<VercelBuildConfigV3['routes']>[number], { src: string }>

type VercelRouteConfig = Array<Omit<VercelSourceRoute, 'dest'> & { dest?: string }>

export type VercelBuildOptions = {
  vercel?: {
    config?: VercelBuildConfigV3
    function?: Partial<VercelNodejsServerlessFunctionConfig>
    name?: string
    routes?: VercelRouteConfig
  }
} & Omit<BuildOptions, 'output' | 'outputDir'>

const BUNDLE_NAME = 'index.js'
const DEFAULT_FUNCTION_NAME = '__hono'
const VIRTUAL_ENTRY_PREFIX = 'virtual:build-entry-module-vercel-'

const functionEntryHooks = {
  entryContentAfterHooks: [
    // eslint-disable-next-line quotes
    () => "import { handle } from '@hono/node-server/vercel'",
  ],
  entryContentDefaultExportHook: (appName: string) => `export default handle(${appName})`,
}

const configWriteQueues = new Map<string, Promise<void>>()

const writeJSON = (path: string, data: Record<string, unknown>) => {
  const dir = resolve(path, '..')
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return writeFile(path, JSON.stringify(data))
}

const readJSON = <T extends Record<string, unknown>>(path: string): T | undefined => {
  if (!existsSync(path)) {
    return
  }

  return JSON.parse(readFileSync(path, 'utf-8')) as T
}

const enqueueConfigWrite = async (key: string, writeTask: () => Promise<void>) => {
  const previousTask = configWriteQueues.get(key)
  if (previousTask) {
    await previousTask
  }

  const nextTask = writeTask()
  configWriteQueues.set(key, nextTask)

  try {
    await nextTask
  } finally {
    if (configWriteQueues.get(key) === nextTask) {
      configWriteQueues.delete(key)
    }
  }
}

const getRuntimeVersion = () => {
  try {
    const systemNodeVersion = process.versions.node.split('.')[0]
    return `nodejs${Number(systemNodeVersion)}.x` as const
  } catch {
    return 'nodejs22.x' as const
  }
}

const escapeRouteSegment = (value: string) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const getDefaultRoutePattern = (functionName: string) => {
  return `^/${escapeRouteSegment(functionName)}(?:/.*)?$`
}

const appendRouteIfMissing = (
  target: NonNullable<VercelBuildConfigV3['routes']>,
  seen: Set<string>,
  route: NonNullable<VercelBuildConfigV3['routes']>[number]
) => {
  const key = JSON.stringify(route)
  if (seen.has(key)) {
    return
  }
  seen.add(key)
  target.push(route)
}

const getFunctionConfig = (
  config: ResolvedConfig,
  functionConfig: Partial<VercelNodejsServerlessFunctionConfig> | undefined
): VercelNodejsServerlessFunctionConfig => {
  return {
    ...functionConfig,
    runtime: getRuntimeVersion(),
    launcherType: 'Nodejs',
    handler: BUNDLE_NAME,
    shouldAddHelpers: Boolean(functionConfig?.shouldAddHelpers),
    shouldAddSourcemapSupport: Boolean(config.build.sourcemap),
    supportsResponseStreaming: true,
  }
}

const getRoutesForFunction = (functionName: string, configuredRoutes: VercelRouteConfig | undefined) => {
  if (configuredRoutes && configuredRoutes.length > 0) {
    return configuredRoutes
  }

  if (functionName === DEFAULT_FUNCTION_NAME) {
    return [{ src: '/(.*)', dest: `/${DEFAULT_FUNCTION_NAME}` }]
  }

  return [{ src: getDefaultRoutePattern(functionName), dest: `/${functionName}` }]
}

const mergeVercelConfig = async (
  configPath: string,
  routesToAdd: VercelSourceRoute[],
  configOverride: VercelBuildConfigV3 | undefined,
  functionName: string
) => {
  const existingConfig = readJSON<VercelBuildConfigV3>(configPath)
  const mergedRoutes: NonNullable<VercelBuildConfigV3['routes']> = []
  const seenRoutes = new Set<string>()

  for (const route of existingConfig?.routes ?? []) {
    appendRouteIfMissing(mergedRoutes, seenRoutes, route)
  }

  for (const route of configOverride?.routes ?? []) {
    appendRouteIfMissing(mergedRoutes, seenRoutes, route)
  }

  appendRouteIfMissing(mergedRoutes, seenRoutes, { handle: 'filesystem' })

  for (const route of routesToAdd) {
    appendRouteIfMissing(mergedRoutes, seenRoutes, {
      ...route,
      dest: route.dest ?? `/${functionName}`,
    })
  }

  const buildConfig: VercelBuildConfigV3 = {
    ...existingConfig,
    ...configOverride,
    version: 3,
    routes: mergedRoutes,
  }

  await writeJSON(configPath, buildConfig)
}

const copyStaticFiles = async (publicDirPath: string, outputDir: string) => {
  if (!existsSync(publicDirPath)) {
    return
  }

  try {
    await cp(publicDirPath, resolve(outputDir, 'static'), {
      recursive: true,
      force: true,
    })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error
    }
  }
}

const vercelBuildPlugin = (pluginOptions?: VercelBuildOptions): Plugin => {
  let config: ResolvedConfig

  const functionName = pluginOptions?.vercel?.name ?? DEFAULT_FUNCTION_NAME
  if (!functionName) {
    throw new Error('`vercel.name` is required and cannot be empty.')
  }

  const virtualEntryId = `${VIRTUAL_ENTRY_PREFIX}${functionName}`
  const resolvedVirtualEntryId = `\0${virtualEntryId}`

  return {
    name: '@hono/vite-build/vercel',
    apply: pluginOptions?.apply ?? defaultOptions.apply,
    resolveId(id) {
      if (id === virtualEntryId) {
        return resolvedVirtualEntryId
      }
    },
    async load(id) {
      if (id !== resolvedVirtualEntryId) {
        return
      }

      const entry = pluginOptions?.entry ?? defaultOptions.entry
      return await getEntryContent({
        entry: Array.isArray(entry) ? entry : [entry],
        entryContentBeforeHooks: pluginOptions?.entryContentBeforeHooks,
        entryContentAfterHooks: pluginOptions?.entryContentAfterHooks ?? functionEntryHooks.entryContentAfterHooks,
        entryContentDefaultExportHook:
          pluginOptions?.entryContentDefaultExportHook ?? functionEntryHooks.entryContentDefaultExportHook,
        staticPaths: pluginOptions?.staticPaths,
        preset: pluginOptions?.preset,
      })
    },
    configResolved: (resolvedConfig: ResolvedConfig) => {
      config = resolvedConfig
    },
    config: async (): Promise<UserConfig> => {
      return {
        ssr: {
          external: pluginOptions?.external ?? defaultOptions.external,
          noExternal: true,
          target: 'node',
        },
        build: {
          outDir: '.vercel/output',
          emptyOutDir: pluginOptions?.emptyOutDir ?? defaultOptions.emptyOutDir,
          minify: pluginOptions?.minify ?? defaultOptions.minify,
          ssr: true,
          rollupOptions: {
            external: [...builtinModules, /^node:/],
            input: {
              [functionName]: virtualEntryId,
            },
            output: {
              entryFileNames: `functions/[name].func/${BUNDLE_NAME}`,
            },
          },
        },
      }
    },
    writeBundle: async () => {
      const outputDir = resolve(config.root, config.build.outDir)
      const functionDir = resolve(outputDir, 'functions', `${functionName}.func`)
      const configPath = resolve(outputDir, 'config.json')
      const publicDirPath = resolve(config.root, config.publicDir)

      const routesToAdd = getRoutesForFunction(functionName, pluginOptions?.vercel?.routes)

      const functionConfig = getFunctionConfig(config, pluginOptions?.vercel?.function)

      await copyStaticFiles(publicDirPath, outputDir)

      await Promise.all([
        writeJSON(resolve(functionDir, '.vc-config.json'), functionConfig),
        writeJSON(resolve(functionDir, 'package.json'), {
          type: 'module',
        }),
      ])

      await enqueueConfigWrite(configPath, async () => {
        await mergeVercelConfig(configPath, routesToAdd, pluginOptions?.vercel?.config, functionName)
      })
    },
  }
}

export default vercelBuildPlugin
