import type { Plugin } from 'vite'
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

export type PreparedRouterOptions = {
  /** All paths registered by the application, its sub-apps, and entry hooks. */
  paths: string[]
}

type RouterModule = {
  PreparedRegExpRouter?: unknown
  buildInitParams?: (options: { paths: string[] }) => [{ ALL: [RegExp, unknown, unknown] }, unknown]
}

type LoadHook = Exclude<NonNullable<Plugin['load']>, { handler: unknown }>
type TransformHook = Exclude<NonNullable<Plugin['transform']>, { handler: unknown }>

const isHonoPackage = async (packageJson: URL): Promise<boolean> => {
  try {
    return (JSON.parse(await readFile(packageJson, 'utf8')) as { name?: string }).name === 'hono'
  } catch {
    return false
  }
}

const canPrecompilePaths = (paths: string[]): boolean => {
  const dynamicPaths: { prefix: string; wildcard: boolean }[] = []
  for (const path of paths) {
    if (path === '*' || path === '/*') {
      continue
    }
    if (!path.startsWith('/')) {
      return false
    }
    const segments = path.slice(1).split('/')
    let firstDynamic = -1
    let wildcard = false
    for (const [index, segment] of segments.entries()) {
      // Certify literal URI segments rather than inheriting the compiler's
      // regexp syntax or internal #/@ marker handling from arbitrary text.
      if (/^[a-zA-Z0-9._~!$&'()+,;=%-]*$/.test(segment)) {
        continue
      }
      firstDynamic = firstDynamic === -1 ? index : firstDynamic
      const last = index === segments.length - 1
      if (segment === '*' && last) {
        wildcard = true
      } else if (
        !/^:[a-zA-Z_][a-zA-Z0-9_]*\??$/.test(segment) ||
        (segment.endsWith('?') && !last)
      ) {
        // Custom patterns and interior wildcards can change capture groups or
        // shadow a different method's route when compiled into a shared table.
        return false
      }
    }
    if (firstDynamic !== -1) {
      dynamicPaths.push({ prefix: segments.slice(0, firstDynamic).join('/'), wildcard })
    }
  }

  // Without method information, overlapping dynamic paths must keep separate
  // runtime tables if either path can also match a longer or shorter path.
  return !dynamicPaths.some(
    (path, index) =>
      path.wildcard &&
      dynamicPaths.some(
        (other, otherIndex) =>
          index !== otherIndex &&
          (path.prefix.startsWith(other.prefix) || other.prefix.startsWith(path.prefix))
      )
  )
}

const serializeParams = (value: unknown): string => {
  if (value instanceof RegExp) {
    return value.toString()
  }
  if (Array.isArray(value)) {
    return `[${Array.from(value, serializeParams).join(',')}]`
  }
  if (value !== null && typeof value === 'object') {
    const properties = Object.entries(value).map(([key, entry]) => {
      // An own __proto__ key needs computed syntax to remain a data property.
      const name = key === '__proto__' ? `[${JSON.stringify(key)}]` : JSON.stringify(key)
      return `${name}:${serializeParams(entry)}`
    })
    if (Object.getPrototypeOf(value) === null) {
      properties.unshift('__proto__:null')
    }
    return `{${properties.join(',')}}`
  }
  return JSON.stringify(value) ?? 'undefined'
}

export const createPreparedRouter = (
  options?: PreparedRouterOptions
): { load: LoadHook; transform: TransformHook } => ({
  async transform(code, id) {
    if (
      !options ||
      !/\/dist\/hono\.js$/.test(id) ||
      !code.includes('./router/reg-exp-router/router.js')
    ) {
      return
    }
    if (!(await isHonoPackage(new URL('../package.json', pathToFileURL(id))))) {
      return
    }
    // Recent Hono bundles import the implementation directly. Keep the default
    // router on the public entry we replace, without changing the compiler's
    // own reference to the original implementation.
    return {
      code: code.replace(
        /(\bfrom\s*)(['"])\.\/router\/reg-exp-router\/router\.js\2/g,
        '$1$2./router/reg-exp-router/index.js$2'
      ),
      map: null,
    }
  },
  async load(id) {
    if (!options || !/\/reg-exp-router\/index\.js$/.test(id)) {
      return
    }

    const moduleUrl = pathToFileURL(id)
    // Resolving the module currently being loaded can deadlock Vite's CJS plugin.
    const packageJson = new URL('../../../package.json', moduleUrl)
    if (!(await isHonoPackage(packageJson))) {
      return
    }

    // Compile with the same Hono installation that supplies the runtime router.
    const router = (await import(moduleUrl.href)) as RouterModule
    if (
      typeof router.PreparedRegExpRouter !== 'function' ||
      typeof router.buildInitParams !== 'function'
    ) {
      this.error(
        'The preparedRouter option requires Hono >= 4.9.11. Upgrade Hono in the application or remove preparedRouter.'
      )
    }

    const unsupportedWildcard = options.paths.find(
      (path) => path !== '*' && path.endsWith('*') && !path.endsWith('/*')
    )
    if (unsupportedWildcard !== undefined) {
      this.error(
        `preparedRouter.paths contains unsupported non-segment wildcard ${JSON.stringify(unsupportedWildcard)}. Disable preparedRouter for this application to preserve handler matching.`
      )
    }

    const paths = [...new Set(['*', ...options.paths])]
    if (!canPrecompilePaths(paths)) {
      this.warn(
        'Cannot safely precompile preparedRouter.paths with overlapping dynamic wildcards or complex path syntax. Using the original RegExpRouter to preserve method-specific matching and parameters.'
      )
      return
    }

    const buildInitParams = router.buildInitParams
    let serialized: string
    let serializedPathPatterns: string
    try {
      // The generated entry and global middleware also need to match unknown paths.
      serialized = serializeParams(buildInitParams({ paths }))
      // A shared matcher can accept line terminators through a parameter path
      // registered only for another method or another application. Keep each
      // path's original regexp so those requests can check actual registrations.
      // Certified literal paths cannot contain line terminators, so singleton
      // static maps cannot match these exceptional requests.
      serializedPathPatterns = serializeParams(
        paths.map((path) => [path, buildInitParams({ paths: [path] })[0].ALL[0]])
      )
    } catch (error) {
      this.error(`Cannot compile preparedRouter.paths: ${String(error)}`)
    }

    // Keep the original exports available without intercepting this module again.
    const original = JSON.stringify(`${id}?hono-vite-build-original`)
    return `export * from ${original}
import { PreparedRegExpRouter } from ${original}
import { MESSAGE_MATCHER_IS_ALREADY_BUILT } from '../../router.js'
const pathPatterns = new Map(${serializedPathPatterns})
const lineTerminators = /[\\r\\n\\u2028\\u2029]/
export class RegExpRouter {
  name = 'PreparedRegExpRouter'
  #routes = []
  #registeredPatterns = new Map()
  match(method, path) {
    // Mounted sub-app routers may never be queried. Create their independent
    // mutable tables only when needed, then release the queued registrations.
    const params = ${serialized}
    const router = new PreparedRegExpRouter(...params)
    for (const route of this.#routes) {
      router.add(...route)
    }
    // Registration can create ordinary objects for per-method static maps.
    // Keep inherited keys from becoming matches for custom getPath strings.
    for (const matcher of Object.values(params[0])) {
      Object.setPrototypeOf(matcher[2], null)
    }
    this.#routes = undefined
    this.match = (method, path) => {
      // Call through the delegate so Hono can replace its own first matcher
      // without removing the wrapper's line-terminator check.
      const result = router.match(method, path)
      if (!lineTerminators.test(path)) {
        return result
      }
      for (const registeredMethod of [method, 'ALL']) {
        const patterns = this.#registeredPatterns.get(registeredMethod)
        if (patterns) {
          for (const pattern of patterns) {
            if (pattern.test(path)) {
              return result
            }
          }
        }
      }
      return [[], []]
    }
    return this.match(method, path)
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT)
    }
    const pattern = pathPatterns.get(path === '/*' ? '*' : path)
    if (!pattern) {
      throw new Error('Path ' + path + ' is not registered')
    }
    this.#routes.push([method, path, handler])
    let patterns = this.#registeredPatterns.get(method)
    if (!patterns) {
      patterns = new Set()
      this.#registeredPatterns.set(method, patterns)
    }
    patterns.add(pattern)
  }
}`
  },
})
