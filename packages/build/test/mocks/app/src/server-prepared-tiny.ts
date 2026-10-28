import { Hono } from 'hono/tiny'

const app = new Hono()
app.get('/router', (c) => c.text(app.router.name))

export default app
