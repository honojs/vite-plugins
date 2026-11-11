import { useState } from 'hono/jsx'

export function Counter() {
  const [count] = useState(0)
  return <p>{count}</p>
}

export const Arrow = () => <p>arrow</p>
