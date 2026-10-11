import { Hono } from 'hono'
// Node.js builtin modules, without and with the `node:` prefix
import { existsSync } from 'fs'
import { join } from 'node:path'

const app = new Hono()

app.get('/', (c) => {
  return c.text(existsSync(join('.', 'package.json')) ? 'found' : 'missing')
})

export default app
