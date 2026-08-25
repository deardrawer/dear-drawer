/**
 * THE SIMPLE · 폰트 옵션
 *
 * 매거진 에디터(Step2Style.tsx)의 DISPLAY_FONTS + FONT_STYLES와 동일한 목록을
 * 사용해 일관성을 유지한다.
 * - DISPLAY_FONTS: 영문 디스플레이/제목용
 * - KOREAN_FONTS: 한글 본문 + 전반 sans/serif 기본 패밀리용
 */

export interface DisplayFontOption {
  id: string
  name: string
  fontFamily: string
  sample: string
}

export interface KoreanFontOption {
  id: string
  name: string
  fontFamily: string
  sample: string
}

/**
 * 영문 디스플레이 폰트 (매거진과 동일, filmOnly 항목 제외)
 * 프로젝트 전체에서 Playfair Display · Cinzel · Montserrat · EB Garamond · Cormorant Garamond
 * · Lora · MADELikesSlab · Italiana 를 이미 로드해두고 있음.
 */
export const DISPLAY_FONTS: readonly DisplayFontOption[] = [
  { id: 'cormorant', name: 'Cormorant', fontFamily: "'Cormorant Garamond', serif", sample: 'Wedding Day' },
  { id: 'playfair', name: 'Playfair Display', fontFamily: "'Playfair Display', serif", sample: 'Wedding Day' },
  { id: 'cinzel', name: 'Cinzel', fontFamily: "'Cinzel', serif", sample: 'WEDDING DAY' },
  { id: 'montserrat', name: 'Montserrat', fontFamily: "'Montserrat', sans-serif", sample: 'Wedding Day' },
  { id: 'garamond', name: 'EB Garamond', fontFamily: "'EB Garamond', serif", sample: 'Wedding Day' },
  { id: 'lora', name: 'Lora', fontFamily: "'Lora', serif", sample: 'Wedding Day' },
  { id: 'made-slab', name: 'MADE Slab', fontFamily: "'MADELikesSlab', serif", sample: 'Wedding Day' },
  { id: 'italiana', name: 'Italiana', fontFamily: "'Italiana', serif", sample: 'Wedding Day' },
  { id: 'majesty', name: 'Majesty', fontFamily: "'Majesty', serif", sample: 'Wedding Day' },
  { id: 'britney', name: 'Britney', fontFamily: "'Britney', serif", sample: 'Wedding Day' },
  { id: 'instrument-serif', name: 'Instrument Serif', fontFamily: "var(--font-instrument-serif), serif", sample: 'Wedding Day' },
  { id: 'melodrama', name: 'Melodrama', fontFamily: "'Melodrama', serif", sample: 'Wedding Day' },
  { id: 'stardom', name: 'Stardom', fontFamily: "'Stardom', serif", sample: 'Wedding Day' },
] as const

/**
 * 한글 폰트 (매거진 FONT_STYLES와 동일)
 * globals.css 상단에서 @font-face로 모두 로드 중.
 */
export const KOREAN_FONTS: readonly KoreanFontOption[] = [
  { id: 'modern', name: '프리텐다드', fontFamily: "'Pretendard', sans-serif", sample: '우리 결혼합니다' },
  { id: 'classic', name: '리디바탕', fontFamily: "'Ridibatang', serif", sample: '우리 결혼합니다' },
  { id: 'romantic', name: '오케이티콘', fontFamily: "'Okticon', serif", sample: '우리 결혼합니다' },
  { id: 'contemporary', name: '전남교육바른', fontFamily: "'JeonnamEducationBarun', sans-serif", sample: '우리 결혼합니다' },
  { id: 'luxury', name: '이랜드초이스', fontFamily: "'ELandChoice', serif", sample: '우리 결혼합니다' },
  { id: 'gulim', name: '조선굴림', fontFamily: "'JoseonGulim', serif", sample: '우리 결혼합니다' },
  { id: 'adulthand', name: '강원교육모두', fontFamily: "'GangwonEducationModuche', sans-serif", sample: '우리 결혼합니다' },
  { id: 'neathand', name: '오무다예', fontFamily: "'OmuDaye', sans-serif", sample: '우리 결혼합니다' },
  { id: 'roundhand', name: '온글잎 콘콘', fontFamily: "'OngleipKonkon', sans-serif", sample: '우리 결혼합니다' },
  { id: 'roundgothic', name: '나눔스퀘어라운드', fontFamily: "'NanumSquareRound', sans-serif", sample: '우리 결혼합니다' },
  { id: 'suit', name: 'SUIT', fontFamily: "'Suit', sans-serif", sample: '우리 결혼합니다' },
  { id: 'myungjo', name: '조선일보명조', fontFamily: "'ChosunIlboMyungjo', serif", sample: '우리 결혼합니다' },
] as const

export const DEFAULT_DISPLAY_FONT_ID = 'lora'
export const DEFAULT_KOREAN_FONT_ID = 'modern'

/**
 * 중국어(CJK) 전용 폰트 패밀리.
 * 폰트 스택 맨 앞에 두면 unicode-range(globals.css @font-face 'NotoSansSC-zh')에 의해
 * CJK 문자만 이 폰트로 렌더링되고, 한글/영문은 뒤따르는 기존 선택 폰트를 그대로 사용한다.
 * 기존 한글 폰트에 중국어 글리프가 있어도 중국어는 항상 Noto Sans SC로 통일된다.
 */
export const CJK_FONT_FAMILY = "'NotoSansSC-zh'"

/**
 * 중국어(한자) 포함 여부 — Unicode 기반 공통 순수 함수.
 * CJK Unified Ideographs + Ext A + Compatibility Ideographs.
 * (렌더링은 CSS unicode-range가 자동 처리하므로 필수는 아니며, 조건 분기용 공통 유틸)
 */
export function containsChinese(text: string): boolean {
  return /[㐀-䶿一-鿿豈-﫿]/.test(text)
}

export function resolveDisplayFontFamily(id: string | undefined): string {
  const found = DISPLAY_FONTS.find((f) => f.id === id)
  return `${CJK_FONT_FAMILY}, ${found?.fontFamily ?? DISPLAY_FONTS[0].fontFamily}`
}

export function resolveKoreanFontFamily(id: string | undefined): string {
  const found = KOREAN_FONTS.find((f) => f.id === id)
  return `${CJK_FONT_FAMILY}, ${found?.fontFamily ?? KOREAN_FONTS[0].fontFamily}`
}
