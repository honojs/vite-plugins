import { useState } from 'hono/jsx'
import Arrow from './Arrow'
import { Capital } from './Capital'
import { Child } from './Child'
import { helperLabel } from './helper'
import { Hooks } from './Hooks'
import { Memoized } from './Memoized'

export function App() {
  const [count, setCount] = useState(0)
  return (
    <main>
      <button id='app' onClick={() => setCount((n) => n + 1)}>
        app:{count}
      </button>
      <input id='text' />
      <span id='helper'>{helperLabel}</span>
      <Child />
      <Arrow />
      <Hooks />
      <Memoized />
      <Capital />
    </main>
  )
}
