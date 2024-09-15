import { build } from 'vite'
import { existsSync, readFileSync, rmSync } from 'node:fs'
import cloudflarePagesPlugin from '../src/adapter/cloudflare-pages'

describe('Build Plugin with Cloudflare Pages Adapter', () => {
  const testDir = './test/mocks/app-static-files'

  afterAll(() => {
    rmSync(`${testDir}/dist`, { recursive: true, force: true })
  })

  it('Should build the project correctly with the plugin', async () => {
    const outputFile = `${testDir}/dist/_worker.js`
    const routesFile = `${testDir}/dist/_routes.json`

    await build({
      root: testDir,
      plugins: [
        cloudflarePagesPlugin({
          entry: 'src/server.ts',
        }),
      ],
    })

    expect(existsSync(outputFile)).toBe(true)
    expect(existsSync(routesFile)).toBe(true)

    const output = readFileSync(outputFile, 'utf-8')
    expect(output).toContain('Hello World')

    const routes = readFileSync(routesFile, 'utf-8')
    expect(routes).toContain('{"version":1,"include":["/*"],"exclude":["/foo.txt","/js/*"]}')
  })

  it('Should build the project correctly with custom output directory', async () => {
    const outputFile = `${testDir}/customDir/_worker.js`
    const routesFile = `${testDir}/customDir/_routes.json`

    await build({
      root: testDir,
      plugins: [
        cloudflarePagesPlugin({
          outputDir: 'customDir',
          entry: 'src/server.ts',
        }),
      ],
      build: {
        emptyOutDir: true,
      },
    })

    expect(existsSync(outputFile)).toBe(true)
    expect(existsSync(routesFile)).toBe(true)

    const output = readFileSync(outputFile, 'utf-8')
    expect(output).toContain('Hello World')

    const routes = readFileSync(routesFile, 'utf-8')
    expect(routes).toContain('{"version":1,"include":["/*"],"exclude":["/foo.txt","/js/*"]}')
  })

  it('Should not create a new _routes.json when _routes.json on output directory.', async () => {
    const outputFile = `${testDir}/dist/_worker.js`
    const routesFile = `${testDir}/dist/_routes.json`

    await build({
      publicDir: 'public-routes-json',
      root: testDir,
      plugins: [
        cloudflarePagesPlugin({
          entry: 'src/server.ts',
        }),
      ],
    })

    expect(existsSync(outputFile)).toBe(true)
    expect(existsSync(routesFile)).toBe(true)

    const output = readFileSync(outputFile, 'utf-8')
    expect(output).toContain('Hello World')

    const routes = readFileSync(routesFile, 'utf-8')
    expect(routes).toContain('{"version":1,"include":["/"],"exclude":["/customRoute"]}')
  })
})
