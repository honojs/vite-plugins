import { memo, useState } from 'hono/jsx'

export const Memoized = memo(() => {
  const [count, setCount] = useState(0)
  return (
    <button id='memoized' onClick={() => setCount((n) => n + 1)}>
      memo-v1:{count}
    </button>
  )
})
