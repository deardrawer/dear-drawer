'use client'

// 하객이 직접 여는 인터랙티브 인트로 셸.
// 흐름: 인트로(조작) → 완료 화면 → (탭·스크롤·스와이프) → onNext(초대글)
import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react'
import type { IntroSettings, IntroStyleId } from '@/lib/introPresets'
import { getStyleOptions } from '@/lib/introStyles'
import type { IntroData, IntroStyleProps } from './shared'
import TypedIntro from './TypedIntro'
import FrostIntro from './FrostIntro'
import LabelsIntro from './LabelsIntro'
import TilesIntro from './TilesIntro'
import GridIntro from './GridIntro'
import PiecesIntro from './PiecesIntro'
import { withStyleNames } from './shared'
import PostcardIntro from './PostcardIntro'
import VellumIntro from './VellumIntro'
import EnvelopeIntro from './EnvelopeIntro'
import StarsIntro from './StarsIntro'

const STYLES: Partial<Record<IntroStyleId, ComponentType<IntroStyleProps>>> = {
  typed: TypedIntro,
  frost: FrostIntro,
  labels: LabelsIntro,
  tiles: TilesIntro,
  grid: GridIntro,
  pieces: PiecesIntro,
  postcard: PostcardIntro,
  vellum: VellumIntro,
  envelope: EnvelopeIntro,
  stars: StarsIntro,
}

export function hasInteractiveRenderer(id: string): boolean {
  return id in STYLES
}

const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Pinyon+Script&family=Mrs+Saint+Delafield&family=Sacramento&family=Herr+Von+Muellerhoff&family=Monsieur+La+Doulaise&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Playfair+Display:ital@0;1&family=Jost:wght@300;500&family=Inter:ital,wght@0,400;0,500;0,600;1,400&family=Nanum+Myeongjo&family=Nanum+Gothic:wght@400;700&family=Noto+Serif+KR:wght@400;500&family=Gowun+Batang&family=Noto+Sans+KR:wght@300;400;500&display=swap'

function useIntroFonts() {
  useEffect(() => {
    const prev = document.querySelector<HTMLLinkElement>('link[data-intro-fonts]')
    if (prev) { if (prev.href !== FONT_HREF) prev.href = FONT_HREF; return }
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = FONT_HREF
    link.setAttribute('data-intro-fonts', '1')
    document.head.appendChild(link)
  }, [])
}

interface Props {
  styleId: IntroStyleId
  settings: IntroSettings
  data: IntroData
  onNext: () => void
  /** 에디터 미리보기처럼 상자 안에 그릴 때 */
  embedded?: boolean
  /** 재방문 판별용 키 (청첩장 id). 없으면 매번 처음부터 */
  visitKey?: string
  /** 완료 화면부터 보여준다 (에디터에서 설정을 바꿀 때 바로 결과를 보이려고) */
  startFinished?: boolean
}

