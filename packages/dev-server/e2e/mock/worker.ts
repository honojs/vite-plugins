import { Hono } from 'hono'
import { getRuntimeKey } from 'hono/adapter'

const app = new Hono<{
  Bindings: {
    NAME: string
    ASSETS: { fetch: typeof fetch }
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

app.get('/assets/hello.json', async (c) => {
  const res = await c.env.ASSETS.fetch(new URL('/static/hello.json', c.req.url))
  const data = await res.json()
  return c.json(data)
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

app.get('/env', (c) => {
  return c.json({ env: c.env })
})

app.get('/runtime', (c) => c.text(getRuntimeKey()))

app.get('/cache', async (c) => {
  const myCache = await caches.open('myCache')
  const res = await myCache.match(c.req.url)
  if (res) {
    return res
  }
  await myCache.put(
    c.req.url,
    new Response('cached', {
      headers: {
        'Cache-Control': 's-maxage=10',
      },
    })
  )
  return c.text('first')
})

export default app
