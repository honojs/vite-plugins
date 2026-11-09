// The Vite plugin for hono/jsx: the JSX settings, hono/jsx/dom in the browser,
// and an update that swaps only the edited component and keeps its state.
import MagicString from 'magic-string'
import { createFilter, parseAst } from 'vite'
import type { FilterPattern, Plugin } from 'vite'

export interface Options {
  /**
   * The files to update in place.
   * @default /\.[tj]sx?$/
   */
  include?: FilterPattern
  /**
   * The files to leave out. Keep node_modules in the list.
   * @default /\/node_modules\//
   */
  exclude?: FilterPattern
}

// The server renders with hono/jsx. The browser only needs hono/jsx/dom.
const BROWSER_JSX: Record<string, string> = {
  'hono/jsx': 'hono/jsx/dom',
  'hono/jsx/jsx-runtime': 'hono/jsx/dom/jsx-runtime',
  'hono/jsx/jsx-dev-runtime': 'hono/jsx/dom/jsx-dev-runtime',
}

const RUNTIME_ID = 'virtual:@hono/vite-jsx/refresh'
const RESOLVED_RUNTIME_ID = '\0' + RUNTIME_ID

// The wrapper never changes, so hono/jsx sees the same `tag` and keeps the node and its state.
const RUNTIME = `
import { useEffect, useState } from 'hono/jsx/dom'

const registry = new Map()
let generation = 0

// Each evaluation of a module gets a new number. Adding it to the deps makes
// hono/jsx run effects and memos again with the code that was just edited.
export const nextGeneration = () => ++generation
export const withGeneration = (deps, current) => (deps ? [...deps, current] : deps)

// A custom hook adds to the hook order of every component that calls it,
// and the signature of those components cannot see that.
const hookSignatures = new Map()
export function checkHookOrder(key, signature) {
  const previous = hookSignatures.get(key)
  if (previous !== undefined && previous !== signature) location.reload()
  hookSignatures.set(key, signature)
}

export function register(key, name, fn, signature) {
  let entry = registry.get(key)
  if (!entry) {
    const created = { latest: fn, signature, instances: new Set() }
    created.wrapper = function (props) {
      const [, force] = useState(0)
      useEffect(() => {
        created.instances.add(force)
        return () => created.instances.delete(force)
      }, [])
      return created.latest(props)
    }
    Object.defineProperty(created.wrapper, 'name', { value: name })
    registry.set(key, created)
    return created.wrapper
  }
  // State is matched by hook order, so a different order cannot be swapped.
  if (entry.signature !== signature) {
    location.reload()
    return entry.wrapper
  }
  entry.latest = fn
  entry.instances.forEach((force) => force((n) => n + 1))
  return entry.wrapper
}
`

