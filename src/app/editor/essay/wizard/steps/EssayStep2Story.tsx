'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import HighlightTextarea from '@/components/editor/HighlightTextarea'
import type { EssayInvitationData } from '../../page'

interface StepProps {
  data: EssayInvitationData
  updateData: (updates: Partial<EssayInvitationData>) => void
  updateNestedData: (path: string, value: unknown) => void
  invitationId: string | null
}

const inputClass = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black'
const textareaClass = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black resize-none'
const labelClass = 'block text-xs font-medium text-gray-600 mb-1.5'

export default function EssayStep2Story({ data, updateData, updateNestedData }: StepProps) {
  const isStory = data.contentMode === 'story'

  // 챕터 업데이트
  const updateChapter = (index: number, field: string, value: string) => {
    const chapters = [...data.chapters]
    chapters[index] = { ...chapters[index], [field]: value }
    updateData({ chapters })
  }

  const addChapter = () => {
    updateData({ chapters: [...data.chapters, { title: '', subtitle: '', body: '' }] })
  }

  const removeChapter = (index: number) => {
    if (data.chapters.length <= 1) return
    updateData({ chapters: data.chapters.filter((_, i) => i !== index) })
  }

  // 인터뷰 업데이트
  const updateInterview = (index: number, field: string, value: string) => {
    const interviews = [...data.interviews]
    interviews[index] = { ...interviews[index], [field]: value }
    updateData({ interviews })
  }

  const addInterview = () => {
    updateData({ interviews: [...data.interviews, { question: '', answer: '', answerer: 'both' }] })
  }

  const removeInterview = (index: number) => {
    if (data.interviews.length <= 1) return
    updateData({ interviews: data.interviews.filter((_, i) => i !== index) })
  }

  return (
    <div className="p-6 space-y-8">
      {/* 안내 */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
        <p className="text-base text-emerald-800 font-medium mb-1">
          {isStory ? '러브스토리 작성' : '인터뷰 작성'}
        </p>
        <p className="text-sm text-emerald-700">
          {isStory
            ? '챕터별로 두 사람의 이야기를 써내려가세요. 각 챕터가 책의 한 페이지가 됩니다.'
            : 'Q&A 형식으로 서로에 대한 이야기를 나눠보세요. 각 질문이 한 페이지가 됩니다.'
          }
        </p>
      </div>

      {/* Before We Begin (인트로) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Before We Begin</h3>
          <button
            type="button"
            onClick={() => updateNestedData('intro.enabled', !data.intro?.enabled)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              data.intro?.enabled !== false ? 'bg-black' : 'bg-gray-300'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              data.intro?.enabled !== false ? 'translate-x-5' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
        <p className="text-xs text-gray-500">책을 열면 처음 보이는 인트로 페이지입니다.</p>
        {data.intro?.enabled !== false && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-1.5">
              <label className={labelClass}>제목</label>
              <input
                className={inputClass}
                value={data.intro?.title || ''}
                onChange={e => updateNestedData('intro.title', e.target.value)}
                placeholder="우리만의 에세이"
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>부제</label>
              <input
                className={inputClass}
                value={data.intro?.subtitle || ''}
                onChange={e => updateNestedData('intro.subtitle', e.target.value)}
                placeholder="— 사진 없는 청첩장 —"
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>본문</label>
              <textarea
                className={textareaClass}
                rows={6}
                value={data.intro?.body || ''}
                onChange={e => updateNestedData('intro.body', e.target.value)}
                placeholder={'사진이 없는 이유는 단순합니다.\n우리의 이야기가 더 잘 보이길 바라서입니다.\n\n수많은 이미지 속에서\n스쳐 지나가는 대신,\n한 문장이라도 천천히 읽히고 싶었습니다.'}
              />
            </div>
          </div>
        )}
      </section>

      {/* 초대 글귀 (인사말) */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold text-gray-900">초대 글귀</h3>
        <p className="text-xs text-gray-500">책을 펼쳤을 때 처음 보이는 인사말입니다.</p>
        <textarea
          className={textareaClass}
          rows={5}
          value={data.greeting}
          onChange={e => updateData({ greeting: e.target.value })}
          placeholder="소중한 분들을 초대합니다.&#10;&#10;서로 다른 두 사람이 만나&#10;하나의 길을 걸어가려 합니다."
        />
      </section>

      {/* 러브스토리 모드: 챕터 */}
      {isStory && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">챕터</h3>
            <button onClick={addChapter} className="flex items-center gap-1 text-xs text-gray-600 hover:text-black transition-colors px-3 py-1.5 border border-gray-200 rounded-lg">
              <Plus className="w-3.5 h-3.5" />추가
            </button>
          </div>
          {data.chapters.map((ch, i) => (
            <div key={i} className="p-4 border border-gray-200 rounded-lg space-y-3 relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-400">Chapter {String(i + 1).padStart(2, '0')}</span>
                {data.chapters.length > 1 && (
                  <button onClick={() => removeChapter(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className={labelClass}>제목 (한글)</label>
                  <input className={inputClass} value={ch.title} onChange={e => updateChapter(i, 'title', e.target.value)} placeholder="시작" />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>부제 (영문)</label>
                  <input className={inputClass} value={ch.subtitle} onChange={e => updateChapter(i, 'subtitle', e.target.value)} placeholder="The Beginning" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>본문</label>
                <HighlightTextarea
                  value={ch.body}
                  onChange={(val) => updateChapter(i, 'body', val)}
                  placeholder="이 챕터의 이야기를 써주세요...&#10;&#10;줄바꿈으로 단락을 나눌 수 있습니다."
                  rows={6}
                  showHeroButton
                  externalHighlightColor={data.highlightColor || '#FFD700'}
                  onHighlightColorChange={(c) => updateData({ highlightColor: c })}
                />
                <p className="text-xs text-gray-400 text-right">{ch.body.length}자</p>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* 인터뷰 모드: Q&A */}
      {!isStory && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">인터뷰 Q&A</h3>
            <button onClick={addInterview} className="flex items-center gap-1 text-xs text-gray-600 hover:text-black transition-colors px-3 py-1.5 border border-gray-200 rounded-lg">
              <Plus className="w-3.5 h-3.5" />추가
            </button>
          </div>
          {data.interviews.map((qa, i) => (
            <div key={i} className="p-4 border border-gray-200 rounded-lg space-y-3 relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-400">Q.{String(i + 1).padStart(2, '0')}</span>
                {data.interviews.length > 1 && (
                  <button onClick={() => removeInterview(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>질문</label>
                <input className={inputClass} value={qa.question} onChange={e => updateInterview(i, 'question', e.target.value)} placeholder="첫 만남의 첫인상은?" />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>답변</label>
                <textarea
                  className={textareaClass}
                  rows={5}
                  value={qa.answer}
                  onChange={e => updateInterview(i, 'answer', e.target.value)}
                  placeholder="답변을 작성해주세요..."
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>답변자</label>
                <div className="flex gap-2">
                  {(['groom', 'bride', 'both'] as const).map(a => (
                    <button
                      key={a}
                      onClick={() => updateInterview(i, 'answerer', a)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                        qa.answerer === a ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {a === 'groom' ? '신랑' : a === 'bride' ? '신부' : '함께'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* 인용문 */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold text-gray-900">인용문</h3>
        <p className="text-xs text-gray-500">좋아하는 시, 명언, 노래 가사 등을 넣어보세요. (선택)</p>
        <textarea
          className={textareaClass}
          rows={3}
          value={data.quote.text}
          onChange={e => updateNestedData('quote.text', e.target.value)}
          placeholder="&quot;같이 걷는다는 것은&#10;같은 속도로 세상을 바라본다는 뜻이다.&quot;"
        />
        <input
          className={inputClass}
          value={data.quote.author}
          onChange={e => updateNestedData('quote.author', e.target.value)}
          placeholder="작가 또는 출처"
        />
      </section>

      {/* 감사 인사 */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold text-gray-900">감사 인사</h3>
        <p className="text-xs text-gray-500">에필로그처럼 마지막에 표시됩니다. (선택)</p>
        <textarea
          className={textareaClass}
          rows={4}
          value={data.thankYou.message}
          onChange={e => updateNestedData('thankYou.message', e.target.value)}
          placeholder="이 긴 이야기를 끝까지 읽어주셔서&#10;진심으로 감사합니다."
        />
        <input
          className={inputClass}
          value={data.thankYou.sign}
          onChange={e => updateNestedData('thankYou.sign', e.target.value)}
          placeholder="서명 (예: 민준 & 서연 드림)"
        />
      </section>

      {/* 예식 에세이 */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold text-gray-900">예식 일시 에세이</h3>
        <p className="text-xs text-gray-500">이 날을 고른 이유를 에세이처럼 써보세요. (선택)</p>
        <div className="space-y-1.5">
          <label className={labelClass}>제목</label>
          <input
            className={inputClass}
            value={data.wedding.dateEssayTitle || ''}
            onChange={e => updateNestedData('wedding.dateEssayTitle', e.target.value)}
            placeholder="저희 결혼합니다."
          />
        </div>
        <textarea
          className={textareaClass}
          rows={4}
          value={data.wedding.dateEssay}
          onChange={e => updateNestedData('wedding.dateEssay', e.target.value)}
          placeholder="우리가 처음 만났던 계절이&#10;다시 돌아오는 날.&#10;&#10;그때의 설렘을 다시 한번,&#10;이번에는 영원히 간직하고 싶어&#10;이 날을 골랐습니다."
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-semibold text-gray-900">예식 장소 에세이</h3>
        <p className="text-xs text-gray-500">이 장소를 고른 이유를 에세이처럼 써보세요. (선택)</p>
        <div className="space-y-1.5">
          <label className={labelClass}>제목</label>
          <input
            className={inputClass}
            value={data.wedding.venueEssayTitle || ''}
            onChange={e => updateNestedData('wedding.venueEssayTitle', e.target.value)}
            placeholder="초대합니다"
          />
        </div>
        <textarea
          className={textareaClass}
          rows={4}
          value={data.wedding.venueEssay}
          onChange={e => updateNestedData('wedding.venueEssay', e.target.value)}
          placeholder="높은 천장 아래로&#10;따뜻한 빛이 쏟아지던 곳.&#10;&#10;처음 이곳에 왔을 때,&#10;&quot;여기서 우리 결혼식을 하자&quot;&#10;동시에 같은 말을 했습니다."
        />
      </section>
    </div>
  )
}
