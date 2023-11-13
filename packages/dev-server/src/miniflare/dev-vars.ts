// https://github.com/cloudflare/workers-sdk/blob/3637d97a99c9d5e8d0d2b5f3adaf4bd9993265f0/packages/wrangler/src/dev/dev-vars.ts#L14
import * as path from 'node:path'
import { tryLoadDotEnv } from './dotenv.js'
import type { Config } from './types/config.js'

export function getVarsForDev(configPath: string): Config['vars'] {
  const configDir = path.resolve(path.dirname(configPath ?? '.'))
  const devVarsPath = path.resolve(configDir, '.dev.vars')
  const loaded = tryLoadDotEnv(devVarsPath)
  if (loaded !== undefined) {
    const devVarsRelativePath = path.relative(process.cwd(), loaded.path)
    console.log(`Using vars defined in ${devVarsRelativePath}`)
    return {
      ...loaded.parsed,
    }
  } else {
    return {}
  }
}
