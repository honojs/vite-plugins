import * as fs from 'node:fs'
import { build } from 'vite'
import { describe, it, expect, afterAll } from 'vitest'
import cloudflarePagesPlugin from '../src/index'

describe('cloudflarePagesPlugin', () => {
  const testDir = './test/project'
  const entryFile = `${testDir}/app/server.ts`

  afterAll(() => {
    fs.rmSync(`${testDir}/dist`, { recursive: true, force: true })
  })

  it('Should build the project correctly with the plugin', async () => {
    const outputFile = `${testDir}/dist/_worker.js`
    const routesFile = `${testDir}/dist/_routes.json`

    expect(fs.existsSync(entryFile)).toBe(true)

    await build({
      root: testDir,
      plugins: [
        cloudflarePagesPlugin({
          minify: false,
          serveStaticDir: './public',
        }),
      ],
    })

    expect(fs.existsSync(outputFile)).toBe(true)
    expect(fs.existsSync(routesFile)).toBe(true)

    const output = fs.readFileSync(outputFile, 'utf-8')
    expect(output).toContain('Hello World')
    expect(output).toContain(`worker.get("/favicon.ico", serveStatic());
worker.get("/static/*", serveStatic());`)

    const routes = fs.readFileSync(routesFile, 'utf-8')
    expect(routes).toContain(
      '{"version":1,"include":["/*"],"exclude":["/favicon.ico","/static/*"]}'
    )
  })

  it('Should build the project correctly with custom output directory', async () => {
    const outputFile = `${testDir}/customDir/_worker.js`
    const routesFile = `${testDir}/customDir/_routes.json`

    afterAll(() => {
      fs.rmSync(`${testDir}/customDir/`, { recursive: true, force: true })
    })

    expect(fs.existsSync(entryFile)).toBe(true)

    await build({
      root: testDir,
      plugins: [
        cloudflarePagesPlugin({
          serveStaticDir: './public',
          outputDir: 'customDir',
          minify: false,
        }),
      ],
      build: {
        emptyOutDir: true,
      },
    })

    expect(fs.existsSync(outputFile)).toBe(true)
    expect(fs.existsSync(routesFile)).toBe(true)

    const output = fs.readFileSync(outputFile, 'utf-8')
    expect(output).toContain('Hello World')
    expect(output).toContain(`worker.get("/favicon.ico", serveStatic());
worker.get("/static/*", serveStatic());`)

    const routes = fs.readFileSync(routesFile, 'utf-8')
    expect(routes).toContain(
      '{"version":1,"include":["/*"],"exclude":["/favicon.ico","/static/*"]}'
    )
  })
})
