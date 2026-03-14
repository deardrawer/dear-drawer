'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { loadKakaoMapSDK } from '@/lib/geunnalKakaoMap'
import type { KakaoMap, KakaoMarker } from '@/lib/geunnalKakaoMap'
import type { GeunnalVenue } from '@/types/geunnal'

interface UseKakaoMapOptions {
  venues: GeunnalVenue[]
  onMarkerClick?: (venueId: string) => void
}

export default function useKakaoMap({ venues, onMarkerClick }: UseKakaoMapOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<KakaoMap | null>(null)
  const markersRef = useRef<Map<string, KakaoMarker>>(new Map())
  const [ready, setReady] = useState(false)
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null)

  // Initialize map
  useEffect(() => {
    if (!containerRef.current) return

    let cancelled = false

    loadKakaoMapSDK()
      .then(() => {
        if (cancelled || !containerRef.current) return

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const kakaoMaps = (window as any).kakao.maps
        const center = new kakaoMaps.LatLng(37.5050, 127.0200)
        const map = new kakaoMaps.Map(containerRef.current, {
          center,
          level: 8,
        })
        mapRef.current = map
        setReady(true)
      })
      .catch((err: Error) => {
        console.warn('Kakao Map load failed:', err.message)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Sync markers with venues
  useEffect(() => {
    if (!ready || !mapRef.current) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const kakaoMaps = (window as any).kakao.maps
    const map = mapRef.current
    const prevMarkers = markersRef.current

    prevMarkers.forEach(marker => marker.setMap(null))
    prevMarkers.clear()

    if (venues.length === 0) return

    const bounds = new kakaoMaps.LatLngBounds()

    venues.forEach(venue => {
      const position = new kakaoMaps.LatLng(venue.lat, venue.lng)
      const marker = new kakaoMaps.Marker({ position, map })

      kakaoMaps.event.addListener(marker, 'click', () => {
        setSelectedVenueId(venue.id)
        onMarkerClick?.(venue.id)
      })

      prevMarkers.set(venue.id, marker)
      bounds.extend(position)
    })

    map.setBounds(bounds)
  }, [ready, venues, onMarkerClick])

  const focusVenue = useCallback((venueId: string) => {
    if (!mapRef.current) return
    const marker = markersRef.current.get(venueId)
    if (!marker) return

    mapRef.current.panTo(marker.getPosition())
    mapRef.current.setLevel(3)
    setSelectedVenueId(venueId)
  }, [])

  return { containerRef, ready, selectedVenueId, focusVenue }
}
