import type { Plugin, ResolvedConfig } from 'vite'
import { existsSync, mkdirSync } from 'node:fs'
import { cp, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { BuildOptions } from '../../base.js'
import buildPlugin from '../../base.js'
import type { VercelBuildConfigV3, VercelServerlessFunctionConfig } from './types.js'

export type VercelBuildOptions = {
  vercel?: {
    config?: VercelBuildConfigV3
    function?: VercelServerlessFunctionConfig
  }
} & Omit<BuildOptions, 'output' | 'outputDir'>

const BUNDLE_NAME = 'index.js'
const FUNCTION_NAME = '__hono'

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

const vercelBuildPlugin = (pluginOptions?: VercelBuildOptions): Plugin => {
  let config: ResolvedConfig

  return {
    ...buildPlugin({
      ssrTarget: 'node',
      output: `functions/${FUNCTION_NAME}.func/${BUNDLE_NAME}`,
      outputDir: '.vercel/output',
      ...{
        entryContentAfterHooks: [
          // eslint-disable-next-line quotes
          () => "import { handle } from '@hono/node-server/vercel'",
        ],
        entryContentDefaultExportHook: (appName) => `export default handle(${appName})`,
      },
      ...pluginOptions,
    }),
    configResolved: (resolvedConfig) => {
      config = resolvedConfig
    },
    writeBundle: async () => {
      const outputDir = resolve(config.root, config.build.outDir)
      const functionDir = resolve(outputDir, 'functions', `${FUNCTION_NAME}.func`)

      const buildConfig: VercelBuildConfigV3 = {
        ...pluginOptions?.vercel?.config,
        version: 3,
        routes: [
          ...(pluginOptions?.vercel?.config?.routes ?? []),
          {
            handle: 'filesystem',
          },
          {
            src: '/(.*)',
            dest: `/${FUNCTION_NAME}`,
          },
        ],
      }

      const functionConfig: VercelServerlessFunctionConfig = {
        ...pluginOptions?.vercel?.function,
        runtime: getRuntimeVersion(),
        launcherType: 'Nodejs',
        handler: BUNDLE_NAME,
        shouldAddHelpers: Boolean(pluginOptions?.vercel?.function?.shouldAddHelpers),
        shouldAddSourcemapSupport: Boolean(config.build.sourcemap),
        supportsResponseStreaming: true,
      }

      await Promise.all([
        // Copy static files to the .vercel/output/static directory
        cp(resolve(config.root, config.publicDir), resolve(outputDir, 'static'), {
          recursive: true,
        }),
        // Write the all necessary config files
        writeJSON(resolve(outputDir, 'config.json'), buildConfig),
        writeJSON(resolve(functionDir, '.vc-config.json'), functionConfig),
        writeJSON(resolve(functionDir, 'package.json'), {
          type: 'module',
        }),
      ])
    },
    name: '@hono/vite-build/vercel',
  }
}

export default vercelBuildPlugin
