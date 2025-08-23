import { Hono } from 'hono'

const app = new Hono<{
  Bindings: {
    NAME: string
  }
}>()

app.get('/', (c) => {
  c.header('x-via', 'vite')
  return c.html('<h1>Hello Vite!</h1>')
})

app.get('/app/foo', (c) => {
  return c.html('<h1>exclude me!</h1>')
})

export default app
