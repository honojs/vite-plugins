import { defineConfig } from 'vite'
import devServer, { defaultOptions } from '../src'
import pages from '../src/cloudflare-pages'

export default defineConfig({
  plugins: [
    devServer({
      entry: './mock/worker.ts',
      exclude: [...defaultOptions.exclude, '/app/**'],
      plugins: [
        pages({
          bindings: {
            NAME: 'Hono',
          },
        }),
      ],
    }),
  ],
})
