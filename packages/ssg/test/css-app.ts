import { Hono } from 'hono'
// A server module that imports CSS, as under `vite dev`
import './style.css'

const app = new Hono()

app.get('/', (c) => {
  return c.html('<html><body><h1>Hello!</h1></body></html>')
})

export default app
