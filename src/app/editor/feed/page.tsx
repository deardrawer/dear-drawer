'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import FeedPreview from './FeedPreview'
import FeedWizardEditor from './wizard/FeedWizardEditor'
import ShareModal from '@/components/share/ShareModal'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import type { ImageSettings } from '@/store/editorStore'

// Feed 에디터용 데이터 타입
export interface FeedInvitationData {
  id?: string

  // Display ID (e.g. "mj♥sy")
  displayId: string

  // Gallery preview count in All mode (3 or 6)
  galleryPreviewCount: 3 | 6

  // Couple info
  groom: {
    name: string
    phone: string
    father: { name: string; phone: string; bank: { bank: string; account: string; holder: string; enabled: boolean } }
    mother: { name: string; phone: string; bank: { bank: string; account: string; holder: string; enabled: boolean } }
    bank: { bank: string; account: string; holder: string; enabled: boolean }
    profile: {
      image: string
      images?: string[]
      imageSettings?: ImageSettings
      imageSettingsArray?: ImageSettings[]
      intro: string
      subtitle: string
    }
  }
  bride: {
    name: string
    phone: string
    father: { name: string; phone: string; bank: { bank: string; account: string; holder: string; enabled: boolean } }
    mother: { name: string; phone: string; bank: { bank: string; account: string; holder: string; enabled: boolean } }
    bank: { bank: string; account: string; holder: string; enabled: boolean }
    profile: {
      image: string
      images?: string[]
      imageSettings?: ImageSettings
      imageSettingsArray?: ImageSettings[]
      intro: string
      subtitle: string
    }
  }

  // Wedding info
  wedding: {
    date: string
    time: string
    timeDisplay: string
    venue: {
      name: string
      hall: string
      address: string
    }
    directions: {
      car: string
      publicTransport: string
      train: string
      expressBus: string
      extraInfoEnabled?: boolean
      extraInfoTitle?: string
      extraInfoText?: string
    }
  }

  // Cover & profile
  media: {
    coverImage: string
    coverImages: string[]
    coverImageSettings?: ImageSettings
    coverImageSettingsArray?: ImageSettings[]
    profileAvatar?: string
    profileAvatarSettings?: ImageSettings
  }

  // Greeting (Bio)
  content: {
    greeting: string
    stories: { image: string; imageSettings?: ImageSettings; caption: string }[]
    info: {
      dressCode: { title: string; content: string; enabled: boolean }
      photoShare: { title: string; content: string; buttonText: string; url: string; enabled: boolean }
      photoBooth: { title: string; content: string; enabled: boolean }
      flowerGift: { title: string; content: string; enabled: boolean }
      flowerChild: { title: string; content: string; enabled: boolean }
      wreath: { title: string; content: string; enabled: boolean }
      shuttle: { title: string; content: string; enabled: boolean }
      reception: { title: string; content: string; enabled: boolean }
      customItems: { id: string; emoji?: string; title: string; content: string; enabled: boolean }[]
    }
    thankYou: {
      title: string
      message: string
      caption: string
      sign: string
    }
    guestbookQuestions: string[]
  }

  // Photo rooms
  rooms: {
    title: string
    subtitle: string
    images: string[]
    imageSettings: ImageSettings[]
    galleryPreviewCount?: 3 | 6
  }[]

  // Accounts
  accounts: {
    groom: { bank: string; account: string; holder: string; enabled: boolean }[]
    bride: { bank: string; account: string; holder: string; enabled: boolean }[]
  }

  // Font style
  fontStyle: string

  // YouTube
  youtube: { enabled: boolean; title: string; url: string }

  // BGM
  bgm: { enabled: boolean; url: string; autoplay?: boolean }

  // RSVP
  rsvpEnabled: boolean
  rsvpDeadline: string
  rsvpAllowGuestCount: boolean

  // Section visibility
  sectionVisibility: {
    guestbook: boolean
    guidance: boolean
  }

