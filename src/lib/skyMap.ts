// 예식 그 시각, 그 자리 위의 하늘 — 밝은 별의 위치를 계산해 둥근 별지도(천정이 가운데, 북쪽 위·동쪽 왼쪽)로 펼친다.
// 별 데이터: lib/brightStars.ts (적경·적위 J2000, 세차는 무시 — 수십 년 차이는 눈에 띄지 않는다)
import { BRIGHT_STARS } from './brightStars'

export interface SkyCity { id: string; label: string; en: string; lat: number; lon: number; tz: number; match: string[]; /** 국내 세부 도시 — 우리의 날 지역 고르기에만 */ detail?: boolean }

/** 예식장 주소 앞부분으로 찾는 국내 시·도 (대표 지점) + 해외 웨딩 도시. tz 는 표준시 (서머타임 무시) */
export const SKY_CITIES: SkyCity[] = [
  { id: 'seoul', label: '서울', en: 'SEOUL', lat: 37.5665, lon: 126.978, tz: 9, match: ['서울'] },
  { id: 'busan', label: '부산', en: 'BUSAN', lat: 35.1796, lon: 129.0756, tz: 9, match: ['부산'] },
  { id: 'daegu', label: '대구', en: 'DAEGU', lat: 35.8714, lon: 128.6014, tz: 9, match: ['대구'] },
  { id: 'incheon', label: '인천', en: 'INCHEON', lat: 37.4563, lon: 126.7052, tz: 9, match: ['인천'] },
  { id: 'gwangju', label: '광주', en: 'GWANGJU', lat: 35.1595, lon: 126.8526, tz: 9, match: ['광주'] },
  { id: 'daejeon', label: '대전', en: 'DAEJEON', lat: 36.3504, lon: 127.3845, tz: 9, match: ['대전'] },
  { id: 'ulsan', label: '울산', en: 'ULSAN', lat: 35.5384, lon: 129.3114, tz: 9, match: ['울산'] },
  { id: 'sejong', label: '세종', en: 'SEJONG', lat: 36.48, lon: 127.289, tz: 9, match: ['세종'] },
  { id: 'gyeonggi', label: '경기 (수원)', en: 'GYEONGGI', lat: 37.2636, lon: 127.0286, tz: 9, match: ['경기'] },
  { id: 'gangwon', label: '강원 (춘천)', en: 'GANGWON', lat: 37.8813, lon: 127.7298, tz: 9, match: ['강원'] },
  { id: 'chungbuk', label: '충북 (청주)', en: 'CHUNGBUK', lat: 36.6424, lon: 127.489, tz: 9, match: ['충북', '충청북도'] },
  { id: 'chungnam', label: '충남 (천안)', en: 'CHUNGNAM', lat: 36.8151, lon: 127.1139, tz: 9, match: ['충남', '충청남도'] },
  { id: 'jeonbuk', label: '전북 (전주)', en: 'JEONBUK', lat: 35.8242, lon: 127.148, tz: 9, match: ['전북', '전라북도'] },
  { id: 'jeonnam', label: '전남 (목포)', en: 'JEONNAM', lat: 34.8118, lon: 126.3922, tz: 9, match: ['전남', '전라남도'] },
  { id: 'gyeongbuk', label: '경북 (포항)', en: 'GYEONGBUK', lat: 36.019, lon: 129.3435, tz: 9, match: ['경북', '경상북도'] },
  { id: 'gyeongnam', label: '경남 (창원)', en: 'GYEONGNAM', lat: 35.2279, lon: 128.6811, tz: 9, match: ['경남', '경상남도'] },
  { id: 'jeju', label: '제주', en: 'JEJU', lat: 33.4996, lon: 126.5312, tz: 9, match: ['제주'] },
  { id: 'suwon', label: '수원', en: 'SUWON', lat: 37.2636, lon: 127.0286, tz: 9, match: [], detail: true },
  { id: 'seongnam', label: '성남 (분당·판교)', en: 'SEONGNAM', lat: 37.3827, lon: 127.1189, tz: 9, match: [], detail: true },
  { id: 'goyang', label: '고양 (일산)', en: 'GOYANG', lat: 37.6584, lon: 126.832, tz: 9, match: [], detail: true },
  { id: 'yongin', label: '용인', en: 'YONGIN', lat: 37.2411, lon: 127.1776, tz: 9, match: [], detail: true },
  { id: 'paju', label: '파주', en: 'PAJU', lat: 37.7599, lon: 126.78, tz: 9, match: [], detail: true },
  { id: 'gapyeong', label: '가평', en: 'GAPYEONG', lat: 37.8315, lon: 127.5105, tz: 9, match: [], detail: true },
  { id: 'chuncheon', label: '춘천', en: 'CHUNCHEON', lat: 37.8813, lon: 127.7298, tz: 9, match: [], detail: true },
  { id: 'gangneung', label: '강릉', en: 'GANGNEUNG', lat: 37.7519, lon: 128.8761, tz: 9, match: [], detail: true },
  { id: 'sokcho', label: '속초', en: 'SOKCHO', lat: 38.207, lon: 128.5918, tz: 9, match: [], detail: true },
  { id: 'cheongju', label: '청주', en: 'CHEONGJU', lat: 36.6424, lon: 127.489, tz: 9, match: [], detail: true },
  { id: 'cheonan', label: '천안', en: 'CHEONAN', lat: 36.8151, lon: 127.1139, tz: 9, match: [], detail: true },
  { id: 'jeonju', label: '전주', en: 'JEONJU', lat: 35.8242, lon: 127.148, tz: 9, match: [], detail: true },
  { id: 'yeosu', label: '여수', en: 'YEOSU', lat: 34.7604, lon: 127.6622, tz: 9, match: [], detail: true },
  { id: 'suncheon', label: '순천', en: 'SUNCHEON', lat: 34.9506, lon: 127.4872, tz: 9, match: [], detail: true },
  { id: 'gyeongju', label: '경주', en: 'GYEONGJU', lat: 35.8562, lon: 129.2247, tz: 9, match: [], detail: true },
  { id: 'andong', label: '안동', en: 'ANDONG', lat: 36.5684, lon: 128.7294, tz: 9, match: [], detail: true },
  { id: 'pohang', label: '포항', en: 'POHANG', lat: 36.019, lon: 129.3435, tz: 9, match: [], detail: true },
  { id: 'changwon', label: '창원', en: 'CHANGWON', lat: 35.2279, lon: 128.6811, tz: 9, match: [], detail: true },
  { id: 'tongyeong', label: '통영', en: 'TONGYEONG', lat: 34.8544, lon: 128.4331, tz: 9, match: [], detail: true },
  { id: 'geoje', label: '거제', en: 'GEOJE', lat: 34.8806, lon: 128.6211, tz: 9, match: [], detail: true },
  { id: 'seogwipo', label: '서귀포', en: 'SEOGWIPO', lat: 33.2541, lon: 126.56, tz: 9, match: [], detail: true },
  { id: 'tokyo', label: '도쿄', en: 'TOKYO', lat: 35.6762, lon: 139.6503, tz: 9, match: [] },
  { id: 'osaka', label: '오사카', en: 'OSAKA', lat: 34.6937, lon: 135.5023, tz: 9, match: [] },
  { id: 'guam', label: '괌', en: 'GUAM', lat: 13.4443, lon: 144.7937, tz: 10, match: [] },
  { id: 'honolulu', label: '하와이', en: 'HAWAII', lat: 21.3069, lon: -157.8583, tz: -10, match: [] },
  { id: 'bali', label: '발리', en: 'BALI', lat: -8.4095, lon: 115.1889, tz: 8, match: [] },
  { id: 'danang', label: '다낭', en: 'DA NANG', lat: 16.0544, lon: 108.2022, tz: 7, match: [] },
  { id: 'bangkok', label: '방콕', en: 'BANGKOK', lat: 13.7563, lon: 100.5018, tz: 7, match: [] },
  { id: 'sydney', label: '시드니', en: 'SYDNEY', lat: -33.8688, lon: 151.2093, tz: 10, match: [] },
  { id: 'paris', label: '파리', en: 'PARIS', lat: 48.8566, lon: 2.3522, tz: 1, match: [] },
  { id: 'newyork', label: '뉴욕', en: 'NEW YORK', lat: 40.7128, lon: -74.006, tz: -5, match: [] },
  { id: 'la', label: 'LA', en: 'LOS ANGELES', lat: 34.0522, lon: -118.2437, tz: -8, match: [] },
  { id: 'fukuoka', label: '후쿠오카', en: 'FUKUOKA', lat: 33.5904, lon: 130.4017, tz: 9, match: [] },
  { id: 'sapporo', label: '삿포로', en: 'SAPPORO', lat: 43.0618, lon: 141.3545, tz: 9, match: [] },
  { id: 'taipei', label: '타이베이', en: 'TAIPEI', lat: 25.033, lon: 121.5654, tz: 8, match: [] },
  { id: 'hongkong', label: '홍콩', en: 'HONG KONG', lat: 22.3193, lon: 114.1694, tz: 8, match: [] },
  { id: 'singapore', label: '싱가포르', en: 'SINGAPORE', lat: 1.3521, lon: 103.8198, tz: 8, match: [] },
  { id: 'cebu', label: '세부', en: 'CEBU', lat: 10.3157, lon: 123.8854, tz: 8, match: [] },
  { id: 'london', label: '런던', en: 'LONDON', lat: 51.5072, lon: -0.1276, tz: 0, match: [] },
  { id: 'rome', label: '로마', en: 'ROME', lat: 41.9028, lon: 12.4964, tz: 1, match: [] },
  { id: 'barcelona', label: '바르셀로나', en: 'BARCELONA', lat: 41.3874, lon: 2.1686, tz: 1, match: [] },
  { id: 'prague', label: '프라하', en: 'PRAGUE', lat: 50.0755, lon: 14.4378, tz: 1, match: [] },
  { id: 'vancouver', label: '밴쿠버', en: 'VANCOUVER', lat: 49.2827, lon: -123.1207, tz: -8, match: [] },
  { id: 'melbourne', label: '멜버른', en: 'MELBOURNE', lat: -37.8136, lon: 144.9631, tz: 10, match: [] },
]

