import type { Adapter } from "../types";

export const bunAdapter = (): Adapter => {
  if (typeof globalThis.navigator === 'undefined') {
    // @ts-expect-error not typed well
    globalThis.navigator = {
      userAgent: 'Bun',
    }
  } else {
    Object.defineProperty(globalThis.navigator, 'userAgent', {
      value: 'Bun',
      writable: false,
    })
  }
  return {
    env: process.env
  }
}

export default bunAdapter