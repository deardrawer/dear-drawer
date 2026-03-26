'use client'

import { useThankYouEditorStore } from '@/store/thankYouEditorStore'

export default function ThankYouStep2Info() {
  const { data, updateField } = useThankYouEditorStore()

  return (
    <div className="p-6 space-y-6">
      {/* 안내 */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-base text-blue-800 font-medium mb-1">기본 정보</p>
        <p className="text-sm text-blue-600">감사장에 표시될 이름, 날짜, 인사말을 입력해주세요.</p>
      </div>

      {/* 이름 */}
      <div>
        <label className="block text-sm font-medium text-[#2C2824] mb-2">
          이름 <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={data.coupleNames}
          onChange={(e) => updateField('coupleNames', e.target.value)}
          placeholder="예: 민준 & 서연"
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
        <p className="text-xs text-gray-400 mt-1.5">인트로 화면에 표시되는 날짜입니다</p>
      </div>

      {/* 히어로 메시지 */}
      <div>
        <label className="block text-sm font-medium text-[#2C2824] mb-2">히어로 메시지</label>
        <input
          type="text"
          value={data.heroMessage}
          onChange={(e) => updateField('heroMessage', e.target.value)}
          placeholder="예: 함께해 주셔서 감사합니다"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#A37E69] focus:ring-1 focus:ring-[#A37E69]/20 transition-colors"
        />
        <p className="text-xs text-gray-400 mt-1.5">첫 화면에 크게 표시되는 감사 메시지입니다</p>
      </div>

      {/* 미리보기 안내 */}
      <div className="p-4 bg-gray-50 rounded-xl">
        <p className="text-xs text-gray-500 leading-relaxed">
          입력한 정보는 감사장 인트로 화면에 표시됩니다.
          <br />스크롤하면 "Thank You" &rarr; 이름 &rarr; 날짜 &rarr; 히어로 메시지 순서로 나타납니다.
        </p>
      </div>
    </div>
  )
}
