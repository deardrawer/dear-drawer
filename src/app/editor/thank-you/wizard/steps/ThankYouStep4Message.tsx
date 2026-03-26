'use client'

import { useThankYouEditorStore } from '@/store/thankYouEditorStore'

const LINE_LABELS = [
  { label: '제목', placeholder: '감사합니다.', desc: '첫 번째로 크게 표시되는 제목' },
  { label: '본문 1', placeholder: '바쁘신 와중에도 저희의 결혼을 축하해주시고...', desc: '감사의 마음을 전하는 첫 문단' },
  { label: '본문 2', placeholder: '여러분과 함께한 그 순간은...', desc: '결혼식 회고' },
  { label: '본문 3', placeholder: '그 마음을 잊지 않고...', desc: '앞으로의 다짐' },
  { label: '서명', placeholder: '민준 & 서연 올림', desc: '마지막에 작게 표시되는 서명' },
]

export default function ThankYouStep4Message() {
  const { data, updateClosingLine } = useThankYouEditorStore()

  return (
    <div className="p-6 space-y-6">
      {/* 안내 */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-base text-amber-800 font-medium mb-1">감사 인사</p>
        <p className="text-sm text-amber-600">커튼이 닫힌 후 한 줄씩 나타나는 감사 메시지입니다.</p>
      </div>

      {/* 5줄 편집 */}
      {LINE_LABELS.map((line, index) => (
        <div key={index}>
          <label className="block text-sm font-medium text-[#2C2824] mb-2">
            {line.label}
          </label>
          <p className="text-xs text-gray-400 mb-2">{line.desc}</p>
          {index === 0 || index === 4 ? (
            <input
              type="text"
              value={data.closingLines[index] || ''}
              onChange={(e) => updateClosingLine(index, e.target.value)}
              placeholder={line.placeholder}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#A37E69] focus:ring-1 focus:ring-[#A37E69]/20 transition-colors"
            />
          ) : (
            <textarea
              value={data.closingLines[index] || ''}
              onChange={(e) => updateClosingLine(index, e.target.value)}
              placeholder={line.placeholder}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#A37E69] focus:ring-1 focus:ring-[#A37E69]/20 transition-colors resize-none"
            />
          )}
        </div>
      ))}

      {/* 미리보기 안내 */}
      <div className="p-4 bg-gray-50 rounded-xl">
        <p className="text-xs text-gray-500 leading-relaxed">
          줄바꿈(\n)은 그대로 표시됩니다.
          <br />스크롤 마지막에 제목 &rarr; 본문 1~3 &rarr; 서명 순서로 한 줄씩 나타납니다.
        </p>
      </div>
    </div>
  )
}
