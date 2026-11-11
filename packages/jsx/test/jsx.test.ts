import { createServer } from 'vite'
import type { ViteDevServer } from 'vite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { fileURLToPath } from 'node:url'
import honoJsx from '../src/index'

describe('@hono/vite-jsx', () => {
  const root = fileURLToPath(new URL('./fixtures/', import.meta.url))
  let server: ViteDevServer

  beforeAll(async () => {
    server = await createServer({
      configFile: false,
      root,
      logLevel: 'silent',
      server: { middlewareMode: true, ws: false },
      plugins: [honoJsx()],
    })
  })

  afterAll(async () => {
    await server.close()
  })

  const transform = async (name: string, environment: 'client' | 'ssr' = 'client') => {
    const result = await server.environments[environment].transformRequest(`/${name}`)
    return result!.code
  }

  it('Should compile JSX with hono/jsx', async () => {
    expect(await transform('Counter.tsx', 'ssr')).toContain('hono/jsx/jsx-dev-runtime')
  })

  it('Should resolve hono/jsx to hono/jsx/dom in the browser', async () => {
    const importer = root + 'Counter.tsx'
    const client = await server.environments.client.pluginContainer.resolveId('hono/jsx', importer)
    const ssr = await server.environments.ssr.pluginContainer.resolveId('hono/jsx', importer)
    expect(client?.id).toMatch(/jsx[/_]dom/)
    expect(ssr?.id).not.toMatch(/jsx[/_]dom/)
  })

  it('Should wrap components and accept the update', async () => {
    const code = await transform('Counter.tsx')
    expect(code).toContain('__refresh(')
    expect(code).toContain('"Counter"')
    expect(code).toContain('"Arrow"')
    expect(code).toContain('import.meta.hot.accept()')
  })

  it('Should not accept the update of a file that exports something else', async () => {
    const code = await transform('Mixed.tsx')
    expect(code).toContain('"Label"')
    expect(code).not.toContain('import.meta.hot.accept()')
  })

  it('Should add the generation to the deps of a hook', async () => {
    expect(await transform('Effect.tsx')).toContain('__withGeneration([], __generation)')
  })

  it('Should not wrap a capitalized function that does not call JSX or a hook', async () => {
    expect(await transform('Point.ts')).not.toContain('__refresh')
  })

  it('Should not transform the code for the server', async () => {
    expect(await transform('Counter.tsx', 'ssr')).not.toContain('__refresh')
  })
})
