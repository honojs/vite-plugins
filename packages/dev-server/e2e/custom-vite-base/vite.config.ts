import { defineConfig } from 'vite'
import devServer from '../../src'

export default defineConfig(async () => {
  return {
    base: '/docs/',
    plugins: [
      devServer({
        entry: '../basic/mock/worker.ts',
      }),
    ],
  }
})
