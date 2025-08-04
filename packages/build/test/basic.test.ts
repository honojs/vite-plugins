import { build } from 'vite'
import { existsSync, readFileSync, rmSync } from 'node:fs'
import buildPlugin from '../src/base'

const cases = [
  {
    name: 'default export',
    entry: './src/server.ts',
    output: 'index.js',
  },
  {
    name: 'with fetch export',
    entry: './src/server-fetch.ts',
    output: 'server-fetch.js',
  },
]

describe.each(cases)('Build Plugin - $name', ({ entry, output }) => {
  const testDir = './test/mocks/app'
  const outputFile = `${testDir}/dist/${output}`

  afterAll(() => {
    rmSync(`${testDir}/dist`, { recursive: true, force: true })
  })

  it('Should build the project correctly with the plugin', async () => {
    await build({
      root: testDir,
      plugins: [
        buildPlugin({
          entry,
          output,
        }),
      ],
    })

    expect(existsSync(outputFile)).toBe(true)

    const outputContent = readFileSync(outputFile, 'utf-8')
    expect(outputContent).toContain('Hello World')
  })

  it('Should return correct responses from the output file', async () => {
    const module = await import(outputFile)
    const app = module.default

    let res = await app.request('/')
    expect(res.status).toBe(200)

    res = await app.request('/not-found')
    expect(res.status).toBe(404)
  })
})

describe('Build Plugin - preset option', () => {
  const testDir = './test/mocks/app'
  const outputFile = `${testDir}/dist/index.js`

  afterAll(() => {
    rmSync(`${testDir}/dist`, { recursive: true, force: true })
  })

  it('Should build the project with the correct preset', async () => {
    await build({
      root: testDir,
      plugins: [
        buildPlugin({
          entry: './src/server-tiny.ts',
          output: 'index.js',
          preset: 'hono/tiny',
        }),
      ],
    })

    expect(existsSync(outputFile)).toBe(true)

    const outputContent = readFileSync(outputFile, 'utf-8')
    expect(outputContent).not.toContain('RegExpRouter')
    expect(outputContent).not.toContain('TrieRouter')
    expect(outputContent).toContain('PatternRouter')
  })
})
