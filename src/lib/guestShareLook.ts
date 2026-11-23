/**
 * 하객 사진 공유 페이지의 '얼굴' — 대표 청첩장에서 커버 사진 · 이름 · 날짜 · 예식장을 뽑는다.
 * (서버 · 클라이언트 공용, DB 호출 없음)
 */
import type { Invitation } from '@/types/invitation'
import { daysSinceWeddingKST } from '@/lib/weddingLifecycle'

/** 업로드 창 — 예식 당일(0일)부터 예식 후 이 날수까지 (/photo 페이지 · 세션 API 와 같은 값) */
export const GUEST_SHARE_OPEN_DAYS = 10

export interface ShareLook {
  cover: string
  /** 커버 사진 세로 위치 (0 위 ~ 100 아래) */
  coverY: number
  /** 커버 사진 자르기 (있으면 위치보다 우선) */
  coverCrop?: { cropX: number; cropY: number; cropWidth: number; cropHeight: number } | null
  /** 영문 이름 둘 다 있으면 'Jihoon & Seoyeon' 식, 없으면 null (한글 이름을 씀) */
  nameEn: string | null
  groomKo: string
  brideKo: string
  /** '2027. 05. 22 SAT · 더채플앳청담' */
  meta: string
  /** 예식일 기준 경과일 (없으면 null) */
  since: number | null
  /** 업로드 마감까지 남은 날 (열려 있을 때만) */
  daysLeft: number | null
  /** 영문 이름이 둘 다 있는지 (에디터에서 '영문' 고를 수 있는지) */
  hasEn: boolean
  /** 미리보기용 — 청첩장 사진 몇 장 */
  samples: string[]
}

const url = (img: unknown): string => {
  if (!img) return ''
  if (typeof img === 'string') return img
  if (typeof img === 'object' && img !== null) {
    const o = img as { url?: string; webUrl?: string; src?: string }
    return o.webUrl || o.url || o.src || ''
  }
  return ''
}
/** 성 뺀 이름 — '한지훈' → '지훈' (두 글자 이름은 그대로) */
const given = (full: string) => (full.length >= 3 ? full.slice(1) : full)
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Content = any

export function buildShareLook(inv: Invitation | null, fallbackDate?: string | null, coverOverride?: string | null, nameStyle?: 'en' | 'ko' | null, coverY?: number | null, coverCrop?: ShareLook['coverCrop']): ShareLook {
  let c: Content = {}
  try { c = inv?.content ? (typeof inv.content === 'string' ? JSON.parse(inv.content) : inv.content) : {} } catch { c = {} }

  // 커버 — 청첩장 대표 사진 (공유 미리보기와 같은 우선순위에서 OG 전용 이미지는 뺌)
  const galleryImgs: string[] = []
  if (Array.isArray(c?.gallery?.images)) for (const g of c.gallery.images) { const u = url(g); if (u) galleryImgs.push(u) }
  if (c?.galleries && typeof c.galleries === 'object') {
    for (const k of Object.keys(c.galleries)) {
      const arr = c.galleries[k]
      if (Array.isArray(arr)) for (const g of arr) { const u = url(g); if (u) galleryImgs.push(u) }
    }
  }
  const cover = coverOverride ||
    url(c?.phone?.wallpaper) || url(c?.media?.coverImage) || url(c?.heroImage) || url(c?.mainImage) ||
    url(c?.sections?.intro?.photo) || url(inv?.main_image) || galleryImgs[0] || url(c?.meta?.ogImage) || ''

  const groomFull = String(c?.groom?.name || inv?.groom_name || '').trim()
  const brideFull = String(c?.bride?.name || inv?.bride_name || '').trim()
  const gEn = String(c?.groom?.nameEn || c?.groom?.englishName || '').trim()
  const bEn = String(c?.bride?.nameEn || c?.bride?.englishName || '').trim()

  // 예식일 — DB 열 우선 (세션 API 의 업로드 창 계산과 같은 값)
  const date = String(inv?.wedding_date || c?.wedding?.date || fallbackDate || '').slice(0, 10)
  const venue = String(c?.wedding?.venue?.name || inv?.venue_name || '').trim()
  let dateText = ''
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) {
    const d = new Date(`${date}T12:00:00+09:00`)
    dateText = `${m[1]}. ${m[2]}. ${m[3]} ${DAYS[d.getUTCDay()]}`
  }
  const since = daysSinceWeddingKST(date || null)
  return {
    cover,
    coverY: typeof coverY === 'number' ? coverY : 22,
    coverCrop: coverCrop || null,
    // 이름 표기 — '한글'을 고르면 한글, 아니면 영문 이름이 둘 다 있을 때 영문
    nameEn: nameStyle !== 'ko' && gEn && bEn ? `${gEn} & ${bEn}` : null,
    hasEn: !!(gEn && bEn),
    groomKo: given(groomFull) || '신랑',
    brideKo: given(brideFull) || '신부',
    meta: [dateText, venue].filter(Boolean).join(' · '),
    since,
    daysLeft: since !== null && since >= 0 && since <= GUEST_SHARE_OPEN_DAYS ? GUEST_SHARE_OPEN_DAYS - since : null,
    samples: galleryImgs.filter(u => u !== cover).slice(0, 8),
  }
}
