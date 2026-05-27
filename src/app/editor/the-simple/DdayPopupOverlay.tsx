'use client'

import { useState, useEffect, useCallback } from 'react'
import type { DdayPopupData, ImageWithSettings } from './page'

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
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)
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
                onImageClick={setZoomedImage}
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

      {/* 이미지 확대 모달 */}
      {zoomedImage && (
        <div
          className="dday-popup-zoom-overlay"
          onClick={(e) => { e.stopPropagation(); setZoomedImage(null) }}
        >
          <img
            src={zoomedImage}
            alt=""
            className="dday-popup-zoom-img"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="dday-popup-zoom-close"
            onClick={(e) => { e.stopPropagation(); setZoomedImage(null) }}
          >
            &times;
          </button>
        </div>
      )}
    </div>
  )
}

/** 이미지 슬라이더 (최대 3장, 좌우 버튼 네비게이션) */
function ImageSlider({
  images,
  onImageClick,
}: {
  images: ImageWithSettings[]
  onImageClick: (url: string) => void
}) {
  const [current, setCurrent] = useState(0)
  const count = images.length

  return (
    <div className="dday-popup-img-slider">
      <div
        className="dday-popup-img-slider-image"
        onClick={() => onImageClick(images[current].url)}
      >
        <img src={images[current].url} alt="" />
        {count > 1 && (
          <>
            <button
              type="button"
              className="dday-popup-img-nav dday-popup-img-nav--prev"
              onClick={(e) => { e.stopPropagation(); setCurrent((c) => (c - 1 + count) % count) }}
              aria-label="이전 이미지"
            >
              &#8249;
            </button>
            <button
              type="button"
              className="dday-popup-img-nav dday-popup-img-nav--next"
              onClick={(e) => { e.stopPropagation(); setCurrent((c) => (c + 1) % count) }}
              aria-label="다음 이미지"
            >
              &#8250;
            </button>
          </>
        )}
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
      <p className="dday-popup-img-hint">이미지를 클릭하면 확대할 수 있습니다</p>
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
  onImageClick: (url: string) => void
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
