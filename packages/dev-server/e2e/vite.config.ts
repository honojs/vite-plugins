import { defineConfig } from 'vite'
import devServer, { defaultOptions } from '../src'
import { getEnv } from '../src/cloudflare-pages'

export default defineConfig({
  plugins: [
    devServer({
      entry: './mock/worker.ts',
      exclude: [...defaultOptions.exclude, '/app/.*'],
      env: getEnv({
        bindings: {
          NAME: 'Hono',
        },
      }),
    }),
  ],
})
