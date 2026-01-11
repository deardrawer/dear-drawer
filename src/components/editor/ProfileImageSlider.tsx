'use client'

import { useState, useCallback, useEffect } from 'react'

interface ImageSettings {
  scale: number
  positionX: number
  positionY: number
}

interface ProfileImageSliderProps {
  images: string[]
  imageSettings?: ImageSettings[]
  className?: string
}

export default function ProfileImageSlider({ images, imageSettings = [], className = '' }: ProfileImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // Reset to first image when images array changes
  useEffect(() => {
    setCurrentIndex(0)
  }, [images.length])

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }, [images.length])

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }, [images.length])

  // Touch handlers for swipe
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
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
  }

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
          className="w-full h-full bg-cover bg-center transition-transform duration-300"
          style={{
            backgroundImage: `url(${images[0]})`,
            transform: `scale(${settings.scale}) translate(${settings.positionX}%, ${settings.positionY}%)`,
          }}
        />
      </div>
    )
  }

  return (
    <div className={`relative w-full ${className}`}>
      {/* Slider container */}
      <div
        className="relative w-full aspect-[3/4] rounded-xl overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Images */}
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((image, index) => {
            const settings = imageSettings[index] || { scale: 1.0, positionX: 0, positionY: 0 }
            return (
              <div
                key={index}
                className="w-full h-full flex-shrink-0 overflow-hidden"
              >
                <div
                  className="w-full h-full bg-cover bg-center transition-transform duration-300"
                  style={{
                    backgroundImage: `url(${image})`,
                    transform: `scale(${settings.scale}) translate(${settings.positionX}%, ${settings.positionY}%)`,
                  }}
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
                index === currentIndex
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
