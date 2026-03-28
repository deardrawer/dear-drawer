'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { useThankYouEditorStore } from '@/store/thankYouEditorStore'
import ThankYouPreview from './ThankYouPreview'
import ThankYouWizardEditor from './wizard/ThankYouWizardEditor'
import ShareModal from '@/components/share/ShareModal'
import { ErrorBoundary } from '@/components/ErrorBoundary'

function ThankYouEditorContent() {
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

  const {
    data, fontStyle, accentColor, sealColor, bgm, isDirty, isSaving,
    setIsDirty, setIsSaving, loadFromContent, toSavePayload, reset, wizardStep,
  } = useThankYouEditorStore()
  const fontStyleValue = fontStyle

  const [invitationId, setInvitationId] = useState<string | null>(editId)
  const [savedSlug, setSavedSlug] = useState<string | null>(urlSlug || null)
  const [isLoading, setIsLoading] = useState(!!editId)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor')
  const [isExitModalOpen, setIsExitModalOpen] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)

  // 나가기 방지
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

  // 기존 감사장 불러오기
  useEffect(() => {
    if (status === 'loading') return

    if (editId) {
      setIsLoading(true)
      fetch(`/api/invitations/${editId}`, { headers: getAdminHeaders() })
        .then(async res => await res.json() as { invitation?: { content?: string; template_id?: string; slug?: string } })
        .then((result) => {
          if (result.invitation) {
            if (result.invitation.slug) {
              setSavedSlug(result.invitation.slug)
            }
            if (result.invitation.content) {
              try {
                const content = JSON.parse(result.invitation.content)
                loadFromContent(content)
              } catch (e) {
                console.error('Failed to parse content:', e)
              }
            }
          }
        })
        .catch(err => console.error('Failed to load:', err))
        .finally(() => setIsLoading(false))
    } else {
      // 새 감사장: 스토어 초기화
      reset()
    }
  }, [editId, status, loadFromContent, reset])

  // 저장
  const handleSave = async (silent = false) => {
    if (!user && !isAdminMode) {
      try {
        sessionStorage.setItem('editor_draft_thankyou', toSavePayload())
      } catch { /* ignore */ }
      const currentUrl = window.location.pathname + window.location.search
      router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`)
      throw new Error('로그인이 필요합니다.')
    }

    if (!data.coupleNames.trim()) {
      const msg = '이름을 입력해주세요.'
      if (!silent) alert(msg)
      throw new Error(msg)
    }

    setIsSaving(true)

    try {
      const names = data.coupleNames.split('&').map(n => n.trim())
      const groomName = names[0] || ''
      const brideName = names[1] || ''

      const payload: Record<string, unknown> = {
        template_id: 'narrative-thankyou',
        groom_name: groomName,
        bride_name: brideName,
        wedding_date: data.date,
        content: toSavePayload(),
      }

      if (!invitationId && urlSlug) {
        payload.slug = urlSlug
      }

      let response
      if (invitationId) {
        response = await fetch(`/api/invitations/${invitationId}`, {
          method: 'PUT',
          headers: getAdminHeaders(),
          body: JSON.stringify(payload),
        })
      } else {
        response = await fetch('/api/invitations', {
          method: 'POST',
          headers: getAdminHeaders(),
          body: JSON.stringify(payload),
        })
      }

      const result = await response.json() as { error?: string; invitation?: { id: string } }

      if (!response.ok) {
        throw new Error(result.error || '저장에 실패했습니다.')
      }

      if (!invitationId && result.invitation?.id) {
        setInvitationId(result.invitation.id)
        const adminParam = isAdminMode ? '&admin=true' : ''
        window.history.replaceState({}, '', `/editor/thank-you?id=${result.invitation.id}${adminParam}`)
      }

      setIsDirty(false)

      if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push({
          event: 'invitation_save',
          template_id: 'narrative-thankyou',
          is_new: !invitationId,
        })
      }

      if (!silent) alert('저장되었습니다!')
    } catch (error) {
      console.error('Save error:', error)
      if (!silent) alert(error instanceof Error ? error.message : '저장에 실패했습니다.')
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  const handleShare = () => {
    if (!invitationId) {
      alert('공유하려면 먼저 저장해주세요.')
      return
    }
    setIsShareModalOpen(true)
  }

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

  // 기존 편집 시 로그인 필수 (admin 모드 제외)
  if (status === 'unauthenticated' && editId && !isAdminMode) {
    const currentUrl = window.location.pathname + window.location.search
    router.replace(`/login?redirect=${encodeURIComponent(currentUrl)}`)
    return null
  }

  if (status === 'loading' || (editId && isLoading)) {
    return (
      <div className="h-screen flex items-center justify-center theme-neu">
        <div className="animate-spin rounded-full h-6 w-6 border border-[#A37E69]/30 border-t-[#A37E69]" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col theme-neu">
      {/* Header */}
      <header className="h-12 sm:h-14 editor-header flex items-center justify-between px-3 sm:px-6 shrink-0">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/">
            <img src="/logo.png" alt="Dear Drawer" className="h-5 sm:h-6 w-auto" />
          </Link>
          <div className="hidden sm:block h-4 w-px bg-gray-200" />
          <span className="hidden sm:inline text-sm text-gray-400 font-light tracking-wide">
            모바일 감사장
            {isDirty && <span className="ml-2 text-gray-600">* 미저장</span>}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="hidden sm:flex neu-btn text-gray-600 text-xs tracking-wide"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            공유
          </Button>
          <Button
            size="sm"
            disabled={isSaving}
            onClick={() => handleSave()}
            className="neu-btn-primary rounded-xl text-xs tracking-wide"
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

      {/* Main Editor Area */}
      <div id="thankyou-editor-scroll-container" className="flex-1 overflow-y-scroll editor-scroll-area">
        <div className="w-full max-w-[1400px] mx-auto">
          <div className="flex">
            {/* Preview - 데스크탑 */}
            {!isMobile && (
              <div className="w-[440px] min-w-[440px] sticky top-0 overflow-hidden editor-panel m-4 mr-0 flex flex-col justify-center items-center" style={{ height: 'calc(100vh - 88px)' }}>
                <div className="w-[360px] shadow-2xl bg-white overflow-hidden border border-gray-200" style={{ height: '710px' }}>
                  <ThankYouPreview data={data} fontStyle={fontStyleValue} accentColor={accentColor} sealColor={sealColor} wizardStep={wizardStep} />
                </div>
              </div>
            )}

            {/* 모바일: 미리보기 모드 */}
            {isMobile && mobileView === 'preview' && (
              <div className="w-full flex flex-col justify-center items-center py-8" style={{ minHeight: 'calc(100vh - 104px)' }}>
                <div className="w-[320px] shadow-2xl bg-white overflow-hidden border border-gray-200" style={{ height: '630px' }}>
                  <ThankYouPreview data={data} fontStyle={fontStyleValue} accentColor={accentColor} sealColor={sealColor} wizardStep={wizardStep} />
                </div>
              </div>
            )}

            {/* Edit Panel */}
            {(!isMobile || mobileView === 'editor') && (
              <div className={`${isMobile ? 'w-full' : 'flex-1 flex flex-col overflow-hidden editor-panel m-4'}`} style={isMobile ? { paddingBottom: '56px' } : { height: 'calc(100vh - 88px)' }}>
                <ThankYouWizardEditor
                  invitationId={invitationId}
                  slug={savedSlug || urlSlug || (invitationId ? invitationId : null)}
                  onSave={() => handleSave(true)}
                  onSlugChange={handleSlugChange}
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
                <ThankYouPreview data={data} fontStyle={fontStyleValue} accentColor={accentColor} sealColor={sealColor} wizardStep={wizardStep} />
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
          groomName={data.coupleNames.split('&')[0]?.trim() || ''}
          brideName={data.coupleNames.split('&')[1]?.trim() || ''}
          weddingDate={data.date}
          thumbnailUrl={data.heroImage || ''}
          shareTitle={`${data.coupleNames} 감사장`}
          shareDescription="결혼식에 와주셔서 감사합니다"
          templateType="thankyou"
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
                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center">저장하지 않은 변경사항이 있어요</h3>
              <p className="text-sm text-gray-500 text-center mt-2">지금 나가면 작업한 내용이 사라집니다.<br />저장하고 나가시겠어요?</p>
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
          <button onClick={resetError} className="px-5 py-2.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors">다시 시도</button>
          <Link href="/"><button className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">홈으로</button></Link>
        </div>
      </div>
    </div>
  )
}

export default function ThankYouEditorPage() {
  return (
    <ErrorBoundary fallback={<EditorErrorFallback resetError={() => window.location.reload()} />}>
      <Suspense fallback={
        <div className="h-screen flex items-center justify-center bg-white">
          <div className="animate-spin rounded-full h-6 w-6 border border-gray-300 border-t-gray-900" />
        </div>
      }>
        <ThankYouEditorContent />
      </Suspense>
    </ErrorBoundary>
  )
}
