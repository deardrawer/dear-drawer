'use client'

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import SocialProofCounter from '@/components/social-proof/SocialProofCounter'

// 랜덤 슬러그 생성
const generateRandomSlug = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const randomPart = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `invitation-${randomPart}`
}

type TemplateCategory = null | 'story' | 'mini' | 'parents' | 'thankyou' | 'simple' | 'the-series'
type QuizStep = 'q1' | 'q2a' | 'q2b' | 'q3a' | 'q3b' | 'result' | null
type ShowcaseFilter = 'all' | 'story' | 'mini' | 'parents' | 'thankyou'

// 퀴즈 결과 데이터
const QUIZ_RESULTS: Record<string, {
  templateId: string
  templateName: string
  category: string
  categoryLabel: string
  tagline: string
  color: string
  colorBg: string
  colorBorder: string
  points: string[]
  sampleUrl: string
}> = {
  'narrative-our': {
    templateId: 'narrative-our',
    templateName: 'OUR',
    category: 'story',
    categoryLabel: '스토리형',
    tagline: '우리만의 페이지를 천천히 넘기고 싶다면',
    color: 'text-rose-500',
    colorBg: 'bg-rose-500',
    colorBorder: 'border-rose-200',
    points: [
      '풍부한 서사로 우리 이야기를 깊이 있게 전달',
      'AI가 답변을 바탕으로 감동적인 스토리 생성',
      '장기연애, 특별한 에피소드가 있는 커플에게 딱',
    ],
    sampleUrl: '/i/sample-our',
  },
  'narrative-family': {
    templateId: 'narrative-family',
    templateName: 'FAMILY',
    category: 'story',
    categoryLabel: '스토리형',
    tagline: '우리의 시작을 가능하게 해준 이야기를 함께 담고 싶다면',
    color: 'text-blue-500',
    colorBg: 'bg-blue-500',
    colorBorder: 'border-blue-200',
    points: [
      '양가 부모님의 축하 인사말을 함께 담을 수 있어요',
      '서로가 선택한 이유를 신랑/신부 소개로 전달',
      '가족의 축복이 느껴지는 따뜻한 청첩장',
    ],
    sampleUrl: '/i/sample-family',
  },
  'narrative-magazine': {
    templateId: 'narrative-magazine',
    templateName: 'MAGAZINE',
    category: 'mini',
    categoryLabel: '미니 스토리형',
    tagline: '덜어낼수록 더 세련되게',
    color: 'text-gray-800',
    colorBg: 'bg-gray-900',
    colorBorder: 'border-gray-200',
    points: [
      '매거진 인터뷰 형식의 모던한 레이아웃',
      'Q&A로 서로를 소개하는 세련된 구성',
      '스튜디오 촬영 사진과 찰떡 궁합',
    ],
    sampleUrl: '/i/sample-magazine',
  },
  'narrative-film': {
    templateId: 'narrative-film',
    templateName: 'MOVIE',
    category: 'mini',
    categoryLabel: '미니 스토리형',
    tagline: '한 편의 영화처럼, 장면으로 기억되길',
    color: 'text-gray-600',
    colorBg: 'bg-gray-500',
    colorBorder: 'border-gray-200',
    points: [
      '시네마틱한 무드의 독특한 연출',
      '야외/스냅 사진이 영화 장면처럼 연출돼요',
      '남들과 다른 분위기를 원하는 커플에게',
    ],
    sampleUrl: '/i/sample-film',
  },
  'narrative-record': {
    templateId: 'narrative-record',
    templateName: 'RECORD',
    category: 'mini',
    categoryLabel: '미니 스토리형',
    tagline: '우리의 감정을 플레이리스트처럼 담아내는',
    color: '',
    colorBg: '',
    colorBorder: '',
    points: [
      '뮤직 앨범 스타일의 아날로그 감성',
      '따뜻하고 포근한 톤의 디자인',
      '연애 사진을 감성적으로 담고 싶을 때',
    ],
    sampleUrl: '/i/sample-record',
  },
  'narrative-exhibit': {
    templateId: 'narrative-exhibit',
    templateName: 'FEED',
    category: 'mini',
    categoryLabel: '미니 스토리형',
    tagline: '우리의 순간을 피드처럼 펼쳐보는',
    color: 'text-violet-500',
    colorBg: 'bg-violet-500',
    colorBorder: 'border-violet-200',
    points: [
      '인스타 피드 스타일의 트렌디한 구성',
      '여러 컨셉의 사진을 다양하게 보여줄 수 있어요',
      'SNS 감성을 좋아하는 커플에게 추천',
    ],
    sampleUrl: '/i/sample-feed',
  },
  'narrative-essay': {
    templateId: 'narrative-essay',
    templateName: 'ESSAY',
    category: 'mini',
    categoryLabel: '미니 스토리형',
    tagline: '사진 없이도 빛나는, 에세이 같은 청첩장',
    color: 'text-amber-700',
    colorBg: 'bg-amber-700',
    colorBorder: 'border-amber-200',
    points: [
      '사진 없이 타이포그래피만으로 완성',
      '러브스토리 또는 인터뷰 형식 선택 가능',
      '책 넘기기 인터랙션으로 프리미엄 경험',
    ],
    sampleUrl: '/i/sample-essay-book',
  },
  'narrative-the-simple': {
    templateId: 'narrative-the-simple',
    templateName: 'THE SIMPLE',
    category: 'mini',
    categoryLabel: '미니 스토리형',
    tagline: '가장 일반적이면서도 특별한, 세련된 더심플',
    color: 'text-stone-700',
    colorBg: 'bg-stone-800',
    colorBorder: 'border-stone-200',
    points: [
      '에디토리얼 타이포그래피와 고급스러운 여백',
      '모든 섹션에 5~12가지 UI 대안 제공',
      '섹션 순서·폰트·구분선까지 자유 커스텀',
    ],
    sampleUrl: '/i/sample-the-simple',
  },
  'narrative-thankyou': {
    templateId: 'narrative-thankyou',
    templateName: 'THANKS',
    category: 'thankyou',
    categoryLabel: '감사장',
    tagline: '결혼식 후 감사의 마음을 전하는',
    color: 'text-amber-600',
    colorBg: 'bg-amber-500',
    colorBorder: 'border-amber-200',
    points: [
      '결혼식 후 하객분들께 감사 인사를 전하는 감사장',
      '웨딩 사진과 감사 메시지를 함께 담는 구성',
      '모바일로 간편하게 공유',
    ],
    sampleUrl: '/sample/thank-you',
  },
}

// 샘플 쇼케이스 데이터
const SHOWCASE_ITEMS: {
  id: string
  templateId: string
  name: string
  tagline: string
  category: 'story' | 'mini' | 'parents' | 'thankyou'
  categoryLabel: string
  thumbnail: string
  sampleUrl: string
  badgeColor: string
  badgeBg: string
  btnClass: string
  badge?: 'Best' | 'New'
  comingSoon?: boolean
}[] = [
  {
    id: 'our',
    templateId: 'narrative-our',
    name: 'OUR',
    tagline: '우리만의 페이지를 천천히 넘기고 싶다면',
    category: 'story',
    categoryLabel: '스토리형',
    thumbnail: '/sample/preview-our.png',
    sampleUrl: '/i/sample-our',
    badgeColor: 'text-rose-600',
    badgeBg: 'bg-rose-50',
    btnClass: 'bg-rose-500 hover:bg-rose-600',
    badge: 'Best',
  },
  {
    id: 'family',
    templateId: 'narrative-family',
    name: 'FAMILY',
    tagline: '두 가족의 축복으로 완성되는 이야기',
    category: 'story',
    categoryLabel: '스토리형',
    thumbnail: '/sample/preview-family.png',
    sampleUrl: '/i/sample-family',
    badgeColor: 'text-rose-600',
    badgeBg: 'bg-rose-50',
    btnClass: 'bg-rose-500 hover:bg-rose-600',
  },
  {
    id: 'magazine',
    templateId: 'narrative-magazine',
    name: 'MAGAZINE',
    tagline: '덜어낼수록 더 세련되게',
    category: 'mini',
    categoryLabel: '미니스토리형',
    thumbnail: '/sample/preview-magazine.png',
    sampleUrl: '/i/sample-magazine',
    badgeColor: 'text-violet-600',
    badgeBg: 'bg-violet-50',
    btnClass: 'bg-violet-500 hover:bg-violet-600',
    badge: 'Best',
  },
  {
    id: 'movie',
    templateId: 'narrative-film',
    name: 'MOVIE',
    tagline: '한 편의 영화처럼, 장면으로 기억되길',
    category: 'mini',
    categoryLabel: '미니스토리형',
    thumbnail: '/sample/preview-movie.png',
    sampleUrl: '/i/sample-film',
    badgeColor: 'text-violet-600',
    badgeBg: 'bg-violet-50',
    btnClass: 'bg-violet-500 hover:bg-violet-600',
  },
  {
    id: 'record',
    templateId: 'narrative-record',
    name: 'RECORD',
    tagline: '우리의 감정을 플레이리스트처럼 담아내는',
    category: 'mini',
    categoryLabel: '미니스토리형',
    thumbnail: '/sample/preview-record.png',
    sampleUrl: '/i/sample-record',
    badgeColor: 'text-violet-600',
    badgeBg: 'bg-violet-50',
    btnClass: 'bg-violet-500 hover:bg-violet-600',
  },
  {
    id: 'feed',
    templateId: 'narrative-exhibit',
    name: 'FEED',
    tagline: '우리의 순간을 피드처럼 펼쳐보는',
    category: 'mini',
    categoryLabel: '미니스토리형',
    thumbnail: '/sample/preview-feed.png',
    sampleUrl: '/i/sample-feed',
    badgeColor: 'text-violet-600',
    badgeBg: 'bg-violet-50',
    btnClass: 'bg-violet-500 hover:bg-violet-600',
  },
  {
    id: 'essay',
    templateId: 'narrative-essay',
    name: 'ESSAY',
    tagline: '사진 없이도 빛나는, 에세이 같은 청첩장',
    category: 'mini',
    categoryLabel: '미니스토리형',
    thumbnail: '/sample/preview-essay.png',
    sampleUrl: '/i/sample-essay-book',
    badgeColor: 'text-violet-600',
    badgeBg: 'bg-violet-50',
    btnClass: 'bg-violet-500 hover:bg-violet-600',
  },
  {
    id: 'the-simple',
    templateId: 'narrative-the-simple',
    name: 'THE SIMPLE',
    tagline: '가장 일반적이면서도 특별한, 세련된 더심플',
    category: 'mini',
    categoryLabel: '미니스토리형',
    thumbnail: '/sample/preview-the-simple.png',
    sampleUrl: '/i/sample-the-simple',
    badgeColor: 'text-stone-700',
    badgeBg: 'bg-stone-100',
    btnClass: 'bg-stone-800 hover:bg-stone-900',
    badge: 'Best',
  },
  {
    id: 'the-classic',
    templateId: 'narrative-classic',
    name: 'THE CLASSIC',
    tagline: '격식과 여백으로 완성하는 클래식 청첩장',
    category: 'parents',
    categoryLabel: '혼주용',
    thumbnail: '/sample/preview-the-classic.png',
    sampleUrl: '/i/sample-classic',
    badgeColor: 'text-stone-700',
    badgeBg: 'bg-stone-100',
    btnClass: 'bg-stone-800 hover:bg-stone-900',
    badge: 'Best',
  },
  {
    id: 'parents',
    templateId: 'narrative-parents',
    name: 'PARENTS',
    tagline: '부모님이 지인분들께 보내는 격식 있는',
    category: 'parents',
    categoryLabel: '혼주용',
    thumbnail: '/sample/preview-parents.png',
    sampleUrl: '/sample/parents',
    badgeColor: 'text-sky-600',
    badgeBg: 'bg-sky-50',
    btnClass: 'bg-sky-500 hover:bg-sky-600',
  },
  {
    id: 'thankyou',
    templateId: 'narrative-thankyou',
    name: 'THANKS',
    tagline: '결혼식 후 감사의 마음을 전하는',
    category: 'thankyou',
    categoryLabel: '감사장',
    thumbnail: '/sample/tannkyou_thumbnail.png',
    sampleUrl: '/sample/thank-you',
    badgeColor: 'text-amber-600',
    badgeBg: 'bg-amber-50',
    btnClass: 'bg-amber-500 hover:bg-amber-600',
  },
]

