'use client'

import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import ClassicPhotoField, { type ClassicPhoto } from './ClassicPhotoField'
import { CLASSIC_GUIDE_DEFAULTS, type ClassicGuideItem } from './classicGuideDefaults'

interface Props {
  sectionEnabled: boolean
  items?: ClassicGuideItem[]
  onSectionToggle: (v: boolean) => void
  onChange: (items: ClassicGuideItem[]) => void
  invitationId?: string
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${on ? 'bg-gray-900' : 'bg-gray-300'}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${on ? 'translate-x-4' : ''}`} />
    </button>
  )
}

/** PARENTS 방식 결혼식 안내 — 섹션 표시 토글 + 항목별(기본 멘트) 토글/제목/본문 + 커스텀 추가 */
export default function ClassicGuideEditor({ sectionEnabled, items, onSectionToggle, onChange, invitationId }: Props) {
  const list: ClassicGuideItem[] = items && items.length ? items : CLASSIC_GUIDE_DEFAULTS
  const update = (i: number, patch: Partial<ClassicGuideItem>) => onChange(list.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  const add = () => onChange([...list, { title: '새 안내', body: '', enabled: true }])
  const remove = (i: number) => onChange(list.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-3">
      {/* 섹션 표시 토글 */}
      <label className="flex items-center justify-between rounded-lg border border-gray-200 p-3 bg-gray-50/50">
        <span className="text-sm font-medium text-gray-700">결혼식 안내 섹션 표시</span>
        <Toggle on={sectionEnabled} onClick={() => onSectionToggle(!sectionEnabled)} />
      </label>

      {sectionEnabled && (
        <>
          {list.map((it, i) => (
            <div key={i} className={`rounded-md border p-3 space-y-2 transition-colors ${it.enabled ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50/40'}`}>
              <div className="flex items-center gap-2">
                <Input value={it.title} onChange={(e) => update(i, { title: e.target.value })} placeholder="안내 제목" className="flex-1 h-8 text-sm" />
                <Toggle on={it.enabled} onClick={() => update(i, { enabled: !it.enabled })} />
                <button type="button" onClick={() => remove(i)} aria-label="삭제" className="p-1 text-gray-400 hover:text-red-500 shrink-0">✕</button>
              </div>
              <Textarea value={it.body} onChange={(e) => update(i, { body: e.target.value })} rows={3} placeholder="안내 본문" className="resize-none text-sm" />
              {it.enabled && (
                <div className="pt-1">
                  <span className="text-sm font-medium text-gray-700">사진 (선택)</span>
                  <ClassicPhotoField
                    value={it.photo}
                    onChange={(p: ClassicPhoto | null) => update(i, { photo: p || undefined })}
                    invitationId={invitationId}
                    aspectRatio={3 / 4}
                    containerWidth={160}
                  />
                </div>
              )}
            </div>
          ))}
          <button type="button" onClick={add} className="w-full py-2.5 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors">+ 안내 항목 추가</button>
        </>
      )}
    </div>
  )
}
