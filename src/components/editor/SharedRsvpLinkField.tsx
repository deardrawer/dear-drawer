'use client'

import { useEffect, useState } from 'react'
import RsvpShareThumb from './RsvpShareThumb'
import RsvpSharePreview from './RsvpSharePreview'
import { shareRsvpToKakao } from '@/lib/kakaoRsvpShare'

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
  invitationId,
  shareTitle,
  shareDesc,
  shareImage,
  pagePhoto,
  onShareChange,
}: {
  enabled: boolean
  /** 명시적 slug/id (없으면 에디터 URL에서 자동 취득) */
  slug?: string
  /** 썸네일 업로드용 청첩장 id (없으면 URL id/slug 사용) */
  invitationId?: string
  /** 카카오 공유 제목 (커스텀) */
  shareTitle?: string
  /** 카카오 공유 설명 (커스텀) */
  shareDesc?: string
  /** 카카오 공유 썸네일 URL (커스텀) */
  shareImage?: string
  /** RSVP 링크 페이지 상단 사진 URL (커스텀) */
  pagePhoto?: string
  /** 공유 제목/설명/썸네일/상단사진 변경 콜백 (없으면 입력칸 미노출) */
  onShareChange?: (patch: { shareTitle?: string; shareDesc?: string; shareImage?: string; pagePhoto?: string }) => void
}) {
  const [copied, setCopied] = useState(false)
  const [urlSlug, setUrlSlug] = useState('')
  const [urlId, setUrlId] = useState('')

  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search)
      setUrlId(p.get('id') || '')
      if (!slugProp) setUrlSlug(p.get('slug') || p.get('id') || '')
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
          <RsvpShareThumb
            invitationId={invitationId || urlId || slug}
            value={pagePhoto}
            onChange={(url) => onShareChange({ pagePhoto: url })}
            label="RSVP 링크 상단 사진 (선택)"
            hint="RSVP 페이지 맨 위에 원형으로 표시됩니다. 비우면 표시되지 않습니다."
            circle
          />
        </div>
      )}

      {onShareChange && (
        <div className="space-y-1.5 rounded-md border border-gray-200 bg-gray-50/60 p-2.5">
          <p className="text-[11px] font-medium text-gray-600">카카오톡 공유 정보</p>
          <input
            type="text"
            value={shareTitle ?? ''}
            onChange={(e) => onShareChange({ shareTitle: e.target.value })}
            placeholder="참석 여부 안내"
            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-[11px] text-gray-700"
          />
          <textarea
            value={shareDesc ?? ''}
            onChange={(e) => onShareChange({ shareDesc: e.target.value })}
            placeholder="예식 준비를 위해 참석 여부를 미리 알려주시면 감사하겠습니다."
            rows={2}
            className="w-full resize-none rounded-md border border-gray-300 bg-white px-2 py-1.5 text-[11px] text-gray-700"
          />
          <RsvpShareThumb
            invitationId={invitationId || urlId || slug}
            value={shareImage}
            onChange={(url) => onShareChange({ shareImage: url })}
          />
          <RsvpSharePreview image={shareImage} title={shareTitle} desc={shareDesc} />
          <button
            type="button"
            onClick={() => shareRsvpToKakao({ url, title: shareTitle, desc: shareDesc, image: shareImage })}
            className="w-full rounded-md bg-[#FEE500] py-2 text-[12px] font-medium text-[#3C1E1E]"
          >
            카카오톡으로 공유
          </button>
          <p className="text-[10px] leading-tight text-gray-400">
            제목·설명을 비우면 기본 문구가 사용됩니다. <b className="text-gray-500">카카오톡으로 공유</b> 버튼은 수정 즉시 반영됩니다. 링크를 복사해 붙여넣는 경우엔 <span className="text-amber-600">저장 후</span> 카카오 캐시 갱신이 필요할 수 있어요.
          </p>
        </div>
      )}
    </div>
  )
}
