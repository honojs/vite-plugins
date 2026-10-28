import { Hono } from 'hono'
import { TrieRouter } from 'hono/router/trie-router'

const app = new Hono({ router: new TrieRouter() })
app.get('/router', (c) => c.text(app.router.name))

export default app
