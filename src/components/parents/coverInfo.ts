// PARENTS C안 첫 화면(EnvelopeScreen)에 쓰는 문구 — 기존 데이터로만 구성
import { parseDateOnly } from '@/lib/dateOnly'
import { childCallName, romanizeName } from './cStyle'

type NameLike = { firstName?: string; nameEn?: string }
interface CoverSource {
  sender: { side: 'groom' | 'bride'; fatherName?: string; motherName?: string; fatherDeceased?: boolean; motherDeceased?: boolean }
  groom: NameLike
  bride: NameLike
  wedding: { date?: string; timeDisplay?: string; showDate?: boolean; showVenue?: boolean; venue?: { name?: string; hall?: string } }
  mainImage?: { url?: string }
  gallery?: { images?: (string | { url?: string })[] }
  coupleConnector?: 'and' | 'heart'
  envelope?: { headline?: string }
}

/** 영문 이름: 입력한 영문 이름 우선, 비어 있으면 한글 이름을 자동 로마자 표기 */
export function englishName(p: NameLike): string {
  const en = (p.nameEn || '').trim()
  if (en) return en
  return romanizeName((p.firstName || '').trim())
}

export function buildParentsCover(data: CoverSource) {
  const groomFirst = (data.groom.firstName || '').trim()
  const brideFirst = (data.bride.firstName || '').trim()
  const groomEn = englishName(data.groom)
  const brideEn = englishName(data.bride)
  const coverNames = groomEn && brideEn && (groomFirst || data.groom.nameEn) && (brideFirst || data.bride.nameEn)
    ? { groom: groomEn, bride: brideEn, heart: data.coupleConnector === 'heart' }
    : undefined

  const childFirst = ((data.sender.side === 'groom' ? data.groom.firstName : data.bride.firstName) || '').trim()
  const customHeadline = (data.envelope?.headline || '').trim()
  const childLine = customHeadline ? customHeadline : childFirst
    ? `저희 ${data.sender.side === 'groom' ? '아들' : '딸'} ${childCallName(childFirst)}가\n결혼합니다`
    : undefined

  const parts: string[] = []
  if (data.wedding.showDate !== false && data.wedding.date) {
    const d = parseDateOnly(data.wedding.date)
    if (!isNaN(d.getTime())) {
      const dow = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]
      const td = (data.wedding.timeDisplay || '').trim()
      const time = td && !/[A-Za-z]/.test(td) ? ` ${td}` : ''
      parts.push(`${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(d.getDate()).padStart(2, '0')} (${dow})${time}`)
    }
  }
  const venueName = (data.wedding.venue?.name || '').trim()
  if (data.wedding.showVenue !== false && venueName) parts.push(venueName)
  const dateVenueLine = parts.join(' · ') || undefined

  const firstGallery = (data.gallery?.images || [])
    .map(img => (typeof img === 'string' ? img : img?.url || ''))
    .find(u => u && u.trim() !== '')
  const coverImage = (data.mainImage?.url || '').trim() || firstGallery || undefined

  // 글자만 첫 화면 (시안 C 봉투): 2027년 1월 9일 토요일 오후 4시 / 더채플앳청담 5층 루체홀 / From. 보내는 분
  let textDateLine: string | undefined
  if (data.wedding.showDate !== false && data.wedding.date) {
    const d = parseDateOnly(data.wedding.date)
    if (!isNaN(d.getTime())) {
      const dow = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'][d.getDay()]
      const td = (data.wedding.timeDisplay || '').trim()
      const time = td && !/[A-Za-z]/.test(td) ? ` ${td}` : ''
      textDateLine = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${dow}${time}`
    }
  }
  const textVenueLine = data.wedding.showVenue !== false
    ? [data.wedding.venue?.name, data.wedding.venue?.hall].map(v => (v || '').trim()).filter(Boolean).join(' ') || undefined
    : undefined
  const fromNames = [
    { name: (data.sender.fatherName || '').trim(), deceased: data.sender.fatherDeceased },
    { name: (data.sender.motherName || '').trim(), deceased: data.sender.motherDeceased },
  ].filter(n => n.name)

  return { coverNames, childLine, dateVenueLine, coverImage, groomEn, brideEn, textDateLine, textVenueLine, fromNames }
}
