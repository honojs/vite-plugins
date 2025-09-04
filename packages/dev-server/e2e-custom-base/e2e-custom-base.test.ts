import { test, expect } from '@playwright/test'

const vbase = process.env.VBASE ?? '/'
const BASE_TEST = '/docs/'
const BASE_TEST_2 = '/tests/'

test('Should contain an injected script tag', async ({ page }) => {
  const response = await page.goto('/')
  expect(response?.status()).toBe(200)

  const lastScriptTag = await page.$('script:last-of-type')
  expect(lastScriptTag).not.toBeNull()

  const nonce = await lastScriptTag?.getAttribute('nonce')
  expect(nonce).toBeNull()

  const content = await lastScriptTag?.textContent()

  const vbase = process.env.VBASE ?? '/'
  expect(content).toBe(`import("${vbase}@vite/client")`)
})

test('Dynamic /path endpoint behind vite base', async ({ page }) => {
  // tests run on port 6173 - see e2e-custom-base/playwright.config.ts
  const response = await page.goto(`${vbase}path`)
  if (vbase == '/') {
    // url is /path
    expect(response?.status()).toBe(200)
    const data = await response?.json()
    expect(data.path).toBe('/path')
    expect(data.url).toBe('http://localhost:6173/path')
    return
  } else if (vbase == BASE_TEST) {
    // url is /docs/path
    // this path does not exists in the worker.ts
    expect(response?.status()).toBe(404)
    expect(await response?.text()).toContain('404 Not Found')
    return
  } else if (vbase == BASE_TEST_2) {
    // url is /test/path
    // hono serves only /docs/*
    expect(response?.status()).toBe(404)
    expect(await response?.text()).toContain('404 Not Found')
    return
  }
  expect(true).toBe(false) // never
})

test('Should exclude the file specified in the exclude option', async ({ page }) => {
  let response = await page.goto('/file.ts')
  expect(response?.status()).toBe(404)

  response = await page.goto('/app/foo')
  expect(response?.status()).toBe(404)

  response = await page.goto('/favicon.ico')
  expect(response?.status()).toBe(404)

  response = await page.goto('/static/foo.png')
  expect(response?.status()).toBe(404)
})

test('Static hono-logo.png endpoint at /', async ({ page }) => {
  const res = await page.goto('/hono-logo.png')
  if (vbase == '/') {
    expect(res?.status()).toBe(200)
    return
  }
  expect(res?.status()).toBe(404)
})

test('Dynmaic hono-logo.png endpoint at /vbase', async ({ page }) => {
  const res = await page.goto(`${vbase}hono-logo.png`)
  if (vbase == '/') {
    expect(res?.status()).toBe(200)
    return
  }
  expect(res?.status()).toBe(404)
})
