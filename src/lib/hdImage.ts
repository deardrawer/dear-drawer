// 갤러리 고화질 확대용 사진 주소 규칙
// - 일반 업로드: {imageId}_web.webp (긴 변 2048px)
// - '고화질로 다시 올리기': {imageId}_hqweb.webp (화면용, 일반과 같은 크기) + {imageId}_full.webp (확대용, 긴 변 4000px)
//   → 화면에는 _hqweb 을 쓰고, 확대할 때만 같은 이름의 _full 을 불러온다
// - '고화질 해제': 다시 올리지 않고 주소 끝에 ?sd=1 → 고화질 파일은 남겨 두고 일반 사진처럼(최대 2.5배). 다시 켜면 ?sd=1 만 뺀다
// 주소 뒤 표시는 해제(sd)에만 쓰고, 고화질 여부는 파일 이름으로 구분 → 공유 미리보기·카카오 썸네일 등에 영향 없음

const HQ_WEB_RE = /_hqweb\.webp$/
const FULL_RE = /_full\.webp$/
const SD_RE = /[?&]sd=1(&|$)/

const pathOf = (url: string) => url.split(/[?#]/)[0]

/** 확대할 때 불러올 고화질 주소. 고화질 사진이 아니거나 고화질을 해제했으면 undefined (이미 _full 주소면 그대로) */
export function hdSrcOf(url?: string | null): string | undefined {
  if (!url || SD_RE.test(url)) return undefined
  const clean = pathOf(url)
  if (FULL_RE.test(clean)) return clean
  return HQ_WEB_RE.test(clean) ? clean.replace(HQ_WEB_RE, '_full.webp') : undefined
}

/** 고화질 확대가 켜진 사진인지 (고화질로 올렸고 해제하지 않음) */
export const isHdImage = (url?: string | null) => !!hdSrcOf(url)

/** 고화질로 올린 사진인지 (해제 여부와 상관없이) — '고화질 해제/다시 켜기' 표시용 */
export const isHdUpload = (url?: string | null) => !!url && HQ_WEB_RE.test(pathOf(url))

/** 고화질 켜기/해제: 해제는 주소 끝에 ?sd=1, 켜기는 그 표시만 뺀다 */
export function setHdActive(url: string, on: boolean): string {
  const [rest, hash = ''] = url.split('#')
  const [path, query = ''] = rest.split('?')
  const params = query.split('&').filter((p) => p && p !== 'sd=1')
  if (!on) params.push('sd=1')
  return path + (params.length ? `?${params.join('&')}` : '') + (hash ? `#${hash}` : '')
}
