import { existsSync, readFileSync, rmSync } from 'node:fs'
import { build } from 'vite'
import bunBuildPlugin from '../src/adapter/bun'

describe('Build Plugin with Bun Adapter', () => {
  const testDir = './test/mocks/app-static-files'
  const entry = './src/server.ts'

  afterAll(() => {
    rmSync(`${testDir}/dist`, { recursive: true, force: true })
  })

  it('Should build the project correctly with the plugin', async () => {
    const outputFile = `${testDir}/dist/index.js`

    await build({
      root: testDir,
      plugins: [
        bunBuildPlugin({
          entry,
        }),
      ],
    })

    expect(existsSync(outputFile)).toBe(true)

    const output = readFileSync(outputFile, 'utf-8')
    expect(output).toContain('Hello World')
    expect(output).toContain('use("/foo.txt"')
    expect(output).toContain('use("/js/*"')

    const outputFooTxt = readFileSync(`${testDir}/dist/foo.txt`, 'utf-8')
    expect(outputFooTxt).toContain('foo')

    const outputJsClientJs = readFileSync(`${testDir}/dist/js/client.js`, 'utf-8')
    // eslint-disable-next-line quotes
    expect(outputJsClientJs).toContain("console.log('foo')")
  })
})