const isComponentName = (name: string) => /^[A-Z]/.test(name)
// A capitalized function may be something else (new Point(), Sum(1, 2)), and the wrapper would break it.
// A component this misses is still updated through its importers.
const looksLikeComponent = (source: string) => /jsx\w*\)?\s*\(|\buse[A-Z]\w*\s*\(/.test(source)
const isHookName = (name: string) => /^use[A-Z]/.test(name)
const isFunctionNode = (node: any) =>
  node?.type === 'ArrowFunctionExpression' || node?.type === 'FunctionExpression'
const hookSignature = (source: string) => (source.match(/\buse[A-Z]\w*(?=\s*\()/g) ?? []).join(',')

// The position of the deps argument of each hook that has one.
const DEPS_INDEX: Record<string, number> = {
  useEffect: 1,
  useLayoutEffect: 1,
  useInsertionEffect: 1,
  useMemo: 1,
  useCallback: 1,
  useImperativeHandle: 2,
}

const walk = (node: any, visit: (node: any) => void) => {
  if (!node || typeof node.type !== 'string') {
    return
  }
  visit(node)
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      value.forEach((child) => walk(child, visit))
    } else if (value && typeof value === 'object') {
      walk(value, visit)
    }
  }
}

function transformComponents(code: string, id: string) {
  const ast = parseAst(code) as any
  const s = new MagicString(code)
  const components = new Set<string>()
  const hookChecks: string[] = []
  const exportedNames: string[] = []
  let hasUnknownExport = false

  const registerAfter = (end: number, name: string, source: string) => {
    components.add(name)
    s.appendRight(
      end,
      `\n${name} = __refresh(${JSON.stringify(`${id}:${name}`)}, ${JSON.stringify(name)}, ${name}, ${JSON.stringify(hookSignature(source))});`
    )
  }

  const checkHook = (name: string, source: string) => {
    // Not the call to itself in the name of the declaration: only what it calls.
    const body = source.slice(source.indexOf(name) + name.length)
    hookChecks.push(
      `__checkHookOrder(${JSON.stringify(`${id}:${name}`)}, ${JSON.stringify(hookSignature(body))});`
    )
  }

  const visitDeclaration = (declaration: any, statement: any) => {
    if (
      declaration?.type === 'FunctionDeclaration' &&
      declaration.id &&
      isHookName(declaration.id.name)
    ) {
      checkHook(declaration.id.name, code.slice(declaration.start, declaration.end))
    } else if (declaration?.type === 'VariableDeclaration') {
      for (const d of declaration.declarations) {
        if (d.id.type === 'Identifier' && isHookName(d.id.name) && isFunctionNode(d.init)) {
          checkHook(d.id.name, code.slice(d.start, d.end))
        }
      }
    }
    if (
      declaration?.type === 'FunctionDeclaration' &&
      declaration.id &&
      isComponentName(declaration.id.name) &&
      looksLikeComponent(code.slice(declaration.start, declaration.end))
    ) {
      registerAfter(
        statement.end,
        declaration.id.name,
        code.slice(declaration.start, declaration.end)
      )
    } else if (declaration?.type === 'VariableDeclaration') {
      const targets = declaration.declarations.filter(
        (d: any) =>
          d.id.type === 'Identifier' &&
          isComponentName(d.id.name) &&
          isFunctionNode(d.init) &&
          looksLikeComponent(code.slice(d.start, d.end))
      )
      if (targets.length > 0 && declaration.kind === 'const') {
        // The wrapper has to be assigned back to the binding.
        s.overwrite(declaration.start, declaration.start + 'const'.length, 'let')
      }
      for (const target of targets) {
        registerAfter(statement.end, target.id.name, code.slice(target.start, target.end))
      }
    }
  }

  for (const statement of ast.body) {
    switch (statement.type) {
      case 'FunctionDeclaration':
      case 'VariableDeclaration':
        visitDeclaration(statement, statement)
        break
      case 'ExportNamedDeclaration':
        if (statement.declaration) {
          visitDeclaration(statement.declaration, statement)
          const d = statement.declaration
          if (d.id) {
            exportedNames.push(d.id.name)
          }
          for (const v of d.declarations ?? []) {
            if (v.id.type === 'Identifier') {
              exportedNames.push(v.id.name)
            } else {
              hasUnknownExport = true
            }
          }
        } else if (statement.source) {
          hasUnknownExport = true
        } else {
          for (const spec of statement.specifiers) {
            exportedNames.push(spec.local.name)
          }
        }
        break
      case 'ExportDefaultDeclaration': {
        const d = statement.declaration
        if (d.type === 'FunctionDeclaration' && d.id) {
          visitDeclaration(d, statement)
          exportedNames.push(d.id.name)
        } else if (d.type === 'Identifier') {
          exportedNames.push(d.name)
        } else {
          hasUnknownExport = true
        }
        break
      }
      case 'ExportAllDeclaration':
        hasUnknownExport = true
        break
    }
  }

  let hasDeps = false
  walk(ast, (node) => {
    if (node.type !== 'CallExpression' || node.callee.type !== 'Identifier') {
      return
    }
    const index = DEPS_INDEX[node.callee.name]
    if (index === undefined) {
      return
    }
    const deps = node.arguments[index]
    if (!deps || deps.type === 'SpreadElement') {
      return
    }
    hasDeps = true
    s.appendLeft(deps.start, '__withGeneration(')
    s.appendRight(deps.end, ', __generation)')
  })

  if (components.size === 0 && !hasDeps && hookChecks.length === 0) {
    return null
  }

  s.prepend(
    `import { register as __refresh, nextGeneration as __nextGeneration, withGeneration as __withGeneration, checkHookOrder as __checkHookOrder } from ${JSON.stringify(RUNTIME_ID)};\nconst __generation = __nextGeneration();\n`
  )

  if (hookChecks.length > 0) {
    s.append(`\n${hookChecks.join('\n')}\n`)
  }

  // Only a module that exports nothing but components can take the update itself.
  // Anything else goes up to its importers, as it does without this plugin.
  const canAccept =
    !hasUnknownExport && exportedNames.length > 0 && exportedNames.every((n) => components.has(n))
  if (canAccept) {
    s.append('\nif (import.meta.hot) import.meta.hot.accept();\n')
  }

  return { code: s.toString(), map: s.generateMap({ hires: 'boundary', source: id }) }
}

export default function honoJsx(options: Options = {}): Plugin[] {
  const filter = createFilter(
    options.include ?? /\.[tj]sx?$/,
    options.exclude ?? /\/node_modules\//
  )
  return [
    {
      name: '@hono/vite-jsx:config',
      config: () => ({
        oxc: { jsx: { runtime: 'automatic', importSource: 'hono/jsx' } },
        resolve: { dedupe: ['hono'] },
        // Found late, they would make Vite reload the page right after the first load.
        optimizeDeps: {
          include: ['hono/jsx/dom', 'hono/jsx/dom/jsx-runtime', 'hono/jsx/dom/jsx-dev-runtime'],
        },
      }),
    },
    {
      name: '@hono/vite-jsx:browser',
      enforce: 'pre',
      resolveId(id, importer, resolveOptions) {
        const target = BROWSER_JSX[id]
        if (target === undefined || this.environment.config.consumer !== 'client') {
          return
        }
        return this.resolve(target, importer, { ...resolveOptions, skipSelf: true })
      },
    },
    {
      name: '@hono/vite-jsx:refresh',
      apply: 'serve',
      resolveId(id) {
        if (id === RUNTIME_ID) {
          return RESOLVED_RUNTIME_ID
        }
      },
      load(id) {
        if (id === RESOLVED_RUNTIME_ID) {
          return RUNTIME
        }
      },
      transform(code, id) {
        if (this.environment.config.consumer !== 'client') {
          return
        }
        const file = id.replace(/\?.*$/, '')
        if (!filter(file)) {
          return
        }
        return transformComponents(code, file)
      },
    },
  ]
}
