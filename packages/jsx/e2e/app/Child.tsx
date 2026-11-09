import { useEffect, useState } from 'hono/jsx'

export function Child() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    ;(window as any).__effect = 'v1'
  }, [])
  return (
    <button id='child' onClick={() => setCount((n) => n + 1)}>
      child-v1:{count}
    </button>
  )
}
