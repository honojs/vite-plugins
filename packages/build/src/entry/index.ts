import { normalize } from 'node:path'

export type EntryContentHookOptions = {
  staticPaths: string[]
}

export type EntryContentHook = (
  appName: string,
  options?: EntryContentHookOptions
) => string | Promise<string>

export type GetEntryContentOptions = {
  entry: string[]
  entryContentBeforeHooks?: EntryContentHook[]
  entryContentAfterHooks?: EntryContentHook[]
  staticPaths?: string[]
}

const normalizePaths = (paths: string[]) => {
  return paths.map((p) => {
    let normalizedPath = normalize(p).replace(/\\/g, '/')
    if (normalizedPath.startsWith('./')) {
      normalizedPath = normalizedPath.substring(2)
    }
    return '/' + normalizedPath
  })
}

export const getEntryContent = async (options: GetEntryContentOptions) => {
  const staticPaths = options.staticPaths ?? ['']
  const globStr = normalizePaths(options.entry)
    .map((e) => `'${e}'`)
    .join(',')

  const hooksToString = async (appName: string, hooks?: EntryContentHook[]) => {
    if (hooks) {
      const str = (
        await Promise.all(
          hooks.map((hook) => {
            return hook(appName, {
              staticPaths,
            })
          })
        )
      ).join('\n')
      return str
    }
    return ''
  }

  const appStr = `const modules = import.meta.glob([${globStr}], { import: 'default', eager: true })
      let added = false
      for (const [, app] of Object.entries(modules)) {
        if (app) {
          mainApp.route('/', app)
          mainApp.notFound(app.notFoundHandler)
          added = true
        }
      }
      if (!added) {
        throw new Error("Can't import modules from [${globStr}]")
      }`

  const mainAppStr = `import { Hono } from 'hono'
const mainApp = new Hono()

${await hooksToString('mainApp', options.entryContentBeforeHooks)}

${appStr}

${await hooksToString('mainApp', options.entryContentAfterHooks)}

export default mainApp`
  return mainAppStr
}
