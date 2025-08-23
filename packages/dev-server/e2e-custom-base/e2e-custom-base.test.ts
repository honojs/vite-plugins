import { test, expect, request } from '@playwright/test'

test('Should return 404 response', async ({ page }) => {
  const response = await page.goto('/')
  expect(await response?.text()).toContain('not handled by the hono server')
  expect(response?.status()).toBe(404)
})

test('Should contain an injected script tag', async ({ page }) => {
  const response = await page.goto('/docs/')
  expect(response?.status()).toBe(200)

  const lastScriptTag = await page.$('script:last-of-type')
  expect(lastScriptTag).not.toBeNull()

  const nonce = await lastScriptTag?.getAttribute('nonce')
  expect(nonce).toBeNull()

  const content = await lastScriptTag?.textContent()
  expect(content).toBe('import("/docs/@vite/client")')
})

test('Should contain an injected script tag with a nonce', async ({ page }) => {
  await page.goto('/docs/with-nonce')

  const lastScriptTag = await page.$('script:last-of-type')
  expect(lastScriptTag).not.toBeNull()

  const nonce = await lastScriptTag?.getAttribute('nonce')
  expect(nonce).not.toBeNull()

  const content = await lastScriptTag?.textContent()
  expect(content).toBe('import("/docs/@vite/client")')
})

test('Should have Cloudflare bindings', async ({ page }) => {
  const response = await page.goto('/docs/name')
  expect(response?.status()).toBe(200)

  const content = await page.textContent('h1')
  expect(content).toBe('My name is Hono')
})

test('Should not throw an error if using `waitUntil`', async ({ page }) => {
  const response = await page.goto('/docs/wait-until')
  expect(response?.status()).toBe(200)

  const content = await page.textContent('h1')
  expect(content).toBe('Hello Vite!')
})

test('Should exclude the file specified in the config file', async ({ page }) => {
  let response = await page.goto('/docs/file.ts')
  expect(response?.status()).toBe(404)

  response = await page.goto('/docs/ends-in-ts')
  expect(response?.status()).toBe(200)

  response = await page.goto('/docs/app/foo')
  expect(response?.status()).toBe(404)

  response = await page.goto('/docs/favicon.ico')
  expect(response?.status()).toBe(404)

  response = await page.goto('/docs/static/foo.png')
  expect(response?.status()).toBe(404)
})

test('Should return 200 response - /stream', async ({ page }) => {
  const response = await page.goto('/docs/stream')
  expect(response?.status()).toBe(200)

  const headers = response?.headers() ?? {}
  expect(headers['x-via']).toBe('vite')

  const content = await page.textContent('h1')
  expect(content).toBe('Hello Vite!')
})

test('Should return a vite error page - /docs/invalid-response', async ({ page }) => {
  const response = await page.goto('/docs/invalid-response')
  expect(response?.status()).toBe(500)
  expect(await response?.text()).toContain('ErrorOverlay')
})

test('Should return a vite error page with stack trace - /docs/invalid-error-response', async ({
  page,
}) => {
  const response = await page.goto('/docs/invalid-error-response')
  expect(response?.status()).toBe(500)
  expect(await response?.text()).toContain('is not defined')
})

test('Should not throw an error if accessing the `caches`', async ({ page }) => {
  const res = await page.goto('/docs/cache')
  expect(res?.ok()).toBe(true)
  expect(await res?.text()).toBe('first')
  const resCached = await page.goto('/docs/cache')
  expect(resCached?.ok()).toBe(true)
  // Cache API provided by `getPlatformProxy` currently do nothing.
  // It does **not** return cached content.
  expect(await resCached?.text()).not.toBe('cached')
})

test('Should return files in the wrong public directory', async ({ page }) => {
  const res = await page.goto('/hono-logo.png')
  expect(res?.status()).toBe(404)
})

test('Should return files in the public real directory', async ({ page }) => {
  const res = await page.goto('/docs/hono-logo.png')
  expect(res?.status()).toBe(200)
})

test('Should not crash when receiving a HEAD request', async () => {
  const apiContext = await request.newContext()
  const response = await apiContext.fetch('/docs/', {
    method: 'HEAD',
  })

  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toMatch(/^text\/html/)
  const body = await response.body()
  expect(body.length).toBe(0)
  await apiContext.dispose()
})
