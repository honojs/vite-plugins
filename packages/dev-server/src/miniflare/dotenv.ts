import fs from 'node:fs'
import dotenv from 'dotenv'

export interface DotEnv {
  path: string
  parsed: dotenv.DotenvParseOutput
}

export function tryLoadDotEnv(path: string): DotEnv | undefined {
  try {
    const parsed = dotenv.parse(fs.readFileSync(path))
    return { path, parsed }
  } catch (e) {
    console.error(`Failed to load .env file "${path}":`, e)
  }
}
