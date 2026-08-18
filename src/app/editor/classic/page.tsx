'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import ClassicPreview from './ClassicPreview'
import ClassicWizardEditor from './wizard/ClassicWizardEditor'
import type { ClassicPhoto } from './ClassicPhotoField'
import ShareModal from '@/components/share/ShareModal'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// ===== THE CLASSIC 에디터용 데이터 타입 =====
// 클라이언트(InvitationClientClassic)가 읽는 content 경로를 그대로 반영한다.
export interface ClassicBank {
  bank: string
  account: string
  holder: string
  enabled: boolean
}

export interface ClassicParentInfo {
  name: string
  bank: ClassicBank
  deceased?: boolean // 고인 표시
}

export interface ClassicPersonInfo {
  name: string
  nameEn: string
  father: ClassicParentInfo
  mother: ClassicParentInfo
  bank: ClassicBank
}

export interface ClassicInvitationData {
  id?: string
  slug?: string

  // 색상 (포인트 / 전체배경 / 섹션배경)
  customAccentColor: string
  customBgColor: string
  customSectionBgColor: string

  // Couple info
  groom: ClassicPersonInfo
  bride: ClassicPersonInfo

  // Wedding info
  wedding: {
    date: string
    time: string
    timeDisplay: string
    venue: { name: string; hall: string; address: string }
    directions: { car: string; publicTransport: string; train: string; expressBus: string }
  }

  // Gallery — 각 사진은 문자열(URL) 또는 크롭 정보를 포함한 객체({url,scale,positionX,positionY})
  gallery: { images: (string | ClassicPhoto)[] }

