'use client'

import { useState } from 'react'
import type { SectionContents, ImageWithSettings, TheSimpleImageSettings } from '../page'
import ImageZoomEditor from '@/components/editor/ImageZoomEditor'
import { uploadImage } from '@/lib/imageUpload'

interface FamilyEditorProps {
  value: SectionContents['family']
  groomName: string
  brideName: string
  onChange: (next: SectionContents['family']) => void
}

type ParentKey = 'groomFather' | 'groomMother' | 'brideFather' | 'brideMother'

const DEFAULT_SETTINGS: TheSimpleImageSettings = { scale: 1, positionX: 0, positionY: 0 }

export default function FamilyEditor({ value, groomName, brideName, onChange }: FamilyEditorProps) {
  const [uploading, setUploading] = useState(false)

  const handlePhotoUpload = async (file: File) => {
    setUploading(true)
    try {
      const result = await uploadImage(file)
      if (result.success && result.webUrl) {
        onChange({
          ...value,
          photo: { url: result.webUrl, settings: { ...DEFAULT_SETTINGS } },
        })
      } else {
        alert(result.error || '업로드에 실패했습니다.')
      }
    } catch {
      alert('업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const handlePhotoRemove = () => {
    onChange({ ...value, photo: undefined })
  }

  const updateParent = (key: ParentKey, patch: Partial<{ name: string; phone: string; deceased: boolean }>) => {
    onChange({
      ...value,
      [key]: { ...value[key], ...patch },
    })
  }

  const renderParentRow = (key: ParentKey, label: string) => {
    const parent = value[key] || { name: '' }
    return (
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-stone-400 w-10 shrink-0">{label}</span>
        <input
          type="text"
          value={parent.name}
          onChange={(e) => updateParent(key, { name: e.target.value })}
          placeholder="이름"
          className="flex-1 border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-stone-600"
        />
        <label className="flex items-center gap-1 text-[10px] text-stone-500 shrink-0 cursor-pointer">
          <input
            type="checkbox"
            checked={parent.deceased || false}
            onChange={(e) => updateParent(key, { deceased: e.target.checked })}
            className="w-3 h-3 rounded"
          />
          고인
        </label>
      </div>
    )
  }

  const renderPhoneRow = (key: ParentKey, label: string) => {
    const parent = value[key] || { name: '' }
    if (!parent.name) return null
    return (
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-stone-400 w-10 shrink-0">{label}</span>
        <input
          type="tel"
          value={parent.phone || ''}
          onChange={(e) => updateParent(key, { phone: e.target.value })}
          placeholder="010-0000-0000"
          className="flex-1 border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-stone-600"
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Eyebrow */}
      <label className="block">
        <span className="text-[10px] uppercase tracking-wider text-stone-400">Eyebrow</span>
        <input
          type="text"
          value={value.eyebrow}
          onChange={(e) => onChange({ ...value, eyebrow: e.target.value })}
          placeholder="Family"
          className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
        />
      </label>

      {/* 사진 업로드 */}
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-stone-500">사진</div>
        {value.photo?.url ? (
          <div className="space-y-1">
            <div className="relative">
              <ImageZoomEditor
                imageUrl={value.photo.url}
                scale={value.photo.settings.scale ?? 1}
                positionX={value.photo.settings.positionX ?? 0}
                positionY={value.photo.settings.positionY ?? 0}
                onUpdate={(s) =>
                  onChange({
                    ...value,
                    photo: { url: value.photo!.url, settings: { ...value.photo!.settings, ...s } },
                  })
                }
                aspectRatio={3 / 4}
                containerWidth={220}
              />
            </div>
            <button
              type="button"
              onClick={handlePhotoRemove}
              className="text-[10px] text-stone-400 hover:text-red-500 transition-colors"
            >
              사진 삭제
            </button>
          </div>
        ) : (
          <label className="block">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handlePhotoUpload(f)
                e.target.value = ''
              }}
            />
            <div
              className={`w-full border-2 border-dashed rounded-md px-4 py-5 text-center text-[11px] transition-colors cursor-pointer ${
                uploading
                  ? 'border-stone-300 bg-stone-50 text-stone-400 cursor-not-allowed'
                  : 'border-stone-300 text-stone-500 hover:border-stone-500 hover:text-stone-700'
              }`}
            >
              {uploading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="animate-spin h-3 w-3 border-2 border-stone-400 border-t-transparent rounded-full" />
                  업로드 중
                </span>
              ) : (
                <>+ 커플 사진 업로드</>
              )}
            </div>
          </label>
        )}
      </div>

      {/* 신랑 측 */}
      <div className="rounded-md border border-stone-200 p-2.5 bg-white space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-stone-500">
          신랑 측 ({groomName || '신랑'})
        </div>
        {renderParentRow('groomFather', '아버지')}
        {renderParentRow('groomMother', '어머니')}
      </div>

      {/* 신부 측 */}
      <div className="rounded-md border border-stone-200 p-2.5 bg-white space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-stone-500">
          신부 측 ({brideName || '신부'})
        </div>
        {renderParentRow('brideFather', '아버지')}
        {renderParentRow('brideMother', '어머니')}
      </div>

      {/* 고인 표시 스타일 */}
      <div className="space-y-1">
        <div className="text-[10px] uppercase tracking-wider text-stone-500">고인 표시 스타일</div>
        <div className="flex gap-2">
          {(['flower', 'hanja'] as const).map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => onChange({ ...value, deceasedStyle: style })}
              className={`flex-1 text-center py-1.5 px-3 text-xs rounded border transition-colors ${
                (value.deceasedStyle || 'flower') === style
                  ? 'bg-stone-800 text-white border-stone-800'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
              }`}
            >
              {style === 'flower' ? '국화꽃' : '故 한자'}
            </button>
          ))}
        </div>
      </div>

      {/* 연락하기 */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.showContact || false}
            onChange={(e) => onChange({ ...value, showContact: e.target.checked })}
            className="w-3.5 h-3.5 rounded"
          />
          <span className="text-xs text-stone-700">연락하기 버튼 표시</span>
        </label>

        {value.showContact && (
          <div className="rounded-md border border-stone-200 p-2.5 bg-white space-y-2">
            <div className="text-[10px] text-stone-400">전화번호 입력</div>
            {renderPhoneRow('groomFather', '신랑父')}
            {renderPhoneRow('groomMother', '신랑母')}
            {renderPhoneRow('brideFather', '신부父')}
            {renderPhoneRow('brideMother', '신부母')}
          </div>
        )}
      </div>
    </div>
  )
}
