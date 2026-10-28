import type { Hono } from 'hono'
import type { Plugin } from 'vite'
import { build, createLogger } from 'vite'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import cloudflareWorkersPlugin from '../src/adapter/cloudflare-workers'
import vercelBuildPlugin from '../src/adapter/vercel'
import type { BuildOptions } from '../src/base'
import buildPlugin from '../src/base'

const testDir = fileURLToPath(new URL('./mocks/app', import.meta.url))
const paths = [
  '/router',
  '/users/:id',
  '/optional/:name?',
  '/wild/*',
  '/all',
  '/submit/:id',
  '/ordered',
  '/instance',
  '/other-instance',
  '/params/:__proto__',
]
const options = (overrides: BuildOptions = {}): BuildOptions => ({
  entry: './src/server-prepared.ts',
  minify: false,
  preparedRouter: { paths },
  ...overrides,
})

const buildCode = async (
  plugin: Plugin,
  warnings: string[] = [],
  additionalPlugins: Plugin[] = []
): Promise<string> => {
  const logger = createLogger('silent')
  logger.warn = (message) => warnings.push(message)
  const result = await build({
    configFile: false,
    root: testDir,
    logLevel: 'silent',
    customLogger: logger,
    plugins: [...additionalPlugins, plugin],
    build: { write: false, outDir: '.prepared-router-test-dist' },
  })
  if (Array.isArray(result) || !('output' in result)) {
    throw new Error('Expected a single build output')
  }
  const entry = result.output.find((output) => output.type === 'chunk' && output.isEntry)
  if (!entry || entry.type !== 'chunk') {
    throw new Error('Expected an entry chunk')
  }
  return entry.code
}

let buildId = 0
const loadCode = (code: string) => {
  const source = Buffer.from(
    `${code}\n//# sourceURL=prepared-router-test-${buildId++}.mjs`
  ).toString('base64')
  return import(/* @vite-ignore */ `data:text/javascript;base64,${source}`)
}
const buildApp = async (overrides: BuildOptions = {}) => {
  const code = await buildCode(buildPlugin(options(overrides)))
  return { code, app: (await loadCode(code)).default as Hono }
}

describe.each([false, true])('Prepared router (minify %s)', (minify) => {
  let code: string
  let app: Hono

  beforeAll(async () => {
    ;({ code, app } = await buildApp({ minify }))
  })

  it('prepares the application router and omits the runtime compiler', async () => {
    expect(await (await app.request('/router')).text()).toBe('SmartRouter + PreparedRegExpRouter')
    expect(code).toContain('PreparedRegExpRouter')
    expect(code).not.toContain('buildInitParams')
    expect(code).not.toContain('buildMatcherFromPreprocessedRoutes')
  })

  it('prepares Hono distributions that import the router implementation directly', async () => {
    let directImport = false
    const code = await buildCode(
      buildPlugin(options({ minify })),
      [],
      [
        {
          name: 'direct-router-import',
          enforce: 'pre',
          transform(code, id) {
            if (!/\/hono\/dist\/hono\.js$/.test(id)) {
              return
            }
            const transformed = code.replace(
              './router/reg-exp-router/index.js',
              './router/reg-exp-router/router.js'
            )
            directImport = transformed.includes('./router/reg-exp-router/router.js')
            return transformed
          },
        },
      ]
    )
    const app = (await loadCode(code)).default as Hono
    expect(directImport).toBe(true)
    expect(await (await app.request('/router')).text()).toBe('SmartRouter + PreparedRegExpRouter')
    expect(code).not.toContain('buildInitParams')
    expect(code).not.toContain('buildMatcherFromPreprocessedRoutes')
  })

  it('preserves methods, optional parameters, wildcards, middleware order and 404s', async () => {
    const cases: [string, RequestInit | undefined, number, string][] = [
      ['/users/alice', undefined, 200, 'user:alice'],
      ['/users/alice%20bob', undefined, 200, 'user:alice bob'],
      ['/optional', undefined, 200, 'anonymous'],
      ['/optional/bob', undefined, 200, 'bob'],
      ['/wild/nested/path', undefined, 200, 'wildcard'],
      ['/wild', undefined, 200, 'wildcard'],
      ['/all', { method: 'DELETE' }, 200, 'DELETE'],
      ['/submit/42', { method: 'POST', body: 'payload' }, 200, '42:payload'],
      ['/users/alice', { method: 'HEAD' }, 200, ''],
      ['/ordered', undefined, 200, 'before:handler:after'],
      ['/missing', undefined, 404, 'missing'],
    ]
    for (const [path, init, status, body] of cases) {
      const response = await app.request(path, init)
      expect(response.status, path).toBe(status)
      expect(await response.text(), path).toBe(body)
      expect(response.headers.get('X-Prepared-Middleware'), path).toBe('visited')
    }
  })

  it('initializes an independent app on demand without sharing its handlers', async () => {
    expect(await (await app.request('/instance')).text()).toBe('first')
    expect(await (await app.request('/other-instance')).text()).toBe('second')
    expect(await (await app.request('/instance')).text()).toBe('first')
    expect(await (await app.request('/other-instance')).text()).toBe('second')
  })

  it('preserves a parameter named __proto__', async () => {
    const response = await app.request('/params/alice')
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('alice')
  })

  it('preserves custom routing keys that name Object.prototype properties', async () => {
    const { app } = await buildApp({
      minify,
      entry: './src/server-prepared-custom-path.ts',
      preparedRouter: { paths: [] },
    })
    const first = await app.request('http://constructor/')
    expect(first.status).toBe(200)
    expect(await first.text()).toBe('GET:constructor')
    for (const method of ['GET', 'POST']) {
      for (const path of ['__proto__', 'constructor', 'toString', 'hasOwnProperty', 'tenant-a']) {
        const response = await app.request('/', { method, headers: { 'X-Routing-Path': path } })
        expect(response.status, `${method} ${path}`).toBe(200)
        expect(await response.text()).toBe(`${method}:${path}`)
      }
    }
  })

  it('keeps line terminators from matching another method through the shared table', async () => {
    const { app } = await buildApp({
      minify,
      entry: './src/server-prepared-explicit.ts',
      preparedRouter: { paths: ['/users/:id', '/register', '/late'] },
    })
    for (const [encoded, decoded] of [
      ['%0A', '\n'],
      ['%0D', '\r'],
      ['%0D%0A', '\r\n'],
      ['%E2%80%A8', '\u2028'],
      ['%E2%80%A9', '\u2029'],
    ]) {
      const path = `/users/a${encoded}b`
      const unmatched = await app.request(path, { method: 'POST' })
      expect(unmatched.status, path).toBe(404)
      const matched = await app.request(path)
      expect(matched.status).toBe(200)
      expect(await matched.json()).toEqual({ id: `a${decoded}b` })
    }
    expect(await (await app.request('/users/alice', { method: 'POST' })).text()).toBe('fallback')
  })

  it('keeps explicit routers locked against late route registration', async () => {
    const { app } = await buildApp({
      minify,
      entry: './src/server-prepared-explicit.ts',
      preparedRouter: { paths: ['/users/:id', '/register', '/late'] },
    })
    expect((await app.request('/users/alice')).status).toBe(200)
    const response = await app.request('/register')
    expect(response.status).toBe(409)
    expect(await response.text()).toBe('Can not add a route since the matcher is already built.')
    expect((await app.request('/late')).status).toBe(404)
  })
})

