'use client'

import { useState } from 'react'
import ImageZoomEditor from '@/components/editor/ImageZoomEditor'
import { uploadImage } from '@/lib/imageUpload'

/** THE CLASSIC 공통 사진 필드 값 (THE SIMPLE 크롭/줌 방식) */
export interface ClassicPhoto {
  url: string
  scale?: number
  positionX?: number
  positionY?: number
}

interface Props {
  value?: ClassicPhoto | null
  onChange: (photo: ClassicPhoto | null) => void
  invitationId?: string
  aspectRatio?: number // 줌 에디터 프리뷰 비율 (기본 4/5 세로형)
  label?: string
  containerWidth?: number
}

/**
 * 업로드 + 크롭/줌(ImageZoomEditor) 통합 사진 필드.
 * 값은 { url, scale, positionX, positionY } 형태로 저장되어,
 * 게스트 클라이언트에서 background-size/position으로 동일하게 렌더된다.
 */
export default function ClassicPhotoField({ value, onChange, invitationId, aspectRatio = 4 / 5, label, containerWidth = 200 }: Props) {
  const [uploading, setUploading] = useState(false)
  const url = value?.url || ''

  const handleFile = async (file: File) => {
    setUploading(true)
    try {
      const res = await uploadImage(file, { invitationId })
      if (res.success && res.webUrl) {
        onChange({ url: res.webUrl, scale: 1, positionX: 0, positionY: 0 })
      } else {
        alert(res.error || '업로드에 실패했습니다.')
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-1.5">
      {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
      {url ? (
        <div className="space-y-1.5">
          <ImageZoomEditor
            imageUrl={url}
            scale={value?.scale ?? 1}
            positionX={value?.positionX ?? 0}
            positionY={value?.positionY ?? 0}
            onUpdate={(patch) => onChange({ url, scale: value?.scale ?? 1, positionX: value?.positionX ?? 0, positionY: value?.positionY ?? 0, ...patch })}
            aspectRatio={aspectRatio}
            containerWidth={containerWidth}
          />
          <div className="flex items-center gap-3" style={{ width: containerWidth }}>
            <label className="text-[11px] text-gray-500 underline cursor-pointer">
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
              {uploading ? '업로드 중…' : '사진 변경'}
            </label>
            <button type="button" className="text-[11px] text-red-400 hover:text-red-500" onClick={() => onChange(null)}>삭제</button>
          </div>
        </div>
      ) : (
        <label className="flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg cursor-pointer text-xs text-gray-400 hover:border-gray-300 transition-colors" style={{ width: containerWidth, height: containerWidth * aspectRatio }}>
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
          {uploading ? '업로드 중…' : '+ 사진 업로드'}
        </label>
      )}
    </div>
  )
}
