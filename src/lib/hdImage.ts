// 갤러리 고화질 확대용 사진 주소 규칙
// - 일반 업로드: {imageId}_web.webp (긴 변 2048px)
// - '고화질로 다시 올리기': {imageId}_hqweb.webp (화면용, 일반과 같은 크기) + {imageId}_full.webp (확대용, 긴 변 4000px)
//   → 화면에는 _hqweb 을 쓰고, 확대할 때만 같은 이름의 _full 을 불러온다
// 주소 뒤에 표시(?hq 등)를 붙이지 않고 파일 이름으로 구분 → 공유 미리보기·카카오 썸네일 등 다른 곳에 영향 없음

const HQ_WEB_RE = /_hqweb\.webp$/
const FULL_RE = /_full\.webp$/

/** 확대할 때 불러올 고화질 주소. 고화질로 올린 사진이 아니면 undefined (이미 _full 주소면 그대로) */
export function hdSrcOf(url?: string | null): string | undefined {
  if (!url) return undefined
  const clean = url.split(/[?#]/)[0]
  if (FULL_RE.test(clean)) return clean
  return HQ_WEB_RE.test(clean) ? clean.replace(HQ_WEB_RE, '_full.webp') : undefined
}

/** 고화질로 올린 사진인지 */
export const isHdImage = (url?: string | null) => !!hdSrcOf(url)
