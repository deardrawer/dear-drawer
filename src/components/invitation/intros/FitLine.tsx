'use client'

// 한 줄 글자가 주어진 폭을 넘으면 그만큼 줄여 보여준다 (긴 이름·작은 화면에서 잘리지 않게).
// 글꼴이 늦게 불러와져도 다시 잰다.
import { useEffect, useRef, useState, type ReactNode } from 'react'

export default function FitLine({ max, children, origin = 'center' }: { max: number; children: ReactNode; origin?: 'center' | 'left' | 'right' }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [k, setK] = useState(1)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let alive = true
    const measure = () => requestAnimationFrame(() => {
      if (!alive || !el) return
      const natural = el.offsetWidth
      setK(natural > max && natural > 0 ? max / natural : 1)
    })
    measure()
    document.fonts?.ready.then(measure, () => {})
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => { alive = false; ro.disconnect() }
  }, [max, children])
  return (
    <span ref={ref} className="inline-block whitespace-nowrap" style={{ transform: k < 1 ? `scale(${k})` : undefined, transformOrigin: `${origin} center` }}>
      {children}
    </span>
  )
}
