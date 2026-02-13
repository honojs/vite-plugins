import type { SSGPlugin } from 'hono/ssg'
import { build } from 'vite'
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import ssgPlugin from '../src/index'

describe('ssgPlugin', () => {
  const testDir = './test-project'
  const entryFile = './test/app.ts'
  const outDir = path.resolve(testDir, 'dist')
  const outputFile = path.resolve(outDir, 'index.html')
  const outputFileWithDynamicImport = path.resolve(outDir, 'dynamic-import.txt')

  beforeAll(() => {
    fs.mkdirSync(testDir, { recursive: true })
  })

  afterAll(() => {
    fs.rmSync(testDir, { recursive: true, force: true })
  })

  it('Should generate the content correctly with the plugin', async () => {
    expect(fs.existsSync(entryFile)).toBe(true)

    await build({
      plugins: [
        ssgPlugin({
          entry: entryFile,
        }),
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        },
      },
      build: {
        outDir,
        emptyOutDir: true,
      },
    })

    expect(fs.existsSync(outputFile)).toBe(true)

    const output = fs.readFileSync(outputFile, 'utf-8')
    expect(output).toBe('<html><body><h1>Hello!</h1></body></html>')

    expect(fs.existsSync(outputFileWithDynamicImport)).toBe(true)

    const outputDynamicImport = fs.readFileSync(outputFileWithDynamicImport, 'utf-8')
    expect(outputDynamicImport).toBe('Dynamic import works: sample!')

    const aliasOutput = path.resolve(outDir, 'alias-module.txt')
    expect(fs.existsSync(aliasOutput)).toBe(true)
    const aliasContent = fs.readFileSync(aliasOutput, 'utf-8')
    expect(aliasContent.trim()).toBe('Foo')

    // Should not output files corresponding to a virtual entry
    expect(fs.existsSync(path.resolve(outDir, 'assets'))).toBe(false)
  })

  it('Should keep other inputs politely', async () => {
    expect(fs.existsSync(entryFile)).toBe(true)

    await build({
      plugins: [
        ssgPlugin({
          entry: entryFile,
        }),
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        },
      },
      build: {
        rollupOptions: {
          input: entryFile,
          output: {
            entryFileNames: 'assets/[name].js',
          },
        },
        outDir,
        emptyOutDir: true,
      },
    })

    const entryOutputFile = path.resolve(testDir, 'dist', 'assets', 'app.js')

    expect(fs.existsSync(outputFile)).toBe(true)
    expect(fs.existsSync(entryOutputFile)).toBe(true)

    const output = fs.readFileSync(outputFile, 'utf-8')
    expect(output).toBe('<html><body><h1>Hello!</h1></body></html>')

    const entryOutput = fs.readFileSync(entryOutputFile, 'utf-8')
    expect(entryOutput.length).toBeGreaterThan(0)
  })

  it('Should apply ssg plugins', async () => {
    const beforeRequestHook = vi.fn((req) => req)
    const afterResponseHook = vi.fn((res) => res)
    const afterGenerateHook = vi.fn()

    const testPlugin: SSGPlugin = {
      beforeRequestHook,
      afterResponseHook,
      afterGenerateHook,
    }

    await build({
      plugins: [
        ssgPlugin({
          entry: entryFile,
          plugins: [testPlugin],
        }),
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        },
      },
      build: {
        outDir,
        emptyOutDir: true,
      },
    })

    expect(beforeRequestHook).toHaveBeenCalled()
    expect(afterResponseHook).toHaveBeenCalled()
    expect(afterGenerateHook).toHaveBeenCalled()
  })
})
