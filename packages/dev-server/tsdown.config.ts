import { defineConfig } from 'tsdown'
import { sharedConfig } from '../../tsdown.shared.ts'

export default defineConfig({
  ...sharedConfig,
  format: ['esm', 'cjs'],
})
