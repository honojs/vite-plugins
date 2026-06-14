import type { Plugin, PluginOption, ResolvedConfig } from 'vite'
import { existsSync, readFileSync } from 'node:fs'
import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { defaultOptions } from '../../base.js'
import nodeBuildPlugin from '../node/index.js'
import type { NodeBuildOptions } from '../node/index.js'

export type Runtime = 'nodejs20.x' | 'nodejs22.x' | 'nodejs24.x'
export type AmplifyBuildOptions = NodeBuildOptions & { runtime?: Runtime }

const AMPLIFY_DIR = '.amplify-hosting'

export default function amplifyBuildPlugin(options?: AmplifyBuildOptions): PluginOption {
  const runtime = options?.runtime ?? 'nodejs22.x'
  const outputFilename = options?.output ?? defaultOptions.output
  let config: ResolvedConfig

  const outputDir = options?.outputDir ?? './dist'
  const nodePlugin = nodeBuildPlugin({
    port: 3000,
    staticRoot: outputDir,
    ...options,
  })

  const amplifyPlugin: Plugin = {
    name: '@hono/vite-build/amplify',
    apply: options?.apply ?? defaultOptions.apply,

    configResolved(resolvedConfig) {
      config = resolvedConfig
    },

    async writeBundle() {
      const resolvedOutputDir = resolve(config.root, options?.outputDir ?? config.build.outDir)
      const amplifyDir = resolve(config.root, AMPLIFY_DIR)

      await rm(amplifyDir, { recursive: true, force: true })
      await mkdir(join(amplifyDir, 'compute', 'default'), { recursive: true })
      await mkdir(join(amplifyDir, 'static'), { recursive: true })

      await cp(
        join(resolvedOutputDir, outputFilename),
        join(amplifyDir, 'compute', 'default', outputFilename)
      )

      // Preserves /static/* URL structure that hono generates
      const staticSrc = join(resolvedOutputDir, 'static')
      if (existsSync(staticSrc)) {
        await cp(staticSrc, join(amplifyDir, 'static', 'static'), { recursive: true })
      }

      if (existsSync(config.publicDir)) {
        await cp(config.publicDir, join(amplifyDir, 'static'), { recursive: true })
      }

      await writeFile(
        join(amplifyDir, 'deploy-manifest.json'),
        generateManifest(runtime, outputFilename, getHonoVersion(config.root))
      )
    },
  }

  return [nodePlugin, amplifyPlugin]
}

function getHonoVersion(root: string): string {
  try {
    const pkg = JSON.parse(
      readFileSync(join(root, 'node_modules', 'hono', 'package.json'), 'utf-8')
    )
    return pkg.version ?? '0.0.0'
  } catch {
    return '0.0.0'
  }
}

function generateManifest(runtime: Runtime, entrypoint: string, honoVersion: string): string {
  return JSON.stringify(
    {
      version: 1,
      framework: { name: 'hono', version: honoVersion },
      routes: [
        {
          path: '/static/*',
          target: {
            kind: 'Static',
            cacheControl: 'public, max-age=31536000, immutable',
          },
        },
        {
          path: '/*.*',
          target: { kind: 'Static' },
          fallback: { kind: 'Compute', src: 'default' },
        },
        {
          path: '/*',
          target: { kind: 'Compute', src: 'default' },
        },
      ],
      computeResources: [{ name: 'default', runtime, entrypoint }],
    },
    null,
    2
  )
}
