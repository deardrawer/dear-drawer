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
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 10 }}
      >
        {/* 대각선 반복 패턴 워터마크 */}
        <div
          className="absolute inset-0"
          style={{
            background: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 80px,
              rgba(255, 255, 255, 0.03) 80px,
              rgba(255, 255, 255, 0.03) 160px
            )`,
          }}
        />

        {/* 중앙 워터마크 텍스트들 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="transform -rotate-30 select-none"
            style={{
              transform: 'rotate(-30deg)',
            }}
          >
            {/* 반복되는 워터마크 그리드 */}
            <div className="flex flex-col gap-24">
              {[0, 1, 2, 3, 4].map((row) => (
                <div key={row} className="flex gap-16">
                  {[0, 1, 2, 3].map((col) => (
                    <span
                      key={col}
                      className="text-white text-opacity-20 text-lg font-light tracking-widest whitespace-nowrap select-none"
                      style={{
                        textShadow: '0 0 10px rgba(0,0,0,0.3)',
                        opacity: 0.15,
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
