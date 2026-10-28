import { Hono } from 'hono'

const app = new Hono({
  getPath: (request) => request.headers.get('X-Routing-Path') ?? new URL(request.url).hostname,
})
app.get('*', (c) => c.text(`GET:${c.req.path}`))
app.post('/*', (c) => c.text(`POST:${c.req.path}`))

export default app
