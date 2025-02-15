export type BaseNetlifyOptions = {
  /**
   * @default ['./src/index.tsx', './app/server.ts']
   */
  entry?: string | string[]
  external?: string[]
  /**
   * @default true
   */
  minify?: boolean
  emptyOutDir?: boolean
}

export const baseDefaultOptions = {
  entry: ['./src/index.tsx', './app/server.ts'],
  external: [],
  minify: true,
  emptyOutDir: false,
}
