import type http from 'http'
import { getRequestListener } from '@hono/node-server'
import type { Plugin, ViteDevServer, Connect } from 'vite'
import { getEnv as cloudflarePagesGetEnv } from './cloudflare-pages/index.js'
import type { Env, Fetch, EnvFunc } from './types.js'

export type DevServerOptions = {
  entry?: string
  injectClientScript?: boolean
  exclude?: (string | RegExp)[]
  env?: Env | EnvFunc
} & {
  /**
   * @deprecated
   * The `cf` option is maintained for backward compatibility, but it will be obsolete in the future.
   * Instead, use the `env` option.
   */
  cf?: Parameters<typeof cloudflarePagesGetEnv>[0]
}

export const defaultOptions: Required<Omit<DevServerOptions, 'env' | 'cf'>> = {
  entry: './src/index.ts',
  injectClientScript: true,
  exclude: [
    /.*\.ts$/,
    /.*\.tsx$/,
    /^\/@.+$/,
    /^\/favicon\.ico$/,
    /^\/static\/.+/,
    /^\/node_modules\/.*/,
  ],
}

export function devServer(options?: DevServerOptions): Plugin {
  const entry = options?.entry ?? defaultOptions.entry
  const plugin: Plugin = {
    name: '@hono/vite-dev-server',
    configureServer: async (server) => {
      async function createMiddleware(server: ViteDevServer): Promise<Connect.HandleFunction> {
        return async function (
          req: http.IncomingMessage,
          res: http.ServerResponse,
          next: Connect.NextFunction
        ): Promise<void> {
          const exclude = options?.exclude ?? defaultOptions.exclude

          for (const pattern of exclude) {
            const regExp = pattern instanceof RegExp ? pattern : new RegExp(`^${pattern}$`)
            if (req.url && regExp.test(req.url)) {
              return next()
            }
          }

          const appModule = await server.ssrLoadModule(entry)
          const app = appModule['default'] as { fetch: Fetch }

          if (!app) {
            console.error(`Failed to find a named export "default" from ${entry}`)
            return next()
          }

          getRequestListener(async (request) => {
            let env: Env = {}

            if (options?.env) {
              if (typeof options.env === 'function') {
                env = await options.env()
              } else {
                env = options.env
              }
            } else if (options?.cf) {
              env = await cloudflarePagesGetEnv(options.cf)()
            }

            const response = await app.fetch(request, env, {
              waitUntil: async (fn) => fn,
              passThroughOnException: () => {
                throw new Error('`passThroughOnException` is not supported')
              },
            })
            if (
              options?.injectClientScript !== false &&
              response.headers.get('content-type')?.match(/^text\/html/)
            ) {
              const script = '<script>import("/@vite/client")</script>'
              return injectStringToResponse(response, script)
            }
            return response
          })(req, res)
        }
      }

      server.middlewares.use(await createMiddleware(server))
    },
  }
  return plugin
}

function injectStringToResponse(response: Response, content: string) {
  const stream = response.body
  const newContent = new TextEncoder().encode(content)

  if (!stream) return null

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
