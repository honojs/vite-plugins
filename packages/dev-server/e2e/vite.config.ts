import { defineConfig } from 'vite'
import devServer, { defaultOptions } from '../src'
import pages from '../src/cloudflare-pages'
import { getPlatformProxy } from 'wrangler'

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
        adapter: {
          env: {
            ENV_FROM_ADAPTER: 'ENV_FROM_ADAPTER_VALUE',
          },
          onServerClose: dispose,
        },
      }),
    ],
  }
})
