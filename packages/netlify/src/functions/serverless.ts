import type { Plugin } from 'vite'
import { getEntryContent } from './entry.js'
import { NetlifyOptions, baseDefaultOptions, netlifyPlugin } from '../netlify.js'

export const defaultOptions: Required<NetlifyOptions> = {
  ...baseDefaultOptions,
  outputDir: './netlify/functions',
}

export const netlifyServerlessPlugin = (options?: NetlifyOptions): Plugin => {
  return netlifyPlugin(
    '@hono/vite-netlify/functions',
    'virtual:netlify-serverless-functions-entry-module',
    getEntryContent,
    defaultOptions.outputDir,
    options
  )
}
