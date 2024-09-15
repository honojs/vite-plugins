import { build } from 'vite'
import { existsSync, readFileSync, rmSync } from 'node:fs'
import buildPlugin from '../src/base'

describe('Base Plugin', () => {
  const testDir = './test/mocks/app'
  const entry = './src/server.ts'

  afterAll(() => {
    rmSync(`${testDir}/dist`, { recursive: true, force: true })
  })

  it('Should build the project correctly with the plugin', async () => {
    const outputFile = `${testDir}/dist/index.js`

    await build({
      root: testDir,
      plugins: [
        buildPlugin({
          entry,
        }),
      ],
    })

    expect(existsSync(outputFile)).toBe(true)

    const output = readFileSync(outputFile, 'utf-8')
    expect(output).toContain('Hello World')
  })
})
