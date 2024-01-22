import { normalize } from 'node:path'

export type Options = {
  entry: string[]
}

export const getEntryContent = async (options: Options) => {
  const appStr = `const modules = import.meta.glob([${options.entry
    .map((e) => `'/${normalize(e)}'`)
    .join(',')}], { import: 'default', eager: true })
      for (const [, app] of Object.entries(modules)) {
        if (app) {
          worker.route('/', app)
          worker.notFound(app.notFoundHandler)
        }
      }`

  return `import { Hono } from 'hono';
import { serveStatic } from 'hono/cloudflare-pages';

const worker = new Hono();
worker.get('/favicon.ico', serveStatic());
worker.get('/static/*', serveStatic());

${appStr}

export default worker;`
}
