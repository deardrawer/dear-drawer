'use client'

import { useState } from 'react'
import { useThankYouEditorStore } from '@/store/thankYouEditorStore'
import { Loader2, ExternalLink, Copy, Check } from 'lucide-react'
import ImageUploader from '@/components/editor/ImageUploader'
import InlineCropEditor from '@/components/editor/InlineCropEditor'
import ImageCropEditor, { CropData } from '@/components/parents/ImageCropEditor'

interface ThankYouStep5PublishProps {
  invitationId: string | null
  slug?: string | null
  onSave?: () => Promise<void>
  onSlugChange?: (newSlug: string) => void
}

export default function ThankYouStep5Publish({
  invitationId,
  slug,
  onSave,
  onSlugChange,
}: ThankYouStep5PublishProps) {
  const { isSaving, meta, updateMeta, data } = useThankYouEditorStore()
  const [newSlug, setNewSlug] = useState(slug || '')
  const [isChangingSlug, setIsChangingSlug] = useState(false)
  const [slugError, setSlugError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const productionUrl = 'https://invite.deardrawer.com'
  const currentUrl = slug
    ? `${productionUrl}/i/${slug}`
    : invitationId
    ? `${productionUrl}/i/${invitationId}`
    : ''

  const handleSave = async () => {
    if (!onSave) return
    try {
      await onSave()
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch {
      // error handled in parent
    }
  }

  const handleSlugChange = async () => {
    if (!onSlugChange || !newSlug.trim()) return
    setIsChangingSlug(true)
    setSlugError(null)
    try {
      await onSlugChange(newSlug.trim())
    } catch (e) {
      setSlugError(e instanceof Error ? e.message : '변경에 실패했습니다.')
    } finally {
      setIsChangingSlug(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = currentUrl
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // 카카오톡 공유
  const handleKakaoShare = () => {
    if (!currentUrl) return

    const kakaoWindow = window as typeof window & {
      Kakao?: {
        isInitialized?: () => boolean
        Share?: { sendDefault: (config: object) => void }
      }
    }

    if (typeof window !== 'undefined' && kakaoWindow.Kakao?.Share && kakaoWindow.Kakao.isInitialized?.()) {
      const rawImage = meta.kakaoThumbnail || meta.ogImage || null
      const coverImage = rawImage || data.heroImage
      let imageUrl = `${productionUrl}/og-image.png`
      if (coverImage) {
        if (coverImage.startsWith('https://')) {
          imageUrl = coverImage
        } else if (coverImage.startsWith('/uploads/') || coverImage.startsWith('/api/r2/') || coverImage.startsWith('/sample/')) {
          imageUrl = `${productionUrl}${coverImage}`
        }
      }

      const names = data.coupleNames || '감사장'
      kakaoWindow.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: meta.title || `${names}의 감사 인사`,
          description: meta.description || '감사장이 도착했습니다',
          imageUrl,
          link: { mobileWebUrl: currentUrl, webUrl: currentUrl },
        },
        buttons: [{ title: '감사장 보기', link: { mobileWebUrl: currentUrl, webUrl: currentUrl } }],
      })
    } else {
      navigator.clipboard.writeText(currentUrl)
      alert('카카오톡 공유를 사용할 수 없어 링크가 복사되었습니다.')
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* 안내 */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
        <p className="text-base text-emerald-800 font-medium mb-1">발행</p>
        <p className="text-sm text-emerald-600">감사장을 저장하고 공유할 수 있습니다.</p>
      </div>

      {/* 저장 버튼 */}
      <div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-3.5 rounded-xl text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 bg-[#A37E69] hover:bg-[#8A6B58] disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              저장 중...
            </>
          ) : saveSuccess ? (
            <>
              <Check className="w-4 h-4" />
              저장 완료!
            </>
          ) : (
            '저장하기'
          )}
        </button>
      </div>

      {/* 커스텀 URL */}
      {invitationId && (
        <div>
          <label className="block text-sm font-medium text-[#2C2824] mb-2">커스텀 URL</label>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <span className="px-3 text-xs text-gray-400 whitespace-nowrap">/i/</span>
              <input
                type="text"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value.replace(/[^a-z0-9-]/g, ''))}
                placeholder="my-thanks"
                className="flex-1 px-2 py-3 text-sm focus:outline-none"
              />
            </div>
            <button
              onClick={handleSlugChange}
              disabled={isChangingSlug || !newSlug.trim()}
              className="px-4 py-3 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {isChangingSlug ? <Loader2 className="w-4 h-4 animate-spin" /> : '변경'}
            </button>
          </div>
          {slugError && <p className="text-xs text-red-500 mt-1">{slugError}</p>}
        </div>
      )}

      {/* 공유 URL + 카카오톡 */}
      {invitationId && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-[#2C2824]">공유 링크</label>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <span className="text-sm text-gray-600 flex-1 truncate">{currentUrl}</span>
            <button
              onClick={handleCopy}
              className="shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </a>
          </div>

          {/* 카카오톡 공유 버튼 */}
          <button
            onClick={handleKakaoShare}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#FEE500] hover:bg-[#F5DC00] rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#3C1E1E">
              <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.643 1.765 4.966 4.412 6.286l-.893 3.27a.3.3 0 00.455.334l3.862-2.552c.67.097 1.357.148 2.055.148 5.523 0 10-3.463 10-7.777C22 6.463 17.523 3 12 3z" />
            </svg>
            <span className="text-sm font-medium text-[#3C1E1E]">카카오톡으로 공유</span>
          </button>
        </div>
      )}

      {/* 카카오톡 공유 설정 */}
      {invitationId && (
        <section className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" /></svg>
            카카오톡 공유 설정
          </h3>
          <p className="text-sm text-blue-600">
            <svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
            카카오톡으로 공유할 때 표시되는 정보를 설정해주세요.
          </p>

          {/* 캐시 경고 */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-700 mb-2">
              <svg className="w-3 h-3 text-amber-600 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              <strong>중요:</strong> 카카오톡 공유 정보는 한번 공유된 후 변경하면 캐시로 인해 반영되기까지 시간이 오래 걸릴 수 있습니다.
            </p>
            <details className="text-xs text-amber-700">
              <summary className="cursor-pointer font-medium hover:text-amber-900">이미지 변경하기 (펼쳐보기)</summary>
              <div className="mt-2 space-y-1 pl-2 border-l-2 border-amber-300">
                <p>이미지 변경을 위해 썸네일 캐시 초기화가 필요합니다.</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>
                    <a href="https://developers.kakao.com/tool/clear/og" target="_blank" rel="noopener noreferrer" className="text-amber-800 underline hover:text-amber-900">
                      카카오톡 디벨로퍼
                    </a>에 접속
                  </li>
                  <li>URL 부분에 카카오톡 공유링크를 입력</li>
                  <li>캐시초기화 버튼 클릭</li>
                  <li>다시 카카오톡 링크 공유</li>
                </ol>
              </div>
            </details>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg space-y-4">
            {/* 썸네일 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">공유 썸네일</label>
              <p className="text-xs text-gray-400">권장 사이즈: 600 x 600px (1:1 정사각형)</p>
              {meta.kakaoThumbnail ? (
                <div className="space-y-3">
                  <InlineCropEditor
                    imageUrl={meta.kakaoThumbnail}
                    settings={meta.kakaoThumbnailSettings || { scale: 1.0, positionX: 0, positionY: 0 }}
                    onUpdate={(s) => {
                      const current = meta.kakaoThumbnailSettings || { scale: 1.0, positionX: 0, positionY: 0 }
                      updateMeta('kakaoThumbnailSettings', { ...current, ...s })
                    }}
                    aspectRatio={1}
                    containerWidth={180}
                    colorClass="amber"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      updateMeta('kakaoThumbnail', '')
                      updateMeta('kakaoThumbnailSettings', undefined)
                    }}
                    className="text-xs text-red-500 hover:text-red-600"
                  >
                    이미지 삭제
                  </button>
                </div>
              ) : (
                <div className="max-w-[150px]">
                  <ImageUploader
                    value={meta.kakaoThumbnail}
                    onChange={(url) => updateMeta('kakaoThumbnail', url)}
                    invitationId={invitationId || undefined}
                    placeholder="썸네일 업로드"
                    aspectRatio="aspect-square"
                  />
                </div>
              )}
            </div>

            {/* 공유 제목 */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">공유 제목</label>
              <input
                type="text"
                value={meta.title}
                onChange={(e) => updateMeta('title', e.target.value)}
                placeholder={`${data.coupleNames || '신랑 & 신부'}의 감사 인사`}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
              <p className="text-xs text-gray-400">비워두면 자동 생성됩니다.</p>
            </div>

            {/* 공유 설명 */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">공유 설명</label>
              <textarea
                value={meta.description}
                onChange={(e) => updateMeta('description', e.target.value)}
                placeholder="감사장이 도착했습니다"
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none"
              />
              <p className="text-xs text-gray-400">비워두면 기본 문구가 표시됩니다.</p>
            </div>
          </div>
        </section>
      )}

      {/* OG 이미지 설정 */}
      {invitationId && (
        <section className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
            공유 미리보기 이미지 (OG 이미지)
          </h3>
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              <svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
              <strong>권장 크기:</strong> 1200 x 630 픽셀 (가로형)<br />
              카카오톡 이외의 플랫폼(문자, 인스타그램, 페이스북 등)에서 공유할 때 표시되는 이미지입니다.
            </p>
          </div>

          <div className="space-y-3">
            <ImageCropEditor
              value={{
                url: meta.ogImage || '',
                cropX: meta.ogImageSettings?.cropX ?? 0,
                cropY: meta.ogImageSettings?.cropY ?? 0,
                cropWidth: meta.ogImageSettings?.cropWidth ?? 1,
                cropHeight: meta.ogImageSettings?.cropHeight ?? 1,
              }}
              onChange={(cropData: CropData) => {
                updateMeta('ogImage', cropData.url)
                updateMeta('ogImageSettings', {
                  ...(meta.ogImageSettings || { scale: 1, positionX: 0, positionY: 0 }),
                  cropX: cropData.cropX,
                  cropY: cropData.cropY,
                  cropWidth: cropData.cropWidth,
                  cropHeight: cropData.cropHeight,
                })
              }}
              aspectRatio={1200 / 630}
              containerWidth={280}
              invitationId={invitationId || undefined}
              label="공유 미리보기 이미지"
            />

            {!meta.ogImage && meta.kakaoThumbnail && (
              <div className="p-3 bg-amber-50 rounded-lg">
                <p className="text-xs text-amber-700">
                  <svg className="w-3 h-3 text-amber-600 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                  OG 이미지를 설정하지 않으면 카카오톡 썸네일이 기본으로 사용됩니다.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {!invitationId && (
        <div className="p-4 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-500 leading-relaxed">
            저장하면 감사장 URL이 생성됩니다. 저장 후 커스텀 URL 변경과 공유가 가능합니다.
          </p>
        </div>
      )}
    </div>
  )
}
