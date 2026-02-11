'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import ParentsPreview from './ParentsPreview'
import ParentsWizardEditor from './wizard/ParentsWizardEditor'
import ShareModal from '@/components/share/ShareModal'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { COLOR_THEMES, type ColorThemeId } from '@/components/parents/types'

// 타임라인 아이템 타입
export interface TimelineItem {
  year: string
  description: string
  imageUrl: string  // 기존 호환성
  image?: {         // 크롭 데이터 포함
    url: string
    cropX: number
    cropY: number
    cropWidth: number
    cropHeight: number
  }
}

// 지하철 노선 정보
export interface SubwayLine {
  line: string
  station: string
  exit: string
}

// 셔틀버스 정보 타입
export interface ShuttleInfo {
  enabled: boolean
  departureDate: string
  departureTime: string
  departureLocation: string
  returnTime: string
  vehicleNumber: string
  notes: string[]
}

// 이미지 크롭 데이터 타입
export interface ImageCropData {
  url: string
  cropX: number      // 크롭 영역 X 시작점 (0~1)
  cropY: number      // 크롭 영역 Y 시작점 (0~1)
  cropWidth: number  // 크롭 영역 너비 (0~1)
  cropHeight: number // 크롭 영역 높이 (0~1)
}

// Parents 에디터용 스토어 타입
export interface ParentsInvitationData {
  // 기본 정보
  id?: string

  // 부모님 정보 (보내는 사람)
  sender: {
    side: 'groom' | 'bride'
    fatherName: string
    motherName: string
    signature: string // "아버지 이○○ · 어머니 김○○ 드림"
  }

  // 신랑신부 정보
  groom: {
    lastName: string  // 성
    firstName: string // 이름
    fatherName: string
    motherName: string
  }
  bride: {
    lastName: string  // 성
    firstName: string // 이름
    fatherName: string
    motherName: string
  }

  // 결혼식 정보
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
      bus: {
        enabled: boolean
        lines: string
        stop: string
      }
      subway: {
        enabled: boolean
        line: string
        station: string
        exit: string
        walk: string
        lines?: SubwayLine[]
      }
      expressBus: {
        enabled: boolean
        route: string
        stop: string
        note: string
        stops?: { stop: string; note: string }[]
      }
      train: {
        enabled: boolean
        line: string
        station: string
        note: string
        stations?: { station: string; note: string }[]
      }
      parking: {
        enabled: boolean
        capacity: string
        free: string
        note: string
      }
      shuttle: {
        enabled: boolean
        location: string
        departureTime: string
        returnTime: string
        note: string
      }
      extraInfoEnabled: boolean
      extraInfoText: string
    }
  }

  // 봉투 설정
  envelope: {
    message: string[] // 봉투 안 메시지
    defaultGreeting: string // 기본 인사말 (게스트 개인화 없을 때)
  }

  // 본문 인사말
  greeting: string

  // 타임라인
  timelineEnabled: boolean
  timeline: TimelineItem[]

  // 메인 이미지 (크롭 정보 포함)
  mainImage: ImageCropData

  // 갤러리 (크롭 정보 포함)
  gallery: {
    images: ImageCropData[]
  }

  // 결혼식 안내
  weddingInfo: {
    enabled: boolean
    // 꽃 답례품
    flowerGift: {
      enabled: boolean
      content: string
    }
    // 화환 안내
    wreath: {
      enabled: boolean
      content: string
    }
    // 화동 안내
    flowerChild: {
      enabled: boolean
      content: string
    }
    // 피로연 안내
    reception: {
      enabled: boolean
      content: string
      venue: string
      datetime: string
    }
    // 포토부스 안내
    photoBooth: {
      enabled: boolean
      content: string
    }
    // 셔틀버스
    shuttle: ShuttleInfo
    // 항목 순서
    itemOrder: string[]
    // 사용자 정의 안내 항목
    customItems?: { id?: string; enabled?: boolean; title?: string; content?: string; emoji?: string }[]
  }

  // 계좌 안내
  accounts: {
    enabled: boolean
    list: {
      name: string
      bank: string
      accountNumber: string
    }[]
  }

  // 유튜브 영상
  youtube?: {
    enabled: boolean
    title: string
    url: string
  }

  // 배경음악
  bgm: {
    enabled: boolean
    url: string
    autoplay: boolean
  }

  // 공유 메타 정보
  meta: {
    title: string
    description: string
    kakaoThumbnail: string | ImageCropData
    ogImage: string
    ogImageSettings?: {
      scale: number
      positionX: number
      positionY: number
      cropX?: number
      cropY?: number
      cropWidth?: number
      cropHeight?: number
    }
  }

  // RSVP
  rsvpEnabled?: boolean

  // 디자인
  colorTheme: ColorThemeId
  fontStyle: 'elegant' | 'soft' | 'classic' | 'brush' | 'modern' | 'friendly' | 'ridibatang' | 'gangwon' | 'okticon'
}

