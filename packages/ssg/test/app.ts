import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.html('<html><body><h1>Hello!</h1></body></html>')
})

export default app
