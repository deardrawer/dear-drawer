'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useSectionHighlight } from './SectionHighlightContext'
import { C_FIELD, C_TXT, C_KSERIF, C_HAIR, C_SERIF, C_TXT_SUB, cCaption, cPill, cStagger } from './cStyle'
import ZoomableImage from '@/components/invitation/ZoomableImage'

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
  groomNameEn?: string  // 영문 이름 (표시용)
  brideNameEn?: string
  groomParents?: string
  brideParents?: string
  groomParentsNode?: React.ReactNode
  brideParentsNode?: React.ReactNode
  mainImageFrame?: string
  galleryBg?: string  // 갤러리 영역 배경 (틴트에서 제외해 흰 배경 유지용)
  coupleHeadline?: string  // 이름 위 커스텀 문구
  coupleConnector?: 'and' | 'heart'  // 이름 사이 연결 (and / 하트)
  isPreview?: boolean
  zoomEnabled?: boolean  // 라이트박스 핀치/더블탭 확대 허용 (기본 true)
  part?: 'all' | 'couple' | 'gallery'  // C안: 대표사진·이름 / 갤러리를 따로 배치할 때 사용 (기본 all)
  photoShape?: 'basic' | 'bleed' | 'arch' | 'mat'  // C안 사진 모양 (기본 basic)
}

/** 메인사진 프레임 옵션 (9:16 세로 프레임, box는 사진 창 위치 %, top/bot는 프레임 아트의 세로 범위(0~1) — 상하 여백 크롭용) */
export const PARENTS_FRAME_CFG: Record<string, { label: string; box: { x: number; y: number; w: number; h: number }; top: number; bot: number }> = {
  '4': { label: '오벌', box: { x: 31.4, y: 32.6, w: 37.2, h: 34.7 }, top: 0.17, bot: 0.83 },
  '9': { label: '아치', box: { x: 21.9, y: 24.2, w: 62.6, h: 46.8 }, top: 0.10, bot: 0.86 },
  '5': { label: '레이스', box: { x: 18.1, y: 37.6, w: 63.7, h: 24.9 }, top: 0.22, bot: 0.78 },
  '12': { label: '우표', box: { x: 25.2, y: 33.4, w: 48.7, h: 33.1 }, top: 0.19, bot: 0.81 },
}
export const PARENTS_FRAME_IDS = ['4', '9', '5', '12'] as const

