// Adapted from @hono/node-server
//
// Unlike upstream, doesn't override Response in order to maintain compatibility
// with Bun and potentially other JS runtimes.

interface InternalBody {
  source: string | Uint8Array | FormData | Blob | null
  stream: ReadableStream
  length: number | null
}

const stateKey = Reflect.ownKeys(new Response()).find(
  (k) => typeof k === 'symbol' && k.toString() === 'Symbol(state)'
) as symbol | undefined
if (!stateKey) {
  console.warn('Failed to find Response internal state key')
}

export function getInternalBody(response: Response): InternalBody | undefined {
  if (!stateKey) {
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const state = (response as any)[stateKey] as { body?: InternalBody } | undefined

  return (state && state.body) || undefined
}
