'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface CropData {
  cropX?: number
  cropY?: number
  cropWidth?: number
  cropHeight?: number
  scale?: number
  positionX?: number
  positionY?: number
}

interface CroppedImageStyle {
  backgroundImage: string
  backgroundSize: string
  backgroundPosition: string
  backgroundRepeat: 'no-repeat'
}

// 이미지 자연 크기 캐시 (동일 이미지 반복 로드 방지)
const imageSizeCache = new Map<string, { w: number; h: number }>()

/**
 * 이미지 크롭 데이터 + 컨테이너 크기를 기반으로 정확한 CSS 스타일 계산
 * - 이미지 원본 비율 100% 유지
 * - 크롭 영역을 컨테이너에 정확히 맞춤
 */
export function useCroppedImageStyle(
  src: string | undefined,
  crop: CropData | undefined,
  containerRef: React.RefObject<HTMLDivElement | null>
): CroppedImageStyle | null {
  const [style, setStyle] = useState<CroppedImageStyle | null>(null)
  const prevKey = useRef('')

  const compute = useCallback(() => {
    if (!src || !containerRef.current) return

    const cw = crop?.cropWidth ?? 1
    const ch = crop?.cropHeight ?? 1
    const cx = crop?.cropX ?? 0
    const cy = crop?.cropY ?? 0
    const hasCrop = cw < 1 || ch < 1

    if (!hasCrop) {
      // 크롭 없으면 기존 scale/position 방식
      const s = crop?.scale || 1
      const px = crop?.positionX || 0
      const py = crop?.positionY || 0
      setStyle({
        backgroundImage: `url(${src})`,
        backgroundSize: s > 1 ? `${s * 100}%` : 'cover',
        backgroundPosition: s > 1 ? `${50 - px}% ${50 - py}%` : 'center',
        backgroundRepeat: 'no-repeat',
      })
      return
    }

    const container = containerRef.current
    const containerW = container.offsetWidth
    const containerH = container.offsetHeight

    if (containerW === 0 || containerH === 0) return

    const applyStyle = (imgW: number, imgH: number) => {
      // 크롭 영역의 실제 픽셀 크기
      const cropPixelW = cw * imgW
      const cropPixelH = ch * imgH

      // 크롭 영역을 컨테이너에 맞추기 위한 스케일 (cover 방식)
      const scaleX = containerW / cropPixelW
      const scaleY = containerH / cropPixelH
      const scale = Math.max(scaleX, scaleY)

      // 렌더링된 전체 이미지 크기
      const renderedW = imgW * scale
      const renderedH = imgH * scale

      // 크롭 시작점의 렌더링 좌표
      const offsetX = cx * renderedW
      const offsetY = cy * renderedH

      // 크롭 영역이 컨테이너보다 클 때 중앙 정렬 보정
      const cropRenderedW = cw * renderedW
      const cropRenderedH = ch * renderedH
      const adjustX = (cropRenderedW - containerW) / 2
      const adjustY = (cropRenderedH - containerH) / 2

      setStyle({
        backgroundImage: `url(${src})`,
        backgroundSize: `${renderedW}px ${renderedH}px`,
        backgroundPosition: `-${offsetX + adjustX}px -${offsetY + adjustY}px`,
        backgroundRepeat: 'no-repeat',
      })
    }

    // 캐시 확인
    const cached = imageSizeCache.get(src)
    if (cached) {
      applyStyle(cached.w, cached.h)
      return
    }

    // 이미지 로드하여 자연 크기 측정
    const img = new Image()
    img.onload = () => {
      imageSizeCache.set(src, { w: img.naturalWidth, h: img.naturalHeight })
      applyStyle(img.naturalWidth, img.naturalHeight)
    }
    img.src = src
  }, [src, crop?.cropX, crop?.cropY, crop?.cropWidth, crop?.cropHeight, crop?.scale, crop?.positionX, crop?.positionY, containerRef])

  useEffect(() => {
    // 키 생성하여 불필요한 재계산 방지
    const key = `${src}-${crop?.cropX}-${crop?.cropY}-${crop?.cropWidth}-${crop?.cropHeight}`
    if (key === prevKey.current) return
    prevKey.current = key

    compute()
  }, [compute])

  // 컨테이너 리사이즈 대응
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => compute())
    observer.observe(container)
    return () => observer.disconnect()
  }, [compute, containerRef])

  return style
}

/**
 * SSR-safe한 순수 함수 버전 (서버 컴포넌트/초기 렌더링용)
 * 이미지 크기를 모를 때 Math.max 근사값 사용
 */
export function getImageCropStyleFallback(
  img: string,
  s: CropData
): React.CSSProperties {
  const hasCrop = s.cropWidth !== undefined && s.cropHeight !== undefined && (s.cropWidth! < 1 || s.cropHeight! < 1)

  if (hasCrop) {
    const cw = s.cropWidth || 1
    const ch = s.cropHeight || 1
    const cx = s.cropX || 0
    const cy = s.cropY || 0

    const scale = Math.max(100 / cw, 100 / ch)
    const posX = cw < 1 ? (cx / (1 - cw)) * 100 : 50
    const posY = ch < 1 ? (cy / (1 - ch)) * 100 : 50

    return {
      backgroundImage: `url(${img})`,
      backgroundSize: `${scale}%`,
      backgroundPosition: `${posX}% ${posY}%`,
      backgroundRepeat: 'no-repeat',
    }
  }

  return {
    backgroundImage: `url(${img})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    transform: `scale(${s.scale || 1}) translate(${s.positionX || 0}%, ${s.positionY || 0}%)`,
  }
}
