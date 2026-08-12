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
  mainImageFrame?: string
  isPreview?: boolean
}

/** 메인사진 프레임 옵션 (9:16 세로 프레임, box는 사진 창 위치 %, show는 세로 중 표시할 비율=아래 여백 크롭) */
export const PARENTS_FRAME_CFG: Record<string, { label: string; box: { x: number; y: number; w: number; h: number }; show: number }> = {
  '10': { label: '하트', box: { x: 20.9, y: 35.6, w: 58.2, h: 28.6 }, show: 0.74 },
  '4': { label: '오벌', box: { x: 31.4, y: 32.6, w: 37.2, h: 34.7 }, show: 0.82 },
  '9': { label: '아치', box: { x: 21.9, y: 24.2, w: 62.6, h: 46.8 }, show: 0.86 },
  '5': { label: '레이스', box: { x: 18.1, y: 37.6, w: 63.7, h: 24.9 }, show: 0.76 },
  '12': { label: '우표', box: { x: 25.2, y: 33.4, w: 48.7, h: 33.1 }, show: 0.82 },
}
export const PARENTS_FRAME_IDS = ['10', '4', '9', '5', '12'] as const

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
        // 대상 자체 높이 기준(intersectionRatio)은 "더보기"로 갤러리가 뷰포트보다
        // 길어지면 화면에 꽉 차 있어도 0.3을 못 넘어 흐려짐 → 뷰포트(root) 커버 비율도 함께 판정
        const rb = entry.rootBounds
        const viewportH = (rb && rb.height) || (typeof window !== 'undefined' ? window.innerHeight : 0)
        const rootCoverage = viewportH > 0 ? entry.intersectionRect.height / viewportH : 0
        const active = entry.isIntersecting && (entry.intersectionRatio > 0.3 || rootCoverage > 0.3)
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
  mainImageFrame,
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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null)
  const [pressedIndex, setPressedIndex] = useState<number | null>(null)
  const touchStartXRef = useRef<number>(0)
  const moreBtnRef = useRef<HTMLButtonElement>(null)

  // 더보기/접기 토글: 접을 때 갤러리 높이가 줄며 스크롤이 아래 섹션으로 튀지 않도록 버튼 위치 고정
  const toggleGrid = () => {
    const collapsing = gridExpanded
    const beforeTop = moreBtnRef.current?.getBoundingClientRect().top ?? 0
    setGridExpanded((v) => !v)
    if (collapsing) {
      requestAnimationFrame(() => {
        const afterTop = moreBtnRef.current?.getBoundingClientRect().top ?? 0
        window.scrollBy(0, afterTop - beforeTop)
      })
    }
  }

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
      {heroImage && heroImage.url && (() => {
        const frameId = mainImageFrame && mainImageFrame !== 'none' ? mainImageFrame : null
        const frameCfg = frameId ? PARENTS_FRAME_CFG[frameId] : null

        // 프레임 옵션 — 9:16 세로 프레임 안 창(box)에 사진을 홀크롭 마스크로 끼움
        // 바깥 컨테이너는 show 비율만큼만 표시해 프레임 아래 빈 공간을 잘라냄
        if (frameCfg) {
          const showFrac = frameCfg.show ?? 0.8
          return (
            <div
              className="w-full relative overflow-hidden cursor-pointer"
              style={{
                aspectRatio: `9 / ${(16 * showFrac).toFixed(3)}`,
                backgroundColor: theme.background,
                opacity: cH ? 1 : 0,
                transform: cH ? 'scale(1)' : 'scale(1.04)',
                transition: 'opacity 1.4s cubic-bezier(0.22, 1, 0.36, 1), transform 3s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
              onClick={() => !isPreview && setLightboxIndex(0)}
            >
              {/* 내부는 프레임 원본 비율(9:16), 상단 정렬 → 바깥에서 하단 크롭 */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', aspectRatio: '9 / 16' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: `${frameCfg.box.x}%`,
                    top: `${frameCfg.box.y}%`,
                    width: `${frameCfg.box.w}%`,
                    height: `${frameCfg.box.h}%`,
                    overflow: 'hidden',
                    WebkitMaskImage: `url(/frames/frame-${frameId}-holecrop.webp)`,
                    maskImage: `url(/frames/frame-${frameId}-holecrop.webp)`,
                    WebkitMaskSize: '100% 100%',
                    maskSize: '100% 100%',
                  }}
                >
                  <div className="w-full h-full" style={getCropStyle(heroImage)} />
                </div>
                <img
                  src={`/frames/frame-${frameId}.webp`}
                  alt=""
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }}
                />
              </div>
            </div>
          )
        }

        // 기본 — full-bleed 3/4 히어로
        return (
          <div
            className="w-full aspect-[3/4] relative overflow-hidden cursor-pointer"
            style={{
              opacity: cH ? 1 : 0,
              transform: cH ? 'scale(1)' : 'scale(1.06)',
              transition: 'opacity 1.4s cubic-bezier(0.22, 1, 0.36, 1), transform 3s cubic-bezier(0.22, 1, 0.36, 1)',
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
        )
      })()}

      {/* ═══════════ COUPLE INFO (독립 활성화) ═══════════ */}
      <div
        ref={coupleSection.ref}
        className="relative z-10 px-8 pb-14"
        style={{
          marginTop: heroImage?.url ? (mainImageFrame && mainImageFrame !== 'none' ? '0px' : '-60px') : '80px',
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
              filter: cH ? 'blur(0px)' : 'blur(6px)',
              transition: 'opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1), transform 0.9s cubic-bezier(0.22, 1, 0.36, 1), filter 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
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
            <style>{`@keyframes parentsGalleryReveal { from { opacity: 0; transform: translateY(24px) scale(0.94); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
            <div className="grid grid-cols-2 gap-1">
              {displayPhotos.map((photo, index) => {
                const isWide = index === 0
                const isPressed = pressedIndex === index
                // 확장으로 새로 보이는 사진인지 판별
                const isNewlyExpanded = index >= 3 && gridExpanded
                // 등장 방향: 와이드는 아래에서, 나머지는 좌우 교차
                const enterX = isWide ? 0 : (index % 2 === 1 ? -30 : 30)
                const enterY = isWide ? 40 : 20
                return (
                  <div
                    key={`gallery-${photo.id}`}
                    className={`overflow-hidden rounded-[5px] cursor-pointer ${
                      isWide ? 'col-span-2 aspect-[16/10]' : 'aspect-square'
                    }`}
                    style={
                      isNewlyExpanded
                        ? {
                            // 더보기로 새로 나오는 사진: CSS 애니메이션(마운트 시 재생, 재렌더에 강함) + stagger
                            animation: 'parentsGalleryReveal 0.55s cubic-bezier(0.16, 1, 0.3, 1) both',
                            animationDelay: `${(index - 3) * 0.18}s`,
                          }
                        : {
                            opacity: gH ? 1 : 0,
                            transform: gH ? 'translate(0, 0) scale(1)' : `translate(${enterX}px, ${enterY}px) scale(0.92)`,
                            transition: 'opacity 0.9s ease, transform 1s cubic-bezier(0.16, 1, 0.3, 1)',
                            transitionDelay: gH ? `${0.6 + index * 0.18}s` : '0s',
                          }
                    }
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
                ref={moreBtnRef}
                onClick={toggleGrid}
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
                    borderRadius: '5px',
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
