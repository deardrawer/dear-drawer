'use client'

import { useState } from 'react'
import { useSectionHighlight } from './SectionHighlightContext'
import { useTheme } from './ThemeContext'

// 크롭 데이터를 포함한 사진 타입
interface PhotoWithCrop {
  id: number
  url: string
  cropX?: number
  cropY?: number
  cropWidth?: number
  cropHeight?: number
}

interface MainPhotoSectionProps {
  photos?: PhotoWithCrop[]
  mainImage?: {
    url: string
    cropX?: number
    cropY?: number
    cropWidth?: number
    cropHeight?: number
  }
  groomName?: string
  brideName?: string
  groomParents?: string
  brideParents?: string
}

export default function MainPhotoSection({
  photos = [
    { id: 1, url: '/samples/parents/1.png' },
    { id: 2, url: '/samples/parents/2.png' },
    { id: 3, url: '/samples/parents/3.png' },
    { id: 4, url: '/samples/parents/4.png' },
    { id: 5, url: '/samples/parents/5.png' },
  ],
  mainImage,
  groomName = '김도윤',
  brideName = '이서연',
  groomParents = '김○○ · 박○○의 장남',
  brideParents = '이○○ · 김○○의 장녀',
}: MainPhotoSectionProps) {
  const { ref, isActive, hasAppeared } = useSectionHighlight('main-photo')
  const theme = useTheme()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 50) {
      setCurrentIndex((prev) => (prev + 1) % photos.length)
    }
    if (touchStart - touchEnd < -50) {
      setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length)
    }
  }

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      className="py-20 transition-all duration-500 min-h-screen flex flex-col items-center justify-center"
      style={{
        backgroundColor: theme.background,
        opacity: hasAppeared ? (isActive ? 1 : 0.3) : 0,
        transform: hasAppeared ? 'translateY(0)' : 'translateY(20px)',
        filter: isActive ? 'none' : 'grayscale(30%)',
      }}
    >
      <div
        className="w-full overflow-hidden mb-10 relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex justify-center">
          {photos.map((photo, index) => {
            let diff = index - currentIndex
            if (diff > photos.length / 2) diff -= photos.length
            if (diff < -photos.length / 2) diff += photos.length

            if (Math.abs(diff) > 1) return null

            return (
              <div
                key={photo.id}
                className="absolute transition-all duration-500 ease-out"
                style={{
                  width: '75%',
                  left: '50%',
                  transform: `translateX(calc(-50% + ${diff * 85}%))`,
                  zIndex: diff === 0 ? 10 : 5,
                }}
              >
                <div
                  className="aspect-[3/4] rounded-lg transition-all duration-500 overflow-hidden"
                  style={{
                    backgroundColor: '#E8E4DC',
                    boxShadow: diff === 0
                      ? '0 8px 30px rgba(0, 0, 0, 0.15)'
                      : '0 2px 8px rgba(0, 0, 0, 0.05)',
                    transform: diff === 0 ? 'scale(1)' : 'scale(0.9)',
                    opacity: diff === 0 ? 1 : 0.5,
                  }}
                >
                  {photo.url ? (() => {
                    const cw = photo.cropWidth || 1
                    const ch = photo.cropHeight || 1
                    const cx = photo.cropX || 0
                    const cy = photo.cropY || 0
                    const posX = cw >= 1 ? 0 : (cx / (1 - cw)) * 100
                    const posY = ch >= 1 ? 0 : (cy / (1 - ch)) * 100
                    return (
                      <div
                        className="w-full h-full"
                        style={{
                          backgroundImage: `url(${photo.url})`,
                          backgroundSize: `${100 / cw}% ${100 / ch}%`,
                          backgroundPosition: `${posX}% ${posY}%`,
                          backgroundRepeat: 'no-repeat',
                        }}
                      />
                    )
                  })() : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs" style={{ color: theme.accent }}>
                        Photo {index + 1}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <div className="w-[75%] mx-auto aspect-[3/4] pointer-events-none" />
      </div>

      <div className="flex gap-2 mb-10">
        {photos.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className="w-2 h-2 rounded-full transition-all duration-300"
            style={{
              backgroundColor: index === currentIndex ? theme.accent : '#E8E4DC',
            }}
          />
        ))}
      </div>

      <div className="text-center px-8">
        <h2
          className="font-serif text-2xl tracking-wider mb-6 transition-colors duration-500"
          style={{ color: isActive ? theme.text : '#999' }}
        >
          {groomName} <span style={{ color: isActive ? theme.accent : `${theme.accent}80` }}>✦</span> {brideName}
        </h2>

        <div className="space-y-1">
          <p className="text-sm transition-colors duration-500" style={{ color: isActive ? '#666' : '#aaa' }}>
            {groomParents}
          </p>
          <p className="text-sm transition-colors duration-500" style={{ color: isActive ? '#666' : '#aaa' }}>
            {brideParents}
          </p>
        </div>
      </div>
    </section>
  )
}
