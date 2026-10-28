import { Hono } from 'hono'
import { RegExpRouter } from 'hono/router/reg-exp-router'

const app = new Hono({ router: new RegExpRouter() })
app.get('/users/:id', (c) => c.json(c.req.param()))
app.post('*', (c) => c.text('fallback'))
app.get('/register', (c) => {
  try {
    app.get('/late', (c) => c.text('late'))
    return c.text('registered')
  } catch (error) {
    return c.text((error as Error).message, 409)
  }
})

export default app
