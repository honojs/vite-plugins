import { useEffect } from 'hono/jsx'

export function Effect() {
  useEffect(() => {}, [])
  return <p>effect</p>
}
