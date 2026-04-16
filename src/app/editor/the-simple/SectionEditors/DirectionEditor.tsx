'use client'

import type { SectionContents } from '../page'

interface DirectionEditorProps {
  value: SectionContents['direction']
  onChange: (next: SectionContents['direction']) => void
}

const TRANSPORT_FIELDS = [
  { key: 'car' as const, label: '자가용/주차', icon: '🅿️' },
  { key: 'bus' as const, label: '버스', icon: '🚌' },
  { key: 'subway' as const, label: '지하철', icon: '🚇' },
  { key: 'train' as const, label: '기차', icon: '🚂' },
  { key: 'expressBus' as const, label: '고속버스', icon: '🚍' },
]

export default function DirectionEditor({ value, onChange }: DirectionEditorProps) {
  const transport = value.transport || {}

  const updateTransport = (key: string, text: string) => {
    const next = { ...transport, [key]: text }
    // Remove empty keys
    if (!text) delete next[key as keyof typeof next]
    onChange({
      ...value,
      transport: Object.keys(next).length > 0 ? next : undefined,
    })
  }

  return (
    <div className="space-y-2.5">
      <p className="text-[10px] text-stone-400 leading-relaxed">
        예식장 이름 · 주소는 상단 &quot;기본 정보&quot;에서 편집하세요.
      </p>
      <label className="block">
        <span className="text-[10px] uppercase tracking-wider text-stone-400">Eyebrow</span>
        <input
          type="text"
          value={value.eyebrow}
          onChange={(e) => onChange({ ...value, eyebrow: e.target.value })}
          placeholder="Direction"
          className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
        />
      </label>

      <div className="pt-2 border-t border-stone-100">
        <p className="text-[10px] uppercase tracking-wider text-stone-400 mb-2">교통편 안내</p>
        <p className="text-[10px] text-stone-400 mb-3">입력한 항목만 청첩장에 표시됩니다.</p>
        {TRANSPORT_FIELDS.map((field) => (
          <label key={field.key} className="block mb-2.5">
            <span className="text-[10px] text-stone-500">
              {field.icon} {field.label}
            </span>
            <textarea
              value={transport[field.key] || ''}
              onChange={(e) => updateTransport(field.key, e.target.value)}
              placeholder={`${field.label} 안내를 입력하세요`}
              rows={2}
              className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white resize-none"
            />
          </label>
        ))}

        <div className="mt-3 pt-2 border-t border-stone-100">
          <span className="text-[10px] text-stone-500">📝 추가 안내사항</span>
          <input
            type="text"
            value={transport.customLabel || ''}
            onChange={(e) => updateTransport('customLabel', e.target.value)}
            placeholder="제목 (예: 셔틀버스, 전세버스)"
            className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white mb-1"
          />
          <textarea
            value={transport.custom || ''}
            onChange={(e) => updateTransport('custom', e.target.value)}
            placeholder="내용을 입력하세요"
            rows={2}
            className="w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white resize-none"
          />
        </div>
      </div>
    </div>
  )
}
