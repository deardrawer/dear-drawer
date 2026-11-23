'use client'

import { useThankYouEditorStore } from '@/store/thankYouEditorStore'

export default function ThankYouStep2Info() {
  const { data, updateField } = useThankYouEditorStore()

  return (
    <div className="p-6 space-y-6">
      {/* 이름 */}
      <div>
        <label className="block text-sm font-medium text-[#2C2824] mb-2">
          이름 <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={data.coupleNames}
          onChange={(e) => updateField('coupleNames', e.target.value)}
          placeholder="예: 지훈 & 서연"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#A37E69] focus:ring-1 focus:ring-[#A37E69]/20 transition-colors"
        />
        <p className="text-xs text-gray-400 mt-1.5">&를 기준으로 신랑/신부 이름이 구분됩니다</p>
      </div>

      {/* 날짜 */}
      <div>
        <label className="block text-sm font-medium text-[#2C2824] mb-2">결혼식 날짜</label>
        <input
          type="text"
          value={data.date}
          onChange={(e) => updateField('date', e.target.value)}
          placeholder="예: 2026. 03. 14"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#A37E69] focus:ring-1 focus:ring-[#A37E69]/20 transition-colors"
        />
      </div>

      {/* 히어로 메시지 */}
      <div>
        <label className="block text-sm font-medium text-[#2C2824] mb-2">히어로 메시지</label>
        <textarea
          value={data.heroMessage}
          onChange={(e) => updateField('heroMessage', e.target.value)}
          placeholder="예: 함께해 주셔서 감사합니다"
          rows={2}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#A37E69] focus:ring-1 focus:ring-[#A37E69]/20 transition-colors resize-none"
        />
      </div>
    </div>
  )
}