/** 고른 도시 > 예식장 주소 앞부분 > 서울 */
export function skyCity(chosen?: string, address?: string): SkyCity {
  const byId = chosen ? SKY_CITIES.find((c) => c.id === chosen) : undefined
  if (byId) return byId
  const a = (address || '').trim()
  return SKY_CITIES.find((c) => c.match.some((m) => a.startsWith(m))) || SKY_CITIES[0]
}

export interface SkyStar { x: number; y: number; mag: number }

/**
 * 그 시각 지평선 위에 있는 별들. x·y 는 반지름 1 인 원 안 좌표 (가운데 = 머리 위, 위 = 북, 왼쪽 = 동).
 * date: 'YYYY-MM-DD', time: 'HH:MM' (현지 시각)
 */
export function skyStars(date: string, time: string, city: SkyCity): SkyStar[] {
  const d = /^(\d{4})-(\d{2})-(\d{2})/.exec(date)
  if (!d) return []
  const t = /^(\d{1,2}):(\d{2})/.exec(time || '') || ['', '12', '00']
  const utc = Date.UTC(+d[1], +d[2] - 1, +d[3], +t[1], +t[2]) - city.tz * 3600000
  const jd = utc / 86400000 + 2440587.5
  const gmst = 280.46061837 + 360.98564736629 * (jd - 2451545)
  const lst = (((gmst + city.lon) % 360) + 360) % 360
  const R = Math.PI / 180
  const sinLat = Math.sin(city.lat * R), cosLat = Math.cos(city.lat * R)
  const out: SkyStar[] = []
  for (let i = 0; i < BRIGHT_STARS.length; i += 3) {
    const ra = BRIGHT_STARS[i], dec = BRIGHT_STARS[i + 1] * R, mag = BRIGHT_STARS[i + 2]
    const ha = (lst - ra) * R
    const sinDec = Math.sin(dec), cosDec = Math.cos(dec)
    const sinAlt = sinDec * sinLat + cosDec * cosLat * Math.cos(ha)
    if (sinAlt <= 0) continue                                   // 지평선 아래
    const alt = Math.asin(sinAlt)
    const az = Math.atan2(-cosDec * Math.sin(ha), sinDec * cosLat - cosDec * sinLat * Math.cos(ha))   // 북 → 동
    const r = Math.tan((Math.PI / 2 - alt) / 2)                // 스테레오 투영: 지평선이 1
    out.push({ x: -r * Math.sin(az), y: -r * Math.cos(az), mag })
  }
  return out
}

/** 37.57°N 126.98°E */
export const coordText = (c: SkyCity) =>
  `${Math.abs(c.lat).toFixed(2)}°${c.lat >= 0 ? 'N' : 'S'} ${Math.abs(c.lon).toFixed(2)}°${c.lon >= 0 ? 'E' : 'W'}`
