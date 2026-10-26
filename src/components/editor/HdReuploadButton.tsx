'use client'

import { useState } from 'react'
import { uploadImage, type UploadResult } from '@/lib/imageUpload'

/**
 * 갤러리 '고화질로 다시 올리기' 버튼 (사진 확대 허용 시).
 * 같은 사진을 확대용 고화질(…_full.webp)과 함께 다시 올린다 — 하객이 확대하면 그 파일을 불러와 최대 4배까지 선명하게.
 * 업로드가 끝나면 onUploaded 로 결과(webUrl 등)를 넘긴다. 크롭·위치 설정 유지는 부르는 쪽에서.
 */
export default function HdReuploadButton({
  invitationId,
  isHd = false,
  onUploaded,
  className = '',
}: {
  invitationId?: string
  isHd?: boolean
  onUploaded: (res: UploadResult) => void
  className?: string
}) {
  const [busy, setBusy] = useState(false)
  return (
    <label className={`underline underline-offset-2 ${busy ? 'text-gray-300' : 'cursor-pointer text-gray-500 hover:text-gray-800'} ${className}`}>
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
      {busy ? '고화질 업로드 중…' : isHd ? '고화질 ✓ 다시 올리기' : '고화질로 다시 올리기'}
    </label>
  )
}
