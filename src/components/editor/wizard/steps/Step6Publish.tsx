'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useEditorStore } from '@/store/editorStore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Link2, Megaphone, Smartphone, Gem, Check, X, Send } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import GuestShareNotice from '@/components/editor/GuestShareNotice'

interface Step6PublishProps {
  invitationId?: string | null
  templateId?: string
  slug?: string | null
  onSave?: () => Promise<void>
  onOpenShareModal?: () => void
  isPaid?: boolean
  onSlugChange?: (newSlug: string) => void | Promise<void>
}

export default function Step6Publish({
  invitationId,
  slug,
  onSave,
  isPaid = false,
  onSlugChange
}: Step6PublishProps) {
  const router = useRouter()
  const { invitation, validateWizardStep } = useEditorStore()

  const [isPublished, setIsPublished] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [copied, setCopied] = useState(false)

  // URL 변경 상태
  const [isEditingSlug, setIsEditingSlug] = useState(false)
  const [customSlug, setCustomSlug] = useState(slug || '')
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle')
  const [slugError, setSlugError] = useState('')
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // 현재 슬러그 (변경된 경우 customSlug, 아니면 기존 slug)
  const currentSlug = customSlug || slug

  // 청첩장 URL
  const invitationUrl = currentSlug
    ? `https://invite.deardrawer.com/i/${currentSlug}`
    : invitationId
    ? `https://invite.deardrawer.com/i/${invitationId}`
    : null

  // 슬러그 유효성 검사
  const validateSlug = (slugValue: string) => {
    if (!slugValue.trim()) return '주소를 입력해주세요'
    if (slugValue.length < 3) return '3자 이상 입력해주세요'
    if (slugValue.length > 30) return '30자 이하로 입력해주세요'
    if (!/^[a-z0-9-]+$/.test(slugValue)) return '영문 소문자, 숫자, 하이픈(-)만 사용 가능합니다'
    if (slugValue.startsWith('-') || slugValue.endsWith('-')) return '하이픈으로 시작하거나 끝날 수 없습니다'
    return ''
  }

  // 실시간 중복 검사
  useEffect(() => {
    if (!isEditingSlug) return
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const error = validateSlug(customSlug)
    if (error || !customSlug.trim()) {
      setSlugStatus('idle')
      return
    }

    // 기존 슬러그와 동일하면 검사 생략
    if (customSlug === slug) {
      setSlugStatus('available')
      return
    }

    setSlugStatus('checking')

    debounceRef.current = setTimeout(async () => {
      try {
        const checkUrl = invitationId
          ? `/api/invitations/check-slug?slug=${customSlug}&excludeId=${invitationId}`
          : `/api/invitations/check-slug?slug=${customSlug}`
        const res = await fetch(checkUrl)
        if (!res.ok) {
          setSlugStatus('idle')
          setSlugError('주소 확인에 실패했습니다. 다시 시도해주세요.')
          return
        }

        const data: { available?: boolean } = await res.json()
        if (data.available) {
          setSlugStatus('available')
          setSlugError('')
        } else {
          setSlugStatus('unavailable')
          setSlugError('이미 사용 중인 주소입니다')
        }
      } catch {
        setSlugStatus('idle')
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [customSlug, isEditingSlug, slug])

  // 슬러그 변경 확정
  const handleSlugSave = async () => {
    const error = validateSlug(customSlug)
    if (error) {
      setSlugError(error)
      return
    }
    if (slugStatus !== 'available') {
      return
    }

    if (onSlugChange && customSlug !== slug) {
      try {
        await onSlugChange(customSlug)
        setIsEditingSlug(false)
      } catch (e) {
        setSlugError(e instanceof Error ? e.message : '주소 변경에 실패했습니다. 다시 시도해주세요.')
      }
    } else {
      setIsEditingSlug(false)
    }
  }

  // 슬러그 변경 취소
  const handleSlugCancel = () => {
    setCustomSlug(slug || '')
    setSlugError('')
    setSlugStatus('idle')
    setIsEditingSlug(false)
  }

  // 발행 핸들러
  const handlePublish = async () => {
    // 모든 스텝 검증
    const allErrors: string[] = []
    for (let step = 1; step <= 5; step++) {
      const result = validateWizardStep(step as 1 | 2 | 3 | 4 | 5)
      if (!result.valid) {
        allErrors.push(...result.errors)
      }
    }

    if (allErrors.length > 0) {
      setValidationErrors(allErrors)
      return
    }

    setIsPublishing(true)
    setPublishError(null)
    setValidationErrors([])

    try {
      if (onSave) {
        await onSave()
      }

      // is_published를 true로 설정 (R2 이미지 공개 접근 허용)
      if (invitationId) {
        await fetch(`/api/invitations/${invitationId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_published: true }),
        })
      }

      setIsPublished(true)
      setShowSuccessModal(true)
    } catch (error) {
      console.error('Publish error:', error)
      setPublishError('발행 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsPublishing(false)
    }
  }

  // 링크 복사
  const handleCopyLink = () => {
    if (invitationUrl) {
      navigator.clipboard.writeText(invitationUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // 카카오톡 공유
  const handleKakaoShare = () => {
    if (!invitationUrl || !invitation) return

    const kakaoWindow = window as typeof window & {
      Kakao?: {
        isInitialized?: () => boolean
        Share?: { sendDefault: (config: object) => void }
      }
    }

    if (typeof window !== 'undefined' && kakaoWindow.Kakao?.Share && kakaoWindow.Kakao.isInitialized?.()) {
      // 이미지 URL을 절대 경로로 변환
      const productionUrl = 'https://invite.deardrawer.com'
      const inv = invitation as unknown as Record<string, Record<string, string>>
      const rawImage = inv.meta?.kakaoThumbnail || inv.meta?.ogImage || null
      const coverImage = rawImage || invitation.media?.coverImage
      let imageUrl = `${productionUrl}/og-image.png`
      if (coverImage) {
        if (coverImage.startsWith('https://')) {
          imageUrl = coverImage
        } else if (coverImage.startsWith('/uploads/') || coverImage.startsWith('/api/r2/') || coverImage.startsWith('/sample/')) {
          imageUrl = `${productionUrl}${coverImage}`
        }
      }

      const kakaoRatioSizes: Record<string, { w: number; h: number }> = { '3:4': { w: 900, h: 1200 }, '1:1': { w: 800, h: 800 }, '3:2': { w: 1200, h: 800 } }
      const kakaoImgSize = kakaoRatioSizes[inv.meta?.kakaoThumbnailRatio || '1:1']

      kakaoWindow.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: `${invitation.groom.name || '신랑'} ❤️ ${invitation.bride.name || '신부'}의 결혼식`,
          description: '모바일 청첩장이 도착했습니다',
          imageUrl,
          imageWidth: kakaoImgSize.w,
          imageHeight: kakaoImgSize.h,
          link: { mobileWebUrl: invitationUrl, webUrl: invitationUrl },
        },
        buttons: [{ title: '청첩장 보기', link: { mobileWebUrl: invitationUrl, webUrl: invitationUrl } }],
      })
    } else {
      navigator.clipboard.writeText(invitationUrl)
      alert('카카오톡 공유를 사용할 수 없어 링크가 복사되었습니다.')
    }
  }

  // 모달 닫기 → /my-invitations 이동
  const handleCloseModal = () => {
    setShowSuccessModal(false)
    router.push('/my-invitations')
  }

  // 워터마크 제거 (결제 페이지로 - 새 창)
  const handleRemoveWatermark = () => {
    if (invitationId) {
      const tid = invitation?.templateId || ''
      window.open(`/dashboard/payment?invitationId=${invitationId}&templateId=${tid}`, '_blank')
    }
  }

  if (!invitation) return null

  return (
    <div className="p-6 space-y-8">
      {/* 안내 */}
      <div className="space-y-1">
        <p className="text-base font-medium" style={{ color: 'var(--ed-text)' }}>
          거의 다 왔어요!
        </p>
        <p className="text-sm" style={{ color: 'var(--ed-text-muted)' }}>
          청첩장을 발행하면 바로 공유할 수 있어요.
        </p>
      </div>

      {/* 청첩장 주소 표시 */}
      {invitationUrl && (
        <section className="space-y-4">
          <h3 className="text-base font-semibold" style={{ color: 'var(--ed-text)' }}>
            청첩장 주소
          </h3>

          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            {isEditingSlug ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    주소 변경
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      invite.deardrawer.com/i/
                    </span>
                    <Input
                      value={customSlug}
                      onChange={(e) => {
                        setCustomSlug(e.target.value.toLowerCase())
                        setSlugError('')
                      }}
                      placeholder="my-wedding"
                      className="flex-1 text-sm"
                    />
                  </div>
                  {slugStatus === 'checking' && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <span className="inline-block w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                      확인 중...
                    </p>
                  )}
                  {slugStatus === 'available' && !slugError && customSlug && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <Check className="w-3 h-3" strokeWidth={2} />
                      사용할 수 있는 주소입니다
                    </p>
                  )}
                  {slugStatus === 'unavailable' && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <X className="w-3 h-3" strokeWidth={2} />
                      이미 사용 중인 주소입니다
                    </p>
                  )}
                  {slugError && (
                    <p className="text-xs text-red-500 mt-1">{slugError}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    영문 소문자, 숫자, 하이픈(-)만 사용 가능 (3~30자)
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSlugCancel}
                    className="flex-1"
                  >
                    취소
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSlugSave}
                    disabled={slugStatus === 'checking' || slugStatus === 'unavailable' || !customSlug}
                    className="flex-1"
                  >
                    저장
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Input
                    value={invitationUrl}
                    readOnly
                    className="font-mono text-sm bg-white"
                  />
                  <Button
                    variant="outline"
                    onClick={handleCopyLink}
                  >
                    {copied ? '복사됨!' : '복사'}
                  </Button>
                </div>
                {!isPublished && (
                  <button
                    onClick={() => setIsEditingSlug(true)}
                    className="text-xs text-stone-500 hover:text-stone-700"
                  >
                    주소 변경하기
                  </button>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {/* 공개 설정 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold" style={{ color: 'var(--ed-text)' }}>
          공개 설정
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">공개</p>
              <p className="text-sm text-gray-500">링크를 가진 모든 사람이 볼 수 있습니다.</p>
            </div>
            <Switch
              checked={true}
              disabled={isPublished}
            />
          </div>
        </div>
      </section>

      {/* 결혼식 한 조각 · 하객 사진 공유 → 결제 후 '내 서랍'에서 설정 (에디터엔 안내만) */}
      <GuestShareNotice />

      {/* 검증 에러 표시 */}
      {validationErrors.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-800 mb-2">다음 항목을 확인해주세요:</p>
          <ul className="text-sm text-red-700 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 발행 에러 */}
      {publishError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{publishError}</p>
        </div>
      )}

      {/* 발행 버튼 */}
      <Button
        onClick={handlePublish}
        disabled={isPublishing || isPublished}
        className="w-full h-14 text-lg font-semibold text-white"
        style={{ background: 'var(--ed-accent)' }}
      >
        {isPublishing ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>발행 중...</span>
          </div>
        ) : isPublished ? (
          <span className="flex items-center gap-2">
            <Check className="w-5 h-5" strokeWidth={2} />
            발행 완료
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Send className="w-5 h-5" strokeWidth={1.75} />
            청첩장 발행하기
          </span>
        )}
      </Button>

      {/* 도움말 */}
      <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600 space-y-2">
        <p className="font-medium text-gray-900">알려드립니다</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>발행 후에도 청첩장 내용은 수정할 수 있습니다.</li>
          <li>카카오톡, 문자 메시지로 쉽게 공유할 수 있습니다.</li>
        </ul>
      </div>

      {/* 발행 완료 모달 */}
      <Dialog open={showSuccessModal} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogTitle className="sr-only">발행 완료</DialogTitle>
          {/* 축하 헤더 */}
          <div className="text-center pt-2 pb-4">
            <div className="mb-3 animate-bounce flex justify-center">
              <Megaphone className="w-16 h-16" strokeWidth={1.5} style={{ color: 'var(--ed-accent)' }} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">축하합니다!</h2>
            <p className="text-sm text-gray-600">청첩장이 발행되었습니다</p>
          </div>

          {/* 공유 링크 */}
          {invitationUrl && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.75} />
                공유 링크
              </p>
              <div className="flex items-center gap-2">
                <Input
                  value={invitationUrl}
                  readOnly
                  className="font-mono text-xs bg-gray-50"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? '완료!' : '복사'}
                </Button>
              </div>
            </div>
          )}

          {/* 액션 버튼들 */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {/* 미리보기 */}
            <button
              onClick={() => invitationUrl && window.open(invitationUrl, '_blank')}
              className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Smartphone className="w-8 h-8 text-gray-900" strokeWidth={1.5} />
              <span className="text-sm font-medium text-gray-700">미리보기</span>
            </button>

            {/* 카카오톡 공유 */}
            <button
              onClick={handleKakaoShare}
              className="flex flex-col items-center gap-2 p-4 bg-yellow-50 hover:bg-yellow-100 rounded-xl transition-colors"
            >
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="#3C1E1E">
                <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.643 1.765 4.966 4.412 6.286l-.893 3.27a.3.3 0 00.455.334l3.862-2.552c.67.097 1.357.148 2.055.148 5.523 0 10-3.463 10-7.777C22 6.463 17.523 3 12 3z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">카카오톡</span>
            </button>
          </div>

          {/* 워터마크 안내 (미결제 시) */}
          {!isPaid && (
            <div className="mt-4 p-4 rounded-xl" style={{ background: 'var(--ed-surface-2)', border: '1px solid var(--ed-border)' }}>
              <div className="flex items-start gap-3">
                <Gem className="w-6 h-6 flex-shrink-0 mt-0.5" strokeWidth={1.5} style={{ color: 'var(--ed-accent)' }} />
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--ed-text)' }}>워터마크 제거</p>
                  <p className="text-xs mb-3" style={{ color: 'var(--ed-text-muted)' }}>
                    결제 후 워터마크가 제거된 깔끔한 청첩장을 공유하세요
                  </p>
                  <Button
                    onClick={handleRemoveWatermark}
                    size="sm"
                    className="w-full text-white"
                    style={{ background: 'var(--ed-accent)' }}
                  >
                    워터마크 제거하기
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 하단 버튼 */}
          <Button
            onClick={handleCloseModal}
            variant="outline"
            className="w-full mt-4"
          >
            내 청첩장 목록으로 이동
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
