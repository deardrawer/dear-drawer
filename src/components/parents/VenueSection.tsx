'use client'

import { useState, useEffect, useRef } from 'react'
import { useSectionHighlight } from './SectionHighlightContext'
import { useTheme } from './ThemeContext'
import { BusIcon, SubwayIcon, ExpressBusIcon, TrainIcon, ParkingIcon } from './icons'

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

const stagger = (hasAppeared: boolean, delay: number) => ({
  opacity: hasAppeared ? 1 : 0,
  transform: hasAppeared ? 'translateY(0)' : 'translateY(18px)',
  transition: 'opacity 0.8s ease, transform 0.8s ease',
  transitionDelay: hasAppeared ? `${delay}s` : '0s',
})

export default function VenueSection({
  venue = {
    name: '더채플앳청담',
    hall: '5층 루체홀',
    address: '서울특별시 강남구 청담동 123-45',
  },
  directions,
}: VenueSectionProps) {
  const { ref, isActive, hasAppeared } = useSectionHighlight('venue')
  const theme = useTheme()
  // showDirectionsModal 제거 - 교통편 안내 항상 펼침
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInitialized = useRef(false)
  const [mapError, setMapError] = useState(false)

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

          const infowindow = new window.kakao.maps.InfoWindow({
            content: `<div style="padding:5px;font-size:12px;white-space:nowrap;">${venue.name}</div>`,
          })
          infowindow.open(map, marker)
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
    window.open(`https://tmap.life/search?keyword=${encodeURIComponent(venue.address)}`, '_blank')
  }

  const hasDirections = directions && (directions.bus || directions.subway || directions.expressBus || directions.train || directions.parking || (directions.extraInfoEnabled && directions.extraInfoText))

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      className="py-16 flex flex-col items-center justify-center"
      style={{
        backgroundColor: theme.background,
        filter: isActive ? 'none' : 'grayscale(30%)',
        opacity: isActive ? 1 : 0.3,
        transition: 'filter 0.5s, opacity 0.5s',
      }}
    >
      {/* LOCATION label */}
      <p
        className="text-[10px] tracking-[6px] mb-6"
        style={{
          color: isActive ? `${theme.accent}80` : '#bbb',
          fontWeight: 300,
          ...stagger(hasAppeared, 0),
        }}
      >
        LOCATION
      </p>

      <div
        className="text-center mb-8 w-full px-8"
        style={stagger(hasAppeared, 0.15)}
      >
        <p
          className="text-xl mb-1.5 tracking-[2px]"
          style={{ color: isActive ? theme.text : '#999', fontWeight: 300 }}
        >
          {venue.name}
        </p>
        {venue.hall && (
          <p
            className="text-[13px] tracking-[1px] mb-1.5"
            style={{ color: theme.primary, fontWeight: 300 }}
          >
            {venue.hall}
          </p>
        )}
        <p
          className="text-[11px] tracking-[0.5px]"
          style={{ color: isActive ? `${theme.accent}80` : '#bbb' }}
        >
          {venue.address}
        </p>
      </div>

      {/* Map with rounded corners and shadow - scale-up entrance */}
      <div
        className="w-full px-6 mb-5"
        style={{
          opacity: hasAppeared ? 1 : 0,
          transform: hasAppeared ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
          transitionDelay: hasAppeared ? '0.3s' : '0s',
        }}
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            boxShadow: isActive ? '0 4px 24px rgba(0,0,0,0.06)' : '0 2px 8px rgba(0,0,0,0.02)',
            transition: 'box-shadow 0.5s',
          }}
        >
          <div
            ref={mapContainerRef}
            className="w-full aspect-[16/10]"
            style={{ backgroundColor: '#E8E4DC' }}
          >
            {mapError && (
              <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
                주소를 확인해주세요
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation chip buttons */}
      <div
        className="flex flex-wrap items-center justify-center gap-2 mb-6 px-6"
        style={stagger(hasAppeared, 0.5)}
      >
        <button
          onClick={openNaverMap}
          className="flex items-center gap-1.5 px-[18px] py-2.5 text-[11px] tracking-[0.5px] rounded-3xl whitespace-nowrap transition-all duration-200"
          style={{
            backgroundColor: '#FFFFFF',
            border: `1px solid ${isActive ? '#E8E2DA' : '#eee'}`,
            color: isActive ? theme.textLight : '#aaa',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.color = theme.accent; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = isActive ? '#E8E2DA' : '#eee'; e.currentTarget.style.color = isActive ? theme.textLight : '#aaa'; }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          네이버지도
        </button>
        <button
          onClick={openKakaoMap}
          className="flex items-center gap-1.5 px-[18px] py-2.5 text-[11px] tracking-[0.5px] rounded-3xl whitespace-nowrap transition-all duration-200"
          style={{
            backgroundColor: '#FFFFFF',
            border: `1px solid ${isActive ? '#E8E2DA' : '#eee'}`,
            color: isActive ? theme.textLight : '#aaa',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.color = theme.accent; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = isActive ? '#E8E2DA' : '#eee'; e.currentTarget.style.color = isActive ? theme.textLight : '#aaa'; }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          카카오맵
        </button>
        <button
          onClick={openTmap}
          className="flex items-center gap-1.5 px-[18px] py-2.5 text-[11px] tracking-[0.5px] rounded-3xl whitespace-nowrap transition-all duration-200"
          style={{
            backgroundColor: '#FFFFFF',
            border: `1px solid ${isActive ? '#E8E2DA' : '#eee'}`,
            color: isActive ? theme.textLight : '#aaa',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.color = theme.accent; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = isActive ? '#E8E2DA' : '#eee'; e.currentTarget.style.color = isActive ? theme.textLight : '#aaa'; }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
          </svg>
          T맵
        </button>
      </div>

      {hasDirections && (
        <div
          className="w-full px-6"
          style={stagger(hasAppeared, 0.65)}
        >
          <div
            className="text-center text-xs tracking-[2px] mb-4"
            style={{ color: isActive ? theme.textLight : '#999', fontWeight: 400 }}
          >
            오시는 길 안내
          </div>

          <div
            className="overflow-hidden rounded-xl"
            style={{
              border: `1px solid ${isActive ? '#E8E2DA' : '#eee'}`,
            }}
          >
            <div className="p-4" style={{ backgroundColor: '#FEFDFB' }}>
              {directions?.bus && directions.bus.lines && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BusIcon size={18} color={theme.accent} />
                    <h4 className="font-medium text-xs" style={{ color: '#1A1A1A' }}>버스</h4>
                  </div>
                  <div className="text-xs leading-relaxed pl-6" style={{ color: '#666' }}>
                    <p className="mb-0.5">{directions.bus.lines}</p>
                    {directions.bus.stop && (
                      <p className="text-[10px] mt-1" style={{ color: '#999' }}>{directions.bus.stop}</p>
                    )}
                  </div>
                </div>
              )}

              {directions?.subway && (directions.subway.station || (directions.subway.lines && directions.subway.lines.length > 0)) && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <SubwayIcon size={18} color={theme.accent} />
                    <h4 className="font-medium text-xs" style={{ color: '#1A1A1A' }}>지하철</h4>
                  </div>
                  <div className="text-xs leading-relaxed pl-6 space-y-1" style={{ color: '#666' }}>
                    {directions.subway.lines && directions.subway.lines.length > 0 ? (
                      directions.subway.lines.map((item, idx) => (
                        <p key={idx} className="mb-0.5">
                          {item.line && `${item.line} `}
                          <span style={{ color: theme.accent }}>{item.station}</span>
                          {item.exit && ` ${item.exit}`}
                        </p>
                      ))
                    ) : (
                      <p className="mb-0.5">
                        {directions.subway.line && `${directions.subway.line} `}
                        <span style={{ color: theme.accent }}>{directions.subway.station}</span>
                        {directions.subway.exit && ` ${directions.subway.exit}`}
                      </p>
                    )}
                    {directions.subway.walk && (
                      <p className="text-[10px] mt-1" style={{ color: '#999' }}>{directions.subway.walk}</p>
                    )}
                  </div>
                </div>
              )}

              {directions?.expressBus && (directions.expressBus.stop || directions.expressBus.route || (directions.expressBus.stops && directions.expressBus.stops.length > 0)) && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ExpressBusIcon size={18} color={theme.accent} />
                    <h4 className="font-medium text-xs" style={{ color: '#1A1A1A' }}>고속버스</h4>
                  </div>
                  <div className="text-xs leading-relaxed pl-6 space-y-1" style={{ color: '#666' }}>
                    {directions.expressBus.stops && directions.expressBus.stops.length > 0 ? (
                      directions.expressBus.stops.map((item, idx) => (
                        <div key={idx}>
                          {item.stop && <p className="mb-0.5"><span style={{ color: theme.accent }}>{item.stop}</span></p>}
                          {item.note && <p className="text-[10px] mt-0.5" style={{ color: '#999' }}>{item.note}</p>}
                        </div>
                      ))
                    ) : (
                      <>
                        {directions.expressBus.route && <p className="mb-0.5">{directions.expressBus.route}</p>}
                        {directions.expressBus.stop && <p className="mb-0.5"><span style={{ color: theme.accent }}>{directions.expressBus.stop}</span></p>}
                        {directions.expressBus.note && <p className="text-[10px] mt-1" style={{ color: '#999' }}>{directions.expressBus.note}</p>}
                      </>
                    )}
                  </div>
                </div>
              )}

              {directions?.train && (directions.train.station || directions.train.line || (directions.train.stations && directions.train.stations.length > 0)) && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrainIcon size={18} color={theme.accent} />
                    <h4 className="font-medium text-xs" style={{ color: '#1A1A1A' }}>기차 (KTX/SRT)</h4>
                  </div>
                  <div className="text-xs leading-relaxed pl-6 space-y-1" style={{ color: '#666' }}>
                    {directions.train.stations && directions.train.stations.length > 0 ? (
                      directions.train.stations.map((item, idx) => (
                        <div key={idx}>
                          {item.station && <p className="mb-0.5"><span style={{ color: theme.accent }}>{item.station}</span></p>}
                          {item.note && <p className="text-[10px] mt-0.5" style={{ color: '#999' }}>{item.note}</p>}
                        </div>
                      ))
                    ) : (
                      <>
                        {directions.train.line && <p className="mb-0.5">{directions.train.line}</p>}
                        {directions.train.station && <p className="mb-0.5"><span style={{ color: theme.accent }}>{directions.train.station}</span></p>}
                        {directions.train.note && <p className="text-[10px] mt-1" style={{ color: '#999' }}>{directions.train.note}</p>}
                      </>
                    )}
                  </div>
                </div>
              )}

              {directions?.parking && directions.parking.capacity && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ParkingIcon size={18} color={theme.accent} />
                    <h4 className="font-medium text-xs" style={{ color: '#1A1A1A' }}>주차 안내</h4>
                  </div>
                  <div className="text-xs leading-relaxed pl-6" style={{ color: '#666' }}>
                    <p className="mb-0.5">{directions.parking.capacity}</p>
                    {directions.parking.free && (
                      <p className="mb-0.5">{directions.parking.free}</p>
                    )}
                    {directions.parking.note && (
                      <p className="text-[10px] mt-1" style={{ color: '#999' }}>{directions.parking.note}</p>
                    )}
                  </div>
                </div>
              )}

              {directions?.extraInfoEnabled && directions?.extraInfoText && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: '#E8E4DC' }}>
                  <div className="text-xs leading-relaxed whitespace-pre-line" style={{ color: '#666' }}>
                    {directions.extraInfoText}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
