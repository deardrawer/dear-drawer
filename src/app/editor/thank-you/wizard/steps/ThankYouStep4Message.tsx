'use client'

import { useThankYouEditorStore } from '@/store/thankYouEditorStore'

export default function ThankYouStep4Message() {
  const { data, updateClosingLine } = useThankYouEditorStore()

  // closingLines: [제목, 본문1, 본문2, 본문3, 서명]
  // 본문 1~3을 하나의 textarea로 합쳐서 표시
  const bodyText = (data.closingLines.slice(1, 4) || []).filter(Boolean).join('\n\n')

  const handleBodyChange = (value: string) => {
    // 빈 줄(더블 줄바꿈)으로 문단 분리 → closingLines[1], [2], [3]에 매핑
    const paragraphs = value.split('\n\n').map(s => s.trim())
    updateClosingLine(1, paragraphs[0] || '')
    updateClosingLine(2, paragraphs[1] || '')
    updateClosingLine(3, paragraphs[2] || '')
  }

  return (
    <div className="p-6 space-y-6">
      {/* 안내 */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-base text-amber-800 font-medium mb-1">감사 인사</p>
        <p className="text-sm text-amber-600">커튼이 닫힌 후 한 줄씩 나타나는 감사 메시지입니다.</p>
      </div>

      {/* 제목 */}
      <div>
        <label className="block text-sm font-medium text-[#2C2824] mb-2">제목</label>
        <p className="text-xs text-gray-400 mb-2">첫 번째로 크게 표시되는 제목</p>
        <input
          type="text"
          value={data.closingLines[0] || ''}
          onChange={(e) => updateClosingLine(0, e.target.value)}
          placeholder="감사합니다."
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#A37E69] focus:ring-1 focus:ring-[#A37E69]/20 transition-colors"
        />
      </div>

      {/* 본문 (통합) */}
      <div>
        <label className="block text-sm font-medium text-[#2C2824] mb-2">본문</label>
        <p className="text-xs text-gray-400 mb-2">감사의 마음을 전하는 내용을 작성해주세요. 빈 줄로 문단을 나누면 순서대로 나타납니다.</p>
        <textarea
          value={bodyText}
          onChange={(e) => handleBodyChange(e.target.value)}
          placeholder={"바쁘신 와중에도 저희의 결혼을 축하해주시고\n그날을 함께해주셔서 진심으로 감사드립니다.\n\n여러분과 함께한 그 순간은\n저희에게 오래도록 기억될 소중한 시간이었습니다.\n\n그 마음을 잊지 않고,\n천천히 그리고 단단하게\n저희만의 이야기를 이어가겠습니다."}
          rows={8}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#A37E69] focus:ring-1 focus:ring-[#A37E69]/20 transition-colors resize-none leading-relaxed"
        />
      </div>

      {/* 서명 */}
      <div>
        <label className="block text-sm font-medium text-[#2C2824] mb-2">서명</label>
        <p className="text-xs text-gray-400 mb-2">마지막에 작게 표시되는 서명</p>
        <input
          type="text"
          value={data.closingLines[4] || ''}
          onChange={(e) => updateClosingLine(4, e.target.value)}
          placeholder="민준 & 서연 올림"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#A37E69] focus:ring-1 focus:ring-[#A37E69]/20 transition-colors"
        />
      </div>

      {/* 미리보기 안내 */}
      <div className="p-4 bg-gray-50 rounded-xl">
        <p className="text-xs text-gray-500 leading-relaxed">
          스크롤 마지막에 제목 → 본문(문단별) → 서명 순서로 한 줄씩 나타납니다.
          <br />빈 줄로 문단을 나누면 최대 3개 문단이 각각 애니메이션됩니다.
        </p>
      </div>
    </div>
  )
}
