'use client'

import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import ColorField from '@/components/editor/ColorField'
import ClassicPhotoField, { type ClassicPhoto } from './ClassicPhotoField'

export type ClassicInter = {
  type: 'photo2' | 'photo1' | 'photoText'
  photos?: ClassicPhoto[]
  text?: string
  caption?: string
  bg?: ClassicPhoto
  overlayColor?: string
  overlayOpacity?: number
  textSize?: number
  textAlign?: 'left' | 'center' | 'right'
}

interface Props {
  value?: ClassicInter[]
  onChange: (list: ClassicInter[]) => void
  invitationId?: string
}

const TYPES = [
  { id: 'photo2', label: '사진 2장', photos: 2, hasText: true, hasCaption: false, hasBg: true, ratio: 4 / 3, textBase: 18, alignBase: 'center' },
  { id: 'photo1', label: 'FULL 사진', photos: 1, hasText: true, hasCaption: false, hasBg: false, ratio: 5 / 4, textBase: 20, alignBase: 'center' },
  { id: 'photoText', label: '인용구', photos: 1, hasText: true, hasCaption: true, hasBg: true, ratio: 5 / 4, textBase: 21, alignBase: 'left' },
] as const

export default function ClassicInterstitialEditor({ value, onChange, invitationId }: Props) {
  const list = value || []

  const update = (i: number, patch: Partial<ClassicInter>) =>
    onChange(list.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  const setPhoto = (i: number, slot: number, p: ClassicPhoto | null) => {
    const photos = [...(list[i].photos || [])]
    photos[slot] = (p || { url: '' }) as ClassicPhoto
    update(i, { photos })
  }
  const add = () => onChange([...list, { type: 'photo2', photos: [] }])
  const remove = (i: number) => onChange(list.filter((_, idx) => idx !== i))
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= list.length) return
    const next = [...list]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div className="space-y-4">
      {list.length === 0 && (
        <p className="text-xs text-gray-400">간지 페이지가 없습니다. 비워두면 기본 1종(FULL 사진)이 표시됩니다.</p>
      )}

      {list.map((it, i) => {
        const meta = TYPES.find((t) => t.id === it.type) || TYPES[0]
        return (
          <div key={i} className="rounded-lg border border-gray-200 p-4 bg-gray-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">간지 {i + 1}</span>
              <div className="flex items-center gap-2 text-[11px] text-gray-400">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="disabled:opacity-30 hover:text-gray-700">↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1} className="disabled:opacity-30 hover:text-gray-700">↓</button>
                <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-500">삭제</button>
              </div>
            </div>

            <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
              {TYPES.map((t) => {
                const active = it.type === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => update(i, { type: t.id })}
                    className={`px-3 py-1.5 text-xs transition-colors ${active ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:text-gray-800'}`}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>

            <div className="space-y-3">
              {Array.from({ length: meta.photos }).map((_, slot) => (
                <ClassicPhotoField
                  key={slot}
                  value={it.photos?.[slot]}
                  onChange={(p) => setPhoto(i, slot, p)}
                  invitationId={invitationId}
                  aspectRatio={meta.ratio}
                  containerWidth={200}
                  label={meta.photos > 1 ? `사진 ${slot + 1}` : undefined}
                />
              ))}
            </div>

            {meta.hasText && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-700">{it.type === 'photoText' ? '인용문' : '문구 (선택)'}</span>
                <Textarea
                  value={it.text || ''}
                  onChange={(e) => update(i, { text: e.target.value })}
                  placeholder={it.type === 'photoText' ? '함께한 모든 순간이\n우리의 이야기가 되었습니다.' : '사진 위에 얹을 짧은 문구\n(줄바꿈 반영됩니다)'}
                  rows={3}
                />
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-[11px] text-gray-500 mb-1"><span>글자 크기</span><span>{it.textSize ?? meta.textBase}px</span></div>
                    <input
                      type="range"
                      min={12}
                      max={36}
                      value={it.textSize ?? meta.textBase}
                      onChange={(e) => update(i, { textSize: Number(e.target.value) })}
                      className="w-full accent-gray-900"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-gray-500">정렬</span>
                    <div className="inline-flex rounded-md border border-gray-200 overflow-hidden">
                      {([
                        { id: 'left', label: '좌' },
                        { id: 'center', label: '중앙' },
                        { id: 'right', label: '우' },
                      ] as const).map((opt) => {
                        const active = (it.textAlign ?? meta.alignBase) === opt.id
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => update(i, { textAlign: opt.id })}
                            className={`px-2.5 py-1 text-xs transition-colors ${active ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:text-gray-800'}`}
                          >
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {meta.hasCaption && (
              <div className="space-y-1.5">
                <span className="text-sm font-medium text-gray-700">출처 / 서명 (선택)</span>
                <Input value={it.caption || ''} onChange={(e) => update(i, { caption: e.target.value })} placeholder="신랑 & 신부" />
              </div>
            )}

            {meta.hasBg && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-700">풀화면 배경 · 오버레이</p>
                  <p className="text-[10px] text-gray-400 leading-tight">선택 시 이 간지 페이지의 전체 배경으로 사용됩니다.</p>
                </div>
                <ClassicPhotoField
                  value={it.bg}
                  onChange={(p) => update(i, { bg: p || undefined })}
                  invitationId={invitationId}
                  aspectRatio={16 / 10}
                  containerWidth={200}
                />
                <div className="flex items-center gap-3">
                  <ColorField
                    label="오버레이 색상"
                    value={it.overlayColor || '#1C100D'}
                    onChange={(hex) => update(i, { overlayColor: hex })}
                  />
                  <div className="flex-1">
                    <div className="flex justify-between text-[11px] text-gray-500 mb-1"><span>오버레이 투명도</span><span>{Math.round((it.overlayOpacity ?? 0.4) * 100)}%</span></div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round((it.overlayOpacity ?? 0.4) * 100)}
                      onChange={(e) => update(i, { overlayOpacity: Number(e.target.value) / 100 })}
                      className="w-full accent-gray-900"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}

      <button
        type="button"
        onClick={add}
        className="w-full py-2.5 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
      >
        + 간지 추가
      </button>
    </div>
  )
}
