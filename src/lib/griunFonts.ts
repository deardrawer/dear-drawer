// 그리운(griun.co.kr) 무료 손글씨 폰트 — THE CLASSIC 글 간지 글꼴 선택용
// 상업적 이용 가능 · 폰트 파일 개작/수정/판매 금지 → 그리운이 배포하는 공식 woff2 를 그대로 /fonts/Griun 에 둔다 (변환·서브셋 없음)
// @font-face 는 src/app/fonts.css. 브라우저는 그 글꼴로 그리는 글자가 화면에 있을 때만 파일을 받는다.

// family 는 글꼴 이름만 (뒤에 대체 글꼴을 붙여 쓴다 — 2,780자 글꼴에 없는 글자는 그 대체 글꼴로)
export type GriunFont = { id: string; name: string; family: string; full: boolean }

export const GRIUN_FONTS: GriunFont[] = [
  { id: 'griun-myoeunheullim', name: '그리운 묘은흘림체', family: "'GriunMyoeunHeullim'", full: true },
  { id: 'griun-perfume', name: '그리운 향기체', family: "'GriunPerfume'", full: false },
  { id: 'griun-everydayjeong', name: '그리운 정매일체', family: "'GriunEverydayJeong'", full: false },
  { id: 'griun-hangeulmin', name: '그리운X국한박 민', family: "'GriunHangeulMin'", full: false },
  { id: 'griun-hangeulgowoon', name: '그리운X국한박 고운', family: "'GriunHangeulGowoon'", full: false },
  { id: 'griun-polfairness', name: '그리운 경찰공평체', family: "'GriunPolFairness'", full: false },
  { id: 'griun-semfafa', name: '그리운 셈빠성희체', family: "'GriunSemfafa'", full: false },
  { id: 'griun-polhumanrights', name: '그리운 경찰인권체', family: "'GriunPolHumanrights'", full: false },
]

// 2,780자 폰트(위 full:false 7종)가 가진 한글 음절 — 가(U+AC00)부터 11,172칸 비트맵 (7종 모두 같은 글자 구성)
const KS2780_BITS = 'kw//PhmwAxMBKBARIACTBX8+EbADl4G7EhGgAZOVazJRsAcRBTIwEbACEQErMHm4DhMBMBAAgAETASsQETAAk4erGgEAApMFe3RRsCOTATtwMAAAEQAAcBGwKxMAKRARgCMBAAAwHbAuEwEwMAEAAxEBIxAAAAATgesQEQADEwETEBEwAAEBEDBVuCIRAAAwEbADlwf7OhmwA5MBKxAAAACbDzs8GbBDkwEzEQEAAhMHKx4RIAEBABAwEbACEwErMDmwIgEAEBAAAAARAQMwGDACkwfrHBGQApMFa3X5uK8TAXsQAQACAAAAcNmwyhMBOxARAAMRAAAwWbEqEQEAEACAAREBOxAAAACTBSsQAAABAQAiEBGgAxEBITD5sAIRAQAwGbBPlwE7OBGwAwAAABABEAITDTs4EbADAQAQAAAAABMBKzARAIABABAQAQAAAAAAMJGYAgEAABAAAAARATMQAAAAkwlrGBEwABMBKzAZsMeTATs1AaACEQAAMB2wgxMBOzAZsAMRAAowGbACEwAgEAAAAREBKxARoAITASsQAQABEQAAMBGQAhMBKzARsOYRAAAwEbBD0xf7PhmwLxMBIQAAAAATBXs4GbALkwG4EAEAAJsHKxABAAMBABAQEbACEQEKcHmwohEBOhAAAAAVAQoQEZACEwErEAEgApMFu/L5uCuXATsyAbACAAAAMFmwp5MBOzARsCsRAABw+bACEQA4EAAAARMBExABEACTBzs2ESARAQIAMBEgAhEBKzAxsAIDASAwWbAPkwc7eBGwAxMAAQAAAACTAzkQAQACEwA7AAAAABMBKwAAAAAAAAAQAAAAAwAgMDGwAgAAAAAAAAABAAAQAAACEQEjAAAAABMBK7B5sGOTATswEbBCEwEh8NmwQ5MBOzIRsAMTASNwWbAiEwEgEBGQAREBOzARsEKTAasWAAABEwEhMBGwAhMBKTA5tAIDAAAwObhLmwEzOBEwAwMAIAAAAAATBTM0ERAAEQAgEAEAAJcFIzARAAkBABAQETABAQAgMBEwAgEAERABEAARAAAQAAACE4ULEBEQABsBuzD/uHMTATswkbCjEQEyMH/w1xMBO3DR8OORATtw+bkKE0E7MQGwAxMBOzARsAKTB68wEbADEwErMBGwAxMBq3CZ9P4RATswebh30wV7MBGwA1MBIRARIACXD3swEbACEwU7EAAAABMF6zgRoEIRADAwEbACEwAgMHGwAgEAEBAAAAATAQswERACEwUrEAAAAJMF+zadsAcTATsQARACAQAAMBGwAwEBIBAAAAEAAAAwGbAOEwEQEAAAAREBgzAEAAITASsQAAADAQAIEAAAAAEAIDAAkAIAAAAwGbDGUwH7MBGwA1EBIQAAAAATATswEbAGEQAyEAEAAhMBKzgRIAIBAAAQEbACAQABMBGwAgEAEDARAAARASswERACEwMrEAAAAJMHezEZsAITATsxAQASAAAAMBmwIxMBOxMRsAMBAAAwGbACEwEpEAAAAgEBABABAAATASswERACEQEgMBGwAhEBATAVMBIBAAAwEbADkwM7MBGwAwEAIBAAAAATDTswEbBCEQEYEAEAAJMBKxQBAAABAAAQCYACAQAgMFGwAgEAEBAAgAATASMQERACkwUrEhEwABMBK3BbsDOTATswAAAgAAAAMBGwQxMBKzARMAMRAQowEbAiAwAgAAAAABEAABARoACTBSsQAAACAAAAEBGQABEBKRARsAIBACAwEbADEzErORmwixEAKBAAAAEThSs7EbCDEwE7EBEgABMhKzIRoAMTACgwEaACEQEqMDG7AhEBITARAAITASswEZAC0yMrEhEwAhMBOwg='

let ksBits: Uint8Array | null = null
function hasKs(code: number): boolean {
  if (!ksBits) {
    const bin = typeof atob === 'function' ? atob(KS2780_BITS) : Buffer.from(KS2780_BITS, 'base64').toString('binary')
    ksBits = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) ksBits[i] = bin.charCodeAt(i)
  }
  const i = code - 0xac00
  return (ksBits[i >> 3] & (1 << (i & 7))) !== 0
}

/** 그 글꼴에 없는 한글 글자 (중복 없이). 한글 전체를 갖춘 글꼴이거나 그리운 글꼴이 아니면 빈 배열 */
export function griunMissingChars(fontId: string | undefined, text: string): string[] {
  const f = GRIUN_FONTS.find((x) => x.id === fontId)
  if (!f || f.full) return []
  const miss = new Set<string>()
  for (const ch of text) {
    const c = ch.codePointAt(0) || 0
    if (c >= 0xac00 && c <= 0xd7a3 && !hasKs(c)) miss.add(ch)
  }
  return [...miss]
}
