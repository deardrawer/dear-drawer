// THE CLASSIC 간지 섹션 키 — 사진 간지·글 간지를 각각 최대 3개까지, 하나씩 섹션 순서에 따로 놓는다.
// 첫 번째 키는 예전부터 쓰던 키를 그대로 써서(사진 간지 = 'interstitials', 글 간지 = 'textInterstitials')
// 기존 청첩장에 저장된 섹션 순서·숨김·틴티드 설정이 사진 간지 1 / 글 간지 1에 그대로 이어진다.

export const INTER_MAX = 3
export const PHOTO_INTER_KEYS = ['interstitials', 'interstitials2', 'interstitials3'] as const
export const TEXT_INTER_KEYS = ['textInterstitials', 'textInterstitials2', 'textInterstitials3'] as const
// 순서에 아직 없는 간지는 이 순서상 바로 앞 간지 뒤에 둔다 (사진 1→2→3 → 글 1→2→3)
export const INTER_SEQ: readonly string[] = [...PHOTO_INTER_KEYS, ...TEXT_INTER_KEYS]

/** 섹션 순서에 없는 간지 키가 따라붙을 키: 바로 앞 간지를 거슬러 올라가 순서에 있는 첫 키 (끝은 항상 'interstitials') */
export function interAnchor(key: string, inOrder: (k: string) => boolean): string {
  let k = key
  while (!inOrder(k) && INTER_SEQ.includes(k) && k !== PHOTO_INTER_KEYS[0]) k = INTER_SEQ[INTER_SEQ.indexOf(k) - 1]
  return k
}

/** 섹션 이름 (섹션 순서 목록용) */
export function interLabel(key: string): string | null {
  const p = (PHOTO_INTER_KEYS as readonly string[]).indexOf(key)
  if (p >= 0) return `사진 간지 ${p + 1}`
  const t = (TEXT_INTER_KEYS as readonly string[]).indexOf(key)
  if (t >= 0) return `글 간지 ${t + 1}`
  return null
}

/**
 * 간지 하나를 지웠을 때 섹션 순서·숨김·틴티드 설정을 한 칸씩 당긴다.
 * 지운 간지의 자리는 없애고, 뒤 간지들은 번호만 하나씩 앞당겨 원래 자리·설정을 그대로 유지한다.
 */
export function shiftInterKeysAfterRemove(
  keys: readonly string[],
  removed: number,
  state: { order?: string[]; hidden?: string[]; bgMap?: Record<string, string> },
): { order?: string[]; hidden?: string[]; bgMap?: Record<string, string> } {
  const gone = keys[removed]
  const rename = (k: string) => {
    const i = keys.indexOf(k)
    return i > removed ? keys[i - 1] : k
  }
  const order = state.order ? state.order.filter((k) => k !== gone).map(rename) : undefined
  const hidden = state.hidden ? state.hidden.filter((k) => k !== gone).map(rename) : undefined
  let bgMap: Record<string, string> | undefined
  if (state.bgMap) {
    bgMap = {}
    for (const [k, v] of Object.entries(state.bgMap)) if (k !== gone) bgMap[rename(k)] = v
  }
  return { order, hidden, bgMap }
}
