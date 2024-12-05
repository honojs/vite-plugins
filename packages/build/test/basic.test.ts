import { build } from 'vite'
import { existsSync, readFileSync, rmSync } from 'node:fs'
import buildPlugin from '../src/base'

describe('Base Plugin', () => {
  const testDir = './test/mocks/app'
  const entry = './src/server.ts'
  const outputFile = `${testDir}/dist/index.js`

  afterAll(() => {
    rmSync(`${testDir}/dist`, { recursive: true, force: true })
  })

  it('Should build the project correctly with the plugin', async () => {
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

  it('Should return correct responses from the output file', async () => {
    const module = await import(outputFile)
    const app = module['default']

    let res = await app.request('/')
    expect(res.status).toBe(200)

    res = await app.request('/not-found')
    expect(res.status).toBe(404)
  })
})
