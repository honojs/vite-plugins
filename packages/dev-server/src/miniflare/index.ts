import { type PartialWorkerOptions } from './types/worker.js'
import { getWranglerWorkerOptions } from './wrangler.js'

const nullScript = 'export default { fetch: () => new Response(null, { status: 404 }) };'

export type PrepareMiniflareOptions = {
  cf?: PartialWorkerOptions
  wranglerTomlPath?: string
}

export const prepareMiniflare = async (options: PrepareMiniflareOptions) => {
  const { Miniflare } = await import('miniflare')
  const workerOptions: PartialWorkerOptions = options.cf ?? {}
  workerOptions.bindings ??= {}
  workerOptions.d1Databases ??= []

  if (options.wranglerTomlPath !== undefined) {
    const wranglerOptions = await getWranglerWorkerOptions(options.wranglerTomlPath)
    Object.assign(workerOptions, wranglerOptions)
  }

  const mf = new Miniflare({
    modules: true,
    script: nullScript,
    ...workerOptions,
  })
  return mf
}
