'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { FeedInvitationData } from '../../page'

interface StepProps {
  data: FeedInvitationData
  updateData: (updates: Partial<FeedInvitationData>) => void
  updateNestedData: (path: string, value: unknown) => void
  invitationId: string | null
}

interface FeedStep6PublishProps extends StepProps {
  slug?: string | null
  onSave?: () => Promise<void>
  onSlugChange?: (newSlug: string) => void | Promise<void>
  isPaid?: boolean
}

const inputClass =
  'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black'

export default function FeedStep6Publish({
  data,
  invitationId,
  slug,
  onSave,
  onSlugChange,
  isPaid = false,
}: FeedStep6PublishProps) {
  const router = useRouter()

  const [isPublished, setIsPublished] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [copied, setCopied] = useState(false)

  // URL 변경 상태
  const [isEditingSlug, setIsEditingSlug] = useState(false)
  const [customSlug, setCustomSlug] = useState(slug || '')
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle')
  const [slugError, setSlugError] = useState('')
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const currentSlug = customSlug || slug
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
        const result: { available?: boolean } = await res.json()
        if (result.available) {
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

  const handleSlugSave = async () => {
    const error = validateSlug(customSlug)
    if (error) {
      setSlugError(error)
      return
    }
    if (slugStatus !== 'available') return

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

  const handleSlugCancel = () => {
    setCustomSlug(slug || '')
    setSlugError('')
    setSlugStatus('idle')
    setIsEditingSlug(false)
  }

  const handlePublish = async () => {
    setIsPublishing(true)
    setPublishError(null)

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

  const handleCopyLink = () => {
    if (invitationUrl) {
      navigator.clipboard.writeText(invitationUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleKakaoShare = () => {
    if (!invitationUrl) return

    const kakaoWindow = window as typeof window & {
      Kakao?: {
        isInitialized?: () => boolean
        Share?: { sendDefault: (config: object) => void }
      }
    }

    if (typeof window !== 'undefined' && kakaoWindow.Kakao?.Share && kakaoWindow.Kakao.isInitialized?.()) {
      const productionUrl = 'https://invite.deardrawer.com'
      const rawImage = data.meta?.kakaoThumbnail || null
      const coverImage = rawImage || data.media?.coverImage
      let imageUrl = `${productionUrl}/og-image.png`
      if (coverImage) {
        if (coverImage.startsWith('https://')) {
          imageUrl = coverImage
        } else if (coverImage.startsWith('/uploads/') || coverImage.startsWith('/api/r2/') || coverImage.startsWith('/sample/')) {
          imageUrl = `${productionUrl}${coverImage}`
        }
      }

      const kakaoRatioSizes: Record<string, { w: number; h: number }> = { '3:4': { w: 900, h: 1200 }, '1:1': { w: 800, h: 800 }, '3:2': { w: 1200, h: 800 } }
      const kakaoImgSize = kakaoRatioSizes[data.meta?.kakaoThumbnailRatio || '1:1']

      kakaoWindow.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: `${data.groom.name || '신랑'} ❤️ ${data.bride.name || '신부'}의 결혼식`,
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

  const handleCloseModal = () => {
    setShowSuccessModal(false)
    router.push('/my-invitations')
  }

  const handleRemoveWatermark = () => {
    if (invitationId) {
      window.open(`/dashboard/payment?invitationId=${invitationId}&templateId=narrative-exhibit`, '_blank')
    }
  }

  return (
    <div className="p-6 space-y-8">
      {/* 안내 */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-base text-purple-800 font-medium mb-1">🎉 거의 다 왔어요!</p>
        <p className="text-sm text-purple-700">
          청첩장을 발행하면 바로 공유할 수 있어요.
        </p>
      </div>

      {/* 청첩장 주소 */}
      {invitationUrl && (
        <section className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            🔗 청첩장 주소
          </h3>

          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            {isEditingSlug ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">주소 변경</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 whitespace-nowrap">invite.deardrawer.com/i/</span>
                    <input
                      className={`${inputClass} flex-1`}
                      value={customSlug}
                      onChange={(e) => {
                        setCustomSlug(e.target.value.toLowerCase())
                        setSlugError('')
                      }}
                      placeholder="my-wedding"
                    />
                  </div>
                  {slugStatus === 'checking' && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <span className="inline-block w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                      확인 중...
                    </p>
                  )}
                  {slugStatus === 'available' && !slugError && customSlug && (
                    <p className="text-xs text-green-600 mt-1">✓ 사용할 수 있는 주소입니다</p>
                  )}
                  {slugStatus === 'unavailable' && (
                    <p className="text-xs text-red-500 mt-1">✗ 이미 사용 중인 주소입니다</p>
                  )}
                  {slugError && (
                    <p className="text-xs text-red-500 mt-1">{slugError}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">영문 소문자, 숫자, 하이픈(-)만 사용 가능 (3~30자)</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSlugCancel}
                    className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSlugSave}
                    disabled={slugStatus === 'checking' || slugStatus === 'unavailable' || !customSlug}
                    className="flex-1 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    저장
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <input
                    className={`${inputClass} font-mono bg-white`}
                    value={invitationUrl}
                    readOnly
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
                  >
                    {copied ? '복사됨!' : '복사'}
                  </button>
                </div>
                {!isPublished && (
                  <button
                    onClick={() => setIsEditingSlug(true)}
                    className="text-xs text-blue-600 hover:underline"
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
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          🌐 공개 설정
        </h3>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">공개</p>
            <p className="text-sm text-gray-500">링크를 가진 모든 사람이 볼 수 있습니다.</p>
          </div>
          <button
            type="button"
            disabled={isPublished}
            className="relative w-10 h-5 rounded-full bg-black cursor-default"
            aria-pressed={true}
          >
            <span className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full translate-x-5" />
          </button>
        </div>
      </section>

      {/* 발행 에러 */}
      {publishError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{publishError}</p>
        </div>
      )}

      {/* 발행 버튼 */}
      <button
        onClick={handlePublish}
        disabled={isPublishing || isPublished}
        className="w-full h-14 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPublishing ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            발행 중...
          </span>
        ) : isPublished ? (
          '✓ 발행 완료'
        ) : (
          '✨ 청첩장 발행하기'
        )}
      </button>

      {/* 도움말 */}
      <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600 space-y-2">
        <p className="font-medium text-gray-900">알려드립니다</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>발행 후에도 청첩장 내용은 수정할 수 있습니다.</li>
          <li>카카오톡, 문자 메시지로 쉽게 공유할 수 있습니다.</li>
        </ul>
      </div>

      {/* 발행 완료 모달 */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 w-full shadow-2xl">
            {/* 축하 헤더 */}
            <div className="text-center pt-2 pb-4">
              <div className="text-5xl mb-3 animate-bounce">🎊</div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">축하합니다!</h2>
              <p className="text-sm text-gray-600">청첩장이 발행되었습니다</p>
            </div>

            {/* 공유 링크 */}
            {invitationUrl && (
              <div className="space-y-2 mb-4">
                <p className="text-sm font-medium text-gray-700">🔗 공유 링크</p>
                <div className="flex items-center gap-2">
                  <input
                    className={`${inputClass} font-mono text-xs bg-gray-50`}
                    value={invitationUrl}
                    readOnly
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap shrink-0"
                  >
                    {copied ? '완료!' : '복사'}
                  </button>
                </div>
              </div>
            )}

            {/* 액션 버튼들 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => invitationUrl && window.open(invitationUrl, '_blank')}
                className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <span className="text-2xl">📱</span>
                <span className="text-sm font-medium text-gray-700">미리보기</span>
              </button>
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
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl mb-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl">💎</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-rose-800 mb-1">워터마크 제거</p>
                    <p className="text-xs text-rose-600 mb-3">
                      결제 후 워터마크가 제거된 깔끔한 청첩장을 공유하세요
                    </p>
                    <button
                      onClick={handleRemoveWatermark}
                      className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      워터마크 제거하기
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 하단 버튼 */}
            <button
              onClick={handleCloseModal}
              className="w-full py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              내 청첩장 목록으로 이동
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
