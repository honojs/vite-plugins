import { test, expect } from '@playwright/test'

test('Should contain an injected script tag with base path', async ({ page }) => {
  const response = await page.goto('/')
  expect(response?.status()).toBe(200)

  const lastScriptTag = await page.$('script:last-of-type')
  expect(lastScriptTag).not.toBeNull()

  const nonce = await lastScriptTag?.getAttribute('nonce')
  expect(nonce).toBeNull()

  const content = await lastScriptTag?.textContent()
  expect(content).toBe('import("/docs/@vite/client")')
})
