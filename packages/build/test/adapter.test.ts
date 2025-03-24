import { build } from 'vite'
import { existsSync, readFileSync, rmSync } from 'node:fs'
import bunBuildPlugin from '../src/adapter/bun'
import cloudflarePagesPlugin from '../src/adapter/cloudflare-pages'
import denoBuildPlugin from '../src/adapter/deno'
import netlifyFunctionsPlugin from '../src/adapter/netlify-functions'
import nodeBuildPlugin from '../src/adapter/node'
import vercelBuildPlugin from '../src/adapter/vercel'

describe('Build Plugin with Bun Adapter', () => {
  const testDir = './test/mocks/app-static-files'
  const entry = './src/server.ts'

  afterEach(() => {
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

describe('Build Plugin with Netlify Functions Adapter', () => {
  const testDir = './test/mocks/app-static-files'
  const entry = './src/server.ts'

  afterEach(() => {
    rmSync(`${testDir}/dist`, { recursive: true, force: true })
  })

  it('Should build the project correctly with the plugin', async () => {
    const outputFile = `${testDir}/dist/index.js`

    await build({
      root: testDir,
      plugins: [
        netlifyFunctionsPlugin({
          entry,
          minify: false,
        }),
      ],
    })

    expect(existsSync(outputFile)).toBe(true)

    const output = readFileSync(outputFile, 'utf-8')
    expect(output).toContain('Hello World')
    expect(output).toContain('{ path: "/*", preferStatic: true }')
    expect(output).toContain('handle(mainApp)')

    const outputFooTxt = readFileSync(`${testDir}/dist/foo.txt`, 'utf-8')
    expect(outputFooTxt).toContain('foo')

    const outputJsClientJs = readFileSync(`${testDir}/dist/js/client.js`, 'utf-8')
    // eslint-disable-next-line quotes
    expect(outputJsClientJs).toContain("console.log('foo')")
  })
})

describe('Build Plugin with Cloudflare Pages Adapter', () => {
  const testDir = './test/mocks/app-static-files'

  afterEach(() => {
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

describe('Build Plugin with Deno Adapter', () => {
  const testDir = './test/mocks/app-static-files'
  const entry = './src/server.ts'

  afterEach(() => {
    rmSync(`${testDir}/dist`, { recursive: true, force: true })
  })

  it('Should build the project correctly with the plugin', async () => {
    const outputFile = `${testDir}/dist/index.js`

    await build({
      root: testDir,
      plugins: [
        denoBuildPlugin({
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

describe('Build Plugin with Node.js Adapter', () => {
  const testDir = './test/mocks/app-static-files'
  const entry = './src/server.ts'

  afterEach(() => {
    rmSync(`${testDir}/dist`, { recursive: true, force: true })
  })

  it('Should build the project correctly with the plugin', async () => {
    const outputFile = `${testDir}/dist/index.js`

    await build({
      root: testDir,
      plugins: [
        nodeBuildPlugin({
          entry,
          port: 3001,
          minify: false,
        }),
      ],
    })

    expect(existsSync(outputFile)).toBe(true)

    const output = readFileSync(outputFile, 'utf-8')
    expect(output).toContain('Hello World')
    expect(output).toContain('use("/foo.txt"')
    expect(output).toContain('use("/js/*"')
    expect(output).toContain('serve({ fetch: mainApp.fetch, port: 3001 })')

    const outputFooTxt = readFileSync(`${testDir}/dist/foo.txt`, 'utf-8')
    expect(outputFooTxt).toContain('foo')

    const outputJsClientJs = readFileSync(`${testDir}/dist/js/client.js`, 'utf-8')
    // eslint-disable-next-line quotes
    expect(outputJsClientJs).toContain("console.log('foo')")
  })
})

describe('Build Plugin with Vercel Adapter', () => {
  const testDir = './test/mocks/app-static-files'
  const outputDir = `${testDir}/.vercel/output`
  const entry = './src/server.ts'

  afterEach(() => {
    rmSync(outputDir, { recursive: true, force: true })
  })

  it('Should build the project correctly with the plugin', async () => {
    const outputFile = `${outputDir}/functions/__hono.func/index.js`
    const configFile = `${outputDir}/config.json`

    await build({
      root: testDir,
      plugins: [
        vercelBuildPlugin({
          entry,
          minify: false,
        }),
      ],
    })

    expect(existsSync(outputFile)).toBe(true)
    expect(existsSync(configFile)).toBe(true)

    const output = readFileSync(outputFile, 'utf-8')
    expect(output).toContain('Hello World')

    const routes = readFileSync(configFile, 'utf-8')
    expect(routes).toContain('{"version":3,"routes":[{"src":"/(.*)","dest":"/__hono"}]}')
  })
})
