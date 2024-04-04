// Adapted from @hono/node-server

import type { IncomingMessage, ServerResponse, OutgoingHttpHeaders } from 'node:http'
import { Http2ServerRequest, type Http2ServerResponse } from 'node:http2'
import type { CustomErrorHandler, FetchCallback, HttpBindings } from '@hono/node-server/dist/types'
import { newRequest } from './request'
import { getInternalBody } from './response'
import { buildOutgoingHttpHeaders, writeFromReadableStream } from './utils'

const X_ALREADY_SENT = 'x-hono-already-sent'
const regBuffer = /^no$/i
const regContentType = /^(application\/json\b|text\/(?!event-stream\b))/i

const handleFetchError = (e: unknown): Response =>
  new Response(null, {
    status:
      e instanceof Error && (e.name === 'TimeoutError' || e.constructor.name === 'TimeoutError')
        ? 504 // timeout error emits 504 timeout
        : 500,
  })

const handleResponseError = (e: unknown, outgoing: ServerResponse | Http2ServerResponse) => {
  const err = (e instanceof Error ? e : new Error('unknown error', { cause: e })) as Error & {
    code: string
  }
  if (err.code === 'ERR_STREAM_PREMATURE_CLOSE') {
    console.info('The user aborted a request.')
  } else {
    console.error(e)
    if (!outgoing.headersSent) {
      outgoing.writeHead(500, { 'Content-Type': 'text/plain' })
    }
    outgoing.end(`Error: ${err.message}`)
    outgoing.destroy(err)
  }
}

const responseViaResponseObject = async (
  res: Response | Promise<Response>,
  outgoing: ServerResponse | Http2ServerResponse,
  options: { errorHandler?: CustomErrorHandler } = {}
) => {
  if (res instanceof Promise) {
    if (options.errorHandler) {
      try {
        res = await res
      } catch (err) {
        const errRes = await options.errorHandler(err)
        if (!errRes) {
          return
        }
        res = errRes
      }
    } else {
      res = await res.catch(handleFetchError)
    }
  }

  const resHeaderRecord: OutgoingHttpHeaders = buildOutgoingHttpHeaders(res.headers)

  const internalBody = getInternalBody(res)
  if (internalBody) {
    if (internalBody.length) {
      resHeaderRecord['content-length'] = internalBody.length
    }
    outgoing.writeHead(res.status, resHeaderRecord)
    if (typeof internalBody.source === 'string' || internalBody.source instanceof Uint8Array) {
      outgoing.end(internalBody.source)
    } else if (internalBody.source instanceof Blob) {
      outgoing.end(new Uint8Array(await internalBody.source.arrayBuffer()))
    } else {
      await writeFromReadableStream(internalBody.stream, outgoing)
    }
  } else if (res.body) {
    /**
     * If content-encoding is set, we assume that the response should be not decoded.
     * Else if transfer-encoding is set, we assume that the response should be streamed.
     * Else if content-length is set, we assume that the response content has been taken care of.
     * Else if x-accel-buffering is set to no, we assume that the response should be streamed.
     * Else if content-type is not application/json nor text/* but can be text/event-stream,
     * we assume that the response should be streamed.
     */

    const {
      'transfer-encoding': transferEncoding,
      'content-encoding': contentEncoding,
      'content-length': contentLength,
      'x-accel-buffering': accelBuffering,
      'content-type': contentType,
    } = resHeaderRecord

    if (
      transferEncoding ||
      contentEncoding ||
      contentLength ||
      // nginx buffering variant
      (accelBuffering && regBuffer.test(accelBuffering as string)) ||
      !regContentType.test(contentType as string)
    ) {
      outgoing.writeHead(res.status, resHeaderRecord)

      await writeFromReadableStream(res.body, outgoing)
    } else {
      const buffer = await res.arrayBuffer()
      resHeaderRecord['content-length'] = buffer.byteLength

      outgoing.writeHead(res.status, resHeaderRecord)
      outgoing.end(new Uint8Array(buffer))
    }
  } else if (resHeaderRecord[X_ALREADY_SENT]) {
    // do nothing, the response has already been sent
  } else {
    outgoing.writeHead(res.status, resHeaderRecord)
    outgoing.end()
  }
}

export const getRequestListener = (
  fetchCallback: FetchCallback,
  options: { errorHandler?: CustomErrorHandler } = {}
) => {
  const abortController = new AbortController()

  return async (
    incoming: IncomingMessage | Http2ServerRequest,
    outgoing: ServerResponse | Http2ServerResponse
  ) => {
    let res
    const req = newRequest(incoming, abortController)

    // Detect if request was aborted.
    outgoing.on('close', () => {
      if (incoming.destroyed) {
        abortController.abort()
      }
    })

    try {
      res = fetchCallback(req, { incoming, outgoing } as HttpBindings) as
        | Response
        | Promise<Response>
    } catch (e: unknown) {
      if (!res) {
        if (options.errorHandler) {
          res = await options.errorHandler(e)
          if (!res) {
            return
          }
        } else {
          res = handleFetchError(e)
        }
      } else {
        return handleResponseError(e, outgoing)
      }
    }

    try {
      return responseViaResponseObject(res, outgoing, options)
    } catch (e) {
      return handleResponseError(e, outgoing)
    }
  }
}