// ===== 첫 화면 디자인 =====
// 산세리프(한글 Pretendard · 영문 Inter)만, 굵기·크기·자간·행간으로 위계. 사진 중심 그리드, 둥근 모서리·그림자 최소, 장식 없음.
const TV = { ink: '#1F1C19', ink2: '#5E5751', ink3: '#9A908C', line: 'rgba(31,28,25,.11)', paper: '#FFFAF9', img: '#F0E5E3' }
const TV_FONT = "'Inter', 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"

// ===== 템플릿 시트: 샘플 청첩장을 직접 바꿔 보는 미리보기 =====
// 샘플 주소가 받는 값: ?intro= (샘플 전용) · ?colorTheme= · ?fontStyle=
type PvOpt = { id: string; label: string }
type PvColor = { id: string; label: string; c: string }
const PV_FONTS: PvOpt[] = [
  { id: 'modern', label: '모던' }, { id: 'myungjo', label: '명조' }, { id: 'dandi', label: '감성 명조' }, { id: 'classic', label: '클래식' },
  { id: 'luxury', label: '포멀' }, { id: 'contemporary', label: '컨템포러리' }, { id: 'suit', label: 'SUIT' }, { id: 'roundgothic', label: '둥근고딕' },
  { id: 'gulim', label: '굴림' }, { id: 'romantic', label: '손글씨' }, { id: 'neathand', label: '또박또박' }, { id: 'roundhand', label: '둥근손글씨' }, { id: 'adulthand', label: '어른손글씨' },
]
const PV_BASIC_COLORS: PvColor[] = [
  { id: 'classic-rose', label: '클래식 로즈', c: '#C41050' }, { id: 'modern-black', label: '모던 블랙', c: '#1A1A1A' }, { id: 'romantic-blush', label: '로맨틱 블러시', c: '#D4A5A5' },
  { id: 'nature-green', label: '네이처 그린', c: '#6B8E6B' }, { id: 'luxury-navy', label: '럭셔리 네이비', c: '#1E3A5F' }, { id: 'sunset-coral', label: '선셋 코럴', c: '#E8846B' },
]
const PV_OUR_INTROS: PvOpt[] = [
  { id: 'cinematic', label: '시네마틱' }, { id: 'blur', label: '포커스' }, { id: 'vellum', label: '트레이싱지' }, { id: 'envelope', label: '포스터 봉투' },
  { id: 'postcard', label: '엽서' }, { id: 'pieces', label: '두 장의 사진' }, { id: 'stars', label: '별자리 문장' }, { id: 'typed', label: '타자 오프닝' },
  { id: 'frost', label: '불투명 유리' }, { id: 'labels', label: '라벨 문구' }, { id: 'tiles', label: '글자 타일' }, { id: 'grid', label: '그리드 포스터' },
]
const PV_CONFIG: Record<string, { intros?: PvOpt[]; colors?: PvColor[]; fonts?: PvOpt[]; note?: string; def: { intro?: string; color?: string; font?: string } }> = {
  our: { intros: PV_OUR_INTROS, colors: PV_BASIC_COLORS, fonts: PV_FONTS, def: { intro: 'cinematic', color: 'classic-rose', font: 'modern' } },
  family: { intros: PV_OUR_INTROS, colors: PV_BASIC_COLORS, fonts: PV_FONTS, def: { intro: 'cinematic', color: 'classic-rose', font: 'contemporary' } },
  magazine: { intros: [{ id: 'cover', label: '커버' }, { id: 'clean', label: '미니멀' }, { id: 'editorial', label: '에디토리얼' }], colors: PV_BASIC_COLORS, fonts: PV_FONTS, def: { intro: 'cover', color: 'modern-black', font: 'modern' } },
  movie: {
    intros: [{ id: 'frame', label: '프레임' }, { id: 'booth', label: '포토부스' }, { id: 'dots', label: '도트 자수' }, { id: 'ott', label: 'OTT' }, { id: 'ticket', label: '티켓' }],
    colors: [{ id: 'film-light', label: '라이트', c: '#FFFFFF' }, { id: 'film-dark', label: '다크', c: '#1C1C1E' }],
    fonts: PV_FONTS, def: { intro: 'frame', color: 'film-light', font: 'suit' },
  },
  feed: { fonts: PV_FONTS, def: { font: 'modern' } },
  // THE 시리즈는 샘플이 한 가지 구성이라, 만들 때 고를 수 있는 것을 글로 안내한다
  'the-simple': { note: '만들 때 다양한 폰트와 섹션을 골라 우리만의 구성으로 완성할 수 있어요. 필요한 섹션만 켜고 순서를 바꿔 보세요.', def: {} },
  'the-classic': { note: '만들 때 다양한 폰트와 섹션을 골라 우리만의 구성으로 완성할 수 있어요. 필요한 섹션만 켜고 순서를 바꿔 보세요.', def: {} },
  record: {
    intros: [{ id: 'cd', label: 'CD PLAYER' }, { id: 'days', label: '함께한 날' }, { id: 'lp', label: 'LP 커버' }],
    colors: [
      { id: 'record-coral', label: '코랄', c: '#D4766A' }, { id: 'record-rose', label: '솜사탕', c: '#D4848C' }, { id: 'record-peach', label: '스카이', c: '#8BAEBF' },
      { id: 'record-bw', label: '모노', c: '#1A1A1A' }, { id: 'record-lilac', label: '진주', c: '#B8B0B8' }, { id: 'record-mint', label: '포레스트', c: '#9CAF88' },
    ],
    fonts: PV_FONTS, def: { intro: 'cd', color: 'record-coral', font: 'modern' },
  },
}

// 샘플 청첩장을 휴대폰 화면 크기(390px)로 그린 뒤 상자에 맞게 줄여 보여준다
const PV_W = 390, PV_H = Math.round(390 * 16 / 9)
// 샘플 안에서 실제로 스크롤되는 칸(가장 많이 내려간 곳)의 위치
function frameScroll(frame: HTMLIFrameElement | null): number {
  try {
    const doc = frame?.contentDocument; if (!doc) return 0
    let y = doc.scrollingElement?.scrollTop || 0
    doc.querySelectorAll<HTMLElement>('*').forEach((el) => { if (el.scrollTop > y) y = el.scrollTop })
    return y
  } catch { return 0 }
}
function SamplePreview({ src, title, frameRef, restoreY = 0 }: { src: string; title: string; frameRef?: React.MutableRefObject<HTMLIFrameElement | null>; restoreY?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = ref.current; if (!el) return
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el); return () => ro.disconnect()
  }, [])
  const k = box.w ? Math.min(box.w / PV_W, box.h / PV_H) : 0
  // 다시 그린 샘플이 준비되면 가장 긴 스크롤 칸을 보던 위치로 (내용이 늦게 그려질 수 있어 몇 번 더 시도)
  const onLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    if (!restoreY) return
    const frame = e.currentTarget
    // 청첩장이 처음 그린 직후 스스로 맨 위로 되돌리기도 해서, 넣은 뒤 3초쯤은 0으로 돌아가면 다시 넣는다
    let tries = 0, placedAt = 0
    const tick = () => {
      try {
        const doc = frame.contentDocument; if (!doc) return
        let best: Element | null = doc.scrollingElement, room = best ? best.scrollHeight - best.clientHeight : 0
        doc.querySelectorAll('*').forEach((el) => { const r = el.scrollHeight - el.clientHeight; if (r > room && /(auto|scroll)/.test(getComputedStyle(el).overflowY)) { best = el; room = r } })
        if (best && room >= restoreY) {
          const el = best as Element
          if (!placedAt) { el.scrollTop = restoreY; placedAt = Date.now() }
          else if (el.scrollTop < 5) el.scrollTop = restoreY
          if (Date.now() - placedAt > 3000) return
        }
      } catch { return }
      if (++tries < 60) setTimeout(tick, 150)
    }
    tick()
  }
  return (
    <div ref={ref} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {k > 0 && (
        <iframe key={src} src={src} title={title} ref={frameRef} onLoad={onLoad}
          style={{ position: 'absolute', left: (box.w - PV_W * k) / 2, top: 0, width: PV_W, height: PV_H, border: 0, transform: `scale(${k})`, transformOrigin: '0 0', background: '#fff' }} />
      )}
    </div>
  )
}

function PvRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ margin: '0 0 8px', fontSize: 11.5, fontWeight: 600, letterSpacing: '.02em', color: TV.ink2 }}>{label}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{children}</div>
    </div>
  )
}

