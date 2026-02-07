'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/components/providers/AuthProvider'
import { getTemplateById } from '@/lib/templates'
import { Button } from '@/components/ui/button'
import { useEditorStore } from '@/store/editorStore'
import WizardEditor from '@/components/editor/wizard/WizardEditor'
import Preview from '@/components/editor/Preview'
import ShareModal from '@/components/share/ShareModal'
import IntroSelector from '@/components/editor/IntroSelector'
import IntroPreview from '@/components/editor/IntroPreview'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AIStoryGenerator } from '@/components/ai-story'
import { GeneratedContent } from '@/types/ai-generator'

function EditorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, status } = useAuth()
  const editId = searchParams.get('id') // 기존 청첩장 편집용 ID
  const templateId = searchParams.get('template') || 'narrative-our'
  const urlSlug = searchParams.get('slug') // 템플릿 시작 시 설정한 커스텀 URL
  const urlTemplate = getTemplateById(templateId)

  const { invitation, template, initInvitation, updateMultipleFields, updateNestedField, toggleSectionVisibility, isDirty, isSaving, setSaving, resetDirty, markStepsSaved, setWizardStep } = useEditorStore()
  const initialStep = searchParams.get('step') // URL에서 시작 스텝 파라미터

  // editId가 있으면 store의 template 사용, 없으면 URL의 template 사용
  const activeTemplate = editId ? template : urlTemplate

  const [invitationId, setInvitationId] = useState<string | null>(editId)
  const [savedSlug, setSavedSlug] = useState<string | null>(urlSlug || null)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isIntroSelectorOpen, setIsIntroSelectorOpen] = useState(false)
  const [isAIStoryGeneratorOpen, setIsAIStoryGeneratorOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(!!editId)
  const [loadAttempted, setLoadAttempted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isExitModalOpen, setIsExitModalOpen] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  const previewRef = useRef<{ scrollToTop: () => void } | null>(null)

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
      // 히스토리에 현재 상태 추가 (뒤로가기 방지용)
      window.history.pushState(null, '', window.location.href)

      const handlePopState = () => {
        // 뒤로가기 시 모달 표시
        window.history.pushState(null, '', window.location.href)
        setPendingNavigation('/')
        setIsExitModalOpen(true)
      }

      window.addEventListener('popstate', handlePopState)
      return () => window.removeEventListener('popstate', handlePopState)
    }
  }, [isDirty])

  // 내부 링크 나가기 처리
  const handleNavigate = (path: string) => {
    if (isDirty) {
      setPendingNavigation(path)
      setIsExitModalOpen(true)
    } else {
      router.push(path)
    }
  }

  // 저장 후 나가기
  const handleSaveAndExit = async () => {
    await handleSave()
    if (pendingNavigation) {
      router.push(pendingNavigation)
    }
    setIsExitModalOpen(false)
  }

  // 저장하지 않고 나가기
  const handleExitWithoutSave = () => {
    resetDirty()
    if (pendingNavigation) {
      router.push(pendingNavigation)
    }
    setIsExitModalOpen(false)
  }

  // 기존 청첩장 불러오기
  useEffect(() => {
    // 인증 상태 확인 중이면 대기
    if (status === 'loading') return

    // 이미 로드 시도했으면 스킵
    if (loadAttempted) return

    if (editId) {
      setLoadAttempted(true)

      // 로그인하지 않은 경우에도 청첩장 데이터는 로드 (공개 데이터)
      setIsLoading(true)
      fetch(`/api/invitations/${editId}`)
        .then(async res => await res.json() as { invitation?: { content?: string; template_id?: string; slug?: string } })
        .then((data) => {
          if (data.invitation) {
            const inv = data.invitation
            // 저장된 slug가 있으면 업데이트
            if (inv.slug) {
              setSavedSlug(inv.slug)
            }
            // PARENTS 템플릿이면 parents 에디터로 리다이렉트
            if (inv.template_id === 'narrative-parents' || inv.template_id === 'parents') {
              router.push(`/editor/parents?id=${editId}`)
              return
            }
            // content 필드에서 전체 데이터 파싱
            if (inv.content) {
              try {
                const content = JSON.parse(inv.content)
                const tplId = inv.template_id || templateId
                const tpl = getTemplateById(tplId)
                console.log('Loading invitation:', { tplId, tpl: !!tpl, contentKeys: Object.keys(content) })
                if (tpl) {
                  initInvitation(tpl)
                  // 파싱된 content로 상태 업데이트
                  setTimeout(() => {
                    updateMultipleFields(content)
                    resetDirty()
                  }, 0)
                } else {
                  // 템플릿을 찾지 못한 경우 기본 템플릿 사용
                  console.warn(`Template not found: ${tplId}, using default`)
                  const defaultTpl = getTemplateById('narrative-our')
                  if (defaultTpl) {
                    initInvitation(defaultTpl)
                    setTimeout(() => {
                      updateMultipleFields(content)
                      resetDirty()
                    }, 0)
                  }
                }
              } catch (e) {
                console.error('Failed to parse invitation content:', e)
              }
            }
          } else {
            console.error('No invitation data in response:', data)
          }
        })
        .catch(err => console.error('Failed to load invitation:', err))
        .finally(() => setIsLoading(false))
    }
  }, [editId, status, loadAttempted])

  // 새 청첩장 생성 시 스토어 초기화 (editId가 없을 때)
  const [isNewInvitation] = useState(!editId)

  useEffect(() => {
    // 새 청첩장인 경우 항상 초기화 (이전 데이터 무시)
    if (urlTemplate && isNewInvitation) {
      initInvitation(urlTemplate)
      // URL에 step 파라미터가 있으면 해당 스텝으로 이동
      if (initialStep) {
        const step = parseInt(initialStep, 10)
        if (step >= 1 && step <= 5) {
          setTimeout(() => setWizardStep(step as 1 | 2 | 3 | 4 | 5), 0)
        }
      }
    }
  }, [urlTemplate, isNewInvitation, initInvitation, initialStep, setWizardStep])

  // Save invitation to database
  const handleSave = async () => {
    if (!invitation || !user) {
      alert('저장하려면 로그인이 필요합니다.')
      router.push('/login')
      return
    }

    // 신랑/신부 이름 필수 검증
    if (!invitation.groom.name?.trim() || !invitation.bride.name?.trim()) {
      alert('📋 신랑/신부 이름을 모두 입력해주세요.')
      useEditorStore.getState().setWizardStep(2)  // 인트로 탭으로 이동
      useEditorStore.getState().setValidationError({ tab: 'names', message: '신랑/신부 이름을 입력해주세요.' })
      return
    }

    setSaving(true)

    try {
      // 저장 시 base64 이미지 데이터 제외 (URL만 유지)
      const cleanInvitation = JSON.parse(JSON.stringify(invitation))
      // base64 데이터가 있으면 빈 문자열로 대체 (URL은 http로 시작)
      const cleanImages = (obj: Record<string, unknown>) => {
        for (const key in obj) {
          if (typeof obj[key] === 'string' && (obj[key] as string).startsWith('data:')) {
            obj[key] = '' // base64 데이터 제거
          } else if (Array.isArray(obj[key])) {
            obj[key] = (obj[key] as unknown[]).map(item => {
              if (typeof item === 'string' && item.startsWith('data:')) return ''
              if (typeof item === 'object' && item !== null) cleanImages(item as Record<string, unknown>)
              return item
            })
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            cleanImages(obj[key] as Record<string, unknown>)
          }
        }
      }
      cleanImages(cleanInvitation)

      const payload: Record<string, unknown> = {
        template_id: template?.id || templateId,
        groom_name: invitation.groom.name,
        bride_name: invitation.bride.name,
        wedding_date: invitation.wedding.date,
        wedding_time: invitation.wedding.timeDisplay,
        venue_name: invitation.wedding.venue.name,
        venue_address: invitation.wedding.venue.address,
        venue_hall: invitation.wedding.venue.hall,
        content: JSON.stringify(cleanInvitation),
      }

      // 새 청첩장 생성 시 slug 포함
      if (!invitationId && urlSlug) {
        payload.slug = urlSlug
      }

      let response
      if (invitationId) {
        // Update existing
        response = await fetch(`/api/invitations/${invitationId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        // Create new
        response = await fetch('/api/invitations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const data: { error?: string; invitation?: { id: string } } = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '저장에 실패했습니다.')
      }

      if (!invitationId && data.invitation?.id) {
        setInvitationId(data.invitation.id)
      }

      resetDirty()
      markStepsSaved()  // 현재까지 방문한 스텝을 저장됨으로 표시
      alert('저장되었습니다!')
    } catch (error) {
      console.error('Save error:', error)
      alert(error instanceof Error ? error.message : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // Open preview modal
  const handlePreview = () => {
    if (invitationId) {
      setIsPreviewOpen(true)
    } else {
      alert('미리보기를 보려면 먼저 저장해주세요.')
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

  // AI 스토리 생성기 결과 적용 핸들러
  const handleAIStoryGeneratorApply = (content: GeneratedContent) => {
    // 인사말 적용 제거됨 - 인사말 질문 플로우가 스토리탭에서 제거됨
    // greeting은 Step3에서 별도로 관리됨

    // 감사 인사 적용 (thankYou.message에 적용)
    if (content.thanks) {
      updateNestedField('content.thankYou.message', content.thanks)
    }

    // 신랑 소개 적용
    if (content.groomProfile) {
      updateNestedField('groom.profile.intro', content.groomProfile)
    }

    // 신부 소개 적용
    if (content.brideProfile) {
      updateNestedField('bride.profile.intro', content.brideProfile)
    }

    // 러브스토리 적용
    if (content.story) {
      const stories = []
      if (content.story.first) {
        stories.push({
          date: '',
          title: '연애의 시작',
          desc: content.story.first,
          images: [],
          imageSettings: []
        })
      }
      if (content.story.together) {
        stories.push({
          date: '',
          title: '함께한 시간',
          desc: content.story.together,
          images: [],
          imageSettings: []
        })
      }
      if (content.story.preparation) {
        stories.push({
          date: '',
          title: '결혼 준비',
          desc: content.story.preparation,
          images: [],
          imageSettings: []
        })
      }
      if (stories.length > 0) {
        updateNestedField('relationship.stories', stories)
        // 스토리 섹션 활성화
        if (invitation && !invitation.sectionVisibility.ourStory) {
          toggleSectionVisibility('ourStory')
        }
      }
    }

    // 인터뷰 적용
    if (content.interview && content.interview.length > 0) {
      const interviews = content.interview.map((item, index) => {
        // 신랑/신부 개별 답변이나 공동 답변을 하나의 answer로 합침
        let answer = ''
        if (item.jointAnswer) {
          answer = item.jointAnswer
        } else {
          const parts = []
          if (item.groomAnswer) parts.push(`🤵 ${item.groomAnswer}`)
          if (item.brideAnswer) parts.push(`👰 ${item.brideAnswer}`)
          answer = parts.join('\n\n')
        }

        return {
          question: item.question,
          answer: answer,
          images: [],
          imageSettings: [],
          bgClass: index % 2 === 0 ? 'white-bg' : 'pink-bg'
        }
      })
      updateNestedField('content.interviews', interviews)
      // 인터뷰 섹션 활성화
      if (invitation && !invitation.sectionVisibility.interview) {
        toggleSectionVisibility('interview')
      }
    }

    // 프로필 섹션 활성화
    if (content.groomProfile || content.brideProfile) {
      if (invitation && !invitation.sectionVisibility.coupleProfile) {
        toggleSectionVisibility('coupleProfile')
      }
    }

    // FAMILY 템플릿: 부모님 인사말 적용
    if (content.parentsGreeting) {
      updateNestedField('content.parentsGreeting', content.parentsGreeting)
      // 부모님 인사말 섹션 활성화 (이미 활성화되어 있으면 토글하지 않음)
      if (invitation && !invitation.sectionVisibility.parentsGreeting) {
        toggleSectionVisibility('parentsGreeting')
      }
    }

    // 다이얼로그 닫기
    setIsAIStoryGeneratorOpen(false)
  }

  // 인증 상태 확인 중이거나 기존 청첩장 로딩 중이면 스피너 표시
  if ((editId && isLoading) || (editId && status === 'loading')) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-6 w-6 border border-gray-300 border-t-gray-900" />
      </div>
    )
  }

  if (!activeTemplate && !editId) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-xl font-light text-gray-900 mb-6 tracking-wide">Template not found</h1>
          <Link href="/">
            <Button className="bg-black text-white hover:bg-gray-800 rounded-none text-sm tracking-wide px-6">
              Back to Templates
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!invitation) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-6 w-6 border border-gray-300 border-t-gray-900" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Action Bar */}
      <header className="h-12 sm:h-14 border-b border-gray-100 bg-white flex items-center justify-between px-3 sm:px-6 shrink-0">
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={() => handleNavigate('/')} className="cursor-pointer">
            <img
              src="/logo.png"
              alt="Dear Drawer"
              className="h-5 sm:h-6 w-auto"
            />
          </button>
          {/* 템플릿 타입 배지 - URL 또는 invitation에서 확인 */}
          {(templateId === 'narrative-family' || invitation?.templateId === 'narrative-family') ? (
            <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
              family
            </span>
          ) : (
            <span className="px-2 py-0.5 text-xs font-medium bg-rose-100 text-rose-700 rounded-full">
              our
            </span>
          )}
          <div className="hidden sm:block h-4 w-px bg-gray-200" />
          <span className="hidden sm:inline text-sm text-gray-400 font-light tracking-wide">
            {activeTemplate?.name || 'Loading...'}
            {isDirty && <span className="ml-2 text-gray-600">• 미저장</span>}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 미리보기 버튼 - 항상 표시 */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
            className="border-gray-200 text-gray-600 hover:bg-gray-50 rounded-none text-xs tracking-wide"
          >
            <svg
              className="w-4 h-4 sm:mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span className="hidden sm:inline">미리보기</span>
          </Button>
          {/* 공유 버튼 - 데스크탑에서만 표시 */}
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
            onClick={handleSave}
            className="bg-black text-white hover:bg-gray-800 rounded-none text-xs tracking-wide"
          >
            {isSaving ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full sm:mr-2" />
                <span className="hidden sm:inline">저장 중</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 sm:mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  />
                </svg>
                <span className="hidden sm:inline">저장</span>
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main Editor Area - 페이지 레벨 스크롤 */}
      <div id="editor-scroll-container" className="flex-1 overflow-y-scroll bg-white" style={{ overflowAnchor: 'none' }}>
        <div className="w-full max-w-7xl mx-auto">
          <div className="bg-white flex">
            {isIntroSelectorOpen ? (
              <>
                {/* 인트로 미리보기 - 왼쪽 sticky */}
                {!isMobile && (
                  <div className="w-[480px] min-w-[480px] sticky top-0 h-[calc(100vh-120px)] flex items-center justify-center p-6 bg-white border-r border-gray-100">
                    <div className="relative w-full max-w-[360px] aspect-[9/16] overflow-hidden shadow-lg border border-gray-100 rounded-2xl">
                      <IntroPreview
                        settings={invitation.intro}
                        coverImage={invitation.media.coverImage}
                        coverImageSettings={invitation.media.coverImageSettings}
                        autoPlay={true}
                        weddingDate={invitation.wedding.date}
                        weddingTime={invitation.wedding.time}
                        venueName={invitation.wedding.venue.name}
                      />
                    </div>
                  </div>
                )}

                {/* 인트로 선택 패널 - 오른쪽 */}
                <div className={`${isMobile ? 'w-full' : 'flex-1'}`}>
                  <IntroSelector onBack={() => setIsIntroSelectorOpen(false)} />
                </div>
              </>
            ) : (
              <>
                {/* Preview - 왼쪽 sticky 고정, 세로 중앙 */}
                {!isMobile && (
                  <div className="w-[450px] min-w-[450px] sticky top-0 h-[calc(100vh-120px)] overflow-hidden bg-white flex justify-center items-center" style={{ contain: 'layout style', willChange: 'transform' }}>
                    <Preview ref={previewRef} />
                  </div>
                )}

                {/* 구분선 - 부드러운 그라데이션 그림자 */}
                {!isMobile && (
                  <div className="w-8 mx-1 relative">
                    <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-gray-100/80 to-transparent" />
                    <div className="absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-gray-100/80 to-transparent" />
                  </div>
                )}

                {/* Edit Panel - 오른쪽, 자연스러운 스크롤 */}
                <div className={`${isMobile ? 'w-full' : 'flex-1'} min-h-[calc(100vh-120px)]`}>
                  {/* 모바일 안내 메시지 */}
                  {isMobile && (
                    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center">
                      <p className="text-sm text-amber-800">
                        더 나은 편집 환경을 위해 데스크탑에서 작성해주세요
                      </p>
                    </div>
                  )}
                  <WizardEditor
                    onOpenIntroSelector={() => setIsIntroSelectorOpen(true)}
                    onOpenAIStoryGenerator={() => setIsAIStoryGeneratorOpen(true)}
                    onOpenShareModal={() => setIsShareModalOpen(true)}
                    onScrollPreviewToTop={() => previewRef.current?.scrollToTop()}
                    invitationId={invitationId}
                    templateId={template?.id || templateId}
                    slug={savedSlug || urlSlug || invitationId}
                    onSave={handleSave}
                    isSaving={isSaving}
                    onSlugChange={async (newSlug) => {
                      if (!invitationId) return
                      try {
                        const response = await fetch(`/api/invitations/${invitationId}/slug`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ slug: newSlug }),
                        })
                        if (!response.ok) {
                          const result = await response.json() as { error?: string }
                          alert(result.error || '주소 변경에 실패했습니다.')
                          return
                        }
                        setSavedSlug(newSlug)
                        const url = new URL(window.location.href)
                        url.searchParams.set('slug', newSlug)
                        window.history.replaceState({}, '', url.toString())
                      } catch {
                        alert('주소 변경에 실패했습니다.')
                      }
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {invitationId && (
        <ShareModal
          open={isShareModalOpen}
          onOpenChange={setIsShareModalOpen}
          invitationId={invitationId}
          currentSlug={savedSlug || undefined}
          onSlugChange={setSavedSlug}
          groomName={invitation.groom.name}
          brideName={invitation.bride.name}
          weddingDate={invitation.wedding.date}
          weddingTime={invitation.wedding.timeDisplay || invitation.wedding.time}
          venueName={invitation.wedding.venue.name}
          venueAddress={invitation.wedding.venue.address}
          thumbnailUrl={
            invitation.meta.kakaoThumbnail ||
            invitation.meta.ogImage ||
            invitation.media.coverImage ||
            invitation.gallery.images?.[0] ||
            ''
          }
          shareTitle={invitation.meta.title}
          shareDescription={invitation.meta.description}
          templateType={template?.id === 'narrative-family' ? 'family' : 'our'}
        />
      )}

      {/* AI 스토리 생성기 다이얼로그 - React Portal로 직접 렌더링 */}
      {isAIStoryGeneratorOpen && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 2147483647, // 최대 z-index 값
            isolation: 'isolate',
          }}
        >
          {/* Backdrop */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }}
            onClick={() => setIsAIStoryGeneratorOpen(false)}
          />
          {/* Modal */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <div
              className="relative bg-white rounded-lg shadow-lg max-w-3xl w-full mx-4 h-[85vh] max-h-[85vh] flex flex-col overflow-hidden"
              style={{ pointerEvents: 'auto' }}
            >
              {/* Close button */}
              <button
                onClick={() => setIsAIStoryGeneratorOpen(false)}
                className="absolute top-4 right-4 z-10 p-1 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="sr-only">Close</span>
              </button>
              <div className="flex-1 overflow-hidden">
                <AIStoryGenerator
                  groomName={invitation.groom.name}
                  brideName={invitation.bride.name}
                  invitationId={invitationId || undefined}
                  templateId={template?.id || templateId}
                  onApply={handleAIStoryGeneratorApply}
                  onClose={() => setIsAIStoryGeneratorOpen(false)}
                />
              </div>
            </div>
          </div>
        </div>,
        document.getElementById('modal-root') || document.body
      )}

      {/* Mobile Preview Modal */}
      {isPreviewOpen && invitationId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          {/* Close button */}
          <button
            onClick={() => setIsPreviewOpen(false)}
            className="absolute top-6 right-6 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Open in new tab button */}
          <button
            onClick={() => window.open(`/invitation/${invitationId}`, '_blank')}
            className="absolute top-6 right-20 z-10 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            새 탭에서 열기
          </button>

          {/* Mobile Phone Frame */}
          <div className="relative flex flex-col items-center">
            {/* 상단 안내 문구 - 핸드폰 프레임 바깥 */}
            <div className="mb-4 px-6 py-2.5 bg-yellow-400 text-yellow-900 text-center text-sm font-medium rounded-full">
              이것은 샘플 미리보기입니다. 결제 후 워터마크가 제거됩니다.
            </div>
            {/* Phone outer frame */}
            <div className="w-[375px] bg-gray-900 rounded-[50px] p-3 shadow-2xl border border-gray-700">
              {/* Phone screen */}
              <div className="rounded-[40px] overflow-hidden bg-white relative" style={{ height: '812px' }}>
                {/* Dynamic Island */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[35px] bg-black rounded-b-3xl z-10" />
                {/* Content iframe */}
                <iframe
                  src={`/invitation/${invitationId}?preview=true`}
                  className="w-full h-full border-0"
                  title="Invitation Preview"
                />
                {/* Home indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-300 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 나가기 확인 모달 */}
      {isExitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* 헤더 */}
            <div className="p-6 pb-4">
              <div className="w-12 h-12 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
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

            {/* 버튼 영역 */}
            <div className="p-4 pt-0 flex flex-col gap-2">
              <button
                onClick={handleSaveAndExit}
                disabled={isSaving}
                className="w-full py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {isSaving ? '저장 중...' : '저장하고 나가기'}
              </button>
              <button
                onClick={handleExitWithoutSave}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                저장하지 않고 나가기
              </button>
              <button
                onClick={() => setIsExitModalOpen(false)}
                className="w-full py-3 text-gray-500 font-medium hover:text-gray-700 transition-colors"
              >
                계속 작업하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 에디터 전용 에러 Fallback
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
          <button
            onClick={resetError}
            className="px-5 py-2.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
          >
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

export default function EditorPage() {
  return (
    <ErrorBoundary
      fallback={<EditorErrorFallback resetError={() => window.location.reload()} />}
    >
      <Suspense
        fallback={
          <div className="h-screen flex items-center justify-center bg-white">
            <div className="animate-spin rounded-full h-6 w-6 border border-gray-300 border-t-gray-900" />
          </div>
        }
      >
        <EditorContent />
      </Suspense>
    </ErrorBoundary>
  )
}
