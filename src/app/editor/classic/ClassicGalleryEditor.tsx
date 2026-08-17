'use client'

import { useState } from 'react'
import ImageZoomEditor from '@/components/editor/ImageZoomEditor'
import { uploadImage } from '@/lib/imageUpload'
import type { ClassicPhoto } from './ClassicPhotoField'

/** THE CLASSIC 갤러리 이미지 (레거시 호환: 문자열 URL 또는 크롭 객체) */
export type ClassicGalleryImage = string | ClassicPhoto

/** 갤러리 이미지에서 URL만 추출 (문자열/객체 모두 지원) */
export const galleryImageUrl = (im: ClassicGalleryImage | undefined | null): string =>
  (typeof im === 'string' ? im : im?.url) || ''

// 레거시(문자열) 항목을 크롭 객체로 정규화
const toItem = (im: ClassicGalleryImage): ClassicPhoto =>
  typeof im === 'string' ? { url: im, scale: 1, positionX: 0, positionY: 0 } : im

interface Props {
  images: ClassicGalleryImage[]
  onChange: (images: ClassicPhoto[]) => void
  invitationId?: string
  maxImages?: number
}

/**
 * THE CLASSIC 갤러리 전용 편집기.
 * ClassicPhotoField(THE SIMPLE 방식 ImageZoomEditor)와 동일한 크롭/줌 방식을
 * 다중 이미지(추가/교체/삭제/순서변경)에 적용한다.
 */
export default function ClassicGalleryEditor({ images, onChange, invitationId, maxImages = 30 }: Props) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [addingUpload, setAddingUpload] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const items: ClassicPhoto[] = images.map(toItem)

  const updateAt = (i: number, patch: Partial<ClassicPhoto>) => {
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  }

  const removeAt = (i: number) => {
    onChange(items.filter((_, idx) => idx !== i))
  }

  const moveAt = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= items.length) return
    const next = [...items]
    const tmp = next[i]
    next[i] = next[j]
    next[j] = tmp
    onChange(next)
  }

  const handleReplace = async (i: number, file: File) => {
    setUploadingIndex(i)
    try {
      const res = await uploadImage(file, { invitationId })
      if (res.success && res.webUrl) {
        updateAt(i, { url: res.webUrl, scale: 1, positionX: 0, positionY: 0 })
      } else {
        alert(res.error || '업로드에 실패했습니다.')
      }
    } finally {
      setUploadingIndex(null)
    }
  }

  const handleAdd = async (files: File[]) => {
    const available = maxImages - items.length
    if (available <= 0 || files.length === 0) return
    const toUpload = files.slice(0, available)
    setAddingUpload(true)
    try {
      const uploaded: ClassicPhoto[] = []
      for (const file of toUpload) {
        const res = await uploadImage(file, { invitationId })
        if (res.success && res.webUrl) {
          uploaded.push({ url: res.webUrl, scale: 1, positionX: 0, positionY: 0 })
        } else {
          alert(res.error || '업로드에 실패했습니다.')
        }
      }
      if (uploaded.length) onChange([...items, ...uploaded])
    } finally {
      setAddingUpload(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* 3열 썸네일 그리드 */}
      <div className="grid grid-cols-3 gap-2">
        {items.map((item, i) => (
          <div key={i} className="space-y-1">
            <div
              className="relative rounded-md border border-gray-200 overflow-hidden group"
              style={{
                aspectRatio: '1',
                backgroundColor: '#eee',
                backgroundImage: item.url ? `url(${item.url})` : undefined,
                backgroundSize: (item.scale ?? 1) > 1 ? `${(item.scale ?? 1) * 100}%` : 'cover',
                backgroundPosition: `${50 - (item.positionX ?? 0)}% ${50 - (item.positionY ?? 0)}%`,
                backgroundRepeat: 'no-repeat',
              }}
            >
              <button
                type="button"
                onClick={() => { removeAt(i); if (editingIndex === i) setEditingIndex(null) }}
                aria-label="삭제"
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/55 text-white text-[11px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
              >
                ×
              </button>
              <div className="absolute bottom-1 left-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button type="button" disabled={i === 0} onClick={() => moveAt(i, -1)} aria-label="이전으로" className="w-5 h-5 rounded bg-black/55 text-white text-[11px] leading-none disabled:opacity-25 hover:bg-black/80">◀</button>
                <button type="button" disabled={i === items.length - 1} onClick={() => moveAt(i, 1)} aria-label="다음으로" className="w-5 h-5 rounded bg-black/55 text-white text-[11px] leading-none disabled:opacity-25 hover:bg-black/80">▶</button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEditingIndex(editingIndex === i ? null : i)}
              className={`w-full text-[11px] rounded px-1.5 py-0.5 border transition-colors ${editingIndex === i ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            >
              {editingIndex === i ? '닫기' : '조정'}
            </button>
          </div>
        ))}
      </div>

      {/* 조정 패널 (선택한 사진 1장) */}
      {editingIndex !== null && items[editingIndex] && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md space-y-2">
          <div className="text-[10px] text-gray-500 text-center">사진 {editingIndex + 1} · 줌 · 위치 조정 (드래그 · 확대)</div>
          <div className="flex justify-center">
            <ImageZoomEditor
              imageUrl={items[editingIndex].url}
              scale={items[editingIndex].scale ?? 1}
              positionX={items[editingIndex].positionX ?? 0}
              positionY={items[editingIndex].positionY ?? 0}
              onUpdate={(patch) => updateAt(editingIndex, patch)}
              aspectRatio={1}
              containerWidth={220}
            />
          </div>
          <div className="flex items-center justify-center gap-3">
            <label className="text-[11px] text-gray-500 underline cursor-pointer">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={uploadingIndex === editingIndex}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  e.target.value = ''
                  if (f && editingIndex !== null) handleReplace(editingIndex, f)
                }}
              />
              {uploadingIndex === editingIndex ? '업로드 중…' : '사진 교체'}
            </label>
            <button type="button" onClick={() => setEditingIndex(null)} className="text-[11px] text-gray-500 border border-gray-200 rounded px-2 py-0.5 hover:bg-gray-100">닫기</button>
          </div>
        </div>
      )}

      {items.length < maxImages && (
        <label className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer text-xs text-gray-400 hover:border-gray-300 transition-colors py-6">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            disabled={addingUpload}
            onChange={(e) => {
              const fileList = e.target.files
              const files = fileList ? Array.from(fileList) : []
              e.target.value = ''
              if (files.length) handleAdd(files)
            }}
          />
          <span>{addingUpload ? '업로드 중…' : '+ 사진 추가'}</span>
          <span className="text-[10px] text-gray-300">{items.length} / {maxImages}장 · 여러 장 선택 가능</span>
        </label>
      )}
    </div>
  )
}
