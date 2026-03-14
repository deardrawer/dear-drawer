// Kakao Maps SDK TypeScript declarations & loader for Geunnal

declare global {
  interface Window {
    kakao: {
      maps: {
        load: (callback: () => void) => void
        Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMap
        LatLng: new (lat: number, lng: number) => KakaoLatLng
        LatLngBounds: new () => KakaoLatLngBounds
        Marker: new (options: { position: KakaoLatLng; map?: KakaoMap }) => KakaoMarker
        InfoWindow: new (options: { content: string; removable?: boolean }) => KakaoInfoWindow
        services: {
          Places: new () => KakaoPlaces
          Status: { OK: string; ZERO_RESULT: string; ERROR: string }
        }
        event: {
          addListener: (target: unknown, type: string, handler: (...args: unknown[]) => void) => void
        }
      }
    }
  }
}

export interface KakaoLatLng {
  getLat: () => number
  getLng: () => number
}

export interface KakaoLatLngBounds {
  extend: (latlng: KakaoLatLng) => void
}

export interface KakaoMap {
  setCenter: (latlng: KakaoLatLng) => void
  setLevel: (level: number) => void
  setBounds: (bounds: KakaoLatLngBounds) => void
  getCenter: () => KakaoLatLng
  panTo: (latlng: KakaoLatLng) => void
}

export interface KakaoMarker {
  setMap: (map: KakaoMap | null) => void
  getPosition: () => KakaoLatLng
}

export interface KakaoInfoWindow {
  open: (map: KakaoMap, marker: KakaoMarker) => void
  close: () => void
}

export interface KakaoPlaceResult {
  id: string
  place_name: string
  address_name: string
  road_address_name: string
  phone: string
  x: string // lng
  y: string // lat
  category_name: string
}

export interface KakaoPlaces {
  keywordSearch: (
    keyword: string,
    callback: (result: KakaoPlaceResult[], status: string) => void,
  ) => void
}

let sdkLoaded = false
let sdkLoading: Promise<void> | null = null

export function loadKakaoMapSDK(): Promise<void> {
  if (sdkLoaded) return Promise.resolve()
  if (sdkLoading) return sdkLoading

  sdkLoading = new Promise<void>((resolve, reject) => {
    const key = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY
    if (!key) {
      reject(new Error('NEXT_PUBLIC_KAKAO_MAP_KEY is not set'))
      return
    }

    // Check if already loaded
    if (window.kakao?.maps) {
      window.kakao.maps.load(() => {
        sdkLoaded = true
        resolve()
      })
      return
    }

    const script = document.createElement('script')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=services`
    script.onload = () => {
      window.kakao.maps.load(() => {
        sdkLoaded = true
        resolve()
      })
    }
    script.onerror = () => reject(new Error('Failed to load Kakao Maps SDK'))
    document.head.appendChild(script)
  })

  return sdkLoading
}
