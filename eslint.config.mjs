// @ts-check
import baseConfig from '@hono/eslint-config'

/** @type {import('eslint').Linter.Config[]} */
export default [{ ignores: ['packages/*/dist/**'] }, ...baseConfig]
