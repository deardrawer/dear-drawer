'use client'

import { useRef } from 'react'
import { useCroppedImageStyle, getImageCropStyleFallback } from '@/hooks/useCroppedImageStyle'

interface CropData {
  cropX?: number
  cropY?: number
  cropWidth?: number
  cropHeight?: number
  scale?: number
  positionX?: number
  positionY?: number
}

interface CroppedImageDivProps {
  src: string
  crop?: CropData
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}

/**
 * 이미지 크롭을 정확하게 렌더링하는 div 컴포넌트
 * - JS로 이미지 원본 크기를 측정하여 정확한 CSS 계산
 * - 이미지 로드 전에는 Math.max 근사값 사용 (깜빡임 최소화)
 * - 비율 100% 유지
 */
export default function CroppedImageDiv({ src, crop, className, style, children }: CroppedImageDivProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const exactStyle = useCroppedImageStyle(src, crop, containerRef)

  // JS 정확값이 준비되면 사용, 아니면 fallback
  const bgStyle = exactStyle || (src ? getImageCropStyleFallback(src, crop || {}) : {})

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ ...bgStyle, ...style }}
    >
      {children}
    </div>
  )
}
