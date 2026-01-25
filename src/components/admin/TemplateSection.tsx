'use client'

import { useState } from 'react'

interface Template {
  id: string
  name: string
  content: string
  is_default: number
}

interface TemplateSectionProps {
  templates: Template[]
  isOpen: boolean
  onToggle: () => void
  onSave: (template: { name: string; content: string }, editingId?: string) => void
  onDelete: (templateId: string) => void
  onShowToast: (message: string) => void
}

// 기본 템플릿 정의
export const DEFAULT_TEMPLATES = [
  {
    name: '기본형',
    content: '항상 저희 가족 챙겨주셔서 감사합니다. {이름}이가 좋은 사람 만나 결혼하게 되었습니다. 꼭 오셔서 축복해 주세요.',
  },
  {
    name: '친척용',
    content: '늘 사랑으로 챙겨주시는 {관계}님께 감사드립니다. {이름}이가 좋은 인연을 만나 결혼하게 되었습니다. 바쁘시더라도 꼭 오셔서 축하해 주세요.',
  },
  {
    name: '직장용',
    content: '바쁘신 와중에도 항상 좋은 말씀 해주셔서 감사합니다. 저희 {이름}이가 결혼하게 되어 알려드립니다. 참석하셔서 자리를 빛내주시면 감사하겠습니다.',
  },
]

