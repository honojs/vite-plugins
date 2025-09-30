import { defineConfig } from 'vite'
import devServer from '../src'

export default defineConfig(async () => {
  return {
    plugins: [
      devServer({
        entry: '../e2e/mock/worker.ts',
        base: '/foo/bar',
      }),
    ],
  }
})
