import { defineConfig } from 'vite'
import devServer, { defaultOptions } from '../../src'
import cloudflareAdapter from '../../src/adapter/cloudflare'

export default defineConfig(async () => {
  return {
    plugins: [
      devServer({
        entry: './mock/worker.ts',
        exclude: [...defaultOptions.exclude, '/app/**'],
        adapter: cloudflareAdapter,
      }),
    ],
  }
})
