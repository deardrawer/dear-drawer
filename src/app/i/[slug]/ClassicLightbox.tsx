'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * THE CLASSIC 갤러리 라이트박스.
 * THE SIMPLE의 GalleryLightbox(TheSimplePreview.tsx)와 동일한 스타일 이름(1~9)을
 * 클래식 톤(세리프/아이보리/필름)에 맞춰 자체 구현한다.
 */

interface Props {
  images: string[]
  index: number
  open: boolean
  variant: number
  onClose: () => void
}

const F_LABEL = "var(--font-eb-garamond), serif"

// 실제로 고유 스타일을 구현한 variant. 그 외(3/8 등)는 1(에디토리얼)로 대체.
const STYLED_VARIANTS = new Set([1, 2, 4, 5, 6, 7, 9])

const pad2 = (n: number) => String(n).padStart(2, '0')

const CL_LB_STYLES = `
  .cl-lb-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(10,6,4,.92); display: flex; flex-direction: column; animation: cl-lb-fade .28s ease; }
  @keyframes cl-lb-fade { from { opacity: 0; } to { opacity: 1; } }
  .cl-lb-overlay * { box-sizing: border-box; }
  .cl-lb-topbar { position: relative; z-index: 3; display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; flex-shrink: 0; }
  .cl-lb-title { font-family: ${F_LABEL}; font-style: italic; font-size: 13px; letter-spacing: .08em; color: rgba(244,241,233,.82); }
  .cl-lb-close { appearance: none; background: rgba(244,241,233,.08); border: 1px solid rgba(244,241,233,.28); color: #F4F1E9; width: 34px; height: 34px; border-radius: 50%; font-size: 18px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .cl-lb-close:hover { background: rgba(244,241,233,.18); }
  .cl-lb-stage-row { position: relative; flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; }
  .cl-lb-stage { position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 6px 54px; touch-action: pan-y; }
  .cl-lb-img { max-width: 100%; max-height: 100%; object-fit: contain; -webkit-user-select: none; user-select: none; box-shadow: 0 30px 70px -20px rgba(0,0,0,.7); }
  .cl-lb-nav { position: absolute; top: 50%; transform: translateY(-50%); z-index: 3; width: 40px; height: 40px; border-radius: 50%; border: 1px solid rgba(244,241,233,.28); background: rgba(10,6,4,.35); color: #F4F1E9; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .cl-lb-nav:hover { background: rgba(244,241,233,.16); }
  .cl-lb-nav--prev { left: 10px; }
  .cl-lb-nav--next { right: 10px; }
  .cl-lb-counter { text-align: center; font-family: ${F_LABEL}; font-size: 11px; letter-spacing: .14em; color: rgba(244,241,233,.6); padding: 2px 0 4px; flex-shrink: 0; }
  .cl-lb-caption { text-align: center; font-family: ${F_LABEL}; font-style: italic; font-size: 14px; color: rgba(244,241,233,.75); padding: 0 40px 8px; flex-shrink: 0; }
  .cl-lb-thumbs { display: flex; gap: 8px; overflow-x: auto; padding: 10px 16px 18px; flex-shrink: 0; scrollbar-width: none; }
  .cl-lb-thumbs::-webkit-scrollbar { display: none; }
  .cl-lb-thumb { flex: 0 0 auto; width: 46px; height: 46px; border-radius: 3px; overflow: hidden; opacity: .45; border: 1px solid transparent; cursor: pointer; padding: 0; background: none; transition: opacity .2s ease, border-color .2s ease; }
  .cl-lb-thumb img { width: 100%; height: 100%; object-fit: cover; -webkit-user-select: none; user-select: none; }
  .cl-lb-thumb.is-active { opacity: 1; border-color: rgba(244,241,233,.85); }

  /* v1 에디토리얼: 아이보리 매트 배경, 세리프 캡션 */
  .cl-lb--v1 { background: #F4F1E9; }
  .cl-lb--v1 .cl-lb-close { border-color: rgba(53,23,20,.3); color: #351714; background: rgba(53,23,20,.05); }
  .cl-lb--v1 .cl-lb-close:hover { background: rgba(53,23,20,.12); }
  .cl-lb--v1 .cl-lb-nav { border-color: rgba(53,23,20,.22); color: #351714; background: rgba(255,255,255,.5); }
  .cl-lb--v1 .cl-lb-nav:hover { background: rgba(53,23,20,.1); }
  .cl-lb--v1 .cl-lb-title, .cl-lb--v1 .cl-lb-counter, .cl-lb--v1 .cl-lb-caption { color: rgba(53,23,20,.62); }
  .cl-lb--v1 .cl-lb-img { box-shadow: 0 26px 50px -22px rgba(53,23,20,.4); border: 10px solid #fff; }
  .cl-lb--v1 .cl-lb-thumb.is-active { border-color: rgba(53,23,20,.75); }

  /* v2 글라스: 프로스티드 글라스 패널 */
  .cl-lb--v2 { background: radial-gradient(circle at 50% 20%, rgba(80,58,48,.55), rgba(10,6,4,.94)); }
  .cl-lb--v2 .cl-lb-stage { padding: 20px 60px; }
  .cl-lb--v2 .cl-lb-img { border-radius: 6px; }
  .cl-lb--v2 .cl-lb-thumbs { margin: 0 16px 16px; background: rgba(244,241,233,.08); border: 1px solid rgba(244,241,233,.18); border-radius: 12px; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); padding: 10px; }
  .cl-lb--v2 .cl-lb-nav, .cl-lb--v2 .cl-lb-close { backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }

  /* v4 룩북: 세로 스크롤 나열 */
  .cl-lb--v4 { background: #12100C; overflow-y: auto; }
  .cl-lb-v4-scroll { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 60px 0 40px; }
  .cl-lb-v4-img { width: 100%; max-width: 480px; -webkit-user-select: none; user-select: none; }
  .cl-lb-v4-close { position: fixed; top: 16px; right: 18px; z-index: 4; width: 34px; height: 34px; border-radius: 50%; border: 1px solid rgba(244,241,233,.28); background: rgba(10,6,4,.5); color: #F4F1E9; font-size: 18px; cursor: pointer; }

  /* v5 시네마: 레터박스 */
  .cl-lb--v5 { background: #000; }
  .cl-lb--v5 .cl-lb-stage-row { position: relative; }
  .cl-lb--v5 .cl-lb-stage-row::before, .cl-lb--v5 .cl-lb-stage-row::after { content: ''; position: absolute; left: 0; right: 0; height: 44px; background: #000; z-index: 2; }
  .cl-lb--v5 .cl-lb-stage-row::before { top: 0; }
  .cl-lb--v5 .cl-lb-stage-row::after { bottom: 0; }
  .cl-lb--v5 .cl-lb-img { box-shadow: none; filter: contrast(1.04) saturate(.94); }
  .cl-lb--v5 .cl-lb-thumbs { display: none; }
  .cl-lb--v5 .cl-lb-nav { border-color: rgba(244,241,233,.18); background: transparent; }
  .cl-lb--v5-fade { transition: opacity .5s ease; }
  .cl-lb--v5-fade.is-hidden { opacity: 0; }

  /* v6 미니멀: 클린 화이트 */
  .cl-lb--v6 { background: #fff; }
  .cl-lb--v6 .cl-lb-close { border-color: rgba(0,0,0,.15); color: #222; background: transparent; }
  .cl-lb--v6 .cl-lb-close:hover { background: rgba(0,0,0,.06); }
  .cl-lb--v6 .cl-lb-nav { border-color: rgba(0,0,0,.12); color: #222; background: transparent; }
  .cl-lb--v6 .cl-lb-nav:hover { background: rgba(0,0,0,.05); }
  .cl-lb--v6 .cl-lb-title, .cl-lb--v6 .cl-lb-counter { color: rgba(0,0,0,.45); }
  .cl-lb--v6 .cl-lb-img { box-shadow: none; }
  .cl-lb--v6 .cl-lb-thumbs { display: none; }

  /* v7 매거진: 두꺼운 썸네일 스트립 강조 */
  .cl-lb--v7 { background: #1B1310; }
  .cl-lb--v7 .cl-lb-stage { padding: 12px 54px 4px; }
  .cl-lb--v7 .cl-lb-thumbs { padding: 12px 16px 22px; gap: 10px; }
  .cl-lb--v7 .cl-lb-thumb { width: 62px; height: 62px; border-radius: 2px; }
  .cl-lb--v7 .cl-lb-thumb.is-active { opacity: 1; border-color: #E9C77C; box-shadow: 0 0 0 1px #E9C77C; }
  .cl-lb--v7 .cl-lb-caption { font-size: 12px; letter-spacing: .1em; text-transform: uppercase; font-style: normal; color: rgba(244,241,233,.5); }

  /* v9 필름: 필름스트립 스프로킷 + 세피아 */
  .cl-lb--v9 { background: #1C1108; }
  .cl-lb--v9 .cl-lb-img { filter: sepia(.4) contrast(1.06) saturate(.85) brightness(.98); box-shadow: 0 20px 50px -20px rgba(0,0,0,.8); }
  .cl-lb--v9 .cl-lb-stage { padding: 30px 54px; }
  .cl-lb-sprocket { position: absolute; left: 0; right: 0; height: 20px; background: #E7DDC6; z-index: 2; }
  .cl-lb-sprocket::before { content: ''; position: absolute; inset: 0; background-image: radial-gradient(circle 5px, #1C1108 5px, transparent 5.5px); background-size: 32px 20px; background-position: 12px 0; background-repeat: repeat-x; }
  .cl-lb-sprocket--top { top: 0; }
  .cl-lb-sprocket--bottom { bottom: 0; }
  .cl-lb--v9 .cl-lb-thumb { filter: sepia(.35) saturate(.85); }
  .cl-lb--v9 .cl-lb-thumb.is-active { border-color: #E7DDC6; }
  .cl-lb-grain { position: absolute; inset: 0; pointer-events: none; opacity: .18; mix-blend-mode: overlay; background-image: repeating-linear-gradient(0deg, rgba(255,255,255,.5) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(0,0,0,.5) 0 1px, transparent 1px 3px); }
`

