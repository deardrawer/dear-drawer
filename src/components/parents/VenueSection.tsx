'use client'

import { useState, useEffect, useRef } from 'react'
import { useSectionHighlight } from './SectionHighlightContext'
import { useTheme } from './ThemeContext'

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
      line?: string  // 단일 노선 (호환성)
      station?: string
      exit?: string
      walk?: string
      lines?: SubwayLine[]  // 다중 노선
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
  const theme = useTheme()
  const [showDirectionsModal, setShowDirectionsModal] = useState(false)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInitialized = useRef(false)
  const [mapError, setMapError] = useState(false)

  useEffect(() => {
    if (mapInitialized.current || !venue.address) return

    const initMapWithGeocoding = () => {
      if (!mapContainerRef.current || !window.kakao?.maps) return

      mapInitialized.current = true

      // Geocoder로 주소를 좌표로 변환
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
          // Geocoding 실패 시 기본 좌표 사용 (서울 중심)
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
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&libraries=services&autoload=false`
    script.async = true
    script.onload = () => {
      window.kakao.maps.load(initMapWithGeocoding)
    }
    document.head.appendChild(script)
  }, [venue.address, venue.name])

  // 지도 앱 열기 - 주소로 검색
  const openNaverMap = () => {
    window.open(`https://map.naver.com/v5/search/${encodeURIComponent(venue.address)}`, '_blank')
  }

  const openKakaoMap = () => {
    window.open(`https://map.kakao.com/link/search/${encodeURIComponent(venue.address)}`, '_blank')
  }

  const openTmap = () => {
    window.open(`https://tmap.life/search?keyword=${encodeURIComponent(venue.address)}`, '_blank')
  }

  // 오시는 길 정보가 있는지 확인
  const hasDirections = directions && (directions.bus || directions.subway || directions.expressBus || directions.train || directions.parking || (directions.extraInfoEnabled && directions.extraInfoText))

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      className="px-8 py-20 transition-all duration-500 flex flex-col items-center justify-center"
      style={{
        backgroundColor: theme.background,
        opacity: hasAppeared ? (isActive ? 1 : 0.3) : 0,
        transform: hasAppeared ? 'translateY(0)' : 'translateY(20px)',
        filter: isActive ? 'none' : 'grayscale(30%)',
      }}
    >
      <div className="text-center mb-10 w-full">
        <p
          className="font-serif text-xl font-semibold mb-2 transition-colors duration-500"
          style={{ color: isActive ? theme.text : '#999' }}
        >
          {venue.name}
        </p>
        {venue.hall && (
          <p className="text-sm transition-colors duration-500" style={{ color: theme.accent }}>
            {venue.hall}
          </p>
        )}
        <p className="text-xs mt-2 transition-colors duration-500" style={{ color: isActive ? '#999' : '#bbb' }}>
          {venue.address}
        </p>
      </div>

      <div
        ref={mapContainerRef}
        className="w-full aspect-[16/9] rounded-sm mb-4 overflow-hidden transition-all duration-500"
        style={{
          backgroundColor: '#E8E4DC',
          boxShadow: isActive ? '0 4px 20px rgba(0, 0, 0, 0.08)' : '0 2px 8px rgba(0, 0, 0, 0.02)',
        }}
      >
        {mapError && (
          <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
            주소를 확인해주세요
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 mb-6">
        <button
          onClick={openNaverMap}
          className="px-4 py-2 text-xs tracking-wide rounded-full transition-all"
          style={{ backgroundColor: '#F5F0EB', color: '#666' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.accent; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F5F0EB'; e.currentTarget.style.color = '#666'; }}
        >
          네이버지도
        </button>
        <button
          onClick={openKakaoMap}
          className="px-4 py-2 text-xs tracking-wide rounded-full transition-all"
          style={{ backgroundColor: '#F5F0EB', color: '#666' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.accent; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F5F0EB'; e.currentTarget.style.color = '#666'; }}
        >
          카카오맵
        </button>
        <button
          onClick={openTmap}
          className="px-4 py-2 text-xs tracking-wide rounded-full transition-all"
          style={{ backgroundColor: '#F5F0EB', color: '#666' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.accent; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F5F0EB'; e.currentTarget.style.color = '#666'; }}
        >
          T맵
        </button>
      </div>

      {hasDirections && (
        <div className="w-full max-w-[340px]">
          <button
            onClick={() => setShowDirectionsModal(!showDirectionsModal)}
            className="w-full py-3 border rounded-lg text-sm tracking-wide transition-all"
            style={{
              borderColor: showDirectionsModal ? theme.accent : '#E8E4DC',
              color: showDirectionsModal ? theme.accent : (isActive ? '#666' : '#aaa'),
              borderBottomLeftRadius: showDirectionsModal ? 0 : undefined,
              borderBottomRightRadius: showDirectionsModal ? 0 : undefined,
            }}
          >
            오시는 길 안내
          </button>

          <div
            className="overflow-hidden transition-all duration-300 border border-t-0 rounded-b-lg"
            style={{
              maxHeight: showDirectionsModal ? '500px' : '0px',
              borderColor: showDirectionsModal ? theme.accent : 'transparent',
              opacity: showDirectionsModal ? 1 : 0,
            }}
          >
            <div className="p-4" style={{ backgroundColor: '#FEFDFB' }}>
              {directions?.bus && directions.bus.lines && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">🚌</span>
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
                    <span className="text-base">🚇</span>
                    <h4 className="font-medium text-xs" style={{ color: '#1A1A1A' }}>지하철</h4>
                  </div>
                  <div className="text-xs leading-relaxed pl-6 space-y-1" style={{ color: '#666' }}>
                    {/* 다중 노선 표시 */}
                    {directions.subway.lines && directions.subway.lines.length > 0 ? (
                      directions.subway.lines.map((item, idx) => (
                        <p key={idx} className="mb-0.5">
                          {item.line && `${item.line} `}
                          <span style={{ color: theme.accent }}>{item.station}</span>
                          {item.exit && ` ${item.exit}`}
                        </p>
                      ))
                    ) : (
                      /* 단일 노선 (호환성) */
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
                    <span className="text-base">🚐</span>
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
                    <span className="text-base">🚆</span>
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
                    <span className="text-base">🅿️</span>
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

              {/* 추가 안내사항 */}
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
