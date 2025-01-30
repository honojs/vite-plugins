import { normalize } from 'node:path'

export type Options = {
  entry: string[]
}

const normalizePaths = (paths: string[]) => {
  return paths.map((p) => {
    let normalizedPath = normalize(p).replace(/\\/g, '/')
    if (normalizedPath.startsWith('./')) {
      normalizedPath = normalizedPath.substring(2)
    }
    return '/' + normalizedPath
  })
}

export const getEntryContent = async (options: Options) => {
  const globStr = normalizePaths(options.entry)
    .map((e) => `'${e}'`)
    .join(',')
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
import {serveStatic} from 'hono/bun'

const worker = new Hono()

worker.use('/static/*', serveStatic({root: './'}))
worker.use('/favicon.ico', serveStatic({path: './favicon.ico'}))

${appStr}

export default worker`
}
