export function Point(x: number, y: number) {
  ;(this as any).x = x
  ;(this as any).y = y
}

export function Sum(a: number, b: number) {
  return a + b
}

export function Capital() {
  const point = new (Point as any)(1, 2)
  return (
    <span id='capital'>
      {point.x}-{point.y}-{Sum(3, 4)}-v1
    </span>
  )
}
