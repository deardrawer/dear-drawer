'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

interface ImageSettings {
  scale: number
  positionX: number
  positionY: number
  cropX?: number
  cropY?: number
  cropWidth?: number
  cropHeight?: number
}

// 이미지 크롭 스타일 계산 헬퍼 함수
function getImageCropStyle(img: string, s: ImageSettings) {
  const hasCropData = s.cropWidth !== undefined && s.cropHeight !== undefined && (s.cropWidth < 1 || s.cropHeight < 1)

  if (hasCropData) {
    const cw = s.cropWidth || 1
    const ch = s.cropHeight || 1
    const cx = s.cropX || 0
    const cy = s.cropY || 0
    const posX = cw >= 1 ? 0 : (cx / (1 - cw)) * 100
    const posY = ch >= 1 ? 0 : (cy / (1 - ch)) * 100

    return {
      backgroundImage: `url(${img})`,
      backgroundSize: `${100 / cw}% ${100 / ch}%`,
      backgroundPosition: `${posX}% ${posY}%`,
      backgroundRepeat: 'no-repeat' as const,
    }
  }

  // 기존 scale/position 방식 (호환성 유지)
  return {
    backgroundImage: `url(${img})`,
    backgroundSize: 'cover' as const,
    backgroundPosition: 'center' as const,
    transform: `scale(${s.scale || 1}) translate(${s.positionX || 0}%, ${s.positionY || 0}%)`,
  }
}

interface ProfileImageSliderProps {
  images: string[]
  imageSettings?: ImageSettings[]
  className?: string
  autoPlay?: boolean
  autoPlayInterval?: number
}

export default function ProfileImageSlider({
  images,
  imageSettings = [],
  className = '',
  autoPlay = true,
  autoPlayInterval = 4000
}: ProfileImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(1) // 클론 때문에 1부터 시작
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null)
  const slidesRef = useRef<HTMLDivElement>(null)

  // 실제 표시 인덱스 계산 (0-based)
  const getDisplayIndex = () => {
    if (currentIndex === 0) return images.length - 1
    if (currentIndex === images.length + 1) return 0
    return currentIndex - 1
  }

  // Reset to first image when images array changes
  useEffect(() => {
    setCurrentIndex(1)
  }, [images.length])

  // Auto play functionality - 오른쪽으로만 진행
  useEffect(() => {
    if (!autoPlay || images.length <= 1 || isPaused) {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
        autoPlayRef.current = null
      }
      return
    }

    autoPlayRef.current = setInterval(() => {
      if (!isTransitioning) {
        setIsTransitioning(true)
        setCurrentIndex((prev) => prev + 1)
      }
    }, autoPlayInterval)

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
      }
    }
  }, [autoPlay, autoPlayInterval, images.length, isPaused, isTransitioning])

  // 무한 루프 처리 - 트랜지션 끝난 후 즉시 점프
  const handleTransitionEnd = () => {
    if (currentIndex === images.length + 1) {
      // 마지막 클론에서 실제 첫번째로 즉시 점프
      if (slidesRef.current) {
        slidesRef.current.style.transition = 'none'
      }
      setCurrentIndex(1)
      // 두 프레임 후에 트랜지션 복원 (점프가 완료된 후)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (slidesRef.current) {
            slidesRef.current.style.transition = 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          }
          setIsTransitioning(false)
        })
      })
    } else if (currentIndex === 0) {
      // 첫번째 클론에서 실제 마지막으로 즉시 점프
      if (slidesRef.current) {
        slidesRef.current.style.transition = 'none'
      }
      setCurrentIndex(images.length)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (slidesRef.current) {
            slidesRef.current.style.transition = 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          }
          setIsTransitioning(false)
        })
      })
    } else {
      setIsTransitioning(false)
    }
  }

  const goToSlide = useCallback((index: number) => {
    setIsTransitioning(true)
    setCurrentIndex(index + 1) // 클론 때문에 +1
  }, [])

  const goToNext = useCallback(() => {
    if (!isTransitioning) {
      setIsTransitioning(true)
      setCurrentIndex((prev) => prev + 1)
    }
  }, [isTransitioning])

  const goToPrev = useCallback(() => {
    if (!isTransitioning) {
      setIsTransitioning(true)
      setCurrentIndex((prev) => prev - 1)
    }
  }, [isTransitioning])

  // Touch handlers for swipe
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
    setIsPaused(true) // 터치 시 자동재생 일시정지
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && images.length > 1) {
      goToNext()
    }
    if (isRightSwipe && images.length > 1) {
      goToPrev()
    }

    // 잠시 후 자동재생 재개
    setTimeout(() => setIsPaused(false), 3000)
  }

  // 마우스 호버 시 일시정지
  const onMouseEnter = () => setIsPaused(true)
  const onMouseLeave = () => setIsPaused(false)

  if (images.length === 0) {
    return (
      <div className={`w-full aspect-[3/4] rounded-xl bg-white/50 flex items-center justify-center ${className}`}>
        <span className="text-gray-400 text-sm">Profile Image</span>
      </div>
    )
  }

  if (images.length === 1) {
    const settings = imageSettings[0] || { scale: 1.0, positionX: 0, positionY: 0 }
    return (
      <div className={`w-full aspect-[3/4] rounded-xl overflow-hidden ${className}`}>
        <div
          className="w-full h-full transition-transform duration-300"
          style={getImageCropStyle(images[0], settings)}
        />
      </div>
    )
  }

  // 클론 포함한 이미지 배열 (마지막 이미지 클론 + 원본들 + 첫번째 이미지 클론)
  const slidesWithClones = [images[images.length - 1], ...images, images[0]]
  const settingsWithClones = [
    imageSettings[images.length - 1] || { scale: 1.0, positionX: 0, positionY: 0 },
    ...imageSettings,
    imageSettings[0] || { scale: 1.0, positionX: 0, positionY: 0 }
  ]

  return (
    <div className={`relative w-full ${className}`}>
      {/* Slider container */}
      <div
        className="relative w-full aspect-[3/4] rounded-xl overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* Images with clones for infinite loop */}
        <div
          ref={slidesRef}
          className="flex h-full"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
            transition: 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {slidesWithClones.map((image, index) => {
            const settings = settingsWithClones[index] || { scale: 1.0, positionX: 0, positionY: 0 }
            return (
              <div
                key={index}
                className="w-full h-full flex-shrink-0 overflow-hidden"
              >
                <div
                  className="w-full h-full transition-transform duration-300"
                  style={getImageCropStyle(image, settings)}
                />
              </div>
            )
          })}
        </div>

        {/* Navigation arrows (optional, shown on hover) */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
              aria-label="Previous image"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
              aria-label="Next image"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Dots indicator */}
      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                index === getDisplayIndex()
                  ? 'bg-gray-700 w-4'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
