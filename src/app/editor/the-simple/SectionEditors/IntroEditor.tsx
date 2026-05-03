'use client'

import { useState } from 'react'
import type { SectionContents, ImageWithSettings, TheSimpleImageSettings } from '../page'
import ImageZoomEditor from '@/components/editor/ImageZoomEditor'
import { uploadImage } from '@/lib/imageUpload'

interface IntroEditorProps {
  value: SectionContents['intro']
  variant?: number
  onChange: (next: SectionContents['intro']) => void
}

const DEFAULT_SETTINGS: TheSimpleImageSettings = { scale: 1, positionX: 0, positionY: 0 }

/** hex → {r, g, b} */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  }
}

/** rgba(r,g,b,a) 문자열에서 hex + opacity 추출 */
function parseRgba(rgba: string): { hex: string; opacity: number } {
  const m = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/)
  if (!m) return { hex: '#000000', opacity: 40 }
  const r = parseInt(m[1]), g = parseInt(m[2]), b = parseInt(m[3])
  const a = m[4] !== undefined ? parseFloat(m[4]) : 1
  const toHex = (n: number) => n.toString(16).padStart(2, '0')
  return { hex: `#${toHex(r)}${toHex(g)}${toHex(b)}`, opacity: Math.round(a * 100) }
}

/**
 * 인트로 섹션 에디터 — 커버 / 타이틀 / 본문 + 배경 이미지(V1 Full Cover용) 편집
 */
