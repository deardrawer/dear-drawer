'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { DdayPopupData, ImageWithSettings } from '@/lib/ddayPopupTypes'

interface DdayPopupOverlayProps {
  data: DdayPopupData
  weddingDate: string
  isPreview?: boolean
  onDismiss?: () => void
  style?: React.CSSProperties
  pointColor?: string
}

function calcDday(weddingDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const wedding = new Date(weddingDate)
  wedding.setHours(0, 0, 0, 0)
  return Math.ceil((wedding.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function getDdayLabel(dday: number): string {
  if (dday === 0) return 'D-Day'
  if (dday > 0) return `D-${dday}`
  return `D+${Math.abs(dday)}`
}

const SESSION_KEY_PREFIX = 'dday-popup-dismissed-'

export default function DdayPopupOverlay({
  data,
  weddingDate,
  isPreview,
  onDismiss,
  style: styleOverride,
  pointColor,
}: DdayPopupOverlayProps) {
  const dday = calcDday(weddingDate)

  const [visible, setVisible] = useState(() => {
    if (!data.enabled) return false
    if (isPreview) return true
    return false
  })
  const [closing, setClosing] = useState(false)
  const [zoomState, setZoomState] = useState<{ urls: string[]; index: number } | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [slideDir, setSlideDir] = useState<'next' | 'prev' | null>(null)
  const [pageKey, setPageKey] = useState(0)

  useEffect(() => {
    if (!data.enabled || isPreview) return
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    // displayStart / displayEnd 우선, 없으면 startDays 폴백
    let start: Date, end: Date
    if (data.displayStart) {
      start = new Date(data.displayStart)
      start.setHours(0, 0, 0, 0)
    } else {
      const days = data.startDays ?? 7
      start = new Date(weddingDate)
      start.setHours(0, 0, 0, 0)
      start.setDate(start.getDate() - days)
    }
    if (data.displayEnd) {
      end = new Date(data.displayEnd)
      end.setHours(0, 0, 0, 0)
    } else {
      end = new Date(weddingDate)
      end.setHours(0, 0, 0, 0)
    }
    if (today < start || today > end) return
    const key = SESSION_KEY_PREFIX + weddingDate
    if (sessionStorage.getItem(key)) return
    setVisible(true)
  }, [data.enabled, data.displayStart, data.displayEnd, data.startDays, weddingDate, isPreview])

  const dismiss = useCallback(() => {
    setClosing(true)
    setTimeout(() => {
      setVisible(false)
      setClosing(false)
      if (!isPreview) {
        const key = SESSION_KEY_PREFIX + weddingDate
        try { sessionStorage.setItem(key, '1') } catch {}
      }
      onDismiss?.()
    }, 300)
  }, [weddingDate, isPreview, onDismiss])

  const goToPage = useCallback((dir: 'next' | 'prev') => {
    setSlideDir(dir)
    setCurrentPage((c) => dir === 'next' ? c + 1 : c - 1)
    setPageKey((k) => k + 1)
  }, [])

  if (!visible) return null

  const pages = data.pages
  const title = data.title || '결혼식 당일 안내'
  const buttonLabel = data.buttonLabel || '확인했습니다'
  const ddayLabel = getDdayLabel(dday)
  const totalPages = pages.length

  return (
    <div
      className={`dday-popup-overlay ${closing ? 'dday-popup--closing' : 'dday-popup--open'}`}
      style={{ zIndex: 9998, ...styleOverride }}
      onClick={dismiss}
    >
      <div
        className="dday-popup-v1-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더: D-Day 뱃지 + 페이지 카운터 */}
        <div className={`dday-popup-header ${totalPages <= 1 ? 'dday-popup-header--center' : ''}`}>
          {data.showDday && (
            <span className="dday-popup-badge" style={pointColor ? { background: pointColor } : undefined}>{ddayLabel}</span>
          )}
          {totalPages > 1 && (
            <span className="dday-popup-page-counter">
              {currentPage + 1} / {totalPages}
            </span>
          )}
        </div>
        <h2 className="dday-popup-title" style={pointColor ? { color: pointColor } : undefined}>{title}</h2>

        {/* 페이지 콘텐츠 */}
        {totalPages > 0 && (
          <div className="dday-popup-pages-wrap">
            <div
              key={pageKey}
              className={`dday-popup-page-animate ${slideDir === 'next' ? 'dday-page-enter-next' : slideDir === 'prev' ? 'dday-page-enter-prev' : 'dday-page-enter-initial'}`}
            >
              <PageContent
                page={pages[currentPage]}
                onImageClick={(urls, index) => setZoomState({ urls, index })}
                textAlign={data.textAlign || 'left'}
              />
            </div>
            {/* 페이지 좌우 버튼 */}
            {totalPages > 1 && (
              <div className="dday-popup-page-nav">
                <button
                  type="button"
                  disabled={currentPage === 0}
                  onClick={() => goToPage('prev')}
                  className="dday-popup-page-nav-btn"
                >
                  &#8249; 이전
                </button>
                <button
                  type="button"
                  disabled={currentPage === totalPages - 1}
                  onClick={() => goToPage('next')}
                  className="dday-popup-page-nav-btn"
                >
                  다음 &#8250;
                </button>
              </div>
            )}
          </div>
        )}

        <button onClick={dismiss} className="dday-popup-close-btn" style={pointColor ? { background: pointColor } : undefined}>
          {buttonLabel}
        </button>
      </div>

      {/* 이미지 확대 모달 (핀치 줌 + 네비게이션) */}
      {zoomState && (
        <ZoomModal
          urls={zoomState.urls}
          initialIndex={zoomState.index}
          onClose={() => setZoomState(null)}
        />
      )}
    </div>
  )
}

/** 이미지 슬라이더 (최대 3장, 스와이프 + 버튼 네비게이션) */
function ImageSlider({
  images,
  onImageClick,
}: {
  images: ImageWithSettings[]
  onImageClick: (urls: string[], index: number) => void
}) {
  const [current, setCurrent] = useState(0)
  const count = images.length
  const touchRef = useRef<{ startX: number; startY: number; swiped: boolean } | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    touchRef.current = { startX: t.clientX, startY: t.clientY, swiped: false }
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchRef.current || touchRef.current.swiped) return
    const dx = e.touches[0].clientX - touchRef.current.startX
    const dy = e.touches[0].clientY - touchRef.current.startY
    if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) {
      touchRef.current.swiped = true
      if (dx < 0 && current < count - 1) setCurrent((c) => c + 1)
      else if (dx > 0 && current > 0) setCurrent((c) => c - 1)
    }
  }
  const handleTouchEnd = () => { touchRef.current = null }

  const handleClick = () => {
    if (touchRef.current?.swiped) return
    onImageClick(images.map((img) => img.url), current)
  }

  return (
    <div className="dday-popup-img-slider">
      <div
        className="dday-popup-img-slider-image"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >
        <img src={images[current].url} alt="" draggable={false} />
      </div>
      {count > 1 && (
        <div className="dday-popup-img-dots">
          {images.map((_, i) => (
            <span
              key={i}
              className={`dday-popup-img-dot ${i === current ? 'dday-popup-img-dot--active' : ''}`}
              onClick={() => setCurrent(i)}
            />
          ))}
        </div>
      )}
      <p className="dday-popup-img-hint">이미지를 밀어서 넘기거나 클릭하면 확대할 수 있습니다</p>
    </div>
  )
}

