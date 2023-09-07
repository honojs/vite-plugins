import { defineConfig } from 'vite'
import devServer from '../src'

export default defineConfig({
  plugins: [
    devServer({
      entry: './test/mock/worker.ts',
      cf: {
        bindings: {
          NAME: 'Hono',
        },
      },
    }),
  ],
})