/** 독립적인 IntersectionObserver 훅 (활성/비활성 + 최초등장) — 기존과 동일 */
function useSubSection() {
  const ref = useRef<HTMLDivElement>(null)
  const [isActive, setIsActive] = useState(false)
  const [hasAppeared, setHasAppeared] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // 갤러리가 화면보다 길어져도 흐려지지 않도록 화면(root) 대비 비율도 함께 판정
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
  groomName = '지훈',
  brideName = '서연',
  groomNameEn,
  brideNameEn,
  groomParents = '',
  brideParents = '',
  groomParentsNode,
  brideParentsNode,
  mainImageFrame,
  coupleHeadline,
  isPreview = false,
  zoomEnabled = true,
  part = 'all',
  photoShape = 'basic',
}: MainPhotoSectionProps) {
  // 섹션 전체 (SectionHighlightContext 용)
  const { ref: sectionRef } = useSectionHighlight(part === 'gallery' ? 'gallery' : 'main-photo')

  const showCouple = part !== 'gallery'
  const showGallery = part !== 'couple'

  // 독립 서브섹션: 커플 정보 / 갤러리 (에디터 미리보기에서는 즉시 표시)
  const { ref: coupleRef, isActive: coupleActive, hasAppeared: coupleAppeared } = useSubSection()
  const { ref: galleryRef, isActive: galleryActive, hasAppeared: galleryAppeared } = useSubSection()
  const cA = isPreview ? true : coupleActive
  const cH = isPreview ? true : coupleAppeared
  const gA = isPreview ? true : galleryActive
  const gH = isPreview ? true : galleryAppeared
  const [pressedIndex, setPressedIndex] = useState<number | null>(null)

  const [gridExpanded, setGridExpanded] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null)
  const [zoomed, setZoomed] = useState(false) // 줌 중엔 좌우 스와이프/탭닫기 비활성화
  const touchStartXRef = useRef<number>(0)
  const moreBtnRef = useRef<HTMLButtonElement>(null)

  // 줌 허용 라이트박스가 열려 있는 동안 페이지 자체의 핀치 확대(iOS gesture*, 두 손가락 touchmove)를 막는다
  const lightboxOpen = lightboxIndex !== null
  useEffect(() => {
    if (!lightboxOpen || !zoomEnabled) return
    const onGesture = (e: Event) => e.preventDefault()
    const onTouchMove = (e: TouchEvent) => { if (e.touches.length > 1) e.preventDefault() }
    document.addEventListener('gesturestart', onGesture, { passive: false } as AddEventListenerOptions)
    document.addEventListener('gesturechange', onGesture, { passive: false } as AddEventListenerOptions)
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => {
      document.removeEventListener('gesturestart', onGesture)
      document.removeEventListener('gesturechange', onGesture)
      document.removeEventListener('touchmove', onTouchMove)
    }
  }, [lightboxOpen, zoomEnabled])

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

  const INITIAL_COUNT = 4
  const displayPhotos = gridExpanded ? galleryPhotos : galleryPhotos.slice(0, INITIAL_COUNT)

  const groomParentsContent = groomParentsNode || groomParents
  const brideParentsContent = brideParentsNode || brideParents

  if (!showCouple && galleryPhotos.length === 0) return null

  return (
    <section
      ref={sectionRef as React.RefObject<HTMLDivElement>}
      style={{ backgroundColor: 'transparent' }}
    >
      {showCouple && (
        <div
          ref={coupleRef}
          style={{
            // 다른 섹션과 같은 위아래 여백 (앞 섹션 배경과 상관없이 사진 위 여백 확보)
            padding: '80px 28px 80px',
            opacity: cH ? (cA ? 1 : 0.25) : 0,
            filter: cA ? 'none' : 'grayscale(40%)',
            transition: 'opacity 0.6s ease, filter 0.6s ease',
          }}
        >
          {/* ═══════════ 대표 사진 ═══════════ */}
          {heroImage && heroImage.url && (() => {
            // C안: 사진 프레임은 쓰지 않음 (예전에 고른 값이 있어도 무시, 저장값은 유지)
            void mainImageFrame
            const frameId: string | null = null
            const frameCfg = frameId ? PARENTS_FRAME_CFG[frameId] : null

            // 프레임 옵션(고객 선택 시에만) — 9:16 세로 프레임 안 창(box)에 사진을 홀크롭 마스크로 끼움
            if (frameCfg) {
              const cropTop = frameCfg.top ?? 0
              const cropBot = frameCfg.bot ?? 1
              const band = Math.max(0.1, cropBot - cropTop)
              return (
                <div
                  className="relative overflow-hidden cursor-pointer"
                  style={{
                    margin: '0 -28px', aspectRatio: `9 / ${(16 * band).toFixed(3)}`, backgroundColor: 'transparent',
                    opacity: cH ? 1 : 0,
                    transform: cH ? 'scale(1)' : 'scale(1.04)',
                    transition: 'opacity 1.4s cubic-bezier(0.22, 1, 0.36, 1), transform 3s cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                  onClick={() => !isPreview && setLightboxIndex(0)}
                >
                  <div style={{ position: 'absolute', top: `${(-cropTop / band * 100).toFixed(2)}%`, left: 0, width: '100%', aspectRatio: '9 / 16' }}>
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/frames/frame-${frameId}.webp`}
                      alt=""
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }}
                    />
                  </div>
                </div>
              )
            }

            // 사진 모양 (C안) — 모든 모양에 같은 등장 효과(1.06 → 1)
            const reveal = (photo: { url: string; cropX?: number; cropY?: number; cropWidth?: number; cropHeight?: number }): React.CSSProperties => ({
              ...getCropStyle(photo),
              width: '100%', height: '100%',
              opacity: cH ? 1 : 0,
              transform: cH ? 'scale(1)' : 'scale(1.06)',
              transition: 'opacity 1.4s cubic-bezier(0.22, 1, 0.36, 1), transform 3s cubic-bezier(0.22, 1, 0.36, 1)',
            })
            const open = (idx: number) => { if (!isPreview) setLightboxIndex(idx) }
            const shape = photoShape || 'basic'

            if (shape === 'bleed') {
              return (
                <div className="cursor-pointer" style={{ margin: '0 -28px', aspectRatio: '4 / 5', overflow: 'hidden', backgroundColor: C_FIELD }} onClick={() => open(0)}>
                  <div style={reveal(heroImage)} />
                </div>
              )
            }
            if (shape === 'arch') {
              return (
                <div
                  className="cursor-pointer"
                  style={{ width: '100%', aspectRatio: '4 / 5', borderRadius: '50% 50% 4px 4px / 40% 40% 4px 4px', overflow: 'hidden', backgroundColor: C_FIELD }}
                  onClick={() => open(0)}
                >
                  <div style={reveal(heroImage)} />
                </div>
              )
            }
            if (shape === 'mat') {
              return (
                <div className="cursor-pointer" style={{ padding: 10, backgroundColor: '#FFFFFF', boxShadow: `inset 0 0 0 1px ${C_HAIR.replace('0.1)', '0.12)')}` }} onClick={() => open(0)}>
                  <div style={{ width: '100%', aspectRatio: '4 / 5', overflow: 'hidden', backgroundColor: C_FIELD }}>
                    <div style={reveal(heroImage)} />
                  </div>
                </div>
              )
            }
            // 기본 — 크게, 살짝 둥근 모서리
            return (
              <div
                className="cursor-pointer"
                style={{ width: '100%', aspectRatio: '4 / 5', borderRadius: 4, overflow: 'hidden', backgroundColor: C_FIELD }}
                onClick={() => open(0)}
              >
                <div style={reveal(heroImage)} />
              </div>
            )
          })()}

          {/* ═══════════ 양가 · 이름 ═══════════ */}
          {coupleHeadline && coupleHeadline.trim() && (
            <p style={{ ...cCaption, marginTop: heroImage?.url ? 32 : 0, whiteSpace: 'pre-line', ...cStagger(cH, 0.1) }}>
              {coupleHeadline}
            </p>
          )}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              marginTop: coupleHeadline && coupleHeadline.trim() ? 18 : (heroImage?.url ? 32 : 0),
            }}
          >
            {[
              { key: 'groom', parents: groomParentsContent, name: groomName, en: groomNameEn },
              { key: 'bride', parents: brideParentsContent, name: brideName, en: brideNameEn },
            ].map((p, i) => (
              <div
                key={p.key}
                style={{ paddingLeft: i ? 22 : 0, paddingRight: i ? 0 : 12, borderLeft: i ? `1px solid ${C_HAIR}` : undefined, minWidth: 0 }}
              >
                <div style={{ fontSize: 13, color: C_TXT_SUB, lineHeight: 1.7, minHeight: 22, wordBreak: 'keep-all', ...cStagger(cH, 0.45) }}>
                  {p.parents || (i ? '신부' : '신랑')}
                </div>
                <div style={{ fontFamily: C_KSERIF, fontSize: 30, lineHeight: 1.3, marginTop: 8, color: C_TXT, wordBreak: 'keep-all', ...cStagger(cH, 0.2) }}>
                  {p.name}
                </div>
                {p.en && (
                  <div style={{ fontFamily: C_SERIF, fontStyle: 'italic', fontSize: 17, color: C_TXT_SUB, marginTop: 2, ...cStagger(cH, 0.5) }}>
                    {p.en}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════ 갤러리 ═══════════ */}
      {showGallery && galleryPhotos.length > 0 && (
        <div
          ref={galleryRef}
          style={{
            padding: '72px 28px 80px',
            opacity: gH ? (gA ? 1 : 0.2) : 0,
            filter: gA ? 'none' : 'grayscale(40%)',
            transition: 'opacity 0.6s ease, filter 0.6s ease',
          }}
        >
          <style>{`@keyframes parentsGalleryReveal { from { opacity: 0; transform: translateY(24px) scale(0.94); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
          <p style={{ ...cCaption, marginBottom: 20, ...cStagger(gH, 0) }}>갤러리</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {displayPhotos.map((photo, index) => {
              const isPressed = pressedIndex === index
              // 더보기로 새로 보이는 사진 / 처음 사진은 좌우 교차로 등장 (기존과 같은 타이밍)
              const isNewlyExpanded = index >= INITIAL_COUNT && gridExpanded
              const enterX = index % 2 === 1 ? 30 : -30
              return (
                <div
                  key={`gallery-${photo.id}`}
                  className="cursor-pointer"
                  style={{
                    aspectRatio: '3 / 4', borderRadius: 4, overflow: 'hidden', backgroundColor: C_FIELD,
                    ...(isNewlyExpanded
                      ? {
                          animation: 'parentsGalleryReveal 0.55s cubic-bezier(0.16, 1, 0.3, 1) both',
                          animationDelay: `${(index - INITIAL_COUNT) * 0.18}s`,
                        }
                      : {
                          opacity: gH ? 1 : 0,
                          transform: gH ? 'translate(0, 0) scale(1)' : `translate(${enterX}px, 20px) scale(0.92)`,
                          transition: 'opacity 0.9s ease, transform 1s cubic-bezier(0.16, 1, 0.3, 1)',
                          transitionDelay: gH ? `${0.6 + index * 0.18}s` : '0s',
                        }),
                  }}
                  onClick={() => {
                    if (!isPreview) {
                      const allIdx = allPhotos.findIndex(p => p.id === photo.id)
                      setLightboxIndex(allIdx >= 0 ? allIdx : 0)
                    }
                  }}
                  onPointerDown={() => !isPreview && setPressedIndex(index)}
                  onPointerUp={() => !isPreview && setPressedIndex(null)}
                  onPointerLeave={() => !isPreview && setPressedIndex(null)}
                >
                  <div
                    className="w-full h-full"
                    style={{
                      ...getCropStyle(photo),
                      transform: isPressed ? 'scale(1.1)' : 'scale(1)',
                      transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    }}
                  />
                </div>
              )
            })}
          </div>

          {galleryPhotos.length > INITIAL_COUNT && (
            <div
              style={{
                display: 'flex', marginTop: 12,
                opacity: gH ? 1 : 0,
                transform: gH ? 'translateY(0)' : 'translateY(16px)',
                transition: 'opacity 0.8s ease, transform 0.8s ease',
                transitionDelay: gH ? '1.3s' : '0s',
              }}
            >
              <button ref={moreBtnRef} type="button" onClick={toggleGrid} style={cPill(false, 48)}>
                {gridExpanded ? '접기' : `사진 더 보기 (${galleryPhotos.length - INITIAL_COUNT})`}
              </button>
            </div>
          )}
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
            onTouchStart={(e) => { if (zoomEnabled || zoomed) return; touchStartXRef.current = e.touches[0].clientX }}
            onTouchEnd={(e) => {
              // 줌 허용 시엔 ZoomableImage의 onSwipe가 처리 (핀치 직후 오작동 방지)
              if (zoomEnabled || zoomed) return
              const dx = e.changedTouches[0].clientX - touchStartXRef.current
              if (dx < -60 && lightboxIndex < allPhotos.length - 1) {
                setSlideDir('left')
                setLightboxIndex(lightboxIndex + 1)
              } else if (dx > 60 && lightboxIndex > 0) {
                setSlideDir('right')
                setLightboxIndex(lightboxIndex - 1)
              }
            }}
            onClick={() => { if (!zoomed) setLightboxIndex(null) }}
          >
            {zoomEnabled ? (
              <div
                key={lightboxIndex}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  height: '80vh',
                  animation: slideDir ? `lb-slide-${slideDir} 0.25s ease-out` : undefined,
                }}
              >
                <ZoomableImage
                  src={allPhotos[lightboxIndex]?.url}
                  alt={`사진 ${lightboxIndex + 1}`}
                  className="w-full h-full"
                  onZoomChange={setZoomed}
                  onSwipe={(d) => {
                    if (d > 0 && lightboxIndex < allPhotos.length - 1) {
                      setSlideDir('left')
                      setLightboxIndex(lightboxIndex + 1)
                    } else if (d < 0 && lightboxIndex > 0) {
                      setSlideDir('right')
                      setLightboxIndex(lightboxIndex - 1)
                    }
                  }}
                />
              </div>
            ) : (
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
            )}

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
