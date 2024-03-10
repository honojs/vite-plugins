export type Env = Record<string, unknown> | Promise<Record<string, unknown>>
export type EnvFunc = () => Env | Promise<Env>
export type GetEnv<Options> = (options: Options) => EnvFunc
export interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void
  passThroughOnException(): void
}

export type Fetch = (
  request: Request,
  env: {},
  executionContext: ExecutionContext
) => Promise<Response>

export interface Plugin {
  env?: Env | EnvFunc
  onServerClose?: () => void | Promise<void>
}

export interface Adapter {
  /**
   * Environment variables to be injected into the worker
   */
  env?: Env
  /**
   * Function called when the vite dev server is closed
   */
  onServerClose?: () => Promise<void>
  /**
   * Implementation of waitUntil and passThroughOnException
   */
  executionContext?: {
    waitUntil(promise: Promise<unknown>): void
    passThroughOnException(): void
  }
}
