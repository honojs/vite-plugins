import { defineConfig } from 'vite'
import devServer, { defaultOptions } from '../src'

export default defineConfig({
  plugins: [
    devServer({
      entry: './test/mock/worker.ts',
      exclude: [...defaultOptions.exclude, '/app/.*'],
      cf: {
        bindings: {
          NAME: 'Hono',
        },
      },
    }),
  ],
})