export default function ClassicLightbox({ images, index, open, variant, onClose }: Props) {
  const [idx, setIdx] = useState(index)
  const [fading, setFading] = useState(false)
  const [prevOpen, setPrevOpen] = useState(open)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

  const v = STYLED_VARIANTS.has(variant) ? variant : 1

  // 열릴 때(닫힘→열림 전환 시) 부모가 지정한 index로 동기화.
  // 렌더 중 상태 조정(React 권장 패턴)으로 처리해 effect 캐스케이드를 피한다.
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setIdx(Math.min(Math.max(index, 0), Math.max(images.length - 1, 0)))
  }

  // 스크롤 잠금
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prevOverflow }
  }, [open])

  const goTo = useCallback((next: number) => {
    const total = images.length
    if (!total) return
    const nextIdx = ((next % total) + total) % total
    if (v === 5) {
      setFading(true)
      window.setTimeout(() => { setIdx(nextIdx); setFading(false) }, 220)
      return
    }
    setIdx(nextIdx)
  }, [images.length, v])

  const goNext = useCallback(() => goTo(idx + 1), [goTo, idx])
  const goPrev = useCallback(() => goTo(idx - 1), [goTo, idx])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, goNext, goPrev])

  if (!open || images.length === 0 || !mounted) return null

  const preventContext = (e: React.SyntheticEvent) => e.preventDefault()
  // 미리보기 컨테이너(transform/overflow)에 갇히지 않도록 body로 포털 렌더 → 뷰포트 전체 오버레이
  const wrap = (node: React.ReactNode) => createPortal(node, document.body)

  const touchProps = {
    onTouchStart: (e: React.TouchEvent) => {
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
    },
    onTouchEnd: (e: React.TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX.current
      const dy = e.changedTouches[0].clientY - touchStartY.current
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) goNext(); else goPrev() }
    },
  }

  // === v4 룩북: 전체 세로 스크롤 ===
  if (v === 4) {
    return wrap(
      <div className="cl-lb-overlay cl-lb--v4" onContextMenu={preventContext} onClick={onClose}>
        <style dangerouslySetInnerHTML={{ __html: CL_LB_STYLES }} />
        <button type="button" className="cl-lb-v4-close" onClick={(e) => { e.stopPropagation(); onClose() }} aria-label="닫기">&times;</button>
        <div className="cl-lb-v4-scroll" onClick={(e) => e.stopPropagation()}>
          {images.map((src, i) => (
            <img key={i} src={src} alt={`갤러리 사진 ${i + 1}`} className="cl-lb-v4-img" draggable={false} onContextMenu={preventContext} />
          ))}
        </div>
      </div>
    )
  }

  const showThumbs = v !== 5 && v !== 6

  return wrap(
    <div className={`cl-lb-overlay cl-lb--v${v}`} onContextMenu={preventContext} onClick={onClose}>
      <style dangerouslySetInnerHTML={{ __html: CL_LB_STYLES }} />
      {v === 9 && <div className="cl-lb-grain" aria-hidden="true" />}

      <div className="cl-lb-topbar">
        <span className="cl-lb-title">GALLERY</span>
        <button type="button" className="cl-lb-close" onClick={(e) => { e.stopPropagation(); onClose() }} aria-label="닫기">&times;</button>
      </div>

      <div className="cl-lb-stage-row">
        {v === 9 && <div className="cl-lb-sprocket cl-lb-sprocket--top" aria-hidden="true" />}
        <button type="button" className="cl-lb-nav cl-lb-nav--prev" onClick={(e) => { e.stopPropagation(); goPrev() }} aria-label="이전 사진">&#8249;</button>
        <div className="cl-lb-stage" onClick={(e) => e.stopPropagation()} {...touchProps}>
          <img
            src={images[idx]}
            alt={`갤러리 사진 ${idx + 1}`}
            className={`cl-lb-img${v === 5 ? ' cl-lb--v5-fade' : ''}${v === 5 && fading ? ' is-hidden' : ''}`}
            draggable={false}
            onContextMenu={preventContext}
          />
        </div>
        <button type="button" className="cl-lb-nav cl-lb-nav--next" onClick={(e) => { e.stopPropagation(); goNext() }} aria-label="다음 사진">&#8250;</button>
        {v === 9 && <div className="cl-lb-sprocket cl-lb-sprocket--bottom" aria-hidden="true" />}
      </div>

      <div className="cl-lb-counter">{pad2(idx + 1)} / {pad2(images.length)}</div>
      {v === 7 && <div className="cl-lb-caption">Gallery — a quiet story in photographs</div>}

      {showThumbs && (
        <div className="cl-lb-thumbs" onClick={(e) => e.stopPropagation()}>
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              className={`cl-lb-thumb${i === idx ? ' is-active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`${i + 1}번째 사진 보기`}
            >
              <img src={src} alt="" draggable={false} onContextMenu={preventContext} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
