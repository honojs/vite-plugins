import type { Plugin, ResolvedConfig } from 'vite'
import { existsSync, mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { BuildOptions } from '../../base.js'
import buildPlugin from '../../base.js'
import type { VercelBuildConfigV3 } from './types.js'

export type VercelBuildOptions = {
  buildConfig?: VercelBuildConfigV3
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
    return `nodejs${systemNodeVersion}.x`
  } catch {
    return 'nodejs22.x'
  }
}

const vercelBuildPlugin = (pluginOptions?: VercelBuildOptions): Plugin => {
  let config: ResolvedConfig

  return {
    ...buildPlugin({
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
      const buildConfig: VercelBuildConfigV3 = {
        ...pluginOptions?.buildConfig,
        version: 3,
        routes: [
          ...(pluginOptions?.buildConfig?.routes ?? []),
          {
            src: '/(.*)',
            dest: `/${FUNCTION_NAME}`,
          },
        ],
      }

      const funcFolder = resolve(
        config.root,
        config.build.outDir,
        'functions',
        `${FUNCTION_NAME}.func`
      )

      await Promise.all([
        writeJSON(resolve(config.root, config.build.outDir, 'config.json'), buildConfig),
        writeJSON(resolve(funcFolder, 'package.json'), {
          type: 'module',
        }),
        writeJSON(resolve(funcFolder, '.vc-config.json'), {
          launcherType: 'Nodejs',
          runtime: getRuntimeVersion(),
          handler: BUNDLE_NAME,
          shouldAddHelpers: true,
          shouldAddSourcemapSupport: Boolean(config.build.sourcemap),
          supportsResponseStreaming: true,
        }),
      ])
    },
    name: '@hono/vite-build/vercel',
  }
}

export default vercelBuildPlugin
