import { test, expect } from '@playwright/test'

test('Should route only under custom base path', async ({ page }) => {
  const response = await page.goto('/foo/bar/')
  expect(response?.status()).toBe(200)
  const content = await page.textContent('h1')
  expect(content).toBe('Hello Vite!')
})

test('Should redirect outside custom base path', async ({ page }) => {
  // If a redirect target exists, the user will be redirected.
  const response = await page.goto('/')
  expect(response?.status()).toBe(200)
  expect(response?.request().redirectedFrom()).not.toBeNull()
  expect(page.url()).toMatch(/\/foo\/bar\/?$/)

  // If no redirect target exists, no redirection will occur.
  const response2 = await page.goto('/foo/')
  expect(response2?.status()).toBe(404)
  expect(page.url()).toMatch(/\/foo\/?$/)
})

test('Should handle paths under the custom base path', async ({ page }) => {
  const response = await page.goto('/foo/bar/path')
  expect(response?.status()).toBe(200)
  const content = await response?.json()
  expect(content).toEqual({ path: '/path', url: 'http://localhost:6173/path' })
})

test('Should inject Vite client script with correct base', async ({ page }) => {
  await page.goto('/foo/bar/')
  const lastScriptTag = await page.$('script:last-of-type')
  expect(lastScriptTag).not.toBeNull()
  const content = await lastScriptTag?.textContent()
  expect(content).toBe('import("/foo/bar/@vite/client")')
})
