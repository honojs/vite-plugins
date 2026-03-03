/**
 * Main configuration type for Vercel Build Output API v3.
 * This type represents the root configuration object that should be output in the `.vercel/output/config.json` file.
 * @see https://vercel.com/docs/build-output-api/v3/configuration
 */
export type VercelBuildConfigV3 = {
  /** Version identifier for the Build Output API. Must be 3. */
  version?: 3
  /**
   * Array of routing rules to handle incoming requests.
   * Routes are evaluated in order, where the first matching route will be applied.
   */
  routes?: Route[]
  /**
   * Configuration for Vercel's Image Optimization feature.
   * Defines how images should be optimized, cached, and served.
   * @see https://vercel.com/docs/build-output-api/v3/configuration#images
   */
  images?: ImagesConfig
  /**
   * Custom domain wildcard configurations for internationalization.
   * Maps domain names to values that can be referenced by the routes configuration.
   * @see https://vercel.com/docs/build-output-api/v3/configuration#wildcard
   */
  wildcard?: WildCard[]
  /**
   * File-specific overrides for static files in the `.vercel/output/static` directory.
   * Allows overriding Content-Type headers and URL paths for static files.
   * @see https://vercel.com/docs/build-output-api/v3/configuration#overrides
   */
  overrides?: Record<string, Override>
  /**
   * Array of file paths or glob patterns to be cached between builds.
   * Only relevant when Vercel is building from source code.
   * @see https://vercel.com/docs/build-output-api/v3/configuration#cache
   */
  cache?: string[]
  /**
   * Scheduled tasks configuration for production deployments.
   * Defines API routes that should be invoked on a schedule.
   * @see https://vercel.com/docs/build-output-api/v3/configuration#crons
   */
  crons?: Cron[]
  /**
   * Framework metadata for display purposes only.
   * @see https://vercel.com/docs/build-output-api/v3/configuration#framework
   */
  framework?: Framework
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
  has?: HasField
  /** Conditions that must be absent from the request for the route to match */
  missing?: HasField
  /** Configuration for locale-based routing and redirects */
  locale?: Locale
  /** Raw source patterns used by middleware */
  middlewareRawSrc?: string[]
  /** Path to the middleware implementation file */
  middlewarePath?: string
  /** Mitigation action to apply to the route */
  mitigate?: Mitigate
  /** List of transforms to apply to the route */
  transforms?: Transform[]
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
 * Matchable value for complex route condition matching.
 * Allows matching against values using various comparison operators.
 * @see https://vercel.com/docs/build-output-api/v3/configuration#source-route-matchablevalue
 */
type MatchableValue = {
  /** Value must equal this value */
  eq?: string | number
  /** Value must not equal this value */
  neq?: string
  /** Value must be included in this array */
  inc?: string[]
  /** Value must not be included in this array */
  ninc?: string[]
  /** Value must start with this prefix */
  pre?: string
  /** Value must end with this suffix */
  suf?: string
  /** Value must match this regular expression */
  re?: string
  /** Value must be greater than this number */
  gt?: number
  /** Value must be greater than or equal to this number */
  gte?: number
  /** Value must be less than this number */
  lt?: number
  /** Value must be less than or equal to this number */
  lte?: number
}

/**
 * Condition fields for route matching based on request properties.
 * Used in `has` and `missing` arrays on Source routes.
 * @see https://vercel.com/docs/build-output-api/v3/configuration#source-route-hasfield
 */
type HasField = Array<
  | {
      /** Identifies this as a host matching condition */
      type: 'host'
      /** Pattern to match against the Host header */
      value: string | MatchableValue
    }
  | {
      /** Identifies the condition type: header, cookie, or query parameter */
      type: 'header' | 'cookie' | 'query'
      /** Name of the header, cookie, or query parameter to match */
      key: string
      /** Optional value the field should match */
      value?: string | MatchableValue
    }
>

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
 * Mitigation action to apply to a route.
 * @see https://vercel.com/docs/build-output-api/v3/configuration#source-route-mitigate
 */
type Mitigate = {
  /** The mitigation action to apply */
  action: 'challenge' | 'deny'
}

/**
 * Transform to apply to request or response properties on a route.
 * @see https://vercel.com/docs/build-output-api/v3/configuration#source-route-transform
 */
type Transform = {
  /** The target of the transform: request headers, request query, or response headers */
  type: 'request.headers' | 'request.query' | 'response.headers'
  /** The operation to perform */
  op: 'append' | 'set' | 'delete'
  /** The target key for the transform (regex matching not supported) */
  target: {
    key: string | Omit<MatchableValue, 're'>
  }
  /** Arguments for the transform operation */
  args?: string | string[]
}

/**
 * Supported image formats for the Image Optimization API.
 * @see https://vercel.com/docs/build-output-api/v3/configuration#images
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
 * @see https://vercel.com/docs/build-output-api/v3/configuration#images
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
 * @see https://vercel.com/docs/build-output-api/v3/configuration#wildcard
 */
type WildCard = {
  /** Domain name to match for this wildcard configuration */
  domain: string
  /** Value to use when this wildcard matches (available as $wildcard in routes) */
  value: string
}

/**
 * Configuration for path or content-type overrides of static files.
 * @see https://vercel.com/docs/build-output-api/v3/configuration#overrides
 */
type Override = {
  /** URL path where the static file will be accessible */
  path?: string
  /** Content-Type header value for the static file */
  contentType?: string
}

/**
 * Configuration for scheduled tasks (Cron Jobs).
 * @see https://vercel.com/docs/build-output-api/v3/configuration#crons
 */
type Cron = {
  /** Path to the API route that handles the cron job */
  path: string
  /** Cron schedule expression (e.g., "0 0 * * *" for daily at midnight) */
  schedule: string
}

/**
 * Framework metadata for display purposes.
 * @see https://vercel.com/docs/build-output-api/v3/configuration#framework
 */
type Framework = {
  /** Framework version string */
  version: string
}

/**
 * Base configuration for a serverless function in Vercel.
 * This type represents the `.vc-config.json` configuration within a `.func` directory.
 * @see https://vercel.com/docs/build-output-api/v3/primitives#serverless-function-configuration
 */
export type VercelServerlessFunctionConfig = {
  /** Indicates the initial file where code will be executed for the Serverless Function */
  handler: string
  /** Specifies which "runtime" will be used to execute the Serverless Function */
  runtime: string
  /** The amount of memory (RAM in MB) allocated to the function */
  memory?: number
  /** The maximum duration of the function in seconds */
  maxDuration?: number
  /** Map of additional environment variables available to the function */
  environment?: Record<string, string>
  /** The regions the function is available in */
  regions?: string[]
  /** Instruction set architecture the function supports */
  architecture?: 'x86_64' | 'arm64'
  /** Whether the custom runtime supports Lambda runtime wrappers */
  supportsWrapper?: boolean
  /** Whether the function supports response streaming */
  supportsResponseStreaming?: boolean
}

/**
 * Node.js-specific serverless function configuration.
 * Extends the base serverless function config with Node.js launcher options.
 * @see https://vercel.com/docs/build-output-api/v3/primitives#nodejs-config
 */
export type VercelNodejsServerlessFunctionConfig = VercelServerlessFunctionConfig & {
  /** Specifies which "launcher" will be used to execute the Serverless Function */
  launcherType: 'Nodejs'
  /** Enables request and response helpers methods */
  shouldAddHelpers?: boolean
  /** Enables source map generation */
  shouldAddSourcemapSupport?: boolean
  /** AWS Handler Value for when the serverless function uses AWS Lambda syntax */
  awsLambdaHandler?: string
}

/**
 * Configuration for an Edge Function in Vercel.
 * This type represents the `.vc-config.json` configuration for Edge Functions.
 * @see https://vercel.com/docs/build-output-api/v3/primitives#edge-function-configuration
 */
export type VercelEdgeFunctionConfig = {
  /** Must be 'edge' to indicate this is an Edge Function */
  runtime: 'edge'
  /** Initial file where code will be executed for the Edge Function */
  entrypoint: string
  /** List of environment variable names available to the Edge Function */
  envVarsInUse?: string[]
  /** Regions the edge function will be available in (defaults to 'all') */
  regions?: 'all' | string | string[]
}

/**
 * Configuration for a Prerender Function in Vercel (ISR).
 * This type represents the `.prerender-config.json` configuration file.
 * @see https://vercel.com/docs/build-output-api/v3/primitives#prerender-configuration-file
 */
export type VercelPrerenderFunctionConfig = {
  /** Cache expiration time in seconds, or false to never expire */
  expiration: number | false
  /** Group number for co-revalidating prerender assets together */
  group?: number
  /** Random token for Draft Mode bypass cookie (`__prerender_bypass`) */
  bypassToken?: string
  /** Name of the optional fallback file relative to the configuration file */
  fallback?: string
  /** Query string parameter names that will be cached independently */
  allowQuery?: string[]
  /** When true, the query string will be present on the request argument */
  passQuery?: boolean
  /** Initial headers to include with the build-time prerendered response */
  initialHeaders?: Record<string, string>
  /** Initial HTTP status code for the build-time prerendered response (default 200) */
  initialStatus?: number
  /** When true, expose the response body regardless of status code including errors */
  exposeErrBody?: boolean
}
