import type { Json, MiniflareOptions, WorkerOptions } from 'miniflare'
import type { Environment } from './environment.js'

export type PartialWorkerOptions = Partial<
  Omit<
    WorkerOptions,
    // We can ignore these properties:
    'name' | 'script' | 'scriptPath' | 'modules' | 'modulesRoot' | 'modulesRules'
  > &
    Pick<
      MiniflareOptions,
      'cachePersist' | 'd1Persist' | 'durableObjectsPersist' | 'kvPersist' | 'r2Persist'
    >
>
export type Bindings = NonNullable<PartialWorkerOptions['bindings']>

export type AdditionalDevProps = {
  vars?: Record<string, string | Json>
  kv?: {
    binding: string
    id: string
    preview_id?: string
  }[]
  durableObjects?: {
    name: string
    class_name: string
    script_name?: string | undefined
    environment?: string | undefined
  }[]
  services?: {
    binding: string
    service: string
    environment?: string
  }[]
  r2?: {
    binding: string
    bucket_name: string
    preview_bucket_name?: string
    jurisdiction?: string
  }[]
  d1Databases?: Environment['d1_databases']
}
