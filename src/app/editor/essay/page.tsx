'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import EssayPreview from './EssayPreview'
import EssayWizardEditor from './wizard/EssayWizardEditor'
import ShareModal from '@/components/share/ShareModal'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Essay 에디터용 데이터 타입
export interface EssayInvitationData {
  id?: string

  // 콘텐츠 모드: 러브스토리 or 인터뷰
  contentMode: 'story' | 'interview'

  // 디자인 컨셉: default(스크롤), book(책넘기기)
  designConcept: 'default' | 'book'

  // Couple info
  groom: {
    name: string; lastName: string; firstName: string
    phone: string; phoneEnabled: boolean
    father: { name: string; phone: string; phoneEnabled: boolean; isDeceased?: boolean; bank: { bank: string; account: string; holder: string; enabled: boolean } }
    mother: { name: string; phone: string; phoneEnabled: boolean; isDeceased?: boolean; bank: { bank: string; account: string; holder: string; enabled: boolean } }
    bank: { bank: string; account: string; holder: string; enabled: boolean }
  }
  bride: {
    name: string; lastName: string; firstName: string
    phone: string; phoneEnabled: boolean
    father: { name: string; phone: string; phoneEnabled: boolean; isDeceased?: boolean; bank: { bank: string; account: string; holder: string; enabled: boolean } }
    mother: { name: string; phone: string; phoneEnabled: boolean; isDeceased?: boolean; bank: { bank: string; account: string; holder: string; enabled: boolean } }
    bank: { bank: string; account: string; holder: string; enabled: boolean }
  }

  // Media (커버 이미지)
  media: {
    coverImage: string
    coverImageSettings?: { scale: number; positionX: number; positionY: number }
  }

  // Design (커버)
  design: {
    coverTitle: string
    coverDesign: 'full' | 'center' | 'typo' | 'emboss'
    embossColor?: string
  }

  // Wedding info
  wedding: {
    date: string; time: string; timeDisplay: string
    venue: { name: string; hall: string; address: string; hideHall?: boolean }
    directions: { car: string; publicTransport: string; train: string; expressBus: string; extraInfoEnabled?: boolean; extraInfoTitle?: string; extraInfoText?: string }
    dateEssay: string
    dateEssayTitle: string
    venueEssay: string
    venueEssayTitle: string
  }

  // Intro (before we begin)
  intro: {
    enabled: boolean
    title: string
    subtitle: string
    body: string
  }

  // Content
  greeting: string
  chapters: { title: string; subtitle: string; body: string }[]
  interviews: { question: string; answer: string; answerer: 'groom' | 'bride' | 'both' }[]
  quote: { text: string; author: string }
  thankYou: { title: string; message: string; sign: string }

  // Content essays
  content: {
    contactsEssay: string
    bankEssay: string
    guestbookEssay: string
    thankYouEssay: string
    bonusInterviews: { question: string; answer: string; answerer: 'groom' | 'bride' | 'both' }[]
    info: {
      dressCode: { title: string; content: string; enabled: boolean }
      photoBooth: { title: string; content: string; enabled: boolean }
      photoShare: { title: string; content: string; buttonText: string; url: string; enabled: boolean }
      flowerGift: { title: string; content: string; enabled: boolean }
      flowerChild: { title: string; content: string; enabled: boolean }
      wreath: { title: string; content: string; enabled: boolean }
      shuttle: { title: string; content: string; enabled: boolean }
      reception: { title: string; content: string; enabled: boolean }
      customItems: { id: string; emoji?: string; title: string; content: string; enabled: boolean }[]
      itemOrder?: string[]
    }
  }

  // Section visibility
  sectionVisibility: { contacts: boolean; bankAccounts: boolean; guestbook: boolean; rsvp: boolean; parentNames: boolean; guidance: boolean }

  // RSVP
  rsvpEnabled: boolean
  rsvpDeadline: string
  rsvpMealOption?: boolean
  rsvpShuttleOption?: boolean
  rsvpNotice?: string

  // Info items
  info: {
    dressCode: { title: string; content: string; enabled: boolean }
    photoBooth: { title: string; content: string; enabled: boolean }
    photoShare: { title: string; content: string; buttonText: string; url: string; enabled: boolean }
    flowerGift: { title: string; content: string; enabled: boolean }
    flowerChild: { title: string; content: string; enabled: boolean }
    wreath: { title: string; content: string; enabled: boolean }
    shuttle: { title: string; content: string; enabled: boolean }
    reception: { title: string; content: string; enabled: boolean }
    customItems: { id: string; emoji?: string; title: string; content: string; enabled: boolean }[]
    itemOrder?: string[]
  }

