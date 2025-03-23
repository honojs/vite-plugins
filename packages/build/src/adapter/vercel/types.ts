/**
 * Main configuration type for Vercel Build Output API v3.
 * This type represents the root configuration object that should be output in the `.vercel/output/config.json` file.
 * @see https://vercel.com/docs/build-output-api/configuration
 */
export type VercelBuildConfigV3 = {
  /** Version identifier for the Build Output API. Must be 3. */
  version: 3
  /**
   * Array of routing rules to handle incoming requests.
   * Routes are evaluated in order, where the first matching route will be applied.
   */
  routes?: Route[]
  /**
   * Configuration for Vercel's Image Optimization feature.
   * Defines how images should be optimized, cached, and served.
   * @see https://vercel.com/docs/build-output-api/configuration#images
   */
  images?: ImagesConfig
  /**
   * Custom domain wildcard configurations for internationalization.
   * Maps domain names to values that can be referenced by the routes configuration.
   * @see https://vercel.com/docs/build-output-api/configuration#wildcard
   */
  wildcard?: WildCard[]
  /**
   * File-specific overrides for static files in the `.vercel/output/static` directory.
   * Allows overriding Content-Type headers and URL paths for static files.
   * @see https://vercel.com/docs/build-output-api/configuration#overrides
   */
  overrides?: Record<string, Override>
  /**
   * Array of file paths or glob patterns to be cached between builds.
   * Only relevant when Vercel is building from source code.
   * @see https://vercel.com/docs/build-output-api/configuration#cache
   */
  cache?: string[]
  /**
   * Scheduled tasks configuration for production deployments.
   * Defines API routes that should be invoked on a schedule.
   * @see https://vercel.com/docs/build-output-api/configuration#crons
   */
  crons?: Cron[]
}

/**
 * Route configuration that can either be a Source route or a Handler route.
 * Source routes match incoming requests, while Handler routes define special behaviors.
 */
type Route = Source | Handler

/**
 * Source route configuration for matching and handling incoming requests.
 * Provides detailed control over request matching and response handling.
 */
type Source = {
  /** Regular expression pattern to match incoming request paths */
  src: string
  /** Path to rewrite or redirect the matched request to */
  dest?: string
  /** Custom HTTP headers to add to the response */
  headers?: Record<string, string>
  /** Array of HTTP methods this route should match */
  methods?: string[]
  /** When true, matching will continue even after this route matches */
  continue?: boolean
  /** When true, the src pattern will be matched case-sensitively */
  caseSensitive?: boolean
  /** Additional validation flag for route matching */
  check?: boolean
  /** HTTP status code to return (e.g., 308 for redirects) */
  status?: number
  /** Conditions that must be present in the request for the route to match */
  has?: Array<HostHasField | HeaderHasField | CookieHasField | QueryHasField>
  /** Conditions that must be absent from the request for the route to match */
  missing?: Array<HostHasField | HeaderHasField | CookieHasField | QueryHasField>
  /** Configuration for locale-based routing and redirects */
  locale?: Locale
  /** Raw source patterns used by middleware */
  middlewareRawSrc?: string[]
  /** Path to the middleware implementation file */
  middlewarePath?: string
}

/**
 * Locale configuration for internationalization routing.
 * Used to configure language-specific redirects and preferences.
 */
type Locale = {
  /** Mapping of locale codes to their redirect destinations */
  redirect?: Record<string, string>
  /** Name of the cookie used to store the user's locale preference */
  cookie?: string
}

/**
 * Host-based condition for route matching.
 * Used to match requests based on the Host header.
 */
type HostHasField = {
  /** Identifies this as a host matching condition */
  type: 'host'
  /** Pattern to match against the Host header */
  value: string
}

/**
 * Header-based condition for route matching.
 * Used to match requests based on HTTP headers.
 */
type HeaderHasField = {
  /** Identifies this as a header matching condition */
  type: 'header'
  /** Name of the header to match */
  key: string
  /** Optional value the header should match */
  value?: string
}

/**
 * Cookie-based condition for route matching.
 * Used to match requests based on cookie values.
 */
