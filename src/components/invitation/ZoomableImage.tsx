'use client'

import { useRef, useState, useCallback, useEffect, type CSSProperties, type ReactNode, type PointerEvent as ReactPointerEvent, type TouchEvent as ReactTouchEvent } from 'react'
import { hdSrcOf } from '@/lib/hdImage'

/**
 * 라이트박스 내 이미지 줌 — 핀치(두 손가락) + 더블탭 토글 + 줌 상태에서 팬.
 * 경계 클램프로 이미지가 화면 밖으로 튀지 않게 함. 외부 라이브러리 없이 Pointer Events로 구현.
 * 라이트박스 좌우 이동은 각 템플릿의 이전/다음 버튼을 사용(줌 중엔 touch-action: none).
 * onSwipe를 넘기면 확대하지 않은 상태의 한 손가락 좌우 스와이프로 이전/다음 이동(핀치 제스처는 제외).
 *
 * children을 넘기면(제자리 확대 모드) src 대신 그 자식(각 라이트박스 타입의 기존 <img> 그대로)을 확대한다.
 * - 1배일 땐 transform·clip 없이 자식을 그대로 두므로 확대 미허용 때와 똑같이 보이고, 사진 전환 애니메이션도 <img>에 그대로 걸린다.
 * - 확대는 안쪽 래퍼에 걸고, 바깥 박스를 첫 <img>의 레이아웃 영역(둥근 모서리 포함)으로 clip-path 해서 사진 테두리 밖으로 넘치지 않게 한다.
 * - 안쪽 래퍼는 바깥 박스를 가득 채우는 가운데 정렬 flex 컨테이너 — 바깥 박스엔 padding을 두지 않는다.
 *
 * hdZoom(고화질 확대): '고화질로 다시 올리기'로 올린 사진(…_hqweb.webp)은 확대할 때 고화질 파일(…_full.webp)을
 * 미리 받아 다 받으면 바꿔 끼우고 최대 4배까지, 그 외 사진은 화질이 깨지지 않게 최대 2.5배까지만 확대한다.
 * 확대 중인 사진의 주소는 src(또는 제자리 확대 모드에선 첫 <img>)에서 읽는다.
 */
