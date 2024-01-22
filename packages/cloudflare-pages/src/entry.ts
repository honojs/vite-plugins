export type Options = {
  entry?: string
}

export const defaultOptions: Required<Options> = {
  entry: '/src/index',
}

export const getEntryContent = (options: Options) => {
  return `import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-pages'
import app from '${options.entry ?? defaultOptions.entry}'

const worker = new Hono()
worker.get('/favicon.ico', serveStatic())
worker.get('/static/*', serveStatic())

worker.route('/', app)
worker.notFound(app.notFoundHandler)

export default worker`
}