describe('Prepared router configuration and adapters', () => {
  it('retains ordinary routing when the option is disabled', async () => {
    const { app } = await buildApp({ preparedRouter: undefined })
    expect(await (await app.request('/router')).text()).toBe('SmartRouter + RegExpRouter')
    expect(await (await app.request('/users/alice')).text()).toBe('user:alice')
  })

  it('reports incompatible manifest combinations', async () => {
    await expect(buildApp({ preparedRouter: { paths: ['/:id', '/:name'] } })).rejects.toThrow(
      /Cannot compile preparedRouter\.paths/
    )
  })

  it('reports registered paths missing from the manifest', async () => {
    const { app } = await buildApp({ preparedRouter: { paths: ['/router'] } })
    app.onError((error) => new Response(error.message, { status: 500 }))
    const response = await app.request('/router')
    expect(response.status).toBe(500)
    expect(await response.text()).toBe('Path /users/:id is not registered')
  })

  it('rejects non-segment trailing wildcards', async () => {
    await expect(buildApp({ preparedRouter: { paths: ['/foo*'] } })).rejects.toThrow(
      /unsupported non-segment wildcard/
    )
  })

  it('warns and uses ordinary routing for overlapping dynamic wildcard paths', async () => {
    const warnings: string[] = []
    const code = await buildCode(
      buildPlugin(
        options({
          entry: './src/server-prepared-fallback.ts',
          preparedRouter: { paths: ['/foo/:id/*', '/foo/:name'] },
        })
      ),
      warnings
    )
    const app = (await loadCode(code)).default as Hono
    expect(warnings).toEqual(
      expect.arrayContaining([expect.stringMatching(/Using the original RegExpRouter/)])
    )
    const get = await app.request('/foo/alice')
    expect(get.status).toBe(401)
    expect(await get.text()).toBe('unauthorized')
    const post = await app.request('/foo/alice', { method: 'POST' })
    expect(post.status).toBe(200)
    expect(await post.text()).toBe('post:alice')
    expect(app.router.name).not.toContain('PreparedRegExpRouter')
  })

  it('preserves the tiny preset', async () => {
    const { app } = await buildApp({
      entry: './src/server-prepared-tiny.ts',
      preset: 'hono/tiny',
      preparedRouter: { paths: ['/router'] },
    })
    expect(await (await app.request('/router')).text()).toBe('PatternRouter')
  })

  it('preserves explicitly configured custom routers', async () => {
    const { app } = await buildApp({
      entry: './src/server-prepared-custom.ts',
      preparedRouter: { paths: ['/router'] },
    })
    expect(await (await app.request('/router')).text()).toBe('TrieRouter')
  })

  it('prepares Vercel function builds', async () => {
    const code = await buildCode(vercelBuildPlugin(options()))
    const server = createServer((await loadCode(code)).default)
    try {
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
      const address = server.address()
      if (!address || typeof address === 'string') {
        throw new Error('Expected a TCP server address')
      }
      const response = await fetch(`http://127.0.0.1:${address.port}/router`)
      expect(response.status).toBe(200)
      expect(await response.text()).toBe('SmartRouter + PreparedRegExpRouter')
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve()))
      )
    }
  })

  it('preserves other Workers handlers alongside the prepared fetch handler', async () => {
    const code = await buildCode(
      cloudflareWorkersPlugin(options({ entry: './src/server-prepared-worker.ts' }))
    )
    const app = (await loadCode(code)).default as {
      fetch: (request: Request) => Promise<Response>
      scheduled: () => string
    }
    expect(app.scheduled()).toBe('scheduled')
    const response = await app.fetch(new Request('http://localhost/router'))
    expect(await response.text()).toBe('SmartRouter + PreparedRegExpRouter')
  })
})
