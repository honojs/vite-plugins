import type { Adapter } from "../types"
export const nodeAdapter = (): Adapter => {
  if (typeof globalThis.navigator === 'undefined') {
    // @ts-expect-error not typed well
    globalThis.navigator = {
      userAgent: 'Node.js',
    }
  } else {
    Object.defineProperty(globalThis.navigator, 'userAgent', {
      value: 'Node.js',
      writable: false,
    })
  }
  return {
    env: process.env
  }
}

export default nodeAdapter;