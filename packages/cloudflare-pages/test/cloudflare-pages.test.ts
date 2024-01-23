import * as fs from 'node:fs'
import path from 'path'
import { build } from 'vite'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import cloudflarePagesPlugin from '../src/index'

describe('cloudflarePagesPlugin', () => {
  const testDir = './test-project'
  const entryFile = `${testDir}/app/server.ts`
  const outputFile = `${testDir}/dist/_worker.js`

  beforeAll(() => {
    fs.mkdirSync(path.dirname(entryFile), { recursive: true })
    fs.writeFileSync(entryFile, 'export default { fetch: () => new Response("Hello World") }')
  })

  afterAll(() => {
    fs.rmSync(testDir, { recursive: true, force: true })
  })

  it('Should build the project correctly with the plugin', async () => {
    expect(fs.existsSync(entryFile)).toBe(true)

    await build({
      root: testDir,
      plugins: [cloudflarePagesPlugin()],
      build: {
        emptyOutDir: true,
      },
    })

    expect(fs.existsSync(outputFile)).toBe(true)

    const output = fs.readFileSync(outputFile, 'utf-8')
    expect(output).toContain('Hello World')
  })
})
