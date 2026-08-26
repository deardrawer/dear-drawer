'use client'

import { useEffect, useState } from 'react'

/**
 * '별도 RSVP 링크' 토글이 켜졌을 때 그 아래에 링크(URL + 복사)를 인라인 표시.
 * slug prop이 없으면 에디터 URL(?slug= / ?id=)에서 자동으로 읽는다.
 * (각 위저드 스텝에는 invitation id/slug가 직접 없으므로 URL에서 취득)
 */
export default function SharedRsvpLinkField({
  enabled,
  slug: slugProp,
}: {
  enabled: boolean
  /** 명시적 slug/id (없으면 에디터 URL에서 자동 취득) */
  slug?: string
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
    <div className="mt-2 flex items-center gap-1.5">
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
  )
}
