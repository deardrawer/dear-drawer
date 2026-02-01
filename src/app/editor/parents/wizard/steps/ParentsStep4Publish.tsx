'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import type { ParentsInvitationData } from '../../page'

interface ParentsStep4PublishProps {
  data: ParentsInvitationData
  updateData: (updates: Partial<ParentsInvitationData>) => void
  updateNestedData: (path: string, value: unknown) => void
  invitationId: string | null
  onPublish?: (slug: string) => Promise<void>
}

interface SlugCheckResult {
  available: boolean
  slug?: string
  error?: string
  suggestions?: string[]
}

export default function ParentsStep4Publish({
  data,
  updateNestedData,
  invitationId,
  onPublish,
}: ParentsStep4PublishProps) {
  const [slug, setSlug] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [checkResult, setCheckResult] = useState<SlugCheckResult | null>(null)
  const [isApplied, setIsApplied] = useState(false)
  const [isPublished, setIsPublished] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // 슬러그 자동 생성
  useEffect(() => {
    if (!slug && data) {
      const groomName = `${data.groom.lastName}${data.groom.firstName}`.replace(/\s/g, '') || 'groom'
      const brideName = `${data.bride.lastName}${data.bride.firstName}`.replace(/\s/g, '') || 'bride'
      const dateStr = data.wedding.date?.replace(/-/g, '').slice(4) || ''
      const suggestedSlug = `${groomName}-${brideName}${dateStr ? `-${dateStr}` : ''}`
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .slice(0, 50)

      if (suggestedSlug.length >= 3) {
        setSlug(suggestedSlug)
      }
    }
  }, [data, slug])

  // 슬러그 중복 체크
  const checkSlugAvailability = useCallback(async (slugToCheck: string) => {
    if (slugToCheck.length < 3) {
      setCheckResult({ available: false, error: '3자 이상 입력해주세요.' })
      return
    }

    setIsChecking(true)
    try {
      const params = new URLSearchParams({ slug: slugToCheck })
      if (invitationId) {
        params.append('excludeId', invitationId)
      }

      const response = await fetch(`/api/invitations/check-slug?${params}`)
      const result: SlugCheckResult = await response.json()
      setCheckResult(result)
    } catch (error) {
      console.error('Slug check error:', error)
      setCheckResult({ available: false, error: '확인 중 오류가 발생했습니다.' })
    } finally {
      setIsChecking(false)
    }
  }, [invitationId])

  // 슬러그 길이 검증
  useEffect(() => {
    if (slug.length > 0 && slug.length < 3) {
      setCheckResult({ available: false, error: '3자 이상 입력해주세요.' })
    } else if (slug.length === 0) {
      setCheckResult(null)
    }
  }, [slug])

  // 슬러그 입력 핸들러
  const handleSlugChange = (value: string) => {
    const normalized = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-/, '')
      .slice(0, 50)

    setSlug(normalized)
    setCheckResult(null)
    setIsApplied(false)
  }

  // 수동 중복 확인
  const handleCheckSlug = () => {
    if (slug.length >= 3) {
      checkSlugAvailability(slug)
    }
  }

  // 슬러그 적용
  const handleApplySlug = () => {
    if (checkResult?.available && slug.length >= 3) {
      updateNestedData('slug', slug)
      setIsApplied(true)
    }
  }

  // 발행 핸들러
  const handlePublish = async () => {
    const allErrors: string[] = []

    // 필수 필드 검증
    const groomName = `${data.groom.lastName}${data.groom.firstName}`.trim()
    const brideName = `${data.bride.lastName}${data.bride.firstName}`.trim()

    if (!groomName) allErrors.push('신랑 이름을 입력해주세요.')
    if (!brideName) allErrors.push('신부 이름을 입력해주세요.')
    if (!data.wedding.date) allErrors.push('결혼식 날짜를 입력해주세요.')
    if (!data.wedding.venue.name) allErrors.push('예식장 이름을 입력해주세요.')

    // 슬러그 검증
    if (!slug || slug.length < 3) {
      allErrors.push('청첩장 URL을 입력해주세요.')
    } else if (!checkResult?.available) {
      allErrors.push('사용 가능한 URL을 입력해주세요.')
    } else if (!isApplied) {
      allErrors.push('청첩장 URL을 적용해주세요.')
    }

    if (allErrors.length > 0) {
      setValidationErrors(allErrors)
      return
    }

    setIsPublishing(true)
    setPublishError(null)
    setValidationErrors([])

    try {
      if (onPublish) {
        await onPublish(slug)
      }
      setIsPublished(true)
    } catch (error) {
      console.error('Publish error:', error)
      setPublishError('발행 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="p-6 space-y-8">
      {/* 안내 */}
      {!isPublished ? (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-base text-purple-800 font-medium mb-1">거의 다 왔어요!</p>
          <p className="text-sm text-purple-700">
            💡 마지막으로 청첩장 URL을 설정하고 발행해주세요.
          </p>
        </div>
      ) : (
        <div className="p-6 bg-green-50 border border-green-200 rounded-xl text-center">
          <div className="text-4xl mb-3">🎊</div>
          <p className="text-xl text-green-800 font-bold mb-2">청첩장이 발행되었습니다!</p>
          <p className="text-sm text-green-700">
            이제 청첩장을 공유해보세요.
          </p>
        </div>
      )}

      {/* 커스텀 URL 설정 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          🔗 청첩장 주소 설정 <span className="text-red-500">*</span>
        </h3>
        <p className="text-sm text-blue-600">
          💡 청첩장을 공유할 때 사용할 고유 주소를 설정해주세요.<br />
          팁: 신랑신부 이름과 날짜 조합을 추천드려요. 예) minjun-yuna-0321
        </p>

        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-500 whitespace-nowrap">deardrawer.com/i/</span>
            <Input
              autoFocus
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="minjun-yuna-0321"
              className="flex-1 font-mono text-sm"
              disabled={isPublished || isApplied}
            />
          </div>

          {/* 중복확인 / 적용하기 버튼 */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCheckSlug}
              disabled={slug.length < 3 || isChecking || isPublished || isApplied}
              className="flex-1"
            >
              {isChecking ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2" />
                  확인 중...
                </>
              ) : (
                '중복확인'
              )}
            </Button>
            <Button
              type="button"
              onClick={handleApplySlug}
              disabled={!checkResult?.available || isPublished || isApplied}
              className="flex-1 bg-black text-white hover:bg-gray-800"
            >
              {isApplied ? '✓ 적용완료' : '적용하기'}
            </Button>
          </div>

          {/* 검증 결과 표시 */}
          {isChecking ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              <span>확인 중...</span>
            </div>
          ) : checkResult ? (
            <div className={`flex items-center gap-2 text-sm ${
              checkResult.available ? 'text-green-600' : 'text-red-500'
            }`}>
              {checkResult.available ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>사용 가능한 주소입니다</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>{checkResult.error}</span>
                </>
              )}
            </div>
          ) : null}

          {/* 추천 슬러그 */}
          {checkResult?.suggestions && checkResult.suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">추천 주소:</p>
              <div className="flex flex-wrap gap-2">
                {checkResult.suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setSlug(suggestion)}
                    className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 공개 설정 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          🌐 공개 설정
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
      {!isPublished ? (
        <Button
          onClick={handlePublish}
          disabled={isPublishing || !checkResult?.available}
          className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          {isPublishing ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>발행 중...</span>
            </div>
          ) : (
            '✨ 청첩장 발행하기'
          )}
        </Button>
      ) : (
        <div className="space-y-4">
          {/* 발행된 URL 표시 */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <Label className="text-sm text-gray-500 mb-2 block">청첩장 주소</Label>
            <div className="flex items-center gap-2">
              <Input
                value={`https://deardrawer.com/i/${slug}`}
                readOnly
                className="font-mono text-sm bg-white"
              />
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(`https://deardrawer.com/i/${slug}`)
                  alert('주소가 복사되었습니다.')
                }}
              >
                복사
              </Button>
            </div>
          </div>

          {/* 미리보기 버튼 */}
          <Button
            variant="outline"
            onClick={() => window.open(`/i/${slug}`, '_blank')}
            className="w-full"
          >
            🔍 청첩장 미리보기
          </Button>
        </div>
      )}

      {/* 도움말 */}
      <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600 space-y-2">
        <p className="font-medium text-gray-900">알려드립니다</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>발행 후에도 청첩장 내용은 수정할 수 있습니다.</li>
          <li>URL은 한 번 설정하면 변경할 수 없으니 신중하게 결정해주세요.</li>
          <li>카카오톡, 문자 메시지로 쉽게 공유할 수 있습니다.</li>
        </ul>
      </div>
    </div>
  )
}