const defaultData: ParentsInvitationData = {
  sender: {
    side: 'groom',
    fatherName: '',
    motherName: '',
    signature: '',
  },
  groom: {
    lastName: '',
    firstName: '',
    fatherName: '',
    motherName: '',
  },
  bride: {
    lastName: '',
    firstName: '',
    fatherName: '',
    motherName: '',
  },
  wedding: {
    date: '',
    time: '12:00',
    timeDisplay: '오후 12시',
    venue: {
      name: '',
      hall: '',
      address: '',
    },
    directions: {
      bus: {
        enabled: false,
        lines: '',
        stop: '',
      },
      subway: {
        enabled: false,
        line: '',
        station: '',
        exit: '',
        walk: '',
      },
      expressBus: {
        enabled: false,
        route: '',
        stop: '',
        note: '',
      },
      train: {
        enabled: false,
        line: '',
        station: '',
        note: '',
      },
      parking: {
        enabled: false,
        capacity: '',
        free: '',
        note: '',
      },
      shuttle: {
        enabled: false,
        location: '',
        departureTime: '',
        returnTime: '',
        note: '',
      },
      extraInfoEnabled: false,
      extraInfoText: '',
    },
  },
  envelope: {
    message: [
      '항상 저희 가족',
      '챙겨주셔서 감사합니다',
      '',
      '좋은 사람 만나',
      '결혼하게 되었습니다',
      '',
      '꼭 오셔서',
      '축복해 주세요',
    ],
    defaultGreeting: '소중한 분께',
  },
  greeting: '서로 다른 길을 걸어온 두 사람이\n이제 같은 길을 함께 걸어가려 합니다.\n\n저희의 새로운 시작을\n축복해 주시면 감사하겠습니다.',
  timelineEnabled: true,
  timeline: [
    { year: '', description: '저희가 결혼하던 날', imageUrl: '' },
    { year: '', description: '아이 5살 생일에', imageUrl: '' },
    { year: '', description: '대학 졸업하던 날', imageUrl: '' },
    { year: '', description: '평생의 반쪽을 만나다', imageUrl: '' },
  ],
  mainImage: {
    url: '',
    cropX: 0,
    cropY: 0,
    cropWidth: 1,
    cropHeight: 1,
  },
  gallery: {
    images: [],
  },
  weddingInfo: {
    enabled: true,
    flowerGift: {
      enabled: true,
      content: '예식 후 하객분들께 감사의 마음을 전하기 위해\n계절의 꽃으로 만든 작은 꽃다발을 준비했습니다.\n소중한 발걸음에 대한 감사의 선물로 받아주세요.',
    },
    wreath: {
      enabled: true,
      content: '축하의 마음만으로도 충분히 감사하여\n화환은 정중히 사양하고자 합니다.\n따뜻한 마음으로 축복해주시면 감사하겠습니다.',
    },
    flowerChild: {
      enabled: false,
      content: '예식 중 사랑스러운 화동 입장이 예정되어 있습니다.\n아이들의 소중한 순간도 함께 따뜻하게 지켜봐 주세요.',
    },
    reception: {
      enabled: false,
      content: '피로연 자리를 마련하였습니다.\n\n참석하시어 두 사람의 앞날을\n따뜻한 축복으로 함께해 주시면\n감사하겠습니다.',
      venue: '',
      datetime: '',
    },
    photoBooth: {
      enabled: false,
      content: '소중한 하루를 오래 기억할 수 있도록\n포토부스가 준비되어 있습니다.\n즐거운 추억을 사진으로 남겨주세요.',
    },
    shuttle: {
      enabled: false,
      departureDate: '',
      departureTime: '',
      departureLocation: '',
      returnTime: '',
      vehicleNumber: '',
      notes: ['원활한 출발을 위해 출발 10분 전까지 도착 부탁드립니다.'],
    },
    itemOrder: ['flowerGift', 'wreath', 'flowerChild', 'reception', 'photoBooth', 'shuttle'],
    customItems: [],
  },
  accounts: {
    enabled: true,
    list: [
      { name: '', bank: '', accountNumber: '' },
    ],
  },
  bgm: {
    enabled: false,
    url: '',
    autoplay: false,
  },
  meta: {
    title: '',
    description: '',
    kakaoThumbnail: '',
    ogImage: '',
  },
  colorTheme: 'burgundy',
  fontStyle: 'elegant',
}

function ParentsEditorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, status } = useAuth()
  const editId = searchParams.get('id')
  const urlSlug = searchParams.get('slug') // 템플릿 시작 시 설정한 커스텀 URL

  const [data, setData] = useState<ParentsInvitationData>(defaultData)
  const [invitationId, setInvitationId] = useState<string | null>(editId)
  const [savedSlug, setSavedSlug] = useState<string | null>(urlSlug || null)
  const [isLoading, setIsLoading] = useState(!!editId)
  const [isSaving, setIsSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
    const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [previewTab, setPreviewTab] = useState<'intro' | 'main'>('intro')
  const [fullscreenTab, setFullscreenTab] = useState<'intro' | 'main'>('intro')
  const [currentWizardStep, setCurrentWizardStep] = useState<number>(1)
  const wizardStepRef = useRef<number>(1) // 스텝 상태 보존용
  const [selectedGuest, setSelectedGuest] = useState<{ name: string; honorific: string; relation?: string; custom_message?: string } | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor')
  const [activeSection, setActiveSection] = useState<string | null>(null)
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
  const updateData = (updates: Partial<ParentsInvitationData>) => {
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
    const groomName = `${data.groom.lastName}${data.groom.firstName}`.trim()
    const brideName = `${data.bride.lastName}${data.bride.firstName}`.trim()
    if (!groomName || !brideName) {
      const msg = '신랑/신부 이름을 모두 입력해주세요.'
      if (!silent) alert(msg)
      throw new Error(msg)
    }

    // 카카오톡 공유 썸네일 필수 검증
    const kakaoThumb = data.meta?.kakaoThumbnail
    const kakaoThumbUrl = typeof kakaoThumb === 'string' ? kakaoThumb : kakaoThumb?.url
    if (!kakaoThumbUrl?.trim()) {
      const msg = '카카오톡 공유 썸네일을 추가해주세요.'
      if (!silent) alert(msg)
      throw new Error(msg)
    }

    setIsSaving(true)

    try {
      const payload: Record<string, unknown> = {
        template_id: 'narrative-parents',
        groom_name: `${data.groom.lastName}${data.groom.firstName}`,
        bride_name: `${data.bride.lastName}${data.bride.firstName}`,
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
        window.history.replaceState({}, '', `/editor/parents?id=${result.invitation.id}`)
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
      alert('슬러그를 변경하려면 먼저 저장해주세요.')
      return
    }

    try {
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
      alert('주소가 변경되었습니다!')
    } catch (error) {
      console.error('Slug update error:', error)
      alert(error instanceof Error ? error.message : '주소 변경에 실패했습니다.')
    }
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
            혼주용 청첩장
            {isDirty && <span className="ml-2 text-gray-600">• 미저장</span>}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 미리보기 버튼 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setFullscreenTab('intro'); setIsPreviewOpen(true); }}
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
      <div id="parents-editor-scroll-container" className="flex-1 overflow-y-scroll bg-white">
        <div className="w-full max-w-7xl mx-auto">
          <div className="bg-white flex">
            {/* Preview - 왼쪽 sticky 고정, 세로 중앙 (데스크탑) */}
            {!isMobile && (
              <div className="w-[450px] min-w-[450px] sticky top-0 h-[calc(100vh-56px)] overflow-hidden bg-gray-50 flex flex-col justify-center items-center p-6">
                {/* 탭 버튼 - 봉투(2), 본문(3) 단계에서는 숨김 */}
                {(() => {
                  const currentTheme = COLOR_THEMES[data.colorTheme || 'burgundy']
                  const showTabs = currentWizardStep !== 2 && currentWizardStep !== 3
                  return (
                    <>
                      {showTabs && (
                        <div className="flex mb-4 bg-white rounded-lg shadow-sm overflow-hidden">
                          <button
                            onClick={() => setPreviewTab('intro')}
                            className="px-6 py-2.5 text-sm font-medium transition-colors"
                            style={{
                              backgroundColor: previewTab === 'intro' ? currentTheme.primary : 'transparent',
                              color: previewTab === 'intro' ? 'white' : '#4B5563',
                            }}
                          >
                            인트로 (봉투)
                          </button>
                          <button
                            onClick={() => setPreviewTab('main')}
                            className="px-6 py-2.5 text-sm font-medium transition-colors"
                            style={{
                              backgroundColor: previewTab === 'main' ? currentTheme.primary : 'transparent',
                              color: previewTab === 'main' ? 'white' : '#4B5563',
                            }}
                          >
                            본문
                          </button>
                        </div>
                      )}

                      {/* 미리보기 영역 - 390px 기준 콘텐츠를 0.8 스케일로 축소 (312px/390px) */}
                      <div
                        className="relative w-full max-w-[320px] aspect-[9/19] rounded-[40px] overflow-hidden shadow-2xl transition-colors duration-300"
                        style={{ backgroundColor: currentTheme.primary }}
                      >
                        <div
                          className="absolute overflow-hidden rounded-[32px] bg-white"
                          style={{
                            top: '4px',
                            left: '4px',
                            width: '390px',
                            height: '834px', // 390 * 19/9 ≈ 823, 여유분 포함
                            transform: 'scale(0.8)',
                            transformOrigin: 'top left',
                          }}
                        >
                          <ParentsPreview data={data} activeTab={previewTab} onTabChange={setPreviewTab} selectedGuest={selectedGuest} activeSection={activeSection} />
                        </div>
                      </div>
                    </>
                  )
                })()}
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
            {isMobile && mobileView === 'preview' && (() => {
              const currentTheme = COLOR_THEMES[data.colorTheme || 'burgundy']
              return (
                <div className="w-full flex flex-col items-center py-4" style={{ minHeight: 'calc(100vh - 104px)' }}>
                  {/* 탭 버튼 */}
                  <div className="flex mb-4 bg-white rounded-lg shadow-sm overflow-hidden">
                    <button
                      onClick={() => setPreviewTab('intro')}
                      className="px-6 py-2.5 text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: previewTab === 'intro' ? currentTheme.primary : 'transparent',
                        color: previewTab === 'intro' ? 'white' : '#4B5563',
                      }}
                    >
                      인트로 (봉투)
                    </button>
                    <button
                      onClick={() => setPreviewTab('main')}
                      className="px-6 py-2.5 text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: previewTab === 'main' ? currentTheme.primary : 'transparent',
                        color: previewTab === 'main' ? 'white' : '#4B5563',
                      }}
                    >
                      본문
                    </button>
                  </div>
                  {/* 미리보기 영역 */}
                  <div
                    className="relative w-full max-w-[320px] aspect-[9/19] rounded-[40px] overflow-hidden shadow-2xl transition-colors duration-300"
                    style={{ backgroundColor: currentTheme.primary }}
                  >
                    <div
                      className="absolute overflow-hidden rounded-[32px] bg-white"
                      style={{
                        top: '4px',
                        left: '4px',
                        width: '390px',
                        height: '834px',
                        transform: 'scale(0.8)',
                        transformOrigin: 'top left',
                      }}
                    >
                      <ParentsPreview data={data} activeTab={previewTab} onTabChange={setPreviewTab} selectedGuest={selectedGuest} activeSection={activeSection} />
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Edit Panel - 오른쪽 (데스크탑) / 전체 (모바일 편집 모드) */}
            {(!isMobile || mobileView === 'editor') && (
              <div className={`${isMobile ? 'w-full' : 'flex-1'} min-h-[calc(100vh-56px)]`} style={isMobile ? { paddingBottom: '56px' } : undefined}>
                <ParentsWizardEditor
                  data={data}
                  updateData={updateData}
                  updateNestedData={updateNestedData}
                  invitationId={invitationId}
                  selectedGuest={selectedGuest}
                  onSelectGuest={setSelectedGuest}
                  setActiveSection={setActiveSection}
                  slug={savedSlug || urlSlug || (invitationId ? invitationId : null)}
                  onSave={() => handleSave(true)}
                  onSlugChange={handleSlugChange}
                  initialStep={wizardStepRef.current as 1 | 2 | 3 | 4 | 5}
                  onStepChange={(step) => {
                    setCurrentWizardStep(step)
                    wizardStepRef.current = step // ref에도 저장하여 리마운트 시 복원
                    // 봉투(2) → 인트로, 본문(3) → 본문
                    if (step === 2) {
                      setPreviewTab('intro')
                    } else if (step === 3) {
                      setPreviewTab('main')
                    }
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

          <div className="relative flex flex-col items-center">
            <div className="w-[375px] bg-gray-900 rounded-[50px] p-3 shadow-2xl border border-gray-700">
              <div className="rounded-[40px] overflow-hidden bg-white relative" style={{ height: '812px' }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[35px] bg-black rounded-b-3xl z-10 pointer-events-none" />
                <ParentsPreview data={data} fullscreen activeTab={fullscreenTab} onTabChange={setFullscreenTab} selectedGuest={selectedGuest} activeSection={activeSection} />
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-300 rounded-full" />
              </div>
            </div>
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
          groomName={`${data.groom.lastName}${data.groom.firstName}`}
          brideName={`${data.bride.lastName}${data.bride.firstName}`}
          weddingDate={data.wedding.date}
          weddingTime={data.wedding.timeDisplay}
          venueName={data.wedding.venue.name}
          venueAddress={data.wedding.venue.address}
          thumbnailUrl={
            (typeof data.meta.kakaoThumbnail === 'string' ? data.meta.kakaoThumbnail : data.meta.kakaoThumbnail?.url) ||
            data.mainImage?.url ||
            data.gallery.images?.[0]?.url ||
            ''
          }
          shareTitle={data.meta.title}
          shareDescription={data.meta.description}
          templateType="parents"
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

export default function ParentsEditorPage() {
  return (
    <ErrorBoundary fallback={<EditorErrorFallback resetError={() => window.location.reload()} />}>
      <Suspense fallback={
        <div className="h-screen flex items-center justify-center bg-white">
          <div className="animate-spin rounded-full h-6 w-6 border border-gray-300 border-t-gray-900" />
        </div>
      }>
        <ParentsEditorContent />
      </Suspense>
    </ErrorBoundary>
  )
}
