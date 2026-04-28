'use client'

import { useState } from 'react'
import type { SectionContents, LoveStoryItem, ImageWithSettings, TheSimpleImageSettings } from '../page'
import ImageZoomEditor from '@/components/editor/ImageZoomEditor'
import { uploadImage } from '@/lib/imageUpload'

interface LoveStoryEditorProps {
  value: SectionContents['lovestory']
  onChange: (next: SectionContents['lovestory']) => void
}

const DEFAULT_SETTINGS: TheSimpleImageSettings = { scale: 1, positionX: 0, positionY: 0 }

export default function LoveStoryEditor({ value, onChange }: LoveStoryEditorProps) {
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null)

  const items = value.items ?? [{ body: '' }]

  const updateItems = (next: LoveStoryItem[]) => {
    onChange({ ...value, items: next })
  }

  const updateItem = (index: number, patch: Partial<LoveStoryItem>) => {
    const next = items.map((item, i) => (i === index ? { ...item, ...patch } : item))
    updateItems(next)
  }

  const addItem = () => {
    updateItems([...items, { body: '' }])
  }

  const removeItem = (index: number) => {
    if (items.length <= 1) return
    updateItems(items.filter((_, i) => i !== index))
  }

  const handleUpload = async (index: number, slot: 'photo1' | 'photo2', file: File) => {
    const key = `${index}-${slot}`
    setUploadingSlot(key)
    try {
      const result = await uploadImage(file)
      if (result.success && result.webUrl) {
        updateItem(index, { [slot]: { url: result.webUrl, settings: { ...DEFAULT_SETTINGS } } })
      } else {
        alert(result.error || '업로드에 실패했습니다.')
      }
    } catch (err) {
      console.error('Upload error:', err)
      alert('업로드 중 오류가 발생했습니다.')
    } finally {
      setUploadingSlot(null)
    }
  }

  const handleRemovePhoto = (index: number, slot: 'photo1' | 'photo2') => {
    updateItem(index, { [slot]: undefined })
  }

  const handleSettingsUpdate = (index: number, slot: 'photo1' | 'photo2', patch: Partial<TheSimpleImageSettings>) => {
    const photo = items[index]?.[slot]
    if (!photo) return
    updateItem(index, {
      [slot]: { url: photo.url, settings: { ...photo.settings, ...patch } },
    })
  }

  const renderPhotoSlot = (
    index: number,
    slot: 'photo1' | 'photo2',
    label: string
  ) => {
    const photo = items[index]?.[slot]
    const uploading = uploadingSlot === `${index}-${slot}`
    return (
      <div className="space-y-1.5">
        <div className="text-[10px] uppercase tracking-wider text-stone-500">
          {label}
        </div>
        {photo ? (
          <div className="space-y-1.5">
            <ImageZoomEditor
              imageUrl={photo.url}
              scale={photo.settings.scale ?? 1}
              positionX={photo.settings.positionX ?? 0}
              positionY={photo.settings.positionY ?? 0}
              onUpdate={(s) => handleSettingsUpdate(index, slot, s)}
              aspectRatio={3 / 4}
              containerWidth={200}
            />
            <div className="flex justify-center gap-2">
              <label className="inline-flex items-center text-[10px] text-stone-500 border border-stone-200 rounded px-2 py-1 cursor-pointer hover:bg-stone-50">
                교체
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleUpload(index, slot, f)
                    e.target.value = ''
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => handleRemovePhoto(index, slot)}
                className="text-[10px] text-stone-500 border border-stone-200 rounded px-2 py-1 hover:bg-stone-50"
              >
                삭제
              </button>
            </div>
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
                if (f) handleUpload(index, slot, f)
                e.target.value = ''
              }}
            />
            <div
              className={`w-full border-2 border-dashed rounded-md px-3 py-3 text-center text-[11px] transition-colors cursor-pointer ${
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
                <>+ 사진 (4:3 권장)</>
              )}
            </div>
          </label>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* 토글 옵션 */}
      <div className="rounded-md border border-stone-200 p-2.5 bg-white space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.toggle?.enabled ?? false}
            onChange={(e) =>
              onChange({
                ...value,
                toggle: {
                  enabled: e.target.checked,
                  label: value.toggle?.label || '스토리 보기',
                },
              })
            }
            className="rounded border-stone-300"
          />
          <span className="text-[10px] uppercase tracking-wider text-stone-500">토글 (접기/펼치기)</span>
        </label>
        {value.toggle?.enabled && (
          <>
            <input
              type="text"
              value={value.toggle.label}
              onChange={(e) =>
                onChange({
                  ...value,
                  toggle: { ...value.toggle!, label: e.target.value },
                })
              }
              placeholder="버튼 텍스트"
              className="w-full border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-stone-600"
            />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-stone-400">버튼 스타일</span>
              <div className="flex gap-2 mt-1">
                {([
                  { s: 1, label: '아웃라인', style: { color: '#78716c', border: '1px solid #d6d3d1', borderRadius: 20, padding: '4px 12px', background: 'transparent', fontSize: 9 } },
                  { s: 2, label: '채움', style: { background: '#78716c', color: '#fff', border: 'none', borderRadius: 20, padding: '4px 12px', fontSize: 9 } },
                  { s: 3, label: '밑줄 ▼', style: { background: 'transparent', color: '#78716c', border: 'none', padding: '4px 4px', textDecoration: 'underline', textUnderlineOffset: '3px', fontSize: 9 } },
                  { s: 4, label: '둥근 채움', style: { background: '#44403c', color: '#fff', border: 'none', borderRadius: 8, padding: '4px 12px', fontSize: 9 } },
                ] as const).map(({ s, label: btnLabel, style }) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...value,
                        toggle: { ...value.toggle!, style: s },
                      })
                    }
                    className={`transition-all ${(value.toggle?.style ?? 1) === s ? 'ring-2 ring-stone-500 ring-offset-1' : 'opacity-60 hover:opacity-100'}`}
                    style={style as React.CSSProperties}
                  >
                    {btnLabel}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <label className="block">
        <span className="text-[10px] uppercase tracking-wider text-stone-400">Eyebrow</span>
        <input
          type="text"
          value={value.eyebrow}
          onChange={(e) => onChange({ ...value, eyebrow: e.target.value })}
          placeholder="Love Story"
          className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
        />
      </label>

      {items.map((item, i) => (
        <div
          key={i}
          className="relative border border-stone-200 rounded-md p-3 space-y-2.5 bg-white"
        >
          {/* 아이템 헤더 */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
              Story {i + 1}
            </span>
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="text-[10px] text-stone-400 hover:text-red-500 border border-stone-200 rounded px-1.5 py-0.5"
              >
                삭제
              </button>
            )}
          </div>

          {/* 타이틀 (V5 타임라인용) */}
          <input
            type="text"
            value={item.title || ''}
            onChange={(e) => updateItem(i, { title: e.target.value })}
            placeholder="타이틀 (예: First Meet)"
            className="w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
          />

          {/* 본문 */}
          <textarea
            value={item.body}
            onChange={(e) => updateItem(i, { body: e.target.value })}
            rows={5}
            placeholder="우리의 이야기를 자유롭게 적어주세요."
            className="w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white leading-relaxed resize-none"
          />

          {/* 사진 2장 */}
          <div className="grid grid-cols-2 gap-2">
            {renderPhotoSlot(i, 'photo1', '사진 1')}
            {renderPhotoSlot(i, 'photo2', '사진 2')}
          </div>
        </div>
      ))}

      {/* 스토리 추가 버튼 */}
      <button
        type="button"
        onClick={addItem}
        className="w-full border-2 border-dashed border-stone-300 rounded-md py-2.5 text-xs text-stone-500 hover:border-stone-500 hover:text-stone-700 transition-colors"
      >
        + 스토리 추가
      </button>
    </div>
  )
}