type CookieHasField = {
  /** Identifies this as a cookie matching condition */
  type: 'cookie'
  /** Name of the cookie to match */
  key: string
  /** Optional value the cookie should match */
  value?: string
}

/**
 * Query parameter condition for route matching.
 * Used to match requests based on query string parameters.
 */
type QueryHasField = {
  /** Identifies this as a query parameter matching condition */
  type: 'query'
  /** Name of the query parameter to match */
  key: string
  /** Optional value the query parameter should match */
  value?: string
}

/**
 * Special handler phases for request processing.
 * Defines when and how requests should be processed in the routing pipeline.
 */
type HandleValue =
  | 'rewrite' // Rewrites the request URL
  | 'filesystem' // Checks for matches after filesystem misses
  | 'resource' // Handles the request as a static resource
  | 'miss' // Processes after any filesystem miss
  | 'hit' // Handles successful cache hits
  | 'error' // Processes after errors (500, 404, etc.)

/**
 * Handler route configuration for special request processing phases.
 * Used to define behavior at specific points in the request lifecycle.
 */
type Handler = {
  /** The type of handler to process the request */
  handle: HandleValue
  /** Optional pattern to match against the request path */
  src?: string
  /** Optional path to handle the request with */
  dest?: string
  /** HTTP status code to return in the response */
  status?: number
}

/**
 * Supported image formats for the Image Optimization API.
 * @see https://vercel.com/docs/build-output-api/configuration#images
 */
type ImageFormat = 'image/avif' | 'image/webp'

/**
 * Configuration for remote image sources in Image Optimization.
 * Defines patterns for matching and processing external images.
 */
type RemotePattern = {
  /** Protocol allowed for remote images (http or https) */
  protocol?: 'http' | 'https'
  /** Hostname pattern that remote images must match */
  hostname: string
  /** Optional port number for remote image URLs */
  port?: string
  /** Path pattern that remote image URLs must match */
  pathname?: string
  /** Search query pattern that remote image URLs must match */
  search?: string
}

/**
 * Configuration for local image patterns in Image Optimization.
 * Defines patterns for matching and processing local images.
 */
type LocalPattern = {
  /** Path pattern that local images must match */
  pathname?: string
  /** Search query pattern that local image URLs must match */
  search?: string
}

/**
 * Configuration for Vercel's Image Optimization feature.
 * @see https://vercel.com/docs/build-output-api/configuration#images
 */
type ImagesConfig = {
  /** Array of allowed image widths for resizing */
  sizes: number[]
  /** Array of allowed domains for remote images */
  domains: string[]
  /** Patterns for matching remote image sources */
  remotePatterns?: RemotePattern[]
  /** Patterns for matching local image sources */
  localPatterns?: LocalPattern[]
  /** Array of allowed quality values for image optimization */
  qualities?: number[]
  /** Minimum time (in seconds) to cache optimized images */
  minimumCacheTTL?: number
  /** Array of supported output formats for optimization */
  formats?: ImageFormat[]
  /** Whether to allow processing of SVG images (use with caution) */
  dangerouslyAllowSVG?: boolean
  /** Content Security Policy for optimized images */
  contentSecurityPolicy?: string
  /** Content-Disposition header type for image responses */
  contentDispositionType?: string
}

/**
 * Configuration for custom domain wildcards.
 * Used for internationalization and dynamic routing based on domains.
 * @see https://vercel.com/docs/build-output-api/configuration#wildcard
 */
type WildCard = {
  /** Domain name to match for this wildcard configuration */
  domain: string
  /** Value to use when this wildcard matches (available as $wildcard in routes) */
  value: string
}

/**
 * Configuration for path or content-type overrides of static files.
 * @see https://vercel.com/docs/build-output-api/configuration#overrides
 */
type Override = {
  /** URL path where the static file will be accessible */
  path?: string
  /** Content-Type header value for the static file */
  contentType?: string
}

/**
 * Configuration for scheduled tasks (Cron Jobs).
 * @see https://vercel.com/docs/build-output-api/configuration#crons
 */
type Cron = {
  /** Path to the API route that handles the cron job */
  path: string
  /** Cron schedule expression (e.g., "0 0 * * *" for daily at midnight) */
  schedule: string
}