/** 개별 페이지 콘텐츠 */
function PageContent({
  page,
  onImageClick,
  textAlign = 'left',
}: {
  page: DdayPopupData['pages'][number]
  onImageClick: (urls: string[], index: number) => void
  textAlign?: 'left' | 'center'
}) {
  const images = page.images?.filter((img) => img.url) || []

  return (
    <div className="dday-popup-page" style={{ textAlign }}>
      {page.title && (
        <h3 className="dday-popup-page-title">{page.title}</h3>
      )}
      {page.body && (
        <p className="dday-popup-page-body">{page.body}</p>
      )}
      {images.length > 0 && (
        <ImageSlider images={images} onImageClick={onImageClick} />
      )}
      {page.links && page.links.length > 0 && (
        <div className="dday-popup-page-links">
          {page.links.filter(l => l.url).map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="dday-popup-page-link"
            >
              {link.label || '바로가기'}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

/** 핀치 줌 + 네비게이션 이미지 확대 모달 */
function ZoomModal({ urls, initialIndex, onClose }: { urls: string[]; initialIndex: number; onClose: () => void }) {
  const [current, setCurrent] = useState(initialIndex)
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null)
  const panRef = useRef<{ startX: number; startY: number; tx: number; ty: number } | null>(null)
  const swipeRef = useRef<{ startX: number; swiped: boolean } | null>(null)
  const lastTapRef = useRef(0)
  const count = urls.length

  const resetZoom = () => { setScale(1); setTranslate({ x: 0, y: 0 }) }

  const goTo = (idx: number) => {
    resetZoom()
    setCurrent(idx)
  }

  const getPinchDist = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault()
      swipeRef.current = null
      pinchRef.current = { dist: getPinchDist(e.touches), scale }
    } else if (e.touches.length === 1) {
      if (scale > 1) {
        panRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, tx: translate.x, ty: translate.y }
      } else if (count > 1) {
        swipeRef.current = { startX: e.touches[0].clientX, swiped: false }
      }
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault()
      const newDist = getPinchDist(e.touches)
      const newScale = Math.min(4, Math.max(1, pinchRef.current.scale * (newDist / pinchRef.current.dist)))
      setScale(newScale)
      if (newScale <= 1) setTranslate({ x: 0, y: 0 })
    } else if (e.touches.length === 1 && panRef.current && scale > 1) {
      const dx = e.touches[0].clientX - panRef.current.startX
      const dy = e.touches[0].clientY - panRef.current.startY
      setTranslate({ x: panRef.current.tx + dx, y: panRef.current.ty + dy })
    } else if (e.touches.length === 1 && swipeRef.current && !swipeRef.current.swiped && scale <= 1) {
      const dx = e.touches[0].clientX - swipeRef.current.startX
      if (Math.abs(dx) > 40) {
        swipeRef.current.swiped = true
        if (dx < 0 && current < count - 1) goTo(current + 1)
        else if (dx > 0 && current > 0) goTo(current - 1)
      }
    }
  }

  const handleTouchEnd = () => {
    pinchRef.current = null
    panRef.current = null
    swipeRef.current = null
    if (scale <= 1.05) resetZoom()
  }

  const handleDoubleTap = () => {
    const now = Date.now()
    if (now - lastTapRef.current < 300) {
      if (scale > 1) resetZoom()
      else setScale(2.5)
    }
    lastTapRef.current = now
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (scale <= 1) onClose()
  }

  return (
    <div
      className="dday-popup-zoom-overlay"
      onClick={handleOverlayClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'none' }}
    >
      <img
        src={urls[current]}
        alt=""
        className="dday-popup-zoom-img"
        draggable={false}
        onClick={(e) => { e.stopPropagation(); handleDoubleTap() }}
        style={{
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          transition: scale === 1 && translate.x === 0 && translate.y === 0 ? 'transform 0.2s ease-out' : 'none',
        }}
      />
      {/* 좌우 버튼 (중앙) + 카운터 (하단) */}
      {count > 1 && scale <= 1 && (
        <>
          <div className="dday-popup-zoom-nav">
            <button
              type="button"
              disabled={current === 0}
              onClick={(e) => { e.stopPropagation(); goTo(current - 1) }}
              className="dday-popup-zoom-nav-btn"
            >
              &#8249;
            </button>
            <button
              type="button"
              disabled={current === count - 1}
              onClick={(e) => { e.stopPropagation(); goTo(current + 1) }}
              className="dday-popup-zoom-nav-btn"
            >
              &#8250;
            </button>
          </div>
          <span className="dday-popup-zoom-nav-counter">{current + 1} / {count}</span>
        </>
      )}
      <button
        className="dday-popup-zoom-close"
        onClick={(e) => { e.stopPropagation(); onClose() }}
      >
        &times;
      </button>
    </div>
  )
}
