import { Options, getAppEntryContent } from '../entry.js'

export const getEntryContent = (options: Options) => {
  const appStr = getAppEntryContent(options)

  return `import { Hono } from 'hono'
import { handle } from 'hono/netlify'

const worker = new Hono()

${appStr}

export default handle(worker)`
}
