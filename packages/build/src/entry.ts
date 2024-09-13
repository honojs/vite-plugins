import { normalize } from 'node:path'

export type EntryContentHookOptions = {
  staticFilePaths: string[]
}

export type EntryContentHook = (
  appName: string,
  options?: EntryContentHookOptions
) => string | Promise<string>

export type GetEntryContentOptions = {
  entry: string[]
  entryContentBeforeHook?: EntryContentHook
  entryContentAfterHook?: EntryContentHook
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
  const staticFilePaths = options.staticPaths ?? ['']
  const globStr = normalizePaths(options.entry)
    .map((e) => `'${e}'`)
    .join(',')
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
  const foo = `import { Hono } from 'hono'

const mainApp = new Hono()

${options.entryContentBeforeHook ? await options.entryContentBeforeHook('mainApp', { staticFilePaths }) : ''}

${appStr}

${options.entryContentAfterHook ? await options.entryContentAfterHook('mainApp', { staticFilePaths }) : ''}

export default mainApp`
  console.log(foo)
  return foo
}
