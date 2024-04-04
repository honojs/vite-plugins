/* eslint-disable @typescript-eslint/no-explicit-any */

// Adapted from @hono/node-server
//
// Unlike upstream, doesn't override Request in order to maintain compatibility
// with Bun and potentially other JS runtimes.

import type { IncomingMessage } from 'node:http'
import { Http2ServerRequest } from 'node:http2'
import { Readable } from 'node:stream'
import type { TLSSocket } from 'node:tls'

const newRequestFromIncoming = (
  method: string,
  url: string,
  incoming: IncomingMessage | Http2ServerRequest,
  abortController: AbortController
): Request => {
  const headerRecord: [string, string][] = []
  const rawHeaders = incoming.rawHeaders
  for (let i = 0; i < rawHeaders.length; i += 2) {
    const { [i]: key, [i + 1]: value } = rawHeaders
    if (key.charCodeAt(0) !== /*:*/ 0x3a) {
      headerRecord.push([key, value])
    }
  }

  const init = {
    method: method,
    headers: headerRecord,
    signal: abortController.signal,
  } as RequestInit

  if (!(method === 'GET' || method === 'HEAD')) {
    // lazy-consume request body
    init.body = Readable.toWeb(incoming) as ReadableStream<Uint8Array>
  }

  return new Request(url, init)
}

export const newRequest = (
  incoming: IncomingMessage | Http2ServerRequest,
  abortController: AbortController
) => {
  const url = new URL(
    `${
      incoming instanceof Http2ServerRequest ||
      (incoming.socket && (incoming.socket as TLSSocket).encrypted)
        ? 'https'
        : 'http'
    }://${incoming instanceof Http2ServerRequest ? incoming.authority : incoming.headers.host}${
      incoming.url
    }`
  ).href

  return newRequestFromIncoming(incoming.method || 'GET', url, incoming, abortController)
}
