'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import { getTemplateById } from '@/lib/templates'
import { Button } from '@/components/ui/button'
import { useEditorStore } from '@/store/editorStore'
import EditPanel from '@/components/editor/EditPanel'
import Preview from '@/components/editor/Preview'
import ShareModal from '@/components/share/ShareModal'
import IntroSelector from '@/components/editor/IntroSelector'
import IntroPreview from '@/components/editor/IntroPreview'

function EditorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, status } = useAuth()
  const editId = searchParams.get('id') // 기존 청첩장 편집용 ID
  const templateId = searchParams.get('template') || 'narrative-our'
  const urlTemplate = getTemplateById(templateId)

  const { invitation, template, initInvitation, updateMultipleFields, isDirty, isSaving, setSaving, resetDirty } = useEditorStore()

  // editId가 있으면 store의 template 사용, 없으면 URL의 template 사용
  const activeTemplate = editId ? template : urlTemplate

  const [invitationId, setInvitationId] = useState<string | null>(editId)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isIntroSelectorOpen, setIsIntroSelectorOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(!!editId)
  const [loadAttempted, setLoadAttempted] = useState(false)

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
        .then(res => res.json())
        .then(data => {
          if (data.invitation) {
            const inv = data.invitation
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

  useEffect(() => {
    if (urlTemplate && !invitation && !editId) {
      initInvitation(urlTemplate)
    }
  }, [urlTemplate, invitation, initInvitation, editId])

  // Save invitation to database
  const handleSave = async () => {
    if (!invitation || !user) {
      alert('저장하려면 로그인이 필요합니다.')
      router.push('/login')
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

      const payload = {
        template_id: templateId,
        groom_name: invitation.groom.name,
        bride_name: invitation.bride.name,
        wedding_date: invitation.wedding.date,
        wedding_time: invitation.wedding.timeDisplay,
        venue_name: invitation.wedding.venue.name,
        venue_address: invitation.wedding.venue.address,
        venue_hall: invitation.wedding.venue.hall,
        content: JSON.stringify(cleanInvitation),
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
      alert('저장되었습니다!')
    } catch (error) {
      console.error('Save error:', error)
      alert(error instanceof Error ? error.message : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // Open preview in new tab
  const handlePreview = () => {
    if (invitationId) {
      window.open(`/invitation/${invitationId}`, '_blank')
    } else {
      alert('미리보기를 보려면 먼저 저장해주세요.')
    }
  }

  // Copy link to clipboard
  const handleCopyLink = async () => {
    if (!invitationId) {
      alert('링크를 복사하려면 먼저 저장해주세요.')
      return
    }
    const link = `${window.location.origin}/invitation/${invitationId}`
    try {
      await navigator.clipboard.writeText(link)
      alert('링크가 복사되었습니다!')
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = link
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert('링크가 복사되었습니다!')
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
      <header className="h-14 border-b border-gray-100 bg-white flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-base font-light tracking-wider text-black uppercase">
            dear drawer
          </Link>
          <div className="h-4 w-px bg-gray-200" />
          <span className="text-sm text-gray-400 font-light tracking-wide">
            {activeTemplate?.name || 'Loading...'}
            {isDirty && <span className="ml-2 text-gray-600">• Unsaved</span>}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
            className="border-gray-200 text-gray-600 hover:bg-gray-50 rounded-none text-xs tracking-wide"
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
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="border-gray-200 text-gray-600 hover:bg-gray-50 rounded-none text-xs tracking-wide"
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
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            Copy Link
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="border-gray-200 text-gray-600 hover:bg-gray-50 rounded-none text-xs tracking-wide"
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
            Share
          </Button>
          <Button
            size="sm"
            disabled={isSaving}
            onClick={handleSave}
            className="bg-black text-white hover:bg-gray-800 rounded-none text-xs tracking-wide"
          >
            {isSaving ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Saving
              </>
            ) : (
              <>
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
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  />
                </svg>
                Save
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {isIntroSelectorOpen ? (
          <>
            {/* 인트로 선택 패널 - 40% */}
            <div className="w-2/5 min-w-[400px] max-w-[500px] border-r overflow-y-auto">
              <IntroSelector onBack={() => setIsIntroSelectorOpen(false)} />
            </div>

            {/* 인트로 미리보기 - 60% */}
            <div className="flex-1 bg-gray-900 flex items-center justify-center p-8">
              <div className="relative w-full max-w-[375px] h-[667px] bg-black rounded-[40px] overflow-hidden shadow-2xl">
                {/* 인트로 미리보기 - 전체 영역 사용 */}
                <div className="w-full h-full">
                  <IntroPreview
                    settings={invitation.intro}
                    coverImage={invitation.media.coverImage}
                    autoPlay={true}
                  />
                </div>
                {/* 폰 노치 - 콘텐츠 위에 오버레이 */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[30px] bg-black rounded-b-2xl z-50" />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Edit Panel - 40% */}
            <div className="w-2/5 min-w-[400px] max-w-[500px]">
              <EditPanel onOpenIntroSelector={() => setIsIntroSelectorOpen(true)} />
            </div>

            {/* Preview - 60% */}
            <div className="flex-1">
              <Preview />
            </div>
          </>
        )}
      </div>

      {/* Share Modal */}
      {invitationId && (
        <ShareModal
          open={isShareModalOpen}
          onOpenChange={setIsShareModalOpen}
          invitationId={invitationId}
          groomName={invitation.groom.name}
          brideName={invitation.bride.name}
          weddingDate={invitation.wedding.date}
        />
      )}
    </div>
  )
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-white">
          <div className="animate-spin rounded-full h-6 w-6 border border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <EditorContent />
    </Suspense>
  )
}
