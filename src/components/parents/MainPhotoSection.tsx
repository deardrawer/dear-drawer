'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useSectionHighlight } from './SectionHighlightContext'
import { useTheme } from './ThemeContext'

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
  groomParentsNode?: React.ReactNode
  brideParentsNode?: React.ReactNode
  isPreview?: boolean
}

/** 독립적인 IntersectionObserver 훅 (활성/비활성 + 최초등장) */
function useSubSection() {
  const ref = useRef<HTMLDivElement>(null)
  const [isActive, setIsActive] = useState(false)
  const [hasAppeared, setHasAppeared] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const active = entry.intersectionRatio > 0.3
        setIsActive(active)
        if (active && !hasAppeared) setHasAppeared(true)
      },
      {
        threshold: [0, 0.1, 0.2, 0.3, 0.5, 0.7, 1],
        rootMargin: '-10% 0px -10% 0px',
      }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasAppeared])

  return { ref, isActive, hasAppeared }
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
  groomName = '도윤',
  brideName = '서연',
  groomParents = '',
  brideParents = '',
  groomParentsNode,
  brideParentsNode,
  isPreview = false,
}: MainPhotoSectionProps) {
  // 섹션 전체 (SectionHighlightContext 용)
  const { ref: sectionRef } = useSectionHighlight('main-photo')
  const theme = useTheme()

  // 독립 서브섹션: 커플 정보 / 갤러리
  const coupleSection = useSubSection()
  const gallerySection = useSubSection()

  // 에디터 미리보기에서는 IntersectionObserver가 작동하지 않으므로 즉시 표시
  const cA = isPreview ? true : coupleSection.isActive
  const cH = isPreview ? true : coupleSection.hasAppeared
  const gA = isPreview ? true : gallerySection.isActive
  const gH = isPreview ? true : gallerySection.hasAppeared

  const [gridExpanded, setGridExpanded] = useState(false)
  const [expandAnimReady, setExpandAnimReady] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null)
  const [pressedIndex, setPressedIndex] = useState<number | null>(null)
  const touchStartXRef = useRef<number>(0)

  const validPhotos = photos.filter(p => p.url && p.url.trim() !== '')
  const heroImage = (mainImage && mainImage.url && mainImage.url.trim() !== '') ? mainImage : (validPhotos.length > 0 ? validPhotos[0] : null)
  const galleryPhotos = (mainImage && mainImage.url && mainImage.url.trim() !== '') ? validPhotos : validPhotos.slice(1)

  const getCropStyle = (photo: { url: string; cropX?: number; cropY?: number; cropWidth?: number; cropHeight?: number }) => {
    const cw = photo.cropWidth || 1
    const ch = photo.cropHeight || 1
    const cx = photo.cropX || 0
    const cy = photo.cropY || 0
    const centerX = (cx + cw / 2) * 100
    const centerY = (cy + ch / 2) * 100
    return {
      backgroundImage: `url(${photo.url})`,
      backgroundSize: 'cover',
      backgroundPosition: `${centerX}% ${centerY}%`,
      backgroundRepeat: 'no-repeat' as const,
    }
  }

  // 라이트박스용 전체 사진 목록 (히어로 + 갤러리)
  const allPhotos: PhotoWithCrop[] = [
    ...(heroImage ? [{ id: 0, url: heroImage.url, cropX: heroImage.cropX, cropY: heroImage.cropY, cropWidth: heroImage.cropWidth, cropHeight: heroImage.cropHeight }] : []),
    ...galleryPhotos,
  ]

  const displayPhotos = gridExpanded ? galleryPhotos : galleryPhotos.slice(0, 3)

  return (
    <section
      ref={sectionRef as React.RefObject<HTMLDivElement>}
      className="overflow-hidden"
      style={{ backgroundColor: theme.background }}
    >
      {/* ═══════════ HERO IMAGE ═══════════ */}
      {heroImage && heroImage.url && (
        <div
          className="w-full aspect-[3/4] relative overflow-hidden cursor-pointer"
          style={{
            opacity: cH ? 1 : 0,
            transform: cH ? 'scale(1)' : 'scale(1.05)',
            transition: 'opacity 1.2s ease, transform 1.2s ease',
          }}
          onClick={() => !isPreview && setLightboxIndex(0)}
        >
          <div className="w-full h-full" style={getCropStyle(heroImage)} />
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              height: '200px',
              background: `linear-gradient(to top, ${theme.background} 0%, transparent 100%)`,
            }}
          />
        </div>
      )}

      {/* ═══════════ COUPLE INFO (독립 활성화) ═══════════ */}
      <div
        ref={coupleSection.ref}
        className="relative z-10 px-8 pb-14"
        style={{
          marginTop: heroImage?.url ? '-60px' : '80px',
          opacity: cH ? (cA ? 1 : 0.25) : 0,
          filter: cA ? 'none' : 'grayscale(40%)',
          transition: 'opacity 0.6s ease, filter 0.6s ease',
        }}
      >
        {/* Names */}
        <div
          className="flex items-center justify-center gap-5 mb-4"
          style={{
            opacity: cH ? 1 : 0,
            transform: cH ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.9s ease, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
            transitionDelay: cH ? '0.2s' : '0s',
          }}
        >
          <span
            className="text-[22px] tracking-[6px]"
            style={{
              color: cA ? theme.text : '#999',
              fontWeight: 300,
              transition: 'color 0.5s',
            }}
          >
            {groomName}
          </span>
          <span
            className="text-[16px] italic"
            style={{
              fontFamily: "'Cormorant Garamond', 'Georgia', serif",
              fontWeight: 300,
              color: cA ? theme.primary : '#bbb',
              transform: cH ? 'scale(1)' : 'scale(0)',
              opacity: cH ? 1 : 0,
              transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.6s, color 0.5s',
              transitionDelay: cH ? '0.5s' : '0s',
            }}
          >
            and
          </span>
          <span
            className="text-[22px] tracking-[6px]"
            style={{
              color: cA ? theme.text : '#999',
              fontWeight: 300,
              transition: 'color 0.5s',
            }}
          >
            {brideName}
          </span>
        </div>

        {/* Parents info - 양쪽 다 비어있으면 전체 숨김, 한쪽만 있으면 그 쪽만 표시 */}
        {(groomParentsNode || groomParents || brideParentsNode || brideParents) && (
          <div
            className="flex justify-center gap-8 text-xs leading-[1.8]"
            style={{
              opacity: cH ? 1 : 0,
              transform: cH ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.8s ease, transform 0.8s ease',
              transitionDelay: cH ? '0.45s' : '0s',
            }}
          >
            {(groomParentsNode || groomParents) && (
              <div className="text-center">
                <div
                  className="text-[10px] tracking-[2px] mb-1"
                  style={{ color: cA ? `${theme.accent}80` : '#bbb', transition: 'color 0.5s' }}
                >
                  신랑
                </div>
                <p style={{ color: cA ? theme.textLight : '#aaa', transition: 'color 0.5s' }}>
                  {groomParentsNode || groomParents}
                </p>
              </div>
            )}
            {(brideParentsNode || brideParents) && (
              <div className="text-center">
                <div
                  className="text-[10px] tracking-[2px] mb-1"
                  style={{ color: cA ? `${theme.accent}80` : '#bbb', transition: 'color 0.5s' }}
                >
                  신부
                </div>
                <p style={{ color: cA ? theme.textLight : '#aaa', transition: 'color 0.5s' }}>
                  {brideParentsNode || brideParents}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════════ GALLERY (독립 활성화) ═══════════ */}
      {galleryPhotos.length > 0 && (
        <div
          ref={gallerySection.ref}
          style={{
            opacity: gH ? (gA ? 1 : 0.2) : 0,
            filter: gA ? 'none' : 'grayscale(40%)',
            transition: 'opacity 0.6s ease, filter 0.6s ease',
          }}
        >
          {/* ── Separator: ornament lines + diamond + label ── */}
          <div className="flex flex-col items-center pt-2 pb-10">
            <div className="flex items-center gap-3 mb-5">
              {/* Left line */}
              <div
                className="h-px"
                style={{
                  width: '60px',
                  background: gA
                    ? `linear-gradient(90deg, transparent, ${theme.accent}50)`
                    : 'linear-gradient(90deg, transparent, #ccc)',
                  transform: gH ? 'scaleX(1)' : 'scaleX(0)',
                  transformOrigin: 'right center',
                  transition: 'transform 1.2s cubic-bezier(0.16, 1, 0.3, 1), background 0.5s',
                  transitionDelay: gH ? '0.1s' : '0s',
                }}
              />
              {/* Diamond */}
              <div
                style={{
                  width: '7px',
                  height: '7px',
                  backgroundColor: gA ? theme.accent : '#ccc',
                  transform: gH ? 'rotate(45deg) scale(1)' : 'rotate(45deg) scale(0)',
                  transition: 'transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.5s',
                  transitionDelay: gH ? '0.5s' : '0s',
                  opacity: gA ? 0.7 : 0.3,
                }}
              />
              {/* Right line */}
              <div
                className="h-px"
                style={{
                  width: '60px',
                  background: gA
                    ? `linear-gradient(90deg, ${theme.accent}50, transparent)`
                    : 'linear-gradient(90deg, #ccc, transparent)',
                  transform: gH ? 'scaleX(1)' : 'scaleX(0)',
                  transformOrigin: 'left center',
                  transition: 'transform 1.2s cubic-bezier(0.16, 1, 0.3, 1), background 0.5s',
                  transitionDelay: gH ? '0.1s' : '0s',
                }}
              />
            </div>

            {/* GALLERY label */}
            <p
              className="text-[10px] tracking-[6px]"
              style={{
                color: gA ? `${theme.accent}90` : '#bbb',
                fontWeight: 300,
                opacity: gH ? 1 : 0,
                transform: gH ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.9)',
                transition: 'opacity 0.7s ease, transform 0.7s ease, color 0.5s',
                transitionDelay: gH ? '0.7s' : '0s',
              }}
            >
              GALLERY
            </p>
          </div>

          {/* ── Photo Grid ── */}
          <div className="px-4 pb-12">
            <div className="grid grid-cols-2 gap-1">
              {displayPhotos.map((photo, index) => {
                const isWide = index === 0
                const isPressed = pressedIndex === index
                // 확장으로 새로 보이는 사진인지 판별
                const isNewlyExpanded = index >= 3 && gridExpanded
                // 등장 방향: 와이드는 아래에서, 나머지는 좌우 교차
                const enterX = isWide ? 0 : (index % 2 === 1 ? -30 : 30)
                const enterY = isWide ? 40 : 20
                // 새로 확장된 사진: expandAnimReady로 애니메이션 트리거
                const shouldShow = isNewlyExpanded ? expandAnimReady : gH

                return (
                  <div
                    key={`gallery-${photo.id}`}
                    className={`overflow-hidden rounded-sm cursor-pointer ${
                      isWide ? 'col-span-2 aspect-[16/10]' : 'aspect-square'
                    }`}
                    style={{
                      opacity: shouldShow ? 1 : 0,
                      transform: shouldShow
                        ? 'translate(0, 0) scale(1)'
                        : `translate(${isNewlyExpanded ? 0 : enterX}px, ${isNewlyExpanded ? 24 : enterY}px) scale(0.92)`,
                      transition: isNewlyExpanded
                        ? 'opacity 0.5s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                        : 'opacity 0.9s ease, transform 1s cubic-bezier(0.16, 1, 0.3, 1)',
                      transitionDelay: isNewlyExpanded
                        ? `${(index - 3) * 0.1}s`
                        : (gH ? `${0.6 + index * 0.18}s` : '0s'),
                    }}
                    onClick={() => {
                      if (!isPreview) {
                        // displayPhotos 내 index → allPhotos 내 index 찾기
                        const allIdx = allPhotos.findIndex(p => p.id === photo.id)
                        setLightboxIndex(allIdx >= 0 ? allIdx : 0)
                      }
                    }}
                    onPointerDown={() => !isPreview && setPressedIndex(index)}
                    onPointerUp={() => !isPreview && setPressedIndex(null)}
                    onPointerLeave={() => !isPreview && setPressedIndex(null)}
                  >
                    {photo.url ? (
                      <div
                        className="w-full h-full"
                        style={{
                          ...getCropStyle(photo),
                          transform: isPressed ? 'scale(1.1)' : 'scale(1)',
                          transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                        }}
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: '#E8E4DC' }}
                      >
                        <span className="text-xs" style={{ color: theme.accent }}>Photo</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {galleryPhotos.length > 3 && (
              <button
                onClick={() => {
                  if (!gridExpanded) {
                    setExpandAnimReady(false)
                    setGridExpanded(true)
                    requestAnimationFrame(() => {
                      requestAnimationFrame(() => setExpandAnimReady(true))
                    })
                  } else {
                    setGridExpanded(false)
                    setExpandAnimReady(false)
                  }
                }}
                className="w-full flex items-center justify-center gap-1.5 py-3.5 mt-[2px] text-[13px] transition-all duration-300"
                style={{
                  backgroundColor: gA ? '#f5f5f5' : '#fafafa',
                  color: gA ? theme.textLight : '#bbb',
                  fontWeight: 300,
                  opacity: gH ? 1 : 0,
                  transform: gH ? 'translateY(0)' : 'translateY(16px)',
                  transition: 'opacity 0.8s ease, transform 0.8s ease, color 0.3s, background-color 0.3s',
                  transitionDelay: gH ? '1.3s' : '0s',
                }}
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
                    사진 더보기 ({galleryPhotos.length - 3})
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ═══════════ LIGHTBOX (Portal to body) ═══════════ */}
      {lightboxIndex !== null && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[10000] flex flex-col"
          style={{ backgroundColor: '#000' }}
        >
          {/* 상단 바 */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ zIndex: 2 }}>
            <span className="text-white/70 text-sm font-light">
              {lightboxIndex + 1} / {allPhotos.length}
            </span>
            <button
              onClick={() => setLightboxIndex(null)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 active:bg-white/20"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 이미지 영역 - 한 장씩 표시 */}
          <div
            className="flex-1 relative flex items-center justify-center px-4"
            onTouchStart={(e) => { touchStartXRef.current = e.touches[0].clientX }}
            onTouchEnd={(e) => {
              const dx = e.changedTouches[0].clientX - touchStartXRef.current
              if (dx < -60 && lightboxIndex < allPhotos.length - 1) {
                setSlideDir('left')
                setLightboxIndex(lightboxIndex + 1)
              } else if (dx > 60 && lightboxIndex > 0) {
                setSlideDir('right')
                setLightboxIndex(lightboxIndex - 1)
              }
            }}
            onClick={() => setLightboxIndex(null)}
          >
            <img
              key={lightboxIndex}
              src={allPhotos[lightboxIndex]?.url}
              alt={`사진 ${lightboxIndex + 1}`}
              className="max-w-full max-h-full object-contain select-none"
              draggable={false}
              onClick={(e) => e.stopPropagation()}
              style={{
                animation: slideDir ? `lb-slide-${slideDir} 0.25s ease-out` : undefined,
              }}
            />

            {/* 좌우 버튼 */}
            {lightboxIndex > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); setSlideDir('right'); setLightboxIndex(lightboxIndex - 1) }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 active:bg-white/20 flex items-center justify-center"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {lightboxIndex < allPhotos.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); setSlideDir('left'); setLightboxIndex(lightboxIndex + 1) }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 active:bg-white/20 flex items-center justify-center"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

          {/* 하단 dots */}
          {allPhotos.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 py-4 shrink-0">
              {allPhotos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setSlideDir(i > lightboxIndex! ? 'left' : 'right'); setLightboxIndex(i) }}
                  style={{
                    width: i === lightboxIndex ? '18px' : '6px',
                    height: '6px',
                    borderRadius: '3px',
                    backgroundColor: i === lightboxIndex ? 'white' : 'rgba(255,255,255,0.3)',
                    transition: 'all 0.3s',
                    border: 'none',
                    padding: 0,
                  }}
                />
              ))}
            </div>
          )}

          {/* 슬라이드 애니메이션 */}
          <style>{`
            @keyframes lb-slide-left {
              from { opacity: 0.4; transform: translateX(60px); }
              to { opacity: 1; transform: translateX(0); }
            }
            @keyframes lb-slide-right {
              from { opacity: 0.4; transform: translateX(-60px); }
              to { opacity: 1; transform: translateX(0); }
            }
          `}</style>
        </div>,
        document.body
      )}
    </section>
  )
}