export default function ZoomableImage({
  src,
  alt = '',
  className = '',
  imgClassName = '',
  onZoomChange,
  resetKey,
  onSwipe,
  children,
  idleTouchAction,
  onTap,
  hdZoom = true,
}: {
  src?: string
  alt?: string
  className?: string
  imgClassName?: string
  onZoomChange?: (zoomed: boolean) => void
  resetKey?: number | string  // 값이 바뀌면 줌을 원래 크기로 리셋(라이트박스 사진 이동 시)
  onSwipe?: (dir: 1 | -1) => void  // 1 = 다음(왼쪽으로 스와이프), -1 = 이전
  children?: ReactNode  // 제자리 확대 모드 (위 설명)
  idleTouchAction?: CSSProperties['touchAction']  // 확대하지 않았을 때의 touch-action (기본 manipulation, 룩북처럼 세로 스크롤이 필요하면 'pan-y')
  onTap?: () => void  // 한 번 탭 — 더블탭(확대)과 구분하려고 300ms 기다렸다가 실행, 확대 중엔 실행하지 않음
  hdZoom?: boolean  // 고화질 확대 (위 설명, 기본 켜짐 — 모든 템플릿 공통). 끄면 예전처럼 모든 사진 최대 4배
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
  // 제자리 확대 모드: 안쪽 래퍼, 사진 영역(팬 한계 계산용), 확대 중 잘라낼 영역
  const innerRef = useRef<HTMLDivElement>(null)
  const frame = useRef<{ w: number; h: number } | null>(null)
  const [clip, setClip] = useState<string | undefined>(undefined)
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inPlace = children !== undefined
  // 고화질 확대: 지금 확대하는 사진 주소 / 다 받은 고화질 주소(src 모드에서 바꿔 끼움)
  const [hdShown, setHdShown] = useState<string | undefined>(undefined)
  const baseSrc = () => (inPlace ? innerRef.current?.querySelector('img')?.getAttribute('src') : src) || undefined
  const maxScaleNow = () => (!hdZoom ? 4 : hdSrcOf(baseSrc()) ? 4 : 2.5)

  useEffect(() => { onZoomChange?.(scale > 1.02) }, [scale, onZoomChange])

  // 라이트박스에서 사진을 넘기면 줌 리셋
  useEffect(() => { setScale(1); setTx(0); setTy(0) }, [resetKey])
  useEffect(() => { setHdShown(undefined) }, [resetKey, src])

  // 고화질 확대: 확대를 시작하면 고화질 파일을 미리 받아 두었다가 다 받으면 바꿔 끼운다 (받는 동안은 지금 사진 그대로)
  const zoomedNow = scale > 1.02
  useEffect(() => {
    if (!hdZoom || !zoomedNow) return
    const base = baseSrc()
    const hd = hdSrcOf(base)
    if (!hd || hd === base || hd === hdShown) return
    let alive = true
    const pre = new Image()
    pre.onload = () => {
      if (!alive) return
      if (inPlace) {
        const img = innerRef.current?.querySelector('img')
        if (img && img.getAttribute('src') === base) img.src = hd
      } else {
        setHdShown(hd)
      }
    }
    pre.src = hd
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hdZoom, zoomedNow, src, resetKey])

  const clamp = useCallback((s: number, x: number, y: number) => {
    const el = boxRef.current
    if (!el) return { x, y }
    // 제자리 확대 모드는 박스가 아니라 사진(가운데 정렬된 첫 <img>) 크기 기준
    const fw = inPlace && frame.current ? frame.current.w : el.clientWidth
    const fh = inPlace && frame.current ? frame.current.h : el.clientHeight
    const maxX = (fw * (s - 1)) / 2
    const maxY = (fh * (s - 1)) / 2
    return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) }
  }, [inPlace])

  // 제자리 확대 모드: 확대를 시작할 때 사진의 레이아웃 위치·크기(transform 영향 없는 offset 값)를 재서
  // 팬 한계와 clip-path(사진 테두리 + 둥근 모서리)를 정한다
  const measureFrame = () => {
    if (!inPlace) return
    const inner = innerRef.current
    const img = inner?.querySelector('img')
    if (!inner || !img) return
    const l = img.offsetLeft
    const t = img.offsetTop
    const w = img.offsetWidth
    const h = img.offsetHeight
    frame.current = { w, h }
    setClip(`inset(${t}px ${inner.clientWidth - l - w}px ${inner.clientHeight - t - h}px ${l}px round ${getComputedStyle(img).borderRadius})`)
  }

  const cancelTap = () => { if (tapTimer.current) { clearTimeout(tapTimer.current); tapTimer.current = null } }

  const reset = () => { setScale(1); setTx(0); setTy(0) }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    setInteracting(true)
    cancelTap() // 기다리던 한 번 탭은 다음 터치가 오면 취소 (더블탭·핀치·스와이프)

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
      if (scale <= 1) measureFrame()
    } else if (pointers.current.size === 1) {
      const now = Date.now()
      gestureMulti.current = false
      toggledNow.current = false
      const lt = lastTap.current
      if (lt && now - lt.t < 300 && Math.hypot(e.clientX - lt.x, e.clientY - lt.y) < 40) {
        // 더블탭: 줌 토글
        if (scale > 1) reset()
        else { measureFrame(); setScale(2.5) }
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
      const ns = Math.max(1, Math.min(maxScaleNow(), startScale.current * (dist / startDist.current)))
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
      // 이미 1배(더블탭으로 축소·핀치 없이 뗌)면 잘라내기 해제 — 1배로 돌아가는 애니메이션이 있으면 transitionend에서 해제
      if (inPlace && scale <= 1) setClip(undefined)
      if (isTap && onTap && scale <= 1.02) {
        const fn = onTap
        tapTimer.current = setTimeout(() => { tapTimer.current = null; fn() }, 300)
      }
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

  if (inPlace) {
    const moved = scale !== 1 || tx !== 0 || ty !== 0
    return (
      <div
        ref={boxRef}
        className={className}
        style={{
          position: 'relative',
          touchAction: zoomed || onSwipe ? 'none' : (idleTouchAction ?? 'manipulation'),
          cursor: zoomed ? 'grab' : undefined,
          clipPath: clip,
          WebkitClipPath: clip,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onTouchStart={onSwipe ? onTouchStart : undefined}
        onTouchEnd={onSwipe ? onTouchEnd : undefined}
        onTouchCancel={onSwipe ? onTouchEnd : undefined}
      >
        <div
          ref={innerRef}
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            // 1배에선 transform을 아예 걸지 않음 (확대 미허용 때와 렌더링 동일)
            transform: moved ? `translate(${tx}px, ${ty}px) scale(${scale})` : undefined,
            transformOrigin: 'center center',
            transition: interacting ? 'none' : 'transform 0.2s ease',
          }}
          onTransitionEnd={e => { if (e.target === e.currentTarget && scale <= 1) setClip(undefined) }}
        >
          {children}
        </div>
      </div>
    )
  }

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
        src={hdShown || src}
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