  // Meta
  meta: {
    title: string; description: string
    kakaoThumbnail: string
    kakaoThumbnailSettings?: { scale: number; positionX: number; positionY: number }
    ogImage?: string
    ogImageSettings?: { scale: number; positionX: number; positionY: number; cropX?: number; cropY?: number; cropWidth?: number; cropHeight?: number }
  }

  // Deceased display
  deceasedDisplayStyle: 'hidden' | 'flower' | 'text'

  // Design
  fontStyle: 'classic' | 'modern' | 'romantic' | 'contemporary' | 'luxury'
  fontSizeLevel: number // -2 ~ +2 (0=기본)
  colorTheme: 'essay-ivory' | 'essay-blush' | 'essay-sage' | 'essay-mono' | 'essay-sky' | 'essay-coral'
  highlightColor?: string // 커스텀 하이라이트 색상
  bgm: { enabled: boolean; url: string; autoplay: boolean }

  // Slug
  slug?: string
}

const defaultParent = { name: '', phone: '', phoneEnabled: false, isDeceased: false, bank: { bank: '', account: '', holder: '', enabled: false } }
const defaultBank = { bank: '', account: '', holder: '', enabled: false }

const defaultData: EssayInvitationData = {
  contentMode: 'story',
  designConcept: 'book',
  fontStyle: 'modern',
  fontSizeLevel: 0,
  colorTheme: 'essay-ivory',
  highlightColor: '#FFD700',
  bgm: { enabled: false, url: '', autoplay: true },
  media: { coverImage: '' },
  design: { coverTitle: 'OUR WEDDING ESSAY', coverDesign: 'emboss', embossColor: 'teal' },
  groom: {
    name: '', lastName: '', firstName: '',
    phone: '', phoneEnabled: true,
    father: { ...defaultParent }, mother: { ...defaultParent },
    bank: { ...defaultBank },
  },
  bride: {
    name: '', lastName: '', firstName: '',
    phone: '', phoneEnabled: true,
    father: { ...defaultParent }, mother: { ...defaultParent },
    bank: { ...defaultBank },
  },
  wedding: {
    date: '2026-06-20', time: '14:00', timeDisplay: '오후 2시',
    venue: { name: '', hall: '', address: '' },
    directions: { car: '', publicTransport: '', train: '', expressBus: '' },
    dateEssay: '',
    dateEssayTitle: '저희 결혼합니다.',
    venueEssay: '',
    venueEssayTitle: '초대합니다',
  },
  intro: {
    enabled: true,
    title: '우리만의 에세이',
    subtitle: '— 사진 없는 청첩장 —',
    body: '사진이 없는 이유는 단순합니다.\n우리의 이야기가 더 잘 보이길 바라서입니다.\n\n수많은 이미지 속에서\n스쳐 지나가는 대신,\n한 문장이라도 천천히 읽히고 싶었습니다.\n\n이곳은 우리의 기록이고,\n작은 에세이입니다.',
  },
  greeting: '서로 다른 길을 걸어온 두 사람이\n같은 산 위에서 멈춰 섰습니다.\n\n오래 기다려온 이 순간,\n당신과 함께하고 싶습니다.\n\n귀한 걸음으로 축복해 주세요.',
  chapters: [
    { title: '시작', subtitle: 'The Beginning', body: '2020년 가을, 북한산 둘레길에서\n처음 만났습니다.\n\n같은 방향으로 걷고 있던 두 사람.\n길을 물어보는 척 건넨 인사에\n돌아온 건 해맑은 웃음이었습니다.\n\n정상까지 함께 오르며 나눈 대화가\n어찌나 편하던지.\n\n산을 내려오는 길이\n아쉬웠던 건 처음이었습니다.' },
    { title: '우리의 시간', subtitle: 'Our Days Together', body: '그 뒤로 매주 함께 산에 올랐습니다.\n\n봄에는 진달래가 핀 능선을 걸었고,\n여름에는 계곡에 발을 담갔습니다.\n가을 단풍 아래에서 도시락을 나눠 먹고,\n겨울 설산에서는 서로의 손을 꼭 잡았습니다.\n\n>>"이번 주말 어디 갈까?"가 "이번 주말 어느 산 갈까?"로<<\n\n바뀐 것은 아주 자연스러운 일이었습니다.' },
    { title: '약속', subtitle: 'The Promise', body: '프로포즈는 북한산 정상에서\n하려고 했습니다.\n\n그런데 반지를 배낭 맨 아래에 넣어둔 걸\n깜빡하고 말았습니다.\n\n정상에서 허겁지겁 짐을 뒤지는 저를 보며\n그녀가 물었습니다.\n>>"혹시 반지 찾는 거야?"<<\n\n들켰지만, 어쨌든 무릎을 꿇었고\n그녀는 웃으면서 울었습니다.\n\n완벽하진 않았지만\n우리다운 약속이었습니다.' },
  ],
  interviews: [
    { question: '상대방의 첫인상은 어땠나요?', answer: '산에서 만나서 그런지, 꾸밈없는 모습이 좋았어요. 등산화 신고 환하게 웃는 얼굴이 아직도 선명합니다.', answerer: 'groom' as const },
    { question: '결혼을 결심하게 된 계기는?', answer: '비가 쏟아지는 산속에서 길을 잃었을 때, 겁먹은 저를 안심시키며 묵묵히 길을 찾아준 사람이에요. 이 사람이면 어디든 괜찮겠다 싶었습니다.', answerer: 'bride' as const },
    { question: '서로에게 하고 싶은 말은?', answer: '매일 "고마워"라고 말하지만, 진짜 고마운 건 네가 내 옆에서 같은 방향을 바라봐 주는 것 자체야. 앞으로도 잘 부탁해.', answerer: 'both' as const },
    { question: '결혼 후 가장 하고 싶은 것은?', answer: '1년간 세계 여행을 떠날 거예요. 히말라야 트레킹부터 파타고니아까지, 세상의 모든 길을 함께 걸어보고 싶습니다.', answerer: 'groom' as const },
  ],
  quote: { text: '인생에서 가장 아름다운 여행은\n사랑하는 사람과 같은 길을 걷는 것이다.', author: '파울로 코엘료' },
  thankYou: { title: '감사 인사', message: '바쁘신 와중에도\n저희의 결혼을 축하해 주셔서\n진심으로 감사드립니다.\n\n여러분의 축복을 마음에 새기며\n서로 아끼고 사랑하며 살겠습니다.', sign: '민준 & 서연 올림' },
  content: {
    contactsEssay: '축하의 마음을 전하고 싶으시다면,\n편하게 연락해 주세요.\n\n한 통의 전화, 짧은 문자 하나에도\n저희는 크게 웃을 수 있답니다.',
    bankEssay: '직접 찾아뵙고 감사 인사 드려야 하나\n여의치 않아 이렇게 글로 대신합니다.\n\n넓은 마음으로 양해 부탁드립니다.',
    guestbookEssay: '이야기의 마지막 페이지는\n여러분의 따뜻한 한 마디로 채워집니다.\n\n축하, 응원, 혹은 그냥 안부 한 줄도\n저희에게는 소중한 선물이에요.',
    thankYouEssay: '',
    bonusInterviews: [],
    info: {
      dressCode: { title: '드레스코드 안내', content: '', enabled: false },
      photoBooth: { title: '포토부스', content: '소중한 하루를 오래 기억할 수 있도록\n포토부스가 준비되어 있습니다.', enabled: false },
      photoShare: { title: '사진 공유', content: '', buttonText: '사진 공유하기', url: '', enabled: false },
      flowerGift: { title: '꽃 답례품 안내', content: '', enabled: false },
      flowerChild: { title: '화동 안내', content: '', enabled: false },
      wreath: { title: '화환 안내', content: '', enabled: false },
      shuttle: { title: '셔틀버스 안내', content: '', enabled: false },
      reception: { title: '피로연 안내', content: '', enabled: false },
      customItems: [],
    },
  },
  sectionVisibility: { contacts: true, bankAccounts: true, guestbook: true, rsvp: true, parentNames: true, guidance: true },
  rsvpEnabled: true,
  rsvpDeadline: '',
  info: {
    dressCode: { title: '드레스코드 안내', content: '', enabled: false },
    photoBooth: { title: '포토부스', content: '소중한 하루를 오래 기억할 수 있도록\n포토부스가 준비되어 있습니다.', enabled: false },
    photoShare: { title: '사진 공유', content: '', buttonText: '사진 공유하기', url: '', enabled: false },
    flowerGift: { title: '꽃 답례품 안내', content: '', enabled: false },
    flowerChild: { title: '화동 안내', content: '', enabled: false },
    wreath: { title: '화환 안내', content: '', enabled: false },
    shuttle: { title: '셔틀버스 안내', content: '', enabled: false },
    reception: { title: '피로연 안내', content: '', enabled: false },
    customItems: [],
  },
  meta: { title: '', description: '', kakaoThumbnail: '' },
  deceasedDisplayStyle: 'hidden',
}

function EssayEditorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, status } = useAuth()
  const editId = searchParams.get('id')
  const urlSlug = searchParams.get('slug')
  const isAdminMode = searchParams.get('admin') === 'true'

  // Admin 모드 헤더 구성
  const getAdminHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (isAdminMode) {
      const adminPw = localStorage.getItem('admin_password')
      if (adminPw) headers['x-admin-password'] = adminPw
    }
    return headers
  }

  const [data, setData] = useState<EssayInvitationData>(defaultData)
  const [invitationId, setInvitationId] = useState<string | null>(editId)
  const [savedSlug, setSavedSlug] = useState<string | null>(urlSlug || null)
  const [isLoading, setIsLoading] = useState(!!editId)
  const [isSaving, setIsSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [currentWizardStep, setCurrentWizardStep] = useState<number>(1)
  const wizardStepRef = useRef<number>(1)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor')
  const [previewKey, setPreviewKey] = useState(0)
  const [isExitModalOpen, setIsExitModalOpen] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 나가기 방지
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = '저장하지 않은 변경사항이 있습니다.'; return e.returnValue }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  // 뒤로가기 방지
  useEffect(() => {
    if (isDirty) {
      window.history.pushState(null, '', window.location.href)
      const handlePopState = () => { window.history.pushState(null, '', window.location.href); setIsExitModalOpen(true) }
      window.addEventListener('popstate', handlePopState)
      return () => window.removeEventListener('popstate', handlePopState)
    }
  }, [isDirty])

  // 기존 청첩장 불러오기
  useEffect(() => {
    if (status === 'loading') return
    if (editId) {
      setIsLoading(true)
      fetch(`/api/invitations/${editId}`, { headers: getAdminHeaders() })
        .then(async res => await res.json() as { invitation?: { content?: string; slug?: string } })
        .then((result) => {
          if (result.invitation) {
            if (result.invitation.slug) setSavedSlug(result.invitation.slug)
            if (result.invitation.content) {
              try {
                const content = JSON.parse(result.invitation.content)
                setData({ ...defaultData, ...content })
              } catch (e) { console.error('Failed to parse content:', e) }
            }
          }
        })
        .catch(err => console.error('Failed to load:', err))
        .finally(() => setIsLoading(false))
    }
  }, [editId, status])

  const updateData = (updates: Partial<EssayInvitationData>) => { setData(prev => ({ ...prev, ...updates })); setIsDirty(true) }

  const updateNestedData = (path: string, value: unknown) => {
    setData(prev => {
      const newData = { ...prev }
      const keys = path.split('.')
      let current: Record<string, unknown> = newData
      for (let i = 0; i < keys.length - 1; i++) {
        const child = current[keys[i]]
        current[keys[i]] = Array.isArray(child) ? [...child] : { ...(child as Record<string, unknown>) }
        current = current[keys[i]] as Record<string, unknown>
      }
      current[keys[keys.length - 1]] = value
      return newData
    })
    setIsDirty(true)
  }

  // 저장
  const handleSave = async (silent = false) => {
    if (!user && !isAdminMode) {
      // 게스트 모드: sessionStorage에 드래프트 저장 후 로그인 이동
      try {
        sessionStorage.setItem('editor_draft_essay', JSON.stringify(data))
      } catch { /* 무시 */ }
      const currentUrl = window.location.pathname + window.location.search
      router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`)
      throw new Error('로그인이 필요합니다.')
    }
    const groomName = data.groom.name.trim()
    const brideName = data.bride.name.trim()
    if (!groomName || !brideName) {
      const msg = '신랑/신부 이름을 모두 입력해주세요.'
      if (!silent) alert(msg)
      throw new Error(msg)
    }
    setIsSaving(true)
    try {
      const payload: Record<string, unknown> = {
        template_id: 'narrative-essay',
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

      let response
      if (invitationId) {
        response = await fetch(`/api/invitations/${invitationId}`, { method: 'PUT', headers: getAdminHeaders(), body: JSON.stringify(payload) })
      } else {
        response = await fetch('/api/invitations', { method: 'POST', headers: getAdminHeaders(), body: JSON.stringify(payload) })
      }
      const result = await response.json() as { error?: string; invitation?: { id: string } }
      if (!response.ok) throw new Error(result.error || '저장에 실패했습니다.')
      if (!invitationId && result.invitation?.id) {
        setInvitationId(result.invitation.id)
        const adminParam = isAdminMode ? '&admin=true' : ''
        window.history.replaceState({}, '', `/editor/essay?id=${result.invitation.id}${adminParam}`)
      }
      setIsDirty(false)
      if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push({ event: 'invitation_save', template_id: 'narrative-essay', is_new: !invitationId })
      }
      if (!silent) alert('저장되었습니다!')
    } catch (error) {
      console.error('Save error:', error)
      if (!silent) alert(error instanceof Error ? error.message : '저장에 실패했습니다.')
      throw error
    } finally { setIsSaving(false) }
  }

  const handleShare = () => {
    if (!invitationId) { alert('공유하려면 먼저 저장해주세요.'); return }
    setIsShareModalOpen(true)
  }

  const handleSlugChange = async (newSlug: string) => {
    if (!invitationId) throw new Error('저장 후 주소를 변경할 수 있습니다.')
    const response = await fetch(`/api/invitations/${invitationId}/slug`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: newSlug }) })
    if (!response.ok) { const result = await response.json() as { error?: string }; throw new Error(result.error || '슬러그 변경에 실패했습니다.') }
    setSavedSlug(newSlug)
  }

  // 기존 청첩장 편집 시에만 로그인 필수 (새 청첩장은 게스트 모드 허용, admin 모드 제외)
  if (status === 'unauthenticated' && editId && !isAdminMode) {
    const currentUrl = window.location.pathname + window.location.search
    router.replace(`/login?redirect=${encodeURIComponent(currentUrl)}`)
    return null
  }

  if (status === 'loading' || (editId && isLoading)) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-6 w-6 border border-gray-300 border-t-gray-900" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col theme-neu">
      {/* Header */}
      <header className="h-12 sm:h-14 editor-header flex items-center justify-between px-3 sm:px-6 shrink-0">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/"><img src="/logo.png" alt="Dear Drawer" className="h-5 sm:h-6 w-auto" /></Link>
          <div className="hidden sm:block h-4 w-px bg-gray-200" />
          <span className="hidden sm:inline text-sm text-gray-400 font-light tracking-wide">
            ESSAY 청첩장
            {isDirty && <span className="ml-2 text-gray-600">&bull; 미저장</span>}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 미리보기 버튼 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPreviewOpen(true)}
            className="neu-btn text-gray-600 text-xs tracking-wide"
          >
            <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="hidden sm:inline">미리보기</span>
          </Button>
          {/* 데스크탑: 공유 버튼 */}
          <Button variant="outline" size="sm" onClick={handleShare} className="hidden sm:flex neu-btn text-gray-600 text-xs tracking-wide">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            공유
          </Button>
          <Button size="sm" disabled={isSaving} onClick={() => handleSave()} className="neu-btn-primary rounded-xl text-xs tracking-wide">
            {isSaving ? (
              <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full sm:mr-2" /><span className="hidden sm:inline">저장 중</span></>
            ) : (
              <><svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg><span className="hidden sm:inline">저장</span></>
            )}
          </Button>
        </div>
      </header>

      {/* Main Editor Area */}
      <div id="essay-editor-scroll-container" className="flex-1 overflow-y-scroll editor-scroll-area">
        <div className="w-full max-w-[1400px] mx-auto">
          <div className="flex">
            {/* Preview - 왼쪽 sticky 고정, 카드형 디바이스 프리뷰 (데스크탑) */}
            {!isMobile && (
              <div className="w-[460px] min-w-[460px] sticky top-0 overflow-hidden editor-panel m-4 mr-0 flex justify-center items-center" style={{ height: 'calc(100vh - 88px)' }}>
                <div className="w-[390px] shadow-2xl bg-white overflow-hidden border border-gray-200" style={{ height: '710px' }}>
                  <div className="h-full overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <EssayPreview data={data} />
                  </div>
                </div>
              </div>
            )}

            {/* 모바일: 미리보기 모드 (항상 마운트, CSS로 숨김) */}
            {isMobile && (
              <div className="w-full flex flex-col items-center py-8 relative" style={{ minHeight: 'calc(100vh - 104px)', display: mobileView === 'preview' ? 'flex' : 'none' }}>
                <button
                  onClick={() => setPreviewKey(k => k + 1)}
                  className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/5 hover:bg-black/10 active:bg-black/15 transition-colors"
                  title="애니메이션 다시보기"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <div className="w-[320px] shadow-2xl bg-white overflow-hidden border border-gray-200 flex-1" style={{ maxHeight: '630px' }}>
                  <div className="h-full overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <EssayPreview key={previewKey} data={data} />
                  </div>
                </div>
              </div>
            )}

            {/* Edit Panel - 오른쪽 (데스크탑) / 전체 (모바일 편집 모드) */}
            <div className={`${isMobile ? 'w-full' : 'flex-1 flex flex-col overflow-hidden editor-panel m-4 ml-3.5'}`} style={isMobile ? { paddingBottom: '56px', display: mobileView === 'editor' ? 'block' : 'none' } : { height: 'calc(100vh - 88px)' }}>
                <EssayWizardEditor
                  data={data}
                  updateData={updateData}
                  updateNestedData={updateNestedData}
                  invitationId={invitationId}
                  slug={savedSlug || urlSlug || (invitationId ? invitationId : null)}
                  onSave={() => handleSave(true)}
                  onSlugChange={handleSlugChange}
                  initialStep={wizardStepRef.current as 1 | 2 | 3 | 4 | 5}
                  onStepChange={(step) => { setCurrentWizardStep(step); wizardStepRef.current = step }}
                />
              </div>
          </div>
        </div>
      </div>

      {/* Full Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <button
            onClick={() => setIsPreviewOpen(false)}
            className="absolute top-6 right-6 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="relative w-[390px] h-[844px] overflow-y-auto bg-white rounded-lg shadow-2xl">
            <EssayPreview data={data} fullscreen />
          </div>
        </div>
      )}

      {/* Share Modal */}
      {invitationId && (
        <ShareModal
          open={isShareModalOpen}
          onOpenChange={setIsShareModalOpen}
          invitationId={invitationId}
          currentSlug={savedSlug || undefined}
          onSlugChange={setSavedSlug}
          groomName={data.groom.name}
          brideName={data.bride.name}
          weddingDate={data.wedding.date}
          weddingTime={data.wedding.timeDisplay}
          venueName={data.wedding.venue.name}
          venueAddress={data.wedding.venue.address}
          thumbnailUrl={data.meta.kakaoThumbnail || ''}
          shareTitle={data.meta.title}
          shareDescription={data.meta.description}
          templateType="our"
        />
      )}

      {/* 모바일 하단 탭 바 */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-40 mobile-tab-bar flex safe-area-bottom">
          <button
            onClick={() => setMobileView('editor')}
            className={`flex-1 py-3.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${mobileView === 'editor' ? 'text-black' : 'text-gray-400'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            편집
          </button>
          <div className="w-px bg-gray-200 my-2" />
          <button
            onClick={() => setMobileView('preview')}
            className={`flex-1 py-3.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${mobileView === 'preview' ? 'text-black' : 'text-gray-400'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            미리보기
          </button>
        </div>
      )}

      {/* 나가기 확인 모달 */}
      {isExitModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center">저장하지 않은 변경사항이 있어요</h3>
              <p className="text-sm text-gray-500 text-center mt-2">지금 나가면 작업한 내용이 사라집니다.<br />저장하고 나가시겠어요?</p>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setIsExitModalOpen(false)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">계속 편집</button>
              <button onClick={() => { setIsDirty(false); setIsExitModalOpen(false); if (pendingNavigation) router.push(pendingNavigation); else router.back() }} className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium">저장 안 함</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function EssayEditorPage() {
  return (
    <ErrorBoundary fallback={
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="max-w-md w-full p-8 text-center">
          <h2 className="text-xl font-medium text-gray-900 mb-2">에디터 오류</h2>
          <p className="text-gray-600 mb-6">에디터를 불러오는 중 문제가 발생했습니다.</p>
          <Link href="/"><button className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">홈으로</button></Link>
        </div>
      </div>
    }>
      <Suspense fallback={<div className="h-screen flex items-center justify-center bg-white"><div className="animate-spin rounded-full h-6 w-6 border border-gray-300 border-t-gray-900" /></div>}>
        <EssayEditorContent />
      </Suspense>
    </ErrorBoundary>
  )
}
