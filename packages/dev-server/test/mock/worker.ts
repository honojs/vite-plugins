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

app.get('/name', (c) => c.html(`<h1>My name is ${c.env.NAME}</h1>`))

app.get('/wait-until', (c) => {
  const fn = async () => {}
  c.executionCtx.waitUntil(fn())
  return c.html('<h1>Hello Vite!</h1>')
})

app.get('/file.ts', (c) => {
  return c.text('console.log("exclude me!")')
})

app.get('/app/foo', (c) => {
  return c.html('<h1>exclude me!</h1>')
})

app.get('/ends-in-ts', (c) => {
  return c.text('this should not be excluded')
})

app.get('/favicon.ico', (c) => {
  return c.text('a good favicon')
})

app.get('/static/foo.png', (c) => {
  return c.text('a good image')
})

app.get('/stream', () => {
  const html = new TextEncoder().encode('<h1>Hello Vite!</h1>')
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(html)
      controller.close()
    },
  })
  return new Response(stream, {
    headers: { 'Content-Type': 'text/html', 'x-via': 'vite' },
  })
})

export default app
