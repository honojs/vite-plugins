import fs from 'node:fs/promises'
import path from 'node:path'
import type { Hono } from 'hono'
import { toSSG } from 'hono/ssg'
import type { Plugin } from 'vite'
import { createServer } from 'vite'

type BuildConfig = {
  outputDir?: string
  publicDir?: string
}

type SSGOptions = {
  entry?: string
  tempDir?: string
  build?: BuildConfig
}

export const defaultOptions: Required<SSGOptions> = {
  entry: './src/index.tsx',
  tempDir: '.hono',
  build: {
    outputDir: '../dist',
    publicDir: '../public',
  },
}

export const ssgBuild = (options?: SSGOptions): Plugin => {
  const entry = options?.entry ?? defaultOptions.entry
  const tempDir = options?.tempDir ?? defaultOptions.tempDir
  return {
    name: '@hono/vite-ssg',
    apply: 'build',
    config: async () => {
      // Create a server to load the module
      const server = await createServer({
        plugins: [],
        build: { ssr: true },
      })
      const module = await server.ssrLoadModule(entry)
      server.close()

      const app = module['default'] as Hono

      if (!app) {
        throw new Error(`Failed to find a named export "default" from ${entry}`)
      }

      console.log(`Built files into temp directory: ${tempDir}`)

      const result = await toSSG(app, fs, { dir: tempDir })

      if (!result.success) {
        throw result.error
      }

      if (result.files) {
        for (const file of result.files) {
          console.log(`Generated: ${file}`)
        }
      }

      return {
        root: tempDir,
        publicDir: options?.build?.publicDir ?? defaultOptions.build.publicDir,
        build: {
          outDir: options?.build?.outputDir ?? defaultOptions.build.outputDir,
          rollupOptions: {
            input: result.files ? [...result.files] : [],
          },
          emptyOutDir: true,
        },
      }
    },
  }
}