  // 중첩 content (InvitationClientClassic이 c.content로 읽는 영역)
  content: {
    greeting: string
    quote: { text: string; author: string }
    coupleTogetherText: string
    classicOpeningStyle: '프레임' | '실링' | '트레이싱지' | '접힌 편지' | '사진 뒤집기'
    classicAccountSide: 'both' | 'groom' | 'bride'
    // 폰트 (THE SIMPLE과 동일 목록 · fontOptions)
    classicDisplayFont?: string // 영문 디스플레이 폰트 id (DISPLAY_FONTS)
    classicBodyFont?: string // 한글 본문 폰트 id (KOREAN_FONTS)
    // 오프닝(인트로) 커스텀
    classicOpeningBgImage?: string // 오프닝 배경 이미지 URL
    classicOpeningBgColor?: string // 오프닝 배경 색상 (미설정 시 전체 배경색)
    classicOpeningTextColor?: string // 오프닝 텍스트 색상 (미설정 시 포인트 컬러)
    classicOpeningFrame?: 'frame1' | 'frame2' | 'none' // 프레임(바로시작) 엠보스 프레임 (배경색 위 오버레이)
    classicFrameHintColor?: string // 프레임 오프닝: 이름 아래 '터치 또는 스크롤' 글자색 (미설정 시 포인트색)
    classicOpeningNameLang?: 'en' | 'ko' // 오프닝 이름 언어 5종 공통 (기본 영문)
    classicSealColor?: string // 실링 인장 색상 (리본 매듭 인장, 미설정 시 기본 은색)
    classicTraceVeilColor?: string // 트레이싱지 걷어낸 사진 위 오버레이 색상
    classicTraceVeilOpacity?: number // 트레이싱지 오버레이 투명도 0~1 (0=없음, 자연 사진)
    classicTraceStartText?: string // 트레이싱지 시작 전 문구 (기본 '화면을 누르세요')
    classicInfoStartText?: string // 접힌편지·사진뒤집기 안내 문구 (기본 '예식 정보 빠르게 확인하기')
    classicInfoOverlayColor?: string // 접힌편지·사진뒤집기 배경 오버레이 색상
    classicInfoPhotoOpacity?: number // 접힌편지·사진뒤집기 첫 사진 배경 투명도 0~1 (0=사진 없음)
    // 본문 · 인사말 배경
    classicGreetingBgImage?: ClassicPhoto // 인사말 배경 사진 (크롭, 미설정 시 갤러리 첫 사진)
    classicGreetingOverlayColor?: string // 인사말 배경 오버레이 색상
    classicGreetingOverlayOpacity?: number // 인사말 배경 오버레이 투명도 0~1
    classicLetterFrame?: 'wave' | 'lace' // 인사말 카드 프레임 (웨이브 / 레이스)
    // 본문 · 신랑신부 소개
    classicIntroMode?: 'each' | 'together' // 각자 / 함께
    classicIntroEachFrame?: 'plaque' | 'stamp' // 각자 카드 프레임 (웨이브 플라크 / 우표)
    classicIntroTogetherFrame?: 'pearl' | 'filigree' // 함께 소개 프레임 (진주 / 필리그리)
    classicGroomIntro?: string // 신랑 소개 한마디 (각자)
    classicBrideIntro?: string // 신부 소개 한마디 (각자)
    classicGroomPhoto?: ClassicPhoto // 신랑 사진 (각자)
    classicBridePhoto?: ClassicPhoto // 신부 사진 (각자)
    classicTogetherPhoto?: ClassicPhoto // 함께 사진
    // 본문 · 간지 (사진2 / FULL / 인용구)
    classicInterstitials?: { type: 'photo2' | 'photo1' | 'photoText'; photos?: ClassicPhoto[]; text?: string; caption?: string }[]
    // 본문 · 예식 일정 사진
    classicDatePhoto?: ClassicPhoto
    classicDatePhotoEnabled?: boolean // 예식 일정 폴라로이드 사진 표시 여부 (기본 true)
    classicDateFrame?: 'heart' | 'stamp' // 예식일정 사진 프레임 (하트 / 우표)
    // 혼주 표시 (인사말/소개)
    classicShowParents?: boolean // 부모님 성함 표시 여부 (기본 true)
    classicGroomTitle?: string // 신랑 호칭 (기본 '아들')
    classicBrideTitle?: string // 신부 호칭 (기본 '딸')
    classicDeceasedStyle?: 'flower' | 'hanja' // 고인 표시 스타일 (국화 / 故)
    // 결혼식 안내(Information) 캐러셀 — 항목별 사진 + 섹션 배경
    classicInfo: { title: string; body: string; pos: string; photo?: ClassicPhoto }[]
    // 결혼식 안내(가이드) — PARENTS 방식: 항목별 토글 + 기본 멘트 + 커스텀
    classicGuideEnabled?: boolean
    classicGuide?: { title: string; body: string; enabled: boolean; photo?: ClassicPhoto }[]
    classicInfoSectionBg?: ClassicPhoto // 결혼식 안내 섹션 배경 사진
    classicInfoSectionOverlayColor?: string
    classicInfoSectionOverlayOpacity?: number
    classicInfoImgTextColor?: string // 결혼식 안내 이미지 배경 위 텍스트
    classicDirectionsBg?: ClassicPhoto // 오시는길 상단 배경 사진 (미설정 시 갤러리 첫 사진)
    // 커플소개 섹션 배경
    classicIntroSectionBg?: ClassicPhoto
    classicIntroSectionOverlayColor?: string
    classicIntroSectionOverlayOpacity?: number
    classicIntroImgTextColor?: string // 커플소개 이미지 배경 위 텍스트
    // 감사인사(공유) 섹션 배경
    classicThanksSectionBg?: ClassicPhoto
    classicThanksSectionOverlayColor?: string
    classicThanksSectionOverlayOpacity?: number
    classicThanksImgTextColor?: string // 감사인사 이미지 배경 위 텍스트
    // 배경음악
    classicBgmEnabled?: boolean
    classicBgmUrl?: string
    classicBgmAutoplay?: boolean
    // RSVP
    classicContentOrder?: string[] // 섹션 순서
    classicHiddenSections?: string[] // 숨긴 섹션 키 목록
    classicSectionBgMap?: Record<string, 'tinted'> // 섹션별 배경 모드 (기본/틴티드)
    classicDefaultTextColor?: string // 기본 배경 텍스트
    classicTintedTextColor?: string // 틴티드 배경 텍스트
    classicButtonTextColor?: string // 채움 버튼 글자색
    classicThankYou?: string // 마무리 감사 인사 (공유 섹션)
    classicThanksFrame?: 'none' | 'doily' // 마무리 감사 인사 프레임 (없음 / 도일리)
    classicDateHeading?: string // 예식일정 상단 문구 (저희가 하나 되는 날)
    classicIntroShowParents?: boolean // 커플소개 상단 부모님 성함 표시
    classicLetterSign?: 'parents' | 'couple' | 'hosts' // 인사말 서명 방식
    classicHostSide?: 'both' | 'groom' | 'bride' // 혼주 올림: 표시할 측
    classicRsvpMeal?: boolean // 식사 여부 입력
    classicRsvpShuttle?: boolean // 대절버스 이용 여부 입력
    classicRsvpPhone?: boolean // 연락처 뒷자리
    classicRsvpSideDetail?: boolean // 본인/아버지/어머니 구분
    classicRsvpSideDetailOptions?: Record<string, boolean> // 표시할 하객 구분 항목 (신랑/신랑아버지/신랑어머니/신부/신부아버지/신부어머니)
    classicRsvpNotice?: string // 상단 안내문구
    classicRsvpMessagePlaceholder?: string // 축하메시지 placeholder
    classicLightboxVariant?: number // 갤러리 라이트박스 스타일 (1=에디토리얼 2=글라스 4=룩북 5=시네마 6=미니멀 7=매거진 9=필름)
    classicGalleryType?: 'default' | 'album' | 'fullbleed' | 'swipe' | 'film' // 갤러리 레이아웃 타입
    classicGalleryCaption?: string // 갤러리 캡션 (이탤릭)
  }