export default function TemplateSection({
  templates,
  isOpen,
  onToggle,
  onSave,
  onDelete,
  onShowToast,
}: TemplateSectionProps) {
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [form, setForm] = useState({ name: '', content: '' })

  // 모달 열기 (추가)
  const openAddModal = () => {
    setEditingTemplate(null)
    setForm({ name: '', content: '' })
    setShowModal(true)
  }

  // 모달 열기 (수정)
  const openEditModal = (template: Template) => {
    setEditingTemplate(template)
    setForm({ name: template.name, content: template.content })
    setShowModal(true)
  }

  // 저장
  const handleSave = () => {
    if (!form.name.trim()) {
      onShowToast('템플릿 이름을 입력해주세요')
      return
    }
    if (!form.content.trim()) {
      onShowToast('템플릿 내용을 입력해주세요')
      return
    }

    onSave(form, editingTemplate?.id)
    setShowModal(false)
    setEditingTemplate(null)
    setForm({ name: '', content: '' })
  }

  // 삭제
  const handleDelete = (template: Template) => {
    // 기본 템플릿(is_default=1)은 삭제 불가
    if (template.is_default === 1) {
      onShowToast('기본 템플릿은 삭제할 수 없습니다')
      return
    }
    if (confirm('정말 삭제하시겠습니까?')) {
      onDelete(template.id)
    }
  }

  // 변수 삽입
  const insertVariable = (variable: string) => {
    setForm((prev) => ({
      ...prev,
      content: prev.content + variable,
    }))
  }

  // 미리보기 (변수 치환)
  const getPreviewContent = (content: string) => {
    return content
      .replace(/{이름}/g, '준현')
      .replace(/{관계}/g, '이모')
  }

  return (
    <>
      {/* 아코디언 헤더 */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4"
        style={{
          backgroundColor: '#FFF',
          borderBottom: isOpen ? '1px solid #E8E4DD' : 'none',
          borderRadius: isOpen ? '12px 12px 0 0' : '12px',
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">📝</span>
          <span className="font-semibold" style={{ color: '#2C2C2C' }}>
            인사말 템플릿
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: '#E8E4DD', color: '#666' }}
          >
            {templates.length}
          </span>
        </div>
        <span
          className="transition-transform duration-200"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            color: '#888',
          }}
        >
          ▼
        </span>
      </button>

      {/* 아코디언 콘텐츠 */}
      {isOpen && (
        <div
          className="rounded-b-lg overflow-hidden"
          style={{ backgroundColor: '#FFF' }}
        >
          <div className="p-4 space-y-3">
            {/* 템플릿 목록 */}
            {templates.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm font-medium" style={{ color: '#888' }}>
                  등록된 템플릿이 없습니다
                </p>
                <button
                  onClick={openAddModal}
                  className="mt-4 text-sm font-medium underline"
                  style={{ color: '#C9A962' }}
                >
                  첫 템플릿 추가하기
                </button>
              </div>
            ) : (
              <>
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: '#F5F3EE' }}
                  >
                    {/* 템플릿 헤더 */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold" style={{ color: '#2C2C2C' }}>
                          {template.name}
                        </span>
                        {template.is_default === 1 && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: '#C9A962', color: '#FFF' }}
                          >
                            기본
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {/* 수정 */}
                        <button
                          onClick={() => openEditModal(template)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: '#FFF',
                            color: '#666',
                            border: '1px solid #E8E4DD',
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          수정
                        </button>
                        {/* 삭제 */}
                        <button
                          onClick={() => handleDelete(template)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: template.is_default === 1 ? '#F5F5F5' : '#FEF2F2',
                            color: template.is_default === 1 ? '#BBB' : '#DC2626',
                            border: template.is_default === 1 ? '1px solid #E8E4DD' : '1px solid #FECACA',
                            cursor: template.is_default === 1 ? 'not-allowed' : 'pointer',
                          }}
                          disabled={template.is_default === 1}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                          삭제
                        </button>
                      </div>
                    </div>
                    {/* 템플릿 내용 */}
                    <p
                      className="text-sm leading-relaxed line-clamp-3"
                      style={{ color: '#666' }}
                    >
                      {template.content}
                    </p>
                  </div>
                ))}

                {/* 템플릿 추가 버튼 */}
                <button
                  onClick={openAddModal}
                  className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 mt-4"
                  style={{
                    backgroundColor: '#F5F3EE',
                    color: '#666',
                    border: '1px dashed #D0D0D0',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  템플릿 추가
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 추가/수정 모달 */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-t-2xl p-6 pb-8 max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: '#FFF' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold" style={{ color: '#2C2C2C' }}>
                {editingTemplate ? '템플릿 수정' : '템플릿 추가'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-2xl"
                style={{ color: '#AAA' }}
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* 템플릿 이름 */}
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: '#555' }}>
                  템플릿 이름 *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="예) 친척용, 직장동료용"
                  className="w-full px-4 py-3 rounded-lg border"
                  style={{ borderColor: '#E8E4DD' }}
                />
              </div>

              {/* 변수 버튼 */}
              <div>
                <label className="text-sm font-medium block mb-2" style={{ color: '#555' }}>
                  변수 삽입
                </label>
                <div className="flex flex-wrap gap-2">
                  {['{이름}', '{관계}'].map((variable) => (
                    <button
                      key={variable}
                      onClick={() => insertVariable(variable)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: '#F5F3EE',
                        color: '#666',
                        border: '1px solid #E8E4DD',
                      }}
                    >
                      {variable}
                    </button>
                  ))}
                </div>
                <p className="text-xs mt-2" style={{ color: '#999' }}>
                  변수는 게스트 정보로 자동 치환됩니다
                </p>
              </div>

              {/* 템플릿 내용 */}
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: '#555' }}>
                  인사말 내용 *
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="항상 저희 가족 챙겨주셔서 감사합니다..."
                  rows={5}
                  className="w-full px-4 py-3 rounded-lg border resize-none"
                  style={{ borderColor: '#E8E4DD' }}
                />
              </div>

              {/* 미리보기 */}
              {form.content && (
                <div>
                  <label className="text-sm font-medium block mb-2" style={{ color: '#555' }}>
                    미리보기
                  </label>
                  <div
                    className="p-4 rounded-lg text-sm leading-relaxed"
                    style={{ backgroundColor: '#F5F3EE', color: '#2C2C2C' }}
                  >
                    {getPreviewContent(form.content)}
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#999' }}>
                    * 변수가 예시값으로 치환된 모습입니다
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleSave}
              className="w-full mt-6 py-4 rounded-full text-white font-semibold"
              style={{ backgroundColor: '#C9A962' }}
            >
              {editingTemplate ? '저장하기' : '추가하기'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
