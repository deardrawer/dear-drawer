'use client'

import { useState } from 'react'
import { useThankYouEditorStore } from '@/store/thankYouEditorStore'
import { Loader2, ExternalLink, Copy, Check } from 'lucide-react'

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
  const { isSaving } = useThankYouEditorStore()
  const [newSlug, setNewSlug] = useState(slug || '')
  const [isChangingSlug, setIsChangingSlug] = useState(false)
  const [slugError, setSlugError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const currentUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/i/${slug || invitationId || 'preview'}`
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
      // fallback
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

      {/* 공유 URL */}
      {invitationId && (
        <div>
          <label className="block text-sm font-medium text-[#2C2824] mb-2">공유 링크</label>
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
        </div>
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
