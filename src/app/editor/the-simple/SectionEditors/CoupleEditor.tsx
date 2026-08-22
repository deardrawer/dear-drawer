'use client'

import { useState } from 'react'
import type { SectionContents, ImageWithSettings, TheSimpleImageSettings } from '../page'
import ImageZoomEditor from '@/components/editor/ImageZoomEditor'
import { uploadImage } from '@/lib/imageUpload'

interface CoupleEditorProps {
  value: SectionContents['couple']
  onChange: (next: SectionContents['couple']) => void
}

const MAX_PHOTOS = 5
const DEFAULT_SETTINGS: TheSimpleImageSettings = { scale: 1, positionX: 0, positionY: 0 }

/**
 * photos 배열 우선, 없으면 기존 photo를 배열로 변환 (하위 호환)
 */
function getPhotosArray(person: { photo?: ImageWithSettings; photos?: ImageWithSettings[] }): ImageWithSettings[] {
  if (person.photos && person.photos.length > 0) return person.photos
  if (person.photo) return [person.photo]
  return []
}

/**
 * 커플 소개 섹션 에디터
 * - 이름은 상단 "기본 정보"에서 편집
 * - 역할(Role)과 짧은 소개 + 신랑/신부 사진 각 최대 5장
 */
export default function CoupleEditor({ value, onChange }: CoupleEditorProps) {
  const [uploading, setUploading] = useState<'groom' | 'bride' | null>(null)
  // 선택된 사진 인덱스 (크롭 편집용)
  const [selectedIdx, setSelectedIdx] = useState<Record<'groom' | 'bride', number>>({ groom: 0, bride: 0 })
  // 태그 입력 로컬 state (blur 시에만 배열로 변환)
  const [groomTagsRaw, setGroomTagsRaw] = useState((value.groom.tags || []).join(', '))
  const [brideTagsRaw, setBrideTagsRaw] = useState((value.bride.tags || []).join(', '))

  // 복수 선택 지원: 남은 슬롯만큼 순차 업로드 후 한 번에 반영
  const handleFilesUpload = async (side: 'groom' | 'bride', files: File[]) => {
    const currentPhotos = getPhotosArray(value[side])
    const remain = MAX_PHOTOS - currentPhotos.length
    if (remain <= 0) {
      alert(`최대 ${MAX_PHOTOS}장까지 업로드할 수 있습니다.`)
      return
    }
    if (files.length > remain) {
      alert(`최대 ${MAX_PHOTOS}장까지 가능하여 앞의 ${remain}장만 업로드합니다.`)
    }
    const targets = files.slice(0, remain)
    setUploading(side)
    try {
      const uploaded: ImageWithSettings[] = []
      for (const file of targets) {
        const result = await uploadImage(file)
        if (result.success && result.webUrl) {
          uploaded.push({ url: result.webUrl, settings: { ...DEFAULT_SETTINGS } })
        } else {
          alert(result.error || `${file.name} 업로드에 실패했습니다.`)
        }
      }
      if (uploaded.length > 0) {
        const nextPhotos = [...currentPhotos, ...uploaded]
        onChange({
          ...value,
          [side]: {
            ...value[side],
            photos: nextPhotos,
            photo: nextPhotos[0], // 하위 호환: 첫 번째 사진을 photo에도 유지
          },
        })
        // 마지막으로 추가된 사진 선택
        setSelectedIdx((prev) => ({ ...prev, [side]: nextPhotos.length - 1 }))
      }
    } catch (err) {
      console.error('Upload error:', err)
      alert('업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(null)
    }
  }

  // 사진 순서 변경 (선택된 사진을 앞/뒤로 한 칸 이동)
  const handleMovePhoto = (side: 'groom' | 'bride', index: number, dir: -1 | 1) => {
    const currentPhotos = getPhotosArray(value[side])
    const to = index + dir
    if (to < 0 || to >= currentPhotos.length) return
    const nextPhotos = [...currentPhotos]
    ;[nextPhotos[index], nextPhotos[to]] = [nextPhotos[to], nextPhotos[index]]
    onChange({
      ...value,
      [side]: {
        ...value[side],
        photos: nextPhotos,
        photo: nextPhotos[0] || undefined,
      },
    })
    setSelectedIdx((prev) => ({ ...prev, [side]: to }))
  }

  // 선택된 사진을 새 파일로 교체 (크롭 설정 초기화)
  const handleReplacePhoto = async (side: 'groom' | 'bride', index: number, file: File) => {
    setUploading(side)
    try {
      const result = await uploadImage(file)
      if (result.success && result.webUrl) {
        const currentPhotos = getPhotosArray(value[side])
        const nextPhotos = currentPhotos.map((p, i) =>
          i === index ? { url: result.webUrl as string, settings: { ...DEFAULT_SETTINGS } } : p
        )
        onChange({
          ...value,
          [side]: {
            ...value[side],
            photos: nextPhotos,
            photo: nextPhotos[0] || undefined,
          },
        })
      } else {
        alert(result.error || '업로드에 실패했습니다.')
      }
    } catch (err) {
      console.error('Upload error:', err)
      alert('업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(null)
    }
  }

  const handleRemovePhoto = (side: 'groom' | 'bride', index: number) => {
    const currentPhotos = getPhotosArray(value[side])
    const nextPhotos = currentPhotos.filter((_, i) => i !== index)
    onChange({
      ...value,
      [side]: {
        ...value[side],
        photos: nextPhotos,
        photo: nextPhotos[0] || undefined,
      },
    })
    // 선택 인덱스 보정
    setSelectedIdx((prev) => ({
      ...prev,
      [side]: Math.min(prev[side], Math.max(0, nextPhotos.length - 1)),
    }))
  }

  const handleSettingsUpdate = (
    side: 'groom' | 'bride',
    index: number,
    patch: Partial<TheSimpleImageSettings>
  ) => {
    const currentPhotos = getPhotosArray(value[side])
    const target = currentPhotos[index]
    if (!target) return
    const updatedPhotos = currentPhotos.map((p, i) =>
      i === index ? { url: p.url, settings: { ...p.settings, ...patch } } : p
    )
    onChange({
      ...value,
      [side]: {
        ...value[side],
        photos: updatedPhotos,
        photo: updatedPhotos[0] || undefined,
      },
    })
  }

  const renderPhotoSection = (side: 'groom' | 'bride', label: string) => {
    const photos = getPhotosArray(value[side])
    const isUploading = uploading === side
    const selIdx = Math.min(selectedIdx[side], Math.max(0, photos.length - 1))
    const selectedPhoto = photos[selIdx]

    return (
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-stone-500">
          {label} 사진 (최대 {MAX_PHOTOS}장)
        </div>

        {/* 썸네일 행 */}
        {photos.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {photos.map((photo, i) => (
              <div
                key={i}
                className="relative group cursor-pointer"
                onClick={() => setSelectedIdx((prev) => ({ ...prev, [side]: i }))}
              >
                <div
                  className={`w-12 h-12 rounded overflow-hidden border-2 transition-colors ${
                    i === selIdx ? 'border-stone-600' : 'border-stone-200'
                  }`}
                  style={{
                    backgroundImage: `url(${photo.url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                {/* 삭제 버튼 */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemovePhoto(side, i)
                  }}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-stone-600 text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  X
                </button>
              </div>
            ))}

            {/* 추가 버튼 (< MAX_PHOTOS일 때만) */}
            {photos.length < MAX_PHOTOS && (
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  disabled={isUploading}
                  onChange={(e) => {
                    const files = e.target.files ? Array.from(e.target.files) : [] // FileList는 live — 먼저 복사
                    e.target.value = ''
                    if (files.length > 0) handleFilesUpload(side, files)
                  }}
                />
                <div
                  className={`w-12 h-12 rounded border-2 border-dashed flex items-center justify-center text-[14px] transition-colors ${
                    isUploading
                      ? 'border-stone-200 text-stone-300 cursor-not-allowed'
                      : 'border-stone-300 text-stone-400 hover:border-stone-500 hover:text-stone-600'
                  }`}
                >
                  {isUploading ? (
                    <span className="animate-spin h-3 w-3 border-2 border-stone-400 border-t-transparent rounded-full" />
                  ) : (
                    '+'
                  )}
                </div>
              </label>
            )}
          </div>
        )}

        {/* 선택된 사진 크롭/줌 편집 */}
        {selectedPhoto && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-stone-400">
                {selIdx + 1}/{photos.length} 사진 편집
              </span>
              {photos.length > 1 && (
                <span className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMovePhoto(side, selIdx, -1)}
                    disabled={selIdx === 0}
                    className={`px-1.5 py-0.5 rounded border text-[9px] transition-colors ${selIdx === 0 ? 'border-stone-200 text-stone-300 cursor-not-allowed' : 'border-stone-300 text-stone-500 hover:border-stone-500 hover:text-stone-700'}`}
                  >
                    ← 앞으로
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMovePhoto(side, selIdx, 1)}
                    disabled={selIdx === photos.length - 1}
                    className={`px-1.5 py-0.5 rounded border text-[9px] transition-colors ${selIdx === photos.length - 1 ? 'border-stone-200 text-stone-300 cursor-not-allowed' : 'border-stone-300 text-stone-500 hover:border-stone-500 hover:text-stone-700'}`}
                  >
                    뒤로 →
                  </button>
                </span>
              )}
            </div>
            <ImageZoomEditor
              imageUrl={selectedPhoto.url}
              scale={selectedPhoto.settings.scale ?? 1}
              positionX={selectedPhoto.settings.positionX ?? 0}
              positionY={selectedPhoto.settings.positionY ?? 0}
              onUpdate={(s) => handleSettingsUpdate(side, selIdx, s)}
              aspectRatio={4 / 3}
              containerWidth={220}
            />
            {/* 선택된 사진 변경 · 삭제 */}
            <div className="flex gap-1.5 pt-1">
              <label className={`flex-1 text-center px-2 py-1.5 rounded border text-[10px] transition-colors ${isUploading ? 'border-stone-200 text-stone-300 cursor-not-allowed' : 'border-stone-300 text-stone-500 hover:border-stone-500 hover:text-stone-700 cursor-pointer'}`}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={isUploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    e.target.value = ''
                    if (f) handleReplacePhoto(side, selIdx, f)
                  }}
                />
                사진 변경
              </label>
              <button
                type="button"
                onClick={() => handleRemovePhoto(side, selIdx)}
                className="flex-1 px-2 py-1.5 rounded border border-stone-300 text-[10px] text-stone-500 hover:border-red-400 hover:text-red-500 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        )}

        {/* 사진 없을 때 업로드 영역 */}
        {photos.length === 0 && (
          <label className="block">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              disabled={isUploading}
              onChange={(e) => {
                const files = e.target.files ? Array.from(e.target.files) : [] // FileList는 live — 먼저 복사
                e.target.value = ''
                if (files.length > 0) handleFilesUpload(side, files)
              }}
            />
            <div
              className={`w-full border-2 border-dashed rounded-md px-4 py-5 text-center text-[11px] transition-colors cursor-pointer ${
                isUploading
                  ? 'border-stone-300 bg-stone-50 text-stone-400 cursor-not-allowed'
                  : 'border-stone-300 text-stone-500 hover:border-stone-500 hover:text-stone-700'
              }`}
            >
              {isUploading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="animate-spin h-3 w-3 border-2 border-stone-400 border-t-transparent rounded-full" />
                  업로드 중
                </span>
              ) : (
                <>+ 사진 업로드 (3:4 비율 권장)</>
              )}
            </div>
          </label>
        )}
      </div>
    )
  }

  const isBrideFirst = value.order === 'bride-first'

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-[10px] uppercase tracking-wider text-stone-400">Eyebrow</span>
        <input
          type="text"
          value={value.eyebrow}
          onChange={(e) => onChange({ ...value, eyebrow: e.target.value })}
          placeholder="The Couple"
          className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
        />
      </label>

      {/* 순서 변경 */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-stone-400">순서</span>
        <button
          type="button"
          onClick={() => onChange({ ...value, order: isBrideFirst ? 'groom-first' : 'bride-first' })}
          className="flex items-center gap-1.5 text-[11px] text-stone-600 border border-stone-200 rounded-md px-2.5 py-1 hover:bg-stone-50 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          {isBrideFirst ? '신부 → 신랑' : '신랑 → 신부'}
        </button>
      </div>

      {/* 신랑 */}
      <div className="rounded-md border border-stone-200 p-2.5 bg-white space-y-2.5">
        <div className="text-[10px] uppercase tracking-wider text-stone-500">Groom</div>
        <label className="block">
          <span className="text-[10px] text-stone-400">역할</span>
          <input
            type="text"
            value={value.groom.role}
            onChange={(e) => onChange({ ...value, groom: { ...value.groom, role: e.target.value } })}
            placeholder="Groom"
            className="mt-0.5 w-full border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-stone-600"
          />
        </label>
        <label className="block">
          <span className="text-[10px] text-stone-400">소개 한 줄</span>
          <textarea
            value={value.groom.bio}
            onChange={(e) => onChange({ ...value, groom: { ...value.groom, bio: e.target.value } })}
            rows={2}
            placeholder="따뜻한 미소가 매력적인 사람"
            className="mt-0.5 w-full border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-stone-600 leading-relaxed resize-none"
          />
        </label>
        <label className="block">
          <span className="text-[10px] text-stone-400">태그 (쉼표로 구분)</span>
          <input
            type="text"
            value={groomTagsRaw}
            onChange={(e) => setGroomTagsRaw(e.target.value)}
            onBlur={() => {
              const tags = groomTagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
              onChange({ ...value, groom: { ...value.groom, tags } })
              setGroomTagsRaw(tags.join(', '))
            }}
            placeholder="#건축가, #고양이집사, #캠핑"
            className="mt-0.5 w-full border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-stone-600"
          />
        </label>
        {renderPhotoSection('groom', '신랑')}
      </div>

      {/* 신부 */}
      <div className="rounded-md border border-stone-200 p-2.5 bg-white space-y-2.5">
        <div className="text-[10px] uppercase tracking-wider text-stone-500">Bride</div>
        <label className="block">
          <span className="text-[10px] text-stone-400">역할</span>
          <input
            type="text"
            value={value.bride.role}
            onChange={(e) => onChange({ ...value, bride: { ...value.bride, role: e.target.value } })}
            placeholder="Bride"
            className="mt-0.5 w-full border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-stone-600"
          />
        </label>
        <label className="block">
          <span className="text-[10px] text-stone-400">소개 한 줄</span>
          <textarea
            value={value.bride.bio}
            onChange={(e) => onChange({ ...value, bride: { ...value.bride, bio: e.target.value } })}
            rows={2}
            placeholder="밝은 에너지로 주변을 환하게 하는 사람"
            className="mt-0.5 w-full border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-stone-600 leading-relaxed resize-none"
          />
        </label>
        <label className="block">
          <span className="text-[10px] text-stone-400">태그 (쉼표로 구분)</span>
          <input
            type="text"
            value={brideTagsRaw}
            onChange={(e) => setBrideTagsRaw(e.target.value)}
            onBlur={() => {
              const tags = brideTagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
              onChange({ ...value, bride: { ...value.bride, tags } })
              setBrideTagsRaw(tags.join(', '))
            }}
            placeholder="#에디터, #오래된책, #커피"
            className="mt-0.5 w-full border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-stone-600"
          />
        </label>
        {renderPhotoSection('bride', '신부')}
      </div>
    </div>
  )
}
