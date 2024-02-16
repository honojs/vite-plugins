import fs from 'node:fs'
import path from 'node:path'
import { build } from 'vite'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import ssgPlugin from '../src/index'

describe('ssgPlugin', () => {
  const testDir = './test-project'
  const entryFile = './test/app.ts'
  const outputFile = path.resolve(testDir, 'dist', 'index.html')

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
        outDir: path.resolve(testDir, 'dist'),
        emptyOutDir: true,
      },
    })

    expect(fs.existsSync(outputFile)).toBe(true)

    const output = fs.readFileSync(outputFile, 'utf-8')
    expect(output).toBe('<html><body><h1>Hello!</h1></body></html>')
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
        outDir: path.resolve(testDir, 'dist'),
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
