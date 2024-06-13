import * as fs from 'node:fs'
import { build } from 'vite'
import { describe, it, expect, afterAll } from 'vitest'
import bunPlugin from '../src/index'

describe('cloudflarePagesPlugin', () => {
  const testDir = './test/project'
  const entryFile = `${testDir}/app/server.ts`

  afterAll(() => {
    fs.rmSync(`${testDir}/bun`, { recursive: true, force: true })
  })

  it('Should build the project correctly with the plugin', async () => {
    const outputFile = `${testDir}/dist/server.js`

    expect(fs.existsSync(entryFile)).toBe(true)

    await build({
      root: testDir,
      plugins: [bunPlugin()],
    })

    expect(fs.existsSync(outputFile)).toBe(true)

    const output = fs.readFileSync(outputFile, 'utf-8')
    expect(output).toContain('Hello World')
  })

  it('Should build the project correctly with custom output directory', async () => {
    const outputFile = `${testDir}/dist/server.js`

    afterAll(() => {
      fs.rmSync(`${testDir}/customDir/`, { recursive: true, force: true })
    })

    expect(fs.existsSync(entryFile)).toBe(true)

    await build({
      root: testDir,
      plugins: [
        bunPlugin({
          outputDir: 'customDir',
        }),
      ],
      build: {
        emptyOutDir: true,
      },
    })

    expect(fs.existsSync(outputFile)).toBe(true)

    const output = fs.readFileSync(outputFile, 'utf-8')
    expect(output).toContain('Hello World')
  })
})
