'use client'

import { useState, useRef, useEffect } from 'react'
import { useThankYouEditorStore } from '@/store/thankYouEditorStore'

export default function ThankYouStep4Message() {
  const { data, updateClosingLine, updateField } = useThankYouEditorStore()
  const photoShare = data.photoShare || { enabled: false, message: '결혼식에서 찍은 사진들을 공유해주세요.\n여러분의 시선으로 담긴 우리의 결혼식,\n소중한 추억으로 간직하겠습니다.', url: '', buttonText: '사진 공유하기' }

  // closingLines: [제목, 본문1, 본문2, 본문3, 서명]
  // 본문 1~3을 하나의 textarea로 합쳐서 표시
  // 로컬 state로 관리해서 입력 중 줄바꿈이 사라지지 않도록 함
  const [bodyText, setBodyText] = useState(() =>
    (data.closingLines.slice(1, 4) || []).filter(Boolean).join('\n\n')
  )
  const isLocalEdit = useRef(false)

  // 외부 변경(DB 로드 등)시 동기화
  useEffect(() => {
    if (isLocalEdit.current) {
      isLocalEdit.current = false
      return
    }
    setBodyText((data.closingLines.slice(1, 4) || []).filter(Boolean).join('\n\n'))
  }, [data.closingLines])

  const handleBodyChange = (value: string) => {
    isLocalEdit.current = true
    setBodyText(value)
    // 빈 줄(더블 줄바꿈)으로 문단 분리 → closingLines[1], [2], [3]에 매핑
    const paragraphs = value.split('\n\n')
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
        <p className="text-xs text-gray-400 mb-2">감사의 마음을 전하는 내용을 작성해주세요. Enter로 줄바꿈, 빈 줄(Enter 2번)로 문단을 나누면 최대 3개 문단이 순서대로 나타납니다. 글자수 제한은 없습니다.</p>
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

      {/* 사진 공유 */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => updateField('photoShare', { ...photoShare, enabled: !photoShare.enabled })}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">📸</span>
            <div className="text-left">
              <p className="text-sm font-medium text-[#2C2824]">사진 공유 요청</p>
              <p className="text-xs text-gray-400">감사 인사 후 사진 공유 팝업이 표시됩니다</p>
            </div>
          </div>
          <div className={`w-10 h-6 rounded-full transition-colors relative ${photoShare.enabled ? 'bg-[#A37E69]' : 'bg-gray-200'}`}>
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${photoShare.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </div>
        </button>

        {photoShare.enabled && (
          <div className="p-4 pt-0 space-y-4 border-t border-gray-100">
            <div className="pt-4">
              <label className="block text-sm font-medium text-[#2C2824] mb-2">안내 메시지</label>
              <textarea
                value={photoShare.message}
                onChange={(e) => updateField('photoShare', { ...photoShare, message: e.target.value })}
                placeholder="결혼식에서 찍은 사진들을 공유해주세요."
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#A37E69] focus:ring-1 focus:ring-[#A37E69]/20 transition-colors resize-none leading-relaxed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2C2824] mb-2">공유 받을 링크 (URL)</label>
              <input
                type="url"
                value={photoShare.url}
                onChange={(e) => updateField('photoShare', { ...photoShare, url: e.target.value })}
                placeholder="https://photos.google.com/share/..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#A37E69] focus:ring-1 focus:ring-[#A37E69]/20 transition-colors"
              />
              <p className="text-xs text-gray-400 mt-1.5">구글 포토, 네이버 MYBOX 등 공유 앨범 링크를 입력하세요</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2C2824] mb-2">버튼 텍스트</label>
              <input
                type="text"
                value={photoShare.buttonText}
                onChange={(e) => updateField('photoShare', { ...photoShare, buttonText: e.target.value })}
                placeholder="사진 공유하기"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#A37E69] focus:ring-1 focus:ring-[#A37E69]/20 transition-colors"
              />
            </div>
          </div>
        )}
      </div>

      {/* 미리보기 안내 */}
      <div className="p-4 bg-gray-50 rounded-xl">
        <p className="text-xs text-gray-500 leading-relaxed">
          스크롤 마지막에 제목 → 본문(문단별) → 서명 순서로 한 줄씩 나타납니다.
          <br />Enter로 줄바꿈, 빈 줄(Enter 2번)로 문단 분리 시 최대 3개 문단이 각각 애니메이션됩니다.
        </p>
      </div>
    </div>
  )
}
