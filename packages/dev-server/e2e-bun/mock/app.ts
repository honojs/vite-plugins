import { Hono } from 'hono'
import { getRuntimeKey } from 'hono/adapter'

const app = new Hono()

app.get('/', (c) => {
  c.header('x-via', 'vite')
  return c.html('<h1>Hello Vite!</h1>')
})

app.get('/with-nonce', (c) => {
  c.header('content-security-policy', 'script-src-elem \'self\' \'nonce-ZMuLoN/taD7JZTUXfl5yvQ==\';')
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

// @ts-expect-error the response is string
app.get('/invalid-response', () => {
  return '<h1>Hello!</h1>'
})

app.get('/invalid-error-response', (c) => {
  try {
    // @ts-expect-error the variable does not exist, intentionally
    doesNotExist = true

    return c.html('<h1>Hello Vite!</h1>')
  } catch (err) {
    return err
  }
})

app.get('/runtime', (c) => c.text(getRuntimeKey()))

export default app
