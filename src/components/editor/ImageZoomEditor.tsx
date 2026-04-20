'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { RotateCcw } from 'lucide-react'

interface ImageZoomEditorProps {
  imageUrl: string
  scale: number
  positionX: number
  positionY: number
  onUpdate: (patch: { scale?: number; positionX?: number; positionY?: number }) => void
  containerWidth?: number
  aspectRatio?: number // 프리뷰 비율 (1 = 정사각형, 4/5 = 세로형)
}

/**
 * 갤러리 이미지용 줌 + 위치 에디터
 * - 슬라이더로 줌(1x~3x)
 * - 드래그로 위치 조정
 * - cover 기반이라 비율 문제 없음
 */
export default function ImageZoomEditor({
  imageUrl,
  scale,
  positionX,
  positionY,
  onUpdate,
  containerWidth = 220,
  aspectRatio = 1,
}: ImageZoomEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 })

  const containerHeight = containerWidth * aspectRatio
  // cover 모드에서도 세로가 긴 사진의 위치 조정 허용 (기본 ±40)
  const maxOffset = Math.max((scale - 1) * 50, 40)

  // 배경 스타일 계산 (cover 기반 — 위치는 항상 적용)
  const bgSize = scale > 1 ? `${scale * 100}%` : 'cover'
  const bgPos = `${50 - positionX}% ${50 - positionY}%`

  // 드래그 시작
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    setDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY, px: positionX, py: positionY }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  // 드래그 이동
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return
    const dx = (e.clientX - dragStart.current.x) / containerWidth * 50
    const dy = (e.clientY - dragStart.current.y) / containerHeight * 50

    // 이동 범위 제한: cover 모드에서도 기본 ±40 허용
    const mo = Math.max((scale - 1) * 50, 40)
    const nextX = Math.max(-mo, Math.min(mo, dragStart.current.px + dx))
    const nextY = Math.max(-mo, Math.min(mo, dragStart.current.py + dy))

    onUpdate({ positionX: nextX, positionY: nextY })
  }, [dragging, scale, containerWidth, containerHeight, onUpdate])

  // 드래그 종료
  const handlePointerUp = useCallback(() => {
    setDragging(false)
  }, [])

  // 줌 변경 시 위치 범위 보정
  const handleZoomChange = (newScale: number) => {
    const maxOffset = Math.max((newScale - 1) * 50, 40)
    const clampedX = Math.max(-maxOffset, Math.min(maxOffset, positionX))
    const clampedY = Math.max(-maxOffset, Math.min(maxOffset, positionY))
    onUpdate({ scale: newScale, positionX: clampedX, positionY: clampedY })
  }

  // 리셋
  const handleReset = () => {
    onUpdate({ scale: 1, positionX: 0, positionY: 0 })
  }

  return (
    <div style={{ width: containerWidth }}>
      {/* 프리뷰 영역 */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          width: containerWidth,
          height: containerHeight,
          overflow: 'hidden',
          borderRadius: 4,
          cursor: dragging ? 'grabbing' : 'grab',
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: bgSize,
          backgroundPosition: bgPos,
          backgroundRepeat: 'no-repeat',
          touchAction: 'none',
        }}
      />

      {/* 슬라이더 영역 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
        {/* 줌 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: '#78716c', flexShrink: 0, width: 28 }}>확대</span>
          <input
            type="range"
            min={100}
            max={300}
            step={1}
            value={Math.round(scale * 100)}
            onChange={(e) => handleZoomChange(Number(e.target.value) / 100)}
            style={{ flex: 1, height: 4, accentColor: '#57534e' }}
          />
          <span style={{ fontSize: 10, color: '#a8a29e', flexShrink: 0, width: 28, textAlign: 'right' }}>
            {scale.toFixed(1)}x
          </span>
        </div>

        {/* X 위치 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: '#78716c', flexShrink: 0, width: 28 }}>좌우</span>
          <input
            type="range"
            min={-maxOffset * 100}
            max={maxOffset * 100}
            step={1}
            value={Math.round(positionX * 100)}
            onChange={(e) => onUpdate({ positionX: Number(e.target.value) / 100 })}
            style={{ flex: 1, height: 4, accentColor: '#57534e' }}
          />
          <span style={{ fontSize: 10, color: '#a8a29e', flexShrink: 0, width: 28, textAlign: 'right' }}>
            {positionX !== 0 ? (positionX > 0 ? `+${positionX.toFixed(0)}` : positionX.toFixed(0)) : '0'}
          </span>
        </div>

        {/* Y 위치 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: '#78716c', flexShrink: 0, width: 28 }}>상하</span>
          <input
            type="range"
            min={-maxOffset * 100}
            max={maxOffset * 100}
            step={1}
            value={Math.round(positionY * 100)}
            onChange={(e) => onUpdate({ positionY: Number(e.target.value) / 100 })}
            style={{ flex: 1, height: 4, accentColor: '#57534e' }}
          />
          <span style={{ fontSize: 10, color: '#a8a29e', flexShrink: 0, width: 28, textAlign: 'right' }}>
            {positionY !== 0 ? (positionY > 0 ? `+${positionY.toFixed(0)}` : positionY.toFixed(0)) : '0'}
          </span>
        </div>
      </div>

      {/* 리셋 */}
      {(scale > 1 || positionX !== 0 || positionY !== 0) && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
          <button
            type="button"
            onClick={handleReset}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              fontSize: 10, color: '#78716c', border: '1px solid #d6d3d1',
              borderRadius: 4, padding: '2px 6px', background: 'transparent',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={10} />
            리셋
          </button>
        </div>
      )}
    </div>
  )
}
