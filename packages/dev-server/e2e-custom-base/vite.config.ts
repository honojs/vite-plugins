import { defineConfig } from 'vite'
import devServer from '../src'

export default defineConfig(async () => {
  return {
    base: '/docs/',
    plugins: [
      devServer({
        entry: '../e2e/mock/worker.ts',
      }),
    ],
  }
})
