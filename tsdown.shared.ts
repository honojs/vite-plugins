import type { UserConfig } from 'tsdown'

export const sharedConfig = {
  unbundle: true,
  entry: ['src/**/*.ts', '!src/**/*.test.ts'],
  platform: 'node',
  publint: true,
  attw: {
    ignoreRules: ['cjs-resolves-to-esm', 'no-resolution'],
  },
  unused: {
    ignore: ['hono'],
  },
  deps: {
    skipNodeModulesBundle: true,
  },
} satisfies UserConfig
