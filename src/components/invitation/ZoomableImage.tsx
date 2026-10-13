'use client'

import { useRef, useState, useCallback, useEffect, type PointerEvent as ReactPointerEvent } from 'react'

/**
 * 라이트박스 내 이미지 줌 — 핀치(두 손가락) + 더블탭 토글 + 줌 상태에서 팬.
 * 경계 클램프로 이미지가 화면 밖으로 튀지 않게 함. 외부 라이브러리 없이 Pointer Events로 구현.
 * 라이트박스 좌우 이동은 각 템플릿의 이전/다음 버튼을 사용(줌 중엔 touch-action: none).
 */
export default function ZoomableImage({
  src,
  alt = '',
  className = '',
  imgClassName = '',
  onZoomChange,
  resetKey,
}: {
  src: string
  alt?: string
  className?: string
  imgClassName?: string
  onZoomChange?: (zoomed: boolean) => void
  resetKey?: number | string  // 값이 바뀌면 줌을 원래 크기로 리셋(라이트박스 사진 이동 시)
}) {
  const [scale, setScale] = useState(1)
  const [tx, setTx] = useState(0)
  const [ty, setTy] = useState(0)
  const [interacting, setInteracting] = useState(false)

  const boxRef = useRef<HTMLDivElement>(null)
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map())
  const startDist = useRef(0)
  const startScale = useRef(1)
  const startT = useRef({ x: 0, y: 0 })
  const lastTap = useRef(0)
  const panStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null)

  useEffect(() => { onZoomChange?.(scale > 1.02) }, [scale, onZoomChange])

  // 라이트박스에서 사진을 넘기면 줌 리셋
  useEffect(() => { setScale(1); setTx(0); setTy(0) }, [resetKey])

  const clamp = useCallback((s: number, x: number, y: number) => {
    const el = boxRef.current
    if (!el) return { x, y }
    const maxX = (el.clientWidth * (s - 1)) / 2
    const maxY = (el.clientHeight * (s - 1)) / 2
    return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) }
  }, [])

  const reset = () => { setScale(1); setTx(0); setTy(0) }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    setInteracting(true)

    if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()]
      startDist.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      startScale.current = scale
      startT.current = { x: tx, y: ty }
      panStart.current = null
    } else if (pointers.current.size === 1) {
      const now = Date.now()
      if (now - lastTap.current < 300) {
        // 더블탭: 줌 토글
        if (scale > 1) reset()
        else setScale(2.5)
        lastTap.current = 0
        panStart.current = null
      } else {
        lastTap.current = now
        panStart.current = scale > 1 ? { x: e.clientX, y: e.clientY, tx, ty } : null
      }
    }
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointers.current.size === 2 && startDist.current > 0) {
      const pts = [...pointers.current.values()]
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      const ns = Math.max(1, Math.min(4, startScale.current * (dist / startDist.current)))
      const c = clamp(ns, startT.current.x, startT.current.y)
      setScale(ns); setTx(c.x); setTy(c.y)
    } else if (pointers.current.size === 1 && panStart.current && scale > 1) {
      const c = clamp(scale, panStart.current.tx + (e.clientX - panStart.current.x), panStart.current.ty + (e.clientY - panStart.current.y))
      setTx(c.x); setTy(c.y)
    }
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) startDist.current = 0
    if (pointers.current.size === 0) {
      panStart.current = null
      setInteracting(false)
      if (scale < 1.05) reset()
    }
  }

  const zoomed = scale > 1.02
  return (
    <div
      ref={boxRef}
      className={className}
      style={{ overflow: 'hidden', touchAction: zoomed ? 'none' : 'manipulation', cursor: zoomed ? 'grab' : 'zoom-in' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        className={imgClassName}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
          transformOrigin: 'center center',
          transition: interacting ? 'none' : 'transform 0.2s ease',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