export default function InteractiveIntro({ styleId, settings, data, onNext, embedded, visitKey, startFinished }: Props) {
  useIntroFonts()
  const frameRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [signal, setSignal] = useState(0)
  const [reduced] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  const storageKey = visitKey ? `dd-intro:${visitKey}:${styleId}` : ''
  const [finished] = useState(() => {
    if (startFinished) return true
    if (!storageKey || typeof window === 'undefined') return false
    try { return window.sessionStorage.getItem(storageKey) === '1' } catch { return false }
  })
  const [done, setDone] = useState(finished)
  const [nextReady, setNextReady] = useState(finished)
  const leaving = useRef(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setSize({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const handleComplete = useCallback(() => {
    setDone(true)
    if (storageKey) { try { window.sessionStorage.setItem(storageKey, '1') } catch { /* private mode */ } }
  }, [storageKey])

  // 완료 직후의 같은 탭이 바로 넘어가지 않도록 잠깐 기다린다
  useEffect(() => {
    if (!done || nextReady) return
    const t = setTimeout(() => setNextReady(true), reduced ? 0 : 1400)
    return () => clearTimeout(t)
  }, [done, nextReady, reduced])

  const goNext = useCallback(() => {
    if (leaving.current) return
    leaving.current = true
    setFading(true)
    onNext()
  }, [onNext])

  // 스크롤·스와이프: 진행 중이면 완료, 완료 후면 다음 화면
  const advance = useCallback(() => {
    if (!done) setSignal(s => s + 1)
    else if (nextReady) goNext()
  }, [done, nextReady, goNext])

  const touchY = useRef(0)
  const touchOnGesture = useRef(false)
  const onTouchStart = (e: React.TouchEvent) => {
    touchY.current = e.touches[0].clientY
    touchOnGesture.current = !!(e.target as HTMLElement).closest('[data-intro-gesture]')
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchOnGesture.current && !done) return
    if (touchY.current - e.changedTouches[0].clientY > 50) advance()
  }
  const lastWheel = useRef(0)
  const onWheel = (e: React.WheelEvent) => {
    if (e.deltaY <= 0) return
    const now = Date.now()
    if (now - lastWheel.current < 700) return
    lastWheel.current = now
    advance()
  }

  const Style = STYLES[styleId]
  // 크기는 브라우저에서만 잰다 — 재방문(sessionStorage) 여부로 달라지는 부분은 측정 뒤에 그려 서버 HTML과 어긋나지 않게 한다
  const measured = size.w > 0
  const opts = getStyleOptions(styleId, settings.styleOptions, data.noWedding)

  return (
    <div
      className={`${embedded ? 'absolute' : 'fixed'} inset-0 z-[100] flex items-center justify-center bg-[#1a1a1a]`}
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{ opacity: fading ? 0 : 1, transition: 'opacity .5s ease' }}
    >
      <div ref={frameRef} data-intro-frame className={`relative overflow-hidden ${embedded ? 'w-full h-full' : 'dd-intro-frame'}`} style={{ overflow: 'clip', userSelect: 'none', WebkitUserSelect: 'none' }}>
        {Style && measured && (
          <Style w={size.w} h={size.h} opts={opts} data={withStyleNames(data, opts)} finished={finished} reduced={reduced} signal={signal} onComplete={handleComplete} />
        )}

        {/* 완료 후: 아무 곳이나 탭하면 초대글로 */}
        {measured && done && nextReady && (
          <button type="button" aria-label="초대글 보기" onClick={goNext}
            className="absolute inset-0 z-[60] w-full h-full cursor-pointer bg-transparent" />
        )}
        {measured && done && (
          <div className="absolute left-0 right-0 bottom-4 z-[61] flex flex-col items-center gap-2 pointer-events-none"
            style={{ opacity: nextReady ? 1 : 0, transition: 'opacity .8s ease' }}>
            {/* 안내 알약: 흐림(backdrop-blur)은 일부 모바일 브라우저에서 아래 움직이는 화살표와 겹쳐 검은 띠가 생겨 단색 반투명으로 */}
            {settings.guideEnabled && (
              <span className="px-3 py-1 rounded-full bg-black/35 text-white/90 text-[11px]" style={{ letterSpacing: '.04em' }}>
                {settings.guideText || '터치하거나 아래로 넘겨주세요'}
              </span>
            )}
            {/* 아래 화살표: 흰색 + 옅은 그림자 (밝은 사진에서도 보이게) */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="dd-intro-cue" style={{ color: 'rgba(255,255,255,.95)', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.35))' }}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        )}
      </div>

      {measured && !done && (
        <button type="button" onClick={() => setSignal(s => s + 1)}
          className="absolute top-4 right-4 z-[70] px-3 py-1.5 bg-black/25 hover:bg-black/40 text-white/85 text-xs rounded-full backdrop-blur-sm">
          건너뛰기
        </button>
      )}

      <style jsx global>{`
        .dd-intro-frame { width: 100%; height: 100%; }
        @media (min-width: 768px) { .dd-intro-frame { width: min(100%, calc(100dvh * 9 / 16)); height: 100%; } }
        @keyframes ddIntroCue { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(5px); } }
        .dd-intro-cue { animation: ddIntroCue 1.8s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .dd-intro-cue { animation: none; } }
      `}</style>
    </div>
  )
}
