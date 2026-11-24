import type { PhoneData, PhonePerson, PhoneWidget } from './phoneTypes'

/**
 * 새 THE PHONE 청첩장 — 샘플의 디자인(테마 · 위젯 배치 · 글꼴 · 색)은 그대로 쓰고,
 * 신랑 · 신부가 직접 넣을 내용(이름 · 사진 · 글 · 날짜 · 계좌 …)만 비워서 시작한다.
 * 에디터 미리보기는 빈 칸을 샘플 내용으로 '예시' 채워 보여 주고(fillPhoneExample), 저장 · 하객 화면은 실제 값만 쓴다.
 */

const blankPerson = (p: PhonePerson): PhonePerson => ({
  ...p,
  name: '', lastName: '', firstName: '', nameEn: '', phone: '',
  fatherName: '', motherName: '',
  accounts: [], family: [],
  avatarKind: undefined, avatarEmoji: undefined, avatarPhoto: undefined, avatarCrop: undefined,
})

const blankWidget = (w: PhoneWidget): PhoneWidget => ({
  ...w,
  props: { ...w.props, text: undefined, src: undefined, crop: undefined, bgImg: undefined, bgImgCrop: undefined, items: undefined },
})

export function clearPhoneContent(d: PhoneData): PhoneData {
  return {
    ...d,
    groom: blankPerson(d.groom),
    bride: blankPerson(d.bride),
    wedding: { ...d.wedding, date: '', venue: { name: '', hall: '', address: '' } },
    gallery: { images: [] },
    meta: { ...d.meta, title: '', description: '', ogImage: '', kakaoThumbnail: '' },
    phone: {
      ...d.phone,
      wallpaper: '', wallpaperCrop: undefined,
      lockNotice: '', lockNoticeDay: '',
      lockNoticePhoto: undefined, lockNoticePhotoCrop: undefined,
      homeImage: undefined, homeImageCrop: undefined,
      story: [], memo: [], directions: [],
      albumFolders: [], screenPhotos: {},
      intro: d.phone.intro ? { groom: {}, bride: {}, metDate: undefined } : undefined,
      letters: [], letterAvatar: undefined,
      videos: [], greeting: '', giftMessage: '',
      widgets: d.phone.widgets.map(blankWidget),
    },
  }
}

const empty = (v: unknown) => v == null || v === '' || (Array.isArray(v) && v.length === 0)
const pick = <T,>(mine: T, ex: T): T => (empty(mine) ? ex : mine)

const fillPerson = (p: PhonePerson, e: PhonePerson): PhonePerson => {
  // 이름은 성 · 이름 칸 기준 — 하나라도 입력했으면 입력한 값만
  const typed = !!(p.name || p.lastName || p.firstName)
  return {
    ...p,
    name: typed ? p.name : e.name, lastName: typed ? p.lastName : e.lastName, firstName: typed ? p.firstName : e.firstName,
    nameEn: pick(p.nameEn, e.nameEn), phone: pick(p.phone, e.phone),
    fatherName: pick(p.fatherName, e.fatherName), motherName: pick(p.motherName, e.motherName),
    accounts: pick(p.accounts, e.accounts), family: pick(p.family, e.family),
    avatarKind: p.avatarKind ?? e.avatarKind, avatarEmoji: p.avatarEmoji ?? e.avatarEmoji,
    avatarPhoto: p.avatarPhoto ?? e.avatarPhoto, avatarCrop: p.avatarPhoto ? p.avatarCrop : e.avatarCrop,
  }
}

/** 빈 내용만 예시(샘플)로 채운 '미리보기용' 데이터 — 저장하지 않음 */
export function fillPhoneExample(d: PhoneData, ex: PhoneData): PhoneData {
  const exW = new Map(ex.phone.widgets.map(w => [w.id, w]))
  const v = d.wedding.venue, ev = ex.wedding.venue
  const hasVenue = !!(v.name || v.address)
  return {
    ...d,
    groom: fillPerson(d.groom, ex.groom),
    bride: fillPerson(d.bride, ex.bride),
    wedding: { ...d.wedding, date: pick(d.wedding.date, ex.wedding.date), venue: hasVenue ? v : ev },
    gallery: { images: pick(d.gallery.images, ex.gallery.images) },
    phone: {
      ...d.phone,
      wallpaper: d.phone.wallpaper || ex.phone.wallpaper,
      wallpaperCrop: d.phone.wallpaper ? d.phone.wallpaperCrop : ex.phone.wallpaperCrop,
      lockNotice: pick(d.phone.lockNotice, ex.phone.lockNotice),
      story: pick(d.phone.story, ex.phone.story),
      memo: pick(d.phone.memo, ex.phone.memo),
      directions: pick(d.phone.directions, ex.phone.directions),
      albumFolders: pick(d.phone.albumFolders, ex.phone.albumFolders),
      letters: pick(d.phone.letters, ex.phone.letters),
      videos: pick(d.phone.videos, ex.phone.videos),
      greeting: pick(d.phone.greeting, ex.phone.greeting),
      intro: {
        ...ex.phone.intro, ...d.phone.intro,
        groom: { ...ex.phone.intro?.groom, ...Object.fromEntries(Object.entries(d.phone.intro?.groom || {}).filter(([, x]) => !empty(x))) },
        bride: { ...ex.phone.intro?.bride, ...Object.fromEntries(Object.entries(d.phone.intro?.bride || {}).filter(([, x]) => !empty(x))) },
        metDate: d.phone.intro?.metDate || ex.phone.intro?.metDate,
      },
      widgets: d.phone.widgets.map(w => {
        const e = exW.get(w.id)
        if (!e) return w
        const p = w.props
        return { ...w, props: { ...p, text: p.text || e.props.text, src: p.src || e.props.src, crop: p.src ? p.crop : e.props.crop, bgImg: p.bgImg || e.props.bgImg, bgImgCrop: p.bgImg ? p.bgImgCrop : e.props.bgImgCrop, items: pick(p.items, e.props.items) } }
      }),
    },
  }
}
