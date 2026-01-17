'use client'

import { ReactNode } from 'react'

interface WatermarkOverlayProps {
  children: ReactNode
  isPaid: boolean
  className?: string
  style?: React.CSSProperties
}

/**
 * 결제 전 이미지에 워터마크 오버레이를 표시하는 컴포넌트
 * isPaid가 false일 때만 워터마크가 표시됨
 */
export function WatermarkOverlay({ children, isPaid, className = '', style }: WatermarkOverlayProps) {
  if (isPaid) {
    return <div className={className} style={style}>{children}</div>
  }

  return (
    <div className={`relative ${className}`} style={style}>
      {children}
      {/* 워터마크 오버레이 */}
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 9999 }}
      >
        {/* 전체 화면 워터마크 */}
        <div
          className="absolute inset-0 flex items-center justify-center select-none"
          style={{
            transform: 'rotate(-30deg) scale(3)',
          }}
        >
          {/* 반복되는 워터마크 그리드 */}
          <div className="flex flex-col items-center gap-10">
            {Array.from({ length: 50 }).map((_, row) => (
              <div key={row} className="flex gap-6">
                {Array.from({ length: 30 }).map((_, col) => (
                  <span
                    key={col}
                    className="text-sm font-medium tracking-wider whitespace-nowrap select-none"
                    style={{
                      color: 'rgba(128, 128, 128, 0.3)',
                      textShadow: '0 1px 2px rgba(255,255,255,0.5)',
                    }}
                  >
                    dear drawer
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 단일 이미지에 워터마크를 표시하는 컴포넌트
 */
interface WatermarkImageProps {
  src: string
  alt: string
  isPaid: boolean
  className?: string
  style?: React.CSSProperties
}

export function WatermarkImage({ src, alt, isPaid, className = '', style }: WatermarkImageProps) {
  return (
    <div className="relative">
      <img src={src} alt={alt} className={className} style={style} />
      {!isPaid && (
        <div
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
          style={{ zIndex: 10 }}
        >
          <div
            className="transform select-none"
            style={{
              transform: 'rotate(-30deg)',
            }}
          >
            <span
              className="text-white text-2xl font-light tracking-widest whitespace-nowrap"
              style={{
                textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                opacity: 0.25,
              }}
            >
              dear drawer
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
