import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createServer } from 'vite'
import type { ViteDevServer } from 'vite'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import honoJsx from '../src/index'
import type { Options } from '../src/index'

const root = fileURLToPath(new URL('./app/', import.meta.url))
const originals = new Map<string, string>()

const edit = (name: string, from: string, to: string) => {
  const file = root + name
  const source = readFileSync(file, 'utf8')
  if (!originals.has(file)) {
    originals.set(file, source)
  }
  if (!source.includes(from)) {
    throw new Error(`Not found in ${name}: ${from}`)
  }
  writeFileSync(file, source.replace(from, to))
}

const restore = async () => {
  originals.forEach((source, file) => writeFileSync(file, source))
  originals.clear()
  // Let the watcher see the restored files before the next page load.
  await new Promise((resolve) => setTimeout(resolve, 300))
}

const startServer = async (options?: Options) => {
  const server = await createServer({
    configFile: false,
    root,
    logLevel: 'error',
    server: { port: 0 },
    plugins: [honoJsx(options)],
  })
  await server.listen()
  return server
}

// A page that has state in every component, and a mark that a reload would clear.
const open = async (page: Page, server: ViteDevServer) => {
  await page.goto(server.resolvedUrls!.local[0])
  await page.waitForSelector('#child')
  await page.click('#app')
  await page.click('#app')
  await page.click('#child')
  await page.click('#child')
  await page.click('#child')
  await page.click('#arrow')
  await page.fill('#text', 'typing')
  await page.evaluate(() => ((window as any).__mark = 1))
}

const reloaded = (page: Page) => page.evaluate(() => (window as any).__mark !== 1)

test.describe('HMR', () => {
  let server: ViteDevServer

  test.beforeAll(async () => {
    server = await startServer()
  })

  test.afterAll(async () => {
    await restore()
    await server.close()
  })

  test.beforeEach(async ({ page }) => {
    await open(page, server)
  })

  test.afterEach(async () => {
    await restore()
  })

  test('Should swap a function component and keep the state', async ({ page }) => {
    edit('Child.tsx', 'child-v1', 'child-v2')
    await expect(page.locator('#child')).toHaveText('child-v2:3')
    expect(await reloaded(page)).toBe(false)
    await expect(page.locator('#app')).toHaveText('app:2')
    await expect(page.locator('#arrow')).toHaveText('arrow-v1:1')
    await expect(page.locator('#text')).toHaveValue('typing')
    await page.click('#child')
    await expect(page.locator('#child')).toHaveText('child-v2:4')
  })

  test('Should swap an arrow function exported as default', async ({ page }) => {
    edit('Arrow.tsx', 'arrow-v1', 'arrow-v2')
    await expect(page.locator('#arrow')).toHaveText('arrow-v2:1')
    expect(await reloaded(page)).toBe(false)
  })

  test('Should keep the state of the children when the parent is swapped', async ({ page }) => {
    edit('App.tsx', 'app:{count}', 'APP:{count}')
    await expect(page.locator('#app')).toHaveText('APP:2')
    expect(await reloaded(page)).toBe(false)
    await expect(page.locator('#child')).toHaveText('child-v1:3')
  })

  test('Should reload the page when a hook is added', async ({ page }) => {
    edit(
      'Child.tsx',
      'const [count, setCount] = useState(0)',
      'const [extra] = useState(0)\n  const [count, setCount] = useState(0)'
    )
    await expect(page.locator('#child')).toHaveText('child-v1:0')
    expect(await reloaded(page)).toBe(true)
  })

  test('Should update the importers of a file that exports something else', async ({ page }) => {
    edit('helper.ts', 'helper-v1', 'helper-v2')
    await expect(page.locator('#helper')).toHaveText('helper-v2')
  })

  test('Should run an effect again with the edited code', async ({ page }) => {
    const log = () => page.evaluate(() => (window as any).__log.join(' '))
    expect(await log()).toBe('effect-v1')
    edit('Hooks.tsx', 'effect-v1', 'effect-v2')
    await expect.poll(log).toBe('effect-v1 cleanup-v1 effect-v2')
    expect(await reloaded(page)).toBe(false)
    await page.click('#hooks')
    expect(await log()).toBe('effect-v1 cleanup-v1 effect-v2')
  })

  test('Should use the edited useMemo and useCallback', async ({ page }) => {
    await page.click('#hooks')
    await expect(page.locator('#hooks')).toHaveText('hooks:1')
    edit('Hooks.tsx', 'memo-v1', 'memo-v2')
    edit('Hooks.tsx', 'n + 1', 'n + 10')
    await expect(page.locator('#memo')).toHaveText('memo-v2')
    // The two edits may arrive as two updates.
    await page.waitForTimeout(300)
    await page.click('#hooks')
    await expect(page.locator('#hooks')).toHaveText('hooks:11')
    expect(await reloaded(page)).toBe(false)
  })

  test('Should run the effect of a custom hook in another file again', async ({ page }) => {
    await expect(page.locator('#custom')).toHaveText('custom-v1:0')
    edit('useCustom.ts', 'custom-v1', 'custom-v2')
    await expect(page.locator('#custom')).toHaveText('custom-v2:0')
    expect(await reloaded(page)).toBe(false)
    await expect(page.locator('#child')).toHaveText('child-v1:3')
  })

  for (const [title, name, from] of [
    ['in another file', 'useCustom.ts', "const [value, setValue] = useState('')"],
    ['in the same file', 'Hooks.tsx', "const [value] = useState('local-v1')"],
  ]) {
    test(`Should reload the page when a hook is added to a custom hook ${title}`, async ({
      page,
    }) => {
      await page.click('#hooks')
      edit(
        name,
        from,
        `const [extra] = useState('extra')\n  ;(window as any).__extra = extra\n  ${from}`
      )
      await expect.poll(() => reloaded(page)).toBe(true)
      await expect(page.locator('#hooks')).toHaveText('hooks:0')
      expect(await page.evaluate(() => (window as any).__extra)).toBe('extra')
    })
  }

  test('Should not wrap a capitalized function that is not a component', async ({ page }) => {
    await expect(page.locator('#capital')).toHaveText('1-2-7-v1')
    edit('Capital.tsx', '-v1', '-v2')
    await expect(page.locator('#capital')).toHaveText('1-2-7-v2')
    await expect(page.locator('#app')).toHaveText('app:2')
  })

  test('Should update a component wrapped in memo()', async ({ page }) => {
    edit('Memoized.tsx', 'memo-v1', 'memo-v2')
    await expect(page.locator('#memoized')).toHaveText(/^memo-v2/)
  })
})

test.describe('exclude', () => {
  let server: ViteDevServer

  test.beforeAll(async () => {
    server = await startServer({ exclude: [/\/node_modules\//, /Child\.tsx$/] })
  })

  test.afterAll(async () => {
    await restore()
    await server.close()
  })

  test('Should update an excluded file through its importer', async ({ page }) => {
    await open(page, server)
    edit('Child.tsx', 'child-v1', 'child-v2')
    // The importer takes the update, so the excluded component starts again.
    await expect(page.locator('#child')).toHaveText('child-v2:0')
    await expect(page.locator('#app')).toHaveText('app:2')
    expect(await reloaded(page)).toBe(false)
  })
})
