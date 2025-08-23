import { test, expect } from '@playwright/test'

test('Should return 404 response', async ({ page }) => {
  const response = await page.goto('/')
  expect(response?.status()).toBe(404)
  expect(await response?.text()).toContain('not handled by the hono server')
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

test('Should return files in the wrong public directory', async ({ page }) => {
  const res = await page.goto('/hono-logo.png')
  expect(res?.status()).toBe(404)
  expect(await res?.text()).toContain('not handled by the hono server')
})

test('Should return files in the public real directory', async ({ page }) => {
  const res = await page.goto('/docs/hono-logo.png')
  expect(res?.status()).toBe(200)
})
