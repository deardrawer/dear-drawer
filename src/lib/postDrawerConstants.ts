/** 서버 의존성이 없는 POST DRAWER 상수 — 클라이언트 컴포넌트에서도 안전하게 import.
 * (postDrawer.ts는 D1(getDB)를 import하므로 클라이언트에서 직접 import 불가) */

/** 우표 '결혼식 한 조각' 최대 글자수. PRD Open Decision이라 상수로 분리(시안 80자). */
export const STAMP_MESSAGE_MAX = 80

/** 입력칸 예시(placeholder) — 시작·다짐 톤. */
export const STAMP_MESSAGE_PLACEHOLDER = '예) 새로운 시작 앞에서, 두 사람 나란히.'

/**
 * '결혼식 한 조각'을 남기지 않은 공개 우표에 대신 얹는 사랑 문구 풀.
 * 우표마다 다르게(결정론적으로) 골라 컬렉션이 비어 보이지 않게 한다.
 */
export const LOVE_FRAGMENTS: string[] = [
  '사랑은, 오래 곁에 머무는 일.',
  '두 사람의 계절이 시작되었어요.',
  '함께라서 평범한 날도 특별해졌어요.',
  '오래 서로의 편이 되기로 했어요.',
  '같은 곳을 바라보며 걸어가요.',
  '매일이 조금씩 더 다정해지기를.',
  '설렘이 익숙함이 되어도, 사랑은 그대로.',
  '손을 맞잡은 채로, 먼 길을 함께.',
  '우리라는 이름으로 맞는 첫 계절.',
  '가장 따뜻한 사람이 되어줄게요.',
  '서로에게 오래 머무를 사람.',
  '사랑한다는 말보다 오래 남을 하루.',
]

/** seed(예: 예식일)로 사랑 문구를 결정론적으로 선택 — 같은 우표는 항상 같은 문구. */
export function pickLoveFragment(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  return LOVE_FRAGMENTS[Math.abs(h) % LOVE_FRAGMENTS.length]
}
