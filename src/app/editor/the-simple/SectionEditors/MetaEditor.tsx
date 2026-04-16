'use client'

import { useState, useRef, useCallback } from 'react'
import type { TheSimpleInvitationData, ImageWithSettings, TheSimpleImageSettings } from '../page'
import InlineCropEditor from '@/components/editor/InlineCropEditor'
import ImageZoomEditor from '@/components/editor/ImageZoomEditor'
import { uploadImage } from '@/lib/imageUpload'

const DEFAULT_SETTINGS: TheSimpleImageSettings = {
  scale: 1,
  positionX: 0,
  positionY: 0,
}

interface MetaEditorProps {
  value: TheSimpleInvitationData['meta']
  onChange: (next: Partial<TheSimpleInvitationData['meta']>) => void
  slug: string | null
  invitationId: string | null
  onSlugChange: (slug: string) => void
  groomName?: string
  brideName?: string
  weddingDate?: string
  weddingTime?: string
  venueName?: string
}

/** 날짜/시간/장소로 자동 설명 생성 */
function generateAutoDescription(date: string, time: string, venueName: string): string {
  if (!date) return ''
  const d = new Date(date + 'T00:00:00')
  if (isNaN(d.getTime())) return ''
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  const dateLine = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${weekdays[d.getDay()]}요일${time ? ` ${time}` : ''}`
  return venueName ? `${dateLine}\n${venueName}` : dateLine
}

/** ogImage가 string인지 ImageWithSettings인지 판별 */
function extractOgUrl(ogImage: string | ImageWithSettings): string {
  if (typeof ogImage === 'string') return ogImage
  return ogImage.url
}

function extractOgSettings(ogImage: string | ImageWithSettings): TheSimpleImageSettings {
  if (typeof ogImage === 'string') return { ...DEFAULT_SETTINGS }
  return ogImage.settings
}

export default function MetaEditor({
  value,
  onChange,
  slug,
  invitationId,
  onSlugChange,
  groomName = '',
  brideName = '',
  weddingDate = '',
  weddingTime = '',
  venueName = '',
}: MetaEditorProps) {
  // 자동 생성 기본값
  const autoTitle = `${groomName || '신랑'} ♥ ${brideName || '신부'} 결혼합니다`
  const autoDescription = generateAutoDescription(weddingDate, weddingTime, venueName)
  const [ogUploading, setOgUploading] = useState(false)
  const [kakaoUploading, setKakaoUploading] = useState(false)
  const [slugInput, setSlugInput] = useState(slug || '')
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'saved'>('idle')
  const [slugError, setSlugError] = useState('')
  const [slugSuggestions, setSlugSuggestions] = useState<string[]>([])
  const [slugSaving, setSlugSaving] = useState(false)
  const checkTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const ogUrl = extractOgUrl(value.ogImage)
  const ogSettings = extractOgSettings(value.ogImage)
  const kakaoUrl = value.kakaoThumbnail?.url || ''
  const kakaoSettings = value.kakaoThumbnail?.settings || { ...DEFAULT_SETTINGS }

  // ── OG 이미지 업로드 ──
  const handleOgUpload = async (file: File) => {
    setOgUploading(true)
    try {
      const result = await uploadImage(file, { invitationId: invitationId || undefined })
      if (result.success && result.webUrl) {
        onChange({
          ogImage: { url: result.webUrl, settings: { ...DEFAULT_SETTINGS } },
        })
      } else {
        alert(result.error || '업로드에 실패했습니다.')
      }
    } catch {
      alert('업로드 중 오류가 발생했습니다.')
    } finally {
      setOgUploading(false)
    }
  }

  const handleOgRemove = () => {
    onChange({ ogImage: '' })
  }

  const handleOgSettings = (patch: Partial<TheSimpleImageSettings>) => {
    const currentUrl = extractOgUrl(value.ogImage)
    const currentSettings = extractOgSettings(value.ogImage)
    onChange({
      ogImage: { url: currentUrl, settings: { ...currentSettings, ...patch } },
    })
  }

  // ── 카카오 썸네일 업로드 ──
  const handleKakaoUpload = async (file: File) => {
    setKakaoUploading(true)
    try {
      const result = await uploadImage(file, { invitationId: invitationId || undefined })
      if (result.success && result.webUrl) {
        onChange({
          kakaoThumbnail: { url: result.webUrl, settings: { ...DEFAULT_SETTINGS } },
        })
      } else {
        alert(result.error || '업로드에 실패했습니다.')
      }
    } catch {
      alert('업로드 중 오류가 발생했습니다.')
    } finally {
      setKakaoUploading(false)
    }
  }

  const handleKakaoRemove = () => {
    onChange({ kakaoThumbnail: undefined })
  }

  const handleKakaoSettings = (patch: Partial<TheSimpleImageSettings>) => {
    if (!value.kakaoThumbnail) return
    onChange({
      kakaoThumbnail: {
        url: value.kakaoThumbnail.url,
        settings: { ...value.kakaoThumbnail.settings, ...patch },
      },
    })
  }

  // ── 슬러그 유효성 + 중복 검사 ──
  const slugPattern = /^[a-z0-9-]+$/

  const checkSlug = useCallback(
    async (val: string) => {
      if (!val) {
        setSlugStatus('idle')
        setSlugError('')
        setSlugSuggestions([])
        return
      }
      if (!slugPattern.test(val)) {
        setSlugStatus('invalid')
        setSlugError('영문 소문자, 숫자, 하이픈(-)만 사용 가능합니다.')
        setSlugSuggestions([])
        return
      }
      setSlugStatus('checking')
      setSlugError('')
      setSlugSuggestions([])
      try {
        const params = new URLSearchParams({ slug: val })
        if (invitationId) params.set('excludeId', invitationId)
        const res = await fetch(`/api/invitations/check-slug?${params}`)
        const data = (await res.json()) as { available?: boolean; error?: string; suggestions?: string[] }
        if (data.available) {
          setSlugStatus('available')
          setSlugError('')
        } else {
          setSlugStatus('taken')
          setSlugError(data.error || '이미 사용 중입니다.')
          if (data.suggestions) setSlugSuggestions(data.suggestions)
        }
      } catch {
        setSlugStatus('idle')
        setSlugError('확인 중 오류가 발생했습니다.')
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [invitationId],
  )

  const handleSlugInput = (val: string) => {
    const lower = val.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setSlugInput(lower)
    setSlugStatus('idle')
    clearTimeout(checkTimer.current)
    if (lower && lower !== slug) {
      checkTimer.current = setTimeout(() => checkSlug(lower), 400)
    }
  }

  const handleSlugSave = async () => {
    if (!invitationId || !slugInput || slugStatus !== 'available') return
    setSlugSaving(true)
    try {
      const res = await fetch(`/api/invitations/${invitationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: slugInput }),
      })
      if (res.ok) {
        onSlugChange(slugInput)
        setSlugStatus('saved')
      } else {
        const errData = (await res.json()) as { error?: string }
        setSlugError(errData.error || '저장에 실패했습니다.')
      }
    } catch {
      setSlugError('저장 중 오류가 발생했습니다.')
    } finally {
      setSlugSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* OG 이미지 (1.91:1) */}
      <div>
        <label className="block text-[11px] font-medium text-stone-600 mb-1">
          공유 미리보기 이미지 (OG)
        </label>
        <p className="text-[10px] text-stone-400 mb-1.5">
          문자, 인스타그램, 페이스북 등에서 링크 공유 시 표시됩니다. 권장: 1200 x 630px (1.91:1)
        </p>
        {ogUrl ? (
          <div className="space-y-2">
            <InlineCropEditor
              imageUrl={ogUrl}
              settings={ogSettings}
              onUpdate={handleOgSettings}
              aspectRatio={1.91}
              containerWidth={260}
            />
            <div className="flex gap-2">
              <label className="text-[11px] text-stone-500 border border-stone-200 rounded px-2 py-1 cursor-pointer hover:bg-stone-50">
                교체
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleOgUpload(f)
                    e.target.value = ''
                  }}
                />
              </label>
              <button
                type="button"
                onClick={handleOgRemove}
                className="text-[11px] text-red-400 border border-red-200 rounded px-2 py-1 hover:bg-red-50"
              >
                삭제
              </button>
            </div>
          </div>
        ) : (
          <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-stone-200 rounded-lg cursor-pointer hover:border-stone-300 transition-colors">
            <span className="text-[11px] text-stone-400">
              {ogUploading ? '업로드 중...' : '이미지 업로드 (클릭)'}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={ogUploading}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleOgUpload(f)
                e.target.value = ''
              }}
            />
          </label>
        )}
      </div>

      {/* OG 이미지 미설정 시 안내 */}
      {!ogUrl && kakaoUrl && (
        <p className="text-[10px] text-amber-600 bg-amber-50 rounded px-2 py-1.5 -mt-2">
          OG 이미지를 설정하지 않으면 카카오 썸네일이 기본으로 사용됩니다.
        </p>
      )}

      {/* 카카오 썸네일 (1:1) */}
      <div>
        <label className="block text-[11px] font-medium text-stone-600 mb-1">
          카카오톡 공유 썸네일
        </label>
        <p className="text-[10px] text-stone-400 mb-1.5">
          카카오톡으로 공유할 때 표시되는 이미지입니다. 권장: 600 x 600px (1:1)
        </p>
        {kakaoUrl ? (
          <div className="space-y-2">
            <InlineCropEditor
              imageUrl={kakaoUrl}
              settings={kakaoSettings}
              onUpdate={handleKakaoSettings}
              aspectRatio={1}
              containerWidth={200}
            />
            <div className="flex gap-2">
              <label className="text-[11px] text-stone-500 border border-stone-200 rounded px-2 py-1 cursor-pointer hover:bg-stone-50">
                교체
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleKakaoUpload(f)
                    e.target.value = ''
                  }}
                />
              </label>
              <button
                type="button"
                onClick={handleKakaoRemove}
                className="text-[11px] text-red-400 border border-red-200 rounded px-2 py-1 hover:bg-red-50"
              >
                삭제
              </button>
            </div>
          </div>
        ) : (
          <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-stone-200 rounded-lg cursor-pointer hover:border-stone-300 transition-colors">
            <span className="text-[11px] text-stone-400">
              {kakaoUploading ? '업로드 중...' : '이미지 업로드 (클릭)'}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={kakaoUploading}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleKakaoUpload(f)
                e.target.value = ''
              }}
            />
          </label>
        )}
      </div>

      {/* 공유 제목 / 설명 */}
      <div className="space-y-3">
        <div>
          <label className="block text-[11px] font-medium text-stone-600 mb-1">공유 제목</label>
          <input
            type="text"
            value={value.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder={autoTitle}
            className="w-full text-[13px] border border-stone-200 rounded-md px-3 py-2 focus:outline-none focus:border-stone-400"
          />
          <p className="text-[10px] text-stone-400 mt-1">
            링크 공유 시 표시되는 제목입니다. 비워두면 &ldquo;{autoTitle}&rdquo;로 표시됩니다.
          </p>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-stone-600 mb-1">공유 설명</label>
          <textarea
            value={value.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder={autoDescription || '2026년 5월 16일 토요일 오후 1시\n예식장 이름'}
            rows={2}
            className="w-full text-[13px] border border-stone-200 rounded-md px-3 py-2 focus:outline-none focus:border-stone-400 resize-none"
          />
          <p className="text-[10px] text-stone-400 mt-1">
            {autoDescription
              ? '비워두면 날짜, 시간, 장소가 자동으로 표시됩니다.'
              : '기본 정보에서 날짜와 장소를 입력하면 자동으로 채워집니다.'}
          </p>
        </div>
      </div>

      {/* 커스텀 링크 */}
      {invitationId && (
        <div>
          <label className="block text-[11px] font-medium text-stone-600 mb-1">커스텀 링크</label>
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-stone-400 whitespace-nowrap shrink-0">/i/</span>
            <input
              type="text"
              value={slugInput}
              onChange={(e) => handleSlugInput(e.target.value)}
              placeholder={slug || 'my-wedding'}
              className={`flex-1 min-w-0 text-[13px] border rounded-md px-2.5 py-1.5 focus:outline-none ${
                slugStatus === 'available' || slugStatus === 'saved'
                  ? 'border-green-300 focus:border-green-400'
                  : slugStatus === 'taken' || slugStatus === 'invalid'
                    ? 'border-red-300 focus:border-red-400'
                    : 'border-stone-200 focus:border-stone-400'
              }`}
            />
            <button
              type="button"
              onClick={handleSlugSave}
              disabled={slugStatus !== 'available' || slugSaving}
              className="text-[11px] px-2.5 py-1.5 rounded-md bg-stone-800 text-white disabled:bg-stone-300 disabled:cursor-not-allowed hover:bg-stone-700 transition-colors whitespace-nowrap"
            >
              {slugSaving ? '저장중...' : '저장'}
            </button>
          </div>
          {/* 상태 표시 */}
          {slugStatus === 'checking' && (
            <p className="text-[10px] text-stone-400 mt-1">확인 중...</p>
          )}
          {slugStatus === 'available' && (
            <p className="text-[10px] text-green-500 mt-1">사용 가능한 링크입니다.</p>
          )}
          {slugStatus === 'saved' && (
            <p className="text-[10px] text-green-500 mt-1">저장되었습니다!</p>
          )}
          {(slugStatus === 'taken' || slugStatus === 'invalid') && slugError && (
            <p className="text-[10px] text-red-400 mt-1">{slugError}</p>
          )}
          {slugSuggestions.length > 0 && (
            <div className="mt-1.5 space-y-0.5">
              <p className="text-[10px] text-stone-400">추천:</p>
              {slugSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSlugInput(s)
                    checkSlug(s)
                  }}
                  className="block text-[11px] text-blue-500 hover:underline"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {slug && (
            <p className="text-[10px] text-stone-400 mt-1.5">
              현재: /i/{slug}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
