import { test, expect } from '@playwright/test'

test('Should return 200 response', async ({ page }) => {
  const response = await page.goto('/')
  expect(response?.status()).toBe(200)

  const headers = response?.headers() ?? {}
  expect(headers['x-via']).toBe('vite')

  const content = await page.textContent('h1')
  expect(content).toBe('Hello Vite!')
})

test('Should contain an injected script tag', async ({ page }) => {
  await page.goto('/')

  const lastScriptTag = await page.$('script:last-of-type')
  expect(lastScriptTag).not.toBeNull()

  const nonce = await lastScriptTag?.getAttribute('nonce')
  expect(nonce).toBeNull()

  const content = await lastScriptTag?.textContent()
  expect(content).toBe('import("/@vite/client")')
})

test('Should contain an injected script tag with a nonce', async ({ page }) => {
  await page.goto('/with-nonce')

  const lastScriptTag = await page.$('script:last-of-type')
  expect(lastScriptTag).not.toBeNull()

  const nonce = await lastScriptTag?.getAttribute('nonce')
  expect(nonce).not.toBeNull()

  const content = await lastScriptTag?.textContent()
  expect(content).toBe('import("/@vite/client")')
})

test('Should have Cloudflare bindings', async ({ page }) => {
  const response = await page.goto('/name')
  expect(response?.status()).toBe(200)

  const content = await page.textContent('h1')
  expect(content).toBe('My name is Hono')
})

test('Should not throw an error if using `waitUntil`', async ({ page }) => {
  const response = await page.goto('/wait-until')
  expect(response?.status()).toBe(200)

  const content = await page.textContent('h1')
  expect(content).toBe('Hello Vite!')
})

test('Should exclude the file specified in the config file', async ({ page }) => {
  let response = await page.goto('/file.ts')
  expect(response?.status()).toBe(404)

  response = await page.goto('/ends-in-ts')
  expect(response?.status()).toBe(200)

  response = await page.goto('/app/foo')
  expect(response?.status()).toBe(404)

  response = await page.goto('/favicon.ico')
  expect(response?.status()).toBe(404)

  response = await page.goto('/static/foo.png')
  expect(response?.status()).toBe(404)
})

test('Should return 200 response - /stream', async ({ page }) => {
  const response = await page.goto('/stream')
  expect(response?.status()).toBe(200)

  const headers = response?.headers() ?? {}
  expect(headers['x-via']).toBe('vite')

  const content = await page.textContent('h1')
  expect(content).toBe('Hello Vite!')
})

test('Should return a vite error page - /invalid-response', async ({ page }) => {
  const response = await page.goto('/invalid-response')
  expect(response?.status()).toBe(500)
  expect(await response?.text()).toContain('ErrorOverlay')
})

test('Should return a vite error page with stack trace - /invalid-error-response', async ({
  page,
}) => {
  const response = await page.goto('/invalid-error-response')
  expect(response?.status()).toBe(500)
  expect(await response?.text()).toContain('e2e/mock/worker.ts')
})

test('Should set `workerd` as a runtime key', async ({ page }) => {
  const res = await page.goto('/runtime')
  expect(res?.ok()).toBe(true)
  expect(await res?.text()).toBe('workerd')
})

test('Should not throw an error if accessing the `caches`', async ({ page }) => {
  const res = await page.goto('/cache')
  expect(res?.ok()).toBe(true)
  expect(await res?.text()).toBe('first')
  const resCached = await page.goto('/cache')
  expect(resCached?.ok()).toBe(true)
  // Cache API provided by `getPlatformProxy` currently do nothing.
  // It does **not** return cached content.
  expect(await resCached?.text()).not.toBe('cached')
})

test('Should set `cf` properties', async ({ page }) => {
  const res = await page.goto('/cf')
  expect(res?.ok()).toBe(true)
  expect(await res?.json()).toEqual({ cf: true })
})

test('Should return files in the public directory', async ({ page }) => {
  const res = await page.goto('/hono-logo.png')
  expect(res?.status()).toBe(200)
})