  // Share meta
  meta: {
    title: string
    description: string
    kakaoThumbnail: string
    kakaoThumbnailSettings?: { scale: number; positionX: number; positionY: number; cropX?: number; cropY?: number; cropWidth?: number; cropHeight?: number }
    ogImage?: string
    ogImageSettings?: { scale: number; positionX: number; positionY: number; cropX?: number; cropY?: number; cropWidth?: number; cropHeight?: number }
  }

  // Slug
  slug?: string
}

const defaultData: FeedInvitationData = {
  displayId: '',
  galleryPreviewCount: 3,
  groom: {
    name: '신랑', phone: '',
    father: { name: '', phone: '', bank: { bank: '', account: '', holder: '', enabled: false } },
    mother: { name: '', phone: '', bank: { bank: '', account: '', holder: '', enabled: false } },
    bank: { bank: '', account: '', holder: '', enabled: false },
    profile: { image: '', intro: '', subtitle: '' },
  },
  bride: {
    name: '신부', phone: '',
    father: { name: '', phone: '', bank: { bank: '', account: '', holder: '', enabled: false } },
    mother: { name: '', phone: '', bank: { bank: '', account: '', holder: '', enabled: false } },
    bank: { bank: '', account: '', holder: '', enabled: false },
    profile: { image: '', intro: '', subtitle: '' },
  },
  wedding: {
    date: '2026-06-20', time: '12:00', timeDisplay: '낮 12시',
    venue: { name: '더채플앳청담', hall: '그랜드볼룸', address: '' },
    directions: { car: '', publicTransport: '', train: '', expressBus: '' },
  },
  media: { coverImage: '', coverImages: [] },
  content: {
    greeting: '소중한 분들을 초대합니다.\n\n서로 다른 두 사람이 만나\n하나의 길을 걸어가려 합니다.\n함께 축복해 주시면 감사하겠습니다.',
    stories: [],
    info: {
      dressCode: { title: '드레스코드 안내', content: '결혼식에 맞는 옷차림을 고민하지 않으셔도 괜찮아요.\n여러분이 가장 좋아하는 옷,\n가장 여러분다운 모습으로 오셔서\n함께 웃고 즐겨주신다면 그걸로 충분합니다.', enabled: false },
      photoShare: { title: '사진 공유', content: '결혼식에서 찍은 사진들을 공유해주세요!\n여러분의 시선으로 담긴 우리의 결혼식,\n소중한 추억으로 간직하겠습니다.', buttonText: '사진 공유하기', url: '', enabled: false },
      photoBooth: { title: '포토부스', content: '소중한 하루를 오래 기억할 수 있도록\n포토부스가 준비되어 있습니다.\n즐거운 추억을 사진으로 남겨주세요.', enabled: false },
      flowerGift: { title: '꽃 답례품 안내', content: '예식 후 하객분들께 감사의 마음을 전하기 위해\n계절의 꽃으로 만든 작은 꽃다발을 준비했습니다.\n소중한 발걸음에 대한 감사의 선물로 받아주세요.', enabled: false },
      flowerChild: { title: '화동 안내', content: '본 예식에는\n소중한 반려견 푸코가 화동으로 함께합니다.\n혹시 강아지를 무서워 하는 분이 계신다면\n너른 마음으로 양해부탁 드리겠습니다.', enabled: false },
      wreath: { title: '화환 안내', content: '마음만 감사히 받겠습니다.\n화환은 정중히 사양하오니\n너른 양해 부탁드립니다.', enabled: false },
      shuttle: { title: '셔틀버스 안내', content: '[출발 일시]\n0000년 0월 0일 (0요일) 오전 00시 00분 출발\n\n[탑승 장소]\n00시 00구 00역 0번 출구 앞\n\n[복귀 일시]\n예식 종료 후 오후 00시 00분 출발 예정', enabled: false },
      reception: { title: '피로연 안내', content: '먼 걸음이 어려우신 분들을 모시고자\n피로연 자리를 마련하였습니다.\n\n참석하시어 두 사람의 앞날을\n따뜻한 축복으로 함께해 주시면\n감사하겠습니다.', enabled: false },
      customItems: [],
    },
    thankYou: { title: 'THANK YOU', message: '소중한 자리에 함께해 주셔서\n진심으로 감사합니다.\n\n여러분의 축하와 응원이\n가장 큰 선물입니다.', caption: '축하해주셔서 감사합니다', sign: '' },
    guestbookQuestions: ['두 사람에게 축하 메시지를 남겨주세요'],
  },
  rooms: [
    { title: 'Studio', subtitle: '', images: [], imageSettings: [] as ImageSettings[], galleryPreviewCount: 3 as 3 | 6 },
    { title: 'Outdoor', subtitle: '', images: [], imageSettings: [] as ImageSettings[], galleryPreviewCount: 3 as 3 | 6 },
    { title: 'Traditional', subtitle: '', images: [], imageSettings: [] as ImageSettings[], galleryPreviewCount: 3 as 3 | 6 },
    { title: 'Casual', subtitle: '', images: [], imageSettings: [] as ImageSettings[], galleryPreviewCount: 3 as 3 | 6 },
  ],
  accounts: { groom: [], bride: [] },
  fontStyle: 'modern',
  youtube: { enabled: false, title: '', url: '' },
  bgm: { enabled: false, url: '', autoplay: true },
  rsvpEnabled: true,
  rsvpDeadline: '',
  rsvpAllowGuestCount: true,
  sectionVisibility: { guestbook: true, guidance: true },
  meta: { title: '', description: '', kakaoThumbnail: '' },
}

function FeedEditorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, status } = useAuth()
  const editId = searchParams.get('id')
  const urlSlug = searchParams.get('slug') // 템플릿 시작 시 설정한 커스텀 URL

  const [data, setData] = useState<FeedInvitationData>(defaultData)
  const [invitationId, setInvitationId] = useState<string | null>(editId)
  const [savedSlug, setSavedSlug] = useState<string | null>(urlSlug || null)
  const [isLoading, setIsLoading] = useState(!!editId)
  const [isSaving, setIsSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [currentWizardStep, setCurrentWizardStep] = useState<number>(1)
  const wizardStepRef = useRef<number>(1) // 스텝 상태 보존용
  const [isMobile, setIsMobile] = useState(false)
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor')
  const [isExitModalOpen, setIsExitModalOpen] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)

  // 나가기 방지 (미저장 변경사항이 있을 때)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = '저장하지 않은 변경사항이 있습니다. 페이지를 떠나시겠습니까?'
        return e.returnValue
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  // 브라우저 뒤로가기 방지
  useEffect(() => {
    if (isDirty) {
      window.history.pushState(null, '', window.location.href)

      const handlePopState = () => {
        window.history.pushState(null, '', window.location.href)
        setIsExitModalOpen(true)
      }

      window.addEventListener('popstate', handlePopState)
      return () => window.removeEventListener('popstate', handlePopState)
    }
  }, [isDirty])

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 기존 청첩장 불러오기
  useEffect(() => {
    if (status === 'loading') return

    if (editId) {
      setIsLoading(true)
      fetch(`/api/invitations/${editId}`)
        .then(async res => await res.json() as { invitation?: { content?: string; template_id?: string; slug?: string } })
        .then((result) => {
          if (result.invitation) {
            // 저장된 slug가 있으면 업데이트
            if (result.invitation.slug) {
              setSavedSlug(result.invitation.slug)
            }
            if (result.invitation.content) {
              try {
                const content = JSON.parse(result.invitation.content)
                setData({ ...defaultData, ...content })
              } catch (e) {
                console.error('Failed to parse content:', e)
              }
            }
          }
        })
        .catch(err => console.error('Failed to load:', err))
        .finally(() => setIsLoading(false))
    }
  }, [editId, status])

  // 데이터 업데이트
  const updateData = (updates: Partial<FeedInvitationData>) => {
    setData(prev => ({ ...prev, ...updates }))
    setIsDirty(true)
  }

  // 중첩 필드 업데이트
  const updateNestedData = (path: string, value: unknown) => {
    setData(prev => {
      const newData = { ...prev }
      const keys = path.split('.')
      let current: Record<string, unknown> = newData

      for (let i = 0; i < keys.length - 1; i++) {
        const child = current[keys[i]]
        // 배열은 배열로 복사, 객체는 객체로 복사
        current[keys[i]] = Array.isArray(child)
          ? [...child]
          : { ...(child as Record<string, unknown>) }
        current = current[keys[i]] as Record<string, unknown>
      }

      current[keys[keys.length - 1]] = value
      return newData
    })
    setIsDirty(true)
  }

  // 저장 (silent: true일 때 alert 표시하지 않고, 에러 시 throw)
  const handleSave = async (silent = false) => {
    if (!user) {
      if (!silent) alert('저장하려면 로그인이 필요합니다.')
      router.push('/login')
      throw new Error('로그인이 필요합니다.')
    }

    // 신랑/신부 이름 필수 검증
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
        template_id: 'narrative-exhibit',
        groom_name: data.groom.name,
        bride_name: data.bride.name,
        wedding_date: data.wedding.date,
        wedding_time: data.wedding.timeDisplay,
        venue_name: data.wedding.venue.name,
        venue_address: data.wedding.venue.address,
        venue_hall: data.wedding.venue.hall,
        content: JSON.stringify(data),
      }

      // 새 청첩장 생성 시 slug 포함
      if (!invitationId && urlSlug) {
        payload.slug = urlSlug
      }

      let response
      if (invitationId) {
        response = await fetch(`/api/invitations/${invitationId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        response = await fetch('/api/invitations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const result = await response.json() as { error?: string; invitation?: { id: string } }

      if (!response.ok) {
        throw new Error(result.error || '저장에 실패했습니다.')
      }

      if (!invitationId && result.invitation?.id) {
        setInvitationId(result.invitation.id)
        // URL 업데이트
        window.history.replaceState({}, '', `/editor/feed?id=${result.invitation.id}`)
      }

      setIsDirty(false)
      if (!silent) alert('저장되었습니다!')
    } catch (error) {
      console.error('Save error:', error)
      if (!silent) alert(error instanceof Error ? error.message : '저장에 실패했습니다.')
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  // Open share modal
  const handleShare = () => {
    if (!invitationId) {
      alert('공유하려면 먼저 저장해주세요.')
      return
    }
    setIsShareModalOpen(true)
  }

  // Slug 변경 핸들러
  const handleSlugChange = async (newSlug: string) => {
    if (!invitationId) {
      throw new Error('저장 후 주소를 변경할 수 있습니다.')
    }

    const response = await fetch(`/api/invitations/${invitationId}/slug`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: newSlug }),
    })

    if (!response.ok) {
      const result = await response.json() as { error?: string }
      throw new Error(result.error || '슬러그 변경에 실패했습니다.')
    }

    setSavedSlug(newSlug)
  }

  if ((editId && isLoading) || status === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-6 w-6 border border-gray-300 border-t-gray-900" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="h-12 sm:h-14 border-b border-gray-100 bg-white flex items-center justify-between px-3 sm:px-6 shrink-0">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/">
            <img src="/logo.png" alt="Dear Drawer" className="h-5 sm:h-6 w-auto" />
          </Link>
          <div className="hidden sm:block h-4 w-px bg-gray-200" />
          <span className="hidden sm:inline text-sm text-gray-400 font-light tracking-wide">
            FEED 청첩장
            {isDirty && <span className="ml-2 text-gray-600">• 미저장</span>}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 미리보기 버튼 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPreviewOpen(true)}
            className="border-gray-200 text-gray-600 hover:bg-gray-50 rounded-none text-xs tracking-wide"
          >
            <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="hidden sm:inline">미리보기</span>
          </Button>
          {/* 데스크탑: 공유 버튼 */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="hidden sm:flex border-gray-200 text-gray-600 hover:bg-gray-50 rounded-none text-xs tracking-wide"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            공유
          </Button>
          <Button
            size="sm"
            disabled={isSaving}
            onClick={() => handleSave()}
            className="bg-black text-white hover:bg-gray-800 rounded-none text-xs tracking-wide"
          >
            {isSaving ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full sm:mr-2" />
                <span className="hidden sm:inline">저장 중</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span className="hidden sm:inline">저장</span>
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main Editor Area - 페이지 레벨 스크롤 */}
      <div id="feed-editor-scroll-container" className="flex-1 overflow-y-scroll bg-white">
        <div className="w-full max-w-7xl mx-auto">
          <div className="bg-white flex">
            {/* Preview - 왼쪽 sticky 고정 (데스크탑) */}
            {!isMobile && (
              <div className="w-[450px] min-w-[450px] sticky top-0 h-[calc(100vh-56px)] overflow-hidden bg-white flex justify-center items-center" style={{ contain: 'layout style', willChange: 'transform' }}>
                <FeedPreview data={data} />
              </div>
            )}

            {/* 구분선 - 부드러운 그라데이션 그림자 (데스크탑) */}
            {!isMobile && (
              <div className="w-8 mx-1 relative">
                <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-gray-100/80 to-transparent" />
                <div className="absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-gray-100/80 to-transparent" />
              </div>
            )}

            {/* 모바일: 미리보기 모드 */}
            {isMobile && mobileView === 'preview' && (
              <div className="w-full flex flex-col items-center" style={{ minHeight: 'calc(100vh - 104px)' }}>
                <FeedPreview data={data} />
              </div>
            )}

            {/* Edit Panel - 오른쪽 (데스크탑) / 전체 (모바일 편집 모드) */}
            {(!isMobile || mobileView === 'editor') && (
              <div className={`${isMobile ? 'w-full' : 'flex-1'} min-h-[calc(100vh-56px)]`} style={isMobile ? { paddingBottom: '56px' } : undefined}>
                <FeedWizardEditor
                  data={data}
                  updateData={updateData}
                  updateNestedData={updateNestedData}
                  invitationId={invitationId}
                  slug={savedSlug || urlSlug || (invitationId ? invitationId : null)}
                  onSave={() => handleSave(true)}
                  onSlugChange={handleSlugChange}
                  initialStep={wizardStepRef.current as 1 | 2 | 3 | 4 | 5 | 6}
                  onStepChange={(step) => {
                    setCurrentWizardStep(step)
                    wizardStepRef.current = step
                  }}
                />
              </div>
            )}
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
            <FeedPreview data={data} />
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
          thumbnailUrl={data.meta.kakaoThumbnail || data.media.coverImage || ''}
          shareTitle={data.meta.title}
          shareDescription={data.meta.description}
          templateType="our"
        />
      )}

      {/* 모바일 하단 탭 바 */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex safe-area-bottom">
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
                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center">
                저장하지 않은 변경사항이 있어요
              </h3>
              <p className="text-sm text-gray-500 text-center mt-2">
                지금 나가면 작업한 내용이 사라집니다.<br />저장하고 나가시겠어요?
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsExitModalOpen(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                계속 편집
              </button>
              <button
                onClick={() => {
                  setIsDirty(false)
                  setIsExitModalOpen(false)
                  if (pendingNavigation) {
                    router.push(pendingNavigation)
                  } else {
                    router.back()
                  }
                }}
                className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                저장 안 함
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EditorErrorFallback({ resetError }: { resetError: () => void }) {
  return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-rose-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-medium text-gray-900 mb-2">에디터 오류</h2>
        <p className="text-gray-600 mb-6">에디터를 불러오는 중 문제가 발생했습니다.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={resetError} className="px-5 py-2.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors">
            다시 시도
          </button>
          <Link href="/">
            <button className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              홈으로
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function FeedEditorPage() {
  return (
    <ErrorBoundary fallback={<EditorErrorFallback resetError={() => window.location.reload()} />}>
      <Suspense fallback={
        <div className="h-screen flex items-center justify-center bg-white">
          <div className="animate-spin rounded-full h-6 w-6 border border-gray-300 border-t-gray-900" />
        </div>
      }>
        <FeedEditorContent />
      </Suspense>
    </ErrorBoundary>
  )
}
