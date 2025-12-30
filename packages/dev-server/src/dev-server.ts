import { getRequestListener } from '@hono/node-server'
import { minimatch } from 'minimatch'
import type { Plugin as VitePlugin, ViteDevServer, Connect } from 'vite'
import fs from 'fs'
import type http from 'http'
import path from 'path'
import type { Env, Fetch, EnvFunc, Adapter, LoadModule } from './types.js'
import { createBasePathGuard, createBasePathRewriter, safeParseUrlPath } from './utils.js'

export type DevServerOptions = {
  entry?: string
  export?: string
  injectClientScript?: boolean
  exclude?: (string | RegExp)[]
  ignoreWatching?: (string | RegExp)[]
  env?: Env | EnvFunc
  loadModule?: LoadModule
  /**
   * This can be used to inject environment variables into the worker from your wrangler.toml for example,
   * by making use of the helper function `getPlatformProxy` from `wrangler`.
   *
   * @example
   *
   * ```ts
   * import { defineConfig } from 'vite'
   * import devServer from '@hono/vite-dev-server'
   * import getPlatformProxy from 'wrangler'
   *
   * export default defineConfig(async () => {
   *    const { env, dispose } = await getPlatformProxy()
   *    return {
   *      plugins: [
   *        devServer({
   *          adapter: {
   *            env,
   *            onServerClose: dispose
   *          },
   *        }),
   *      ],
   *    }
   *  })
   * ```
   *
   *
   */
  adapter?: Adapter | Promise<Adapter> | (() => Adapter | Promise<Adapter>)
  handleHotUpdate?: VitePlugin['handleHotUpdate']
  /**
   * Base path where the application is served. This behaves like calling `.basePath()` on a Hono instance but does not depend on Hono. Note that `c.req` will contain paths without the base you specify here.
   *
   * Provide an empty string or `/` to serve from the root, or a leading-slash path such as `/foo/bar`.
   *
   * When this option is set, the Vite `base` configuration will be overridden by the vite-dev-server.
   *
   * For example, if you set `base` to `/foo/bar`, when a browser requests `/foo/bar/path` the vite-dev-server will handle that request and pass `/path` to your application.
   */
  base?: '' | `/${string}`
}

export const defaultOptions: Required<Omit<DevServerOptions, 'env' | 'adapter' | 'loadModule'>> = {
  entry: './src/index.ts',
  export: 'default',
  injectClientScript: true,
  exclude: [
    /.*\.css$/,
    /.*\.ts$/,
    /.*\.tsx$/,
    /.*\.mdx?$/,
    /^\/@.+$/,
    /\?t\=\d+$/,
    /[?&]tsr-split=[^&]*(&t=[^&]*)?$/, // Support for TanStack Router code splitting
    /^\/favicon\.ico$/,
    /^\/static\/.+/,
    /^\/node_modules\/.*/,
    /.*\.svelte$/,
    /.*\.vue$/,
    /.*\.js$/,
    /.*\.jsx$/,
  ],
  ignoreWatching: [/\.wrangler/, /\.mf/],
  handleHotUpdate: ({ server, modules }) => {
    // Force reload the page if any of the modules is SSR
    const isSSR = modules.some((mod) => mod._ssrModule)
    if (isSSR) {
      server.hot.send({ type: 'full-reload' })
      return []
    }
    // Apply HMR for the client-side modules
  },
  base: '',
}

const defaultBase = '/'