  // 공유 메타 (Phase 2에서 편집 UI 추가 예정)
  meta: { title: string; description: string; kakaoThumbnail: string; kakaoThumbnailRatio?: '3:4' | '1:1' | '3:2'; ogImage?: string }
}

// 갤러리 이미지(문자열 URL 또는 크롭 객체)에서 URL만 추출하는 헬퍼
export const classicGalleryUrl = (im: string | ClassicPhoto | undefined | null): string =>
  (typeof im === 'string' ? im : im?.url) || ''

const defaultBank = (): ClassicBank => ({ bank: '', account: '', holder: '', enabled: false })
const defaultParent = (): ClassicParentInfo => ({ name: '', bank: defaultBank() })
const defaultPerson = (): ClassicPersonInfo => ({
  name: '',
  nameEn: '',
  father: defaultParent(),
  mother: defaultParent(),
  bank: defaultBank(),
})

const defaultData: ClassicInvitationData = {
  customAccentColor: '#351714',
  customBgColor: '#FFFFFF',
  customSectionBgColor: '#DDD1BB',
  groom: defaultPerson(),
  bride: defaultPerson(),
  wedding: {
    date: '2026-06-20',
    time: '14:00',
    timeDisplay: '오후 2시',
    venue: { name: '', hall: '', address: '' },
    directions: { car: '', publicTransport: '', train: '', expressBus: '' },
  },
  gallery: { images: [] },
  content: {
    greeting: '',
    quote: { text: '', author: '' },
    coupleTogetherText: '',
    classicOpeningStyle: '프레임',
    classicAccountSide: 'both',
    classicDisplayFont: 'italiana',
    classicBodyFont: 'classic',
    classicInfo: [],
  },
  meta: { title: '', description: '', kakaoThumbnail: '' },
}

