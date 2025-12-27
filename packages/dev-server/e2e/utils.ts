import { test as baseTest } from '@playwright/test'
import type { ChildProcess } from 'node:child_process'
import { exec, spawn, execSync } from 'node:child_process'
import { createConnection, createServer } from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

export const test = baseTest

const execAsync = promisify(exec)

const getAvailablePort = async (): Promise<number> =>
  new Promise((resolve, reject) => {
    const server = createServer()
    server.unref()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        server.close(() => reject(new Error('Failed to acquire a free port')))
        return
      }
      const { port } = address
      server.close(() => resolve(port))
    })
  })

const PORT_WAIT_TIMEOUT_MS = 10_000

const waitForPortReady = async (port: number): Promise<void> =>
  new Promise((resolve, reject) => {
    const start = Date.now()
    const tryConnect = () => {
      const socket = createConnection(port)
      socket.once('connect', () => {
        socket.end()
        resolve()
      })
      socket.once('error', () => {
        socket.destroy()
        if (Date.now() - start >= PORT_WAIT_TIMEOUT_MS) {
          reject(new Error(`Timeout while waiting for port ${port}`))
          return
        }
        setTimeout(tryConnect, 200)
      })
    }
    tryConnect()
  })

const runShell = (command: string, cwd: string): ChildProcess =>
  spawn(command, {
    cwd,
    shell: true,
    detached: process.platform !== 'win32',
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

const terminate = async (cp: ChildProcess): Promise<void> => {
  if (cp.exitCode !== null) {
    return
  }
  if (process.platform === 'win32') {
    await execAsync(`taskkill /pid ${cp.pid} /t /f`)
  } else if (cp.pid) {
    process.kill(-cp.pid, 'SIGTERM')
  }
}

type StartAppResult = {
  port: number
  stopApp: () => Promise<void>
}

type PrepareDevServerSetupOptions = {
  runtime?: 'node' | 'bun'
}

const e2eRootDir = path.dirname(fileURLToPath(import.meta.url))

export const prepareDevServerSetup = (
  fixtureName: string,
  { runtime = 'node' }: PrepareDevServerSetupOptions = {}
) => {
  const cwd = path.join(e2eRootDir, fixtureName)
  return async (): Promise<StartAppResult> => {
    const port = await getAvailablePort()

    const viteConfig = './vite.config.ts'

    const isCmdAvailable = (cmd: string) => {
      try {
        execSync(`command -v ${cmd}`, { stdio: 'ignore' })
        return true
      } catch {
        return false
      }
    }

    if (runtime === 'bun') {
      if (!isCmdAvailable('bun')) {
        // eslint-disable-next-line
        throw new Error("'bun' not found in PATH.")
      }
    } else {
      if (!isCmdAvailable('node')) {
        // eslint-disable-next-line
        throw new Error("'node' not found in PATH.")
      }
    }

    const command =
      runtime === 'bun'
        ? `bun --bun vite --port ${port} --strictPort -c ${viteConfig}`
        : `yarn vite --port ${port} --strictPort -c ${viteConfig}`

    const cp = runShell(command, cwd)
    await waitForPortReady(port)
    const stopApp = () => terminate(cp)
    return { port, stopApp }
  }
}
