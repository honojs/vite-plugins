import { expect, request } from '@playwright/test'
import { prepareDevServerSetup, test } from '../utils'

const startApp = prepareDevServerSetup('basic')

test.describe('basic', () => {
  let port: number
  let stopApp: () => Promise<void>

  test.beforeAll(async () => {
    ;({ port, stopApp } = await startApp())
  })

  test.afterAll(async () => {
    await stopApp()
  })

  test('Should return 200 response', async ({ page }) => {
    const response = await page.goto(`http://localhost:${port}/`)
    expect(response?.status()).toBe(200)

    const headers = response?.headers() ?? {}
    expect(headers['x-via']).toBe('vite')

    const content = await page.textContent('h1')
    expect(content).toBe('Hello Vite!')
  })

  test('Should contain an injected script tag', async ({ page }) => {
    await page.goto(`http://localhost:${port}/`)

    const lastScriptTag = await page.$('script:last-of-type')
    expect(lastScriptTag).not.toBeNull()

    const nonce = await lastScriptTag?.getAttribute('nonce')
    expect(nonce).toBeNull()

    const content = await lastScriptTag?.textContent()
    expect(content).toBe('import("/@vite/client")')
  })

  test('Should contain an injected script tag with a nonce', async ({ page }) => {
    await page.goto(`http://localhost:${port}/with-nonce`)

    const lastScriptTag = await page.$('script:last-of-type')
    expect(lastScriptTag).not.toBeNull()

    const nonce = await lastScriptTag?.getAttribute('nonce')
    expect(nonce).not.toBeNull()

    const content = await lastScriptTag?.textContent()
    expect(content).toBe('import("/@vite/client")')
  })

  test('Should have Cloudflare bindings', async ({ page }) => {
    const response = await page.goto(`http://localhost:${port}/name`)
    expect(response?.status()).toBe(200)

    const content = await page.textContent('h1')
    expect(content).toBe('My name is Hono')
  })

  test('Should not throw an error if using `waitUntil`', async ({ page }) => {
    const response = await page.goto(`http://localhost:${port}/wait-until`)
    expect(response?.status()).toBe(200)

    const content = await page.textContent('h1')
    expect(content).toBe('Hello Vite!')
  })

  test('Should exclude the file specified in the config file', async ({ page }) => {
    let response = await page.goto(`http://localhost:${port}/file.ts`)
    expect(response?.status()).toBe(404)

    response = await page.goto(`http://localhost:${port}/ends-in-ts`)
    expect(response?.status()).toBe(200)

    response = await page.goto(`http://localhost:${port}/app/foo`)
    expect(response?.status()).toBe(404)

    response = await page.goto(`http://localhost:${port}/favicon.ico`)
    expect(response?.status()).toBe(404)

    response = await page.goto(`http://localhost:${port}/static/foo.png`)
    expect(response?.status()).toBe(404)
  })

  test('Should return 200 response - /stream', async ({ page }) => {
    const response = await page.goto(`http://localhost:${port}/stream`)
    expect(response?.status()).toBe(200)

    const headers = response?.headers() ?? {}
    expect(headers['x-via']).toBe('vite')

    const content = await page.textContent('h1')
    expect(content).toBe('Hello Vite!')
  })

  test('Should return a vite error page - /invalid-response', async ({ page }) => {
    const response = await page.goto(`http://localhost:${port}/invalid-response`)
    expect(response?.status()).toBe(500)
    expect(await response?.text()).toContain('ErrorOverlay')
  })

  test('Should return a vite error page with stack trace - /invalid-error-response', async ({
    page,
  }) => {
    const response = await page.goto(`http://localhost:${port}/invalid-error-response`)
    expect(response?.status()).toBe(500)
    expect(await response?.text()).toContain('mock/worker.ts')
  })

  test('Should set `workerd` as a runtime key', async ({ page }) => {
    const res = await page.goto(`http://localhost:${port}/runtime`)
    expect(res?.ok()).toBe(true)
    expect(await res?.text()).toBe('workerd')
  })

  test('Should not throw an error if accessing the `caches`', async ({ page }) => {
    const res = await page.goto(`http://localhost:${port}/cache`)
    expect(res?.ok()).toBe(true)
    expect(await res?.text()).toBe('first')
    const resCached = await page.goto(`http://localhost:${port}/cache`)
    expect(resCached?.ok()).toBe(true)
    // Cache API provided by `getPlatformProxy` currently do nothing.
    // It does **not** return cached content.
    expect(await resCached?.text()).not.toBe('cached')
  })

  test('Should set `cf` properties', async ({ page }) => {
    const res = await page.goto(`http://localhost:${port}/cf`)
    expect(res?.ok()).toBe(true)
    expect(await res?.json()).toEqual({ cf: true })
  })

  test('Should return files in the public directory', async ({ page }) => {
    const res = await page.goto(`http://localhost:${port}/hono-logo.png`)
    expect(res?.status()).toBe(200)
  })

  test('Should not crash when receiving a HEAD request', async () => {
    const apiContext = await request.newContext({
      baseURL: `http://localhost:${port}`,
    })
    const response = await apiContext.fetch('/', {
      method: 'HEAD',
    })

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toMatch(/^text\/html/)
    const body = await response.body()
    expect(body.length).toBe(0)
    await apiContext.dispose()
  })

  test('Should return ip address', async ({ page }) => {
    const response = await page.goto(`http://localhost:${port}/ip`)
    expect(['127.0.0.1', '::1'].includes((await response?.text()) ?? '')).toBe(true)
  })
})