function TemplateSheet({ item, onClose, onStart }: { item: (typeof SHOWCASE_ITEMS)[number]; onClose: () => void; onStart: (templateId: string) => void }) {
  const cfg = PV_CONFIG[item.id]
  const [pv, setPv] = useState<{ intro?: string; color?: string; font?: string }>({})
  const [replay, setReplay] = useState(0)
  // 컬러·폰트만 바꿨을 땐 인트로를 건너뛰고 보던 위치를 이어서 보여준다 (인트로를 고르거나 '처음부터 다시 보기'를 누르면 처음부터)
  const [keep, setKeep] = useState<{ on: boolean; y: number }>({ on: false, y: 0 })
  const frameRef = useRef<HTMLIFrameElement | null>(null)
  const restyle = (patch: { color?: string; font?: string }) => { setKeep({ on: true, y: frameScroll(frameRef.current) }); setPv((p) => ({ ...p, ...patch })) }
  const cur = { ...cfg?.def, ...pv }
  const q = new URLSearchParams()
  if (pv.intro) q.set('intro', pv.intro)
  if (pv.color) q.set('colorTheme', pv.color)
  if (pv.font) q.set('fontStyle', pv.font)
  if (keep.on) q.set('skipIntro', 'true')
  const src = item.sampleUrl + (q.toString() ? `?${q}` : '')
  const chip = (on: boolean): React.CSSProperties => ({ height: 30, padding: '0 11px', borderRadius: 2, border: `1px solid ${on ? TV.ink : TV.line}`, background: on ? TV.ink : 'transparent', color: on ? '#FFF9F8' : TV.ink, fontSize: 12.5, letterSpacing: '-.01em', cursor: 'pointer', fontFamily: TV_FONT })
  return (
    <div onClick={onClose} className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" style={{ background: 'rgba(31,28,25,.38)', fontFamily: TV_FONT, color: TV.ink }}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-h-[94dvh] overflow-y-auto rounded-t-[10px] px-5 pt-5 pb-7 sm:rounded-[4px] sm:max-w-[920px] sm:max-h-[92dvh] sm:flex sm:gap-10 sm:p-10"
        style={{ background: TV.paper, animation: 'tvSheet .4s cubic-bezier(.2,.7,.2,1) both' }}>
        {/* 모바일: 아래 선택지를 눌러도 샘플이 보이도록 위에 붙여 둔다 */}
        <div className="sticky -top-5 z-10 -mx-5 -mt-5 px-5 pt-5 pb-3 sm:static sm:m-0 sm:p-0 sm:flex-shrink-0" style={{ background: TV.paper }}>
          <div className="relative mx-auto h-[56dvh] sm:h-auto sm:w-[min(380px,calc((92dvh_-_150px)*9/16))]" style={{ aspectRatio: '9 / 16', borderRadius: 3, overflow: 'hidden', background: TV.img, outline: `1px solid ${TV.line}`, outlineOffset: -1 }}>
            <SamplePreview key={replay} src={src} title={`${item.name} 샘플 청첩장`} frameRef={frameRef} restoreY={keep.on ? keep.y : 0} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 10 }}>
            <button type="button" onClick={() => { setKeep({ on: false, y: 0 }); setReplay((n) => n + 1) }} style={{ background: 'none', border: 0, padding: 0, fontSize: 12, fontWeight: 500, color: TV.ink2, cursor: 'pointer', fontFamily: TV_FONT, textDecoration: 'underline', textUnderlineOffset: 3 }}>처음부터 다시 보기</button>
            <a href={src} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 500, color: TV.ink2, textDecoration: 'underline', textUnderlineOffset: 3 }}>새 창으로 크게 보기</a>
          </div>
        </div>
        <div className="sm:flex sm:flex-col sm:justify-between" style={{ flex: 1, minWidth: 0 }}>
          <div>
            <p style={{ margin: '22px 0 0', fontSize: 12, color: TV.ink3, letterSpacing: '-.01em' }}>{item.categoryLabel}{item.badge === 'Best' && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 600, letterSpacing: '.14em', color: TV.ink }}>BEST</span>}</p>
            <h2 style={{ margin: '8px 0 0', fontSize: 22, fontWeight: 600, letterSpacing: '.04em' }}>{item.name}</h2>
            <p style={{ margin: '12px 0 0', fontSize: 14, lineHeight: 1.75, letterSpacing: '-.015em', color: TV.ink2, wordBreak: 'keep-all' }}>{item.tagline}</p>
            {cfg && (
              <div style={{ display: 'grid', gap: 18, marginTop: 26, paddingTop: 22, borderTop: `1px solid ${TV.line}` }}>
                {cfg.note ? (
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.75, color: TV.ink2, letterSpacing: '-.015em', wordBreak: 'keep-all' }}>{cfg.note}</p>
                ) : (
                  <p style={{ margin: 0, fontSize: 12, color: TV.ink3, letterSpacing: '-.01em', wordBreak: 'keep-all' }}>바꿔 보면 샘플이 바로 달라져요. 만들 때 모두 다시 고를 수 있어요.</p>
                )}
                {cfg.intros && (
                  <PvRow label="인트로">
                    {cfg.intros.map((o) => <button key={o.id} type="button" aria-pressed={cur.intro === o.id} onClick={() => { setKeep({ on: false, y: 0 }); setPv((p) => ({ ...p, intro: o.id })) }} style={chip(cur.intro === o.id)}>{o.label}</button>)}
                  </PvRow>
                )}
                {cfg.colors && (
                  <PvRow label="컬러">
                    {cfg.colors.map((o) => (
                      <button key={o.id} type="button" title={o.label} aria-label={o.label} aria-pressed={cur.color === o.id} onClick={() => restyle({ color: o.id })}
                        style={{ width: 28, height: 28, borderRadius: '50%', background: o.c, cursor: 'pointer', border: '1px solid rgba(31,28,25,.18)', outline: cur.color === o.id ? `1.5px solid ${TV.ink}` : 'none', outlineOffset: 3 }} />
                    ))}
                  </PvRow>
                )}
                {cfg.fonts && (
                  <PvRow label="폰트">
                    {cfg.fonts.map((o) => <button key={o.id} type="button" aria-pressed={cur.font === o.id} onClick={() => restyle({ font: o.id })} style={chip(cur.font === o.id)}>{o.label}</button>)}
                  </PvRow>
                )}
              </div>
            )}
          </div>
          <div style={{ display: 'grid', gap: 8, marginTop: 28 }}>
            <button type="button" onClick={() => onStart(item.templateId)}
              style={{ height: 50, borderRadius: 2, background: TV.ink, color: '#FFF9F8', border: 0, fontSize: 14, fontWeight: 500, letterSpacing: '-.01em', cursor: 'pointer', fontFamily: TV_FONT }}>이 스타일로 시작하기</button>
            <button type="button" onClick={onClose} style={{ marginTop: 6, background: 'none', border: 0, fontSize: 12.5, color: TV.ink3, cursor: 'pointer', fontFamily: TV_FONT }}>닫기</button>
          </div>
        </div>
      </div>
    </div>
  )
}
const SHOWCASE_TABS: { id: ShowcaseFilter; label: string }[] = [
  { id: 'all', label: '전체' }, { id: 'story', label: '스토리형' }, { id: 'mini', label: '미니스토리형' }, { id: 'parents', label: '혼주용' }, { id: 'thankyou', label: '감사장' },
]
// 형식별 소개 화면(selectCategory)으로 이어지는 목록
const FORMAT_ROWS: { id: Exclude<TemplateCategory, null>; name: string; mood: string; desc: string; list: string }[] = [
  { id: 'story', name: '스토리형', mood: '깊이 있는 이야기', desc: '두 사람의 이야기를 천천히 전하는 청첩장', list: 'OUR · FAMILY' },
  { id: 'mini', name: '미니 스토리형', mood: '감각적 디자인', desc: '짧지만 감각적으로 우리의 순간을 담는 청첩장', list: 'MAGAZINE · MOVIE · RECORD' },
  { id: 'parents', name: '혼주용', mood: '격식 있는', desc: '부모님의 마음으로 정중하게 전하는 초대', list: 'PARENTS' },
  { id: 'the-series', name: 'THE 시리즈', mood: '프리미엄', desc: '덜어낼수록 선명해지는 우리만의 취향', list: 'THE SIMPLE · THE CLASSIC' },
]
const TV_CSS = `
  .tv-main { -webkit-font-smoothing: antialiased; }
  .tv-main a { color: inherit; text-decoration: none; }
  .tv-wrap { max-width: 1240px; margin: 0 auto; padding: 0 clamp(20px, 4vw, 48px); }
  .tv-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: clamp(12px, 1.8vw, 24px); }
  .tv-hero-title, .tv-hero-side { grid-column: 1 / span 12; }
  .tv-cards { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: clamp(12px, 1.8vw, 24px); row-gap: clamp(36px, 4.5vw, 56px); }
  @media (min-width: 760px) {
    .tv-hero-title { grid-column: 1 / span 7; }
    .tv-hero-side { grid-column: 9 / span 4; align-self: end; }
    .tv-cards { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  }
  @media (min-width: 1080px) { .tv-cards { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
  /* 카드 아래 정보: 넓으면 이름 | 분류 한 줄, 좁은 화면(2열 모바일)은 분류를 이름 위로 */
  .tv-meta { display: grid; grid-template-columns: 1fr auto; column-gap: 10px; align-items: baseline; }
  .tv-meta-cat { white-space: nowrap; }
  @media (max-width: 759px) { .tv-meta { grid-template-columns: 1fr; } .tv-meta-cat { order: -1; margin-bottom: 5px; } }
  .tv-card .tv-img img { transition: transform 1.2s cubic-bezier(.2,.7,.2,1); }
  .tv-card:hover .tv-img img { transform: scale(1.025); }
  .tv-card .tv-act { opacity: 0; transition: opacity .3s ease; }
  .tv-card:hover .tv-act, .tv-card:focus-within .tv-act { opacity: 1; }
  @media (hover: none) { .tv-card .tv-act { display: none; } }
  .tv-link { background: none; border: 0; padding: 0 0 2px; cursor: pointer; font: inherit; color: inherit; background-image: linear-gradient(currentColor, currentColor); background-size: 100% 1px; background-repeat: no-repeat; background-position: 0 100%; transition: background-size .3s ease; }
  .tv-link:hover { background-size: 0 1px; background-position: 100% 100%; }
  .tv-tabs::-webkit-scrollbar { display: none; }
  .tv-row { display: grid; width: 100%; grid-template-columns: 1fr; row-gap: 8px; padding: 22px 0; border: 0; border-bottom: 1px solid ${TV.line}; background: none; text-align: left; cursor: pointer; font: inherit; color: inherit; transition: background .25s ease, padding .25s ease; }
  .tv-row:hover { background: rgba(31,28,25,.025); }
  @media (min-width: 760px) {
    .tv-row { grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: clamp(12px, 1.8vw, 24px); align-items: baseline; padding: 30px 0; }
    .tv-row:hover { padding-left: 10px; padding-right: 10px; }
    .tv-row-name { grid-column: 1 / span 4; }
    .tv-row-desc { grid-column: 5 / span 5; }
    .tv-row-list { grid-column: 10 / span 3; text-align: right; }
  }
  @keyframes tvIn { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
  @keyframes tvSheet { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }
`

function TemplatesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') as TemplateCategory
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>(initialCategory)
  // ?quiz=1 로 들어오면 추천 퀴즈 1단계부터 (다른 화면의 '추천받기' 링크용)
  const [quizStep, setQuizStep] = useState<QuizStep>(searchParams.get('quiz') === '1' ? 'q1' : null)
  const [quizResult, setQuizResult] = useState<string | null>(null)
  const [showcaseFilter, setShowcaseFilter] = useState<ShowcaseFilter>('all')
  const [sheet, setSheet] = useState<(typeof SHOWCASE_ITEMS)[number] | null>(null)
  // 시트가 열리면 뒤 화면 스크롤 잠금 · ESC 로 닫기
  useEffect(() => {
    if (!sheet) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSheet(null) }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [sheet])

  const filteredShowcase = useMemo(() => {
    if (showcaseFilter === 'all') return SHOWCASE_ITEMS
    return SHOWCASE_ITEMS.filter(item => item.category === showcaseFilter)
  }, [showcaseFilter])

  // 퀴즈 스텝 전환 (히스토리 관리)
  const goQuizStep = useCallback((step: QuizStep) => {
    setQuizStep(step)
    window.history.pushState({ quizStep: step }, '', '/templates')
  }, [])

  // 퀴즈 결과 설정
  const showResult = useCallback((templateId: string) => {
    setQuizResult(templateId)
    setQuizStep('result')
    window.history.pushState({ quizStep: 'result', quizResult: templateId }, '', '/templates')
  }, [])

  // 카테고리 선택 시 히스토리에 상태 기록
  const selectCategory = useCallback((category: TemplateCategory) => {
    setSelectedCategory(category)
    setQuizStep(null)
    if (category) {
      window.history.pushState({ category }, '', `/templates?category=${category}`)
    } else {
      window.history.pushState({}, '', '/templates')
    }
  }, [])

  // 뒤로가기 시 상태 복원
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state?.category) {
        setSelectedCategory(e.state.category)
        setQuizStep(null)
      } else if (e.state?.quizStep) {
        setSelectedCategory(null)
        setQuizStep(e.state.quizStep)
        if (e.state.quizResult) setQuizResult(e.state.quizResult)
      } else {
        setSelectedCategory(null)
        setQuizStep(null)
        setQuizResult(null)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleTemplateSelect = (templateId: string) => {
    // GTM 이벤트: 템플릿 제작 시작
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: 'template_start',
        template_id: templateId,
      })
    }

    const autoSlug = generateRandomSlug()
    if (templateId === 'narrative-parents') {
      router.push(`/editor/parents?slug=${autoSlug}`)
    } else if (templateId === 'narrative-exhibit') {
      router.push(`/editor/feed?slug=${autoSlug}`)
    } else if (templateId === 'narrative-essay') {
      router.push(`/editor/essay?slug=${autoSlug}`)
    } else if (templateId === 'narrative-thankyou') {
      router.push(`/editor/thank-you?slug=${autoSlug}`)
    } else if (templateId === 'narrative-the-simple') {
      router.push(`/editor/the-simple?slug=${autoSlug}`)
    } else if (templateId === 'narrative-classic') {
      router.push(`/editor/classic?slug=${autoSlug}`)
    } else {
      router.push(`/editor?template=${templateId}&slug=${autoSlug}`)
    }
  }

  // 직접 선택하기
  const goDirectSelect = useCallback(() => {
    setQuizStep(null)
    setQuizResult(null)
    window.history.pushState({}, '', '/templates')
  }, [])

  // 퀴즈 총 스텝 수 계산
  const getQuizProgress = (step: QuizStep) => {
    switch (step) {
      case 'q1': return { current: 1, total: 2 }
      case 'q2a': return { current: 2, total: 2 }
      case 'q2b': return { current: 2, total: 3 }
      case 'q3a': return { current: 3, total: 3 }
      case 'q3b': return { current: 3, total: 3 }
      default: return { current: 1, total: 2 }
    }
  }

  // 퀴즈 결과 화면 렌더
  const renderQuizResult = () => {
    if (!quizResult || !QUIZ_RESULTS[quizResult]) return null
    const r = QUIZ_RESULTS[quizResult]
    const isRecord = quizResult === 'narrative-record'
    const btnBg = isRecord ? { background: '#E89B8F' } : {}
    const btnClass = isRecord ? 'text-white text-sm font-medium rounded-xl transition-colors px-8 py-3' : `px-8 py-3 ${r.colorBg} hover:opacity-90 text-white text-sm font-medium rounded-xl transition-colors`

    return (
      <div className="max-w-md mx-auto text-center">
        <p className="text-xs tracking-widest text-gray-400 uppercase mb-3">Your Match</p>
        <div className="mb-4">
          <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${r.category === 'story' ? 'bg-rose-50 text-rose-500' : 'bg-gray-100 text-gray-600'}`}>
            {r.categoryLabel}
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{r.templateName}</h2>
        <p className="text-sm sm:text-base text-gray-500 mb-8">{r.tagline}</p>

        <div className={`bg-white rounded-2xl border ${isRecord ? '' : r.colorBorder} shadow-lg p-6 sm:p-8 mb-6 text-left`} style={isRecord ? { borderColor: '#F5E6E3' } : {}}>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">추천 포인트</p>
          <div className="space-y-3">
            {r.points.map((point, i) => (
              <p key={i} className="flex items-start gap-3 text-sm text-gray-600">
                <span className={`mt-0.5 flex-shrink-0 ${isRecord ? '' : r.color}`} style={isRecord ? { color: '#E89B8F' } : {}}>&#10003;</span>
                {point}
              </p>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => handleTemplateSelect(r.templateId)}
            className={btnClass}
            style={btnBg}
          >
            이 템플릿으로 시작하기
          </button>
          <div className="flex items-center justify-center gap-4 text-sm">
            <a href={r.sampleUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2">
              샘플 보기
            </a>
            <span className="text-gray-200">|</span>
            <button onClick={() => { setQuizResult(null); goQuizStep('q1') }} className="text-gray-400 hover:text-gray-600 transition-colors">
              다시 선택하기
            </button>
            <span className="text-gray-200">|</span>
            <button onClick={goDirectSelect} className="text-gray-400 hover:text-gray-600 transition-colors">
              다른 템플릿 보기
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 퀴즈 질문 카드 컴포넌트
  const QuizOption = ({ icon, title, sub, onClick }: { icon: React.ReactNode; title: string; sub: string; onClick: () => void }) => (
    <button
      onClick={onClick}
      className="group w-full p-4 sm:p-5 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-lg hover:border-gray-300 hover:scale-[1.01] transition-all duration-200 text-left"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 bg-gray-50 rounded-full flex items-center justify-center text-lg sm:text-xl">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-0.5">{title}</h3>
          <p className="text-xs sm:text-sm text-gray-400">{sub}</p>
        </div>
        <svg className="w-4 h-4 text-gray-200 group-hover:text-gray-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )

  // 퀴즈 렌더링
  const renderQuiz = () => {
    if (quizStep === 'result') return renderQuizResult()

    const progress = getQuizProgress(quizStep)

    return (
      <div className="max-w-lg mx-auto">
        {/* 프로그레스 */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="text-xs tracking-widest text-gray-400 uppercase">Step {progress.current} / {progress.total}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1 mb-10 max-w-xs mx-auto">
          <div
            className="bg-gray-800 h-1 rounded-full transition-all duration-300"
            style={{ width: `${(progress.current / progress.total) * 100}%` }}
          />
        </div>

        {/* Q1: 서사 깊이 */}
        {quizStep === 'q1' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2">
                청첩장에 담고 싶은 이야기의 깊이는?
              </h2>
              <p className="text-xs sm:text-sm text-gray-400">우리 스타일에 맞는 템플릿을 찾아드릴게요</p>
            </div>
            <div className="flex flex-col gap-3">
              <QuizOption
                icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" fill="rgba(253,164,175,0.15)" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>}
                title="천천히, 깊이 있게"
                sub="우리의 연애 이야기를 풍부하게 담고 싶어요"
                onClick={() => goQuizStep('q2a')}
              />
              <QuizOption
                icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="9" rx="1.5" fill="rgba(196,181,253,0.15)" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="3" y="15" width="7" height="6" rx="1.5" /><rect x="14" y="11" width="7" height="10" rx="1.5" fill="rgba(196,181,253,0.1)" /></svg>}
                title="핵심만, 감각적으로"
                sub="디자인 중심으로 간결하게 전달하고 싶어요"
                onClick={() => goQuizStep('q2b')}
              />
              <QuizOption
                icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-stone-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="3" width="14" height="18" rx="1.5" fill="rgba(120,113,108,0.08)" /><path d="M9 8h6M9 12h6M9 16h4" /></svg>}
                title="익숙한 구성으로, 세련되게"
                sub="기본에 충실하면서 고급스럽게 보이고 싶어요"
                onClick={() => showResult('narrative-the-simple')}
              />
            </div>
            <div className="mt-8 text-center space-y-3">
              <button onClick={goDirectSelect} className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2">
                직접 선택할게요
              </button>
              <div>
                <button
                  onClick={() => selectCategory('parents')}
                  className="text-xs text-amber-500 hover:text-amber-600 transition-colors"
                >
                  혼주용 청첩장을 찾으시나요?
                </button>
              </div>
              <div>
                <button
                  onClick={() => showResult('narrative-thankyou')}
                  className="text-xs text-amber-500 hover:text-amber-600 transition-colors"
                >
                  결혼식 후 감사장을 찾으시나요?
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Q2A: 이야기 범위 (스토리형 분기) */}
        {quizStep === 'q2a' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2">
                이야기의 중심은 누구인가요?
              </h2>
              <p className="text-xs sm:text-sm text-gray-400">가장 자연스러운 구성을 추천해 드릴게요</p>
            </div>
            <div className="flex flex-col gap-3">
              <QuizOption
                icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="rgba(253,164,175,0.15)" /></svg>}
                title="우리 둘의 이야기"
                sub="커플 중심의 연애 서사를 담고 싶어요"
                onClick={() => showResult('narrative-our')}
              />
              <QuizOption
                icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="7" r="4" /><path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" fill="rgba(147,197,253,0.15)" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /><path d="M21 21v-2a4 4 0 0 0-3-3.87" /></svg>}
                title="부모님의 이야기도 함께"
                sub="양가 부모님의 축복까지 담고 싶어요"
                onClick={() => showResult('narrative-family')}
              />
            </div>
            <div className="mt-8 text-center">
              <button onClick={() => window.history.back()} className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 mx-auto">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                이전으로
              </button>
            </div>
          </div>
        )}

        {/* Q2B: 촬영 분위기 (미니 스토리형 분기) */}
        {quizStep === 'q2b' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2">
                웨딩 촬영 분위기는 어떤가요?
              </h2>
              <p className="text-xs sm:text-sm text-gray-400">사진 스타일에 맞는 템플릿을 추천해 드릴게요</p>
            </div>
            <div className="flex flex-col gap-3">
              <QuizOption
                icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" fill="rgba(100,116,139,0.06)" /><circle cx="12" cy="12" r="3" /><path d="M3 9h18" /></svg>}
                title="스튜디오 촬영"
                sub="깔끔한 배경의 정돈된 사진이 많아요"
                onClick={() => goQuizStep('q3a')}
              />
              <QuizOption
                icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 3l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" fill="rgba(129,140,248,0.08)" /><path d="M7 21l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>}
                title="야외/스냅 촬영"
                sub="자연스러운 분위기의 스냅 사진이 많아요"
                onClick={() => goQuizStep('q3b')}
              />
              <QuizOption
                icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" fill="rgba(196,181,253,0.1)" /><circle cx="12" cy="13" r="4" /></svg>}
                title="여러 컨셉 믹스"
                sub="다양한 장소/컨셉의 사진이 있어요"
                onClick={() => showResult('narrative-exhibit')}
              />
              <QuizOption
                icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" fill="rgba(180,83,9,0.06)" /><path d="M8 7h8M8 11h6" /></svg>}
                title="사진보다 글로 전하고 싶어요"
                sub="웨딩 촬영 없이, 문장으로 마음을 담고 싶어요"
                onClick={() => showResult('narrative-essay')}
              />
            </div>
            <div className="mt-8 text-center">
              <button onClick={() => window.history.back()} className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 mx-auto">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                이전으로
              </button>
            </div>
          </div>
        )}

        {/* Q3A: 스튜디오 → RECORD or MAGAZINE */}
        {quizStep === 'q3a' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2">
                어떤 사진을 더 많이 담고 싶나요?
              </h2>
              <p className="text-xs sm:text-sm text-gray-400">사진 구성에 맞는 레이아웃을 추천해 드릴게요</p>
            </div>
            <div className="flex flex-col gap-3">
              <QuizOption
                icon={<svg className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#E89B8F' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" fill="rgba(232,155,143,0.12)" /><circle cx="18" cy="16" r="3" fill="rgba(232,155,143,0.12)" /></svg>}
                title="연애 사진도 함께"
                sub="웨딩 + 일상/연애 사진을 골고루 넣고 싶어요"
                onClick={() => showResult('narrative-record')}
              />
              <QuizOption
                icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" fill="rgba(100,116,139,0.06)" /><line x1="10" y1="6" x2="18" y2="6" /><line x1="10" y1="10" x2="18" y2="10" /><line x1="10" y1="14" x2="14" y2="14" /></svg>}
                title="웨딩 사진 중심"
                sub="웨딩 촬영 사진을 깔끔하게 보여주고 싶어요"
                onClick={() => showResult('narrative-magazine')}
              />
            </div>
            <div className="mt-8 text-center">
              <button onClick={() => window.history.back()} className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 mx-auto">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                이전으로
              </button>
            </div>
          </div>
        )}

        {/* Q3B: 야외/스냅 → MOVIE or RECORD */}
        {quizStep === 'q3b' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2">
                어떤 분위기가 더 마음에 드나요?
              </h2>
              <p className="text-xs sm:text-sm text-gray-400">취향에 맞는 디자인을 추천해 드릴게요</p>
            </div>
            <div className="flex flex-col gap-3">
              <QuizOption
                icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2" fill="rgba(129,140,248,0.08)" /><path d="M2 10h20" /><path d="M6 4l3 6" /><path d="M12 4l3 6" /></svg>}
                title="영화 같은 무드"
                sub="시네마틱하고 독특한 분위기가 좋아요"
                onClick={() => showResult('narrative-film')}
              />
              <QuizOption
                icon={<svg className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#E89B8F' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" fill="rgba(232,155,143,0.12)" /><circle cx="18" cy="16" r="3" fill="rgba(232,155,143,0.12)" /></svg>}
                title="따뜻하고 러블리하게"
                sub="포근하고 감성적인 분위기가 좋아요"
                onClick={() => showResult('narrative-record')}
              />
            </div>
            <div className="mt-8 text-center">
              <button onClick={() => window.history.back()} className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 mx-auto">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                이전으로
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  const isGallery = quizStep === null && !selectedCategory

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-blue-50" style={{ fontFamily: TV_FONT }}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      <style>{TV_CSS}</style>
      {/* 헤더 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className={`${isGallery ? 'tv-wrap' : 'max-w-5xl mx-auto px-4'} h-14 flex items-center justify-between`}>
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Dear Drawer" className="h-5 w-auto" />
          </Link>
          <Link href="/my-invitations" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
            내 청첩장
          </Link>
        </div>
      </header>

      {/* 첫 화면: 템플릿 갤러리 + 형식 고르기 */}
      {isGallery && (
        <main className="tv-main tv-wrap" style={{ color: TV.ink, paddingTop: 56, paddingBottom: 'clamp(80px, 10vw, 140px)' }}>
          <SocialProofCounter />
          {/* 머리말: 7칸 제목 / 4칸 설명 */}
          <section className="tv-grid" style={{ paddingTop: 'clamp(56px, 9vw, 112px)', paddingBottom: 'clamp(40px, 6vw, 72px)', rowGap: 24, animation: 'tvIn .8s ease both' }}>
            <div className="tv-hero-title">
              <p style={{ margin: 0, fontSize: 12, fontWeight: 500, letterSpacing: '.02em', color: TV.ink3, fontVariantNumeric: 'tabular-nums' }}>Templates — {SHOWCASE_ITEMS.length}</p>
              <h1 style={{ margin: '18px 0 0', fontSize: 'clamp(26px, 3.1vw, 38px)', lineHeight: 1.32, letterSpacing: '-.035em', fontWeight: 300 }}>
                우리의 이야기를,<br /><span style={{ fontWeight: 600 }}>우리의 방식으로.</span>
              </h1>
            </div>
            <div className="tv-hero-side">
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, letterSpacing: '-.01em', color: TV.ink2, wordBreak: 'keep-all' }}>
                완성된 청첩장을 먼저 열어보고, 두 분의 이야기에 맞는 형식으로 시작하세요.
              </p>
              <p style={{ margin: '16px 0 0', fontSize: 13, fontWeight: 500, letterSpacing: '-.01em' }}>
                <button type="button" className="tv-link" onClick={() => goQuizStep('q1')}>질문 몇 개로 추천받기</button>
              </p>
            </div>
          </section>

          {/* 분류 */}
          <nav className="tv-tabs" style={{ display: 'flex', gap: 'clamp(20px, 2.6vw, 34px)', overflowX: 'auto', scrollbarWidth: 'none', borderTop: `1px solid ${TV.line}`, borderBottom: `1px solid ${TV.line}`, marginBottom: 'clamp(28px, 4vw, 48px)' }}>
            {SHOWCASE_TABS.map((t) => {
              const on = showcaseFilter === t.id
              const n = t.id === 'all' ? SHOWCASE_ITEMS.length : SHOWCASE_ITEMS.filter((i) => i.category === t.id).length
              return (
                <button key={t.id} type="button" onClick={() => setShowcaseFilter(t.id)}
                  style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'baseline', gap: 6, padding: '15px 0 14px', background: 'none', border: 0, borderBottom: `1px solid ${on ? TV.ink : 'transparent'}`, marginBottom: -1, cursor: 'pointer', fontFamily: TV_FONT, fontSize: 13.5, fontWeight: on ? 600 : 400, letterSpacing: '-.01em', color: on ? TV.ink : TV.ink3, whiteSpace: 'nowrap', transition: 'color .2s' }}>
                  {t.label}
                  <span style={{ fontSize: 11, fontWeight: 400, color: TV.ink3, fontVariantNumeric: 'tabular-nums' }}>{n}</span>
                </button>
              )
            })}
          </nav>

          {/* 갤러리 */}
          <section className="tv-grid">
            <div className="tv-cards">
              {filteredShowcase.map((item, i) => (
                <article key={item.id} className="tv-card" style={{ cursor: item.comingSoon ? 'default' : 'pointer', animation: `tvIn .6s ease ${Math.min(i, 8) * 0.04}s both` }} onClick={() => { if (!item.comingSoon) setSheet(item) }}>
                  <div className="tv-img group" style={{ position: 'relative', aspectRatio: '9 / 16', borderRadius: 3, overflow: 'hidden', background: TV.img, outline: `1px solid ${TV.line}`, outlineOffset: -1 }}>
                    {item.comingSoon ? (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, letterSpacing: '.08em', color: TV.ink3 }}>COMING SOON</div>
                    ) : (
                      <Image src={item.thumbnail} alt={`${item.name} 샘플`} fill sizes="(max-width: 760px) 46vw, (max-width: 1080px) 30vw, 280px" className="object-cover object-top group-hover:animate-scroll-preview" />
                    )}
                    {item.badge === 'Best' && (
                      <span style={{ position: 'absolute', top: 10, left: 10, padding: '4px 7px', borderRadius: 2, background: 'rgba(31,28,25,.86)', color: '#FFF9F8', fontSize: 9.5, fontWeight: 600, letterSpacing: '.14em', lineHeight: 1, fontFamily: TV_FONT }}>BEST</span>
                    )}
                    {!item.comingSoon && (
                      <div className="tv-act" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, display: 'grid', gridTemplateColumns: '1fr', background: 'rgba(255,250,249,.94)', backdropFilter: 'blur(6px)', borderTop: `1px solid ${TV.line}` }}>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setSheet(item) }}
                          style={{ padding: '13px 0', background: 'none', border: 0, cursor: 'pointer', fontFamily: TV_FONT, textAlign: 'center', fontSize: 12.5, fontWeight: 600, color: TV.ink }}>미리보기</button>
                      </div>
                    )}
                  </div>
                  <div className="tv-meta" style={{ marginTop: 16 }}>
                    <h3 style={{ margin: 0, fontSize: 'clamp(16px, 1.45vw, 19px)', fontWeight: 650, lineHeight: 1.2, letterSpacing: '-.005em' }}>{item.name}</h3>
                    <span className="tv-meta-cat" style={{ fontSize: 11.5, color: TV.ink3, letterSpacing: '-.01em' }}>{item.categoryLabel}</span>
                    <p style={{ gridColumn: '1 / -1', margin: '7px 0 0', fontSize: 13, lineHeight: 1.6, letterSpacing: '-.015em', color: TV.ink2, wordBreak: 'keep-all' }}>{item.tagline}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* 형식으로 고르기 — 형식별 소개 화면과 추천 퀴즈로 이어진다 */}
          <section className="tv-grid" style={{ marginTop: 'clamp(96px, 12vw, 160px)', rowGap: 24 }}>
            <div className="tv-hero-title">
              <h2 style={{ margin: 0, fontSize: 'clamp(22px, 2.3vw, 28px)', lineHeight: 1.36, letterSpacing: '-.035em', fontWeight: 300 }}>
                어떤 초대를<br /><span style={{ fontWeight: 600 }}>준비하고 있나요?</span>
              </h2>
            </div>
            <div className="tv-hero-side">
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, letterSpacing: '-.01em', color: TV.ink2, wordBreak: 'keep-all' }}>
                어떤 스타일이 맞을지 모르겠다면, 질문 2~3개로 어울리는 템플릿을 골라 드려요.
              </p>
              <p style={{ margin: '16px 0 0', fontSize: 13, fontWeight: 500, letterSpacing: '-.01em' }}>
                <button type="button" className="tv-link" onClick={() => goQuizStep('q1')}>맞춤 템플릿 추천받기</button>
              </p>
            </div>
            <div style={{ gridColumn: '1 / -1', marginTop: 'clamp(16px, 3vw, 32px)', borderTop: `1px solid ${TV.ink}` }}>
              {FORMAT_ROWS.map((fm) => (
                <button key={fm.id} type="button" className="tv-row" onClick={() => selectCategory(fm.id)}>
                  <span className="tv-row-name">
                    <span style={{ display: 'block', fontSize: 'clamp(17px, 1.6vw, 20px)', fontWeight: 600, letterSpacing: '-.02em' }}>{fm.name}</span>
                    <span style={{ display: 'block', marginTop: 4, fontSize: 12, color: TV.ink3, letterSpacing: '-.01em' }}>{fm.mood}</span>
                  </span>
                  <span className="tv-row-desc" style={{ fontSize: 14, lineHeight: 1.7, letterSpacing: '-.015em', color: TV.ink2, wordBreak: 'keep-all' }}>{fm.desc}</span>
                  <span className="tv-row-list" style={{ fontSize: 11.5, fontWeight: 500, letterSpacing: '.08em', color: TV.ink3 }}>{fm.list}</span>
                </button>
              ))}
            </div>
          </section>
        </main>
      )}

      {/* 퀴즈 · 형식별 화면 (기존 그대로) */}
      {!isGallery && (
      <main className="pt-24 pb-16 px-2 sm:px-4">
        <div className="max-w-4xl mx-auto">

          <SocialProofCounter />

          {/* 퀴즈 플로우 */}
          {quizStep !== null && !selectedCategory && (
            <div>
              {quizStep !== 'result' && (
                <div className="text-center mb-2">
                  <p className="text-[10px] sm:text-xs tracking-widest text-gray-300 uppercase">Style Quiz</p>
                </div>
              )}
              {renderQuiz()}
            </div>
          )}

          {/* Step 2: 스토리형 → OUR, FAMILY */}
          {selectedCategory === 'story' && (
            <div>
              <button onClick={() => selectCategory(null)} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                다른 스타일 보기
              </button>
              <div className="text-center mb-8">
                <p className="text-xs tracking-widest text-rose-400 uppercase mb-2">Story Type</p>
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2">스토리형 청첩장</h1>
                <p className="text-xs sm:text-base text-gray-500">우리의 이야기를 깊이 있게 전달하는 템플릿</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* OUR */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-2xl hover:border-rose-300 transition-all duration-300 overflow-hidden">
                  <div className="p-5 sm:p-8">
                    <div className="relative w-12 h-12 sm:w-16 sm:h-16 mb-2 sm:mb-4">
                      <div className="absolute -inset-1 bg-rose-200 rounded-full opacity-[0.12] blur-[10px]" />
                      <div className="relative w-full h-full bg-rose-50/80 border border-rose-100/60 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="rgba(253,164,175,0.15)" />
                        </svg>
                      </div>
                    </div>
                    <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">OUR</h2>
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-6">커플의 서사가 중심이 되는 청첩장</p>
                    <div className="space-y-1 sm:space-y-2 mb-4 sm:mb-8 text-xs sm:text-sm text-gray-500">
                      <p className="flex items-center gap-2"><span className="text-rose-400">♥</span> 장기연애를 해온 커플</p>
                      <p className="flex items-center gap-2"><span className="text-rose-400">♥</span> 특별한 스토리가 있는 커플</p>
                      <p className="flex items-center gap-2"><span className="text-rose-400">♥</span> 우리만의 이야기를 담고 싶은 커플</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleTemplateSelect('narrative-our')} className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-xl text-center transition-colors">
                        시작하기
                      </button>
                      <a href="/i/sample-our" target="_blank" rel="noopener noreferrer" className="px-4 py-3 border border-gray-200 hover:border-gray-300 text-gray-600 text-sm rounded-xl transition-colors">
                        샘플
                      </a>
                    </div>
                  </div>
                </div>

                {/* FAMILY */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-2xl hover:border-blue-300 transition-all duration-300 overflow-hidden">
                  <div className="p-5 sm:p-8">
                    <div className="relative w-12 h-12 sm:w-16 sm:h-16 mb-2 sm:mb-4">
                      <div className="absolute -inset-1 bg-blue-200 rounded-full opacity-[0.12] blur-[10px]" />
                      <div className="relative w-full h-full bg-blue-50/80 border border-blue-100/60 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="9" cy="7" r="4" />
                          <path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" fill="rgba(147,197,253,0.15)" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
                        </svg>
                      </div>
                    </div>
                    <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">FAMILY</h2>
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-6">두 가족의 축복으로 완성되는 청첩장</p>
                    <div className="space-y-1 sm:space-y-2 mb-4 sm:mb-8 text-xs sm:text-sm text-gray-500">
                      <p className="flex items-center gap-2"><span className="text-blue-400">♥</span> 양가 부모님의 축하 인사말</p>
                      <p className="flex items-center gap-2"><span className="text-blue-400">♥</span> 서로가 선택한 이유 (신랑/신부 소개)</p>
                      <p className="flex items-center gap-2"><span className="text-blue-400">♥</span> 커플 인터뷰 & 풀스크린 포토</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleTemplateSelect('narrative-family')} className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl text-center transition-colors">
                        시작하기
                      </button>
                      <a href="/i/sample-family" target="_blank" rel="noopener noreferrer" className="px-4 py-3 border border-gray-200 hover:border-gray-300 text-gray-600 text-sm rounded-xl transition-colors">
                        샘플
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: 미니 스토리형 → MAGAZINE, MOVIE, RECORD */}
          {selectedCategory === 'mini' && (
            <div>
              <button onClick={() => selectCategory(null)} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                다른 스타일 보기
              </button>
              <div className="text-center mb-8">
                <p className="text-xs tracking-widest text-gray-800 uppercase mb-2">Mini Story Type</p>
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2">미니 스토리형 청첩장</h1>
                <p className="text-xs sm:text-base text-gray-500">감각적인 디자인에 이야기를 간결하게 담는 템플릿</p>
              </div>

              <div className="flex flex-col gap-4 sm:gap-5 max-w-2xl mx-auto">
                {/* THE SIMPLE */}
                <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-300 transition-all duration-300 overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    <div className="sm:w-40 flex-shrink-0 flex flex-col items-center justify-center p-5 sm:p-6 border-b sm:border-b-0 sm:border-r" style={{ background: '#F4F4F5' }}>
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2">
                        <div className="absolute -inset-1 rounded-full opacity-[0.1] blur-[10px]" style={{ background: '#52525B' }} />
                        <div className="relative w-full h-full rounded-full flex items-center justify-center" style={{ background: '#ffffff' }}>
                          <svg className="w-5 h-5 sm:w-7 sm:h-7" style={{ color: '#52525B' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="rgba(82,82,91,0.08)" />
                          </svg>
                        </div>
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">THE SIMPLE</h2>
                      <p className="text-[10px] text-gray-400 mt-0.5">프리미엄 미니멀</p>
                    </div>
                    <div className="flex-1 p-5 sm:p-6">
                      <span className="inline-block px-2.5 py-1 text-[11px] font-medium text-white rounded-full mb-3" style={{ background: '#52525B' }}>미니멀을 추구하는 커플에게 추천</span>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className="text-[11px] text-gray-400">#미니멀</span>
                        <span className="text-[11px] text-gray-400">#프리미엄</span>
                        <span className="text-[11px] text-gray-400">#커스텀</span>
                      </div>
                      <div className="space-y-1.5 mb-4 text-[13px] text-gray-600">
                        <p className="flex items-start gap-2"><span style={{ color: '#52525B' }} className="mt-0.5 text-xs">&#10003;</span> 에디토리얼 타이포그래피와 고급스러운 여백</p>
                        <p className="flex items-start gap-2"><span style={{ color: '#52525B' }} className="mt-0.5 text-xs">&#10003;</span> 모든 섹션에 5~12가지 UI 대안 제공</p>
                        <p className="flex items-start gap-2"><span style={{ color: '#52525B' }} className="mt-0.5 text-xs">&#10003;</span> 섹션 순서·폰트·구분선까지 자유 커스텀</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleTemplateSelect('narrative-the-simple')} className="px-5 py-2.5 text-white text-sm font-medium rounded-xl transition-colors" style={{ background: '#52525B' }}>
                          시작하기
                        </button>
                        <a href="/i/sample-the-simple" target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 border border-gray-200 hover:border-gray-300 text-gray-500 text-sm rounded-xl transition-colors">
                          샘플 보기
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* MAGAZINE */}
                <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-300 transition-all duration-300 overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    {/* 왼쪽: 비주얼 */}
                    <div className="sm:w-40 flex-shrink-0 bg-gray-50 flex flex-col items-center justify-center p-5 sm:p-6 border-b sm:border-b-0 sm:border-r border-gray-100">
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2">
                        <div className="absolute -inset-1 bg-slate-400 rounded-full opacity-[0.1] blur-[10px]" />
                        <div className="relative w-full h-full bg-slate-50 border border-slate-200/60 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 sm:w-7 sm:h-7 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" fill="rgba(100,116,139,0.06)" />
                            <line x1="10" y1="6" x2="18" y2="6" />
                            <line x1="10" y1="10" x2="18" y2="10" />
                            <line x1="10" y1="14" x2="14" y2="14" />
                          </svg>
                        </div>
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">MAGAZINE</h2>
                      <p className="text-[10px] text-gray-400 mt-0.5">매거진 인터뷰 스타일</p>
                    </div>
                    {/* 오른쪽: 추천 정보 */}
                    <div className="flex-1 p-5 sm:p-6">
                      <span className="inline-block px-2.5 py-1 text-[11px] font-medium bg-gray-900 text-white rounded-full mb-3">세련된 커플에게 추천</span>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className="text-[11px] text-gray-400">#모던</span>
                        <span className="text-[11px] text-gray-400">#인터뷰형식</span>
                        <span className="text-[11px] text-gray-400">#미니멀</span>
                      </div>
                      <div className="space-y-1.5 mb-4 text-[13px] text-gray-600">
                        <p className="flex items-start gap-2"><span className="text-gray-800 mt-0.5 text-xs">&#10003;</span> 모던하고 세련된 분위기를 좋아하는 커플</p>
                        <p className="flex items-start gap-2"><span className="text-gray-800 mt-0.5 text-xs">&#10003;</span> Q&A 인터뷰로 서로를 소개하고 싶은 커플</p>
                        <p className="flex items-start gap-2"><span className="text-gray-800 mt-0.5 text-xs">&#10003;</span> 고급스럽고 깔끔한 레이아웃을 원할 때</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleTemplateSelect('narrative-magazine')} className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl transition-colors">
                          시작하기
                        </button>
                        <a href="/i/sample-magazine" target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 border border-gray-200 hover:border-gray-300 text-gray-500 text-sm rounded-xl transition-colors">
                          샘플 보기
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* MOVIE */}
                <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-400 transition-all duration-300 overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    {/* 왼쪽: 비주얼 */}
                    <div className="sm:w-40 flex-shrink-0 bg-gray-50 flex flex-col items-center justify-center p-5 sm:p-6 border-b sm:border-b-0 sm:border-r border-gray-100">
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2">
                        <div className="absolute -inset-1 bg-indigo-300 rounded-full opacity-[0.1] blur-[10px]" />
                        <div className="relative w-full h-full bg-indigo-50/80 border border-indigo-100/60 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 sm:w-7 sm:h-7 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="4" width="20" height="16" rx="2" fill="rgba(129,140,248,0.08)" />
                            <path d="M2 10h20" />
                            <path d="M6 4l3 6" />
                            <path d="M12 4l3 6" />
                          </svg>
                        </div>
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">MOVIE</h2>
                      <p className="text-[10px] text-gray-400 mt-0.5">시네마틱 무드</p>
                    </div>
                    {/* 오른쪽: 추천 정보 */}
                    <div className="flex-1 p-5 sm:p-6">
                      <span className="inline-block px-2.5 py-1 text-[11px] font-medium text-white rounded-full mb-3" style={{ background: '#7BA4D4' }}>감성적인 커플에게 추천</span>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className="text-[11px] text-gray-400">#시네마틱</span>
                        <span className="text-[11px] text-gray-400">#무드있는</span>
                        <span className="text-[11px] text-gray-400">#다크테마</span>
                      </div>
                      <div className="space-y-1.5 mb-4 text-[13px] text-gray-600">
                        <p className="flex items-start gap-2"><span className="text-gray-500 mt-0.5 text-xs">&#10003;</span> 영화 같은 분위기를 좋아하는 커플</p>
                        <p className="flex items-start gap-2"><span className="text-gray-500 mt-0.5 text-xs">&#10003;</span> 무드 있는 사진이 많은 커플</p>
                        <p className="flex items-start gap-2"><span className="text-gray-500 mt-0.5 text-xs">&#10003;</span> 남들과 다른 독특한 연출을 원할 때</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleTemplateSelect('narrative-film')} className="px-5 py-2.5 text-white text-sm font-medium rounded-xl transition-colors" style={{ background: '#7BA4D4' }}>
                          시작하기
                        </button>
                        <a href="/i/sample-film" target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 border border-gray-200 hover:border-gray-300 text-gray-500 text-sm rounded-xl transition-colors">
                          샘플 보기
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RECORD */}
                <div className="group bg-white rounded-2xl border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden" style={{ borderColor: '#F5E6E3' }}>
                  <div className="flex flex-col sm:flex-row">
                    {/* 왼쪽: 비주얼 */}
                    <div className="sm:w-40 flex-shrink-0 flex flex-col items-center justify-center p-5 sm:p-6 border-b sm:border-b-0 sm:border-r" style={{ background: '#FDF8F6', borderColor: '#F5E6E3' }}>
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2">
                        <div className="absolute -inset-1 rounded-full opacity-[0.1] blur-[10px]" style={{ background: '#E89B8F' }} />
                        <div className="relative w-full h-full border rounded-full flex items-center justify-center" style={{ background: 'rgba(232,155,143,0.06)', borderColor: 'rgba(232,155,143,0.2)' }}>
                          <svg className="w-5 h-5 sm:w-7 sm:h-7" style={{ color: '#E89B8F' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 18V5l12-2v13" />
                            <circle cx="6" cy="18" r="3" fill="rgba(232,155,143,0.12)" />
                            <circle cx="18" cy="16" r="3" fill="rgba(232,155,143,0.12)" />
                          </svg>
                        </div>
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">RECORD</h2>
                      <p className="text-[10px] text-gray-400 mt-0.5">뮤직 앨범 스타일</p>
                    </div>
                    {/* 오른쪽: 추천 정보 */}
                    <div className="flex-1 p-5 sm:p-6">
                      <span className="inline-block px-2.5 py-1 text-[11px] font-medium text-white rounded-full mb-3" style={{ background: '#E89B8F' }}>음악을 사랑하는 커플에게 추천</span>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className="text-[11px] text-gray-400">#아날로그</span>
                        <span className="text-[11px] text-gray-400">#따뜻한톤</span>
                        <span className="text-[11px] text-gray-400">#LP감성</span>
                      </div>
                      <div className="space-y-1.5 mb-4 text-[13px] text-gray-600">
                        <p className="flex items-start gap-2"><span style={{ color: '#E89B8F' }} className="mt-0.5 text-xs">&#10003;</span> 음악이 우리 사랑의 배경인 커플</p>
                        <p className="flex items-start gap-2"><span style={{ color: '#E89B8F' }} className="mt-0.5 text-xs">&#10003;</span> 아날로그 감성을 좋아하는 커플</p>
                        <p className="flex items-start gap-2"><span style={{ color: '#E89B8F' }} className="mt-0.5 text-xs">&#10003;</span> 따뜻하고 포근한 분위기를 원할 때</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleTemplateSelect('narrative-record')} className="px-5 py-2.5 text-white text-sm font-medium rounded-xl transition-colors" style={{ background: '#E89B8F' }}>
                          시작하기
                        </button>
                        <a href="/i/sample-record" target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 border border-gray-200 hover:border-gray-300 text-gray-500 text-sm rounded-xl transition-colors">
                          샘플 보기
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FEED */}
                <div className="group bg-white rounded-2xl border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden" style={{ borderColor: '#E4E0F5' }}>
                  <div className="flex flex-col sm:flex-row">
                    {/* 왼쪽: 비주얼 */}
                    <div className="sm:w-40 flex-shrink-0 flex flex-col items-center justify-center p-5 sm:p-6 border-b sm:border-b-0 sm:border-r" style={{ background: '#F8F6FD', borderColor: '#E4E0F5' }}>
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2">
                        <div className="absolute -inset-1 bg-violet-300 rounded-full opacity-[0.1] blur-[10px]" />
                        <div className="relative w-full h-full bg-violet-50/80 border border-violet-100/60 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 sm:w-7 sm:h-7 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" fill="rgba(196,181,253,0.1)" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                        </div>
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">FEED</h2>
                      <p className="text-[10px] text-gray-400 mt-0.5">인스타 포토 스타일</p>
                    </div>
                    {/* 오른쪽: 추천 정보 */}
                    <div className="flex-1 p-5 sm:p-6">
                      <span className="inline-block px-2.5 py-1 text-[11px] font-medium text-white rounded-full mb-3" style={{ background: '#8B5CF6' }}>사진이 많은 커플에게 추천</span>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className="text-[11px] text-gray-400">#SNS감성</span>
                        <span className="text-[11px] text-gray-400">#포토중심</span>
                        <span className="text-[11px] text-gray-400">#캐주얼</span>
                      </div>
                      <div className="space-y-1.5 mb-4 text-[13px] text-gray-600">
                        <p className="flex items-start gap-2"><span style={{ color: '#8B5CF6' }} className="mt-0.5 text-xs">&#10003;</span> 스냅 사진이 자산인 커플</p>
                        <p className="flex items-start gap-2"><span style={{ color: '#8B5CF6' }} className="mt-0.5 text-xs">&#10003;</span> SNS 감성을 좋아하는 커플</p>
                        <p className="flex items-start gap-2"><span style={{ color: '#8B5CF6' }} className="mt-0.5 text-xs">&#10003;</span> 캐주얼하고 트렌디한 분위기를 원할 때</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleTemplateSelect('narrative-exhibit')} className="px-5 py-2.5 text-white text-sm font-medium rounded-xl transition-colors" style={{ background: '#8B5CF6' }}>
                          시작하기
                        </button>
                        <a href="/i/sample-feed" target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 border border-gray-200 hover:border-gray-300 text-gray-500 text-sm rounded-xl transition-colors">
                          샘플 보기
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ESSAY */}
                <div className="group bg-white rounded-2xl border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden" style={{ borderColor: '#E8DFD0' }}>
                  <div className="flex flex-col sm:flex-row">
                    <div className="sm:w-40 flex-shrink-0 flex flex-col items-center justify-center p-5 sm:p-6 border-b sm:border-b-0 sm:border-r" style={{ background: '#FAF7F2', borderColor: '#E8DFD0' }}>
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2">
                        <div className="absolute -inset-1 bg-amber-300 rounded-full opacity-[0.1] blur-[10px]" />
                        <div className="relative w-full h-full bg-amber-50/80 border border-amber-100/60 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 sm:w-7 sm:h-7 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                          </svg>
                        </div>
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">ESSAY</h2>
                      <p className="text-[10px] text-gray-400 mt-0.5">사진 없는 에세이</p>
                    </div>
                    <div className="flex-1 p-5 sm:p-6">
                      <span className="inline-block px-2.5 py-1 text-[11px] font-medium text-white rounded-full mb-3" style={{ background: '#92400E' }}>사진 없이도 빛나는 청첩장</span>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className="text-[11px] text-gray-400">#타이포그래피</span>
                        <span className="text-[11px] text-gray-400">#책넘기기</span>
                        <span className="text-[11px] text-gray-400">#프리미엄</span>
                      </div>
                      <div className="space-y-1.5 mb-4 text-[13px] text-gray-600">
                        <p className="flex items-start gap-2"><span style={{ color: '#92400E' }} className="mt-0.5 text-xs">&#10003;</span> 사진 없이도 완성되는 프리미엄 디자인</p>
                        <p className="flex items-start gap-2"><span style={{ color: '#92400E' }} className="mt-0.5 text-xs">&#10003;</span> 러브스토리 or 인터뷰 형식 선택</p>
                        <p className="flex items-start gap-2"><span style={{ color: '#92400E' }} className="mt-0.5 text-xs">&#10003;</span> 책 넘기기 인터랙션으로 특별한 경험</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleTemplateSelect('narrative-essay')} className="px-5 py-2.5 text-white text-sm font-medium rounded-xl transition-colors" style={{ background: '#92400E' }}>
                          시작하기
                        </button>
                        <a href="/i/sample-essay-book" target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 border border-gray-200 hover:border-gray-300 text-gray-500 text-sm rounded-xl transition-colors">
                          샘플 보기
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: 혼주용 → PARENTS */}
          {selectedCategory === 'parents' && (
            <div>
              <button onClick={() => selectCategory(null)} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                다른 스타일 보기
              </button>
              <div className="text-center mb-8">
                <p className="text-xs tracking-widest text-amber-500 uppercase mb-2">Parents Type</p>
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2">혼주용 청첩장</h1>
                <p className="text-xs sm:text-base text-gray-500">부모님이 지인분들께 보내는 격식 있는 청첩장</p>
              </div>

              <div className="flex flex-col gap-5 max-w-md mx-auto">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-2xl hover:border-amber-300 transition-all duration-300 overflow-hidden text-center">
                  <div className="p-6 sm:p-10">
                    <div className="relative w-14 h-14 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-5">
                      <div className="absolute -inset-1 bg-amber-200 rounded-full opacity-[0.15] blur-[10px]" />
                      <div className="relative w-full h-full bg-amber-50/80 border border-amber-100/60 rounded-full flex items-center justify-center">
                        <svg className="w-7 h-7 sm:w-10 sm:h-10 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="9" cy="7" r="4" />
                          <path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" fill="rgba(251,191,36,0.12)" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
                        </svg>
                      </div>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1.5 sm:mb-3">PARENTS</h2>
                    <p className="text-xs sm:text-base text-gray-600 mb-4 sm:mb-8">
                      간결한 인사말과 예식 정보 중심의<br />
                      격식 있는 청첩장
                    </p>
                    <div className="space-y-1 sm:space-y-2 mb-5 sm:mb-8 text-xs sm:text-sm text-gray-500 text-left max-w-xs mx-auto">
                      <p className="flex items-center gap-2"><span className="text-amber-500">✦</span> 봉투 오프닝 연출</p>
                      <p className="flex items-center gap-2"><span className="text-amber-500">✦</span> 혼주 시점 인사말</p>
                      <p className="flex items-center gap-2"><span className="text-amber-500">✦</span> 부모님 지인 대상 최적화</p>
                    </div>
                    <div className="flex items-center justify-center gap-4">
                      <button onClick={() => handleTemplateSelect('narrative-parents')} className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl transition-colors">
                        시작하기
                      </button>
                      <a href="/sample/parents" target="_blank" rel="noopener noreferrer" className="px-4 py-3 border border-gray-200 hover:border-gray-300 text-gray-600 text-sm rounded-xl transition-colors">
                        샘플
                      </a>
                    </div>
                  </div>
                </div>

                {/* THE CLASSIC */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden text-center" style={{ borderColor: '#E7E1D8' }}>
                  <div className="p-6 sm:p-10">
                    <div className="relative w-14 h-14 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-5">
                      <div className="absolute -inset-1 rounded-full opacity-[0.15] blur-[10px]" style={{ background: '#8C7B6B' }} />
                      <div className="relative w-full h-full border rounded-full flex items-center justify-center" style={{ background: 'rgba(140,123,107,0.06)', borderColor: 'rgba(140,123,107,0.2)' }}>
                        <svg className="w-7 h-7 sm:w-10 sm:h-10" style={{ color: '#8C7B6B' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="5" width="18" height="14" rx="2" fill="rgba(140,123,107,0.08)" />
                          <path d="M3 7l9 6 9-6" />
                        </svg>
                      </div>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1.5 sm:mb-3">THE CLASSIC</h2>
                    <p className="text-xs sm:text-base text-gray-600 mb-4 sm:mb-8">
                      봉투를 여는 연출과 캘린더로<br />
                      전하는 정중한 클래식 청첩장
                    </p>
                    <div className="space-y-1 sm:space-y-2 mb-5 sm:mb-8 text-xs sm:text-sm text-gray-500 text-left max-w-xs mx-auto">
                      <p className="flex items-center gap-2"><span style={{ color: '#8C7B6B' }}>✦</span> 봉투 오프닝 · 캘린더 연출</p>
                      <p className="flex items-center gap-2"><span style={{ color: '#8C7B6B' }}>✦</span> 격식 있는 인사말과 예식 정보</p>
                      <p className="flex items-center gap-2"><span style={{ color: '#8C7B6B' }}>✦</span> 혼주·지인 대상 클래식 무드</p>
                    </div>
                    <div className="flex items-center justify-center gap-4">
                      <button onClick={() => handleTemplateSelect('narrative-classic')} className="px-8 py-3 text-white text-sm font-medium rounded-xl transition-colors" style={{ background: '#8C7B6B' }}>
                        시작하기
                      </button>
                      <a href="/i/sample-classic" target="_blank" rel="noopener noreferrer" className="px-4 py-3 border border-gray-200 hover:border-gray-300 text-gray-600 text-sm rounded-xl transition-colors">
                        샘플
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: 심플형 → THE SIMPLE */}
          {/* Step 2: 심플형 → THE SIMPLE */}
          {selectedCategory === 'simple' && (
            <div>
              <button onClick={() => selectCategory(null)} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                다른 스타일 보기
              </button>
              <div className="text-center mb-8">
                <p className="text-xs tracking-widest uppercase mb-2" style={{ color: '#52525B' }}>Simple Type</p>
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2">심플형 청첩장</h1>
                <p className="text-xs sm:text-base text-gray-500">감각적인 디자인으로 완성하는 미니멀 청첩장</p>
              </div>

              <div className="max-w-2xl mx-auto">
                <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-300 transition-all duration-300 overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    <div className="sm:w-40 flex-shrink-0 flex flex-col items-center justify-center p-5 sm:p-6 border-b sm:border-b-0 sm:border-r" style={{ background: '#F4F4F5' }}>
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2">
                        <div className="absolute -inset-1 rounded-full opacity-[0.1] blur-[10px]" style={{ background: '#52525B' }} />
                        <div className="relative w-full h-full rounded-full flex items-center justify-center" style={{ background: '#ffffff' }}>
                          <svg className="w-5 h-5 sm:w-7 sm:h-7" style={{ color: '#52525B' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="rgba(82,82,91,0.08)" />
                          </svg>
                        </div>
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">THE SIMPLE</h2>
                      <p className="text-[10px] text-gray-400 mt-0.5">프리미엄 미니멀</p>
                    </div>
                    <div className="flex-1 p-5 sm:p-6">
                      <span className="inline-block px-2.5 py-1 text-[11px] font-medium text-white rounded-full mb-3" style={{ background: '#52525B' }}>미니멀을 추구하는 커플에게 추천</span>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className="text-[11px] text-gray-400">#미니멀</span>
                        <span className="text-[11px] text-gray-400">#프리미엄</span>
                        <span className="text-[11px] text-gray-400">#커스텀</span>
                      </div>
                      <div className="space-y-1.5 mb-4 text-[13px] text-gray-600">
                        <p className="flex items-start gap-2"><span style={{ color: '#52525B' }} className="mt-0.5 text-xs">&#10003;</span> 에디토리얼 타이포그래피와 고급스러운 여백</p>
                        <p className="flex items-start gap-2"><span style={{ color: '#52525B' }} className="mt-0.5 text-xs">&#10003;</span> 모든 섹션에 5~12가지 UI 대안 제공</p>
                        <p className="flex items-start gap-2"><span style={{ color: '#52525B' }} className="mt-0.5 text-xs">&#10003;</span> 섹션 순서·폰트·구분선까지 자유 커스텀</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleTemplateSelect('narrative-the-simple')} className="px-5 py-2.5 text-white text-sm font-medium rounded-xl transition-colors" style={{ background: '#52525B' }}>
                          시작하기
                        </button>
                        <a href="/i/sample-the-simple" target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 border border-gray-200 hover:border-gray-300 text-gray-500 text-sm rounded-xl transition-colors">
                          샘플 보기
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: THE 시리즈 → THE SIMPLE, THE CLASSIC */}
          {selectedCategory === 'the-series' && (
            <div>
              <button onClick={() => selectCategory(null)} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                다른 스타일 보기
              </button>
              <div className="text-center mb-8">
                <p className="text-xs tracking-widest uppercase mb-2" style={{ color: '#8C7B6B' }}>The Series</p>
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2">THE 시리즈</h1>
                <p className="text-xs sm:text-base text-gray-500">우리만의 무드를 담고 싶다면</p>
              </div>

              <div className="flex flex-col gap-4 sm:gap-5 max-w-2xl mx-auto">
                {/* THE SIMPLE */}
                <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-300 transition-all duration-300 overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    <div className="sm:w-40 flex-shrink-0 flex flex-col items-center justify-center p-5 sm:p-6 border-b sm:border-b-0 sm:border-r" style={{ background: '#F4F4F5' }}>
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2">
                        <div className="absolute -inset-1 rounded-full opacity-[0.1] blur-[10px]" style={{ background: '#52525B' }} />
                        <div className="relative w-full h-full rounded-full flex items-center justify-center" style={{ background: '#ffffff' }}>
                          <svg className="w-5 h-5 sm:w-7 sm:h-7" style={{ color: '#52525B' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="rgba(82,82,91,0.08)" />
                          </svg>
                        </div>
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">THE SIMPLE</h2>
                      <p className="text-[10px] text-gray-400 mt-0.5">프리미엄 미니멀</p>
                    </div>
                    <div className="flex-1 p-5 sm:p-6">
                      <span className="inline-block px-2.5 py-1 text-[11px] font-medium text-white rounded-full mb-3" style={{ background: '#52525B' }}>미니멀을 추구하는 커플에게 추천</span>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className="text-[11px] text-gray-400">#미니멀</span>
                        <span className="text-[11px] text-gray-400">#프리미엄</span>
                        <span className="text-[11px] text-gray-400">#커스텀</span>
                      </div>
                      <div className="space-y-1.5 mb-4 text-[13px] text-gray-600">
                        <p className="flex items-start gap-2"><span style={{ color: '#52525B' }} className="mt-0.5 text-xs">&#10003;</span> 에디토리얼 타이포그래피와 고급스러운 여백</p>
                        <p className="flex items-start gap-2"><span style={{ color: '#52525B' }} className="mt-0.5 text-xs">&#10003;</span> 모든 섹션에 5~12가지 UI 대안 제공</p>
                        <p className="flex items-start gap-2"><span style={{ color: '#52525B' }} className="mt-0.5 text-xs">&#10003;</span> 섹션 순서·폰트·구분선까지 자유 커스텀</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleTemplateSelect('narrative-the-simple')} className="px-5 py-2.5 text-white text-sm font-medium rounded-xl transition-colors" style={{ background: '#52525B' }}>
                          시작하기
                        </button>
                        <a href="/i/sample-the-simple" target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 border border-gray-200 hover:border-gray-300 text-gray-500 text-sm rounded-xl transition-colors">
                          샘플 보기
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* THE CLASSIC */}
                <div className="group bg-white rounded-2xl border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden" style={{ borderColor: '#E7E1D8' }}>
                  <div className="flex flex-col sm:flex-row">
                    <div className="sm:w-40 flex-shrink-0 flex flex-col items-center justify-center p-5 sm:p-6 border-b sm:border-b-0 sm:border-r" style={{ background: '#FAF8F4', borderColor: '#E7E1D8' }}>
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2">
                        <div className="absolute -inset-1 rounded-full opacity-[0.1] blur-[10px]" style={{ background: '#8C7B6B' }} />
                        <div className="relative w-full h-full border rounded-full flex items-center justify-center" style={{ background: 'rgba(140,123,107,0.06)', borderColor: 'rgba(140,123,107,0.2)' }}>
                          <svg className="w-5 h-5 sm:w-7 sm:h-7" style={{ color: '#8C7B6B' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="5" width="18" height="14" rx="2" fill="rgba(140,123,107,0.08)" />
                            <path d="M3 7l9 6 9-6" />
                          </svg>
                        </div>
                      </div>
                      <h2 className="text-lg font-bold text-gray-900 whitespace-nowrap">THE CLASSIC</h2>
                      <p className="text-[10px] text-gray-400 mt-0.5">클래식 · 격식</p>
                    </div>
                    <div className="flex-1 p-5 sm:p-6">
                      <span className="inline-block px-2.5 py-1 text-[11px] font-medium text-white rounded-full mb-3" style={{ background: '#8C7B6B' }}>정중한 무드를 원하는 커플에게 추천</span>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className="text-[11px] text-gray-400">#클래식</span>
                        <span className="text-[11px] text-gray-400">#격식</span>
                        <span className="text-[11px] text-gray-400">#캘린더</span>
                      </div>
                      <div className="space-y-1.5 mb-4 text-[13px] text-gray-600">
                        <p className="flex items-start gap-2"><span style={{ color: '#8C7B6B' }} className="mt-0.5 text-xs">&#10003;</span> 봉투를 여는 오프닝 · 캘린더 연출</p>
                        <p className="flex items-start gap-2"><span style={{ color: '#8C7B6B' }} className="mt-0.5 text-xs">&#10003;</span> 격식 있는 인사말과 예식 정보</p>
                        <p className="flex items-start gap-2"><span style={{ color: '#8C7B6B' }} className="mt-0.5 text-xs">&#10003;</span> 혼주·지인 대상에도 어울리는 클래식 무드</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleTemplateSelect('narrative-classic')} className="px-5 py-2.5 text-white text-sm font-medium rounded-xl transition-colors" style={{ background: '#8C7B6B' }}>
                          시작하기
                        </button>
                        <a href="/i/sample-classic" target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 border border-gray-200 hover:border-gray-300 text-gray-500 text-sm rounded-xl transition-colors">
                          샘플 보기
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
      )}

      {/* 템플릿 시트: 모바일은 아래에서, 데스크톱은 가운데 · 샘플을 직접 바꿔 보는 미리보기 */}
      {sheet && <TemplateSheet key={sheet.id} item={sheet} onClose={() => setSheet(null)} onStart={handleTemplateSelect} />}
    </div>
  )
}

export default function TemplatesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <TemplatesContent />
    </Suspense>
  )
}
