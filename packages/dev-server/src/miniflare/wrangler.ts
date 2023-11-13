import fs from 'fs/promises'
import path from 'node:path'
import TOML from '@iarna/toml'
import { getVarsForDev } from './dev-vars.js'
import type { Config, RawConfig } from './types/config.js'
import { type PartialWorkerOptions } from './types/worker.js'

export const readToml = async (configPath: string): Promise<RawConfig> => {
  const configData = await fs.readFile(configPath, 'utf8')

  // Normalize CRLF to LF to avoid hitting https://github.com/iarna/iarna-toml/issues/33.
  const normalizedInput = configData.replace(/\r\n/g, '\n')
  return TOML.parse(normalizedInput)
}

function getLocalPersistencePath(persistTo: string | undefined) {
  return persistTo
    ? // If path specified, always treat it as relative to cwd()
      path.resolve(process.cwd(), persistTo)
    : // Otherwise, treat it as relative to wrangler.toml,
      // if one can be found, otherwise cwd()
      path.resolve(process.cwd(), '.wrangler/state')
}

export const getWranglerWorkerOptions = async (
  wranglerTomlPath: string
): Promise<PartialWorkerOptions> => {
  const tomlConfig = await readToml(wranglerTomlPath)
  const devVars = await getVarsForDev('.dev.vars')
  const bindings = {
    ...tomlConfig.vars,
    ...devVars,
  }

  const internalObjects: CfDurableObject[] = []
  const externalObjects: CfDurableObject[] = []
  for (const binding of tomlConfig.durable_objects?.bindings ?? []) {
    const internal = binding.script_name === undefined || binding.script_name === tomlConfig.name
    ;(internal ? internalObjects : externalObjects).push(binding)
  }

  const basePath = getLocalPersistencePath(undefined)
  const v3Path = path.join(basePath, 'v3')
  return {
    bindings,
    cachePersist: path.join(v3Path, 'cache'),
    d1Persist: path.join(v3Path, 'd1'),
    kvPersist: path.join(v3Path, 'kv'),
    r2Persist: path.join(v3Path, 'r2'),
    durableObjectsPersist: path.join(v3Path, 'do'),
    // https://github.com/cloudflare/workers-sdk/blob/3637d97a99c9d5e8d0d2b5f3adaf4bd9993265f0/packages/wrangler/src/dev/miniflare.ts#L310
    // TODO(codehex): implement durableObjects
    kvNamespaces: Object.fromEntries(tomlConfig.kv_namespaces?.map(kvNamespaceEntry) ?? []),
    r2Buckets: Object.fromEntries(tomlConfig.r2_buckets?.map(r2BucketEntry) ?? []),
    d1Databases: Object.fromEntries(tomlConfig.d1_databases?.map(d1DatabaseEntry) ?? []),
    queueProducers: Object.fromEntries(tomlConfig.queues?.producers?.map(queueProducerEntry) ?? []),
    queueConsumers: Object.fromEntries(tomlConfig.queues?.consumers?.map(queueConsumerEntry) ?? []),
    hyperdrives: Object.fromEntries(tomlConfig.hyperdrive?.map(hyperdriveEntry) ?? []),
  }
}

// https://github.com/cloudflare/workers-sdk/blob/main/packages/wrangler/src/deployment-bundle/worker.ts
/**
 * A KV namespace.
 */
export interface CfKvNamespace {
  binding: string
  id: string
}

/**
 * A Durable Object.
 */
interface CfDurableObject {
  name: string
  class_name: string
  script_name?: string
  environment?: string
}

interface CfQueue {
  binding: string
  queue: string
}

interface CfR2Bucket {
  binding: string
  bucket_name: string
  jurisdiction?: string
}

// TODO: figure out if this is duplicated in packages/wrangler/src/config/environment.ts
interface CfD1Database {
  binding: string
  database_id: string
  database_name?: string
  preview_database_id?: string
  database_internal_env?: string
  migrations_table?: string
  migrations_dir?: string
}

interface CfHyperdrive {
  binding: string
  id: string
  localConnectionString?: string
}

function kvNamespaceEntry({ binding, id }: CfKvNamespace): [string, string] {
  return [binding, id]
}
function r2BucketEntry({ binding, bucket_name }: CfR2Bucket): [string, string] {
  return [binding, bucket_name]
}
function d1DatabaseEntry(db: CfD1Database): [string, string] {
  return [db.binding, db.preview_database_id ?? db.database_id]
}
function queueProducerEntry(queue: CfQueue): [string, string] {
  return [queue.binding, queue.queue]
}
function hyperdriveEntry(hyperdrive: CfHyperdrive): [string, string] {
  return [hyperdrive.binding, hyperdrive.localConnectionString ?? '']
}
type QueueConsumer = NonNullable<Config['queues']['consumers']>[number]
function queueConsumerEntry(consumer: QueueConsumer) {
  const options = {
    maxBatchSize: consumer.max_batch_size,
    maxBatchTimeout: consumer.max_batch_timeout,
    maxRetires: consumer.max_retries,
    deadLetterQueue: consumer.dead_letter_queue,
  }
  return [consumer.queue, options] as const
}
