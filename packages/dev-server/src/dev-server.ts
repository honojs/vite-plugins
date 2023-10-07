import type http from 'http'
import { getRequestListener } from '@hono/node-server'
import type { Miniflare, MiniflareOptions, WorkerOptions } from 'miniflare'
import type { Plugin, ViteDevServer, Connect } from 'vite'

export type DevServerOptions = {
  entry?: string
  injectClientScript?: boolean
  exclude?: (string | RegExp)[]
  cf?: Partial<
    Omit<
      WorkerOptions,
      // We can ignore these properties:
      'name' | 'script' | 'scriptPath' | 'modules' | 'modulesRoot' | 'modulesRules'
    > &
      Pick<
        MiniflareOptions,
        'cachePersist' | 'd1Persist' | 'durableObjectsPersist' | 'kvPersist' | 'r2Persist'
      >
  >
}

export const defaultOptions: Required<Omit<DevServerOptions, 'cf'>> = {
  entry: './src/index.ts',
  injectClientScript: true,
  exclude: ['.*\\.ts', '.*\\.tsx', '/@.+', '\\/node_modules\\/.*'],
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void
  passThroughOnException(): void
}

type Fetch = (request: Request, env: {}, executionContext: ExecutionContext) => Promise<Response>

const nullScript = 'export default { fetch: () => new Response(null, { status: 404 }) };'

export function devServer(options?: DevServerOptions): Plugin {
  const entry = options?.entry ?? defaultOptions.entry
  const plugin: Plugin = {
    name: '@hono/vite-dev-server',
    configureServer: async (server) => {
      let mf: undefined | Miniflare = undefined

      // Dynamic import Miniflare for environments like Bun.
      if (options?.cf) {
        const { Miniflare } = await import('miniflare')
        mf = new Miniflare({
          modules: true,
          script: nullScript,
          ...options.cf,
        })
      }

      async function createMiddleware(server: ViteDevServer): Promise<Connect.HandleFunction> {
        return async function (
          req: http.IncomingMessage,
          res: http.ServerResponse,
          next: Connect.NextFunction
        ): Promise<void> {
          const exclude = options?.exclude ?? defaultOptions.exclude

          for (const pattern of exclude) {
            const regExp = new RegExp(`^${pattern}$`)
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
            let bindings = {}
            if (mf) {
              bindings = await mf.getBindings()
            }
            const response = await app.fetch(request, bindings, {
              waitUntil: async (fn) => fn,
              passThroughOnException: () => {
                throw new Error('`passThroughOnException` is not supported')
              },
            })
            if (
              options?.injectClientScript !== false &&
              // If the response is a streaming, it does not inject the script:
              !response.headers.get('transfer-encoding')?.match('chunked') &&
              response.headers.get('content-type')?.match(/^text\/html/)
            ) {
              const body =
                (await response.text()) + '<script type="module" src="/@vite/client"></script>'
              const headers = new Headers(response.headers)
              headers.delete('content-length')
              return new Response(body, {
                status: response.status,
                headers,
              })
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
