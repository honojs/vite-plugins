import { Hono } from 'hono'

const app = new Hono()
const other = new Hono()

app.use('*', async (c, next) => {
  await next()
  c.header('X-Prepared-Middleware', 'visited')
})
app.get('/router', (c) => c.text(app.router.name))
app.get('/users/:id', (c) => c.text(`user:${c.req.param('id')}`))
app.get('/optional/:name?', (c) => c.text(c.req.param('name') ?? 'anonymous'))
app.get('/wild/*', (c) => c.text('wildcard'))
app.all('/all', (c) => c.text(c.req.method))
app.post('/submit/:id', async (c) => c.text(`${c.req.param('id')}:${await c.req.text()}`))
app.get(
  '/ordered',
  async (c, next) => {
    await next()
    c.res = new Response(`before:${await c.res.text()}:after`, c.res)
  },
  (c) => c.text('handler')
)
app.get('/params/:__proto__', (c) => c.text(c.req.param('__proto__') ?? 'missing'))
app.get('/instance', (c) => c.text('first'))
other.get('/instance', (c) => c.text('second'))
app.get('/other-instance', () => other.request('/instance'))
app.notFound((c) => c.text('missing', 404))

export default app