export default function IntroEditor({ value, variant, onChange }: IntroEditorProps) {
  const [uploading, setUploading] = useState(false)

  const update = (patch: Partial<SectionContents['intro']>) => {
    onChange({ ...value, ...patch })
  }

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    try {
      const result = await uploadImage(file)
      if (result.success && result.webUrl) {
        const nextPhoto: ImageWithSettings = {
          url: result.webUrl,
          settings: { ...DEFAULT_SETTINGS },
        }
        update({ photo: nextPhoto })
      } else {
        alert(result.error || '업로드에 실패했습니다.')
      }
    } catch (err) {
      console.error('Upload error:', err)
      alert('업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemovePhoto = () => {
    update({ photo: undefined })
  }

  const handleSettingsUpdate = (patch: Partial<TheSimpleImageSettings>) => {
    if (!value.photo) return
    update({
      photo: {
        url: value.photo.url,
        settings: { ...value.photo.settings, ...patch },
      },
    })
  }

  return (
    <div className="space-y-2.5">
      <label className="block">
        <span className="text-[10px] uppercase tracking-wider text-stone-400">상단 문구</span>
        <input
          type="text"
          value={value.eyebrow}
          onChange={(e) => update({ eyebrow: e.target.value })}
          placeholder="The Simple · Invitation"
          className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
        />
      </label>

      {/* 이름 표시 선택 */}
      <div className="space-y-1.5 pt-1">
        <div className="text-[10px] uppercase tracking-wider text-stone-400">이름 표시</div>
        <div className="flex gap-1.5">
          {([
            { key: 'korean' as const, label: '한글' },
            { key: 'english' as const, label: '영문' },
            { key: 'custom' as const, label: '커스텀' },
          ]).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => update({ showNames: key })}
              className={`flex-1 text-[11px] py-1.5 rounded-md border transition-colors ${
                (value.showNames || 'korean') === key
                  ? 'border-stone-800 bg-stone-800 text-white'
                  : 'border-stone-200 text-stone-500 hover:border-stone-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {value.showNames === 'custom' && (
          <textarea
            value={value.customNames ?? ''}
            onChange={(e) => update({ customNames: e.target.value })}
            rows={2}
            placeholder={'예: Jihun\n    & Seoyeon'}
            className="mt-1.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white leading-relaxed resize-none"
          />
        )}
      </div>

      {/* 텍스트 위치 — 배경 이미지가 있을 때만 표시 */}
      {value.photo && (
        <div className="space-y-1.5 pt-1">
          <div className="text-[10px] uppercase tracking-wider text-stone-400">텍스트 위치</div>
          <div className="flex gap-1.5">
            {([
              { key: 'top' as const, label: '상단' },
              { key: 'center' as const, label: '중앙' },
              { key: 'bottom' as const, label: '하단' },
            ]).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => update({ textPosition: key })}
                className={`flex-1 text-[11px] py-1.5 rounded-md border transition-colors ${
                  (value.textPosition || 'center') === key
                    ? 'border-stone-800 bg-stone-800 text-white'
                    : 'border-stone-200 text-stone-500 hover:border-stone-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 배경 이미지 (전체 variant 적용) */}
      <div className="space-y-2 pt-1">
        <div className="text-[10px] uppercase tracking-wider text-stone-500">
          배경 이미지 (전체 적용)
        </div>
        {value.photo ? (
          <div className="space-y-2">
            <ImageZoomEditor
              imageUrl={value.photo.url}
              scale={value.photo.settings.scale ?? 1}
              positionX={value.photo.settings.positionX ?? 0}
              positionY={value.photo.settings.positionY ?? 0}
              onUpdate={(s) => handleSettingsUpdate(s)}
              aspectRatio={16 / 9}
              containerWidth={220}
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
                    if (f) handleFileUpload(f)
                    e.target.value = ''
                  }}
                />
              </label>
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="text-[10px] text-stone-500 border border-stone-200 rounded px-2 py-1 hover:bg-stone-50"
              >
                삭제
              </button>
            </div>
          </div>
        ) : (
          <>
          <label className="block">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFileUpload(f)
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
                <>+ 배경 이미지 업로드 (9:16 권장)</>
              )}
            </div>
          </label>
          <p className="text-[10px] text-stone-400 leading-relaxed">
            배경 이미지를 넣지 않으면 블랙 버전으로 표시됩니다
          </p>
          </>
        )}
      </div>

      {/* 배경 색상 — 항상 표시 */}
      <div className="space-y-2 pt-1">
        <div className="text-[10px] uppercase tracking-wider text-stone-500">배경 색상</div>
        <p className="text-[10px] text-stone-400 leading-relaxed">
          인트로 영역의 기본 배경색을 변경합니다
        </p>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value.bgColor || '#000000'}
            onChange={(e) => update({ bgColor: e.target.value })}
            className="w-7 h-7 rounded border border-stone-200 cursor-pointer p-0.5"
          />
          <span className="text-[10px] text-stone-400">{value.bgColor || '#000000'}</span>
        </div>
      </div>

      {/* 글자 색상 — 블랙 / 화이트 */}
      <div className="space-y-1.5 pt-1">
        <div className="text-[10px] uppercase tracking-wider text-stone-500">글자 색상</div>
        <div className="flex gap-1.5">
          {([
            { key: 'dark' as const, label: '블랙', swatch: '#1a1a1a' },
            { key: 'light' as const, label: '화이트', swatch: '#ffffff' },
          ]).map(({ key, label, swatch }) => {
            const defaultColor = variant === 10 ? 'dark' : 'light'
            const active = (value.textColor || defaultColor) === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => update({ textColor: key })}
                className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] py-1.5 rounded-md border transition-colors ${
                  active
                    ? 'border-stone-800 bg-stone-800 text-white'
                    : 'border-stone-200 text-stone-500 hover:border-stone-400'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full border shrink-0"
                  style={{ background: swatch, borderColor: active ? 'rgba(255,255,255,0.4)' : '#d6d3d1' }}
                />
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 오버레이 — 사진 있을 때만 */}
      {value.photo && (
        <div className="space-y-2 pt-1">
          <div className="text-[10px] uppercase tracking-wider text-stone-500">오버레이</div>
          <p className="text-[10px] text-stone-400 leading-relaxed">
            사진 위에 색상을 덧씌워 텍스트 가독성을 조절합니다
          </p>
          {(() => {
            const parsed = parseRgba(value.overlayColor || 'rgba(0,0,0,0.4)')
            return (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={parsed.hex}
                    onChange={(e) => {
                      const { r, g, b } = hexToRgb(e.target.value)
                      update({ overlayColor: `rgba(${r},${g},${b},${parsed.opacity / 100})` })
                    }}
                    className="w-7 h-7 rounded border border-stone-200 cursor-pointer p-0.5"
                  />
                  <span className="text-[10px] text-stone-400">{parsed.hex}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-stone-400 shrink-0 w-10">투명도</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={parsed.opacity}
                    onChange={(e) => {
                      const { r, g, b } = hexToRgb(parsed.hex)
                      const a = parseInt(e.target.value) / 100
                      update({ overlayColor: `rgba(${r},${g},${b},${a})` })
                    }}
                    className="flex-1 h-1 accent-stone-600"
                  />
                  <span className="text-[10px] text-stone-400 w-8 text-right">{parsed.opacity}%</span>
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
