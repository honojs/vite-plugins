import { defineConfig } from 'vite'
import { getPlatformProxy } from 'wrangler'
import devServer, { defaultOptions } from '../src'
import cloudflareAdapter from '../src/adapter/cloudflare'
import pages from '../src/cloudflare-pages'

export default defineConfig(async () => {
  const { env, dispose } = await getPlatformProxy()

  return {
    plugins: [
      devServer({
        env: {
          ENV_FROM_ROOT: 'ENV_FROM_ROOT_VALUE',
        },
        cf: {
          bindings: {
            ENV_FROM_DEPRACATED_CF: 'ENV_FROM_DEPRACATED_CF_VALUE',
          },
        },
        entry: './mock/worker.ts',
        exclude: [...defaultOptions.exclude, '/app/**'],
        plugins: [
          { onServerClose: dispose, env },
          pages({
            bindings: {
              NAME: 'Hono',
            },
          }),
          { env: { ENV_FROM_PLUGIN: 'ENV_FROM_PLUGIN_VALUE' } },
          { env: async () => ({ ENV_FROM_PLUGIN_AS_FUNC: 'ENV_FROM_PLUGIN_AS_FUNC_VALUE' }) },
        ],
        adapter: cloudflareAdapter,
      }),
    ],
  }
})
