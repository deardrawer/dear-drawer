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

// Check if kakao.maps is fully initialized (LatLng exists only after load() completes)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isMapsReady(): boolean {
  const win = window as any
  return !!(win.kakao?.maps?.LatLng)
}

export function loadKakaoMapSDK(): Promise<void> {
  // If SDK is already fully initialized (handles HMR where module vars reset)
  if (sdkLoaded || isMapsReady()) {
    sdkLoaded = true
    return Promise.resolve()
  }
  if (sdkLoading) return sdkLoading

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = window as any

  sdkLoading = new Promise<void>((resolve, reject) => {
    const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY || '0890847927f3189d845391481ead8ecc'

    // kakao.maps exists but not yet initialized — call load()
    if (win.kakao?.maps?.load) {
      win.kakao.maps.load(() => {
        sdkLoaded = true
        resolve()
      })
      return
    }

    // Check if script tag already exists (avoid duplicate loading)
    const existing = document.querySelector('script[src*="dapi.kakao.com/v2/maps"]')
    if (existing) {
      // Script exists but maps not ready - wait for it
      let settled = false
      const checkInterval = setInterval(() => {
        if (isMapsReady()) {
          clearInterval(checkInterval)
          clearTimeout(timeoutId)
          settled = true
          sdkLoaded = true
          resolve()
        } else if (win.kakao?.maps?.load) {
          clearInterval(checkInterval)
          clearTimeout(timeoutId)
          settled = true
          win.kakao.maps.load(() => {
            sdkLoaded = true
            resolve()
          })
        }
      }, 100)
      const timeoutId = setTimeout(() => {
        if (!settled) {
          clearInterval(checkInterval)
          reject(new Error('Kakao Maps SDK load timeout'))
        }
      }, 10000)
      return
    }

    const script = document.createElement('script')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=services`
    script.onload = () => {
      if (win.kakao?.maps?.load) {
        win.kakao.maps.load(() => {
          sdkLoaded = true
          resolve()
        })
      } else {
        reject(new Error('Kakao Maps SDK loaded but kakao.maps not available'))
      }
    }
    script.onerror = () => {
      sdkLoading = null // Reset so it can be retried
      reject(new Error('Failed to load Kakao Maps SDK'))
    }
    document.head.appendChild(script)
  })

  sdkLoading.catch(() => {
    sdkLoading = null // Reset on failure so next call retries
  })

  return sdkLoading
}
