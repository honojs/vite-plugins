import { build } from 'vite'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
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
})
