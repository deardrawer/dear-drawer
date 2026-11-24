'use client'

/**
 * THE PHONE 에디터 — 폰 화면이 곧 편집 캔버스.
 * 왼쪽: 화면 고르기 · 위젯 추가 / 가운데: 폰 화면(눌러서 고르고 끌어서 옮김) / 오른쪽: 고른 위젯·화면 설정
 * 미감은 격자·정해진 크기·테마가 지키고, 커플은 '무엇을, 어디에'만 정한다.
 */
import { Suspense, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { uploadImage } from '@/lib/imageUpload'
import type { PhoneSearchItem } from '@/components/invitation/phone/phoneTypes'
import CoupleGuestSharePanel, { type CoupleShareStatus } from '@/components/editor/CoupleGuestSharePanel'
import { AppGlyph, AppView, DdayPhonePopup, LetterPreviewCtx, MEMO_COLORS, HomeScreen, LockScreen, PasscodeScreen, PhoneFlow, PhotoShareCtx, ReturnCtx, WidgetView, type HomeEditing } from '@/components/invitation/phone/PhoneScreens'
import {
  ACCENT_OPTIONS, HOME_PAGES_MAX, homePagesOf, KR_FONTS, FOLDER_DEFAULT_APPS, defaultSearchItems, youtubeId, ALBUM_FOLDERS_MAX, ALBUM_MAX, APP_META, isAppOff, isEmptyApp, reachableApps, dockOf, DOCK_MAX, POSTER_PHOTO_H, SCREEN_DEFAULTS, GIFT_TITLE, GIFT_MESSAGE, BAR_COLOR_OPTIONS, CARD_COLOR_OPTIONS, HOME_BG_OPTIONS, HOME_PRESETS, LOCK_BG_OPTIONS, isDark, themeOf, GRID, NUMBER_FONTS, PHONE_H, PHONE_THEMES, PHONE_W, SIZE_LABEL, SIZE_SPAN, TITLE_FONTS, WIDGET_CATALOG,
  LETTERS_MAX, LETTER_PHOTOS_MAX, LETTER_KINDS, LETTER_HANDS, LETTER_PAPERS, letterHandOf, lettersOf, type PhoneLetter, type PhoneLetterKind,
  cellX, cellY, spanH, spanW, createDefaultPhoneData, fits, nearestFit, newWidgetId, normalizePhoneData, widgetMeta, variantHidden, firstVariant, placeWithReflow,
  type PhoneAppId, type PhoneAvatarFields, type PhoneData, type PhoneFamily, type PhoneLockStyle, type PhoneNumberFont, type PhoneScreenId, type PhoneTitleFont, type PhoneWidget, type WidgetSize, type WidgetType,
} from '@/components/invitation/phone/phoneTypes'
import { PHONE_FONT_VARS } from '@/components/invitation/phone/phoneFonts'
import InlineCropEditor from '@/components/editor/InlineCropEditor'
import ShareModal from '@/components/share/ShareModal'
import { clearPhoneContent, fillPhoneExample } from '@/components/invitation/phone/phoneExample'
import { Check, ChevronDown, ChevronRight, ChevronUp, Copy, Eye, History, LayoutGrid, Link2, Pencil, Play, Plus, Share2, SlidersHorizontal, SquareStack, Star, Trash2, X } from 'lucide-react'
import { bgmPresets, getBgmPresetByUrl } from '@/lib/bgmPresets'
import SharedRsvpLinkField from '@/components/editor/SharedRsvpLinkField'
import RsvpForm from '@/components/invitation/RsvpForm'
import { DEFAULT_DDAY_POPUP } from '@/lib/ddayPopupTypes'
import { normalizeRsvpSettings } from '@/lib/rsvpSettings'
import CroppedImageDiv from '@/components/ui/CroppedImageDiv'
import type { PhoneImageSettings } from '@/components/invitation/phone/phoneTypes'

/** 사진을 올리면 뜨는 크롭 창 — 왼쪽에서 맞추고 오른쪽 폰 화면에서 바로 확인 */
function CropModal({ title, src, crop, aspect, onChange, onClose, preview }: {
  title: string; src: string; crop?: PhoneImageSettings; aspect: number
  onChange: (c: PhoneImageSettings) => void; onClose: () => void; preview: ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  const PV = 0.44
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(28,26,24,0.55)' }} onClick={onClose}>
      <div className="theme-neu rounded-2xl shadow-2xl w-full max-w-[640px] p-5 sm:p-6" style={{ background: '#FBF9F6' }} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold" style={{ color: 'var(--ed-text)' }}>{title}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="닫기" className="w-8 h-8 rounded-full hover:bg-black/5 text-lg leading-none" style={{ color: 'var(--ed-text-muted)' }}><X size={16} className="mx-auto" aria-hidden /></button>
        </div>
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start justify-center">
          <div className="shrink-0">
            <InlineCropEditor imageUrl={src} settings={crop || { scale: 1, positionX: 0, positionY: 0 }} onUpdate={c => onChange({ ...(crop || {}), ...c })} aspectRatio={aspect} containerWidth={280} />
          </div>
          <div className="shrink-0 flex flex-col items-center gap-2">
            <div style={{ width: PHONE_W * PV, height: PHONE_H * PV, borderRadius: 20, overflow: 'hidden', boxShadow: '0 0 0 5px #1C1A18' }}>
              <div style={{ width: PHONE_W, height: PHONE_H, transform: `scale(${PV})`, transformOrigin: '0 0', position: 'relative', pointerEvents: 'none' }}>{preview}</div>
            </div>
            <span className="text-[11px]" style={{ color: 'var(--ed-text-muted)' }}>미리보기</span>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="px-5 py-2 rounded-lg text-sm text-[#F5F0ED]" style={{ background: 'var(--ed-accent)' }}>완료</button>
        </div>
      </div>
    </div>
  )
}

const LOCK_STYLES: { id: PhoneLockStyle; label: string; desc: string }[] = [
  { id: 'photo', label: '사진 · 컬러', desc: '사진을 넣으면 사진 배경, 없으면 고른 색 바탕' },
  { id: 'poster', label: '포스터', desc: '큰 시계, 아래에서 올라오는 사진' },
]


/** 컬러 스타일 — SNS 분위기 시안(promo-moods)의 색 조합을 한 번에 (잠금화면 · 홈 화면 색만, 사진 · 글꼴은 그대로) */
type ColorMood = { id: string; label: string; bg: string; card: string; bar: string; accent: string; clock: string; text: string; glass?: boolean }
const COLOR_MOODS: ColorMood[] = [
  { id: 'butter', label: '버터크림', bg: '#F6F1E7', card: '#FFFDF8', bar: '#EFE7D8', accent: '#A8875A', clock: '#8A6A42', text: '#6E5536' },
  { id: 'sage', label: '세이지', bg: '#E9EDE4', card: '#FFFFFF', bar: '#DDE3D6', accent: '#7D8F73', clock: '#5E7056', text: '#4E5E47' },
  { id: 'blue', label: '더스티블루', bg: '#E7ECF1', card: '#FFFFFF', bar: '#DAE1E8', accent: '#5D7389', clock: '#5D7389', text: '#4A5D70' },
  { id: 'terra', label: '테라코타', bg: '#F3E9E1', card: '#FFFFFF', bar: '#EADBCF', accent: '#B5654A', clock: '#9A5038', text: '#7E4330' },
  { id: 'olive', label: '올리브', bg: '#EEEDE4', card: '#FFFFFF', bar: '#E2E0D3', accent: '#6B6F4E', clock: '#55593D', text: '#4A4D35' },
  { id: 'burgundy', label: '버건디', bg: '#F4ECE9', card: '#FFFFFF', bar: '#EADCD8', accent: '#7A2E35', clock: '#7A2E35', text: '#5E2429' },
  { id: 'charcoal', label: '모노차콜', bg: '#F4F3F0', card: '#FFFFFF', bar: '#E6E4E0', accent: '#2B2B2B', clock: '#2B2B2B', text: '#3A3A3A' },
  { id: 'midnight', label: '미드나잇', bg: '#15171C', card: '#23262D', bar: '#1E2026', accent: '#C9B48A', clock: '#F3EBDD', text: '#F3EBDD' },
  { id: 'glass', label: '글래스블러', bg: '#DCD8D2', card: 'rgba(255,255,255,0.35)', bar: 'rgba(255,255,255,0.3)', accent: '#FFFFFF', clock: '#FFFFFF', text: '#FFFFFF', glass: true },
]

/** 에디터 화면(설정 · 버튼) 글꼴 — fonts.css 의 Pretendard Variable */
const EDITOR_UI_FONT = "'Pretendard Variable', Pretendard, system-ui, -apple-system, sans-serif"

type PanelId = PhoneScreenId | 'info' | 'bgm' | 'dday'
const SCREENS: { id: PhoneScreenId; label: string }[] = [
  { id: 'lock', label: '잠금화면' },
  { id: 'home', label: '홈 화면' },
  // 하객이 많이 찾는 순서 — 예식 안내 → 사진첩 → 커플 소개 → 우리 이야기 → 연락 · 마음 → 회신 → 영상 → 방명록 → 사진 공유
  { id: 'memo', label: '예식 안내' },
  { id: 'album', label: '사진첩' },
  { id: 'intro', label: '커플 소개' },
  { id: 'story', label: '우리 이야기' },
  { id: 'letter', label: '초대의 글' },
  { id: 'call', label: '연락하기' },
  { id: 'gift', label: '마음 전하기' },
  { id: 'rsvp', label: '참석 회신' },
  { id: 'video', label: '영상' },
  { id: 'guestbook', label: '방명록' },
  { id: 'camera', label: '사진 공유' },
]

/** 연락처 동그라미 이모지 — 사람 · 가족 위주 */
const AVATAR_EMOJIS = ['🤵', '👰', '🤵‍♂️', '👰‍♀️', '👨', '👩', '🧑', '👨‍🦳', '👩‍🦳', '👴', '👵', '🧔', '👱‍♀️', '👱', '👦', '👧', '🙋‍♂️', '🙋‍♀️', '💑', '👫', '💍', '🤍', '🌷', '🕊️']

/** 이름(성 뺀) — 첫인상 질문용 */
const givenFirst = (p: { name: string; firstName?: string }) => p.firstName || (p.name.length > 2 ? p.name.slice(1) : p.name) || '상대'

/** '열 때 전체 화면' 도움말 — ? 를 누르거나 올리면, 주소창이 사라지는 모습을 작은 폰 움직임으로 */
function FullscreenHelp() {
  const [open, setOpen] = useState(false)
  const css = `
@keyframes fhKnob { 0%, 12% { transform: translateX(0); } 38%, 100% { transform: translateX(46px); } }
@keyframes fhBar { 0%, 40% { transform: translateY(0); opacity: 1; } 52%, 86% { transform: translateY(-100%); opacity: 0; } 96%, 100% { transform: translateY(0); opacity: 1; } }
@keyframes fhPage { 0%, 40% { top: 18px; } 52%, 86% { top: 0; } 96%, 100% { top: 18px; } }
@keyframes fhLock { 0%, 36% { opacity: 1; } 46%, 90% { opacity: 0; } 98%, 100% { opacity: 1; } }
@keyframes fhHome { 0%, 38% { opacity: 0; transform: scale(1.06); } 50%, 88% { opacity: 1; transform: none; } 98%, 100% { opacity: 0; } }
@keyframes fhTap { 0%, 8% { opacity: 0; } 12%, 36% { opacity: 1; } 42%, 100% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .fh * { animation: none !important; } }`
  const D = '4.6s'
  return (
    <span className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" aria-label="열 때 전체 화면 설명" aria-expanded={open} onClick={e => { e.preventDefault(); setOpen(o => !o) }}
        className="w-4 h-4 rounded-full border text-[10.5px] leading-none flex items-center justify-center cursor-help" style={{ borderColor: 'var(--ed-border)', color: 'var(--ed-text-muted)', background: '#FFFFFF' }}>?</button>
      {open && (
        <span role="tooltip" className="fh absolute left-1/2 -translate-x-1/2 top-6 z-30 w-[260px] rounded-xl p-3 text-white shadow-xl" style={{ background: 'rgba(30,28,26,0.96)' }}>
          <style>{css}</style>
          <span className="flex gap-3 items-center">
            {/* 작은 폰 */}
            <span className="relative shrink-0 overflow-hidden" style={{ width: 92, height: 168, borderRadius: 16, border: '3px solid #0E0D0C', background: '#F4F2EE' }}>
              {/* 주소창 */}
              <span className="absolute left-0 right-0 top-0 flex items-center justify-center" style={{ height: 18, background: '#E2E2E5', animation: `fhBar ${D} ease-in-out infinite`, zIndex: 3 }}>
                <span style={{ width: 54, height: 8, borderRadius: 4, background: '#FFFFFF', fontSize: 5.5, color: '#888', lineHeight: '8px', textAlign: 'center' }}>deardrawer</span>
              </span>
              {/* 청첩장 화면 */}
              <span className="absolute left-0 right-0 bottom-0" style={{ top: 18, animation: `fhPage ${D} ease-in-out infinite` }}>
                <span className="absolute inset-0 flex flex-col items-center" style={{ background: 'linear-gradient(180deg, #CFC8BE, #8C8378)', animation: `fhLock ${D} ease-in-out infinite` }}>
                  <span style={{ marginTop: 22, fontSize: 18, fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.02em' }}>14:00</span>
                  <span className="absolute" style={{ left: 8, right: 8, bottom: 12, height: 16, borderRadius: 8, background: 'rgba(255,255,255,0.35)' }}>
                    <span className="absolute" style={{ left: 2, top: 2, width: 12, height: 12, borderRadius: '50%', background: '#FFFFFF', animation: `fhKnob ${D} ease-in-out infinite` }} />
                    <span className="absolute" style={{ left: -2, top: -2, width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.9)', animation: `fhTap ${D} ease-in-out infinite, fhKnob ${D} ease-in-out infinite` }} />
                  </span>
                </span>
                <span className="absolute inset-0" style={{ background: '#FFFFFF', animation: `fhHome ${D} ease-in-out infinite` }}>
                  <span className="absolute" style={{ left: 8, right: 8, top: 10, height: 44, borderRadius: 8, background: '#D9D3CB' }} />
                  <span className="absolute grid" style={{ left: 10, right: 10, top: 62, gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                    {Array.from({ length: 8 }, (_, i) => <span key={i} style={{ aspectRatio: '1', borderRadius: 4, background: '#E6E1DA' }} />)}
                  </span>
                  <span className="absolute" style={{ left: 6, right: 6, bottom: 8, height: 20, borderRadius: 8, background: '#3E4A3D' }} />
                </span>
              </span>
            </span>
            <ul className="text-[11.5px] leading-relaxed space-y-1.5 list-disc pl-3.5" style={{ wordBreak: 'keep-all' }}>
              <li>밀어서 열면 주소창 없이 화면을 가득 채웁니다.</li>
              <li>안드로이드 크롬·삼성 인터넷에서 지원하며, 아이폰은 주소창 색상만 맞춰집니다.</li>
              <li>뒤로 가기를 누르면 전체 화면이 해제됩니다.</li>
            </ul>
          </span>
        </span>
      )}
    </span>
  )
}

/** 추천 검색어 편집 — 순서 바꾸기(↑↓) · 강조(★) · 화면 고르기 */
function SearchItemsEditor({ items, apps, onChange, onReset }: { items: PhoneSearchItem[]; apps: PhoneAppId[]; onChange: (next: PhoneSearchItem[]) => void; onReset?: () => void }) {
  const set = (i: number, patch: Partial<PhoneSearchItem>) => onChange(items.map((y, j) => (j === i ? { ...y, ...patch } : y)))
  const move = (i: number, d: number) => { const n = [...items]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; onChange(n) }
  const arrow = 'w-5 h-4 leading-none text-[10px] text-gray-400 hover:text-gray-800 disabled:opacity-25'
  return (
    <div className="space-y-1.5">
      {items.map((x, i) => (
        <div key={i} className="grid grid-cols-[auto_1fr_104px_auto_auto] gap-1.5 items-center">
          <span className="flex flex-col">
            <button type="button" aria-label="위로" disabled={i === 0} className={arrow} onClick={() => move(i, -1)}><ChevronUp size={14} aria-hidden /></button>
            <button type="button" aria-label="아래로" disabled={i === items.length - 1} className={arrow} onClick={() => move(i, 1)}><ChevronDown size={14} aria-hidden /></button>
          </span>
          <input className={inputCls + ' !px-2'} maxLength={20} placeholder="검색어" value={x.label} onChange={e => set(i, { label: e.target.value })} style={x.pin ? { borderColor: 'var(--ed-accent)', fontWeight: 600 } : undefined} />
          <select className={inputCls + ' !px-2'} value={x.app} onChange={e => set(i, { app: e.target.value as PhoneAppId })}>
            {apps.map(a => <option key={a} value={a}>{APP_META[a].label}</option>)}
          </select>
          <button type="button" aria-label={x.pin ? '강조 끄기' : '강조하기'} title="강조 — 맨 위에 '추천'으로" className="px-0.5 text-[15px] leading-none" style={{ color: x.pin ? 'var(--ed-accent)' : '#C9C4BD' }} onClick={() => set(i, { pin: !x.pin || undefined })}><Star size={15} fill={x.pin ? 'currentColor' : 'none'} aria-hidden /></button>
          <button type="button" aria-label="지우기" className="text-gray-400 hover:text-red-600 px-0.5" onClick={() => onChange(items.filter((_, j) => j !== i))}><X size={16} className="mx-auto" aria-hidden /></button>
        </div>
      ))}
      <div className="flex gap-1.5 flex-wrap">
        {items.length < 8 && <button type="button" className={pill(false)} onClick={() => onChange([...items, { label: '', app: 'memo' }])}>+ 검색어 추가</button>}
        {onReset && <button type="button" className={pill(false)} onClick={onReset}>추천으로 되돌리기</button>}
      </div>
    </div>
  )
}

/* ───────── 작은 UI 조각 (에디터 셸 토큰 사용) ───────── */
/** 휴대폰 꾸미기 — 폰에서 누른 곳의 설정 묶음만 보이게 (null 이면 전부) */
const SecFocus = createContext<string[] | null>(null)
const Section = ({ title, children, hint, action }: { title: string; children: ReactNode; hint?: string; action?: ReactNode }) => {
  const focus = useContext(SecFocus)
  if (focus && !focus.includes(title)) return null
  return (
    <section className="space-y-4 pb-6 mb-6 border-b" style={{ borderColor: 'var(--ed-border)' }}>
      <div>
        <div className="flex items-center justify-between gap-2"><h3 className="text-[15px] font-bold" style={{ color: 'var(--ed-text)' }}>{title}</h3>{action}</div>
        {hint && <p className="text-[13px] mt-1" style={{ color: 'var(--ed-text-muted)' }}>{hint}</p>}
      </div>
      {children}
    </section>
  )
}
const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="block">
    <span className="block text-[13px] font-semibold mb-1.5" style={{ color: '#5E554D' }}>{label}</span>
    {children}
  </label>
)
// 입력 칸 — 휴대폰은 16px(아이폰이 작은 글자 칸을 누르면 화면을 확대함) · 높이 44
const inputCls = 'w-full px-3 min-h-[44px] py-2 text-[16px] sm:text-sm rounded-xl border border-[color:var(--ed-border)] bg-white focus:outline-none focus:ring-1 focus:ring-[color:var(--ed-accent)]'
const pill = (on: boolean) => `px-3 py-2 rounded-lg border text-[13px] font-medium transition-colors ${on ? 'border-[color:var(--ed-accent)] bg-[color:var(--ed-accent)] text-[#F5F0ED]' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`

/** 추천 색 + 직접 고르기(컬러 피커). value 가 비면 '기본' */
function ColorRow({ value, options: raw, onChange, fallback }: { value?: string; options: string[]; onChange: (c: string | undefined) => void; fallback?: string }) {
  const options = Array.from(new Set(raw.map(c => c.toUpperCase())))
  const cur = (value || fallback || '').toUpperCase()
  const custom = !!value && !options.map(o => o.toUpperCase()).includes(value.toUpperCase())
  const ring = (on: boolean) => (on ? '0 0 0 2px #fff, 0 0 0 4px var(--ed-accent)' : undefined)
  // 맨 앞 '기본'(빗금) · 색 · 맨 뒤 '직접 고르기' — 글자 버튼 없이 동그라미만
  return (
    <div className="flex gap-2 flex-wrap items-center">
      <button type="button" aria-label="기본" title="기본" onClick={() => onChange(undefined)} className="w-7 h-7 rounded-full border border-gray-300 bg-white"
        style={{ backgroundImage: 'linear-gradient(135deg, transparent 46%, #C9C1B8 46%, #C9C1B8 54%, transparent 54%)', boxShadow: ring(!value) }} />
      {options.map(c => (
        <button key={c} type="button" aria-label={c} onClick={() => onChange(c)} className="w-7 h-7 rounded-full border border-gray-200" style={{ background: c, boxShadow: ring(!!value && cur === c.toUpperCase()) }} />
      ))}
      <label className="relative w-7 h-7 rounded-full border border-gray-300 cursor-pointer overflow-hidden flex items-center justify-center" title="직접 고르기" aria-label="직접 고르기"
        style={{ background: custom ? value : 'conic-gradient(#E46A6A,#E4C66A,#7FC47F,#6AA9E4,#B37FE4,#E46A6A)', boxShadow: ring(custom) }}>
        {!custom && <span className="w-3.5 h-3.5 rounded-full bg-white/90 flex items-center justify-center"><Plus size={10} strokeWidth={3} aria-hidden style={{ color: '#6E655D' }} /></span>}
        <input type="color" className="absolute inset-0 opacity-0 cursor-pointer" value={/^#[0-9a-f]{6}$/i.test(value || '') ? value : (fallback || '#FFFFFF')} onChange={e => onChange(e.target.value)} />
      </label>
    </div>
  )
}

/** 연락처 — 숫자만 받고 010-0000-0000 꼴로 */
/** 이미지에 투명한 부분이 있는지 — 앱 아이콘 바탕을 자동으로 없앨지 정함 */
async function hasTransparency(file: File): Promise<boolean> {
  if (!/png|webp|gif|avif/i.test(file.type)) return false
  try {
    const bmp = await createImageBitmap(file)
    const w = Math.min(64, bmp.width), h = Math.min(64, bmp.height)
    const c = document.createElement('canvas'); c.width = w; c.height = h
    const ctx = c.getContext('2d')
    if (!ctx) return false
    ctx.drawImage(bmp, 0, 0, w, h)
    const px = ctx.getImageData(0, 0, w, h).data
    for (let i = 3; i < px.length; i += 4) if (px[i] < 240) return true
    return false
  } catch { return false }
}

function formatPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length < 4) return d
  if (d.startsWith('02')) return d.length <= 5 ? `${d.slice(0, 2)}-${d.slice(2)}` : d.length <= 9 ? `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}` : `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`
  if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
}

function UploadButton({ label, onFile, onFiles, busy }: { label: string; onFile?: (f: File) => void; onFiles?: (fs: File[]) => void; busy?: boolean }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" multiple={!!onFiles} className="hidden"
        onChange={e => {
          // FileList 는 살아 있는 객체 — 비우기 전에 복사
          const files = Array.from(e.target.files || []); e.target.value = ''
          if (onFiles) { if (files.length) onFiles(files) } else if (files[0]) onFile?.(files[0])
        }} />
      <button type="button" onClick={() => ref.current?.click()} disabled={busy} className={pill(false) + ' disabled:opacity-60'}>{busy ? '올리는 중…' : label}</button>
    </>
  )
}

function PhoneEditorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, status } = useAuth()
  const editId = searchParams.get('id')
  const urlSlug = searchParams.get('slug')
  const isAdminMode = searchParams.get('admin') === 'true'

  const [data, setData] = useState<PhoneData>(createDefaultPhoneData)
  const [invitationId, setInvitationId] = useState<string | null>(editId)
  const [screen, setScreenRaw] = useState<PhoneScreenId>('lock')
  const [panel, setPanel] = useState<PanelId>('info')
  /** 화면을 바꾸면 오른쪽 설정도 그 화면 것으로 */
  // 미리보기 중 왼쪽 목록에서 화면을 고르면 미리보기도 그 화면으로 (다시 그려서 이동)
  const previewRef = useRef(false)
  const [previewStart, setPreviewStart] = useState<PhoneScreenId>('lock')
  // 편집 화면에서도 화면 안 버튼으로 옮겨 간 길을 기억 (뒤로 → 이전 화면)
  const navHist = useRef<PhoneAppId[]>([])
  // 잠금화면 검색에서 연 화면 — 뒤로 가면 검색이 열린 잠금화면으로
  const lockReturn = useRef<string | null>(null)
  const [edReopen, setEdReopen] = useState<string | null>(null)
  const setScreen = useCallback((s: PhoneScreenId) => {
    if (s === 'home' || s === 'lock') navHist.current = []
    setScreenRaw(s); setPanel(s)
    if (previewRef.current) { setPreviewStart(s); setPreviewKey(k => k + 1) }
  }, [])
  /** 미리보기 안에서 화면을 옮기면 왼쪽 목록 · 오른쪽 설정도 그 화면으로 */
  const followPreview = useCallback((s: PhoneScreenId) => { setScreenRaw(s); setPanel(s); setSelectedId(null); setDraft(null) }, [])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  /** 미리보기 — 하객 화면처럼 움직임 (다시 누르면 처음부터) · 휴대폰에서 아래 탭 */
  const [preview, setPreview] = useState(false)
  // 하객 사진 공유 주소 — 커플 설정(내 청첩장 → 하객 사진 공유)에서 자동으로 가져와 카메라 · 잠금화면 버튼에 연결
  const [shareInfo, setShareInfo] = useState<{ href: string | null; enabled: boolean; loaded: boolean }>({ href: null, enabled: false, loaded: false })
  const onShareStatus = useCallback((d: CoupleShareStatus | null) => setShareInfo({ href: d?.slug ? `/photo/${d.slug}` : null, enabled: !!d?.enabled, loaded: true }), [])
  useEffect(() => {
    let off = false
    fetch('/api/post-drawer/mine/guest-share').then(r => (r.ok ? r.json() as Promise<CoupleShareStatus> : null)).then(d => { if (!off) onShareStatus(d) }).catch(() => { if (!off) onShareStatus(null) })
    return () => { off = true }
  }, [onShareStatus])
  const photoShareHref = shareInfo.enabled ? shareInfo.href : null
  useEffect(() => { previewRef.current = preview }, [preview])
  /** 잠금화면에서 비밀번호 화면 보기 */
  const [showCode, setShowCode] = useState(false)
  const [ddayPreview, setDdayPreview] = useState(false)
  /** 비밀번호를 맞혔을 때 열리는 모습을 캔버스에서 잠깐 보여 주고 잠금화면으로 돌아온다 */
  const [revealing, setRevealing] = useState(false)
  const [revealKey, setRevealKey] = useState(0)
  /** 홈이 열리는 모습 미리 보기 — 위젯이 차례로 떠오르고 숫자가 올라감 */
  const playReveal = () => { setSelectedId(null); setScreenRaw('home'); setRevealKey(k => k + 1); setRevealing(true); setTimeout(() => setRevealing(false), 2600) }
  const [previewKey, setPreviewKey] = useState(0)
  const [mobileTab, setMobileTab] = useState<'screens' | 'settings'>('settings')
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  /** 열려 있는 크롭 창 — 대표 사진 또는 사진 위젯 */
  /** 배경음악 미리 듣기 */
  const bgmPreviewRef = useRef<HTMLAudioElement | null>(null)
  const [bgmPlaying, setBgmPlaying] = useState<string | null>(null)
  const [cropFor, setCropFor] = useState<{ kind: 'letterAvatar' } | { kind: 'letter'; id: string; src: string } | { kind: 'wallpaper' } | { kind: 'notice' } | { kind: 'home' } | { kind: 'widget'; id: string } | { kind: 'widgetBg'; id: string } | { kind: 'story'; i: number; k: 'src' | 'src2' } | { kind: 'avatar'; side: 'groom' | 'bride'; i: number | null } | { kind: 'screen'; app: PhoneAppId } | { kind: 'intro'; side: 'groom' | 'bride' } | { kind: 'introBg'; side: 'groom' | 'bride' } | null>(null)
  const [notice, setNotice] = useState('')
  const [scale, setScale] = useState(0.8)

  const dataRef = useRef(data)
  useEffect(() => { dataRef.current = data }, [data])
  const past = useRef<PhoneData[]>([])
  const future = useRef<PhoneData[]>([])
  const lastPush = useRef(0)
  const [hist, setHist] = useState({ undo: 0, redo: 0 })
  const update = useCallback((fn: (d: PhoneData) => PhoneData) => {
    const now = Date.now()
    if (now - lastPush.current > 800) {
      past.current.push(dataRef.current)
      if (past.current.length > 100) past.current.shift()
    }
    lastPush.current = now
    future.current = []
    setData(d => fn(d)); setIsDirty(true)
    setHist({ undo: past.current.length, redo: 0 })
  }, [])
  const undo = useCallback(() => {
    const prev = past.current.pop()
    if (!prev) return
    future.current.push(dataRef.current)
    lastPush.current = 0
    setData(prev); setIsDirty(true); setSelectedId(null)
    setHist({ undo: past.current.length, redo: future.current.length })
  }, [])
  const redo = useCallback(() => {
    const next = future.current.pop()
    if (!next) return
    past.current.push(dataRef.current)
    lastPush.current = 0
    setData(next); setIsDirty(true); setSelectedId(null)
    setHist({ undo: past.current.length, redo: future.current.length })
  }, [])
  /* Ctrl+Z · Ctrl+Shift+Z (입력칸 안에서는 그 칸의 되돌리기) */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tg = e.target as HTMLElement | null
      if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.isContentEditable)) return
      if (!(e.ctrlKey || e.metaKey)) return
      const k = e.key.toLowerCase()
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      else if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); redo() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])
  const setPhone = (patch: Partial<PhoneData['phone']>) => update(d => ({ ...d, phone: { ...d.phone, ...patch } }))
  const setWidgets = (fn: (ws: PhoneWidget[]) => PhoneWidget[]) => update(d => ({ ...d, phone: { ...d.phone, widgets: fn(d.phone.widgets) } }))
  // 새 청첩장 — 미리보기 빈 칸을 채울 예시(샘플). 처음 저장하기 전까지만
  const [example, setExample] = useState<PhoneData | null>(null)
  const [mobMenu, setMobMenu] = useState<null | 'add' | 'set'>(null)
  // '고칠 곳을 눌러 보세요' — 처음 한 번만 (이 기기)
  const [coachDone, setCoachDone] = useState(() => { try { return typeof window !== 'undefined' && localStorage.getItem('pf-ed-coach') === '1' } catch { return false } })
  const doneCoach = () => { if (coachDone) return; setCoachDone(true); try { localStorage.setItem('pf-ed-coach', '1') } catch { /* noop */ } }
  // 저장 뒤 '바로 보내기'
  const [savedSheet, setSavedSheet] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  // 저장하지 않은 내용 — 이 기기에 임시로 (다시 열면 이어서 꾸밀지 물음)
  const [resume, setResume] = useState<{ at: number; data: PhoneData } | null>(null)
  const [infoErr, setInfoErr] = useState(false) // 저장하려다 이름 · 연락처가 비어 있었음 → 빈 칸 표시
  const flash = (s: string) => { setNotice(s); setTimeout(() => setNotice(''), 2200) }

  const adminHeaders = useCallback((): Record<string, string> => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' }
    if (isAdminMode) { const pw = typeof window !== 'undefined' ? localStorage.getItem('admin_password') : null; if (pw) h['x-admin-password'] = pw }
    return h
  }, [isAdminMode])

  /* 저장하지 않은 내용 임시 보관 — 이 기기 (휴대폰은 다른 앱을 오가다 새로 열리는 일이 많음) */
  const draftKey = `pf-draft-${editId || 'new'}`
  // 묻지 않고 바로 이어서 불러옴 — 아래 알림에서 '처음 상태로'를 누르면 불러오기 전(base)으로
  const offerResume = (base: PhoneData) => {
    try {
      const raw = localStorage.getItem(draftKey)
      if (!raw) return
      const d = JSON.parse(raw) as { at: number; data: PhoneData }
      if (d?.data && Date.now() - d.at < 14 * 86400000) { setData(normalizePhoneData(d.data)); setIsDirty(true); setResume({ at: d.at, data: base }); setTimeout(() => setResume(null), 9000) }
      else localStorage.removeItem(draftKey)
    } catch { /* noop */ }
  }
  useEffect(() => {
    if (!isDirty) return
    const id = setTimeout(() => { try { localStorage.setItem(draftKey, JSON.stringify({ at: Date.now(), data })) } catch { /* 용량 초과 등 — 무시 */ } }, 800)
    return () => clearTimeout(id)
  }, [data, isDirty, draftKey])

  /* 새 청첩장 — 샘플(THE PHONE 샘플 청첩장)을 처음 모습으로 깔고 시작 (못 불러오면 기본값) */
  useEffect(() => {
    if (editId) return
    let off = false
    fetch('/api/samples/phone')
      .then(r => r.json() as Promise<{ content?: string | null }>)
      .then(res => {
        if (off || !res.content) return
        try {
          const d = normalizePhoneData(JSON.parse(res.content))
          // 디자인은 샘플 그대로, 내용(이름 · 사진 · 글 · 날짜 …)은 비워서 — 미리보기는 빈 칸을 샘플로 '예시' 채움
          setExample(d)
          const base = clearPhoneContent(d)
          setData(base); past.current = []; future.current = []; setHist({ undo: 0, redo: 0 })
          offerResume(base)
        } catch { /* 기본값 그대로 */ }
      })
      .catch(() => { /* 기본값 그대로 */ })
    return () => { off = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId])

  /* 불러오기 */
  useEffect(() => {
    if (status === 'loading' || !editId) return
    fetch(`/api/invitations/${editId}`, { headers: adminHeaders() })
      .then(r => r.json() as Promise<{ invitation?: { content?: string; groom_name?: string; bride_name?: string } }>)
      .then(res => {
        if (!res.invitation?.content) return
        try { const base = normalizePhoneData(JSON.parse(res.invitation.content)); setData(base); past.current = []; future.current = []; setHist({ undo: 0, redo: 0 }); offerResume(base) } catch (e) { console.error('Failed to parse content:', e) }
      })
      .catch(e => console.error('Failed to load:', e))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, status, adminHeaders])

  /* 나가기 전 확인 */
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (isDirty) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [isDirty])

  /* 휴대폰 — 기본은 '폰에서 바로 꾸미기' (view: 하객처럼 보기 · deco: 누른 곳 설정이 아래 시트로),
     '전체 설정'(full)은 듀얼 화면 (위: 미리보기 고정 · 아래: 설정 스크롤, 가운데 막대로 비율 조절) */
  const [mobMode, setMobMode] = useState<'view' | 'deco' | 'full'>('view')
  const [sheet, setSheet] = useState<{ kind: 'add' } | { kind: 'focus'; parts: { panel: PanelId; secs: string[] | null }[] } | null>(null)
  // 휴대폰 꾸미기 — 설정은 오른쪽 서랍 (꺼낸 폭 = 화면 폭 비율, 0이면 손잡이만). 폰은 늘 그대로
  const [sheetFrac, setSheetFrac] = useState(0.75)
  const sheetDrag = useRef<{ x: number; f: number; moved: boolean } | null>(null)
  const decoAreaRef = useRef<HTMLDivElement>(null)
  const decoDownOnWidget = useRef(false)
  const mobInit = useRef(false)
  const [mob, setMob] = useState(false)
  const [split, setSplit] = useState(0.46)
  const [vh, setVh] = useState(800)
  const splitDrag = useRef<{ y: number; r: number } | null>(null)
  const MOB_TOP = 56, MOB_NAV = 56, MOB_BAR = 22
  const mobPreviewH = Math.round((vh - MOB_TOP - MOB_NAV - MOB_BAR) * split)

  /* 캔버스 배율 */
  useEffect(() => {
    const fit = () => {
      const desk = window.innerWidth >= 1024
      setMob(!desk); setVh(window.innerHeight)
      // 휴대폰으로 처음 열면 하객처럼 보는 화면부터
      if (!desk && !mobInit.current) {
        mobInit.current = true
        // 새 청첩장은 결혼식 정보부터 (꾸미기 + 정보 시트), 고치던 청첩장은 하객처럼 보는 화면부터
        if (!editId) { setPreview(false); setMobMode('deco'); setSheet({ kind: 'focus', parts: [{ panel: 'info', secs: null }] }) }
        else { setPreview(true); setPreviewStart('lock'); setPreviewKey(k => k + 1) }
      }
      // 머리 줄(56) · 위아래 여백(48) · 편집/미리보기 버튼(62) · 폰 테두리(20)
      if (desk) setScale(Math.min(1, (window.innerHeight - 56 - 48 - 62 - 20) / PHONE_H))
      else if (mobMode === 'full') {
        // 나눠 보기: 폰은 화면 폭에 맞춘 크기 그대로 — 위 칸이 작으면 줄이지 않고 위아래로 넘겨 봄
        setScale(Math.max(0.2, Math.min(0.92, (window.innerWidth - 40) / PHONE_W)))
      }
    }
    fit(); window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [split, mobMode, editId])
  // 꾸미기 · 보기 — 남은 칸에 폰을 꽉 맞춤. 설정 시트가 열려도 폰은 그 크기 그대로 (줄이지 않고 누른 곳이 보이게 넘김)
  const sheetOpenRef = useRef(false)
  useEffect(() => {
    const el = decoAreaRef.current
    if (!el || !mob || mobMode === 'full') return
    const fit = () => { if (sheetOpenRef.current) return; const r = el.getBoundingClientRect(); if (r.height > 0) setScale(Math.max(0.2, Math.min(1, (r.width - 32) / PHONE_W, (r.height - 46) / PHONE_H))) }
    fit()
    const ro = new ResizeObserver(fit); ro.observe(el)
    return () => ro.disconnect()
  }, [mob, mobMode])

  /* 사진 올리기 */
  const upload = async (key: string, f: File, done: (url: string) => void) => {
    setBusy(key)
    try {
      const r = await uploadImage(f, { invitationId: invitationId || undefined })
      if (r.success && r.webUrl) done(r.webUrl)
      else flash(r.error || '사진을 올리지 못했어요')
    } finally { setBusy(null) }
  }

  /** 편지 위젯은 편지 수만큼 칸 (2통 이하 2×1 · 3통 3×1 · 4통 4×1) */
  const sizeForNew = (type: WidgetType, size: WidgetSize): WidgetSize => {
    if (type !== 'letters') return size
    const n = lettersOf(data).length
    return n >= 4 ? 'W' : n === 3 ? 'U' : 'H'
  }

  /* ───── 위젯 조작 ───── */
  const selected = data.phone.widgets.find(w => w.id === selectedId) || null
  // 홈 화면 장 — 지금 고치는 장의 위젯만 놓고 비켜나게
  const [homePage, setHomePage] = useState(0)
  const pageCount = homePagesOf(data)
  const curPage = Math.min(homePage, pageCount - 1)
  const pageWs = data.phone.widgets.filter(w => (w.page || 0) === curPage)
  const withOthers = (next: PhoneWidget[]) => [...data.phone.widgets.filter(w => (w.page || 0) !== curPage), ...next]
  const patchWidget = (id: string, patch: Partial<PhoneWidget>) => setWidgets(ws => ws.map(w => (w.id === id ? { ...w, ...patch, props: { ...w.props, ...(patch.props || {}) } } : w)))
  /** 위젯 고르기 — 사이드바에서 누르면 오른쪽에 크기 · 모양을 고르는 창이 열리고, '추가'를 눌러야 들어간다 */
  const [draft, setDraft] = useState<{ type: WidgetType; size: WidgetSize; variant: number } | null>(null)
  const addWidget = (type: WidgetType, app?: PhoneAppId, size?: WidgetSize, variant = 0) => {
    const meta = widgetMeta(type)
    const sz = size || meta.defaultSize
    const spot = nearestFit(pageWs, sz, 0, 0)
    if (!spot) { flash('빈 칸이 없어요'); return }
    setDraft(null)
    const w: PhoneWidget = { id: newWidgetId(), type, col: spot.col, row: spot.row, size: sz, variant, page: curPage || undefined, props: type === 'app' ? { app: app || 'memo' } : type === 'folder' ? { apps: [...FOLDER_DEFAULT_APPS], label: '우리' } : type === 'quote' ? { text: 'forever starts here' } : type === 'dday' ? { label: '우리 결혼식까지' } : {} }
    setWidgets(ws => [...ws, w])
    setScreen('home'); setSelectedId(w.id)
  }
  const resizeWidget = (w: PhoneWidget, size: WidgetSize) => {
    const same = data.phone.widgets.filter(x => (x.page || 0) === (w.page || 0))
    if (fits(same, size, w.col, w.row, w.id)) { patchWidget(w.id, { size }); return }
    const spot = nearestFit(same, size, w.col, w.row, w.id)
    if (!spot) { flash('자리가 없어요'); return }
    patchWidget(w.id, { size, col: spot.col, row: spot.row })
  }

  /* 끌어서 옮기기 — 4px 이상 움직이면 끌기 시작, 칸에 맞춰 놓임 */
  const [drag, setDrag] = useState<{ id: string; ghost: { col: number; row: number; size: WidgetSize; ok: boolean } | null } | null>(null)
  /** 끌어서 버리는 휴지통 (끄는 동안만 보임) · 방금 지운 위젯 (되돌리기) */
  const trashRef = useRef<HTMLDivElement>(null)
  const [overTrash, setOverTrash] = useState(false)
  const [undoW, setUndoW] = useState<PhoneWidget | null>(null)
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const removeWidget = (w: PhoneWidget) => {
    setWidgets(ws => ws.filter(x => x.id !== w.id)); setSelectedId(null)
    setUndoW(w)
    if (undoTimer.current) clearTimeout(undoTimer.current)
    undoTimer.current = setTimeout(() => setUndoW(null), 5000)
  }
  // 위젯을 끌어 옮긴 직후 따라오는 click 은 '누르기'로 치지 않음 (휴대폰 꾸미기에서 서랍이 열리지 않게)
  const widgetDragged = useRef(false)
  const onWidgetPointerDown = (e: ReactPointerEvent, w: PhoneWidget) => {
    e.preventDefault(); e.stopPropagation()
    // 휴대폰 꾸미기 — 누르면 설정, 끌면 옮기기 (누르는 순간 설정 서랍이 나와 폰을 덮지 않게 손을 뗄 때 정함)
    const tapToSelect = mob && mobMode === 'deco' && !preview
    if (!tapToSelect) { setSelectedId(w.id); setPanel('home'); setMobileTab('settings'); setDraft(null) }
    const sx = e.clientX, sy = e.clientY
    const ox = cellX(w.col), oy = cellY(w.row)
    const span = SIZE_SPAN[w.size]
    let moved = false
    let last: { col: number; row: number; ok: boolean } | null = null
    let inTrash = false
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - sx) / scale, dy = (ev.clientY - sy) / scale
      if (!moved && Math.hypot(dx, dy) < 4) return
      moved = true
      const r = trashRef.current?.getBoundingClientRect()
      inTrash = !!r && ev.clientX > r.left - 16 && ev.clientX < r.right + 16 && ev.clientY > r.top - 16 && ev.clientY < r.bottom + 16
      setOverTrash(inTrash)
      if (inTrash) { setDrag({ id: w.id, ghost: null }); return }
      const col = Math.max(0, Math.min(GRID.cols - span.w, Math.round((ox + dx - GRID.left) / (GRID.cellW + GRID.gapX))))
      const row = Math.max(0, Math.min(GRID.rows - span.h, Math.round((oy + dy - GRID.top) / (GRID.cellH + GRID.gapY))))
      last = { col, row, ok: !!placeWithReflow(pageWs, w, col, row) }
      setDrag({ id: w.id, ghost: { col, row, size: w.size, ok: last.ok } })
    }
    const cancel = () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', cancel)
      setDrag(null); setOverTrash(false)
    }
    const up = () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', cancel)
      setDrag(null); setOverTrash(false)
      if (tapToSelect && !moved) { setSelectedId(w.id); setPanel('home'); setDraft(null); return }
      if (moved) { widgetDragged.current = true; setTimeout(() => { widgetDragged.current = false }, 0) }
      if (moved && inTrash) { removeWidget(w); return }
      if (moved && last) {
        // 겹치면 그 자리 위젯이 비켜남
        const next = placeWithReflow(pageWs, w, last.col, last.row)
        if (next) setWidgets(() => withOthers(next))
        else flash('놓을 자리가 없어요')
      }
    }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', cancel)
  }
  /* 끌어서 새로 넣기 — 왼쪽 목록이나 모양 카드를 폰 화면 위로 끌어다 놓으면 그 칸에 들어감 (그냥 누르면 원래대로) */
  const phoneRef = useRef<HTMLDivElement>(null)
  const [newDrag, setNewDrag] = useState<{ x: number; y: number; label: string } | null>(null)
  const dragClick = useRef(false)
  const startNewDrag = (e: ReactPointerEvent, spec: { type: WidgetType; size: WidgetSize; variant: number; app?: PhoneAppId; label: string }) => {
    // 휴대폰(설정 시트)에선 끌어 놓기 없음 — 손가락으로 시트를 넘기면 끌기로 오인해 표시가 남음. '홈 화면에 추가'로 넣음
    if (e.button !== 0 || mob) return
    const sx = e.clientX, sy = e.clientY
    const span = SIZE_SPAN[spec.size]
    let moved = false
    let last: { col: number; row: number; ok: boolean } | null = null
    const move = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return
      if (!moved) { moved = true; if (screen !== 'home') setScreen('home') }
      setNewDrag({ x: ev.clientX, y: ev.clientY, label: spec.label })
      const r = phoneRef.current?.getBoundingClientRect()
      if (!r || ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom) { last = null; setDrag(null); return }
      // 손가락이 위젯 가운데쯤에 오도록
      const px = (ev.clientX - r.left) / scale - spanW(spec.size) / 2
      const py = (ev.clientY - r.top) / scale - spanH(spec.size) / 2
      const col = Math.max(0, Math.min(GRID.cols - span.w, Math.round((px - GRID.left) / (GRID.cellW + GRID.gapX))))
      const row = Math.max(0, Math.min(GRID.rows - span.h, Math.round((py - GRID.top) / (GRID.cellH + GRID.gapY))))
      last = { col, row, ok: !!placeWithReflow(pageWs, { id: '__new', type: spec.type, col: -1, row: -1, size: spec.size, variant: 0, props: {} }, col, row) }
      setDrag({ id: 'new', ghost: { col, row, size: spec.size, ok: last.ok } })
    }
    const cancel = () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', cancel)
      setNewDrag(null); setDrag(null)
    }
    const up = () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', cancel)
      setNewDrag(null); setDrag(null)
      if (!moved) return
      // 끌기로 끝났으면 뒤따르는 click(그냥 누르기)은 무시
      dragClick.current = true
      setTimeout(() => { dragClick.current = false }, 0)
      if (!last) return
      const w: PhoneWidget = { id: newWidgetId(), type: spec.type, col: -1, row: -1, size: spec.size, variant: spec.variant, page: curPage || undefined, props: spec.type === 'app' ? { app: spec.app || 'memo' } : spec.type === 'folder' ? { apps: [...FOLDER_DEFAULT_APPS], label: '우리' } : spec.type === 'quote' ? { text: 'forever starts here' } : spec.type === 'dday' ? { label: '우리 결혼식까지' } : {} }
      const next = placeWithReflow(pageWs, w, last.col, last.row)
      if (!next) { flash('놓을 자리가 없어요'); return }
      setWidgets(() => withOthers(next))
      setDraft(null); setSelectedId(w.id); setPanel('home')
    }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', cancel)
  }
  /* 손잡이로 크기 바꾸기 — 끈 만큼 가까운 크기(1×1 · 2×2 · 4×2 · 4×1)로 맞춤 */
  const onResizePointerDown = (e: ReactPointerEvent, w: PhoneWidget) => {
    e.preventDefault(); e.stopPropagation()
    const sizes = widgetMeta(w.type).sizes
    const sx = e.clientX, sy = e.clientY
    const base = SIZE_SPAN[w.size]
    let target = w.size
    const move = (ev: PointerEvent) => {
      const wantW = base.w + (ev.clientX - sx) / scale / (GRID.cellW + GRID.gapX)
      const wantH = base.h + (ev.clientY - sy) / scale / (GRID.cellH + GRID.gapY)
      target = sizes.reduce((best, sz) => {
        const a = SIZE_SPAN[sz], b = SIZE_SPAN[best]
        return (a.w - wantW) ** 2 + (a.h - wantH) ** 2 < (b.w - wantW) ** 2 + (b.h - wantH) ** 2 ? sz : best
      }, w.size)
      const col = Math.min(w.col, GRID.cols - SIZE_SPAN[target].w)
      setDrag({ id: w.id, ghost: { col, row: w.row, size: target, ok: fits(pageWs, target, col, w.row, w.id) } })
    }
    const up = () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up)
      setDrag(null)
      if (target === w.size) return
      resizeWidget(w, target)
      // 넓어지면 안 맞는 모양(원형 · 스티커)은 기본으로
      if (variantHidden(w.type, w.variant, target)) patchWidget(w.id, { variant: firstVariant(w.type, target) })
    }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up)
  }
  const editing: HomeEditing = {
    selectedId, draggingId: drag?.id, ghost: drag?.ghost, page: curPage,
    onWidgetPointerDown, onBackgroundPointerDown: () => setSelectedId(null),
    onResizePointerDown, canResize: w => widgetMeta(w.type).sizes.length > 1, onRemove: w => removeWidget(w),
    clean: mob && mobMode === 'deco',
  }

  /* ───── 저장 ───── */
  const handleSave = async () => {
    if (!user && !isAdminMode) {
      const cur = window.location.pathname + window.location.search
      router.push(`/login?redirect=${encodeURIComponent(cur)}`)
      return
    }
    const telOk = (v?: string) => (v || '').replace(/\D/g, '').length >= 9
    if (!data.groom.name.trim() || !data.bride.name.trim() || !telOk(data.groom.phone) || !telOk(data.bride.phone)) {
      setInfoErr(true)
      flash(!data.groom.name.trim() || !data.bride.name.trim() ? '신랑 · 신부 이름을 넣어 주세요' : '신랑 · 신부 연락처를 넣어 주세요')
      setSelectedId(null); setDraft(null); setPanel('info')
      if (mob) { setPreview(false); setMobMode('deco'); setSheet({ kind: 'focus', parts: [{ panel: 'info', secs: null }] }) }
      return
    }
    setIsSaving(true)
    try {
      const payload: Record<string, unknown> = {
        template_id: 'narrative-phone',
        groom_name: data.groom.name,
        bride_name: data.bride.name,
        wedding_date: data.wedding.date,
        wedding_time: data.wedding.timeDisplay,
        venue_name: data.wedding.venue.name,
        venue_address: data.wedding.venue.address,
        venue_hall: data.wedding.venue.hall,
        content: JSON.stringify(data),
      }
      if (!invitationId && urlSlug) payload.slug = urlSlug
      const res = invitationId
        ? await fetch(`/api/invitations/${invitationId}`, { method: 'PUT', headers: adminHeaders(), body: JSON.stringify(payload) })
        : await fetch('/api/invitations', { method: 'POST', headers: adminHeaders(), body: JSON.stringify(payload) })
      const result = (await res.json()) as { error?: string; invitation?: { id: string } }
      if (!res.ok) throw new Error(result.error || '저장에 실패했습니다.')
      if (!invitationId && result.invitation?.id) {
        setInvitationId(result.invitation.id)
        window.history.replaceState({}, '', `/editor/phone?id=${result.invitation.id}${isAdminMode ? '&admin=true' : ''}`)
      }
      setIsDirty(false)
      try { localStorage.removeItem(draftKey) } catch { /* noop */ }
      setSavedSheet(true)
    } catch (e) {
      flash(e instanceof Error ? e.message : '저장에 실패했습니다.')
    } finally { setIsSaving(false) }
  }

  /* ───── 오른쪽 설정 패널 ───── */
  const t = themeOf(data)
  const widgetPanel = (w: PhoneWidget) => {
    const meta = widgetMeta(w.type)
    return (
      <>
        <Section title={w.type === 'app' ? `${APP_META[w.props.app || 'memo'].label} 아이콘` : meta.label}>
          {meta.sizes.length > 1 && (
            <Field label="크기">
              <div className="flex gap-2 flex-wrap">{meta.sizes.map(s => (
                <button key={s} type="button" onClick={() => resizeWidget(w, s)}
                  className={`flex flex-col items-center gap-1 px-2.5 py-2 rounded-lg border text-xs transition-colors ${w.size === s ? 'border-[color:var(--ed-accent)] bg-[color:var(--ed-surface-2)] font-semibold' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <span className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${SIZE_SPAN[s].w}, 7px)`, gridAutoRows: '7px' }}>
                    {Array.from({ length: SIZE_SPAN[s].w * SIZE_SPAN[s].h }, (_, k) => <i key={k} className="rounded-[2px]" style={{ background: w.size === s ? 'var(--ed-accent)' : '#D6D3CF' }} />)}
                  </span>
                  {SIZE_LABEL[s]}
                </button>
              ))}</div>
            </Field>
          )}
          {meta.variants.length > 1 && (
            <Field label="모양">
              {(() => {
                // 넣은 뒤에도 모양을 미리 보며 고르기 — 이 위젯 내용 그대로 모양만 바꿔 그림
                const pw = spanW(w.size), ph = spanH(w.size)
                const sc = Math.min(1, 132 / pw, 92 / ph)
                return (
                  <div className="grid grid-cols-2 gap-2">
                    {meta.variants.map((v, i) => variantHidden(w.type, i, w.size) && w.variant !== i ? null : (
                      <button key={v} type="button" onClick={() => patchWidget(w.id, { variant: i })}
                        className={`rounded-md border p-2 flex flex-col items-center gap-1.5 ${w.variant === i ? 'border-[color:var(--ed-accent)] bg-[color:var(--ed-surface-2)]' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                        <span className="flex items-center justify-center w-full" style={{ height: 96, background: t.bg, borderRadius: 6, overflow: 'hidden' }}>
                          <span style={{ width: pw * sc, height: ph * sc, position: 'relative', display: 'block' }}>
                            <span style={{ position: 'absolute', left: 0, top: 0, width: pw, height: ph, transform: `scale(${sc})`, transformOrigin: '0 0', pointerEvents: 'none' }}>
                              <WidgetView w={{ ...w, variant: i }} data={data} t={t} editing />
                            </span>
                          </span>
                        </span>
                        <span className={`text-[12px] ${w.variant === i ? 'font-semibold' : ''}`}>{v}</span>
                      </button>
                    ))}
                  </div>
                )
              })()}
            </Field>
          )}
          {(w.type === 'photo' || w.type === 'story' || w.type === 'music' || !!w.props.src || !!w.props.bgImg) && (
            <label className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-md border bg-white text-sm" style={{ borderColor: 'var(--ed-border)' }}>
              <span>흑백</span>
              <input type="checkbox" checked={w.props.mono ?? false} onChange={e => patchWidget(w.id, { props: { mono: e.target.checked } })} />
            </label>
          )}
          {w.type !== 'photo' && !(w.type === 'guestbook' && w.variant === 1) && (
            <label className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-md border bg-white text-sm" style={{ borderColor: 'var(--ed-border)' }}>
              <span>바탕 투명하게</span>
              <input type="checkbox" checked={!!w.props.clear} onChange={e => patchWidget(w.id, { props: { clear: e.target.checked } })} />
            </label>
          )}
          {w.type !== 'photo' && !w.props.clear && !(w.type === 'guestbook' && w.variant === 1) && <>
            <Field label={w.type === 'app' && w.size === 'S' ? '버튼 색' : '위젯 색'}>
              <ColorRow value={w.props.bg} options={['#FFFFFF', '#F3EEE9', '#E9E4EC', '#E4EBE5', '#2E2E2E', data.phone.accent]} onChange={c => patchWidget(w.id, { props: { bg: c } })} />
            </Field>
            {w.type === 'app' && !w.props.src && (
              <Field label="아이콘 색">
                <ColorRow value={w.props.glyph} options={['#FFFFFF', '#1F1F1F', '#8A8178', data.phone.accent]} onChange={c => patchWidget(w.id, { props: { glyph: c } })} />
              </Field>
            )}
            {(w.props.bg || w.props.bgImg) && (
              <Field label="진하기">
                <div className="flex items-center gap-3">
                  <span className="text-[11px]" style={{ color: 'var(--ed-text-muted)' }}>연하게</span>
                  <input type="range" min={10} max={100} step={5} value={w.props.bgAlpha ?? 100} onChange={e => patchWidget(w.id, { props: { bgAlpha: Number(e.target.value) } })} className="flex-1 accent-[color:var(--ed-accent)]" aria-label="진하기" />
                  <span className="text-[11px]" style={{ color: 'var(--ed-text-muted)' }}>진하게</span>
                </div>
              </Field>
            )}
            {w.type !== 'music' && !(w.type === 'app' && w.size === 'S') && <Field label="위젯 배경사진">
              <div className="flex gap-2 items-center">
                {w.props.bgImg && (
                  <button type="button" title="자르기" onClick={() => setCropFor({ kind: 'widgetBg', id: w.id })} className="w-10 h-10 rounded-md overflow-hidden border border-gray-200 shrink-0">
                    <CroppedImageDiv src={w.props.bgImg} crop={w.props.bgImgCrop} className="w-full h-full" />
                  </button>
                )}
                {w.props.bgImg && <button type="button" className={pill(false)} onClick={() => setCropFor({ kind: 'widgetBg', id: w.id })}>자르기</button>}
                <UploadButton label={w.props.bgImg ? '변경' : '사진 올리기'} busy={busy === `bg-${w.id}`} onFile={f => upload(`bg-${w.id}`, f, url => { patchWidget(w.id, { props: { bgImg: url, bgImgCrop: undefined } }); setCropFor({ kind: 'widgetBg', id: w.id }) })} />
                {w.props.bgImg && <button type="button" className={pill(false)} onClick={() => patchWidget(w.id, { props: { bgImg: undefined, bgImgCrop: undefined } })}>삭제</button>}
              </div>
            </Field>}
            {(w.props.bg || w.props.bgImg) && <button type="button" className="text-xs hover:underline text-left" style={{ color: 'var(--ed-text-muted)' }} onClick={() => patchWidget(w.id, { props: { bg: undefined, bgImg: undefined, bgAlpha: undefined } })}>꾸미기 되돌리기</button>}
          </>}
          {pageCount > 1 && (
            <Field label="화면">
              <div className="flex gap-1.5">
                {Array.from({ length: pageCount }, (_, k) => k).map(k => (
                  <button key={k} type="button" className={pill((w.page || 0) === k)} onClick={() => {
                    if ((w.page || 0) === k) return
                    const spot = nearestFit(data.phone.widgets.filter(x => (x.page || 0) === k), w.size, w.col, w.row)
                    if (!spot) { flash('빈 칸이 없어요'); return }
                    patchWidget(w.id, { page: k || undefined, col: spot.col, row: spot.row }); setHomePage(k)
                  }}>{k + 1}</button>
                ))}
              </div>
            </Field>
          )}
          {w.type === 'search' && (() => {
            const cur = w.props.searches?.length ? w.props.searches : defaultSearchItems(data)
            const apps = (Object.keys(APP_META) as PhoneAppId[]).filter(a => !isAppOff(data, a))
            const set = (next: typeof cur) => patchWidget(w.id, { props: { searches: next } })
            return <>
              <Field label="검색창 안내 글"><input className={inputCls} maxLength={w.size === 'H' ? 8 : 16} value={w.props.text ?? ''} placeholder="검색" onChange={e => patchWidget(w.id, { props: { text: e.target.value } })} /></Field>
              <label className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-md border bg-white text-sm" style={{ borderColor: 'var(--ed-border)' }}>
                <span>추천 검색어 번갈아 보이기</span>
                <input type="checkbox" checked={!w.props.noRotate} onChange={e => patchWidget(w.id, { props: { noRotate: e.target.checked ? undefined : true } })} />
              </label>
              <Field label="추천 검색어">
                <SearchItemsEditor items={cur} apps={apps} onChange={set} onReset={w.props.searches?.length ? () => patchWidget(w.id, { props: { searches: undefined } }) : undefined} />
              </Field>
            </>
          })()}
          {w.type === 'folder' && (() => {
            const cur = w.props.apps?.length ? w.props.apps : FOLDER_DEFAULT_APPS
            const all = (Object.keys(APP_META) as PhoneAppId[]).filter(a => !isAppOff(data, a))
            const toggle = (a: PhoneAppId) => {
              const next = cur.includes(a) ? cur.filter(x => x !== a) : [...cur, a]
              if (!next.length) { flash('폴더에는 앱이 하나 이상 있어야 해요'); return }
              patchWidget(w.id, { props: { apps: next } })
            }
            return <>
              <Field label="폴더 이름"><input className={inputCls} maxLength={12} value={w.props.label ?? ''} placeholder="폴더" onChange={e => patchWidget(w.id, { props: { label: e.target.value } })} /></Field>
              <Field label={`앱 ${cur.length}개`}>
                {/* 한 묶음 목록 — 아이콘(누르면 사진) · 이름 · 순서 · 빼기 */}
                <div className="rounded-lg border bg-white divide-y overflow-hidden" style={{ borderColor: 'var(--ed-border)' }}>
                  {cur.map((a, i) => {
                    const icon = w.props.appIcons?.[a]
                    const setLabel = (v: string) => patchWidget(w.id, { props: { appLabels: { ...(w.props.appLabels || {}), [a]: v || undefined } } })
                    const setIcon = (v?: string) => patchWidget(w.id, { props: { appIcons: { ...(w.props.appIcons || {}), [a]: v } } })
                    const move = (d: number) => { const n = [...cur]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; patchWidget(w.id, { props: { apps: n } }) }
                    return (
                      <div key={a} className="group flex items-center gap-2.5 px-2.5 py-2" style={{ borderColor: 'var(--ed-border)' }}>
                        <label title="아이콘 사진 바꾸기" className="relative w-9 h-9 rounded-[10px] overflow-hidden shrink-0 cursor-pointer flex items-center justify-center" style={{ background: icon ? undefined : 'color-mix(in srgb, var(--ed-accent) 12%, white)' }}>
                          {icon ? <CroppedImageDiv src={icon} className="w-full h-full" /> : <AppGlyph app={a} color="var(--ed-accent)" size={20} />}
                          <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">{busy === `ficon-${a}` ? '…' : '변경'}</span>
                          <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) upload(`ficon-${a}`, f, url => setIcon(url)) }} />
                        </label>
                        {/* 이름 — 입력칸처럼 보이게 (연한 바탕 + 연필) */}
                        <label className="flex-1 min-w-0 h-8 flex items-center gap-1.5 px-2.5 rounded-md border border-transparent focus-within:border-[color:var(--ed-accent)] focus-within:bg-white transition-colors cursor-text" style={{ background: '#F6F4F1' }}>
                          <input className="flex-1 min-w-0 bg-transparent text-[13.5px] outline-none placeholder:text-[color:var(--ed-text)]" maxLength={10} placeholder={APP_META[a].label} value={w.props.appLabels?.[a] ?? ''} onChange={e => setLabel(e.target.value)} aria-label={`${APP_META[a].label} 이름`} />
                          <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden className="shrink-0" style={{ color: 'var(--ed-text-muted)' }}><path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </label>
                        {icon && <button type="button" title="기본 아이콘으로" className="text-[11px] shrink-0 hover:underline" style={{ color: 'var(--ed-text-muted)' }} onClick={() => setIcon(undefined)}>기본</button>}
                        <span className="flex shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                          <button type="button" aria-label="위로" disabled={i === 0} className="inline-flex items-center justify-center w-6 h-7 text-[11px] text-gray-500 hover:text-gray-900 disabled:opacity-20" onClick={() => move(-1)}><ChevronUp size={15} aria-hidden /></button>
                          <button type="button" aria-label="아래로" disabled={i === cur.length - 1} className="inline-flex items-center justify-center w-6 h-7 text-[11px] text-gray-500 hover:text-gray-900 disabled:opacity-20" onClick={() => move(1)}><ChevronDown size={15} aria-hidden /></button>
                          <button type="button" aria-label="폴더에서 빼기" className="w-6 h-7 text-gray-400 hover:text-red-600" onClick={() => toggle(a)}><X size={16} className="mx-auto" aria-hidden /></button>
                        </span>
                      </div>
                    )
                  })}
                </div>
                {all.some(a => !cur.includes(a)) && (
                  <select className={inputCls + ' mt-2 !h-9 text-[13px]'} value="" onChange={e => { if (e.target.value) toggle(e.target.value as PhoneAppId) }} style={{ color: 'var(--ed-accent)' }}>
                    <option value="">+ 앱 넣기</option>
                    {all.filter(a => !cur.includes(a)).map(a => <option key={a} value={a}>{APP_META[a].label}</option>)}
                  </select>
                )}
              </Field>
            </>
          })()}
          {w.type === 'guestbook' && (
            <>
              <Field label="제목 색">
                <ColorRow value={w.props.labelColor} options={['#FFFFFF', '#1F1F1F', '#8A8178', data.phone.accent]} onChange={c => patchWidget(w.id, { props: { labelColor: c } })} />
              </Field>
              <Field label="글 색">
                <ColorRow value={w.props.textColor} options={['#FFFFFF', '#1F1F1F', '#5A5A5A', data.phone.accent]} onChange={c => patchWidget(w.id, { props: { textColor: c } })} />
              </Field>
            </>
          )}
          {w.type === 'guestbook' && w.variant === 1 && (
            <Field label="메모 색">
              <div className="flex gap-2 flex-wrap items-center">
                <button type="button" onClick={() => patchWidget(w.id, { props: { memoColor: 'cycle' } })} title="글마다 바뀜"
                  className={`h-7 px-2.5 rounded-full border text-[11.5px] font-medium ${w.props.memoColor === 'cycle' ? 'border-[color:var(--ed-accent)] ring-1 ring-[color:var(--ed-accent)]' : 'border-[color:var(--ed-border)]'}`}
                  style={{ background: 'linear-gradient(90deg,#FFF1A8,#FFD9DE,#D9ECFF,#DDF2D4)' }}>글마다 바뀜</button>
                <ColorRow value={w.props.memoColor === 'cycle' ? undefined : w.props.memoColor} options={MEMO_COLORS} fallback="#FFF1A8" onChange={c => patchWidget(w.id, { props: { memoColor: c } })} />
              </div>
            </Field>
          )}
          {w.type === 'dday' && w.variant === 4 && (
            <label className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-md border bg-white text-sm" style={{ borderColor: 'var(--ed-border)' }}>
              <span>초까지 보이기</span>
              <input type="checkbox" checked={!w.props.hideSec} onChange={e => patchWidget(w.id, { props: { hideSec: !e.target.checked } })} />
            </label>
          )}
          {w.type === 'intro' && w.variant === 2 && <Field label="문구"><input className={inputCls} maxLength={w.size === 'H' ? 10 : 24} value={w.props.text || ''} placeholder={`${data.groom.firstName || '지훈'} · ${data.bride.firstName || '서연'}`} onChange={e => patchWidget(w.id, { props: { text: e.target.value } })} /></Field>}
          {w.type === 'dday' && <Field label="문구"><input className={inputCls} value={w.props.label || ''} onChange={e => patchWidget(w.id, { props: { label: e.target.value } })} /></Field>}
          {w.type === 'quote' && w.variant === 4 && <>
            <Field label="낱말"><input className={inputCls} value={w.props.label || ''} placeholder="결혼 (結婚)" onChange={e => patchWidget(w.id, { props: { label: e.target.value } })} /></Field>
            <Field label="발음"><input className={inputCls} value={w.props.title || ''} placeholder="[gyeol·hon] noun" onChange={e => patchWidget(w.id, { props: { title: e.target.value } })} /></Field>
          </>}
          {w.type === 'quote' && <Field label={w.variant === 4 ? '뜻풀이 (줄바꿈 가능)' : '문구 (줄바꿈 가능)'}><textarea rows={3} className={inputCls} value={w.props.text || ''} placeholder={w.variant === 6 ? '좋아하는 문장' : undefined} onChange={e => patchWidget(w.id, { props: { text: e.target.value } })} /></Field>}
          {w.type === 'quote' && [0, 1, 2].includes(w.variant) && w.size !== 'S' && (() => {
            const txt = w.props.text || ''
            const mixed = /[가-힣]/.test(txt) && /[A-Za-z]/.test(txt)
            const slider = (label: string, key: 'textScale' | 'latinScale', min: number, max: number) => {
              const v = w.props[key] ?? 1
              return (
                <Field label={`${label} (${Math.round(v * 100)}%)`}>
                  <div className="flex items-center gap-3">
                    <input type="range" min={min} max={max} step={0.05} value={v} onChange={e => patchWidget(w.id, { props: { [key]: Number(e.target.value) } })} className="flex-1 accent-[color:var(--ed-accent)]" aria-label={label} />
                    {w.props[key] !== undefined && <button type="button" className="text-[11px] hover:underline shrink-0" style={{ color: 'var(--ed-text-muted)' }} onClick={() => patchWidget(w.id, { props: { [key]: undefined } })}>기본</button>}
                  </div>
                </Field>
              )
            }
            return <>
              {slider('글자 크기', 'textScale', 0.6, 1.6)}
              {mixed && slider('영문 크기', 'latinScale', 0.6, 1.8)}
            </>
          })()}
          {w.type === 'quote' && w.variant === 6 && <Field label="출처"><input className={inputCls} value={w.props.artist ?? ''} placeholder="생텍쥐페리 (비우면 안 보임)" onChange={e => patchWidget(w.id, { props: { artist: e.target.value } })} /></Field>}
          {w.type === 'quote' && w.variant !== 4 && (
            <Field label="글자 위치">
              <div className="flex gap-1.5 flex-wrap">
                {([['left', '왼쪽'], ['center', '가운데'], ['right', '오른쪽']] as const).map(([v, l]) => <button key={v} type="button" className={pill(w.props.align === v)} onClick={() => patchWidget(w.id, { props: { align: v } })}>{l}</button>)}
              </div>
              <div className="flex gap-1.5 flex-wrap mt-1.5">
                {([['top', '위'], ['middle', '가운데'], ['bottom', '아래']] as const).map(([v, l]) => <button key={v} type="button" className={pill(w.props.valign === v)} onClick={() => patchWidget(w.id, { props: { valign: v } })}>{l}</button>)}
              </div>
            </Field>
          )}
          {w.type === 'todo' && (
            <Field label="목록">
              <textarea rows={3} className={inputCls} value={(w.props.items || []).join('\n')} placeholder={'5월 22일 오후 2:00 비워두기\n더채플앳청담 그랜드볼룸\n축하 한마디 남기기'}
                onChange={e => patchWidget(w.id, { props: { items: e.target.value.split('\n') } })} />
            </Field>
          )}
          {w.type === 'music' && (
            <Field label="음악">
              <div className="flex items-center gap-2">
                <span className="text-sm truncate">{data.bgm?.enabled && data.bgm.url ? (getBgmPresetByUrl(data.bgm.url)?.name || '직접 올린 음악') : '없음'}</span>
                <button type="button" className={pill(false)} onClick={() => { setPanel('bgm'); setSelectedId(null) }}>배경음악 설정</button>
              </div>
            </Field>
          )}
          {w.type === 'music' && <>
            <Field label="노래 제목"><input className={inputCls} value={w.props.title || ''} placeholder="우리의 노래" onChange={e => patchWidget(w.id, { props: { title: e.target.value } })} /></Field>
            <Field label="가수"><input className={inputCls} value={w.props.artist || ''} onChange={e => patchWidget(w.id, { props: { artist: e.target.value } })} /></Field>
          </>}
          {(w.type === 'photo' || w.type === 'music' || (w.type === 'dday' && w.variant === 5)) && (
            <Field label={w.type === 'music' ? (w.variant === 3 ? '디스크 · 앨범 사진' : '앨범 사진') : '사진'}>
              <div className="flex gap-2 items-center">
                {w.props.src && <div className="w-12 h-12 rounded-lg bg-cover bg-center border border-gray-200" style={{ backgroundImage: `url(${w.props.src})` }} />}
                <UploadButton label={w.props.src ? '변경' : w.variant === 4 ? 'PNG 올리기' : '사진 올리기'} busy={busy === w.id} onFile={f => upload(w.id, f, url => { patchWidget(w.id, { props: { src: url, crop: undefined } }); if (w.type === 'photo' && w.variant !== 4) setCropFor({ kind: 'widget', id: w.id }) })} />
                {w.props.src && (w.type === 'photo' || w.type === 'dday') && w.variant !== 4 && <button type="button" className={pill(false)} onClick={() => setCropFor({ kind: 'widget', id: w.id })}>자르기</button>}
                {w.props.src && <button type="button" className={pill(false)} onClick={() => patchWidget(w.id, { props: { src: undefined } })}>삭제</button>}
              </div>
            </Field>
          )}
          {w.type === 'photo' && (
            <label className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-md border bg-white text-sm" style={{ borderColor: 'var(--ed-border)' }}>
              <span>누르면 사진첩 열기</span>
              <input type="checkbox" checked={!!w.props.openAlbum} onChange={e => patchWidget(w.id, { props: { openAlbum: e.target.checked || undefined } })} />
            </label>
          )}
          {w.type === 'photo' && w.variant <= 2 && (
            <label className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-md border bg-white text-sm" style={{ borderColor: 'var(--ed-border)' }}>
              <span>사진첩 사진 넘기기</span>
              <input type="checkbox" checked={!!w.props.slideshow} onChange={e => patchWidget(w.id, { props: { slideshow: e.target.checked } })} />
            </label>
          )}
          {w.type === 'photo' && (w.variant === 1 || w.variant === 3) && (() => {
            const deg = w.props.rotate ?? (w.variant === 1 ? -2 : -5)
            return (
              <Field label="기울기">
                <div className="flex items-center gap-3">
                  <input type="range" min={-15} max={15} step={1} value={deg} onChange={e => patchWidget(w.id, { props: { rotate: Number(e.target.value) } })} className="flex-1 accent-[color:var(--ed-accent)]" aria-label="기울기" />
                  <span className="text-[12px] w-9 text-right tabular-nums" style={{ color: 'var(--ed-text-muted)' }}>{deg}°</span>
                  {deg !== 0 && <button type="button" className="text-[11px] hover:underline" style={{ color: 'var(--ed-text-muted)' }} onClick={() => patchWidget(w.id, { props: { rotate: 0 } })}>반듯하게</button>}
                </div>
              </Field>
            )
          })()}
          {w.type === 'app' && <>
            <Field label="여는 화면">
              <select className={inputCls} value={w.props.app || 'memo'} onChange={e => patchWidget(w.id, { props: { app: e.target.value as PhoneAppId, label: undefined } })}>
                {(Object.keys(APP_META) as PhoneAppId[]).map(a => <option key={a} value={a}>{APP_META[a].label}</option>)}
              </select>
            </Field>
            <Field label="아이콘 이름"><input className={inputCls} value={w.props.label || ''} placeholder={APP_META[w.props.app || 'memo'].label} onChange={e => patchWidget(w.id, { props: { label: e.target.value || undefined } })} /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!w.props.hideLabel} onChange={e => patchWidget(w.id, { props: { hideLabel: e.target.checked } })} />이름 숨기기</label>
            <Field label="아이콘 이미지">
              <div className="flex gap-2 items-center">
                {w.props.src && <div className="w-11 h-11 rounded-xl overflow-hidden border border-gray-200"><CroppedImageDiv src={w.props.src} crop={w.props.crop} className="w-full h-full" /></div>}
                <UploadButton label={w.props.src ? '변경' : '이미지 넣기'} busy={busy === w.id} onFile={async f => {
                  // 투명한 부분이 있는 이미지(PNG 등)면 바탕 없이, 아니면 자르기 창
                  const clear = await hasTransparency(f)
                  upload(w.id, f, url => { patchWidget(w.id, { props: { src: url, crop: undefined, noBg: clear } }); if (!clear) setCropFor({ kind: 'widget', id: w.id }) })
                }} />
                {w.props.src && <button type="button" className={pill(false)} onClick={() => setCropFor({ kind: 'widget', id: w.id })}>자르기</button>}
                {w.props.src && <button type="button" className={pill(false)} onClick={() => patchWidget(w.id, { props: { src: undefined, crop: undefined } })}>삭제</button>}
              </div>
            </Field>
          </>}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button type="button" className="h-10 rounded-xl border bg-white text-[13.5px] font-semibold flex items-center justify-center gap-1.5" style={{ borderColor: 'var(--ed-border)', color: 'var(--ed-text)' }} onClick={() => {
              const spot = nearestFit(data.phone.widgets.filter(x => (x.page || 0) === (w.page || 0)), w.size, w.col, w.row + SIZE_SPAN[w.size].h)
              if (!spot) { flash('빈 칸이 없어요'); return }
              const copyW: PhoneWidget = { ...w, id: newWidgetId(), col: spot.col, row: spot.row, props: { ...w.props } }
              setWidgets(ws => [...ws, copyW]); setSelectedId(copyW.id)
            }}><Copy size={15} aria-hidden />복제</button>
            <button type="button" className="h-10 rounded-xl border text-[13.5px] font-semibold flex items-center justify-center gap-1.5" style={{ borderColor: '#F0D2CD', background: '#FFF8F7', color: '#C24A3E' }} onClick={() => removeWidget(w)}><Trash2 size={15} aria-hidden />삭제</button>
          </div>
        </Section>
      </>
    )
  }

  /** 위젯 고르기 창 — 크기 · 모양을 미리 보고 추가 */
  const draftPanel = (d: NonNullable<typeof draft>) => {
    const meta = widgetMeta(d.type)
    const sample = (variant: number): PhoneWidget => ({ id: 'draft', type: d.type, col: 0, row: 0, size: d.size, variant, props: d.type === 'folder' ? { apps: [...FOLDER_DEFAULT_APPS], label: '우리' } : d.type === 'quote' ? { text: 'forever starts here' } : d.type === 'dday' ? { label: '우리 결혼식까지' } : {} })
    const w = spanW(d.size), h = spanH(d.size)
    const sc = Math.min(1, 132 / w, 92 / h)
    return (
      <Section title={`${meta.label} 추가`}>
        {meta.sizes.length > 1 && (
          <Field label="크기">
            <div className="flex gap-2 flex-wrap">{meta.sizes.map(sz => (
              <button key={sz} type="button" onClick={() => setDraft({ ...d, size: sz, variant: variantHidden(d.type, d.variant, sz) ? firstVariant(d.type, sz) : d.variant })}
                className={`flex flex-col items-center gap-1 px-2.5 py-2 rounded-md border text-xs ${d.size === sz ? 'border-[color:var(--ed-accent)] bg-[color:var(--ed-surface-2)] font-semibold' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                <span className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${SIZE_SPAN[sz].w}, 7px)`, gridAutoRows: '7px' }}>
                  {Array.from({ length: SIZE_SPAN[sz].w * SIZE_SPAN[sz].h }, (_, k) => <i key={k} className="rounded-[2px]" style={{ background: d.size === sz ? 'var(--ed-accent)' : '#D6D3CF' }} />)}
                </span>
                {SIZE_LABEL[sz]}
              </button>
            ))}</div>
          </Field>
        )}
        <Field label="모양">
          <div className="grid grid-cols-2 gap-2">
            {meta.variants.map((v, i) => variantHidden(d.type, i, d.size) ? null : (
              <button key={v} type="button" onClick={() => { if (!dragClick.current) setDraft({ ...d, variant: i }) }}
                onPointerDown={e => startNewDrag(e, { type: d.type, size: d.size, variant: i, label: meta.label })}
                className={`rounded-md border p-2 flex flex-col items-center gap-1.5 ${d.variant === i ? 'border-[color:var(--ed-accent)] bg-[color:var(--ed-surface-2)]' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                <span className="flex items-center justify-center w-full" style={{ height: 96, background: t.bg, borderRadius: 6, overflow: 'hidden' }}>
                  <span style={{ width: w * sc, height: h * sc, position: 'relative', display: 'block' }}>
                    <span style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, transform: `scale(${sc})`, transformOrigin: '0 0', pointerEvents: 'none' }}>
                      <WidgetView w={sample(i)} data={data} t={t} editing />
                    </span>
                  </span>
                </span>
                <span className={`text-[12px] ${d.variant === i ? 'font-semibold' : ''}`}>{v}</span>
              </button>
            ))}
          </div>
        </Field>
        <div className="flex gap-2">
          <button type="button" onClick={() => addWidget(d.type, undefined, d.size, d.variant)} className="flex-1 h-10 rounded-md text-sm font-semibold text-[#F5F0ED]" style={{ background: 'var(--ed-accent)' }}>홈 화면에 추가</button>
          <button type="button" onClick={() => setDraft(null)} className={pill(false) + ' !h-10'}>취소</button>
        </div>
      </Section>
    )
  }

  const people = (role: 'groom' | 'bride', title: string) => {
    const p = data[role]
    const setP = (patch: Partial<PhoneData['groom']>) => update(d => ({ ...d, [role]: { ...d[role], ...patch } }))
    // 성 · 이름 칸 — 예전 데이터(전체 이름만)는 첫 글자를 성으로
    const last = p.lastName ?? (p.firstName != null ? '' : p.name.slice(0, 1))
    const first = p.firstName ?? p.name.slice(1)
    const setName = (l: string, f: string) => setP({ lastName: l, firstName: f, name: `${l.trim()}${f.trim()}` })
    return (
      <div className={`space-y-2.5 ${role === 'bride' ? 'pt-4 border-t' : ''}`} style={{ borderColor: 'var(--ed-border)' }}>
        <h4 className="text-[13px] font-semibold" style={{ color: 'var(--ed-accent)' }}>{title}</h4>
        <div className="grid grid-cols-[88px_1fr] gap-2">
          <Field label="성 *"><input className={inputCls + (infoErr && !p.name.trim() ? ' !border-red-400' : '')} placeholder={role === 'groom' ? '한' : '윤'} value={last} onChange={e => setName(e.target.value, first)} /></Field>
          <Field label="이름 *"><input className={inputCls + (infoErr && !p.name.trim() ? ' !border-red-400' : '')} placeholder={role === 'groom' ? '지훈' : '서연'} value={first} onChange={e => setName(last, e.target.value)} /></Field>
        </div>
        <Field label="영문 이름"><input className={inputCls} placeholder={role === 'groom' ? 'Jihoon' : 'Seoyeon'} value={p.nameEn || ''} onChange={e => setP({ nameEn: e.target.value })} /></Field>
        <Field label="연락처 *"><input className={inputCls + (infoErr && (p.phone || '').replace(/\D/g, '').length < 9 ? ' !border-red-400' : '')} type="tel" inputMode="numeric" placeholder="010-0000-0000" value={p.phone || ''} onChange={e => setP({ phone: formatPhone(e.target.value) })} /></Field>
      </div>
    )
  }

  /** 화면 디자인 고르기 — 비우면 기본값(★) */
  const designPick = (key: 'memoStyle' | 'storyStyle' | 'giftStyle' | 'callStyle' | 'albumStyle' | 'rsvpStyle' | 'guestbookStyle' | 'introStyle' | 'letterStyle', app: PhoneAppId, opts: readonly (readonly [string, string, string])[]) => {
    const cur = (data.phone[key] as string | undefined) || SCREEN_DEFAULTS[app]
    const glassy = cur === 'invite' || (app === 'story' && ['cards', 'timeline', 'essay'].includes(cur))
    const photoPick = glassy || (app === 'guestbook' && ['post', 'notify'].includes(cur))
    return (
      <>
        <Field label="디자인">
          <div className="grid grid-cols-2 gap-2">
            {opts.map(([v, l]) => (
              <button key={v} type="button" onClick={() => setPhone({ [key]: v } as Partial<PhoneData['phone']>)} className={choiceCls(cur === v) + ' !py-2.5'} title={opts.find(o => o[0] === v)?.[2] || undefined}>
                <span className="block">{l}</span>
              </button>
            ))}
          </div>
        </Field>
        {photoPick && (() => {
          const own = data.phone.screenPhotos?.[app]
          const setOwn = (v: { src: string; crop?: PhoneAvatarFields['avatarCrop'] } | undefined) => setPhone({ screenPhotos: { ...data.phone.screenPhotos, [app]: v } })
          const pickable = Array.from(new Set([data.phone.wallpaper, ...data.gallery.images].filter(Boolean))).slice(0, 11)
          return (
            <Field label="사진">
              <div className="flex gap-1.5 flex-wrap items-center">
                <button type="button" onClick={() => setOwn(undefined)} className={`h-11 px-2.5 rounded-md border text-[12px] ${!own ? 'border-[color:var(--ed-accent)] ring-1 ring-[color:var(--ed-accent)] bg-white font-semibold' : 'border-[color:var(--ed-border)]'}`}>대표 사진</button>
                {pickable.map(src => (
                  <button key={src} type="button" aria-label="이 사진 쓰기" onClick={() => { setOwn({ src }); setCropFor({ kind: 'screen', app }) }}
                    className={`w-11 h-11 rounded-md bg-cover bg-center border ${own?.src === src ? 'ring-2 ring-[color:var(--ed-accent)] border-white' : 'border-[color:var(--ed-border)]'}`} style={{ backgroundImage: `url(${src})` }} />
                ))}
                <UploadButton label="+ 올리기" busy={busy === `screen-${app}`} onFile={f => upload(`screen-${app}`, f, url => { setOwn({ src: url }); setCropFor({ kind: 'screen', app }) })} />
              </div>
              {own && <button type="button" className="text-xs hover:underline mt-1.5" style={{ color: 'var(--ed-text-muted)' }} onClick={() => setCropFor({ kind: 'screen', app })}>자르기</button>}
            </Field>
          )
        })()}
        {glassy && (
          <Field label="유리 카드 색">
            <div className="flex gap-1.5">
              {([['dark', '검정'], ['light', '흰색']] as const).map(([v, l]) => (
                <button key={v} type="button" className={pill((data.phone.glassTone || 'dark') === v)} onClick={() => setPhone({ glassTone: v })}>{l}</button>
              ))}
            </div>
          </Field>
        )}
      </>
    )
  }

  /** 연락처 동그라미 고르기 — 성 · 이모지 · 사진 */
  const avatarPick = (a: PhoneAvatarFields, initial: string, set: (patch: PhoneAvatarFields) => void, uploadKey: string, onCrop: () => void) => {
    const kind = a.avatarKind || 'initial'
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-sm font-semibold text-white" style={{ background: kind === 'emoji' && a.avatarEmoji ? 'transparent' : 'var(--ed-accent)' }}>
          {kind === 'photo' && a.avatarPhoto
            ? <button type="button" title="자르기" onClick={onCrop} className="w-full h-full"><CroppedImageDiv src={a.avatarPhoto} crop={a.avatarCrop} className="w-full h-full" /></button>
            : kind === 'emoji' && a.avatarEmoji ? <span className="text-2xl leading-none">{a.avatarEmoji}</span> : initial}
        </span>
        {([['initial', '성'], ['emoji', '이모지'], ['photo', '사진']] as const).map(([v, l]) => (
          <button key={v} type="button" className={pill(kind === v)} onClick={() => set({ avatarKind: v })}>{l}</button>
        ))}
        {kind === 'emoji' && (
          <div className="flex gap-1 w-full flex-wrap">
            {AVATAR_EMOJIS.map(em => (
              <button key={em} type="button" className={`w-8 h-8 rounded-md border text-base ${a.avatarEmoji === em ? 'border-[color:var(--ed-accent)] bg-white' : 'border-[color:var(--ed-border)]'}`} onClick={() => set({ avatarEmoji: em })}>{em}</button>
            ))}
            <input className={inputCls + ' !w-14 !px-2 text-center'} placeholder="직접" maxLength={4} value={a.avatarEmoji && !AVATAR_EMOJIS.includes(a.avatarEmoji) ? a.avatarEmoji : ''} onChange={e => set({ avatarEmoji: e.target.value })} />
          </div>
        )}
        {kind === 'photo' && !a.avatarPhoto && <UploadButton label="사진 올리기" busy={busy === uploadKey} onFile={f => upload(uploadKey, f, url => { set({ avatarPhoto: url, avatarCrop: undefined }); onCrop() })} />}
        {kind === 'photo' && a.avatarPhoto && <button type="button" className="text-xs hover:underline" style={{ color: 'var(--ed-text-muted)' }} onClick={() => set({ avatarPhoto: undefined, avatarCrop: undefined })}>사진 삭제</button>}
      </div>
    )
  }
  /** 연락하기 — 신랑/신부 동그라미 + 가족 */
  const contactEditor = (side: 'groom' | 'bride') => {
    const p = data[side]
    const role = side === 'groom' ? '신랑' : '신부'
    const setP = (patch: Partial<PhoneData['groom']>) => update(d => ({ ...d, [side]: { ...d[side], ...patch } }))
    const fam = p.family || []
    const setF = (i: number, patch: Partial<PhoneFamily>) => setP({ family: fam.map((f, j) => (j === i ? { ...f, ...patch } : f)) })
    return (
      <div key={side} className={`space-y-3 ${side === 'bride' ? 'pt-4 border-t' : ''}`} style={{ borderColor: 'var(--ed-border)' }}>
        <h4 className="text-[13px] font-semibold" style={{ color: 'var(--ed-accent)' }}>{role} {p.name}</h4>
        <Field label="프로필">{avatarPick(p, (p.lastName || p.name || role).slice(0, 1), setP, `avatar-${side}`, () => setCropFor({ kind: 'avatar', side, i: null }))}</Field>
        {/* 번호 — 결혼식 정보의 '연락처'와 같은 값 (여기서 고쳐도 같이 바뀜) */}
        <Field label="연락처"><input className={inputCls} type="tel" inputMode="numeric" placeholder="010-0000-0000" value={p.phone || ''} onChange={e => setP({ phone: formatPhone(e.target.value) })} /></Field>
        {fam.map((f, i) => (
          <div key={i} className="space-y-2 p-2.5 rounded-md border" style={{ borderColor: 'var(--ed-border)' }}>
            <div className="grid grid-cols-[84px_1fr_auto] gap-1.5 items-center">
              <input className={inputCls + ' !px-2'} placeholder="관계" value={f.relation} onChange={e => setF(i, { relation: e.target.value })} />
              <input className={inputCls + ' !px-2'} placeholder="이름" value={f.name} onChange={e => setF(i, { name: e.target.value })} />
              <button type="button" aria-label="지우기" className="text-gray-400 hover:text-red-600 px-1" onClick={() => setP({ family: fam.filter((_, j) => j !== i) })}><X size={16} className="mx-auto" aria-hidden /></button>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
              <input className={inputCls + ' !px-2'} type="tel" inputMode="numeric" placeholder={f.deceased ? '' : '010-0000-0000'} disabled={f.deceased} value={f.deceased ? '' : f.phone || ''} onChange={e => setF(i, { phone: formatPhone(e.target.value) })} />
              <label className="flex items-center gap-1.5 text-[13px]"><input type="checkbox" checked={!!f.deceased} onChange={e => setF(i, { deceased: e.target.checked })} />고인</label>
            </div>
            {!f.deceased && avatarPick(f, f.name.slice(0, 1) || '·', patch => setF(i, patch), `avatar-${side}-${i}`, () => setCropFor({ kind: 'avatar', side, i }))}
          </div>
        ))}
        <div className="flex gap-1.5 flex-wrap">
          {['아버지', '어머니'].filter(r => !fam.some(f => f.relation === r)).map(r => (
            <button key={r} type="button" className={pill(false)} onClick={() => setP({ family: [...fam, { relation: r, name: '' }] })}>+ {r}</button>
          ))}
          <button type="button" className={pill(false)} onClick={() => setP({ family: [...fam, { relation: '', name: '' }] })}>+ 가족</button>
        </div>
      </div>
    )
  }

  /** 화면 위 작은 제목 · 큰 제목 — 디자인마다 기본 글이 달라 placeholder 로 보여 줌 */
  /** 컬러 스타일 고르기 — 잠금화면 · 홈 화면 패널 둘 다 (같은 색 조합) */
  const colorMoodPicker = () => (
          <Field label="컬러 스타일">
            <div className="grid grid-cols-3 gap-2">
              {COLOR_MOODS.map(m => {
                const on = m.glass ? data.phone.theme === 'glass' && data.phone.iconStyle === 'glass' : data.phone.theme !== 'glass' && data.phone.homeBgColor === m.bg && data.phone.cardColor === m.card && data.phone.accent === m.accent
                const apply = () => setPhone(m.glass
                  ? { theme: 'glass', iconStyle: 'glass', homeBlur: Math.max(28, data.phone.homeBlur || 0), homeDim: -18, lockStyle: 'photo', lockClockColor: m.clock, lockTextColor: m.text }
                  : { theme: 'white', homeBgColor: m.bg, cardColor: m.card, barColor: m.bar, accent: m.accent, iconStyle: 'accent', lockBg: m.bg, lockClockColor: m.clock, lockTextColor: m.text })
                return (
                  <button key={m.id} type="button" onClick={apply} className={choiceCls(on) + ' !p-1.5'}>
                    <span className="block h-12 rounded-md relative overflow-hidden border border-black/5" style={{ background: m.glass ? 'linear-gradient(160deg,#B8B0A6,#6E665E)' : m.bg }}>
                      <span className="absolute left-1/2 -translate-x-1/2 top-1 text-[10px] font-semibold leading-none tracking-tight" style={{ color: m.clock }}>14:00</span>
                      <span className="absolute left-1.5 top-[18px] w-5 h-5 rounded" style={{ background: m.card, backdropFilter: m.glass ? 'blur(4px)' : undefined }} />
                      <span className="absolute left-8 top-[18px] w-3 h-3 rounded-[3px]" style={{ background: m.accent }} />
                      <span className="absolute left-1 right-1 bottom-1 h-2 rounded-sm" style={{ background: m.bar }} />
                    </span>
                    <span className="text-xs font-semibold block mt-1 text-center">{m.label}</span>
                  </button>
                )
              })}
            </div>
          </Field>
  )

  const screenTextFields = (app: PhoneAppId) => {
    const st = (data.phone as Record<string, unknown>)[`${app}Style`] as string | undefined || SCREEN_DEFAULTS[app]
    const nm = `${data.groom.name || '신랑'} · ${data.bride.name || '신부'}`
    const d = ({
      album: { photos: { eyebrow: 'GALLERY', title: '보관함' }, memories: { eyebrow: 'MEMORIES', title: '추억' }, invite: { title: 'Gallery' } },
      call: { chats: { eyebrow: 'MESSAGES', title: '메시지' }, invite: { title: 'Contact' } },
      rsvp: { calendar: { eyebrow: 'RSVP', title: `${nm} 결혼식` } },
      memo: { tiles: { eyebrow: 'THE WEDDING', title: '예식 안내' } },
      guestbook: { board: { eyebrow: 'GUESTBOOK' } },
      video: { tube: { title: '우리 영상' } },
      letter: { mail: { title: '초대의 글', eyebrow: `${givenFirst(data.groom)} · ${givenFirst(data.bride)}의 편지` }, hand: { title: '초대의 글', eyebrow: `${givenFirst(data.groom)} · ${givenFirst(data.bride)}의 편지` } },
      intro: { settings: { eyebrow: 'ABOUT US', title: '두 사람 이름' }, card: { eyebrow: 'ABOUT US', title: '두 사람 이름' }, quiz: { eyebrow: 'COUPLE QUIZ', title: '지훈 · 서연 퀴즈' } },
    } as Record<string, Record<string, { eyebrow?: string; title?: string }>>)[app]?.[st]
    if (!d) return null
    const cur = data.phone.screenText?.[app] || {}
    const set = (k: 'eyebrow' | 'title', v: string) => setPhone({ screenText: { ...data.phone.screenText, [app]: { ...cur, [k]: v } } })
    return (
      <div className={d.eyebrow && d.title && app !== 'letter' ? 'grid grid-cols-[1fr_1.4fr] gap-2' : 'space-y-2'}>
        {d.eyebrow && <Field label={app === 'letter' ? '제목 아래 글' : '작은 제목'}><input className={inputCls} placeholder={d.eyebrow} value={cur.eyebrow || ''} onChange={e => set('eyebrow', e.target.value)} /></Field>}
        {d.title && <Field label="화면 제목"><input className={inputCls} placeholder={d.title} value={cur.title || ''} onChange={e => set('title', e.target.value)} /></Field>}
      </div>
    )
  }

  /** 홈 바탕 사진 밝기 */
  const homeDimField = (def: number) => {
    const v = data.phone.homeDim ?? def
    return (
      <>
      <Field label="사진 밝기">
        <div className="flex items-center gap-3">
          <span className="text-[11px] shrink-0" style={{ color: 'var(--ed-text-muted)' }}>어둡게</span>
          <input type="range" min={-60} max={90} step={2} value={v} onChange={e => setPhone({ homeDim: Number(e.target.value) })} className="flex-1 accent-[color:var(--ed-accent)]" aria-label="사진 밝기" />
          <span className="text-[11px] shrink-0" style={{ color: 'var(--ed-text-muted)' }}>밝게</span>
          {data.phone.homeDim !== undefined && <button type="button" className="text-[11px] hover:underline shrink-0" style={{ color: 'var(--ed-text-muted)' }} onClick={() => setPhone({ homeDim: undefined })}>기본</button>}
        </div>
      </Field>
      <Field label="가우시안 흐림 효과">
        <div className="flex items-center gap-3">
          <input type="range" min={0} max={40} step={1} value={data.phone.homeBlur ?? 0} onChange={e => setPhone({ homeBlur: Number(e.target.value) || undefined })} className="flex-1 accent-[color:var(--ed-accent)]" aria-label="가우시안 흐림 효과" />
          <span className="text-[11px] shrink-0 w-[24px] text-right tabular-nums" style={{ color: 'var(--ed-text-muted)' }}>{data.phone.homeBlur ?? 0}</span>
        </div>
      </Field>
      </>
    )
  }

  /** 홈 바탕 사진 — 커스텀 · 글래스가 같은 사진을 씀 (테마를 바꿔도 그대로) */
  const homePhotoField = () => (
    <Field label="바탕 사진">
      <div className="flex gap-2 items-center flex-wrap">
        {data.phone.homeImage && (
          <button type="button" onClick={() => setCropFor({ kind: 'home' })} title="자르기" className="w-10 h-14 rounded-md overflow-hidden border border-gray-200 shrink-0">
            <CroppedImageDiv src={data.phone.homeImage} crop={data.phone.homeImageCrop} className="w-full h-full" />
          </button>
        )}
        {data.phone.homeImage && <button type="button" className={pill(false)} onClick={() => setCropFor({ kind: 'home' })}>자르기</button>}
        {!data.phone.homeImage && t.homeBg === 'photo' && <span className="text-[12px]" style={{ color: 'var(--ed-text-muted)' }}>대표 사진을 쓰는 중</span>}
      <UploadButton label={data.phone.homeImage ? '변경' : '사진 올리기'} busy={busy === 'home'}
          onFile={f => upload('home', f, url => { setPhone({ homeImage: url, homeImageCrop: undefined }); setCropFor({ kind: 'home' }) })} />
        {data.phone.homeImage && <button type="button" className={pill(false)} onClick={() => setPhone({ homeImage: undefined, homeImageCrop: undefined })}>삭제</button>}
      </div>
    </Field>
  )

  /** 화면 쓰기 · 안 쓰기 (우리 이야기 · 마음 전하기 · 연락하기 · 사진첩) */
  const appToggle = (app: 'story' | 'gift' | 'call' | 'album' | 'guestbook' | 'intro' | 'video' | 'camera' | 'letter') => {
    const on = !data.phone.hiddenApps?.includes(app)
    return (
      <div className="flex justify-end">
        <button type="button" role="switch" aria-checked={on} aria-label={`${APP_META[app].label} ${on ? '끄기' : '켜기'}`}
          onClick={() => setPhone({ hiddenApps: on ? [...(data.phone.hiddenApps || []), app] : (data.phone.hiddenApps || []).filter(x => x !== app) })}
          className="relative h-7 w-[58px] rounded-full text-[11px] font-bold transition-colors" style={{ background: on ? 'var(--ed-accent)' : '#D9D5D0', color: '#FFFFFF' }}>
          <span className="absolute top-1/2 -translate-y-1/2" style={on ? { left: 9 } : { right: 8 }}>{on ? 'ON' : 'OFF'}</span>
          <span className="absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white shadow transition-all" style={{ left: on ? 33 : 3 }} />
        </button>
      </div>
    )
  }

  const screenPanel = () => {
    if (screen === 'story') return (
      <Section title="우리 이야기">
        {appToggle('story')}
        <Field label="제목"><input className={inputCls} value={data.phone.storyTitle ?? ''} placeholder="Our Story" onChange={e => setPhone({ storyTitle: e.target.value })} /></Field>
        {designPick('storyStyle', 'story', [['journal', '저널', '날짜별 기록 카드'], ['playlist', '플레이리스트', '이야기마다 노래 한 곡'], ['feed', '피드', 'SNS 게시물처럼'], ['cards', '사진 카드', '흐린 사진 위 카드'], ['stories', '스토리 넘기기', '사진 한 장씩 넘겨 보기'], ['timeline', '타임라인', '날짜 순서대로'], ['essay', '줄글 에세이', '긴 글 한 편']])}
        {(() => {
          const story = data.phone.story
          type Item = PhoneData['phone']['story'][number]
          const setItem = (i: number, patch: Partial<Item>) => setPhone({ story: story.map((x, j) => (j === i ? { ...x, ...patch } : x)) })
          const del = (i: number) => setPhone({ story: story.filter((_, j) => j !== i) })
          // 제목 하나 + 그 아래 글들을 한 묶음으로
          const groups: { head: number | null; lines: number[] }[] = []
          story.forEach((m, i) => {
            if (m.side === 'date') groups.push({ head: i, lines: [] })
            else if (groups.length) groups[groups.length - 1].lines.push(i)
            else groups.push({ head: null, lines: [i] })
          })
          const range = (g: { head: number | null; lines: number[] }) => {
            const all = [...(g.head !== null ? [g.head] : []), ...g.lines]
            return [Math.min(...all), Math.max(...all) + 1] as const
          }
          const insertAt = (at: number, item: Item) => setPhone({ story: [...story.slice(0, at), item, ...story.slice(at)] })
          const delGroup = (gi: number) => { const [from, to] = range(groups[gi]); setPhone({ story: [...story.slice(0, from), ...story.slice(to)] }) }
          const moveGroup = (gi: number, dir: -1 | 1) => {
            const other = gi + dir
            if (other < 0 || other >= groups.length) return
            const [a0, a1] = range(groups[Math.min(gi, other)])
            const [b0, b1] = range(groups[Math.max(gi, other)])
            setPhone({ story: [...story.slice(0, a0), ...story.slice(b0, b1), ...story.slice(a0, a1), ...story.slice(b1)] })
          }
          const moveLine = (g: { lines: number[] }, k: number, dir: -1 | 1) => {
            const i = g.lines[k], j = g.lines[k + dir]
            if (j === undefined) return
            setPhone({ story: story.map((x, n) => (n === i ? story[j] : n === j ? story[i] : x)) })
          }
          const iconBtn = 'w-7 h-7 shrink-0 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center disabled:opacity-30 disabled:hover:bg-transparent'
          const arrows = (up: () => void, down: () => void, first: boolean, last: boolean) => (
            <>
              <button type="button" aria-label="위로" disabled={first} className={iconBtn} onClick={up}>
                <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button type="button" aria-label="아래로" disabled={last} className={iconBtn} onClick={down}>
                <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </>
          )
          const x = (onClick: () => void) => <button type="button" aria-label="지우기" className="w-7 h-7 shrink-0 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center" onClick={onClick}><X size={16} className="mx-auto" aria-hidden /></button>
          return (
            <div className="space-y-4">
              {groups.map((g, gi) => {
                const m = g.head !== null ? story[g.head] : null
                const hi = g.head
                const end = range(g)[1]
                return (
                  <div key={`${gi}-${hi ?? 'top'}`} className="rounded-lg border bg-white p-3 space-y-3" style={{ borderColor: 'var(--ed-border)' }}>
                    {m && hi !== null ? (
                      <>
                        <div className="flex items-center gap-1">
                          <input className={inputCls + ' flex-1 font-semibold'} placeholder="처음 만난 날" value={m.text} onChange={e => setItem(hi, { text: e.target.value })} />
                          {groups.length > 1 && arrows(() => moveGroup(gi, -1), () => moveGroup(gi, 1), gi === 0 || groups[gi - 1].head === null, gi === groups.length - 1)}
                          {x(() => delGroup(gi))}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <input type="date" aria-label="날짜" className={inputCls + ' !w-[150px] !py-1.5 text-xs'} value={m.date || ''} onChange={e => setItem(hi, { date: e.target.value || undefined })} />
                          {([!m.src && m.src2 ? 'src2' : 'src'] as const).map(k => (
                            <span key={k} className="flex items-center gap-1">
                              {m[k] && <span className="relative">
                                <button type="button" title="자르기" onClick={() => setCropFor({ kind: 'story', i: hi, k })} className="block w-9 h-9 rounded-md overflow-hidden border border-gray-200">
                                  <CroppedImageDiv src={m[k]!} crop={k === 'src' ? m.srcCrop : m.src2Crop} className="w-full h-full" />
                                </button>
                                <button type="button" aria-label="사진 삭제" className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-black/60 text-white text-[10px] leading-4" onClick={() => setItem(hi, { [k]: undefined, [k === 'src' ? 'srcCrop' : 'src2Crop']: undefined })}><X size={16} className="mx-auto" aria-hidden /></button>
                              </span>}
                              {!m[k] && <UploadButton label="+ 사진" busy={busy === `story${hi}${k}`} onFile={f => upload(`story${hi}${k}`, f, url => { setItem(hi, { [k]: url, [k === 'src' ? 'srcCrop' : 'src2Crop']: undefined }); setCropFor({ kind: 'story', i: hi, k }) })} />}
                            </span>
                          ))}
                        </div>
                      </>
                    ) : <span className="text-[12px] font-medium block" style={{ color: 'var(--ed-text-muted)' }}>제목 없는 글</span>}
                    {g.lines.map((i, k) => {
                      const l = story[i]
                      return (
                        <div key={i} className="pl-3 border-l-2 space-y-1.5" style={{ borderColor: 'var(--ed-border)' }}>
                          <div className="flex items-center justify-between">
                            <div className="flex gap-1">
                              {([['p', '문단'], ['a', '신랑'], ['b', '신부']] as const).map(([v, lb]) => (
                                <button key={v} type="button" onClick={() => setItem(i, { side: v })}
                                  className={`px-2 py-0.5 rounded-md text-[11px] ${l.side === v ? 'bg-[color:var(--ed-accent)] text-[#F5F0ED]' : 'text-gray-500 hover:bg-gray-100'}`}>{lb}</button>
                              ))}
                            </div>
                            <div className="flex items-center">
                              {g.lines.length > 1 && arrows(() => moveLine(g, k, -1), () => moveLine(g, k, 1), k === 0, k === g.lines.length - 1)}
                              {x(() => del(i))}
                            </div>
                          </div>
                          <textarea rows={l.side === 'p' ? 4 : 2} className={inputCls} placeholder={l.side === 'p' ? '그날의 이야기' : '그때 한 말'} value={l.text} onChange={e => setItem(i, { text: e.target.value })} />
                        </div>
                      )
                    })}
                    <div className="flex gap-1.5 flex-wrap">
                      {([['p', '문단'], ['a', '신랑 말'], ['b', '신부 말']] as const).map(([v, lb]) => (
                        <button key={v} type="button" className={pill(false)} onClick={() => insertAt(end, { side: v, text: '' })}>+ {lb}</button>
                      ))}
                    </div>
                  </div>
                )
              })}
              <button type="button" className="w-full py-2.5 rounded-lg border border-dashed text-[13px] font-medium hover:bg-white/60" style={{ borderColor: 'var(--ed-border)', color: 'var(--ed-accent)' }}
                onClick={() => setPhone({ story: [...story, { side: 'date', text: '' }, { side: 'p', text: '' }] })}>+ 이야기 추가</button>
            </div>
          )
        })()}
      </Section>
    )
    if (screen === 'memo') return (
      <Section title="예식 안내">
        {designPick('memoStyle', 'memo', [['mappass', '지도 탑승권', '지도 아래 티켓'], ['invite', '초대장 첫 화면', '대표 사진과 이름'], ['map', '지도', '지도와 장소 목록'], ['pass', '탑승권', '티켓 한 장'], ['tiles', '위젯 모음', '정보를 칸칸이']])}
        {screenTextFields('memo')}
        {(['map', 'mappass'].includes(data.phone.memoStyle || SCREEN_DEFAULTS.memo)) && (
          <Field label="지도">
            <div className="flex gap-1.5">
              {([['kakao', '카카오맵'], ['google', '구글 지도']] as const).map(([v2, l]) => <button key={v2} type="button" className={pill((data.phone.mapProvider === 'google' ? 'google' : 'kakao') === v2)} onClick={() => setPhone({ mapProvider: v2 })}>{l}</button>)}
            </div>
          </Field>
        )}
        <Field label="인사말"><textarea rows={4} className={inputCls + ' resize-y leading-relaxed'} value={data.phone.greeting || ''} onChange={e => setPhone({ greeting: e.target.value })} /></Field>
        {/* 날짜 · 장소는 '결혼식 정보'에서 — 여기서는 요약만 */}
        <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-md border bg-white" style={{ borderColor: 'var(--ed-border)' }}>
          <div className="min-w-0 text-[13px] leading-relaxed">
            <div className="truncate font-medium">{[data.wedding.venue.name, data.wedding.venue.hall].filter(Boolean).join(' ') || '예식장 미입력'}</div>
            <div className="truncate" style={{ color: 'var(--ed-text-muted)' }}>{[data.wedding.date, data.wedding.timeDisplay].filter(Boolean).join(' · ') || '예식일 미입력'}</div>
          </div>
          <button type="button" className="text-[12px] font-medium shrink-0 hover:underline" style={{ color: 'var(--ed-accent)' }} onClick={() => { setPanel('info'); setScreenRaw('home') }}>수정</button>
        </div>
        <Field label="오시는 길">
          <div className="space-y-2">
            {(data.phone.directions || []).map((x, i) => (
              <div key={i} className="flex gap-2 items-start">
                <select className={inputCls + ' !w-[88px] shrink-0'} value={x.kind} onChange={e => setPhone({ directions: (data.phone.directions || []).map((y, j) => (j === i ? { ...y, kind: e.target.value as typeof x.kind } : y)) })}>
                  <option value="subway">지하철</option><option value="bus">버스</option><option value="car">자가용</option><option value="parking">주차</option><option value="etc">기타</option>
                </select>
                <textarea rows={2} className={inputCls} value={x.text} placeholder={{ subway: '2호선 선릉역 1번 출구 도보 5분', bus: '선릉역 정류장 하차', car: '내비게이션에 예식장 이름 검색', parking: '건물 지하 B2~B4, 2시간 무료', etc: '' }[x.kind]}
                  onChange={e => setPhone({ directions: (data.phone.directions || []).map((y, j) => (j === i ? { ...y, text: e.target.value } : y)) })} />
                <button type="button" aria-label="지우기" className="text-gray-400 hover:text-red-600 px-1 pt-2" onClick={() => setPhone({ directions: (data.phone.directions || []).filter((_, j) => j !== i) })}><X size={16} className="mx-auto" aria-hidden /></button>
              </div>
            ))}
            <div className="flex gap-1.5 flex-wrap">
              {([['subway', '지하철'], ['bus', '버스'], ['car', '자가용'], ['parking', '주차']] as const).map(([k, l]) => (
                <button key={k} type="button" className={pill(false)} onClick={() => setPhone({ directions: [...(data.phone.directions || []), { kind: k, text: '' }] })}>+ {l}</button>
              ))}
            </div>
          </div>
        </Field>
        <span className="text-[12px] font-medium block" style={{ color: 'var(--ed-text-muted)' }}>안내 사항</span>
        {data.phone.memo.map((m, i) => (
          <div key={i} className="flex gap-2 items-start">
            {/* 줄바꿈 가능 — 쓴 만큼 칸이 늘어남 */}
            <textarea rows={Math.max(2, m.split(/\n/).length + (m.length > 40 ? 1 : 0))} className={inputCls + ' resize-y leading-relaxed'} value={m} onChange={e => setPhone({ memo: data.phone.memo.map((x, j) => (j === i ? e.target.value : x)) })} />
            <button type="button" aria-label="지우기" className="text-gray-400 hover:text-red-600 px-1" onClick={() => setPhone({ memo: data.phone.memo.filter((_, j) => j !== i) })}><X size={16} className="mx-auto" aria-hidden /></button>
          </div>
        ))}
        <button type="button" className={pill(false)} onClick={() => setPhone({ memo: [...data.phone.memo, ''] })}>+ 안내</button>
      </Section>
    )
    if (screen === 'gift') return (
      <Section title="마음 전하기">
        {appToggle('gift')}
        {designPick('giftStyle', 'gift', [['mail', '메일', '두 사람이 보낸 편지'], ['invite', '유리 시트', '사진 위 계좌 목록']])}
        <Field label="제목"><input className={inputCls} value={data.phone.giftTitle ?? ''} placeholder={GIFT_TITLE} onChange={e => setPhone({ giftTitle: e.target.value })} /></Field>
        <Field label="글"><textarea rows={4} className={inputCls} value={data.phone.giftMessage ?? GIFT_MESSAGE} onChange={e => setPhone({ giftMessage: e.target.value })} /></Field>
        {(['groom', 'bride'] as const).map(role => (
          <div key={role} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium" style={{ color: 'var(--ed-text-muted)' }}>{role === 'groom' ? '신랑 측 계좌' : '신부 측 계좌'}</span>
              <button type="button" className="text-[12px] font-medium hover:underline" style={{ color: 'var(--ed-accent)' }} onClick={() => update(d => ({ ...d, [role]: { ...d[role], accounts: [...d[role].accounts, d[role].accounts.length ? { bank: '', number: '', holder: '', relation: '' } : { bank: '', number: '', holder: d[role].name, relation: role === 'groom' ? '신랑' : '신부' }] } }))}>+ 추가</button>
            </div>
            <datalist id={`rel-${role}`}>{[role === 'groom' ? '신랑' : '신부', '아버지', '어머니', '할아버지', '할머니', '형제', '자매'].map(r => <option key={r} value={r} />)}</datalist>
            {data[role].accounts.length === 0 && <p className="text-[12px] py-2.5 text-center rounded-md border border-dashed" style={{ color: 'var(--ed-text-faint)', borderColor: 'var(--ed-border)' }}>없음</p>}
            {data[role].accounts.map((a, i) => (
              <div key={i} className="grid grid-cols-[84px_1fr_auto] gap-1.5 p-2 rounded-md border" style={{ borderColor: 'var(--ed-border)' }}>
                {(() => {
                  const setA = (patch: Partial<typeof a>) => update(d => ({ ...d, [role]: { ...d[role], accounts: d[role].accounts.map((x, j) => (j === i ? { ...x, ...patch } : x)) } }))
                  return <>
                    {/* 호칭 — 고르거나 직접 적기 */}
                    <input className={inputCls + ' !px-2'} list={`rel-${role}`} placeholder="호칭" value={a.relation || ''} onChange={e => setA({ relation: e.target.value })} />
                    <input className={inputCls + ' !px-2'} placeholder="예금주" value={a.holder} onChange={e => setA({ holder: e.target.value })} />
                    <button type="button" aria-label="지우기" className="text-gray-400 hover:text-red-600 px-1" onClick={() => update(d => ({ ...d, [role]: { ...d[role], accounts: d[role].accounts.filter((_, j) => j !== i) } }))}><X size={16} className="mx-auto" aria-hidden /></button>
                    <input className={inputCls + ' !px-2'} placeholder="은행" value={a.bank} onChange={e => setA({ bank: e.target.value })} />
                    <input className={inputCls + ' !px-2 col-span-2'} inputMode="numeric" placeholder="계좌번호" value={a.number} onChange={e => setA({ number: e.target.value })} />
                  </>
                })()}
              </div>
            ))}
          </div>
        ))}
      </Section>
    )
    if (screen === 'album') return (
      <Section title="사진첩">
        {appToggle('album')}
        {designPick('albumStyle', 'album', [['photos', '보관함', '사진 바둑판'], ['memories', '추억', '추억 앨범처럼'], ['invite', '흐린 배경', '흐린 사진 위 바둑판']])}
        {screenTextFields('album')}
        {(() => {
          // 폴더 — 처음엔 갤러리 사진 전체가 한 폴더
          const folders = data.phone.albumFolders?.length ? data.phone.albumFolders : [{ name: '', images: data.gallery.images }]
          const total = folders.reduce((n, f) => n + f.images.length, 0)
          const save = (next: { name: string; images: string[] }[]) => update(d => ({ ...d, gallery: { ...d.gallery, images: next.flatMap(f => f.images) }, phone: { ...d.phone, albumFolders: next } }))
          const addFiles = async (fi: number, fs: File[]) => {
            const room = ALBUM_MAX - total
            if (room <= 0) { flash(`사진은 ${ALBUM_MAX}장까지 넣을 수 있어요`); return }
            if (fs.length > room) flash(`${ALBUM_MAX}장까지라 ${room}장만 올려요`)
            setBusy(`album${fi}`)
            try {
              for (const f of fs.slice(0, room)) {
                const r = await uploadImage(f, { invitationId: invitationId || undefined })
                if (r.success && r.webUrl) {
                  const url = r.webUrl
                  update(d => {
                    const cur = d.phone.albumFolders?.length ? d.phone.albumFolders : [{ name: '', images: d.gallery.images }]
                    const next = cur.map((x, j) => (j === fi ? { ...x, images: [...x.images, url] } : x))
                    return { ...d, gallery: { ...d.gallery, images: next.flatMap(x => x.images) }, phone: { ...d.phone, albumFolders: next } }
                  })
                } else flash(r.error || '사진을 올리지 못했어요')
              }
            } finally { setBusy(null) }
          }
          return (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[12px]" style={{ color: 'var(--ed-text-muted)' }}>
                <span>폴더 {folders.length} / {ALBUM_FOLDERS_MAX}</span>
                <span className={total >= ALBUM_MAX ? 'font-semibold' : ''} style={total >= ALBUM_MAX ? { color: 'var(--ed-accent)' } : undefined}>사진 {total} / {ALBUM_MAX}</span>
              </div>
              {folders.map((f, fi) => (
                <div key={fi} className="rounded-lg border bg-white p-3 space-y-2.5" style={{ borderColor: 'var(--ed-border)' }}>
                  <div className="flex items-center gap-2">
                    <input className={inputCls + ' flex-1 font-semibold'} placeholder={folders.length > 1 ? `폴더 ${fi + 1} 이름` : '폴더 이름 (비워도 돼요)'} value={f.name}
                      onChange={e => save(folders.map((x, j) => (j === fi ? { ...x, name: e.target.value } : x)))} />
                    {folders.length > 1 && <button type="button" aria-label="폴더 삭제" title="폴더 삭제 (사진도 함께)" className="w-7 h-7 shrink-0 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50" onClick={() => save(folders.filter((_, j) => j !== fi))}><X size={16} className="mx-auto" aria-hidden /></button>}
                  </div>
                  {f.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-1.5">
                      {f.images.map((src, i) => (
                        <div key={src + i} className="relative aspect-square rounded-md bg-cover bg-center" style={{ backgroundImage: `url(${src})` }}>
                          <button type="button" aria-label="사진 삭제" className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white text-xs leading-5" onClick={() => save(folders.map((x, j) => (j === fi ? { ...x, images: x.images.filter((_, k) => k !== i) } : x)))}><X size={16} className="mx-auto" aria-hidden /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  {total < ALBUM_MAX && <UploadButton label="+ 사진 올리기" busy={busy === `album${fi}`} onFiles={fs => addFiles(fi, fs)} />}
                </div>
              ))}
              {folders.length < ALBUM_FOLDERS_MAX && (
                <button type="button" className="w-full py-2.5 rounded-lg border border-dashed text-[13px] font-medium hover:bg-white/60" style={{ borderColor: 'var(--ed-border)', color: 'var(--ed-accent)' }}
                  onClick={() => save([...folders, { name: '', images: [] }])}>+ 폴더 추가</button>
              )}
            </div>
          )
        })()}
      </Section>
    )
    if (screen === 'camera') {
      return (
        <Section title="사진 공유">
          {appToggle('camera')}
          <CoupleGuestSharePanel onChange={onShareStatus} renderCrop={a => <CropModal title="첫 화면 사진" aspect={390 / 560} src={a.src} crop={a.crop} onChange={c => a.onChange({ cropX: c.cropX ?? 0, cropY: c.cropY ?? 0, cropWidth: c.cropWidth ?? 1, cropHeight: c.cropHeight ?? 1 })} onClose={a.onClose} preview={a.preview} />} upload={async f => { const r = await uploadImage(f, { invitationId: invitationId || undefined }); if (r.success && r.webUrl) return r.webUrl; flash(r.error || '올리지 못했어요'); return null }} />
        </Section>
      )
    }
    if (screen === 'letter') {
      // 한 번이라도 고치면 letters 로 저장 (그전엔 인사말이 초대의 글로 보임)
      const own: PhoneLetter[] = data.phone.letters ?? lettersOf(data).map(l => ({ ...l, id: l.id === 'greeting' ? `l-${Date.now().toString(36)}` : l.id }))
      const setL = (next: PhoneLetter[]) => setPhone({ letters: next })
      const patchL = (id: string, patch: Partial<PhoneLetter>) => setL(own.map(l => (l.id === id ? { ...l, ...patch } : l)))
      const used = new Set(own.map(l => l.kind))
      const nextKind = (['invite', 'groom', 'bride'] as PhoneLetterKind[]).find(k => !used.has(k)) || 'invite'
      const addPhotos = (id: string, files: File[]) => {
        const l = own.find(x => x.id === id)
        const room = LETTER_PHOTOS_MAX - (l?.photos?.length || 0)
        files.slice(0, room).forEach(f => upload(`letter-${id}`, f, url => update(d => ({ ...d, phone: { ...d.phone, letters: (d.phone.letters ?? own).map(x => (x.id === id ? { ...x, photos: [...(x.photos || []), url].slice(0, LETTER_PHOTOS_MAX) } : x)) } }))))
      }
      return (
        <Section title="초대의 글" hint="최대 4통까지 쓸 수 있습니다.">
          {appToggle('letter')}
          {designPick('letterStyle', 'letter', [['mail', '메일', '받은편지함 → 편지'], ['message', '메시지', '두 사람이 보낸 문자처럼'], ['hand', '손편지', '편지지 위 손글씨']] as const)}
          {screenTextFields('letter')}
          <Field label="프로필 사진">
            <div className="flex items-center gap-2">
              <button type="button" title="자르기" disabled={!data.phone.letterAvatar?.src} onClick={() => setCropFor({ kind: 'letterAvatar' })}
                className="relative w-11 h-11 rounded-full overflow-hidden border shrink-0" style={{ borderColor: 'var(--ed-border)', background: 'var(--ed-surface-2)' }}>
                {(data.phone.letterAvatar?.src || data.phone.wallpaper || data.gallery.images[0]) && <CroppedImageDiv src={data.phone.letterAvatar?.src || data.phone.wallpaper || data.gallery.images[0]} crop={data.phone.letterAvatar?.crop} className="w-full h-full" />}
              </button>
              <UploadButton label={data.phone.letterAvatar?.src ? '변경' : '사진 올리기'} busy={busy === 'letterAvatar'} onFile={f => upload('letterAvatar', f, url => { setPhone({ letterAvatar: { src: url } }); setCropFor({ kind: 'letterAvatar' }) })} />
              {data.phone.letterAvatar?.src && <button type="button" className="text-[12px] hover:underline" style={{ color: 'var(--ed-text-muted)' }} onClick={() => setPhone({ letterAvatar: undefined })}>기본으로</button>}
            </div>
          </Field>
          <div className="space-y-3">
            {own.map((l, i) => (
              <div key={l.id} className="rounded-lg border bg-white p-3 space-y-2.5" style={{ borderColor: 'var(--ed-border)' }}>
                <div className="flex items-center gap-1.5">
                  <select className={inputCls + ' !h-8 !w-auto !py-0 text-[13px] font-semibold'} value={l.kind} onChange={e => patchL(l.id, { kind: e.target.value as PhoneLetterKind })}>
                    {(Object.keys(LETTER_KINDS) as PhoneLetterKind[]).map(k => <option key={k} value={k}>{LETTER_KINDS[k].label}</option>)}
                  </select>
                  <span className="flex-1" />
                  <button type="button" aria-label="위로" disabled={i === 0} className="inline-flex items-center justify-center w-7 h-7 text-gray-500 hover:text-gray-900 disabled:opacity-25" onClick={() => { const n = [...own]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; setL(n) }}><ChevronUp size={15} aria-hidden /></button>
                  <button type="button" aria-label="아래로" disabled={i === own.length - 1} className="inline-flex items-center justify-center w-7 h-7 text-gray-500 hover:text-gray-900 disabled:opacity-25" onClick={() => { const n = [...own]; [n[i], n[i + 1]] = [n[i + 1], n[i]]; setL(n) }}><ChevronDown size={15} aria-hidden /></button>
                  <button type="button" aria-label="편지 지우기" className="w-7 h-7 text-gray-400 hover:text-red-600" onClick={() => setL(own.filter(x => x.id !== l.id))}><X size={16} className="mx-auto" aria-hidden /></button>
                </div>
                <input className={inputCls} maxLength={30} placeholder={LETTER_KINDS[l.kind].title} value={l.title || ''} onChange={e => patchL(l.id, { title: e.target.value })} />
                <textarea className={inputCls + ' !h-auto leading-relaxed'} rows={5} maxLength={1200} placeholder="편지 내용" value={l.body} onChange={e => patchL(l.id, { body: e.target.value })} />
                {/* 대화 — 신랑 · 신부가 번갈아 (메시지 디자인에선 말풍선이 번갈아 떠요) */}
                <div className="space-y-1.5">
                  {(l.lines || []).map((x, k) => {
                    const setLines = (next: NonNullable<PhoneLetter['lines']>) => patchL(l.id, { lines: next })
                    return (
                      <div key={k} className="flex items-start gap-1.5">
                        <button type="button" title="말하는 사람 바꾸기" className="shrink-0 h-9 px-2.5 rounded-md text-[12px] font-semibold border"
                          style={x.who === 'bride' ? { background: 'var(--ed-accent)', color: '#FFFFFF', borderColor: 'transparent' } : { background: '#F2F0ED', color: 'var(--ed-text)', borderColor: 'var(--ed-border)' }}
                          onClick={() => setLines((l.lines || []).map((y, j) => (j === k ? { ...y, who: y.who === 'groom' ? 'bride' : 'groom' } : y)))}>
                          {x.who === 'groom' ? `신랑 ${givenFirst(data.groom)}` : `신부 ${givenFirst(data.bride)}`}
                        </button>
                        <textarea className={inputCls + ' !h-auto !py-2 leading-snug resize-none'} rows={Math.min(5, Math.max(1, x.text.split('\n').length))} maxLength={300} placeholder={x.who === 'groom' ? '신랑이 하는 말' : '신부가 하는 말'} value={x.text} onChange={e => setLines((l.lines || []).map((y, j) => (j === k ? { ...y, text: e.target.value } : y)))} />
                        <button type="button" aria-label="이 말 지우기" className="shrink-0 w-7 h-7 text-gray-400 hover:text-red-600" onClick={() => setLines((l.lines || []).filter((_, j) => j !== k))}><X size={16} className="mx-auto" aria-hidden /></button>
                      </div>
                    )
                  })}
                  <div className="flex gap-1.5">
                    {(['groom', 'bride'] as const).map(who => (
                      <button key={who} type="button" className={pill(false)} onClick={() => patchL(l.id, { lines: [...(l.lines || []), { who, text: '' }] })}>+ {who === 'groom' ? '신랑' : '신부'} 말</button>
                    ))}
                  </div>
                </div>
                {(data.phone.letterStyle || 'mail') === 'hand' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[12px] font-medium w-8" style={{ color: 'var(--ed-text-muted)' }}>종이</span>
                      {LETTER_PAPERS.map(pp => (
                        <button key={pp.color} type="button" aria-label={pp.label} title={pp.label} onClick={() => patchL(l.id, { paper: pp.color })}
                          className="w-6 h-6 rounded-full border" style={{ background: pp.color, borderColor: (l.paper || '#FFFFFF') === pp.color ? 'var(--ed-accent)' : 'rgba(0,0,0,0.15)', boxShadow: (l.paper || '#FFFFFF') === pp.color ? '0 0 0 2px #FFFFFF, 0 0 0 3.5px var(--ed-accent)' : undefined }} />
                      ))}
                    </div>
                    {/* 글씨 — 고른 종이 위에 그 글씨로 미리 써 보임 (한눈에 보이게 3열) */}
                    <div>
                      <span className="text-[12px] font-medium" style={{ color: 'var(--ed-text-muted)' }}>글씨</span>
                      <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                        {LETTER_HANDS.map(h => {
                          const on = letterHandOf(l.hand || data.phone.letterHand).id === h.id
                          return (
                            <button key={h.id} type="button" onClick={() => patchL(l.id, { hand: h.id })} title={h.label}
                              className="min-w-0 rounded-md border px-2 pt-1.5 pb-2 text-left" style={{ background: l.paper || '#FFFFFF', borderColor: on ? 'var(--ed-accent)' : 'var(--ed-border)', boxShadow: on ? '0 0 0 1.5px var(--ed-accent)' : undefined }}>
                              <span className="block text-[10px] truncate" style={{ color: 'var(--ed-text-muted)' }}>{h.label}</span>
                              <span className="block text-[17px] leading-snug mt-0.5 truncate" style={{ fontFamily: `${h.family}, serif`, color: '#2B2926' }}>{(l.title?.trim() || l.body.trim() || '소중한 분께').slice(0, 8)}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
                <input className={inputCls} maxLength={30} placeholder={`맺음 (비우면 '${givenFirst(data.groom)} · ${givenFirst(data.bride)} 드림')`} value={l.sign || ''} onChange={e => patchL(l.id, { sign: e.target.value })} />
                <div>
                  <div className="flex flex-wrap gap-1.5">
                    {(l.photos || []).map((src, k) => (
                      <span key={src + k} className="relative w-14 h-14 rounded-md overflow-hidden border group" style={{ borderColor: 'var(--ed-border)' }}>
                        <button type="button" title="눌러서 자르기" className="absolute inset-0" onClick={() => setCropFor({ kind: 'letter', id: l.id, src })}><CroppedImageDiv src={src} crop={l.crops?.[src]} className="w-full h-full" /></button>
                        {k === 0 && <span className="absolute left-0 right-0 bottom-0 text-[9.5px] text-center text-white bg-black/45 pointer-events-none">대표</span>}
                        <button type="button" aria-label="사진 빼기" className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/55 text-white text-[11px] leading-none" onClick={() => patchL(l.id, { photos: (l.photos || []).filter((_, j) => j !== k) })}><X size={16} className="mx-auto" aria-hidden /></button>
                        {k > 0 && <button type="button" aria-label="대표 사진으로" className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-black/55 text-white text-[10px] leading-none opacity-0 group-hover:opacity-100" onClick={() => { const ph = [...(l.photos || [])]; const [x] = ph.splice(k, 1); patchL(l.id, { photos: [x, ...ph] }) }}><Star size={11} fill="currentColor" className="mx-auto" aria-hidden /></button>}
                      </span>
                    ))}
                    {(l.photos?.length || 0) < LETTER_PHOTOS_MAX && <UploadButton label={`+ 사진 (${l.photos?.length || 0}/${LETTER_PHOTOS_MAX})`} busy={busy === `letter-${l.id}`} onFiles={fs => addPhotos(l.id, fs)} />}
                  </div>
                </div>
              </div>
            ))}
            {own.length < LETTERS_MAX && (
              <button type="button" className={pill(false)} onClick={() => setL([...own, { id: `l-${Date.now().toString(36)}`, kind: nextKind, body: '' }])}>+ {LETTER_KINDS[nextKind].label} 추가</button>
            )}
          </div>
        </Section>
      )
    }
    if (screen === 'video') {
      const vids = data.phone.videos || []
      const setV = (next: typeof vids) => setPhone({ videos: next })
      return (
        <Section title="영상">
          {appToggle('video')}
          {screenTextFields('video')}
          <Field label={`유튜브 영상 (${vids.length}/3)`}>
            <div className="space-y-2">
              {vids.map((v, i) => {
                const id = youtubeId(v.url)
                return (
                  <div key={i} className="p-2.5 rounded-md border space-y-1.5" style={{ borderColor: 'var(--ed-border)' }}>
                    <div className="flex gap-2 items-start">
                      {id
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={`https://img.youtube.com/vi/${id}/mqdefault.jpg`} alt="" className="w-20 aspect-video object-cover rounded shrink-0" />
                        : <span className="w-20 aspect-video rounded shrink-0 flex items-center justify-center text-[10.5px] text-center" style={{ background: 'var(--ed-border)', color: 'var(--ed-text-muted)' }}>주소 확인</span>}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <input className={inputCls + ' !px-2'} placeholder="https://youtu.be/…" value={v.url} onChange={e => setV(vids.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
                        <input className={inputCls + ' !px-2'} maxLength={40} placeholder={`제목 (비우면 '우리 영상 ${i + 1}')`} value={v.title || ''} onChange={e => setV(vids.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                      </div>
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button type="button" aria-label="위로" disabled={i === 0} className="inline-flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-30 px-1" onClick={() => { const n = [...vids]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; setV(n) }}><ChevronUp size={15} aria-hidden /></button>
                        <button type="button" aria-label="지우기" className="text-gray-400 hover:text-red-600 px-1" onClick={() => setV(vids.filter((_, j) => j !== i))}><X size={16} className="mx-auto" aria-hidden /></button>
                      </div>
                    </div>
                    {v.url.trim() && !id && <p className="text-[11.5px]" style={{ color: '#C0392B' }}>유튜브 주소가 올바르지 않습니다 (youtube.com · youtu.be · shorts)</p>}
                  </div>
                )
              })}
              {vids.length < 3 && <button type="button" className={pill(false)} onClick={() => setV([...vids, { url: '' }])}>+ 영상 추가</button>}
            </div>
          </Field>
        </Section>
      )
    }
    if (screen === 'intro') {
      const intro = data.phone.intro || {}
      const setIntro = (patch: Partial<NonNullable<PhoneData['phone']['intro']>>) => setPhone({ intro: { ...(data.phone.intro || {}), ...patch } })
      const PRESET = ['MBTI', '생일', '좋아하는 것', '취미', '첫인상']
      const person = (side: 'groom' | 'bride') => {
        const ip = intro[side] || {}
        const role = side === 'groom' ? '신랑' : '신부'
        const setP = (patch: Partial<NonNullable<typeof intro.groom>>) => setIntro({ [side]: { ...ip, ...patch } })
        const items = ip.items || []
        const setItem = (i: number, patch: Partial<{ q: string; a: string }>) => setP({ items: items.map((x, j) => (j === i ? { ...x, ...patch } : x)) })
        const other = side === 'groom' ? givenFirst(data.bride) : givenFirst(data.groom)
        return (
          <div key={side} className={`space-y-3 ${side === 'bride' ? 'pt-4 border-t' : ''}`} style={{ borderColor: 'var(--ed-border)' }}>
            <h4 className="text-[13px] font-semibold" style={{ color: 'var(--ed-accent)' }}>{role} {data[side].name}</h4>
            <Field label="사진">
              <div className="flex gap-2 items-center flex-wrap">
                {ip.photo && (
                  <button type="button" title="자르기" onClick={() => setCropFor({ kind: 'intro', side })} className="w-11 h-11 rounded-full overflow-hidden border border-gray-200 shrink-0">
                    <CroppedImageDiv src={ip.photo} crop={ip.photoCrop} className="w-full h-full" />
                  </button>
                )}
                {ip.photo && <button type="button" className={pill(false)} onClick={() => setCropFor({ kind: 'intro', side })}>자르기</button>}
                <UploadButton label={ip.photo ? '변경' : '사진 올리기'} busy={busy === `intro-${side}`} onFile={f => upload(`intro-${side}`, f, url => { setP({ photo: url, photoCrop: undefined }); setCropFor({ kind: 'intro', side }) })} />
                {ip.photo && <button type="button" className={pill(false)} onClick={() => setP({ photo: undefined, photoCrop: undefined })}>삭제</button>}
              </div>
            </Field>
            {(data.phone.introStyle || SCREEN_DEFAULTS.intro) === 'card' && (
              <Field label="프로필 배경 사진">
                <div className="flex gap-2 items-center flex-wrap">
                  {ip.bg && <button type="button" title="자르기" onClick={() => setCropFor({ kind: 'introBg', side })} className="w-9 h-14 rounded-md overflow-hidden border border-gray-200 shrink-0"><CroppedImageDiv src={ip.bg} crop={ip.bgCrop} className="w-full h-full" /></button>}
                  {ip.bg && <button type="button" className={pill(false)} onClick={() => setCropFor({ kind: 'introBg', side })}>자르기</button>}
                  <UploadButton label={ip.bg ? '변경' : '사진 올리기'} busy={busy === `introbg-${side}`} onFile={f => upload(`introbg-${side}`, f, url => { setP({ bg: url, bgCrop: undefined }); setCropFor({ kind: 'introBg', side }) })} />
                  {ip.bg && <button type="button" className={pill(false)} onClick={() => setP({ bg: undefined, bgCrop: undefined })}>삭제</button>}
                </div>
              </Field>
            )}
            <Field label="한 줄 소개"><input className={inputCls} value={ip.bio || ''} placeholder={side === 'groom' ? '웃음이 많은 사람' : '비 오는 날을 좋아하는 사람'} onChange={e => setP({ bio: e.target.value })} /></Field>
            <Field label="나를 소개하는 것">
              <div className="space-y-2">
                {items.map((x, i) => (
                  <div key={i} className="grid grid-cols-[96px_1fr_auto] gap-1.5 items-center">
                    <input className={inputCls + ' !px-2'} placeholder="질문" value={x.q} onChange={e => setItem(i, { q: e.target.value })} />
                    <input className={inputCls + ' !px-2'} placeholder="답" value={x.a} onChange={e => setItem(i, { a: e.target.value })} />
                    <button type="button" aria-label="지우기" className="text-gray-400 hover:text-red-600 px-1" onClick={() => setP({ items: items.filter((_, j) => j !== i) })}><X size={16} className="mx-auto" aria-hidden /></button>
                  </div>
                ))}
                <div className="flex gap-1.5 flex-wrap">
                  {PRESET.filter(q => !items.some(x => x.q.startsWith(q.replace('첫인상', `${other}의 첫인상`)) || x.q === q)).map(q => (
                    <button key={q} type="button" className={pill(false)} onClick={() => setP({ items: [...items, { q: q === '첫인상' ? `${other}의 첫인상` : q, a: '' }] })}>+ {q}</button>
                  ))}
                  <button type="button" className={pill(false)} onClick={() => setP({ items: [...items, { q: '', a: '' }] })}>+ 직접</button>
                </div>
              </div>
            </Field>
          </div>
        )
      }
      return (
        <Section title="커플 소개">
          {appToggle('intro')}
          {designPick('introStyle', 'intro', [['portrait', '사진 크게', '두 사람 사진을 크게'], ['profile', '프로필', 'SNS 프로필처럼'], ['match', '매칭', "It's a Match!"], ['settings', '목록', '폰 설정 화면처럼'], ['card', '명함', '겹친 카드를 펼침'], ['quiz', '퀴즈', '하객이 맞혀 보기']])}
          {screenTextFields('intro')}
          <Field label="처음 만난 날"><input type="date" className={inputCls + ' !w-[170px]'} value={intro.metDate || ''} onChange={e => setIntro({ metDate: e.target.value || undefined })} /></Field>
          {person('groom')}
          {person('bride')}
        </Section>
      )
    }
    if (screen === 'guestbook') return (
      <Section title="방명록">
        {appToggle('guestbook')}
        {designPick('guestbookStyle', 'guestbook', [['chat', '축하 대화방', '메시지 앱처럼'], ['board', '메모 보드', '메모지를 붙이듯'], ['post', '게시물 댓글', '사진 한 장 아래 댓글'], ['notify', '알림', '축하가 알림처럼 쌓임']])}
        {screenTextFields('guestbook')}
        <Field label="제목"><input className={inputCls} value={data.phone.guestbookTitle ?? ''} placeholder={({ board: '축하 메모', post: '저희 결혼합니다', notify: '축하 알림' } as Record<string, string>)[data.phone.guestbookStyle || 'chat'] || '축하 메시지'} onChange={e => setPhone({ guestbookTitle: e.target.value })} /></Field>
        <Field label="홈 화면">
          <div className="flex gap-1.5 flex-wrap">
            {!data.phone.widgets.some(w => w.type === 'app' && w.props.app === 'guestbook') && <button type="button" className={pill(false)} onClick={() => addWidget('app', 'guestbook')}>+ 앱 아이콘</button>}
            <button type="button" className={pill(false)} onClick={() => { setDraft({ type: 'guestbook', size: 'W', variant: 0 }); setSelectedId(null); setScreen('home') }}>+ 방명록 위젯</button>
          </div>
        </Field>
        <p className="text-[12px]" style={{ color: 'var(--ed-text-muted)' }}>남겨진 글은 내 청첩장 관리에서 보고 지울 수 있습니다.</p>
      </Section>
    )
    if (screen === 'call') return (
      <Section title="연락하기">
        {appToggle('call')}
        {designPick('callStyle', 'call', [['contacts', '연락처', '연락처 앱처럼'], ['keypad', '전화 키패드', '키패드와 이름'], ['chats', '메시지 목록', '메시지 앱처럼'], ['invite', '유리 카드', '흐린 사진 위 카드']])}
        {screenTextFields('call')}
        {(['groom', 'bride'] as const).map(side => contactEditor(side))}
        {[data.groom, data.bride].some(p => (p.family || []).some(f => f.deceased)) && (
          <Field label="고인 표시">
            <div className="flex gap-1.5">
              <button type="button" className={pill((data.phone.deceasedStyle || 'hanja') === 'hanja')} onClick={() => setPhone({ deceasedStyle: 'hanja' })}>故 한자</button>
              <button type="button" className={pill(data.phone.deceasedStyle === 'flower')} onClick={() => setPhone({ deceasedStyle: 'flower' })}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/chrysanthemum.svg" alt="" className="inline w-3.5 h-3.5 mr-1 align-[-2px]" />국화
              </button>
            </div>
          </Field>
        )}
      </Section>
    )
    if (screen === 'rsvp') {
      const tog = (key: 'rsvpEnabled' | 'rsvpAllowGuestCount' | 'rsvpMealOption' | 'rsvpShuttleOption' | 'rsvpAfterPartyOption' | 'rsvpPhoneOption' | 'rsvpSideDetail' | 'sharedRsvpEnabled', label: string, on: boolean) => (
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={on} onChange={e => update(d => ({ ...d, [key]: e.target.checked }))} />{label}</label>
      )
      const sideOpts = data.rsvpSideDetailOptions || {}
      return (
        <Section title="참석 회신">
          <label className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-md border bg-white text-sm" style={{ borderColor: 'var(--ed-border)' }}>
            <span>참석 회신 화면 쓰기</span>
            <input type="checkbox" checked={data.rsvpEnabled !== false} onChange={e => update(d => ({ ...d, rsvpEnabled: e.target.checked }))} />
          </label>
          {data.rsvpEnabled !== false && <>
          {designPick('rsvpStyle', 'rsvp', [['calendar', '캘린더', '일정 초대에 답하기'], ['poll', '투표', '참석 · 불참 고르기'], ['invite', '사진 + 시트', '사진 아래 회신 양식']])}
          {screenTextFields('rsvp')}
          {(data.phone.rsvpStyle || SCREEN_DEFAULTS.rsvp) === 'calendar' && (() => {
            const sched = data.phone.schedule || []
            const setS = (next: typeof sched) => setPhone({ schedule: next })
            const t0 = data.wedding.time || '14:00'
            const addMin = (t: string, m: number) => { const [h, mm] = t.split(':').map(Number); const x = (h || 0) * 60 + (mm || 0) + m; return `${String(Math.floor(x / 60) % 24).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}` }
            return (
              <Field label="일정">
                <div className="space-y-2">
                  {sched.map((e, i) => (
                    <div key={i} className="grid grid-cols-[1fr_auto] gap-1.5 p-2 rounded-md border" style={{ borderColor: 'var(--ed-border)' }}>
                      <input className={inputCls + ' !px-2'} placeholder="예식, 식사, 사진 촬영" value={e.title} onChange={ev => setS(sched.map((x, j) => (j === i ? { ...x, title: ev.target.value } : x)))} />
                      <button type="button" aria-label="지우기" className="text-gray-400 hover:text-red-600 px-1" onClick={() => setS(sched.filter((_, j) => j !== i))}><X size={16} className="mx-auto" aria-hidden /></button>
                      <div className="flex items-center gap-1.5 col-span-2 text-[12px]" style={{ color: 'var(--ed-text-muted)' }}>
                        <input type="time" aria-label="시작" className={inputCls + ' !w-[118px] !px-2 !py-1.5 text-xs'} value={e.time} onChange={ev => setS(sched.map((x, j) => (j === i ? { ...x, time: ev.target.value } : x)))} />
                        –
                        <input type="time" aria-label="끝" className={inputCls + ' !w-[118px] !px-2 !py-1.5 text-xs'} value={e.end || ''} onChange={ev => setS(sched.map((x, j) => (j === i ? { ...x, end: ev.target.value || undefined } : x)))} />
                      </div>
                    </div>
                  ))}
                  <button type="button" className={pill(false)} onClick={() => {
                    if (!sched.length) { setS([{ time: t0, end: addMin(t0, 60), title: '예식' }, { time: addMin(t0, 60), end: addMin(t0, 120), title: '식사' }]); return }
                    const last = sched[sched.length - 1]
                    const st = last.end || addMin(last.time, 30)
                    setS([...sched, { time: st, end: addMin(st, 30), title: '' }])
                  }}>+ 일정</button>
                </div>
              </Field>
            )
          })()}
            {tog('sharedRsvpEnabled', '별도 RSVP 링크 (회신 양식만 공유)', !!data.sharedRsvpEnabled)}
            <SharedRsvpLinkField enabled={!!data.sharedRsvpEnabled} invitationId={invitationId || undefined}
              shareTitle={data.sharedRsvpShareTitle} shareDesc={data.sharedRsvpShareDesc} shareImage={data.sharedRsvpShareImage} pagePhoto={data.sharedRsvpPhoto}
              onShareChange={p => update(d => ({ ...d,
                ...('shareTitle' in p ? { sharedRsvpShareTitle: p.shareTitle ?? '' } : {}),
                ...('shareDesc' in p ? { sharedRsvpShareDesc: p.shareDesc ?? '' } : {}),
                ...('shareImage' in p ? { sharedRsvpShareImage: p.shareImage ?? '' } : {}),
                ...('pagePhoto' in p ? { sharedRsvpPhoto: p.pagePhoto ?? '' } : {}),
              }))} />
            <div className="space-y-2 pt-1">
              <span className="text-xs block" style={{ color: 'var(--ed-text-muted)' }}>받을 항목</span>
              {tog('rsvpAllowGuestCount', '동반 인원', data.rsvpAllowGuestCount !== false)}
              {tog('rsvpMealOption', '식사 여부', !!data.rsvpMealOption)}
              {tog('rsvpShuttleOption', '대절버스 이용', !!data.rsvpShuttleOption)}
              {tog('rsvpAfterPartyOption', '애프터파티 참석', !!data.rsvpAfterPartyOption)}
              {tog('rsvpPhoneOption', '연락처 뒷자리 4자리', !!data.rsvpPhoneOption)}
              {tog('rsvpSideDetail', '부모님 하객 구분', !!data.rsvpSideDetail)}
              {data.rsvpSideDetail && (
                <div className="grid grid-cols-3 gap-1.5 pl-6">
                  {([['groomSelf', '신랑'], ['groomFather', '신랑 아버지'], ['groomMother', '신랑 어머니'], ['brideSelf', '신부'], ['brideFather', '신부 아버지'], ['brideMother', '신부 어머니']] as const).map(([k2, l]) => (
                    <label key={k2} className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={sideOpts[k2] ?? true} onChange={e => update(d => ({ ...d, rsvpSideDetailOptions: { ...(d.rsvpSideDetailOptions || {}), [k2]: e.target.checked } }))} />{l}</label>
                  ))}
                </div>
              )}
            </div>
            <Field label="축하 메시지 안내"><input className={inputCls} value={data.rsvpMessagePlaceholder || ''} placeholder="신랑 신부에게 전할 축하 메시지를 남겨주세요" onChange={e => update(d => ({ ...d, rsvpMessagePlaceholder: e.target.value }))} /></Field>
            <Field label="안내 문구"><textarea rows={2} className={inputCls} value={data.rsvpNotice || ''} placeholder="예) 소규모로 진행되는 예식입니다." onChange={e => update(d => ({ ...d, rsvpNotice: e.target.value }))} /></Field>
          </>}
        </Section>
      )
    }
    return null
  }

  /* ── 설정 조각 (패널마다 필요한 것만 골라 씀) ── */
  const choiceCls = (on: boolean) => `rounded-md border px-2.5 py-2 text-center text-[13px] transition-colors ${on ? 'border-[color:var(--ed-accent)] ring-1 ring-[color:var(--ed-accent)] bg-white font-semibold' : 'border-[color:var(--ed-border)] bg-transparent hover:bg-white/60'}`
  const titleFontField = () => (
    <Field label="제목 글꼴">
      <div className="grid grid-cols-2 gap-1.5">
        {(Object.keys(TITLE_FONTS) as PhoneTitleFont[]).map(id => {
          const f = TITLE_FONTS[id]
          const sample = f.latin ? `${data.groom.nameEn || 'Jihoon'} & ${data.bride.nameEn || 'Seoyeon'}` : `${data.groom.name || '지훈'} & ${data.bride.name || '서연'}`
          return (
            <button key={id} type="button" onClick={() => setPhone({ fonts: { ...data.phone.fonts, title: id } })} className={choiceCls(data.phone.fonts.title === id) + ' !p-2'}>
              <span className="block truncate" style={{ fontFamily: f.family, fontWeight: f.weight, letterSpacing: f.letterSpacing, fontSize: 17 * f.scale, lineHeight: 1.3 }}>{sample}</span>
              <span className="text-[10.5px] block" style={{ color: 'var(--ed-text-muted)' }}>{f.label}</span>
            </button>
          )
        })}
      </div>
    </Field>
  )
  const bodyFontField = () => (
    <Field label="본문 글꼴">
      <div className="grid grid-cols-2 gap-1.5">
        {[{ id: '', name: '기본', fontFamily: "'Pretendard Variable', sans-serif" }, ...KR_FONTS].map(f => (
          <button key={f.id || 'default'} type="button" onClick={() => setPhone({ fonts: { ...data.phone.fonts, body: f.id || undefined } })} className={choiceCls((data.phone.fonts.body || '') === f.id) + ' !p-2'}>
            <span className="block truncate" style={{ fontFamily: f.fontFamily, fontSize: 15, lineHeight: 1.35 }}>우리 결혼합니다</span>
            <span className="text-[10.5px] block" style={{ color: 'var(--ed-text-muted)' }}>{f.name}</span>
          </button>
        ))}
      </div>
    </Field>
  )
  const numberFontField = (label = '숫자 글꼴', key: 'number' | 'lockNumber' = 'number') => (
    <Field label={label}>
      {/* 설정 칸이 좁아도(휴대폰 서랍) 숫자가 카드 밖으로 나가지 않게 — 칸 폭에 맞춰 글자 크기 */}
      <div className="grid grid-cols-3 gap-1.5" style={{ containerType: 'inline-size' }}>
        {(Object.keys(NUMBER_FONTS) as PhoneNumberFont[]).map(id => {
          const f = NUMBER_FONTS[id]
          return (
            <button key={id} type="button" onClick={() => setPhone({ fonts: { ...data.phone.fonts, [key]: id } })} className={choiceCls((key === 'lockNumber' ? data.phone.fonts.lockNumber || data.phone.fonts.number : data.phone.fonts.number) === id) + ' !p-2 !text-center overflow-hidden'}>
              <span className="block whitespace-nowrap" style={{ fontFamily: f.family, fontWeight: f.weight, letterSpacing: f.letterSpacing, fontVariantNumeric: 'lining-nums tabular-nums', fontSize: `min(${Math.round(17 / f.capRatio)}px, ${(6.2 / f.capRatio).toFixed(1)}cqw)`, lineHeight: 1.15 }}>{data.wedding.time || '14:00'}</span>
              <span className="text-[10.5px] block mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: 'var(--ed-text-muted)' }}>{f.label}</span>
            </button>
          )
        })}
      </div>
    </Field>
  )
  const accentField = () => (
    <>
      <Field label="버튼 색">
        <ColorRow value={data.phone.accent} options={ACCENT_OPTIONS} onChange={c => setPhone({ accent: c || ACCENT_OPTIONS[0] })} />
      </Field>
      <Field label="글자 포인트 색">
        <ColorRow value={data.phone.accentText} options={['#FFFFFF', '#7A7A7A', ...ACCENT_OPTIONS]} fallback={themeOf(data).homeBg === 'photo' ? '#FFFFFF' : data.phone.accent} onChange={c => setPhone({ accentText: c })} />
      </Field>
    </>
  )
  const homeBgField = () => (
    <Field label="바탕색">
      <ColorRow value={data.phone.homeBgColor} options={HOME_BG_OPTIONS} fallback={PHONE_THEMES.white.bg} onChange={c => setPhone({ homeBgColor: c })} />
    </Field>
  )
  const wallpaperField = (label: string) => (
    <Field label={label}>
      <div className="flex gap-2 items-center">
        {data.phone.wallpaper && (
          <button type="button" onClick={() => setCropFor({ kind: 'wallpaper' })} title="자르기" className="w-10 h-14 rounded-md overflow-hidden border border-gray-200 shrink-0">
            <CroppedImageDiv src={data.phone.wallpaper} crop={data.phone.wallpaperCrop} className="w-full h-full" style={data.phone.photoMono ? { filter: "grayscale(1)" } : undefined} />
          </button>
        )}
        {data.phone.wallpaper && <button type="button" className={pill(false)} onClick={() => setCropFor({ kind: 'wallpaper' })}>자르기</button>}
        <UploadButton label={data.phone.wallpaper ? '변경' : '사진 올리기'} busy={busy === 'wallpaper'} onFile={f => upload('wallpaper', f, url => { setPhone({ wallpaper: url, wallpaperCrop: undefined }); setCropFor({ kind: 'wallpaper' }) })} />
      </div>
    </Field>
  )
  const monoField = () => <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!data.phone.photoMono} onChange={e => setPhone({ photoMono: e.target.checked })} />흑백 사진</label>
  const weddingFields = () => (
    <>
      <h4 className="text-[13px] font-semibold pt-4 border-t" style={{ color: 'var(--ed-accent)', borderColor: 'var(--ed-border)' }}>예식</h4>
      <div className="grid grid-cols-2 gap-2">
        <Field label="예식일"><input type="date" className={inputCls} value={data.wedding.date} onChange={e => update(d => ({ ...d, wedding: { ...d.wedding, date: e.target.value } }))} /></Field>
        <Field label="시간">
          <input type="time" className={inputCls} value={data.wedding.time} onChange={e => {
            const v = e.target.value; const [h, m] = v.split(':').map(Number)
            const disp = Number.isFinite(h) ? `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}시${m ? ` ${m}분` : ''}` : ''
            update(d => ({ ...d, wedding: { ...d.wedding, time: v, timeDisplay: disp } }))
          }} />
        </Field>
      </div>
      <Field label="예식장"><input className={inputCls} placeholder="예: 더채플앳청담" value={data.wedding.venue.name} onChange={e => update(d => ({ ...d, wedding: { ...d.wedding, venue: { ...d.wedding.venue, name: e.target.value } } }))} /></Field>
      <Field label="홀"><input className={inputCls} value={data.wedding.venue.hall} placeholder="예: 그랜드볼룸 5층" onChange={e => update(d => ({ ...d, wedding: { ...d.wedding, venue: { ...d.wedding.venue, hall: e.target.value } } }))} /></Field>
      <Field label="주소"><input className={inputCls} value={data.wedding.venue.address} placeholder="예: 서울 강남구 선릉로 757" onChange={e => update(d => ({ ...d, wedding: { ...d.wedding, venue: { ...d.wedding.venue, address: e.target.value } } }))} /></Field>
    </>
  )

  /** 왼쪽에서 고른 항목에 맞는 설정만 */
  const panelFor = (k: PanelId) => {
    if (k === 'info') return (
      <>
        <Section title="결혼식 정보">
          {people('groom', '신랑')}
          {people('bride', '신부')}
          {weddingFields()}
        </Section>
        {(() => {
          // 다른 청첩장(공유 설정)과 같은 방식 — 카카오톡 썸네일 · 비율 · 제목 · 설명, 그리고 문자 · SNS 용 OG 이미지
          const m = data.meta
          const setMeta = (patch: Partial<PhoneData['meta']>) => update(d => ({ ...d, meta: { ...d.meta, ...patch } }))
          const ratio = m.kakaoThumbnailRatio || '1:1'
          const autoTitle = `${data.groom.name || '신랑'} ♥ ${data.bride.name || '신부'} 결혼합니다`
          const wpd = data.wedding.date ? new Date(data.wedding.date + 'T00:00:00') : null
          const autoDesc = wpd && !isNaN(wpd.getTime())
            ? [`${wpd.getFullYear()}년 ${wpd.getMonth() + 1}월 ${wpd.getDate()}일 ${'일월화수목금토'[wpd.getDay()]}요일${data.wedding.timeDisplay ? ` ${data.wedding.timeDisplay}` : ''}`, data.wedding.venue.name].filter(Boolean).join('\n')
            : ''
          const kakaoImg = m.kakaoThumbnail || m.ogImage || data.phone.wallpaper || data.gallery.images[0] || ''
          const ogImg = m.ogImage || m.kakaoThumbnail || data.phone.wallpaper || data.gallery.images[0] || ''
          return (
            <>
              <Section title="카카오톡 공유">
                <div className="max-w-[210px] mx-auto rounded-lg border border-stone-200 bg-white shadow-sm overflow-hidden">
                  <div className="w-full bg-stone-100 bg-cover bg-center flex items-center justify-center" style={{ aspectRatio: { '3:4': '3/4', '1:1': '1/1', '3:2': '3/2' }[ratio], backgroundImage: kakaoImg ? `url(${kakaoImg})` : undefined }}>
                    {!kakaoImg && <span className="text-[10px] text-stone-400">사진 없음</span>}
                  </div>
                  <div className="px-2.5 py-1.5 border-t border-stone-100">
                    <p className="text-[11px] font-semibold text-stone-800 truncate">{m.title || autoTitle}</p>
                    <p className="text-[10px] text-stone-500 mt-0.5 whitespace-pre-line line-clamp-2">{m.description || autoDesc}</p>
                  </div>
                  <div className="text-center py-1.5 text-[10px] text-stone-500 border-t border-stone-100">모바일 청첩장 보기</div>
                </div>
                <Field label="썸네일">
                  <div className="flex gap-2 items-center flex-wrap">
                    <UploadButton label={m.kakaoThumbnail ? '변경' : '사진 올리기'} busy={busy === 'kakao'} onFile={f => upload('kakao', f, url => setMeta({ kakaoThumbnail: url }))} />
                    {m.kakaoThumbnail && <button type="button" className={pill(false)} onClick={() => setMeta({ kakaoThumbnail: '' })}>삭제</button>}
                  </div>
                </Field>
                <Field label="비율">
                  <div className="flex gap-1.5">
                    {([['3:4', '세로'], ['1:1', '정사각형'], ['3:2', '가로']] as const).map(([v, l]) => <button key={v} type="button" className={pill(ratio === v)} onClick={() => setMeta({ kakaoThumbnailRatio: v })}>{l}</button>)}
                  </div>
                </Field>
                <Field label="제목"><input className={inputCls} value={m.title} placeholder={autoTitle} onChange={e => setMeta({ title: e.target.value })} /></Field>
                <Field label="설명"><textarea rows={2} className={inputCls + ' resize-none'} value={m.description} placeholder={autoDesc || '2027년 5월 22일 토요일 오후 2시\n더채플앳청담'} onChange={e => setMeta({ description: e.target.value })} /></Field>
                <details className="text-[11px]" style={{ color: 'var(--ed-text-muted)' }}>
                  <summary className="cursor-pointer">한 번 공유한 뒤 바꾸면 늦게 반영될 수 있습니다</summary>
                  <p className="mt-1.5 leading-relaxed">카카오톡이 이전 미리보기를 잠시 저장합니다. <a href="https://developers.kakao.com/tool/debugger/sharing" target="_blank" rel="noopener noreferrer" className="underline">카카오 공유 디버거</a>에서 청첩장 주소를 넣고 캐시를 초기화한 뒤 다시 공유하면 됩니다.</p>
                </details>
              </Section>
              <Section title="문자 · SNS 미리보기">
                <div className="max-w-[230px] mx-auto rounded-lg border border-stone-200 bg-white shadow-sm overflow-hidden">
                  <div className="relative w-full bg-stone-100 bg-cover bg-center" style={{ aspectRatio: '1.91/1', backgroundImage: ogImg ? `url(${ogImg})` : undefined }}>
                    {!m.ogImage && ogImg && <span className="absolute left-0 right-0 bottom-0 bg-stone-700/75 text-white text-[9px] text-center py-0.5">{m.kakaoThumbnail ? '카카오 썸네일 사용 중' : '대표 사진 사용 중'}</span>}
                  </div>
                  <div className="px-2.5 py-1.5 border-t border-stone-100">
                    <p className="text-[9px] text-stone-400">invite.deardrawer.com</p>
                    <p className="text-[11px] font-semibold text-stone-800 truncate">{m.title || autoTitle}</p>
                  </div>
                </div>
                <Field label="이미지 (가로 1.91:1)">
                  <div className="flex gap-2 items-center">
                    <UploadButton label={m.ogImage ? '변경' : '따로 올리기'} busy={busy === 'og'} onFile={f => upload('og', f, url => setMeta({ ogImage: url }))} />
                    {m.ogImage && <button type="button" className={pill(false)} onClick={() => setMeta({ ogImage: '' })}>삭제</button>}
                  </div>
                </Field>
              </Section>
            </>
          )
        })()}
      </>
    )
    if (k === 'dday') {
      // 다른 템플릿과 같은 데이터(ddayPopup) — 화면만 폰 에디터 모양으로
      const v = data.ddayPopup || DEFAULT_DDAY_POPUP
      const set = (patch: Partial<typeof v>) => update(d => ({ ...d, ddayPopup: { ...(d.ddayPopup || DEFAULT_DDAY_POPUP), ...patch } }))
      const pages = v.pages || []
      const setPage = (i: number, patch: Partial<(typeof pages)[number]>) => set({ pages: pages.map((p, j) => (j === i ? { ...p, ...patch } : p)) })
      const wd = data.wedding.date
      const shift = (n: number) => { if (!wd) return ''; const d = new Date(`${wd}T00:00:00`); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
      const align = (key: 'textAlign' | 'linkAlign') => (
        <div className="flex gap-1.5">
          {([['left', '왼쪽'], ['center', '가운데'], ['right', '오른쪽']] as const).map(([a, l]) => (
            <button key={a} type="button" className={pill((v[key] || 'left') === a)} onClick={() => set({ [key]: a })}>{l}</button>
          ))}
        </div>
      )
      const toggle = (on: boolean, label: string, onChange: (b: boolean) => void) => (
        <label className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-md border bg-white text-sm" style={{ borderColor: 'var(--ed-border)' }}>
          <span>{label}</span>
          <input type="checkbox" checked={on} onChange={e => onChange(e.target.checked)} />
        </label>
      )
      return (
        <Section title="D-Day 팝업">
          {toggle(!!v.enabled, 'D-Day 팝업 쓰기', b => set({ enabled: b }))}
          {v.enabled && <>
            <Field label="보여 줄 기간">
              {wd ? (
                <>
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                    <input type="date" className={inputCls + ' !px-2 text-[13px]'} value={v.displayStart || shift(-7)} min={shift(-10)} max={v.displayEnd || wd} onChange={e => set({ displayStart: e.target.value })} />
                    <span className="text-sm" style={{ color: 'var(--ed-text-muted)' }}>~</span>
                    <input type="date" className={inputCls + ' !px-2 text-[13px]'} value={v.displayEnd || wd} min={v.displayStart || shift(-7)} max={shift(30)} onChange={e => set({ displayEnd: e.target.value })} />
                  </div>
                  <p className="text-[12px] mt-1.5" style={{ color: 'var(--ed-text-muted)' }}>예식 10일 전부터 30일 뒤까지 선택할 수 있습니다.</p>
                </>
              ) : <p className="text-[12px]" style={{ color: 'var(--ed-text-muted)' }}>결혼식 정보에서 예식일을 먼저 입력해야 합니다.</p>}
            </Field>
            <Field label="팝업 제목">
              <input className={inputCls} maxLength={20} placeholder="결혼식 당일 안내" value={v.title || ''} onChange={e => set({ title: e.target.value })} />
            </Field>

            <div className="space-y-3">
              {pages.map((p, i) => (
                <div key={i} className="rounded-lg border bg-white p-3 space-y-2.5" style={{ borderColor: 'var(--ed-border)' }}>
                  <div className="flex items-center gap-2">
                    <input className={inputCls + ' flex-1 font-semibold'} maxLength={30} placeholder={`안내 ${i + 1} 제목`} value={p.title} onChange={e => setPage(i, { title: e.target.value })} />
                    <button type="button" aria-label="안내 삭제" className="w-7 h-7 shrink-0 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50" onClick={() => set({ pages: pages.filter((_, j) => j !== i) })}><X size={16} className="mx-auto" aria-hidden /></button>
                  </div>
                  <textarea rows={3} className={inputCls} maxLength={200} placeholder="주차, 식사, 셔틀처럼 당일 알려 드릴 내용" value={p.body} onChange={e => setPage(i, { body: e.target.value })} />
                  <div className="flex gap-2 items-center flex-wrap">
                    {(p.images || []).map((im, k) => (
                      <span key={k} className="relative">
                        <span className="block w-11 h-11 rounded-md bg-cover bg-center border border-gray-200" style={{ backgroundImage: `url(${im.url})` }} />
                        <button type="button" aria-label="사진 삭제" className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-black/60 text-white text-[10px] leading-4" onClick={() => setPage(i, { images: (p.images || []).filter((_, j) => j !== k) })}><X size={16} className="mx-auto" aria-hidden /></button>
                      </span>
                    ))}
                    {(p.images || []).length < 3 && <UploadButton label="+ 사진" busy={busy === `dday${i}`} onFile={f => upload(`dday${i}`, f, url => setPage(i, { images: [...(p.images || []), { url, settings: { scale: 1, positionX: 0, positionY: 0 } }] }))} />}
                    {(p.links || []).length < 2 && <button type="button" className={pill(false)} onClick={() => setPage(i, { links: [...(p.links || []), { url: '', label: '' }] })}>+ 링크</button>}
                  </div>
                  {(p.links || []).map((l, k) => (
                    <div key={k} className="grid grid-cols-[96px_1fr_auto] gap-1.5 items-center">
                      <input className={inputCls + ' !px-2'} maxLength={10} placeholder="버튼 글" value={l.label} onChange={e => setPage(i, { links: (p.links || []).map((x, j) => (j === k ? { ...x, label: e.target.value } : x)) })} />
                      <input className={inputCls + ' !px-2'} placeholder="https://" value={l.url} onChange={e => setPage(i, { links: (p.links || []).map((x, j) => (j === k ? { ...x, url: e.target.value } : x)) })} />
                      <button type="button" aria-label="링크 삭제" className="text-gray-400 hover:text-red-600 px-1" onClick={() => setPage(i, { links: (p.links || []).filter((_, j) => j !== k) })}><X size={16} className="mx-auto" aria-hidden /></button>
                    </div>
                  ))}
                </div>
              ))}
              {pages.length < 5 && (
                <button type="button" className="w-full py-2.5 rounded-lg border border-dashed text-[13px] font-medium hover:bg-white/60" style={{ borderColor: 'var(--ed-border)', color: 'var(--ed-accent)' }}
                  onClick={() => set({ pages: [...pages, { title: '', body: '' }] })}>+ 안내 추가 <span className="font-normal opacity-60">({pages.length}/5)</span></button>
              )}
            </div>

            <Field label="팝업 모양">
              <div className="grid grid-cols-2 gap-2">
                {([['banner', '알림', '누르면 펼침'], ['card', '안내 카드', '사진을 크게']] as const).map(([k, l, d]) => (
                  <button key={k} type="button" onClick={() => setPhone({ ddayLook: k })} className={choiceCls((data.phone.ddayLook || 'banner') === k) + ' !py-2.5'}>
                    <span className="block">{l}</span>
                    <span className="block text-[11px] font-normal mt-0.5 leading-snug whitespace-nowrap" style={{ color: 'var(--ed-text-muted)' }}>{d}</span>
                  </button>
                ))}
              </div>
            </Field>
            {pages.some(p => (p.images || []).length) && (
              <Field label="사진 모양">
                <div className="grid grid-cols-4 gap-2">
                  {([['wide', '가로', '16 / 10'], ['square', '정사각', '1 / 1'], ['tall', '세로', '4 / 5'], ['full', '꽉 채움', '3 / 4.3']] as const).filter(([k]) => k !== 'full' || data.phone.ddayLook === 'card').map(([k, l, r]) => (
                    <button key={k} type="button" onClick={() => setPhone({ ddayPhoto: k })} className={choiceCls((data.phone.ddayPhoto || 'wide') === k) + ' !p-2'}>
                      <span className="mx-auto mb-1.5 flex flex-col overflow-hidden rounded-[4px] border border-black/10 bg-white" style={{ width: 28, height: 38 }}>
                        <span className="block bg-gray-300" style={k === 'full' ? { height: '100%' } : { width: '100%', aspectRatio: r }} />
                      </span>
                      <span className="text-[11.5px] block">{l}</span>
                    </button>
                  ))}
                </div>
              </Field>
            )}
            <Field label="글 정렬">{align('textAlign')}</Field>
            {pages.some(p => (p.links || []).length) && <Field label="링크 정렬">{align('linkAlign')}</Field>}
            <Field label="포인트 색">
              <ColorRow value={v.pointColor} options={[data.phone.accent, '#1A1A1A', '#5B7A9E', '#B86B7E', '#5E7F6A']} fallback={data.phone.accent} onChange={c => set({ pointColor: c })} />
            </Field>
            <Field label="확인 버튼">
              <input className={inputCls} maxLength={15} placeholder="확인했습니다" value={v.buttonLabel || ''} onChange={e => set({ buttonLabel: e.target.value })} />
              <div className="flex gap-1.5 flex-wrap mt-2">
                {([['solid', '채움'], ['outline', '테두리'], ['pill', '둥근'], ['soft', '연한'], ['minimal', '글자만']] as const).map(([b, l]) => (
                  <button key={b} type="button" className={pill((v.buttonStyle || 'solid') === b)} onClick={() => set({ buttonStyle: b })}>{l}</button>
                ))}
              </div>
            </Field>
            {toggle(!!v.showDday, 'D-Day 숫자 보이기', b => set({ showDday: b }))}
            {v.showDday && (
              <div className="flex gap-1.5 flex-wrap -mt-1">
                {([['pill', '둥근'], ['outline', '테두리'], ['circle', '원'], ['minimal', '글자만'], ['elegant', '장식']] as const).map(([b, l]) => (
                  <button key={b} type="button" className={pill((v.ddayStyle || 'pill') === b)} onClick={() => set({ ddayStyle: b })}>{l}</button>
                ))}
              </div>
            )}
            {toggle(!!v.showDismissToday, '오늘 하루 안 보기 버튼', b => set({ showDismissToday: b }))}
            <button type="button" disabled={!pages.length} onClick={() => setDdayPreview(true)}
              className="w-full h-10 rounded-md text-sm font-medium text-white disabled:opacity-40" style={{ background: 'var(--ed-accent)' }}>
              팝업 미리보기
            </button>
            {!pages.length && <p className="text-[12px] -mt-2 text-center" style={{ color: 'var(--ed-text-muted)' }}>안내를 하나 이상 넣으면 미리 볼 수 있습니다.</p>}
          </>}
        </Section>
      )
    }
    if (k === 'bgm') {
      const bgm = data.bgm || { enabled: false, url: '', autoplay: true }
      const setBgm = (patch: Partial<NonNullable<PhoneData['bgm']>>) => update(d => ({ ...d, bgm: { ...(d.bgm || { enabled: false, url: '', autoplay: true }), ...patch } }))
      const custom = !!bgm.url && !getBgmPresetByUrl(bgm.url)
      const listen = (url: string) => {
        const a = bgmPreviewRef.current
        if (!a) return
        if (bgmPlaying === url) { a.pause(); setBgmPlaying(null); return }
        a.src = url; a.play().then(() => setBgmPlaying(url)).catch(() => setBgmPlaying(null))
      }
      return (
        <Section title="배경음악">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!bgm.enabled} onChange={e => { setBgm({ enabled: e.target.checked }); if (!e.target.checked) { bgmPreviewRef.current?.pause(); setBgmPlaying(null) } }} />배경음악 사용</label>
          {bgm.enabled && <>
            <div className="space-y-1.5">
              {bgmPresets.map(pr => (
                <div key={pr.id} className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${bgm.url === pr.url ? 'border-[color:var(--ed-accent)] bg-[color:var(--ed-surface-2)] font-semibold' : 'border-gray-200 bg-white'}`}>
                  <button type="button" onClick={() => listen(pr.url)} aria-label="미리 듣기" className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--ed-surface-2)' }}>
                    {bgmPlaying === pr.url
                      ? <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor" /></svg>
                      : <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="currentColor" /></svg>}
                  </button>
                  <button type="button" onClick={() => setBgm({ url: pr.url, enabled: true })} className="flex-1 min-w-0 text-left">
                    <span className="block text-sm truncate">{pr.name}</span>
                    <span className="block text-[11px] truncate" style={{ color: 'var(--ed-text-muted)' }}>{pr.description}</span>
                  </button>
                  {bgm.url === pr.url && <Check size={15} strokeWidth={2.6} style={{ color: 'var(--ed-accent)' }} aria-hidden />}
                </div>
              ))}
            </div>
            <Field label="직접 올리기">
              {custom ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm flex-1">내 음악</span>
                  <button type="button" className={pill(false)} onClick={() => listen(bgm.url)}>{bgmPlaying === bgm.url ? '멈춤' : '듣기'}</button>
                  <button type="button" className={pill(false)} onClick={() => setBgm({ url: '' })}>삭제</button>
                </div>
              ) : !invitationId ? (
                <p className="text-xs" style={{ color: 'var(--ed-text-muted)' }}>저장한 뒤 올릴 수 있습니다.</p>
              ) : (
                <label className={pill(false) + ' inline-flex cursor-pointer'}>
                  {busy === 'bgm' ? '올리는 중…' : 'MP3 올리기 (10MB까지)'}
                  <input type="file" accept="audio/mpeg,audio/mp3" className="hidden" onChange={async e => {
                    const f = e.target.files?.[0]; e.target.value = ''
                    if (!f) return
                    if (f.size > 10 * 1024 * 1024) { flash('10MB 이하만 올릴 수 있어요'); return }
                    setBusy('bgm')
                    try {
                      const fd = new FormData(); fd.append('file', f); fd.append('invitationId', invitationId)
                      const res = await fetch('/api/upload-audio', { method: 'POST', body: fd })
                      const r = await res.json() as { success?: boolean; url?: string; error?: string }
                      if (r.success && r.url) setBgm({ url: r.url, enabled: true })
                      else flash(r.error || '올리지 못했어요')
                    } catch { flash('올리지 못했어요') } finally { setBusy(null) }
                  }} />
                </label>
              )}
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--ed-text-muted)' }}>저작권 문제가 없는 음원만 등록해야 합니다. 음악 사용으로 인한 저작권 관련 책임은 업로드한 본인에게 있습니다.</p>
            </Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={bgm.autoplay !== false} onChange={e => setBgm({ autoplay: e.target.checked })} />자동 재생 (잠금을 풀 때)</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!bgm.showNotification} onChange={e => setBgm({ showNotification: e.target.checked })} />음악 안내 표시</label>
            {bgm.showNotification && <Field label="안내 문구"><input className={inputCls} value={bgm.notificationText || ''} placeholder="배경음악이 준비되어 있어요" onChange={e => setBgm({ notificationText: e.target.value })} /></Field>}
            <Field label="홈 화면 위젯">
              {data.phone.widgets.some(w => w.type === 'music')
                ? <button type="button" className={pill(false)} onClick={() => { const w = data.phone.widgets.find(x => x.type === 'music')!; setScreen('home'); setSelectedId(w.id) }}>위젯 보기</button>
                : <button type="button" className={pill(false)} onClick={() => { setDraft({ type: 'music', size: 'W', variant: 1 }); setSelectedId(null); setScreen('home') }}>+ 음악 위젯 넣기</button>}
            </Field>
          </>}
        </Section>
      )
    }
    if (k === 'lock') return (
      <>
        <section className="pb-5 mb-5 border-b" style={{ borderColor: 'var(--ed-border)' }}>{colorMoodPicker()}</section>
        <Section title="시계">
          <Field label="한마디"><input className={inputCls} value={data.phone.lockCaption ?? 'our wedding day'} onChange={e => setPhone({ lockCaption: e.target.value })} /></Field>
          {numberFontField('숫자 글꼴', 'lockNumber')}
          <Field label="시계 색">
            <ColorRow value={data.phone.lockClockColor} options={['#FFFFFF', '#F6EFE3', '#E8D5B5', '#F1D3CF', '#D6E0EA', '#1F1F1F', data.phone.accent]} onChange={c => setPhone({ lockClockColor: c })}
              fallback={data.phone.lockStyle === 'poster' ? '#A0A0A0' : data.phone.wallpaper ? '#FFFFFF' : '#7A7A7A'} />
          </Field>
          <Field label="문구 색">
            <ColorRow value={data.phone.lockTextColor} options={['#FFFFFF', '#F6EFE3', '#8A8178', '#1F1F1F', data.phone.accent]} onChange={c => setPhone({ lockTextColor: c })}
              fallback={data.phone.lockStyle !== 'poster' && data.phone.wallpaper ? '#FFFFFF' : '#3A3A3A'} />
          </Field>
          <Field label="정렬">
            <div className="flex gap-1.5">
              {([['left', '왼쪽'], ['center', '가운데'], ['right', '오른쪽']] as const).map(([v, l]) => (
                <button key={v} type="button" className={pill((data.phone.lockClock?.align || 'center') === v)} onClick={() => setPhone({ lockClock: { ...data.phone.lockClock, align: v } })}>{l}</button>
              ))}
            </div>
          </Field>
          <Field label={`위아래 위치 (${(data.phone.lockClock?.y || 0) > 0 ? '+' : ''}${data.phone.lockClock?.y || 0})`}>
            <input type="range" min={-50} max={300} step={2} className="w-full" value={data.phone.lockClock?.y || 0} onChange={e => setPhone({ lockClock: { ...data.phone.lockClock, y: Number(e.target.value) } })} />
          </Field>
          <Field label={`크기 (${Math.round((data.phone.lockClock?.size || 1) * 100)}%)`}>
            <input type="range" min={0.6} max={1.3} step={0.02} className="w-full" value={data.phone.lockClock?.size || 1} onChange={e => setPhone({ lockClock: { ...data.phone.lockClock, size: Number(e.target.value) } })} />
          </Field>
          {data.phone.lockClock && <button type="button" className="text-xs hover:underline" style={{ color: 'var(--ed-text-muted)' }} onClick={() => setPhone({ lockClock: undefined })}>되돌리기</button>}
        </Section>
        <Section title="잠금화면 디자인">
          <div className="grid grid-cols-2 gap-2">
            {LOCK_STYLES.map(o => (
              <button key={o.id} type="button" onClick={() => setPhone({ lockStyle: o.id })} className={choiceCls(data.phone.lockStyle === o.id) + ' !p-2'}>
                <span className="text-xs font-semibold block">{o.label}</span>
              </button>
            ))}
          </div>
          {wallpaperField('대표 사진')}
          {data.phone.lockStyle === 'poster' && data.phone.wallpaper && <>
            <Field label="사진 높이">
              <div className="flex items-center gap-3">
                <span className="text-[11px]" style={{ color: 'var(--ed-text-muted)' }}>낮게</span>
                <input type="range" min={260} max={700} step={10} value={data.phone.posterH ?? POSTER_PHOTO_H} onChange={e => setPhone({ posterH: Number(e.target.value) })} className="flex-1 accent-[color:var(--ed-accent)]" aria-label="사진 높이" />
                <span className="text-[11px]" style={{ color: 'var(--ed-text-muted)' }}>높게</span>
              </div>
            </Field>
            <Field label="경계">
              <div className="flex items-center gap-3">
                <span className="text-[11px]" style={{ color: 'var(--ed-text-muted)' }}>또렷하게</span>
                <input type="range" min={0} max={80} step={2} value={data.phone.posterFade ?? 38} onChange={e => setPhone({ posterFade: Number(e.target.value) })} className="flex-1 accent-[color:var(--ed-accent)]" aria-label="경계 부드러움" />
                <span className="text-[11px]" style={{ color: 'var(--ed-text-muted)' }}>부드럽게</span>
              </div>
            </Field>
          </>}
          {monoField()}
          {data.phone.wallpaper && <button type="button" className="text-xs hover:underline" style={{ color: 'var(--ed-text-muted)' }} onClick={() => setPhone({ wallpaper: '', wallpaperCrop: undefined })}>사진 삭제</button>}
          {(!data.phone.wallpaper || data.phone.lockStyle === 'poster') && (
            <Field label='바탕색'>
              <ColorRow value={data.phone.lockBg} options={LOCK_BG_OPTIONS.filter(c => data.phone.lockStyle !== 'poster' || !isDark(c))} fallback="#FFFFFF" onChange={c => setPhone({ lockBg: c })} />
            </Field>
          )}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={data.phone.fullscreen !== false} onChange={e => setPhone({ fullscreen: e.target.checked ? undefined : false })} />열 때 전체 화면
            <FullscreenHelp /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={data.phone.usePasscode} onChange={e => { setPhone({ usePasscode: e.target.checked }); setShowCode(e.target.checked) }} />날짜 비밀번호로 잠그기</label>
          {data.phone.usePasscode && <p className="text-[12px] -mt-2" style={{ color: 'var(--ed-text-muted)' }}>{data.wedding.date ? `비밀번호: ${data.wedding.date.slice(5, 7)}${data.wedding.date.slice(8, 10)} (예식 월일)` : '예식일을 입력해야 작동합니다.'}</p>}
        </Section>
        <Section title="검색창">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!data.phone.lockSearch} onChange={e => setPhone({ lockSearch: e.target.checked || undefined })} />검색창 보이기</label>
          {data.phone.lockSearch && (() => {
            const cur = data.phone.lockSearches?.length ? data.phone.lockSearches : defaultSearchItems(data)
            const apps = (Object.keys(APP_META) as PhoneAppId[]).filter(a => !isAppOff(data, a))
            const set = (next: typeof cur) => setPhone({ lockSearches: next })
            return <>
              <Field label="모양">
                <div className="flex gap-1.5 flex-wrap">
                  {([[undefined, '자동'], [0, '밝게'], [1, '어둡게'], [2, '테두리'], [3, '유리']] as const).map(([v, l]) => (
                    <button key={l} type="button" className={pill(data.phone.lockSearchStyle === v)} onClick={() => setPhone({ lockSearchStyle: v })}>{l}</button>
                  ))}
                </div>
              </Field>
              <Field label="안내 글"><input className={inputCls} maxLength={16} value={data.phone.lockSearchHint ?? ''} placeholder="검색" onChange={e => setPhone({ lockSearchHint: e.target.value || undefined })} /></Field>
              <Field label={`위치 (${data.phone.lockSearchY || 0})`}>
                <input type="range" min={0} max={360} step={4} className="w-full" value={data.phone.lockSearchY || 0} onChange={e => setPhone({ lockSearchY: Number(e.target.value) || undefined })} />
              </Field>
              <Field label="추천 검색어">
                <SearchItemsEditor items={cur} apps={apps} onChange={set} onReset={data.phone.lockSearches?.length ? () => setPhone({ lockSearches: undefined }) : undefined} />
              </Field>
            </>
          })()}
        </Section>
        {(
          <Section title="알림 디자인">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={data.phone.lockNoticeShow ?? data.phone.lockStyle !== 'poster'} onChange={e => setPhone({ lockNoticeShow: e.target.checked })} />알림 보이기</label>
            {(data.phone.lockNoticeShow ?? data.phone.lockStyle !== 'poster') && <>
            <div className="grid grid-cols-3 gap-2">
              {([['card', '알림 카드', '폰 알림처럼'], ['message', '메시지', '말풍선 한 통'], ['live', '라이브 활동', '디데이 · 진행 막대'], ['calendar', '캘린더 초대', '날짜 블록 · 일정'], ['memory', '사진 추억', '사진 위 이름']] as const).map(([v, l]) => (
                <button key={v} type="button" onClick={() => setPhone({ lockNoticeStyle: v })} className={choiceCls((data.phone.lockNoticeStyle || 'card') === v) + ' !p-2'}>
                  <span className="block">{l}</span>
                </button>
              ))}
            </div>
            <Field label="알림 사진">
              <div className="flex gap-2 items-center flex-wrap">
                {data.phone.lockNoticePhoto && (
                  <button type="button" onClick={() => setCropFor({ kind: 'notice' })} title="자르기" className="w-11 h-11 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                    <CroppedImageDiv src={data.phone.lockNoticePhoto} crop={data.phone.lockNoticePhotoCrop} className="w-full h-full" />
                  </button>
                )}
                {data.phone.lockNoticePhoto && <button type="button" className={pill(false)} onClick={() => setCropFor({ kind: 'notice' })}>자르기</button>}
                <UploadButton label={data.phone.lockNoticePhoto ? '변경' : '사진 올리기'} busy={busy === 'notice'}
                  onFile={f => upload('notice', f, url => { setPhone({ lockNoticePhoto: url, lockNoticePhotoCrop: undefined }); setCropFor({ kind: 'notice' }) })} />
                {data.phone.lockNoticePhoto && <button type="button" className={pill(false)} onClick={() => setPhone({ lockNoticePhoto: undefined, lockNoticePhotoCrop: undefined })}>삭제</button>}
              </div>
            </Field>
            <Field label="알림 문구"><textarea rows={2} className={inputCls} value={data.phone.lockNotice} onChange={e => setPhone({ lockNotice: e.target.value })} /></Field>
            <Field label="결혼식 당일 알림 문구">
              <textarea rows={2} className={inputCls} placeholder="예) 오늘 저희 결혼합니다. 조심히 오세요!" value={data.phone.lockNoticeDay || ''} onChange={e => setPhone({ lockNoticeDay: e.target.value })} />
              <p className="text-[11.5px] mt-1" style={{ color: 'var(--ed-text-muted)' }}>결혼식 날 하루만 이 문구로 바뀝니다.</p>
            </Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={data.phone.lockVenue !== false} onChange={e => setPhone({ lockVenue: e.target.checked })} />예식장 정보 넣기</label>
            <Field label={`알림 위치 (${(data.phone.lockNoticeY || 0) > 0 ? '+' : ''}${data.phone.lockNoticeY || 0})`}>
              <input type="range" min={-260} max={200} step={2} className="w-full" value={data.phone.lockNoticeY || 0} onChange={e => setPhone({ lockNoticeY: Number(e.target.value) })} />
            </Field>
            </>}
          </Section>
        )}
      </>
    )
    if (k === 'home') {
      // 홈에서 열 수 있는지 한눈에 — 빠진 화면은 바로 넣기
      const reach = reachableApps(data)
      const dock = dockOf(data)
      // 커플 소개는 내용을 넣었을 때만 점검 (안 쓰는 분이 많아서)
      const apps = (Object.keys(APP_META) as PhoneAppId[]).filter(a => !isAppOff(data, a) && a !== 'camera' && ((a !== 'intro' && a !== 'video') || !isEmptyApp(data, a)))
      const missing = apps.filter(a => !reach.has(a))
      const empty = apps.filter(a => reach.has(a) && isEmptyApp(data, a))
      const toggleDock = (a: PhoneAppId) => {
        if (dock.includes(a)) { setPhone({ dock: dock.filter(x => x !== a) }); return }
        if (dock.length >= DOCK_MAX) { flash(`하단 바에는 ${DOCK_MAX}개까지 넣을 수 있어요`); return }
        setPhone({ dock: [...dock, a] })
      }
      const glassHome = t.homeBg === 'photo'
      return (
      <>
        {/* 홈 화면 장 — 1 · 2 · 3 장 (옆으로 넘기는 홈) */}
        <section className={`pb-5 mb-5 border-b space-y-2 ${mob && mobMode === 'deco' && sheet?.kind === 'focus' ? 'hidden' : ''}`} style={{ borderColor: 'var(--ed-border)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--ed-text)' }}>화면</h3>
          <div className="flex items-center gap-1.5 flex-wrap text-[12.5px]">
            {Array.from({ length: pageCount }, (_, k) => k).map(k => (
              <button key={k} type="button" onClick={() => { setHomePage(k); setSelectedId(null) }}
                className="h-8 min-w-[36px] px-3 rounded-full border font-medium" style={curPage === k ? { background: 'var(--ed-accent)', color: '#F5F0ED', borderColor: 'transparent' } : { background: '#FFFFFF', borderColor: 'var(--ed-border)', color: 'var(--ed-text-muted)' }}>{k + 1}</button>
            ))}
            {pageCount < HOME_PAGES_MAX && <button type="button" className="h-8 px-3 rounded-full border border-dashed font-medium" style={{ borderColor: 'var(--ed-border)', color: 'var(--ed-accent)' }}
              onClick={() => { setPhone({ homePages: pageCount + 1 }); setHomePage(pageCount); setSelectedId(null) }}>+ 화면 추가</button>}
            {pageCount > 1 && curPage === pageCount - 1 && <button type="button" className="h-8 px-2 font-medium hover:underline" style={{ color: 'var(--ed-text-muted)' }}
              onClick={() => { if (pageWs.length) { flash('위젯을 먼저 빼 주세요'); return } setPhone({ homePages: pageCount - 1 }); setHomePage(pageCount - 2) }}>삭제</button>}
          </div>
        </section>
        <Section title="홈 화면" action={
          <button type="button" onClick={playReveal} className="flex items-center gap-1 text-[12px] font-medium hover:underline" style={{ color: 'var(--ed-accent)' }}>
            <svg width="9" height="9" viewBox="0 0 24 24" aria-hidden><path d="M7 4.5v15l12-7.5z" fill="currentColor" /></svg>열기 효과
          </button>
        }>
          {colorMoodPicker()}
          <div className="grid grid-cols-2 gap-2">
            {Object.values(PHONE_THEMES).map(th => (
              <button key={th.id} type="button" onClick={() => setPhone({ theme: th.id })} className={choiceCls(data.phone.theme === th.id) + ' !p-2'}>
                <div className="h-14 rounded-lg mb-1.5 flex items-end p-1.5 gap-1" style={{ background: th.homeBg === 'photo' ? 'linear-gradient(160deg,#8A8278,#4E4842)' : t.homeBg === 'photo' ? th.bg : t.bg }}>
                  <span className="w-6 h-6 rounded-md" style={{ background: th.homeBg === 'photo' ? th.card : t.homeBg === 'photo' ? th.card : t.card, border: `1px solid ${th.cardBorder}` }} />
                  <span className="w-3.5 h-3.5 rounded" style={{ background: th.homeBg === 'photo' ? th.icon : data.phone.accent }} />
                </div>
                <span className="text-xs font-semibold block">{th.label}</span>
              </button>
            ))}
          </div>
          {(missing.length > 0 || empty.length > 0) && (
            <div className="rounded-lg px-3 py-2.5 space-y-2" style={{ background: 'color-mix(in srgb, var(--ed-accent) 9%, white)' }}>
              {missing.length > 0 && (
                <div className="flex gap-2 items-start">
                  <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden className="mt-[1px] shrink-0"><circle cx="12" cy="12" r="10" fill="var(--ed-accent)" /><path d="M12 7v6M12 16.5h.01" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" /></svg>
                  <div className="min-w-0">
                    <p className="text-[12.5px] leading-snug"><b className="font-semibold">{missing.map(a => APP_META[a].label).join(', ')}</b> 화면이 홈에 없습니다</p>
                    <div className="flex gap-1.5 flex-wrap mt-1.5">
                      {missing.map(a => (
                        <button key={a} type="button" title="홈 화면에 아이콘으로 넣기" onClick={() => addWidget('app', a)}
                          className="h-7 px-2.5 rounded-full text-[12px] font-medium bg-white hover:opacity-80" style={{ color: 'var(--ed-accent)', boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--ed-accent) 30%, white)' }}>+ {APP_META[a].label}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {empty.length > 0 && (
                <p className="text-[12px]" style={{ color: 'var(--ed-text-muted)' }}>
                  내용이 비어 하객에게 보이지 않습니다:{' '}
                  {empty.map((a, i) => <span key={a}>{i > 0 && ', '}<button type="button" className="underline" onClick={() => setScreen(a)}>{APP_META[a].label}</button></span>)}
                </p>
              )}
            </div>
          )}
        </Section>
        <Section title="바탕">
          {glassHome ? (
            <>
              {homePhotoField()}
              {homeDimField(-34)}
              <Field label="글자 색">
                <ColorRow value={data.phone.glassInk} options={['#FFFFFF', '#1F1F1F', '#5A5A5A', '#8C6A5A', data.phone.accent]} fallback="#FFFFFF" onChange={c => setPhone({ glassInk: c })} />
              </Field>
            </>
          ) : (
            <>
              <Field label="빠른 시작">
                <div className="grid grid-cols-3 gap-2">
                  {HOME_PRESETS.map(pr => {
                    const on = data.phone.homeBgColor === pr.bg && data.phone.cardColor === pr.card && data.phone.barColor === pr.bar && !!data.phone.homePattern === !!pr.pattern
                    return (
                      <button key={pr.id} type="button" className={choiceCls(on) + ' !p-1.5'}
                        onClick={() => setPhone({ homeBgColor: pr.bg, cardColor: pr.card, barColor: pr.bar, homePattern: !!pr.pattern })}>
                        <span className="block h-12 rounded-md relative overflow-hidden border border-black/5"
                          style={{ background: pr.bg, ...(pr.pattern ? { backgroundImage: 'linear-gradient(rgba(0,0,0,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.09) 1px, transparent 1px)', backgroundSize: '6px 6px' } : null) }}>
                          <span className="absolute left-1.5 top-1.5 w-5 h-5 rounded" style={{ background: pr.card }} />
                          <span className="absolute left-7 top-1.5 w-3 h-3 rounded-sm" style={{ background: pr.card }} />
                          <span className="absolute left-1 right-1 bottom-1 h-2 rounded-sm" style={{ background: pr.bar }} />
                        </span>
                        <span className="text-xs font-semibold block mt-1 text-center">{pr.label}</span>
                      </button>
                    )
                  })}
                </div>
              </Field>
              {homeBgField()}
              {homePhotoField()}
              {data.phone.homeImage && homeDimField(-12)}
              {data.phone.homeImage && <>
                <Field label="색 덮기">
                  <ColorRow value={data.phone.homeTint} options={['#FFFFFF', '#F3E6DA', '#E9DDF2', '#DCE9DF', '#D7E3F2', '#1E1E1E', data.phone.accent]} onChange={c => setPhone({ homeTint: c })} />
                </Field>
                {data.phone.homeTint && (
                  <Field label="덮는 정도">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px]" style={{ color: 'var(--ed-text-muted)' }}>연하게</span>
                      <input type="range" min={5} max={90} step={5} value={data.phone.homeTintAlpha ?? 35} onChange={e => setPhone({ homeTintAlpha: Number(e.target.value) })} className="flex-1 accent-[color:var(--ed-accent)]" aria-label="덮는 정도" />
                      <span className="text-[11px]" style={{ color: 'var(--ed-text-muted)' }}>진하게</span>
                    </div>
                  </Field>
                )}
              </>}
              {!data.phone.homeImage && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!data.phone.homePattern} onChange={e => setPhone({ homePattern: e.target.checked })} />모눈 무늬</label>}
            </>
          )}
        </Section>
        <Section title="위젯 · 아이콘">
          {!glassHome && (
            <Field label="위젯 색">
                <ColorRow value={data.phone.cardColor} options={CARD_COLOR_OPTIONS} fallback={PHONE_THEMES.white.card} onChange={c => setPhone({ cardColor: c })} />
            </Field>
          )}
          <Field label="앱 아이콘">
            <div className="grid grid-cols-4 gap-2">
              {([['accent', '버튼 색'], ['color', '컬러 앱'], ['white', '흰색'], ['glass', '유리']] as const).map(([v, l]) => (
                <button key={v} type="button" onClick={() => setPhone({ iconStyle: v })} className={choiceCls((data.phone.iconStyle || 'accent') === v) + ' !p-2'}>
                  <span className="flex justify-center gap-1 mb-1.5 rounded-md py-1" style={v === 'glass' ? { background: 'linear-gradient(135deg,#B9C3C9,#E2D6C4)' } : undefined}>
                    {(['memo', 'rsvp', 'call'] as const).map(a => (
                      <span key={a} className="w-5 h-5 rounded-[6px]" style={{
                        background: v === 'color' ? { memo: 'linear-gradient(180deg,#FFC66B,#FF9500)', rsvp: 'linear-gradient(180deg,#6CC0FF,#1E7CF2)', call: 'linear-gradient(180deg,#72E485,#28B84C)' }[a] : v === 'white' ? '#FFFFFF' : v === 'glass' ? 'rgba(255,255,255,0.38)' : data.phone.accent,
                        boxShadow: v === 'white' ? '0 1px 2px rgba(0,0,0,0.15)' : v === 'glass' ? 'inset 0 1px 0 rgba(255,255,255,0.8), inset 0 0 0 1px rgba(255,255,255,0.4)' : undefined,
                      }} />
                    ))}
                  </span>
                  <span className="text-xs block">{l}</span>
                </button>
              ))}
            </div>
          </Field>
          {accentField()}
          {monoField()}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={data.phone.statusBar !== false} onChange={e => setPhone({ statusBar: e.target.checked })} />위쪽 상태바 (시각 · 배터리)</label>
        </Section>
        <Section title="하단 바">
          <Field label={`넣을 화면 (${dock.length}/${DOCK_MAX})`}>
            <div className="flex gap-1.5 flex-wrap">
              {apps.map(a => (
                <button key={a} type="button" className={pill(dock.includes(a))} onClick={() => toggleDock(a)}>
                  {dock.includes(a) && <span className="mr-1 opacity-70">{dock.indexOf(a) + 1}</span>}{APP_META[a].label}
                </button>
              ))}
            </div>
          </Field>
          {!glassHome && (
            <Field label="바 색">
                <ColorRow value={data.phone.barColor} options={BAR_COLOR_OPTIONS} fallback={PHONE_THEMES.white.bar} onChange={c => setPhone({ barColor: c })} />
            </Field>
          )}
        </Section>
        <Section title="글꼴">
          {titleFontField()}
          {bodyFontField()}
          {numberFontField()}
        </Section>
      </>
      )
    }
    // 앱 화면들 — 그 화면의 디자인 · 내용
    return screenPanel()
  }

  /* 참석 회신 양식 미리보기 — 설정한 항목이 그대로 보인다 (제출은 하지 않는 미리보기 주소) */
  const rsvpPreview = normalizeRsvpSettings('narrative-phone', data)
  const renderRsvpPreview = rsvpPreview.enabled
    ? (opts?: { attendance?: 'attending' | 'not_attending' | 'pending' }) => (
        <div style={{ pointerEvents: 'none' }}>
          <RsvpForm invitationId="editor-preview" primaryColor={data.phone.accent} initialAttendance={opts?.attendance}
            allowGuestCount={rsvpPreview.allowGuestCount} showMealOption={rsvpPreview.showMealOption} showShuttleOption={rsvpPreview.showShuttleOption}
            showAfterPartyOption={rsvpPreview.showAfterPartyOption} showPhoneOption={rsvpPreview.showPhoneOption} showSideDetail={rsvpPreview.showSideDetail}
            sideDetailOptions={rsvpPreview.sideDetailOptions} notice={rsvpPreview.notice} messagePlaceholder={rsvpPreview.messagePlaceholder} />
        </div>
      )
    : undefined

  /* ───── 화면 ───── */
  const widgetAddBox = (
<div className="rounded-xl bg-white border p-3" style={{ borderColor: 'var(--ed-border)' }}>
          <h3 className="text-[13px] font-semibold flex items-center gap-1.5"><span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--ed-accent)' }}><svg width="10" height="10" viewBox="0 0 10 10" aria-hidden><path d="M5 1v8M1 5h8" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" /></svg></span>위젯 추가</h3>
          <div className="h-2.5" />
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-1.5">
            {WIDGET_CATALOG.filter(m => m.type !== 'app').map(m => {
              // 홈에 이미 넣은 위젯 — 포인트 색 바탕 · 굵게 · 개수
              const used = data.phone.widgets.filter(w => w.type === m.type).length
              return (
              <button key={m.type} type="button" aria-pressed={draft?.type === m.type} title="눌러서 고르거나, 폰 화면으로 끌어다 놓기"
                onPointerDown={e => startNewDrag(e, { type: m.type, size: sizeForNew(m.type, m.defaultSize), variant: 0, label: m.label })}
                onClick={() => { if (dragClick.current) return; setDraft({ type: m.type, size: sizeForNew(m.type, m.defaultSize), variant: 0 }); setSelectedId(null); setPanel('home'); setScreenRaw('home'); setMobileTab('settings') }} className="text-left px-3 py-2 rounded-lg border border-transparent bg-[#F5F3F0] hover:border-gray-300 hover:bg-white cursor-grab active:cursor-grabbing touch-none"
                style={used ? { background: '#FFFFFF', borderColor: 'var(--ed-accent)' } : { background: '#EFEDEA', color: '#A39D95' }}>
                <span className="text-sm flex justify-between items-center gap-2">
                  <span style={{ fontWeight: used ? 700 : 400, color: used ? 'var(--ed-accent)' : undefined }}>{m.label}</span>
                  {used
                    ? <span className="text-[10.5px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-white" style={{ background: 'var(--ed-accent)' }} title={`홈에 ${used}개`}>{used}</span>
                    : <span className="text-[11px]" style={{ color: 'var(--ed-text-muted)' }}>{SIZE_LABEL[m.defaultSize]}</span>}
                </span>
              </button>
              )
            })}
          </div>
          <p className="text-[11.5px] font-medium mt-3.5 mb-1.5" style={{ color: 'var(--ed-text-muted)' }}>앱 아이콘</p>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(APP_META) as PhoneAppId[]).map(a => { const onHome = data.phone.widgets.some(w => (w.type === 'app' && w.props.app === a) || (w.type === 'folder' && (w.props.apps?.length ? w.props.apps : FOLDER_DEFAULT_APPS).includes(a))); return <button key={a} type="button" className={pill(false) + ' cursor-grab touch-none'} style={onHome ? { background: '#FFFFFF', borderColor: 'var(--ed-accent)', color: 'var(--ed-accent)', fontWeight: 700 } : { background: '#EFEDEA', borderColor: 'transparent', color: '#A39D95' }} title={onHome ? '홈에 있음 (폴더 포함)' : undefined} onPointerDown={e => startNewDrag(e, { type: 'app', size: 'S', variant: 0, app: a, label: APP_META[a].label })} onClick={() => { if (!dragClick.current) addWidget('app', a) }}>{APP_META[a].label}</button> })}
          </div>
          </div>
  )

  const canvasOverlays = (
    <>
          {drag && drag.id !== 'new' && (
            <div ref={trashRef} aria-label="삭제" className="absolute bottom-6 left-1/2 z-10 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all"
              style={{ background: overTrash ? '#D64545' : 'rgba(44,40,36,0.88)', transform: `translateX(-50%) scale(${overTrash ? 1.18 : 1})` }}>
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
          )}
          {undoW && !drag && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 pl-4 pr-2 h-11 rounded-full text-sm text-white shadow-lg" style={{ background: 'rgba(44,40,36,0.92)' }} role="status">
              삭제됨
              <button type="button" className="h-8 px-3 rounded-full bg-white/15 hover:bg-white/25 font-semibold"
                onClick={() => { setUndoW(null); undo() }}>되돌리기</button>
            </div>
          )}
          {notice && <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm text-white shadow-lg" style={{ background: 'rgba(44,40,36,0.92)' }} role="status">{notice}</div>}
    </>
  )

  // 미리보기에 쓰는 데이터 — 새 청첩장은 빈 칸을 예시로 채움 (저장 · 하객 화면은 실제 값)
  const view = useMemo(() => (example && !invitationId ? fillPhoneExample(data, example) : data), [data, example, invitationId])
  const canvas = (
    <div style={{ width: PHONE_W * scale, height: PHONE_H * scale }}>
      <div ref={phoneRef} onClickCapture={e => {
        // 에디터 안에서 링크를 누르면 페이지를 떠나지 않게 — 전화 · 문자는 안내만, 다른 주소는 새 창
        const a = (e.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null
        if (!a) return
        const href = a.getAttribute('href') || ''
        if (!href || href === '#') return
        e.preventDefault()
        if (/^(tel|sms|mailto):/i.test(href)) { flash(`하객 화면에서 ${/^tel/i.test(href) ? '전화' : /^sms/i.test(href) ? '문자' : '메일'}가 열려요`); return }
        window.open(href, '_blank', 'noopener')
      }} className="ed-preview" style={{ width: PHONE_W, height: PHONE_H, transform: `scale(${scale})`, transformOrigin: '0 0', position: 'relative', overflow: 'hidden', borderRadius: 44, boxShadow: '0 30px 60px -28px rgba(20,18,15,0.55), 0 0 0 10px #1C1A18', background: t.bg, userSelect: 'none' }}>
        {preview ? <PhoneFlow key={previewKey} data={view} height={PHONE_H} renderRsvp={renderRsvpPreview} startScreen={previewStart} onScreen={followPreview} photoShareHref={photoShareHref} /> : <>
          {screen === 'lock' && revealing && <HomeScreen data={view} reveal />}
          {screen === 'lock' && !revealing && (showCode && view.phone.usePasscode
            ? <PasscodeScreen data={view} onDone={() => { setRevealing(true); setTimeout(() => { setRevealing(false); setShowCode(false) }, 2200) }} onCancel={() => setShowCode(false)} />
            : <ReturnCtx.Provider value={{ startOpen: edReopen, go: (a, key) => { lockReturn.current = key; setEdReopen(null); setScreen(a) } }}><LockScreen data={view} onOpen={() => (view.phone.usePasscode && view.wedding.date ? setShowCode(true) : setScreen('home'))} onOpenVenue={() => { lockReturn.current = ''; setScreen('memo') }} onOpenApp={a => setScreen(a)} /></ReturnCtx.Provider>)}
          {screen === 'home' && (revealing
            ? <HomeScreen key={revealKey} data={view} reveal />
            : <LetterPreviewCtx.Provider value={true}><HomeScreen data={view} editing={editing} /></LetterPreviewCtx.Provider>)}
          {screen !== 'lock' && screen !== 'home' && <LetterPreviewCtx.Provider value={true}><PhotoShareCtx.Provider value={photoShareHref}><AppView key={screen} app={screen} data={view} onBack={() => { const prev = navHist.current.pop(); if (prev) { setScreen(prev); return } if (lockReturn.current !== null) { setEdReopen(lockReturn.current || null); lockReturn.current = null; setScreen('lock'); return } setScreen('home') }} onNavigate={a => { navHist.current.push(screen as PhoneAppId); setScreen(a) }} renderRsvp={renderRsvpPreview} /></PhotoShareCtx.Provider></LetterPreviewCtx.Provider>}
        </>}
        {ddayPreview && view.ddayPopup?.enabled && <DdayPhonePopup data={view} preview onClose={() => setDdayPreview(false)} />}
      </div>
    </div>
  )

  /* ───── 휴대폰 꾸미기 ───── */
  const decoOn = mob && mobMode === 'deco' && !preview
  const closeSheet = () => { setSheet(null); setSelectedId(null); setDraft(null) }
  const openFocus = (parts: { panel: PanelId; secs: string[] | null }[]) => { setSelectedId(null); setDraft(null); setSheet({ kind: 'focus', parts }) }
  // 위쪽 버튼으로 연 설정은 누른 자리가 없음 (폰 가운데를 보여 줌) — 폰을 누르면 onPointerDownCapture 가 다시 채움
  const clearTap = () => { decoTapY.current = null; decoTapX.current = null; setSheetFrac(f => (f < 0.08 ? 0.75 : f)) }
  // 폰에서 누른 곳 → 그 설정 묶음
  const ED_MAP: Record<string, { panel: PanelId; secs: string[] | null }[]> = {
    clock: [{ panel: 'lock', secs: ['시계'] }, { panel: 'home', secs: ['글꼴'] }],
    notice: [{ panel: 'lock', secs: ['알림 디자인'] }],
    search: [{ panel: 'lock', secs: ['검색창'] }],
    lockbg: [{ panel: 'lock', secs: ['잠금화면 디자인'] }],
    dock: [{ panel: 'home', secs: ['하단 바'] }],
    homebg: [{ panel: 'home', secs: ['홈 화면', '바탕', '위젯 · 아이콘'] }],
  }
  const onDecoClick = (e: React.MouseEvent) => {
    doneCoach()
    if (widgetDragged.current) { e.stopPropagation(); return }
    // 설정을 넣어 둔 채 폰을 누르면 다시 꺼냄
    if (decoOn) setSheetFrac(f => (f < 0.08 ? 0.75 : f))
    if (!decoOn || (screen !== 'lock' && screen !== 'home')) return
    const el = e.target as HTMLElement
    // 누른 자리로 판단 (위젯을 고르면 다시 그려져 click 대상이 바탕으로 바뀔 수 있음 · 장식 층이 위에 겹치기도 함)
    const inside = (x: Element) => { const r = x.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom }
    // 위젯을 누르면 바로 아래 시트가 열려 폰이 작아짐 → 누른 순간에 기억해 둔 것으로 판단
    if (decoDownOnWidget.current || el.closest('[data-widget-id]')) { decoDownOnWidget.current = false; e.stopPropagation(); setSheet(null); return }
    // 시계 · 알림 · 검색창 · 하단 바가 바탕보다 먼저
    const hit = [...e.currentTarget.querySelectorAll<HTMLElement>('[data-ed]')].find(x => x.dataset.ed !== 'lockbg' && x.dataset.ed !== 'homebg' && inside(x))
    const ed = hit?.dataset.ed || el.closest('[data-ed]')?.getAttribute('data-ed')
    if (!ed || !ED_MAP[ed]) return
    e.preventDefault(); e.stopPropagation()
    openFocus(ED_MAP[ed])
  }
  const isAppScr = screen !== 'lock' && screen !== 'home'
  const decoSheet: ReactNode = !decoOn ? null
    : draft ? draftPanel(draft)
    : selected && screen === 'home' ? (
      <>
        {selected.type === 'app' && selected.props.app && (
          <button type="button" className="w-full h-11 rounded-xl text-sm font-semibold text-white mb-5" style={{ background: 'var(--ed-accent)' }}
            onClick={() => { const a = selected.props.app!; closeSheet(); navHist.current = []; setScreen(a) }}>{APP_META[selected.props.app].label} 내용 고치기<ChevronRight size={16} className="inline -mt-0.5 ml-0.5" aria-hidden /></button>
        )}
        {widgetPanel(selected)}
      </>
    )
    : isAppScr ? panelFor(screen)
    : sheet?.kind === 'add' ? widgetAddBox
    : sheet?.kind === 'focus' ? sheet.parts.map((x, i) => <SecFocus.Provider key={i} value={x.secs}>{panelFor(x.panel)}</SecFocus.Provider>)
    : null
  // 시트가 열리면 누른 자리가 시트 위 보이는 칸 가운데쯤 오도록 넘김
  const decoTapY = useRef<number | null>(null)
  const decoTapX = useRef<number | null>(null)
  const sheetOpen = !!decoSheet
  sheetOpenRef.current = sheetOpen
  useEffect(() => {
    const area = decoAreaRef.current
    if (!area) return
    if (!sheetOpen) { area.scrollTop = 0; return }
    const y = decoTapY.current
    const id = requestAnimationFrame(() => {
      // 폰을 누르지 않고 연 설정(위쪽 버튼 등) — 폰 가운데가 보이게
      if (y == null) { area.scrollTo({ left: Math.max(0, (area.scrollWidth - area.clientWidth) / 2), top: 0 }); return }
      const ph = phoneRef.current
      if (!ph) return
      const pr = ph.getBoundingClientRect(), ar = area.getBoundingClientRect()
      const top = pr.top - ar.top + area.scrollTop, left = pr.left - ar.left + area.scrollLeft
      const x = decoTapX.current ?? pr.width / 2
      area.scrollTo({ top: Math.max(0, top + y - area.clientHeight * 0.45), left: Math.max(0, left + x - area.clientWidth / 2), behavior: 'smooth' })
    })
    return () => cancelAnimationFrame(id)
  }, [sheetOpen, selectedId, sheet, draft, screen])
  const segTab = (label: string, on: boolean, onClick: () => void) => (
    <button key={label} type="button" onClick={onClick} className="shrink-0 h-[34px] min-w-[52px] px-3 rounded-[9px] text-[13px] font-semibold transition-colors"
      style={on ? { background: '#FFFFFF', color: 'var(--ed-text)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' } : { color: '#6E655D' }}>{label}</button>
  )
  const goScreen = (sc: PhoneScreenId, page?: number) => { closeSheet(); navHist.current = []; lockReturn.current = null; setScreen(sc); if (page !== undefined) setHomePage(page) }
  const toView = () => { closeSheet(); setMobMode('view'); setPreview(true); setPreviewStart(screen); setPreviewKey(k => k + 1) }
  const toDeco = () => { setPreview(false); setMobMode('deco') }
  const mobileDeco = (
    <div className="flex-1 min-h-0 flex flex-col">
      {mobMode === 'deco' && (
        <div className="shrink-0 px-3 pt-2.5 pb-2 flex items-center gap-2">
          {/* 화면 탭 — 잠금 · 홈 · 앱 화면 */}
          <div className="flex-1 min-w-0 flex gap-0.5 p-[3px] rounded-xl overflow-x-auto" style={{ background: '#F2F2F2', scrollbarWidth: 'none' }}>
            {segTab('잠금', screen === 'lock', () => goScreen('lock'))}
            {Array.from({ length: pageCount }, (_, i) => segTab(pageCount > 1 ? `홈 ${i + 1}` : '홈', screen === 'home' && curPage === i, () => goScreen('home', i)))}
            <label className="relative shrink-0 h-[34px] px-2.5 rounded-[9px] flex items-center gap-1 text-[13px] font-semibold"
              style={isAppScr ? { background: '#FFFFFF', color: 'var(--ed-text)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' } : { color: '#6E655D' }}>
              <span className="max-w-[88px] truncate">{isAppScr ? SCREENS.find(x => x.id === screen)?.label : '앱'}</span><ChevronDown size={14} aria-hidden />
              <select aria-label="화면 고르기" className="absolute inset-0 opacity-0" value={isAppScr ? screen : ''}
                onChange={e => { if (e.target.value) { clearTap(); goScreen(e.target.value as PhoneScreenId) } }}>
                <option value="">앱 화면 고르기</option>
                {SCREENS.filter(x => x.id !== 'lock' && x.id !== 'home').map(x => <option key={x.id} value={x.id}>{x.label}</option>)}
              </select>
            </label>
          </div>
          <button type="button" aria-label="추가" onClick={() => setMobMenu('add')} className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: 'var(--ed-accent)' }}><Plus size={20} aria-hidden /></button>
          <button type="button" aria-label="기본 설정" onClick={() => setMobMenu('set')} className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-white border" style={{ borderColor: 'var(--ed-border)', color: 'var(--ed-text)' }}><SlidersHorizontal size={18} aria-hidden /></button>
        </div>
      )}
      <div className="flex-1 min-h-0 relative overflow-hidden">
      {/* 폰 — 늘 화면 가득 그대로. 설정은 오른쪽에서 폰 위로 꺼내 쓰는 서랍 */}
      <div ref={decoAreaRef} className="absolute inset-0 flex justify-center items-center overflow-hidden">
        <div onClickCapture={onDecoClick} onPointerDownCapture={e => { const r = phoneRef.current?.getBoundingClientRect(); decoTapY.current = r ? e.clientY - r.top : null; decoTapX.current = r ? e.clientX - r.left : null; decoDownOnWidget.current = !!(e.target as HTMLElement).closest('[data-widget-id]'); if (decoOn && screen === 'lock') e.stopPropagation() }}
          // 서랍이 나와 있으면 폰을 왼쪽 끝으로 붙여 보이는 부분을 넓게
          style={{ transform: `translate(${sheetOpen && sheetFrac >= 0.08 ? -Math.max(0, (window.innerWidth - PHONE_W * scale) / 2 - 10) : 0}px, -6px)`, transition: 'transform 0.25s ease' }}>{canvas}</div>
        {!decoSheet && <div className="absolute bottom-1 left-0 right-0">{example && !invitationId && <p className="text-[11.5px] text-center pointer-events-none" style={{ color: 'var(--ed-text-faint)' }}>비어 있는 곳은 예시로 보여 줍니다 · 직접 넣으면 바뀝니다</p>}</div>}
        {decoOn && !decoSheet && !coachDone && <p className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-[12.5px] font-semibold text-white pointer-events-none whitespace-nowrap" style={{ background: 'rgba(44,40,36,0.88)' }}>고칠 곳을 눌러 보세요</p>}
        {canvasOverlays}
      </div>
      {decoSheet && (
        <div className="absolute top-0 bottom-0 right-0 z-30 flex" style={{ width: `calc(${sheetFrac * 100}% + 18px)`, transition: sheetDrag.current ? 'none' : 'width 0.25s ease' }}>
          {/* 손잡이 — 좌우로 끌어 필요한 만큼 꺼냄 · 누르면 넣기 ↔ 꺼내기 */}
          <div role="separator" aria-label="설정 꺼내기 · 넣기" className="shrink-0 w-[18px] self-center h-24 flex items-center justify-center touch-none cursor-col-resize select-none rounded-l-xl border border-r-0"
            style={{ borderColor: 'var(--ed-border)', background: '#FFFFFF', boxShadow: '-4px 0 12px rgba(0,0,0,0.08)' }}
            onPointerDown={e => { sheetDrag.current = { x: e.clientX, f: sheetFrac, moved: false }; try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* noop */ } }}
            onPointerMove={e => { const d = sheetDrag.current; if (!d) return; if (Math.abs(e.clientX - d.x) > 4) d.moved = true; if (d.moved) setSheetFrac(Math.max(0, Math.min(0.92, d.f - (e.clientX - d.x) / Math.max(1, window.innerWidth)))) }}
            onPointerUp={() => { const d = sheetDrag.current; sheetDrag.current = null; if (!d) return; if (!d.moved) setSheetFrac(f => (f < 0.08 ? 0.75 : 0)); else setSheetFrac(f => (f < 0.12 ? 0 : f)) }}
            onPointerCancel={() => { sheetDrag.current = null }}>
            <span className="text-[14px] leading-none" style={{ color: 'var(--ed-text-muted)' }}>{sheetFrac < 0.08 ? '‹' : '›'}</span>
          </div>
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden border-l" style={{ background: '#FFFFFF', borderColor: 'var(--ed-border)', boxShadow: '-10px 0 30px rgba(44,40,36,0.12)' }}>
            <div className="shrink-0 h-9 flex items-center justify-end px-1">
              <button type="button" aria-label="닫기" onClick={() => { closeSheet(); if (isAppScr) goScreen('home') }} className="w-9 h-9 flex items-center justify-center text-lg" style={{ color: 'var(--ed-text-muted)' }}><X size={16} className="mx-auto" aria-hidden /></button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 pb-8"
              onFocusCapture={e => { const el = e.target as HTMLElement; if (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 320) }}>{decoSheet}</div>
          </div>
        </div>
      )}
      </div>
      {!decoSheet && (
        <div className="shrink-0 px-3 pt-2 border-t bg-white/90" style={{ borderColor: 'var(--ed-border)', paddingBottom: 'calc(8px + env(safe-area-inset-bottom))' }}>
          {/* 꾸미기 ↔ 미리보기 (하객이 보는 그대로 눌러 보기) */}
          <div className="grid grid-cols-2 p-1 rounded-xl border bg-white" style={{ borderColor: 'var(--ed-border)' }}>
            {([['deco', '꾸미기', toDeco, Pencil], ['view', '미리보기', toView, Play]] as const).map(([m, l, go, Ic]) => (
              <button key={m} type="button" onClick={() => { if (mobMode !== m) go() }} className="h-10 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
                style={mobMode === m ? { background: 'var(--ed-accent)', color: '#F5F0ED' } : { color: 'var(--ed-text-muted)' }}><Ic size={16} aria-hidden />{l}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    // 에디터 화면 글꼴은 Pretendard — 폰 미리보기 안은 하객 화면과 같은 기본 글꼴로 되돌림 (canvas 참고)
    <div className={`theme-neu pf-ed pf-m flex flex-col ${mob ? 'h-[100dvh] overflow-hidden' : 'min-h-screen'} ${PHONE_FONT_VARS}`} style={{ fontFamily: EDITOR_UI_FONT }}>
      <style>{`.pf-ed input[type=checkbox]{appearance:none;-webkit-appearance:none;flex-shrink:0;width:38px;height:22px;border-radius:999px;background:#D9D2CA;position:relative;cursor:pointer;transition:background .2s}
.pf-ed input[type=checkbox]::after{content:"";position:absolute;left:3px;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.2);transition:transform .2s}
.pf-ed input[type=checkbox]:checked{background:var(--ed-accent)}.pf-ed input[type=checkbox]:checked::after{transform:translateX(16px)}
@layer components{.theme-neu.pf-ed.pf-m{background:#FFFFFF!important;--ed-surface-2:#F5F5F4;--ed-border:rgba(0,0,0,0.08);--ed-text-muted:#71717A;--ed-text-faint:#A1A1AA}
.theme-neu.pf-ed.pf-m .editor-header{background:rgba(255,255,255,0.96)!important}}`}</style>
      {/* 휴대폰 ＋ · 기본 설정 메뉴 */}
      {mobMenu && (
        <div className="fixed inset-0 z-[60]" onClick={() => setMobMenu(null)}>
          <div className="absolute inset-0" style={{ background: 'rgba(30,26,22,0.35)' }} />
          <div className="absolute left-3 right-3 bottom-4 rounded-[20px] bg-white p-2 shadow-2xl" style={{ paddingBottom: 'calc(8px + env(safe-area-inset-bottom))' }} onClick={e => e.stopPropagation()}>
            {(mobMenu === 'add'
              ? [
                  { Icon: LayoutGrid, t: '위젯 추가', d: '디데이 · 달력 · 사진 · 방명록 …', on: () => { setMobMenu(null); clearTap(); if (screen !== 'home') goScreen('home'); setSelectedId(null); setDraft(null); setSheet({ kind: 'add' }) } },
                  ...(pageCount < HOME_PAGES_MAX ? [{ Icon: SquareStack, t: '홈 화면 추가', d: '옆으로 넘기는 화면을 하나 더', on: () => { setMobMenu(null); closeSheet(); setPhone({ homePages: pageCount + 1 }); goScreen('home', pageCount); flash(`홈 ${pageCount + 1} 화면을 더했습니다`) } }] : []),
                  ...(screen === 'home' && pageCount > 1 && curPage === pageCount - 1 ? [{ Icon: Trash2, t: '이 홈 화면 삭제', d: '위젯이 없는 마지막 화면만 지울 수 있습니다', on: () => { setMobMenu(null); if (pageWs.length) { flash('위젯을 먼저 빼 주세요'); return } setPhone({ homePages: pageCount - 1 }); goScreen('home', pageCount - 2) } }] : []),
                ]
              : ([['info', '결혼식 정보', '이름 · 연락처 · 예식 · 공유 썸네일'], ['bgm', '배경음악', '청첩장을 열면 흐르는 음악'], ['dday', 'D-Day 팝업', '처음 열 때 뜨는 안내']] as const).map(([id, t, d]) => ({ Icon: SlidersHorizontal, t, d, on: () => { setMobMenu(null); clearTap(); openFocus([{ panel: id, secs: null }]) } }))
            ).map((it, i) => (
              <button key={it.t} type="button" onClick={it.on} className="w-full flex items-center gap-3 p-3 text-left" style={i ? { borderTop: '1px solid #F1ECE6' } : undefined}>
                <span className="w-[42px] h-[42px] rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--ed-accent-weak)', color: 'var(--ed-accent)' }}><it.Icon size={20} aria-hidden /></span>
                <span className="min-w-0"><span className="block text-[15px] font-bold" style={{ color: 'var(--ed-text)' }}>{it.t}</span><span className="block text-[12.5px] mt-0.5" style={{ color: 'var(--ed-text-muted)' }}>{it.d}</span></span>
              </button>
            ))}
          </div>
        </div>
      )}
      {/* 저장 안 한 내용을 이어서 불러옴 — 원하면 처음 상태로 */}
      {resume && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-24 z-[70] w-[calc(100%-24px)] max-w-[420px] flex items-center gap-2.5 pl-4 pr-2 py-2 rounded-2xl text-white shadow-2xl" style={{ background: 'rgba(36,32,28,0.94)' }}>
          <History size={18} aria-hidden className="shrink-0 opacity-80" />
          <span className="flex-1 min-w-0 text-[13px] leading-snug">저장하지 않은 내용을 이어서 불러왔습니다</span>
          <button type="button" className="shrink-0 h-8 px-3 rounded-lg text-[12.5px] font-semibold bg-white/15" onClick={() => { setData(resume.data); setIsDirty(false); try { localStorage.removeItem(draftKey) } catch { /* noop */ } setResume(null) }}>처음 상태로</button>
          <button type="button" aria-label="닫기" className="shrink-0 w-8 h-8 flex items-center justify-center opacity-70" onClick={() => setResume(null)}><X size={16} aria-hidden /></button>
        </div>
      )}
      {/* 저장 뒤 — 바로 보내기 */}
      {savedSheet && invitationId && (() => {
        const link = `https://invite.deardrawer.com/i/${invitationId}`
        return (
          <div className="fixed inset-0 z-[65] flex items-end sm:items-center justify-center" onClick={() => setSavedSheet(false)}>
            <div className="absolute inset-0" style={{ background: 'rgba(30,26,22,0.35)' }} />
            <div className="relative w-full sm:max-w-[420px] rounded-t-[24px] sm:rounded-[22px] bg-white px-5 pt-3 pb-6 shadow-2xl" style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }} onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 rounded-full mx-auto mb-4 sm:hidden" style={{ background: '#DDD5CD' }} />
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#E7EFE6', color: '#3C6B45' }}><Check size={19} strokeWidth={2.6} aria-hidden /></span>
                <div><h3 className="text-[17px] font-bold" style={{ color: 'var(--ed-text)' }}>청첩장이 저장되었습니다</h3><p className="text-[12.5px] mt-0.5" style={{ color: 'var(--ed-text-muted)' }}>이제 하객에게 보내 보세요</p></div>
                <button type="button" aria-label="닫기" className="ml-auto w-9 h-9 rounded-lg flex items-center justify-center" style={{ color: 'var(--ed-text-muted)' }} onClick={() => setSavedSheet(false)}><X size={18} aria-hidden /></button>
              </div>
              <div className="flex items-center gap-2 pl-3.5 pr-2 py-2 rounded-2xl mb-4" style={{ background: '#F5F5F4' }}>
                <Link2 size={17} aria-hidden style={{ color: '#8A8178' }} />
                <span className="flex-1 min-w-0 truncate text-[13.5px] font-semibold" style={{ color: '#3A322C' }}>{link.replace('https://', '')}</span>
                <button type="button" className="h-9 px-3 rounded-xl text-[13px] font-semibold text-white flex items-center gap-1" style={{ background: 'var(--ed-accent)' }}
                  onClick={() => { navigator.clipboard?.writeText(link).then(() => { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 1600) }).catch(() => {}) }}>
                  <Copy size={14} aria-hidden />{linkCopied ? '복사됨' : '복사'}</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className="h-12 rounded-xl text-[14px] font-bold flex items-center justify-center gap-1.5 text-white" style={{ background: 'var(--ed-accent)' }} onClick={() => { setSavedSheet(false); setShareOpen(true) }}><Share2 size={17} aria-hidden />카카오톡 · QR 공유</button>
                <a href={`/i/${invitationId}`} target="_blank" rel="noreferrer" className="h-12 rounded-xl text-[14px] font-bold flex items-center justify-center gap-1.5 border" style={{ borderColor: 'var(--ed-border)', color: 'var(--ed-text)' }}><Eye size={17} aria-hidden />하객 화면 보기</a>
              </div>
            </div>
          </div>
        )
      })()}
      {invitationId && (
        <ShareModal open={shareOpen} onOpenChange={setShareOpen} invitationId={invitationId}
          groomName={data.groom.name} brideName={data.bride.name} weddingDate={data.wedding.date} weddingTime={data.wedding.timeDisplay}
          venueName={data.wedding.venue.name} venueAddress={data.wedding.venue.address}
          thumbnailUrl={data.meta.kakaoThumbnail || data.meta.ogImage || data.phone.wallpaper || data.gallery.images[0] || ''}
          shareTitle={data.meta.title} shareDescription={data.meta.description} kakaoImageRatio={data.meta.kakaoThumbnailRatio} />
      )}
      {newDrag && (
        <div style={{ position: 'fixed', left: newDrag.x, top: newDrag.y, transform: 'translate(-50%, -130%)', zIndex: 100, pointerEvents: 'none' }}
          className="text-[12.5px] font-medium text-white">
          <span className="px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap" style={{ background: 'var(--ed-accent)' }}>+ {newDrag.label}</span>
        </div>
      )}
      <audio ref={bgmPreviewRef} onEnded={() => setBgmPlaying(null)} className="hidden" />
      {cropFor?.kind === 'wallpaper' && data.phone.wallpaper && (
        <CropModal title={screen === 'home' ? '바탕 사진' : '대표 사진'} src={data.phone.wallpaper} crop={data.phone.wallpaperCrop}
          aspect={screen !== 'home' && data.phone.lockStyle === 'poster' ? PHONE_W / (data.phone.posterH ?? POSTER_PHOTO_H) : PHONE_W / PHONE_H}
          onChange={c => setPhone({ wallpaperCrop: c })} onClose={() => setCropFor(null)}
          preview={screen === 'home' ? <HomeScreen data={data} /> : <LockScreen data={data} />} />
      )}
      {cropFor?.kind === 'notice' && data.phone.lockNoticePhoto && (
        <CropModal title="알림 사진" src={data.phone.lockNoticePhoto} crop={data.phone.lockNoticePhotoCrop}
          aspect={data.phone.lockNoticeStyle === 'memory' ? 358 / 150 : 1}
          onChange={c => setPhone({ lockNoticePhotoCrop: c })} onClose={() => setCropFor(null)}
          preview={<LockScreen data={data} />} />
      )}
      {cropFor?.kind === 'home' && data.phone.homeImage && (
        <CropModal title="홈 바탕 사진" src={data.phone.homeImage} crop={data.phone.homeImageCrop} aspect={PHONE_W / PHONE_H}
          onChange={c => setPhone({ homeImageCrop: c })} onClose={() => setCropFor(null)}
          preview={<HomeScreen data={data} />} />
      )}
      {cropFor?.kind === 'letterAvatar' && data.phone.letterAvatar?.src && (
        <CropModal title="프로필 사진" src={data.phone.letterAvatar.src} crop={data.phone.letterAvatar.crop} aspect={1}
          onChange={c => setPhone({ letterAvatar: { ...data.phone.letterAvatar!, crop: c } })} onClose={() => setCropFor(null)}
          preview={<LetterPreviewCtx.Provider value={true}><AppView app="letter" data={data} /></LetterPreviewCtx.Provider>} />
      )}
      {cropFor?.kind === 'letter' && (() => {
        const l = (data.phone.letters || []).find(x => x.id === cropFor.id)
        if (!l || !(l.photos || []).includes(cropFor.src)) return null
        const first = l.photos?.[0] === cropFor.src
        return (
          <CropModal title={first ? '편지 대표 사진' : '편지 사진'} src={cropFor.src} crop={l.crops?.[cropFor.src]} aspect={first ? 3 / 4 : 1}
            onChange={c => setPhone({ letters: (data.phone.letters || []).map(x => (x.id === l.id ? { ...x, crops: { ...(x.crops || {}), [cropFor.src]: c } } : x)) })}
            onClose={() => setCropFor(null)}
            preview={<LetterPreviewCtx.Provider value={true}><AppView app="letter" data={data} /></LetterPreviewCtx.Provider>} />
        )
      })()}
      {cropFor?.kind === 'story' && (() => {
        const m = data.phone.story[cropFor.i]
        const src = m?.[cropFor.k]
        if (!src) return null
        const ck = cropFor.k === 'src' ? 'srcCrop' : 'src2Crop'
        const st = data.phone.storyStyle || SCREEN_DEFAULTS.story
        // 디자인마다 사진 칸 비율이 달라 — 많이 쓰는 비율로 맞춘다
        const aspect = st === 'stories' ? PHONE_W / PHONE_H : st === 'feed' ? 1 : st === 'journal' ? 326 / 196 : 4 / 3
        return (
          <CropModal title="이야기 사진" src={src} crop={m[ck]} aspect={aspect}
            onChange={c => setPhone({ story: data.phone.story.map((x, j) => (j === cropFor.i ? { ...x, [ck]: c } : x)) })} onClose={() => setCropFor(null)}
            preview={<AppView app="story" data={data} />} />
        )
      })()}
      {cropFor?.kind === 'avatar' && (() => {
        const p = data[cropFor.side]
        const a: PhoneAvatarFields | undefined = cropFor.i === null ? p : p.family?.[cropFor.i]
        if (!a?.avatarPhoto) return null
        const setA = (c: PhoneAvatarFields['avatarCrop']) => update(d => {
          const q = d[cropFor.side]
          const next = cropFor.i === null ? { ...q, avatarCrop: c } : { ...q, family: (q.family || []).map((f, j) => (j === cropFor.i ? { ...f, avatarCrop: c } : f)) }
          return { ...d, [cropFor.side]: next }
        })
        return (
          <CropModal title="프로필 사진" src={a.avatarPhoto} crop={a.avatarCrop} aspect={1}
            onChange={setA} onClose={() => setCropFor(null)}
            preview={<AppView app="call" data={data} />} />
        )
      })()}
      {cropFor?.kind === 'screen' && (() => {
        const own = data.phone.screenPhotos?.[cropFor.app]
        if (!own?.src) return null
        // 화면 위쪽 사진 높이 — 예식 안내 470 · 참석 회신 360 · 마음 전하기 300, 나머지는 흐린 바탕
        const heroH = ({ memo: 470, rsvp: 360, gift: 300, guestbook: PHONE_W } as Partial<Record<PhoneAppId, number>>)[cropFor.app] || PHONE_H
        return (
          <CropModal title="화면 사진" src={own.src} crop={own.crop} aspect={PHONE_W / heroH}
            onChange={c => setPhone({ screenPhotos: { ...data.phone.screenPhotos, [cropFor.app]: { ...own, crop: c } } })} onClose={() => setCropFor(null)}
            preview={<AppView app={cropFor.app} data={data} />} />
        )
      })()}
      {cropFor?.kind === 'widgetBg' && (() => {
        const w = data.phone.widgets.find(x => x.id === cropFor.id)
        if (!w?.props.bgImg) return null
        return (
          <CropModal title="위젯 배경사진" src={w.props.bgImg} crop={w.props.bgImgCrop} aspect={spanW(w.size) / spanH(w.size)}
            onChange={c => patchWidget(w.id, { props: { bgImgCrop: c } })} onClose={() => setCropFor(null)}
            preview={<HomeScreen data={data} />} />
        )
      })()}
      {cropFor?.kind === 'introBg' && (() => {
        const ip = data.phone.intro?.[cropFor.side]
        if (!ip?.bg) return null
        return (
          <CropModal title="프로필 배경 사진" src={ip.bg} crop={ip.bgCrop} aspect={PHONE_W / PHONE_H}
            onChange={c => setPhone({ intro: { ...(data.phone.intro || {}), [cropFor.side]: { ...ip, bgCrop: c } } })} onClose={() => setCropFor(null)}
            preview={<div style={{ position: 'absolute', inset: 0, background: '#1C1C1E' }}><CroppedImageDiv src={ip.bg} crop={ip.bgCrop} style={{ position: 'absolute', inset: 0 }} /><div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.3), rgba(0,0,0,0.18) 30%, rgba(0,0,0,0.6))' }} /></div>} />
        )
      })()}
      {cropFor?.kind === 'intro' && (() => {
        const ip = data.phone.intro?.[cropFor.side]
        if (!ip?.photo) return null
        return (
          <CropModal title="소개 사진" src={ip.photo} crop={ip.photoCrop} aspect={1}
            onChange={c => setPhone({ intro: { ...(data.phone.intro || {}), [cropFor.side]: { ...ip, photoCrop: c } } })} onClose={() => setCropFor(null)}
            preview={<AppView app="intro" data={data} />} />
        )
      })()}
      {cropFor?.kind === 'widget' && (() => {
        const w = data.phone.widgets.find(x => x.id === cropFor.id)
        if (!w?.props.src) return null
        return (
          <CropModal title="사진 위젯" src={w.props.src} crop={w.props.crop} aspect={w.type === 'app' ? 1 : spanW(w.size) / spanH(w.size)}
            onChange={c => patchWidget(w.id, { props: { crop: c } })} onClose={() => setCropFor(null)}
            preview={<HomeScreen data={data} />} />
        )
      })()}
      <header className="editor-header h-14 flex items-center justify-between px-4 sm:px-6 shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.push('/')} className="cursor-pointer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Dear Drawer" className="h-5 sm:h-6 w-auto" />
          </button>
          <div className="hidden sm:block h-4 w-px" style={{ background: 'var(--ed-border)' }} />
          <span className="hidden sm:inline text-sm font-light tracking-[0.2em]" style={{ color: 'var(--ed-text-faint)' }}>THE PHONE</span>
          {(isDirty || invitationId) && <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--ed-text-muted)' }}>
            <i className="block w-1.5 h-1.5 rounded-full" style={{ background: isDirty ? '#D9A441' : '#5C9A63' }} />{isDirty ? '저장 전' : '저장됨'}
          </span>}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => { setPreview(v => !v); setPreviewStart('lock'); setPreviewKey(k => k + 1); setSelectedId(null) }}
            className={`max-lg:hidden px-3 py-1.5 rounded-lg border text-sm ${preview ? 'border-[color:var(--ed-accent)] text-[color:var(--ed-accent)] bg-white' : 'border-gray-200 bg-white'}`}>{preview ? '편집' : '미리보기'}</button>
          {invitationId && <a href={`/i/${invitationId}`} target="_blank" rel="noreferrer" aria-label="새 창에서 열기" title="새 창에서 열기" className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </a>}
          <span className="flex items-center gap-1">
            <button type="button" onClick={undo} disabled={!hist.undo} aria-label="실행 취소" title="실행 취소 (Ctrl+Z)" className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center disabled:opacity-35">
              <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7L4 12l5 5M4 12h11a5 5 0 0 1 0 10h-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button type="button" onClick={redo} disabled={!hist.redo} aria-label="다시 실행" title="다시 실행 (Ctrl+Shift+Z)" className="max-sm:hidden w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center disabled:opacity-35">
              <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 7l5 5-5 5M20 12H9a5 5 0 0 0 0 10h2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </span>
          <button type="button" onClick={handleSave} disabled={isSaving} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold text-[#F5F0ED] disabled:opacity-60" style={{ background: 'var(--ed-accent)' }}><Check size={15} strokeWidth={2.4} aria-hidden />{isSaving ? '저장 중…' : '저장'}</button>
        </div>
      </header>

      {mob && mobMode !== 'full' ? mobileDeco : <>
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row lg:gap-0 lg:p-0">
        {/* 왼쪽: 화면 · 위젯 추가 */}
        <aside className={`${mobileTab === 'screens' ? '' : 'hidden'} max-lg:flex-1 max-lg:min-h-0 max-lg:overflow-y-auto max-lg:px-4 max-lg:pt-4 max-lg:pb-24 lg:block lg:w-64 lg:shrink-0 lg:border-r lg:p-5 lg:overflow-y-auto lg:h-[calc(100vh-56px)] order-2 lg:order-1`} style={{ borderColor: 'var(--ed-border)' }}>
          <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--ed-text-muted)' }}>기본</h3>
          <div className="flex lg:flex-col gap-1.5 flex-wrap mb-6">
            {([['info', '결혼식 정보'], ['bgm', '배경음악'], ['dday', 'D-Day 팝업']] as const).map(([id, label]) => (
              <button key={id} type="button" onClick={() => { setPanel(id); setSelectedId(null); setDraft(null); setMobileTab('settings'); if (id === 'info' && screen !== 'lock') setScreenRaw('home') }}
                className={`text-left px-3 py-2 rounded-lg text-sm border transition-colors ${panel === id ? 'bg-[color:var(--ed-accent)] text-[#F5F0ED] border-transparent' : 'bg-white border-gray-200 hover:border-gray-300'}`}>{label}</button>
            ))}
          </div>
          {/* 디자인 — 잠금화면 · 홈 화면은 폰 전체 모습을 정하는 곳이라 크게 */}
          <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--ed-text-muted)' }}>디자인</h3>
          <div className="grid grid-cols-2 gap-2 mb-6">
            {SCREENS.filter(s => s.id === 'lock' || s.id === 'home').map(s => {
              const on = panel === s.id
              return (
                <button key={s.id} type="button" onClick={() => { setScreen(s.id); setSelectedId(null); setDraft(null); setMobileTab('settings') }}
                  className="rounded-xl border px-2 pt-3 pb-2.5 flex flex-col items-center gap-2 text-[13px] font-semibold transition-colors"
                  style={on ? { background: 'var(--ed-accent)', borderColor: 'transparent', color: '#F5F0ED' } : { background: '#FFFFFF', borderColor: 'var(--ed-border)', color: 'var(--ed-text)' }}>
                  <svg width="26" height="40" viewBox="0 0 26 40" aria-hidden>
                    <rect x="1" y="1" width="24" height="38" rx="5" fill="none" stroke="currentColor" strokeWidth="1.6" opacity="0.85" />
                    {s.id === 'lock'
                      ? <><rect x="7" y="9" width="12" height="5" rx="1.2" fill="currentColor" opacity="0.85" /><rect x="9" y="17" width="8" height="1.6" rx="0.8" fill="currentColor" opacity="0.5" /><rect x="8" y="33" width="10" height="1.6" rx="0.8" fill="currentColor" opacity="0.6" /></>
                      : <>{[0, 1, 2].map(r => [0, 1, 2].map(c => <rect key={`${r}${c}`} x={5 + c * 6} y={7 + r * 7} width="4" height="4" rx="1.2" fill="currentColor" opacity="0.8" />))}<rect x="4" y="31" width="18" height="5" rx="2" fill="currentColor" opacity="0.35" /></>}
                  </svg>
                  {s.label}
                </button>
              )
            })}
          </div>
          {(() => {
            // 화면마다 진행 상태 — 완료(굵게 · ✓) / 작성 전(연하게 · ○) / 꺼짐
            const apps = SCREENS.filter(x => x.id !== 'lock' && x.id !== 'home').map(x => x.id as PhoneAppId)
            const stateOf = (a: PhoneAppId): 'done' | 'todo' | 'off' => {
              if (isAppOff(data, a)) return 'off'
              if (a === 'camera') return photoShareHref ? 'done' : 'todo'
              if (a === 'memo') return data.wedding.venue.name?.trim() ? 'done' : 'todo'
              return isEmptyApp(data, a) ? 'todo' : 'done'
            }
            const on = apps.filter(a => stateOf(a) !== 'off')
            const doneN = on.filter(a => stateOf(a) === 'done').length
            return <>
              <h3 className="text-xs font-semibold mb-2 flex items-center justify-between" style={{ color: 'var(--ed-text-muted)' }}>
                <span>화면</span><span className="font-medium tabular-nums">{doneN}/{on.length} 완료</span>
              </h3>
              <div className="flex lg:flex-col gap-1.5 flex-wrap mb-6">
                {SCREENS.filter(x => x.id !== 'lock' && x.id !== 'home').map(x => {
                  const st = stateOf(x.id as PhoneAppId)
                  const active = panel === x.id
                  return (
                    <button key={x.id} type="button" onClick={() => { navHist.current = []; lockReturn.current = null; setScreen(x.id); setSelectedId(null); setDraft(null); setMobileTab('settings') }}
                      className={`text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between gap-2 ${active ? 'bg-[color:var(--ed-accent)] text-[#F5F0ED]' : screen === x.id ? 'bg-white' : 'hover:bg-white'}`}>
                      <span style={{ fontWeight: st === 'done' ? 600 : 400, opacity: active ? 1 : st === 'done' ? 1 : st === 'todo' ? 0.55 : 0.4 }}>{x.label}</span>
                      {st === 'off'
                        ? <span className="text-[11px]" style={{ opacity: 0.7 }}>꺼짐</span>
                        : st === 'done'
                        ? <svg width="16" height="16" viewBox="0 0 16 16" aria-label="완료"><circle cx="8" cy="8" r="7.5" fill={active ? '#F5F0ED' : 'var(--ed-accent)'} /><path d="M4.8 8.2l2.1 2.1 4.3-4.5" fill="none" stroke={active ? 'var(--ed-accent)' : '#FFFFFF'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        : <span aria-label="작성 전" style={{ width: 14, height: 14, borderRadius: '50%', border: `1.5px solid ${active ? 'rgba(245,240,237,0.7)' : 'var(--ed-border)'}` }} />}
                    </button>
                  )
                })}
              </div>
            </>
          })()}
          {screen === 'home' && widgetAddBox}
        </aside>

        {/* 가운데: 폰 캔버스 */}
        <main className="lg:flex-1 flex flex-col items-center justify-start max-lg:shrink-0 max-lg:overflow-y-auto max-lg:overflow-x-hidden max-lg:pt-2 max-lg:pb-6 lg:justify-center lg:h-[calc(100vh-56px)] order-1 lg:order-2 relative"
          style={mob ? { height: mobPreviewH } : undefined}>
          {/* 편집(누르면 그 위젯 설정) ↔ 미리보기(하객처럼 누르면 화면 열림) */}
          <div className="mb-2 lg:mb-[22px] inline-flex p-1 rounded-full border bg-white text-[13px] shadow-sm max-lg:sticky max-lg:top-0 max-lg:z-20 max-lg:shrink-0" style={{ borderColor: 'var(--ed-border)' }}>
            {([[false, '편집', Pencil], [true, '미리보기', Play]] as const).map(([v, l, Ic]) => (
              <button key={l} type="button" onClick={() => { if (preview !== v) { setPreview(v); setPreviewStart('lock'); setPreviewKey(k => k + 1); setSelectedId(null) } }}
                className="h-8 px-4 rounded-full font-medium transition-colors inline-flex items-center gap-1.5" style={preview === v ? { background: 'var(--ed-accent)', color: '#F5F0ED' } : { color: 'var(--ed-text-muted)' }}><Ic size={14} aria-hidden />{l}</button>
            ))}
          </div>
          {canvas}
          {!mob && <div className="mt-3">{example && !invitationId && <p className="text-[11.5px] text-center pointer-events-none" style={{ color: 'var(--ed-text-faint)' }}>비어 있는 곳은 예시로 보여 줍니다 · 직접 넣으면 바뀝니다</p>}</div>}
          {canvasOverlays}
        </main>

        {/* 휴대폰 — 미리보기 · 설정 나누는 막대 (끌어서 비율 조절, 두 번 누르면 기본) */}
        <div className="lg:hidden order-1 shrink-0 flex items-center justify-center touch-none cursor-row-resize select-none border-y" role="separator" aria-label="미리보기 크기 조절"
          style={{ height: MOB_BAR, borderColor: 'var(--ed-border)', background: 'rgba(255,255,255,0.7)' }}
          onPointerDown={e => { splitDrag.current = { y: e.clientY, r: split }; try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* noop */ } }}
          onPointerMove={e => { const d = splitDrag.current; if (!d) return; const area = vh - MOB_TOP - MOB_NAV - MOB_BAR; setSplit(Math.max(0.22, Math.min(0.78, d.r + (e.clientY - d.y) / area))) }}
          onPointerUp={() => { splitDrag.current = null }} onPointerCancel={() => { splitDrag.current = null }}
          onDoubleClick={() => setSplit(0.46)}>
          <span className="block w-10 h-1 rounded-full" style={{ background: 'rgba(44,40,36,0.25)' }} />
        </div>

        {/* 오른쪽: 설정 */}
        <aside className={`${mobileTab === 'settings' ? '' : 'hidden'} max-lg:flex-1 max-lg:min-h-0 max-lg:overflow-y-auto max-lg:pb-24 lg:block lg:w-[360px] lg:shrink-0 lg:border-l lg:p-6 lg:overflow-y-auto lg:h-[calc(100vh-56px)] order-3 lg:bg-transparent p-4`} style={{ borderColor: 'var(--ed-border)' }}>
          {draft && screen === 'home' && panel === 'home' ? draftPanel(draft) : screen === 'home' && panel === 'home' && selected ? (
            <>
              <button type="button" className="text-xs mb-4 hover:underline" style={{ color: 'var(--ed-text-muted)' }} onClick={() => setSelectedId(null)}>‹ 홈 화면 설정으로</button>
              {widgetPanel(selected)}
            </>
          ) : panelFor(panel)}
        </aside>
      </div>
      {/* 휴대폰 — 아래 탭 */}
      <nav className="lg:hidden fixed left-0 right-0 bottom-0 z-30 grid grid-cols-3 border-t bg-white/95 backdrop-blur" style={{ borderColor: 'var(--ed-border)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <button type="button" onClick={toDeco} className="h-14 text-sm font-semibold" style={{ color: 'var(--ed-text-muted)' }}>‹ 폰에서 꾸미기</button>
        {([['screens', '화면 · 추가'], ['settings', '설정']] as const).map(([k, l]) => (
          <button key={k} type="button" onClick={() => setMobileTab(k)} className="h-14 text-sm font-semibold" style={{ color: mobileTab === k ? 'var(--ed-accent)' : 'var(--ed-text-muted)' }}>{l}</button>
        ))}
      </nav>
      </>}
    </div>
  )
}

export default function PhoneEditorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-gray-500">불러오는 중…</div>}>
      <PhoneEditorContent />
    </Suspense>
  )
}
