import { Hono } from 'hono'
// @ts-expect-error - for import alias test
import * as aliasModule from '@/alias-module'

const app = new Hono()

app.get('/', (c) => {
  return c.html('<html><body><h1>Hello!</h1></body></html>')
})

app.get('/dynamic-import', async (c) => {
  // @ts-expect-error this is a test
  const module = await import('./sample.js')
  return c.text('Dynamic import works: ' + module.default)
})

app.get('/alias-module', (c) => {
  return c.text(aliasModule.foo)
})

export default app
