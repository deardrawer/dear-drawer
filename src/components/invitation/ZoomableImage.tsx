'use client'

import { useRef, useState, useCallback, useEffect, type PointerEvent as ReactPointerEvent, type TouchEvent as ReactTouchEvent } from 'react'

/**
 * 라이트박스 내 이미지 줌 — 핀치(두 손가락) + 더블탭 토글 + 줌 상태에서 팬.
 * 경계 클램프로 이미지가 화면 밖으로 튀지 않게 함. 외부 라이브러리 없이 Pointer Events로 구현.
 * 라이트박스 좌우 이동은 각 템플릿의 이전/다음 버튼을 사용(줌 중엔 touch-action: none).
 * onSwipe를 넘기면 확대하지 않은 상태의 한 손가락 좌우 스와이프로 이전/다음 이동(핀치 제스처는 제외).
 */
export default function ZoomableImage({
  src,
  alt = '',
  className = '',
  imgClassName = '',
  onZoomChange,
  resetKey,
  onSwipe,
}: {
  src: string
  alt?: string
  className?: string
  imgClassName?: string
  onZoomChange?: (zoomed: boolean) => void
  resetKey?: number | string  // 값이 바뀌면 줌을 원래 크기로 리셋(라이트박스 사진 이동 시)
  onSwipe?: (dir: 1 | -1) => void  // 1 = 다음(왼쪽으로 스와이프), -1 = 이전
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
  // 더블탭 판정: 직전 '탭'(거의 움직이지 않고 뗀 한 손가락)의 시각·위치 — 스와이프/핀치 직후 탭은 더블탭으로 보지 않음
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null)
  const tapStart = useRef<{ t: number; x: number; y: number } | null>(null)
  const gestureMulti = useRef(false) // 이번 제스처에 두 손가락 이상이 닿았는지
  const toggledNow = useRef(false)   // 이번 터치가 더블탭 토글이었는지
  // 스와이프(onSwipe) 추적 — 터치 이벤트 기준
  const swipeStart = useRef<{ x: number; y: number } | null>(null)
  const swipeMulti = useRef(false)
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

    if (pointers.current.size >= 2) {
      gestureMulti.current = true
      lastTap.current = null
      tapStart.current = null
    }
    if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()]
      startDist.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      startScale.current = scale
      startT.current = { x: tx, y: ty }
      panStart.current = null
    } else if (pointers.current.size === 1) {
      const now = Date.now()
      gestureMulti.current = false
      toggledNow.current = false
      const lt = lastTap.current
      if (lt && now - lt.t < 300 && Math.hypot(e.clientX - lt.x, e.clientY - lt.y) < 40) {
        // 더블탭: 줌 토글
        if (scale > 1) reset()
        else setScale(2.5)
        lastTap.current = null
        tapStart.current = null
        toggledNow.current = true
        panStart.current = null
      } else {
        tapStart.current = { t: now, x: e.clientX, y: e.clientY }
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
      // 한 손가락으로 거의 움직이지 않고 뗐을 때만 '탭'으로 기록 (다음 탭과 합쳐 더블탭)
      const ts = tapStart.current
      const isTap = e.type === 'pointerup' && !gestureMulti.current && !toggledNow.current && !!ts
        && Date.now() - ts.t < 350 && Math.hypot(e.clientX - ts.x, e.clientY - ts.y) < 12
      lastTap.current = isTap ? { t: Date.now(), x: e.clientX, y: e.clientY } : null
      tapStart.current = null
      panStart.current = null
      setInteracting(false)
      // 핀치로 거의 원래 크기까지 줄였으면 정확히 1배로 스냅 → onZoomChange(false)로 스와이프 이동 복구
      if (scale < 1.15) reset()
    }
  }

  const onTouchStart = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (!onSwipe) return
    if (e.touches.length > 1) { swipeMulti.current = true; swipeStart.current = null; return }
    // 확대 중엔 팬 제스처 → 스와이프 이동 없음
    swipeStart.current = scale > 1.02 ? null : { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }

  const onTouchEnd = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (!onSwipe) return
    // 두 손가락(핀치) 제스처는 손가락을 모두 뗄 때까지 스와이프로 보지 않음
    if (swipeMulti.current) { if (e.touches.length === 0) swipeMulti.current = false; return }
    const st = swipeStart.current
    swipeStart.current = null
    if (!st || scale > 1.02 || e.type !== 'touchend') return
    const dx = e.changedTouches[0].clientX - st.x
    const dy = e.changedTouches[0].clientY - st.y
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) onSwipe(dx < 0 ? 1 : -1)
  }

  const zoomed = scale > 1.02
  return (
    <div
      ref={boxRef}
      className={className}
      // onSwipe 사용 시엔 가로 스와이프를 직접 처리하므로 브라우저 팬/오버스크롤(뒤로가기 등)에 넘기지 않음
      style={{ overflow: 'hidden', touchAction: zoomed || onSwipe ? 'none' : 'manipulation', cursor: zoomed ? 'grab' : 'zoom-in' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onTouchStart={onSwipe ? onTouchStart : undefined}
      onTouchEnd={onSwipe ? onTouchEnd : undefined}
      onTouchCancel={onSwipe ? onTouchEnd : undefined}
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
