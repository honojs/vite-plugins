import { normalize } from 'node:path'

export type Options = {
  entry: string[]
}

export const getEntryContent = async (options: Options) => {
  const globStr = options.entry.map((e) => `'/${normalize(e)}'`).join(',')
  const appStr = `const modules = import.meta.glob([${globStr}], { import: 'default', eager: true })
      let added = false
      for (const [, app] of Object.entries(modules)) {
        if (app) {
          worker.route('/', app)
          worker.notFound(app.notFoundHandler)
          added = true
        }
      }
      if (!added) {
        throw new Error("Can't import modules from [${globStr}]")
      }
      `

  return `import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-pages'

const worker = new Hono()
worker.get('/favicon.ico', serveStatic())
worker.get('/static/*', serveStatic())

${appStr}

export default worker`
}
