'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSectionHighlight } from './SectionHighlightContext'
import { C_TXT_BODY, C_FIELD, C_TXT, C_HAIR, C_TXT_SUB, cCaption, cDim, cMiniPill, cPill, cStagger, cTitle } from './cStyle'

interface SubwayLine {
  line: string
  station: string
  exit: string
}

interface ExpressBusItem {
  stop: string
  note: string
}

interface TrainItem {
  station: string
  note: string
}

interface VenueSectionProps {
  venue?: {
    name: string
    hall: string
    address: string
  }
  directions?: {
    bus?: { lines: string; stop: string }
    subway?: {
      line?: string
      station?: string
      exit?: string
      walk?: string
      lines?: SubwayLine[]
    }
    expressBus?: { route?: string; stop?: string; note?: string; stops?: ExpressBusItem[] }
    train?: { line?: string; station?: string; note?: string; stations?: TrainItem[] }
    parking?: { capacity: string; free: string; note: string }
    extraInfoEnabled?: boolean
    extraInfoText?: string
  }
}

export default function VenueSection({
  venue = {
    name: '더채플앳청담',
    hall: '5층 루체홀',
    address: '서울특별시 강남구 청담동 123-45',
  },
  directions,
}: VenueSectionProps) {
  const { ref, isActive, hasAppeared } = useSectionHighlight('venue')
  // showDirectionsModal 제거 - 교통편 안내 항상 펼침
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInitialized = useRef(false)
  const [mapError, setMapError] = useState(false)

  // 지도 스크롤 가로채기 방지: 1차 터치=안내, 2차 터치=활성화 (the-simple과 동일)
  const mapWrapRef = useRef<HTMLDivElement>(null)
  const [mapState, setMapState] = useState<'locked' | 'hint' | 'active'>('locked')
  const [addressCopied, setAddressCopied] = useState(false)

  const handleAddressCopy = async () => {
    const text = venue.address || ''
    if (!text) return
    let copied = false
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try { await navigator.clipboard.writeText(text); copied = true } catch { /* fallthrough */ }
    }
    if (!copied) {
      try {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        copied = document.execCommand('copy')
        document.body.removeChild(ta)
      } catch { copied = false }
    }
    if (copied) {
      setAddressCopied(true)
      setTimeout(() => setAddressCopied(false), 2000)
    }
  }
  const mapActive = mapState === 'active'
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleOverlayTap = useCallback(() => {
    setMapState(prev => {
      if (prev === 'locked') {
        if (hintTimer.current) clearTimeout(hintTimer.current)
        hintTimer.current = setTimeout(() => {
          setMapState(p => (p === 'hint' ? 'locked' : p))
        }, 3000)
        return 'hint'
      }
      if (prev === 'hint') {
        if (hintTimer.current) clearTimeout(hintTimer.current)
        return 'active'
      }
      return prev
    })
  }, [])

  // 지도 외부 터치 시 다시 잠금
  useEffect(() => {
    if (mapState === 'locked') return
    const handler = (e: TouchEvent | MouseEvent) => {
      if (mapWrapRef.current && !mapWrapRef.current.contains(e.target as Node)) {
        setMapState('locked')
        if (hintTimer.current) clearTimeout(hintTimer.current)
      }
    }
    document.addEventListener('touchstart', handler, { passive: true })
    document.addEventListener('mousedown', handler, { passive: true })
    return () => {
      document.removeEventListener('touchstart', handler)
      document.removeEventListener('mousedown', handler)
    }
  }, [mapState])

  useEffect(() => {
    return () => { if (hintTimer.current) clearTimeout(hintTimer.current) }
  }, [])

  useEffect(() => {
    if (mapInitialized.current || !venue.address) return

    const initMapWithGeocoding = () => {
      if (!mapContainerRef.current || !window.kakao?.maps) return

      mapInitialized.current = true

      const geocoder = new window.kakao.maps.services.Geocoder()
      const container = mapContainerRef.current
      if (!container) return

      geocoder.addressSearch(venue.address, (result: { x: string; y: string }[], status: string) => {
        if (status === window.kakao.maps.services.Status.OK && result[0]) {
          const lat = parseFloat(result[0].y)
          const lng = parseFloat(result[0].x)

          const options = {
            center: new window.kakao.maps.LatLng(lat, lng),
            level: 3,
          }

          const map = new window.kakao.maps.Map(container, options)

          const marker = new window.kakao.maps.Marker({
            position: new window.kakao.maps.LatLng(lat, lng),
          })
          marker.setMap(map)

          // 먹색 말풍선 (중앙정렬 pill + 아래 꼬리)
          const accent = '#1F1D1A'
          const overlayEl = document.createElement('div')
          overlayEl.style.cssText = 'position:relative;transform:translateY(-8px);display:flex;flex-direction:column;align-items:center;'
          overlayEl.innerHTML =
            `<div style="background:${accent};color:#fff;font-size:12px;font-weight:500;letter-spacing:0.3px;line-height:1;padding:7px 14px;border-radius:16px;white-space:nowrap;text-align:center;">${venue.name}</div>` +
            `<div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:7px solid ${accent};margin-top:-1px;"></div>`
          const overlay = new window.kakao.maps.CustomOverlay({
            position: new window.kakao.maps.LatLng(lat, lng),
            content: overlayEl,
            yAnchor: 1.55,
            xAnchor: 0.5,
          })
          overlay.setMap(map)
        } else {
          console.warn('Geocoding failed, using default coordinates')
          setMapError(true)
        }
      })
    }

    if (window.kakao?.maps?.services) {
      initMapWithGeocoding()
      return
    }

    const script = document.createElement('script')
    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY || '0890847927f3189d845391481ead8ecc'
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&libraries=services&autoload=false`
    script.async = true
    script.onload = () => {
      window.kakao.maps.load(initMapWithGeocoding)
    }
    document.head.appendChild(script)
  }, [venue.address, venue.name])

  const openNaverMap = () => {
    window.open(`https://map.naver.com/v5/search/${encodeURIComponent(venue.address)}`, '_blank')
  }

  const openKakaoMap = () => {
    window.open(`https://map.kakao.com/link/search/${encodeURIComponent(venue.address)}`, '_blank')
  }

  const openTmap = () => {
    window.location.href = `tmap://search?name=${encodeURIComponent(venue.name || venue.address)}`
  }

  const hasDirections = directions && (directions.bus || directions.subway || directions.expressBus || directions.train || directions.parking || (directions.extraInfoEnabled && directions.extraInfoText))

  // 교통편 행 (라벨 + 내용) — 상자 없이 가는 선으로만 구분
  const rows: { label: string; content: React.ReactNode }[] = []
  const subLine = (t?: string) => t ? <span style={{ display: 'block', fontSize: 13.5, color: C_TXT_SUB, marginTop: 2 }}>{t}</span> : null

  if (directions?.subway && (directions.subway.station || (directions.subway.lines && directions.subway.lines.length > 0))) {
    const list = directions.subway.lines && directions.subway.lines.length > 0
      ? directions.subway.lines
      : [{ line: directions.subway.line || '', station: directions.subway.station || '', exit: directions.subway.exit || '' }]
    rows.push({
      label: '지하철',
      content: (
        <>
          {list.map((item, idx) => (
            <span key={idx} style={{ display: 'block' }}>
              {[item.line, item.station, item.exit].map(v => (v || '').trim()).filter(Boolean).join(' ')}
            </span>
          ))}
          {subLine(directions.subway.walk)}
        </>
      ),
    })
  }
  if (directions?.bus && directions.bus.lines) {
    rows.push({ label: '버스', content: <>{directions.bus.lines}{subLine(directions.bus.stop)}</> })
  }
  if (directions?.expressBus && (directions.expressBus.stop || directions.expressBus.route || (directions.expressBus.stops && directions.expressBus.stops.length > 0))) {
    rows.push({
      label: '고속버스',
      content: directions.expressBus.stops && directions.expressBus.stops.length > 0 ? (
        <>
          {directions.expressBus.stops.map((item, idx) => (
            <span key={idx} style={{ display: 'block', marginTop: idx ? 6 : 0 }}>
              {item.stop}
              {subLine(item.note)}
            </span>
          ))}
        </>
      ) : (
        <>
          {directions.expressBus.route && <span style={{ display: 'block' }}>{directions.expressBus.route}</span>}
          {directions.expressBus.stop && <span style={{ display: 'block' }}>{directions.expressBus.stop}</span>}
          {subLine(directions.expressBus.note)}
        </>
      ),
    })
  }
  if (directions?.train && (directions.train.station || directions.train.line || (directions.train.stations && directions.train.stations.length > 0))) {
    rows.push({
      label: '기차',
      content: directions.train.stations && directions.train.stations.length > 0 ? (
        <>
          {directions.train.stations.map((item, idx) => (
            <span key={idx} style={{ display: 'block', marginTop: idx ? 6 : 0 }}>
              {item.station}
              {subLine(item.note)}
            </span>
          ))}
        </>
      ) : (
        <>
          {directions.train.line && <span style={{ display: 'block' }}>{directions.train.line}</span>}
          {directions.train.station && <span style={{ display: 'block' }}>{directions.train.station}</span>}
          {subLine(directions.train.note)}
        </>
      ),
    })
  }
  if (directions?.parking && directions.parking.capacity) {
    rows.push({
      label: '주차',
      content: (
        <>
          {directions.parking.capacity}
          {directions.parking.free && <span style={{ display: 'block' }}>{directions.parking.free}</span>}
          {subLine(directions.parking.note)}
        </>
      ),
    })
  }

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      style={{ backgroundColor: 'transparent', padding: '72px 28px 80px', ...cDim(isActive) }}
    >
      <p style={{ ...cCaption, ...cStagger(hasAppeared, 0) }}>오시는 길</p>
      <div style={cStagger(hasAppeared, 0.15)}>
      <h2 style={{ ...cTitle(24, 0), marginTop: 12 }}>{venue.name}</h2>
      <p style={{ margin: '6px 0 0', fontSize: 14.5, lineHeight: 1.6, color: C_TXT_SUB, wordBreak: 'keep-all' }}>
        {[venue.address, venue.hall].map(v => (v || '').trim()).filter(Boolean).join(' · ')}
      </p>
      {venue.address && (
        <button type="button" onClick={handleAddressCopy} style={{ ...cMiniPill(addressCopied), height: 30, padding: '0 12px', fontSize: 13, marginTop: 12 }}>
          {addressCopied ? '복사됨' : '주소 복사'}
        </button>
      )}
      </div>

      {/* 지도 */}
      <div
        ref={mapWrapRef}
        style={{
          position: 'relative', marginTop: 24, borderRadius: 4, overflow: 'hidden', backgroundColor: C_FIELD,
          opacity: hasAppeared ? 1 : 0,
          transform: hasAppeared ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
          transition: 'opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1), transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
          transitionDelay: hasAppeared ? '0.3s' : '0s',
        }}
      >
        <div
          ref={mapContainerRef}
          className="w-full"
          style={{ aspectRatio: '16 / 10', backgroundColor: C_FIELD }}
        >
          {mapError && (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: C_TXT_SUB }}>
              주소를 확인해 주세요
            </div>
          )}
        </div>
        {/* 지도 스크롤 가로채기 방지 오버레이 — 1차 터치: 안내, 2차 터치: 활성화 */}
        {!mapActive && !mapError && (
          <div
            onClick={handleOverlayTap}
            style={{
              position: 'absolute', inset: 0, zIndex: 2, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.01)',
            }}
          >
            {mapState === 'hint' && (
              <span
                style={{
                  padding: '7px 14px', borderRadius: 999,
                  background: 'rgba(31,29,26,0.72)', color: '#fff',
                  fontSize: 12, pointerEvents: 'none',
                }}
              >
                한 번 더 누르면 지도를 움직일 수 있어요
              </span>
            )}
          </div>
        )}
      </div>

      {/* 지도 앱 버튼 */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, ...cStagger(hasAppeared, 0.5) }}>
        <button type="button" onClick={openNaverMap} style={cPill(false, 48)}>네이버지도</button>
        <button type="button" onClick={openKakaoMap} style={cPill(false, 48)}>카카오맵</button>
        <button type="button" onClick={openTmap} style={cPill(false, 48)}>티맵</button>
      </div>

      {hasDirections && (
        <div style={{ marginTop: 28, ...cStagger(hasAppeared, 0.65) }}>
          {rows.map((r) => (
            <div key={r.label} style={{ display: 'flex', gap: 16, padding: '15px 0', borderTop: `1px solid ${C_HAIR}` }}>
              <span style={{ width: 56, flexShrink: 0, fontSize: 14, color: C_TXT_SUB, lineHeight: 1.6 }}>{r.label}</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 15, color: C_TXT, lineHeight: 1.6, wordBreak: 'keep-all' }}>{r.content}</span>
            </div>
          ))}
          {directions?.extraInfoEnabled && directions?.extraInfoText && (
            <div style={{ padding: '15px 0', borderTop: `1px solid ${C_HAIR}`, fontSize: 14.5, lineHeight: 1.7, color: C_TXT_BODY, whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>
              {directions.extraInfoText}
            </div>
          )}
          <div style={{ borderTop: `1px solid ${C_HAIR}` }} />
        </div>
      )}
    </section>
  )
}
