import { getRequestListener } from '@hono/node-server'
import { minimatch } from 'minimatch'
import type { Plugin as VitePlugin, ViteDevServer, Connect } from 'vite'
import fs from 'fs'
import type http from 'http'
import path from 'path'
import type { Env, Fetch, EnvFunc, Adapter, LoadModule } from './types.js'

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
}

export const defaultOptions: Required<Omit<DevServerOptions, 'env' | 'adapter' | 'loadModule'>> = {
  entry: './src/index.ts',
  export: 'default',
  injectClientScript: true,
  exclude: [
    /.*\.css$/,
    /.*\.ts$/,
    /.*\.tsx$/,
    /^\/@.+$/,
    /\?t\=\d+$/,
    /^\/favicon\.ico$/,
    /^\/static\/.+/,
    /^\/node_modules\/.*/,
  ],
  ignoreWatching: [/\.wrangler/, /\.mf/],
}

export function devServer(options?: DevServerOptions): VitePlugin {
  let publicDirPath = ''
  const entry = options?.entry ?? defaultOptions.entry
  const plugin: VitePlugin = {
    name: '@hono/vite-dev-server',
    configResolved(config) {
      publicDirPath = config.publicDir
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

          let loadModule: LoadModule

          if (options?.loadModule) {
            loadModule = options.loadModule
          } else {
            loadModule = async (server, entry) => {
              const appModule = await server.ssrLoadModule(entry)
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
              let env: Env = {}

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

              const response = await app.fetch(request, env, executionContext)

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
                const nonce = response.headers
                  .get('content-security-policy')
                  ?.match(/'nonce-([^']+)'/)?.[1]
                const script = `<script${nonce ? ` nonce="${nonce}"` : ''}>import("/@vite/client")</script>`
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
    config: () => {
      return {
        server: {
          watch: {
            ignored: options?.ignoreWatching ?? defaultOptions.ignoreWatching,
          },
        },
      }
    },
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
  const newContentReader = new ReadableStream({
    start(controller) {
      controller.enqueue(newContent)
      controller.close()
    },
  }).getReader()

  const combinedStream = new ReadableStream({
    async start(controller) {
      for (;;) {
        const [existingResult, newContentResult] = await Promise.all([
          reader.read(),
          newContentReader.read(),
        ])

        if (existingResult.done && newContentResult.done) {
          controller.close()
          break
        }

        if (!existingResult.done) {
          controller.enqueue(existingResult.value)
        }
        if (!newContentResult.done) {
          controller.enqueue(newContentResult.value)
        }
      }
    },
  })

  const headers = new Headers(response.headers)
  headers.delete('content-length')

  return new Response(combinedStream, {
    headers,
    status: response.status,
  })
}
