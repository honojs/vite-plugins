import { builtinModules } from 'module'
import path from 'node:path'
import { fileURLToPath } from 'url'
import type { Plugin, UserConfig } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const defaultEntry = path.join(__dirname, 'entry', '_worker.js')

type CloudflarePagesOptions = {
  entry?: string
  outputDir?: string
  external?: string[]
  minify?: boolean
  emptyOutDir?: boolean
}

export const defaultOptions = {
  entry: defaultEntry, // node_modules/@hono/vite-cloudflare-pages/dist/entry/_worker.js
  outputDir: './dist',
  external: ['react', 'react-dom'],
  minify: true,
  emptyOutDir: true,
}

export const cloudflarePagesPlugin = (options?: CloudflarePagesOptions): Plugin => {
  const entry = options?.entry ?? defaultOptions.entry
  return {
    name: '@hono/vite-cloudflare-pages',
    config: async (): Promise<UserConfig> => {
      return {
        ssr: {
          external: options?.external ?? defaultOptions.external,
          noExternal: true,
        },
        build: {
          emptyOutDir: options?.emptyOutDir ?? defaultOptions.emptyOutDir,
          ssr: entry,
          minify: options?.minify ?? defaultOptions.minify,
          rollupOptions: {
            external: [...builtinModules, /^node:/],
            input: entry,
            output: {
              dir: options?.outputDir ?? defaultOptions.outputDir,
            },
          },
        },
      }
    },
  }
}
