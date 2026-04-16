'use client'

import { Plus, X } from 'lucide-react'
import type { SectionContents } from '../page'

interface InterviewEditorProps {
  value: SectionContents['interview']
  onChange: (next: SectionContents['interview']) => void
}

/**
 * 인터뷰 섹션 에디터 — Q&A 목록을 동적으로 추가/삭제
 */
export default function InterviewEditor({ value, onChange }: InterviewEditorProps) {
  const updateItem = (index: number, patch: Partial<{ question: string; answer: string }>) => {
    onChange({
      ...value,
      items: value.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    })
  }

  const addItem = () => {
    onChange({ ...value, items: [...value.items, { question: '', answer: '' }] })
  }

  const removeItem = (index: number) => {
    onChange({ ...value, items: value.items.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-[10px] uppercase tracking-wider text-stone-400">Eyebrow</span>
        <input
          type="text"
          value={value.eyebrow}
          onChange={(e) => onChange({ ...value, eyebrow: e.target.value })}
          placeholder="Q&A"
          className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
        />
      </label>

      <div className="space-y-2">
        {value.items.map((item, index) => (
          <div
            key={index}
            className="rounded-md border border-stone-200 p-2.5 bg-white space-y-2 relative"
          >
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-wider text-stone-500">
                Q{index + 1}
              </div>
              <button
                type="button"
                onClick={() => removeItem(index)}
                aria-label="질문 삭제"
                className="p-0.5 text-stone-400 hover:text-red-600"
              >
                <X size={12} />
              </button>
            </div>
            <input
              type="text"
              value={item.question}
              onChange={(e) => updateItem(index, { question: e.target.value })}
              placeholder="질문"
              className="w-full border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-stone-600"
            />
            <textarea
              value={item.answer}
              onChange={(e) => updateItem(index, { answer: e.target.value })}
              rows={2}
              placeholder="답변"
              className="w-full border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-stone-600 leading-relaxed resize-none"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="w-full flex items-center justify-center gap-1.5 border border-dashed border-stone-300 rounded-md py-2 text-xs text-stone-500 hover:border-stone-500 hover:text-stone-800 transition-colors"
      >
        <Plus size={13} />
        질문 추가
      </button>

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
                  label: value.toggle?.label || '인터뷰 보기',
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
    </div>
  )
}
