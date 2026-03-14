// Kakao Maps SDK TypeScript declarations & loader for Geunnal
// Window.kakao base type is declared in src/types/kakao.ts
// We use 'any' casts for extended properties (LatLngBounds, event, Places) not in the base type

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
    const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY
    if (!key) {
      reject(new Error('NEXT_PUBLIC_KAKAO_JS_KEY is not set'))
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any

    // Check if already loaded
    if (win.kakao?.maps) {
      win.kakao.maps.load(() => {
        sdkLoaded = true
        resolve()
      })
      return
    }

    const script = document.createElement('script')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=services`
    script.onload = () => {
      win.kakao.maps.load(() => {
        sdkLoaded = true
        resolve()
      })
    }
    script.onerror = () => reject(new Error('Failed to load Kakao Maps SDK'))
    document.head.appendChild(script)
  })

  return sdkLoading
}