function ClassicEditorContent() {
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

  const [data, setData] = useState<ClassicInvitationData>(defaultData)
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
  // 모바일 분할 뷰(미리보기+편집 동시): 상단 미리보기 비율 %
  const [splitRatio, setSplitRatio] = useState(45)
  const splitDragging = useRef(false)
  const splitStartY = useRef(0)
  const splitStartRatio = useRef(45)
  useEffect(() => {
    const onMove = (clientY: number) => {
      if (!splitDragging.current) return
      const delta = ((clientY - splitStartY.current) / window.innerHeight) * 100
      setSplitRatio(Math.min(75, Math.max(20, splitStartRatio.current + delta)))
    }
    const onEnd = () => { splitDragging.current = false }
    const tm = (e: TouchEvent) => { if (!splitDragging.current) return; e.preventDefault(); onMove(e.touches[0].clientY) }
    const mm = (e: MouseEvent) => onMove(e.clientY)
    document.addEventListener('touchmove', tm, { passive: false })
    document.addEventListener('touchend', onEnd)
    document.addEventListener('mousemove', mm)
    document.addEventListener('mouseup', onEnd)
    return () => {
      document.removeEventListener('touchmove', tm)
      document.removeEventListener('touchend', onEnd)
      document.removeEventListener('mousemove', mm)
      document.removeEventListener('mouseup', onEnd)
    }
  }, [])
  const startSplitDrag = (clientY: number) => {
    splitDragging.current = true
    splitStartY.current = clientY
    splitStartRatio.current = splitRatio
  }
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

  // 로그인 후 복귀 시 sessionStorage에서 드래프트 복구 (게스트 모드로 저장 시도했던 경우)
  useEffect(() => {
    if (user && !editId) {
      try {
        const draft = sessionStorage.getItem('editor_draft_classic')
        if (draft) {
          const parsed = JSON.parse(draft)
          setData(prev => ({ ...prev, ...parsed }))
          setIsDirty(true)
          sessionStorage.removeItem('editor_draft_classic')
        }
      } catch { /* 파싱 실패 무시 */ }
    }
  }, [user, editId])

  const updateData = (updates: Partial<ClassicInvitationData>) => { setData(prev => ({ ...prev, ...updates })); setIsDirty(true) }

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
        sessionStorage.setItem('editor_draft_classic', JSON.stringify(data))
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
        template_id: 'narrative-classic',
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
        window.history.replaceState({}, '', `/editor/classic?id=${result.invitation.id}${adminParam}`)
      }
      setIsDirty(false)
      if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push({ event: 'invitation_save', template_id: 'narrative-classic', is_new: !invitationId })
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
            THE CLASSIC 청첩장
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
      <div id="classic-editor-scroll-container" className="flex-1 overflow-y-scroll editor-scroll-area">
        <div className="w-full max-w-[1400px] mx-auto">
          <div className={`flex ${isMobile ? 'flex-col' : ''}`} style={isMobile ? { height: 'calc(100dvh - 48px)' } : undefined}>
            {/* Preview - 왼쪽 sticky 고정, 카드형 디바이스 프리뷰 (데스크탑) */}
            {!isMobile && (
              <div className="w-[460px] min-w-[460px] sticky top-0 overflow-hidden editor-panel m-4 mr-0 flex justify-center items-center" style={{ height: 'calc(100vh - 88px)' }}>
                <div className="shadow-2xl bg-white overflow-hidden border border-gray-200 relative" style={{ height: 'min(780px, calc(100vh - 88px))', aspectRatio: '9 / 18', maxWidth: '100%' }}>
                  <div className="h-full overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <ClassicPreview data={data} />
                  </div>
                </div>
              </div>
            )}

            {/* 모바일: 미리보기 모드 (항상 마운트, CSS로 숨김) */}
            {isMobile && (
              <div className="w-full flex items-center justify-center relative overflow-hidden" style={{ height: `${splitRatio}%`, flexShrink: 0, transform: 'translateZ(0)', padding: '8px 0' }}>
                <button
                  onClick={() => setPreviewKey(k => k + 1)}
                  className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/5 hover:bg-black/10 active:bg-black/15 transition-colors"
                  title="다시보기"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                {/* 높이=분할영역 100% + aspect 9:18 → 드래그해도 폭이 높이를 따라가 비율 고정 (THE SIMPLE처럼 안 깨짐) */}
                <div className="shadow-2xl bg-white overflow-hidden border border-gray-200 relative" style={{ height: '100%', aspectRatio: '9 / 18', maxWidth: '100%', borderRadius: 10 }}>
                  <div className="h-full overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <ClassicPreview key={previewKey} data={data} />
                  </div>
                </div>
              </div>
            )}

            {/* 모바일: 분할 드래그 핸들 */}
            {isMobile && (
              <div
                className="w-full flex items-center justify-center bg-gray-100 border-y border-gray-200 cursor-row-resize touch-none select-none"
                style={{ height: '20px', flexShrink: 0 }}
                onTouchStart={(e) => startSplitDrag(e.touches[0].clientY)}
                onMouseDown={(e) => startSplitDrag(e.clientY)}
              >
                <div className="w-10 h-1 rounded-full bg-gray-400" />
              </div>
            )}

            {/* Edit Panel - 오른쪽 (데스크탑) / 전체 (모바일 편집 모드) */}
            <div className={`${isMobile ? 'w-full' : 'flex-1 flex flex-col overflow-hidden editor-panel m-4 ml-3.5'}`} style={isMobile ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' } : { height: 'calc(100vh - 88px)' }}>
                <ClassicWizardEditor
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
          <div className="relative overflow-y-auto bg-white shadow-2xl" style={isMobile ? { width: '100%', height: '100dvh' } : { height: 'min(780px, calc(100vh - 40px))', aspectRatio: '9 / 18', maxWidth: 'calc(100vw - 32px)', borderRadius: 8 }}>
            <ClassicPreview data={data} fullscreen />
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
          thumbnailUrl={data.meta.kakaoThumbnail || classicGalleryUrl(data.gallery.images?.[0]) || ''}
          shareTitle={data.meta.title}
          shareDescription={data.meta.description}
          templateType="our"
        />
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

export default function ClassicEditorPage() {
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
        <ClassicEditorContent />
      </Suspense>
    </ErrorBoundary>
  )
}
