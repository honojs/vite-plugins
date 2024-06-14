export type NetlifyOptions = {
  /**
   * @default ['./src/index.tsx', './app/server.ts']
   */
  entry?: string | string[]
  /**
   * @default './dist'
   */
  outputDir?: string
  external?: string[]
  /**
   * @default true
   */
  minify?: boolean
  emptyOutDir?: boolean
}

export const baseDefaultOptions: Required<Omit<NetlifyOptions, 'outputDir'>> = {
  entry: ['./src/index.tsx', './app/server.ts'],
  external: [],
  minify: true,
  emptyOutDir: false,
}
