'use client'

import { ReactNode } from 'react'

interface WatermarkOverlayProps {
  children: ReactNode
  isPaid: boolean
  className?: string
  style?: React.CSSProperties
}

/**
 * 워터마크 오버레이 컴포넌트
 * isPaid가 false일 때 배너가 외부에서 표시됨 (InvitationClient에서 처리)
 */
export function WatermarkOverlay({ children, isPaid, className = '', style }: WatermarkOverlayProps) {
  // 워터마크 배경 제거됨 - 배너는 InvitationClient에서 핸드폰 프레임 밖에 표시
  return <div className={className} style={style}>{children}</div>
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
