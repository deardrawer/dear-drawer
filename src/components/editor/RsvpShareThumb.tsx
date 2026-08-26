'use client'

import { useRef, useState } from 'react'
import { uploadImage } from '@/lib/imageUpload'

/**
 * 별도 RSVP 링크 카카오 공유 썸네일 업로드/미리보기/제거.
 * 비우면 generateMetadata가 청첩장 대표 사진을 자동 사용한다.
 */
export default function RsvpShareThumb({
  invitationId,
  value,
  onChange,
}: {
  invitationId?: string
  value?: string
  onChange: (url: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState('')

  const handleFile = async (file: File) => {
    setErr('')
    setUploading(true)
    const res = await uploadImage(file, { invitationId: invitationId || 'temp' })
    setUploading(false)
    if (res.success && res.webUrl) onChange(res.webUrl)
    else setErr(res.error || '업로드에 실패했습니다.')
  }

  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium text-gray-600">공유 썸네일</p>
      {value ? (
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="w-14 h-14 rounded-md object-cover border border-gray-200" />
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="text-[11px] px-2 py-1 rounded-md border border-gray-300 text-gray-600 disabled:opacity-50">
            {uploading ? '업로드 중…' : '변경'}
          </button>
          <button type="button" onClick={() => onChange('')} className="text-[11px] px-2 py-1 rounded-md border border-gray-300 text-gray-500">제거</button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="text-[11px] px-3 py-1.5 rounded-md border border-dashed border-gray-300 text-gray-500 disabled:opacity-50">
          {uploading ? '업로드 중…' : '＋ 썸네일 업로드'}
        </button>
      )}
      <p className="text-[10px] text-gray-400 leading-tight">비우면 청첩장 대표 사진이 자동 사용됩니다. 권장 1200×630.</p>
      {err && <p className="text-[10px] text-red-500">{err}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (f) handleFile(f)
        }}
      />
    </div>
  )
}
