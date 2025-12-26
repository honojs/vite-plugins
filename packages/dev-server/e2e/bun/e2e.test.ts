import { expect } from '@playwright/test'
import { prepareDevServerSetup, test } from '../utils'

const startApp = prepareDevServerSetup('bun', { runtime: 'bun' })

test.describe('bun', () => {
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

  test('Should serve static files in `public/static`', async ({ page }) => {
    const response = await page.goto(`http://localhost:${port}/static/hello.json`)
    expect(response?.status()).toBe(200)

    const data = await response?.json()
    expect(data['message']).toBe('Hello')
  })

  test('Should return a vite error page - /invalid-response', async ({ page }) => {
    const response = await page.goto(`http://localhost:${port}/invalid-response`)
    expect(response?.status()).toBe(500)
    expect(await response?.text()).toContain('ErrorOverlay')
  })

  test('Should set `workerd` as a runtime key', async ({ page }) => {
    const res = await page.goto(`http://localhost:${port}/runtime`)
    expect(res?.ok()).toBe(true)
    expect(await res?.text()).toBe('bun')
  })

  test('Should contain an injected script tag - /fizzbuzz?n=500', async ({ page }) => {
    await page.goto(`http://localhost:${port}/fizzbuzz?n=500`)

    const lastScriptTag = await page.$('script:last-of-type')
    expect(lastScriptTag).not.toBeNull()

    const content = await lastScriptTag?.textContent()
    expect(content).toBe('import("/@vite/client")')
  })
})
