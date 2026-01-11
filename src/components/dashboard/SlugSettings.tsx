'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link2, Check, X, Loader2, Copy, ExternalLink } from 'lucide-react'

interface SlugSettingsProps {
  invitationId: string
}

interface SlugCheckResult {
  available: boolean
  slug?: string
  error?: string
  suggestions?: string[]
  normalizedSlug?: string
}

interface SlugInfoResponse {
  slug: string | null
  isPaid: boolean
  url: string
}

interface SlugSaveResponse {
  success?: boolean
  slug?: string | null
  error?: string
  url?: string
}

export default function SlugSettings({ invitationId }: SlugSettingsProps) {
  const [currentSlug, setCurrentSlug] = useState<string | null>(null)
  const [inputSlug, setInputSlug] = useState('')
  const [isPaid, setIsPaid] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isChecking, setIsChecking] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [checkResult, setCheckResult] = useState<SlugCheckResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  // 현재 슬러그 정보 불러오기
  useEffect(() => {
    fetchSlugInfo()
  }, [invitationId])

  const fetchSlugInfo = async () => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}/slug`)
      const data: SlugInfoResponse = await response.json()

      if (response.ok) {
        setCurrentSlug(data.slug)
        setInputSlug(data.slug || '')
        setIsPaid(data.isPaid)
      }
    } catch (error) {
      console.error('Failed to fetch slug info:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 슬러그 유효성 검사 (디바운스)
  const checkSlug = useCallback(async (slug: string) => {
    if (!slug.trim()) {
      setCheckResult(null)
      return
    }

    setIsChecking(true)
    setCheckResult(null)

    try {
      const response = await fetch(
        `/api/invitations/check-slug?slug=${encodeURIComponent(slug)}&excludeId=${invitationId}`
      )
      const data: SlugCheckResult = await response.json()
      setCheckResult(data)
    } catch (error) {
      console.error('Failed to check slug:', error)
    } finally {
      setIsChecking(false)
    }
  }, [invitationId])

  // 입력 변경 시 디바운스 체크
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputSlug !== currentSlug) {
        checkSlug(inputSlug)
      } else {
        setCheckResult(null)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [inputSlug, currentSlug, checkSlug])

  // 슬러그 저장
  const handleSave = async () => {
    if (!checkResult?.available && inputSlug.trim()) {
      return
    }

    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch(`/api/invitations/${invitationId}/slug`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: inputSlug.trim() || null }),
      })

      const data: SlugSaveResponse = await response.json()

      if (response.ok) {
        setCurrentSlug(data.slug || null)
        setSuccessMessage(data.slug ? '슬러그가 저장되었습니다!' : '슬러그가 제거되었습니다.')
        setCheckResult(null)
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        setError(data.error || '저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('Failed to save slug:', error)
      setError('저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  // 추천 슬러그 선택
  const handleSelectSuggestion = (suggestion: string) => {
    setInputSlug(suggestion)
  }

  // URL 복사
  const handleCopyUrl = async () => {
    const url = currentSlug
      ? `${baseUrl}/invitation/${currentSlug}`
      : `${baseUrl}/invitation/${invitationId}`

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentUrl = currentSlug
    ? `${baseUrl}/invitation/${currentSlug}`
    : `${baseUrl}/invitation/${invitationId}`

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="w-5 h-5" />
          커스텀 URL 설정
        </CardTitle>
        <CardDescription>
          청첩장 URL을 짧고 기억하기 쉬운 주소로 변경하세요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 현재 URL */}
        <div className="space-y-2">
          <Label className="text-sm text-gray-500">현재 URL</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1 p-3 bg-gray-50 rounded-lg text-sm break-all">
              {currentUrl}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyUrl}
              className="shrink-0"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              asChild
              className="shrink-0"
            >
              <a href={currentUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>

        {/* 슬러그 입력 */}
        {isPaid ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="slug">커스텀 슬러그</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">/invitation/</span>
                <div className="relative flex-1">
                  <Input
                    id="slug"
                    value={inputSlug}
                    onChange={(e) => setInputSlug(e.target.value.toLowerCase())}
                    placeholder="my-wedding"
                    className={
                      checkResult
                        ? checkResult.available
                          ? 'border-green-500 pr-10'
                          : 'border-red-500 pr-10'
                        : ''
                    }
                  />
                  {isChecking && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                  )}
                  {!isChecking && checkResult && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      {checkResult.available ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <X className="w-4 h-4 text-red-600" />
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* 규칙 안내 */}
              <p className="text-xs text-gray-500">
                영문 소문자, 숫자, 하이픈(-) 사용 가능 / 3~30자
              </p>

              {/* 에러 메시지 */}
              {checkResult && !checkResult.available && checkResult.error && (
                <p className="text-sm text-red-600">{checkResult.error}</p>
              )}

              {/* 추천 슬러그 */}
              {checkResult && !checkResult.available && checkResult.suggestions && checkResult.suggestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">추천 슬러그:</p>
                  <div className="flex flex-wrap gap-2">
                    {checkResult.suggestions.map((suggestion) => (
                      <Button
                        key={suggestion}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className="text-xs"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 저장 버튼 */}
            <div className="flex items-center gap-4">
              <Button
                onClick={handleSave}
                disabled={
                  isSaving ||
                  (inputSlug.trim() !== '' && !checkResult?.available) ||
                  inputSlug === currentSlug
                }
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  '저장'
                )}
              </Button>

              {currentSlug && (
                <Button
                  variant="outline"
                  onClick={() => setInputSlug('')}
                  disabled={isSaving || inputSlug === ''}
                >
                  슬러그 제거
                </Button>
              )}
            </div>

            {/* 성공/에러 메시지 */}
            {successMessage && (
              <p className="text-sm text-green-600">{successMessage}</p>
            )}
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </>
        ) : (
          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              커스텀 URL 설정은 결제 후 이용 가능합니다.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
