'use client'

// 인트로 사진: 크롭 편집기에서 정한 크기·위치를 반영해 그린다 (크롭이 없으면 가운데 꽉 채움)
import CroppedImageDiv from '@/components/ui/CroppedImageDiv'
import type { PhotoCrop } from './shared'

export default function IntroPhoto({ src, crop, className, style, label }: { src: string; crop?: PhotoCrop; className?: string; style?: React.CSSProperties; label?: string }) {
  if (!src) return null
  return (
    <CroppedImageDiv src={src} crop={crop || {}} className={className}
      style={{ backgroundRepeat: 'no-repeat', ...(crop ? {} : { backgroundSize: 'cover', backgroundPosition: 'center' }), ...style }}>
      {label && <span className="sr-only">{label}</span>}
    </CroppedImageDiv>
  )
}
