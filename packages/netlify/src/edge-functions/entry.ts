import { Options, getAppEntryContent } from '../entry.js'

export const getEntryContent = (options: Options) => {
  const appStr = getAppEntryContent(options)

  return `import { Hono } from 'hono'
import { handle } from 'hono/netlify'

const worker = new Hono()

worker.use('/static/*', serveStatic({root: './dist'}))
worker.use('/favicon.ico', serveStatic({path: './dist/favicon.ico'}))

${appStr}

export default handle(worker)
export const config = { path: "/*" }`
}
