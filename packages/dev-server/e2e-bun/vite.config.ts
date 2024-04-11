import { defineConfig } from 'vite'
import devServer, { defaultOptions } from '../src'

export default defineConfig(async () => {
  return {
    plugins: [
      devServer({
        entry: './mock/app.ts',
        exclude: [...defaultOptions.exclude, '/app/**'],
      }),
    ],
  }
})
