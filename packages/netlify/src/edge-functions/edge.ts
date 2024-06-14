import type { Plugin } from 'vite'
import { getEntryContent } from './entry.js'
import { NetlifyOptions, baseDefaultOptions, netlifyPlugin } from '../netlify.js'

export const defaultOptions: Required<NetlifyOptions> = {
  ...baseDefaultOptions,
  outputDir: './netlify/edge-functions',
}

export const netlifyEdgePlugin = (options?: NetlifyOptions): Plugin => {
  return netlifyPlugin(
    '@hono/vite-netlify/edge-functions',
    'virtual:netlify-edge-functions-entry-module',
    getEntryContent,
    defaultOptions.outputDir,
    options
  )
}
