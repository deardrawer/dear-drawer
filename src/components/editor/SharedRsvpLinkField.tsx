'use client'

import { useEffect, useState } from 'react'

/**
 * '별도 RSVP 링크' 토글이 켜졌을 때 그 아래에 링크(URL + 복사)를 인라인 표시.
 * slug prop이 없으면 에디터 URL(?slug= / ?id=)에서 자동으로 읽는다.
 * (각 위저드 스텝에는 invitation id/slug가 직접 없으므로 URL에서 취득)
 *
 * onShareChange를 넘기면 카카오톡 공유 제목/설명 커스텀 입력칸도 함께 노출한다.
 */
export default function SharedRsvpLinkField({
  enabled,
  slug: slugProp,
  shareTitle,
  shareDesc,
  onShareChange,
}: {
  enabled: boolean
  /** 명시적 slug/id (없으면 에디터 URL에서 자동 취득) */
  slug?: string
  /** 카카오 공유 제목 (커스텀) */
  shareTitle?: string
  /** 카카오 공유 설명 (커스텀) */
  shareDesc?: string
  /** 공유 제목/설명 변경 콜백 (없으면 입력칸 미노출) */
  onShareChange?: (patch: { shareTitle?: string; shareDesc?: string }) => void
}) {
  const [copied, setCopied] = useState(false)
  const [urlSlug, setUrlSlug] = useState('')

  useEffect(() => {
    if (slugProp) return
    try {
      const p = new URLSearchParams(window.location.search)
      setUrlSlug(p.get('slug') || p.get('id') || '')
    } catch {
      /* noop */
    }
  }, [slugProp])

  if (!enabled) return null

  const slug = slugProp || urlSlug
  if (!slug) {
    return <p className="mt-2 text-[11px] text-amber-600">저장(발행) 후 링크가 생성됩니다.</p>
  }

  const url = `https://invite.deardrawer.com/i/${slug}/rsvp`
  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 min-w-0 rounded-md border border-gray-300 bg-gray-50 px-2 py-1.5 text-[11px] text-gray-600"
        />
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(url).then(() => {
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            })
          }}
          className="shrink-0 rounded-md bg-gray-800 px-3 py-1.5 text-[11px] text-white"
        >
          {copied ? '복사됨' : '복사'}
        </button>
      </div>

      {onShareChange && (
        <div className="space-y-1.5 rounded-md border border-gray-200 bg-gray-50/60 p-2.5">
          <p className="text-[11px] font-medium text-gray-600">카카오톡 공유 정보</p>
          <input
            type="text"
            value={shareTitle ?? ''}
            onChange={(e) => onShareChange({ shareTitle: e.target.value })}
            placeholder="공유 제목 (예: 참석 여부를 전해주세요)"
            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-[11px] text-gray-700"
          />
          <textarea
            value={shareDesc ?? ''}
            onChange={(e) => onShareChange({ shareDesc: e.target.value })}
            placeholder="공유 설명 (예: 신랑 신부에게 참석 여부를 미리 알려주세요)"
            rows={2}
            className="w-full resize-none rounded-md border border-gray-300 bg-white px-2 py-1.5 text-[11px] text-gray-700"
          />
          <p className="text-[10px] leading-tight text-gray-400">
            비우면 기본 문구로 자동 표시됩니다. <span className="text-amber-600">저장해야</span> 카카오톡 공유 미리보기(제목·설명·사진)에 반영됩니다.
          </p>
        </div>
      )}
    </div>
  )
}
