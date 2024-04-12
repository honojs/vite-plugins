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

  const content = await lastScriptTag?.textContent()
  expect(content).toBe('import("/@vite/client")')
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

test('Should serve static files in `public/static`', async ({ page }) => {
  const response = await page.goto('/static/hello.json')
  expect(response?.status()).toBe(200)

  const data = await response?.json()
  expect(data['message']).toBe('Hello')
})

test('Should return a vite error page - /invalid-response', async ({ page }) => {
  const response = await page.goto('/invalid-response')
  expect(response?.status()).toBe(500)
  expect(await response?.text()).toContain('ErrorOverlay')
})

test('Should set `workerd` as a runtime key', async ({ page }) => {
  const res = await page.goto('/runtime')
  expect(res?.ok()).toBe(true)
  expect(await res?.text()).toBe('bun')
})