export function devServer(options?: DevServerOptions): VitePlugin {
  let publicDirPath = ''
  let viteBase = defaultBase
  const entry = options?.entry ?? defaultOptions.entry
  const rewriteRequestForBase = createBasePathRewriter(options?.base ?? defaultOptions.base)
  const shouldHandlePath = createBasePathGuard(options?.base ?? defaultOptions.base)
  let viteBaseSetByUser: string | undefined
  const plugin: VitePlugin = {
    name: '@hono/vite-dev-server',
    config: (config) => {
      viteBaseSetByUser = config?.base

      const baseOption = options?.base
      return {
        ...(baseOption !== undefined
          ? {
              base: baseOption === '' ? '/' : baseOption,
            }
          : {}),
        server: {
          watch: {
            ignored: options?.ignoreWatching ?? defaultOptions.ignoreWatching,
          },
        },
      }
    },
    configResolved(config) {
      publicDirPath = config.publicDir
      viteBase = config.base

      const honoBase = options?.base
      const honoBaseIsSet = honoBase !== undefined
      const viteBaseIsSet = viteBaseSetByUser !== undefined && viteBaseSetByUser !== '/'

      if (viteBaseIsSet && honoBaseIsSet) {
        console.warn(
          `The following Vite config options will be overridden by @hono/vite-dev-server:
  - base: "${viteBaseSetByUser}" -> "${honoBase}"`
        )
      }
    },
    configureServer: async (server) => {
      async function createMiddleware(server: ViteDevServer): Promise<Connect.HandleFunction> {
        return async function (
          req: http.IncomingMessage,
          res: http.ServerResponse,
          next: Connect.NextFunction
        ): Promise<void> {
          if (req.url) {
            const filePath = path.join(publicDirPath, req.url)
            try {
              if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                return next()
              }
            } catch {
              // do nothing
            }
          }

          const exclude = options?.exclude ?? defaultOptions.exclude
          for (const pattern of exclude) {
            if (req.url) {
              if (pattern instanceof RegExp) {
                if (pattern.test(req.url)) {
                  return next()
                }
              } else if (minimatch(req.url?.toString(), pattern)) {
                return next()
              }
            }
          }

          const pathname = req.url ? safeParseUrlPath(req.url) : undefined
          if (!shouldHandlePath(pathname)) {
            return next()
          }

          let loadModule: LoadModule

          if (options?.loadModule) {
            loadModule = options.loadModule
          } else {
            loadModule = async (server, entry) => {
              let appModule
              try {
                appModule = await server.ssrLoadModule(entry)
              } catch (e) {
                if (e instanceof Error) {
                  server.ssrFixStacktrace(e)
                }
                throw e
              }
              const exportName = options?.export ?? defaultOptions.export
              const app = appModule[exportName] as { fetch: Fetch }
              if (!app) {
                throw new Error(`Failed to find a named export "${exportName}" from ${entry}`)
              }
              return app
            }
          }

          let app: { fetch: Fetch }

          try {
            app = await loadModule(server, entry)
          } catch (e) {
            return next(e)
          }

          getRequestListener(
            async (request): Promise<Response> => {
              let env: Env = {
                incoming: req,
                outgoing: res,
              }

              if (options?.env) {
                if (typeof options.env === 'function') {
                  env = { ...env, ...(await options.env()) }
                } else {
                  env = { ...env, ...options.env }
                }
              }

              const adapter = await getAdapterFromOptions(options)

              if (adapter?.env) {
                env = { ...env, ...adapter.env }
              }

              const executionContext = adapter?.executionContext ?? {
                waitUntil: async (fn) => fn,
                passThroughOnException: () => {
                  throw new Error('`passThroughOnException` is not supported')
                },
              }
              const requestForApp = rewriteRequestForBase ? rewriteRequestForBase(request) : request
              const response = await app.fetch(requestForApp, env, executionContext)

              /**
               * If the response is not instance of `Response`, throw it so that it can be handled
               * by our custom errorHandler and passed through to Vite
               */
              if (!(response instanceof Response)) {
                throw response
              }

              if (
                options?.injectClientScript !== false &&
                response.headers.get('content-type')?.match(/^text\/html/)
              ) {
                const viteScript = path.posix.join(viteBase, '/@vite/client')
                const nonce = response.headers
                  .get('content-security-policy')
                  ?.match(/'nonce-([^']+)'/)?.[1]
                const script = `<script${nonce ? ` nonce="${nonce}"` : ''}>import("${viteScript}")</script>`
                return injectStringToResponse(response, script) ?? response
              }
              return response
            },
            {
              overrideGlobalObjects: false,
              errorHandler: (e) => {
                let err: Error
                if (e instanceof Error) {
                  err = e
                  server.ssrFixStacktrace(err)
                } else if (typeof e === 'string') {
                  err = new Error(`The response is not an instance of "Response", but: ${e}`)
                } else {
                  err = new Error(`Unknown error: ${e}`)
                }

                next(err)
              },
            }
          )(req, res)
        }
      }

      server.middlewares.use(await createMiddleware(server))
      server.httpServer?.on('close', async () => {
        const adapter = await getAdapterFromOptions(options)
        if (adapter?.onServerClose) {
          await adapter.onServerClose()
        }
      })
    },
    handleHotUpdate: options?.handleHotUpdate ?? defaultOptions.handleHotUpdate,
  }
  return plugin
}

const getAdapterFromOptions = async (
  options: DevServerOptions | undefined
): Promise<Adapter | undefined> => {
  let adapter = options?.adapter
  if (typeof adapter === 'function') {
    adapter = adapter()
  }
  if (adapter instanceof Promise) {
    adapter = await adapter
  }
  return adapter
}

function injectStringToResponse(response: Response, content: string) {
  const stream = response.body
  const newContent = new TextEncoder().encode(content)

  if (!stream) {
    return null
  }

  const reader = stream.getReader()

  const combinedStream = new ReadableStream({
    async start(controller) {
      // First, read and enqueue all existing content
      for (;;) {
        const result = await reader.read()
        if (result.done) {
          break
        }
        controller.enqueue(result.value)
      }

      // After existing content is complete, append the new content
      controller.enqueue(newContent)
      controller.close()
    },
  })

  const headers = new Headers(response.headers)
  headers.delete('content-length')

  return new Response(combinedStream, {
    headers,
    status: response.status,
  })
}
