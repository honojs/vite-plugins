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
  env?: EnvFunc
  onServerClose?: () => void | Promise<void>
}
