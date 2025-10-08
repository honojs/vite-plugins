/**
 * Safely parse the URL path from a given string.
 * Returns the pathname if parsing is successful, otherwise returns undefined.
 *
 * @example
 * safeParseUrlPath('/foo/bar?query=123') // returns '/foo/bar'
 */
export const safeParseUrlPath = (value: string): string | undefined => {
  try {
    // Use dummy scheme host to parse relative URLs.
    return new URL(value, 'http://localhost').pathname
  } catch {
    return undefined
  }
}

/**
 * Normalize the base path by ensuring it starts with a leading slash and does not end with a trailing slash.
 * If the base is empty, '/', or undefined, it returns an empty string.
 *
 * @example
 * normalizeBasePath('/foo/bar/') // returns '/foo/bar'
 * normalizeBasePath('foo/bar') // returns '/foo/bar'
 * normalizeBasePath('/') // returns ''
 * normalizeBasePath('') // returns ''
 * normalizeBasePath(undefined) // returns ''
 */
export const normalizeBasePath = (base: string | undefined): string => {
  if (!base || base === '/') {
    return ''
  }
  const collapsed = (base.startsWith('/') ? base : `/${base}`).replace(/\/+/g, '/')
  return collapsed.replace(/\/+$/g, '')
}

/**
 * Create a function that rewrites the request URL by removing the base path prefix.
 * If the request URL does not start with the base path, it returns the original request.
 * If no base is provided, it returns undefined.
 *
 * @example
 * const rewriteRequest = createBasePathRewriter('/foo/bar')
 * const newRequest = rewriteRequest(new Request('http://localhost/foo/bar/baz'))
 * newRequest.url // 'http://localhost/baz'
 */
export const createBasePathRewriter = (
  base: string | undefined
): ((request: Request) => Request) | undefined => {
  const normalizedBase = normalizeBasePath(base)
  if (!normalizedBase) {
    return undefined
  }
  const prefixLength = normalizedBase.length
  const prefixWithSlash = `${normalizedBase}/`
  return (request) => {
    const url = new URL(request.url)
    const { pathname } = url
    if (pathname === normalizedBase) {
      url.pathname = '/'
    } else if (pathname.startsWith(prefixWithSlash)) {
      url.pathname = pathname.slice(prefixLength) || '/'
    } else {
      return request
    }
    return new Request(url, request)
  }
}

/**
 * Create a guard function that returns true only when a pathname should be handled by the dev server
 * based on the configured base path. When no base is provided, it always allows the request.
 *
 * @example
 * const shouldHandlePath = createBasePathGuard('/foo/bar')
 * shouldHandlePath('/foo/bar') // true
 * shouldHandlePath('/') // false
 */
export const createBasePathGuard = (base: string | undefined): ((pathname?: string) => boolean) => {
  const normalizedBase = normalizeBasePath(base)
  if (!normalizedBase) {
    return () => true
  }
  const withTrailingSlash = `${normalizedBase}/`
  return (pathname) => {
    return !!pathname && (pathname === normalizedBase || pathname.startsWith(withTrailingSlash))
  }
}
