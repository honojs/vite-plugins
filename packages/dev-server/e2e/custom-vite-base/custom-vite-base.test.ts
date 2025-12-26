import { expect } from '@playwright/test'
import { prepareDevServerSetup, test } from '../utils'

const startApp = prepareDevServerSetup('custom-vite-base')

test.describe('custom-vite-base', () => {
  let port: number
  let stopApp: () => Promise<void>

  test.beforeAll(async () => {
    ;({ port, stopApp } = await startApp())
  })

  test.afterAll(async () => {
    await stopApp()
  })

  test('Should contain an injected script tag with base path', async ({ page }) => {
    const response = await page.goto(`http://localhost:${port}/`)
    expect(response?.status()).toBe(200)

    const lastScriptTag = await page.$('script:last-of-type')
    expect(lastScriptTag).not.toBeNull()

    const nonce = await lastScriptTag?.getAttribute('nonce')
    expect(nonce).toBeNull()

    const content = await lastScriptTag?.textContent()
    expect(content).toBe('import("/docs/@vite/client")')
  })
})
