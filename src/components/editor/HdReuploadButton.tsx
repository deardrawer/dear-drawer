'use client'

import { useState } from 'react'
import { uploadImage, type UploadResult } from '@/lib/imageUpload'
import { isHdImage, isHdUpload, setHdActive } from '@/lib/hdImage'

/**
 * 갤러리 고화질 버튼 (사진 확대 허용 시) — 같은 자리에서 상태에 따라 바뀐다.
 * - 아직 고화질이 아님: '고화질로 다시 올리기' → 같은 사진을 확대용 고화질(…_full.webp)과 함께 다시 올림 (onUploaded)
 * - 고화질 켜짐: '고화질 해제' → 다시 올리지 않고 일반 사진처럼(최대 2.5배) (onToggle, 주소 끝 ?sd=1)
 * - 고화질 해제됨: '고화질 켜기' → 다시 최대 4배 (onToggle)
 * 고화질 파일은 해제해도 남겨 둔다 (다시 켤 때 다시 올릴 필요 없음). 크롭·위치 설정 유지는 부르는 쪽에서.
 */
export default function HdReuploadButton({
  url,
  invitationId,
  onUploaded,
  onToggle,
  className = '',
  short = false,
}: {
  url?: string
  invitationId?: string
  onUploaded: (res: UploadResult) => void
  onToggle?: (nextUrl: string) => void
  className?: string
  short?: boolean // 썸네일 위처럼 좁은 곳: '고화질'
}) {
  const [busy, setBusy] = useState(false)
  const cls = `underline underline-offset-2 ${busy ? 'text-gray-300' : 'cursor-pointer text-gray-500 hover:text-gray-800'} ${className}`

  // 고화질로 올린 사진: 해제 / 켜기
  if (url && onToggle && isHdUpload(url)) {
    const on = isHdImage(url)
    return (
      <button type="button" className={cls} onClick={(e) => { e.stopPropagation(); onToggle(setHdActive(url, !on)) }}>
        {on ? '고화질 해제' : '고화질 켜기'}
      </button>
    )
  }

  return (
    <label className={cls}>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={busy}
        onChange={async (e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (!f) return
          setBusy(true)
          try {
            const res = await uploadImage(f, { invitationId, hd: true })
            if (res.success && res.webUrl) onUploaded(res)
            else alert(res.error || '업로드에 실패했습니다.')
          } finally {
            setBusy(false)
          }
        }}
      />
      {busy ? '업로드 중…' : short ? '고화질' : '고화질로 다시 올리기'}
    </label>
  )
}
