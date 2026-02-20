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
    { id: 6, url: '/samples/parents/6.png' },
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
  const [gridExpanded, setGridExpanded] = useState(false)
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoWithCrop | null>(null)

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

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length)
  }

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      className="py-20 transition-all duration-500 min-h-screen flex flex-col items-center justify-center overflow-hidden"
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
        {/* 좌측 네비게이션 버튼 */}
        <button
          onClick={handlePrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          }}
          aria-label="이전 사진"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.accent}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* 우측 네비게이션 버튼 */}
        <button
          onClick={handleNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          }}
          aria-label="다음 사진"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.accent}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

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

      {/* 바둑판식 그리드 갤러리 */}
      {photos.length > 0 && (
        <div className="w-full px-1 mt-14">
          <div className="grid grid-cols-3 gap-[2px]">
            {(gridExpanded ? photos : photos.slice(0, 3)).map((photo) => {
              const cw = photo.cropWidth || 1
              const ch = photo.cropHeight || 1
              const cx = photo.cropX || 0
              const cy = photo.cropY || 0
              const posX = cw >= 1 ? 0 : (cx / (1 - cw)) * 100
              const posY = ch >= 1 ? 0 : (cy / (1 - ch)) * 100
              return (
                <div
                  key={`grid-${photo.id}`}
                  className="aspect-[3/4] overflow-hidden cursor-pointer active:opacity-80 transition-opacity"
                  onClick={() => setLightboxPhoto(photo)}
                >
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundImage: `url(${photo.url})`,
                      backgroundSize: `${100 / cw}% ${100 / ch}%`,
                      backgroundPosition: `${posX}% ${posY}%`,
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                </div>
              )
            })}
          </div>
          {photos.length > 3 && (
            <button
              onClick={() => setGridExpanded(!gridExpanded)}
              className="w-full flex items-center justify-center gap-1.5 py-3.5 mt-[2px] text-[13px] font-medium transition-all"
              style={{ backgroundColor: '#f5f5f5', color: theme.text }}
            >
              {gridExpanded ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  접기
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  사진 더보기 ({photos.length - 3})
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* 사진 확대 라이트박스 */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            onClick={() => setLightboxPhoto(null)}
            className="absolute top-5 right-5 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={lightboxPhoto.url}
            alt="갤러리 사진"
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  )
}
