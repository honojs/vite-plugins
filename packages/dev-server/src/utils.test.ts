import {
  safeParseUrlPath,
  normalizeBasePath,
  createBasePathRewriter,
  createBasePathGuard,
} from './utils'

describe('safeParseUrlPath', () => {
  it('Should return the pathname for a valid URL', () => {
    const result = safeParseUrlPath('/foo/bar?query=123')
    expect(result).toBe('/foo/bar')

    const result2 = safeParseUrlPath('/')
    expect(result2).toBe('/')

    const result3 = safeParseUrlPath('')
    expect(result3).toBe('/')
  })

  it('Should return the pathname for a relative path', () => {
    const result = safeParseUrlPath('relative-url')
    expect(result).toBe('/relative-url')
  })

  it('Should return undefined for an invalid URL', () => {
    const result = safeParseUrlPath('http://')
    expect(result).toBeUndefined()
  })
})

describe('normalizeBasePath', () => {
  it('Should return empty for undefined, empty, or "/"', () => {
    expect(normalizeBasePath(undefined)).toBe('')
    expect(normalizeBasePath('')).toBe('')
    expect(normalizeBasePath('/')).toBe('')
  })

  it('Should ensure leading slash and remove trailing slashes', () => {
    expect(normalizeBasePath('foo/bar/')).toBe('/foo/bar')
    expect(normalizeBasePath('/foo/bar//')).toBe('/foo/bar')
    expect(normalizeBasePath('/foo')).toBe('/foo')
  })

  it('Should collapse consecutive slashes and normalize to expected output', () => {
    expect(normalizeBasePath('//')).toBe('')
    expect(normalizeBasePath('///')).toBe('')
    expect(normalizeBasePath('/foo//bar//')).toBe('/foo/bar')
    expect(normalizeBasePath('foo///bar/')).toBe('/foo/bar')
  })
})

describe('createBasePathRewriter', () => {
  it('Should return undefined for empty/undefined base', () => {
    expect(createBasePathRewriter(undefined)).toBeUndefined()
    expect(createBasePathRewriter('')).toBeUndefined()
  })

  it('Should rewrite matching request paths by removing the base prefix', () => {
    const rewrite = createBasePathRewriter('/foo/bar')
    expect(typeof rewrite).toBe('function')
    expect(rewrite).toBeDefined()
    if (!rewrite) {
      throw new Error('rewrite should be defined')
    }

    const reqRoot = new Request('http://localhost/foo/bar')
    const rewrittenRoot = rewrite(reqRoot)
    expect(new URL(rewrittenRoot.url).pathname).toBe('/')

    const reqChild = new Request('http://localhost/foo/bar/path')
    const rewrittenChild = rewrite(reqChild)
    expect(new URL(rewrittenChild.url).pathname).toBe('/path')
  })

  it('Should return original request when path does not match base', () => {
    const rewrite = createBasePathRewriter('/foo/bar')
    expect(rewrite).toBeDefined()
    if (!rewrite) {
      throw new Error('rewrite should be defined')
    }
    const req = new Request('http://localhost/other/path')
    expect(rewrite(req).url).toBe(req.url)
  })

  it('Should preserve method and headers and body', async () => {
    const rewrite = createBasePathRewriter('/foo/bar')
    expect(rewrite).toBeDefined()
    if (!rewrite) {
      throw new Error('rewrite should be defined')
    }
    const original = new Request('http://localhost/foo/bar/path', {
      method: 'POST',
      headers: { 'x-test': '1' },
      body: 'hello',
    })
    const rew = rewrite(original)
    expect(rew.method).toBe('POST')
    expect(rew.headers.get('x-test')).toBe('1')
    const text = await rew.text()
    expect(text).toBe('hello')
  })
})

describe('createBasePathGuard', () => {
  it('Should always allow when base is undefined', () => {
    const guard = createBasePathGuard(undefined)
    expect(guard('/')).toBe(true)
    expect(guard('/anything')).toBe(true)
    expect(guard()).toBe(true)
  })

  it('Should only allow paths equal to or under the base', () => {
    const guard = createBasePathGuard('/foo/bar')
    expect(guard('/foo/bar')).toBe(true)
    expect(guard('/foo/bar/')).toBe(true)
    expect(guard('/foo/bar/path')).toBe(true)
    expect(guard('/foo')).toBe(false)
    expect(guard('/other/foo/bar')).toBe(false)
  })
})
