import { Hono } from 'hono'

const app = new Hono<{
  Bindings: {
    NAME: string
  }
}>()

app.get('/', (c) => c.html('<h1>Hello Vite!</h1>'))
app.get('/name', (c) => c.html(`<h1>My name is ${c.env.NAME}</h1>`))
app.get('/wait-until', (c) => {
  const fn = async () => {}
  c.executionCtx.waitUntil(fn())
  return c.html('<h1>Hello Vite!</h1>')
})

export default app
