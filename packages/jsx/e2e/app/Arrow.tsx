import { useState } from 'hono/jsx'

const Arrow = () => {
  const [count, setCount] = useState(0)
  return (
    <button id='arrow' onClick={() => setCount((n) => n + 1)}>
      arrow-v1:{count}
    </button>
  )
}

export default Arrow
