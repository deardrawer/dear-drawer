'use client'

import { useState } from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown, X, Smile } from 'lucide-react'
import { MultiImageUploader } from '@/components/editor/ImageUploader'
import type { FeedInvitationData } from '../../page'

interface StepProps {
  data: FeedInvitationData
  updateData: (updates: Partial<FeedInvitationData>) => void
  updateNestedData: (path: string, value: unknown) => void
  invitationId: string | null
}

const inputClass =
  'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black'
const labelClass = 'block text-xs font-medium text-gray-600 mb-1.5'

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-black' : 'bg-gray-300'}`}
      aria-pressed={checked}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  )
}

// 안내사항 항목 키 목록 (레코드와 동일)
const INFO_KEYS = ['dressCode', 'photoBooth', 'photoShare', 'flowerGift', 'flowerChild', 'wreath', 'shuttle', 'reception'] as const

// 안내사항용 이모지 팔레트
const INFO_EMOJIS = ['📋', '👗', '📸', '🌸', '💐', '🎀', '🚌', '🍽️', '🎵', '🎁', '💌', '🥂', '✨', '🎉', '💒', '🕊️', '🌿', '☕', '🧸', '💍', '🎶', '🪄', '📍', '⏰']

function EmojiPicker({ value, onChange }: { value: string; onChange: (emoji: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-base hover:bg-gray-50 transition-colors"
        title="이모지 변경"
      >
        {value || <Smile className="w-4 h-4 text-gray-400" />}
      </button>
      {open && (
        <div className="absolute top-9 left-0 z-10 bg-white border border-gray-200 rounded-xl shadow-lg p-2 w-[200px]">
          <input
            type="text"
            className="w-full px-2 py-1.5 mb-2 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
            placeholder="이모지 붙여넣기"
            value=""
            onChange={(e) => {
              const v = e.target.value.trim()
              if (v) { onChange(v); setOpen(false) }
            }}
            onPaste={(e) => {
              e.preventDefault()
              const pasted = e.clipboardData.getData('text').trim()
              if (pasted) { onChange(pasted); setOpen(false) }
            }}
          />
          <div className="grid grid-cols-6 gap-1">
            {INFO_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => { onChange(emoji); setOpen(false) }}
                className={`w-7 h-7 rounded-md flex items-center justify-center text-base hover:bg-gray-100 transition-colors ${value === emoji ? 'bg-blue-50 ring-1 ring-blue-300' : ''}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function FeedStep4Stories({
  data,
  updateData,
  updateNestedData,
  invitationId,
}: StepProps) {
  const stories = data.content.stories || []
  const { info } = data.content
  const questions = data.content.guestbookQuestions || []

  // --- Story helpers ---
  const updateStory = (index: number, field: 'image' | 'caption', value: string) => {
    const newStories = [...stories]
    newStories[index] = { ...newStories[index], [field]: value }
    updateNestedData('content.stories', newStories)
  }

  const updateStoryImages = (index: number, newImages: string[]) => {
    const newStories = [...stories]
    newStories[index] = {
      ...newStories[index],
      images: newImages,
      image: newImages[0] || '',
    }
    updateNestedData('content.stories', newStories)
  }

  const addStory = () => {
    if (stories.length >= 10) return
    updateNestedData('content.stories', [...stories, { image: '', images: [], caption: '' }])
  }

  const deleteStory = (index: number) => {
    updateNestedData('content.stories', stories.filter((_, i) => i !== index))
  }

  const moveStory = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= stories.length) return
    const newStories = [...stories]
    const temp = newStories[index]
    newStories[index] = newStories[newIndex]
    newStories[newIndex] = temp
    updateNestedData('content.stories', newStories)
  }

  // --- Guidance helpers ---
  const toggleInfoItem = (key: string) => {
    const current = (info as unknown as Record<string, { enabled: boolean }>)[key]
    updateNestedData(`content.info.${key}.enabled`, !current.enabled)
  }

  // --- Guestbook helpers ---
  const updateQuestion = (index: number, value: string) => {
    const newQ = [...questions]
    newQ[index] = value
    updateNestedData('content.guestbookQuestions', newQ)
  }

  const addQuestion = () => {
    if (questions.length >= 10) return
    updateNestedData('content.guestbookQuestions', [...questions, ''])
  }

  const deleteQuestion = (index: number) => {
    updateNestedData('content.guestbookQuestions', questions.filter((_, i) => i !== index))
  }

  return (
    <div className="p-6 space-y-8">
      {/* 안내 */}
      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <p className="text-base text-orange-800 font-medium mb-1">콘텐츠 작성</p>
        <p className="text-sm text-orange-700">
          인사말, 프로필, 러브스토리 등 청첩장 콘텐츠를 작성해주세요.
        </p>
      </div>

      {/* 인사말 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          💌 인사말
        </h3>

        <div className="space-y-1.5">
          <label className={labelClass}>인사말 문구</label>
          <textarea
            className={`${inputClass} resize-none`}
            rows={5}
            value={data.content.greeting}
            onChange={(e) => updateNestedData('content.greeting', e.target.value)}
            placeholder={'소중한 분들을 초대합니다.\n\n서로 다른 두 사람이 만나\n하나의 길을 걸어가려 합니다.\n함께 축복해 주시면 감사하겠습니다.'}
          />
        </div>
      </section>

      {/* 프로필 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            👫 프로필
          </h3>
          <ToggleSwitch
            checked={data.sectionVisibility?.profile !== false}
            onChange={(checked) => updateNestedData('sectionVisibility.profile', checked)}
          />
        </div>
        {data.sectionVisibility?.profile !== false && <>
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">프로필 사진과 소개 글을 입력하면 인트로 섹션에 표시됩니다.</p>
        </div>

        {/* 신랑 프로필 */}
        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
          <p className="text-sm font-medium text-gray-700">신랑</p>
          <p className="text-xs text-gray-400">최대 4장까지 추가 가능합니다.</p>
          <MultiImageUploader
            images={data.groom.profile.images || (data.groom.profile.image ? [data.groom.profile.image] : [])}
            onChange={(newImages) => {
              updateNestedData('groom.profile.images', newImages)
              updateNestedData('groom.profile.image', newImages[0] || '')
            }}
            invitationId={invitationId || undefined}
            maxImages={4}
            placeholder="프로필 사진 추가"
            aspectRatio="aspect-[4/5]"
            sortable
          />
          <div className="space-y-1.5">
            <label className={labelClass}>소개 제목</label>
            <input
              className={inputClass}
              value={data.groom.profile.subtitle}
              onChange={(e) => updateNestedData('groom.profile.subtitle', e.target.value)}
              placeholder="신부가 소개하는 신랑 🤵 (비워두면 자동 생성)"
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>소개 글</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              value={data.groom.profile.intro}
              onChange={(e) => updateNestedData('groom.profile.intro', e.target.value)}
              placeholder={'처음 만났을 때부터 따뜻한 미소가 인상적이었던 사람.\n항상 제 이야기에 귀 기울여주고, 힘들 때 묵묵히 곁에 있어주는 든든한 사람입니다.'}
            />
          </div>
        </div>

        {/* 신부 프로필 */}
        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
          <p className="text-sm font-medium text-gray-700">신부</p>
          <p className="text-xs text-gray-400">최대 4장까지 추가 가능합니다.</p>
          <MultiImageUploader
            images={data.bride.profile.images || (data.bride.profile.image ? [data.bride.profile.image] : [])}
            onChange={(newImages) => {
              updateNestedData('bride.profile.images', newImages)
              updateNestedData('bride.profile.image', newImages[0] || '')
            }}
            invitationId={invitationId || undefined}
            maxImages={4}
            placeholder="프로필 사진 추가"
            aspectRatio="aspect-[4/5]"
            sortable
          />
          <div className="space-y-1.5">
            <label className={labelClass}>소개 제목</label>
            <input
              className={inputClass}
              value={data.bride.profile.subtitle}
              onChange={(e) => updateNestedData('bride.profile.subtitle', e.target.value)}
              placeholder="신랑이 소개하는 신부 👰 (비워두면 자동 생성)"
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>소개 글</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              value={data.bride.profile.intro}
              onChange={(e) => updateNestedData('bride.profile.intro', e.target.value)}
              placeholder={'밝은 웃음소리가 참 예쁜 사람.\n제가 지칠 때마다 힘이 되어주고, 작은 것에도 감사할 줄 아는 따뜻한 마음의 소유자입니다.'}
            />
          </div>
        </div>
        </>}
      </section>

      {/* 러브스토리 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            💕 러브스토리
          </h3>
          <ToggleSwitch
            checked={data.sectionVisibility?.loveStory !== false}
            onChange={(checked) => updateNestedData('sectionVisibility.loveStory', checked)}
          />
        </div>
        {data.sectionVisibility?.loveStory !== false && <>
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">인스타그램 포스트처럼 사진과 캡션으로 두 사람의 이야기를 들려주세요. 최대 10개까지 추가할 수 있어요.</p>
        </div>

        {/* Empty state */}
        {stories.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-500 mb-1">아직 러브스토리가 없어요</p>
            <p className="text-xs text-gray-400">사진과 캡션으로 사랑 이야기를 들려주세요</p>
          </div>
        )}

        {/* Story list */}
        {stories.map((story, index) => (
          <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
            {/* Story header */}
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">POST {index + 1}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveStory(index, -1)}
                  className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30"
                  aria-label="위로 이동"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={index === stories.length - 1}
                  onClick={() => moveStory(index, 1)}
                  className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30"
                  aria-label="아래로 이동"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteStory(index)}
                  className="p-1.5 rounded hover:bg-red-50 text-red-400"
                  aria-label="포스트 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Story content */}
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 mb-1.5">최대 5장까지 추가 가능합니다.</p>
                <MultiImageUploader
                  images={story.images || (story.image ? [story.image] : [])}
                  onChange={(newImages) => updateStoryImages(index, newImages)}
                  invitationId={invitationId || undefined}
                  maxImages={5}
                  placeholder="사진 추가"
                  aspectRatio="aspect-[4/5]"
                  sortable
                />
              </div>
              <div>
                <label className={labelClass}>캡션</label>
                <textarea
                  value={story.caption}
                  onChange={(e) => updateStory(index, 'caption', e.target.value)}
                  placeholder="첫 만남 그 날 ☕ 세 시간이 어떻게 갔는지 모르겠어"
                  rows={3}
                  maxLength={200}
                  className={`${inputClass} resize-none`}
                />
                <p className="text-xs text-gray-400 mt-1">{story.caption.length}/200자</p>
              </div>
            </div>
          </div>
        ))}

        {/* Add story button */}
        {stories.length < 10 && (
          <button
            type="button"
            onClick={addStory}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1"
          >
            <Plus className="w-4 h-4" />
            새 스토리 추가 ({stories.length}/10)
          </button>
        )}
        </>}
      </section>

      {/* 영상 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            🎬 영상
          </h3>
          <ToggleSwitch
            checked={data.youtube?.enabled ?? false}
            onChange={(checked) => updateNestedData('youtube.enabled', checked)}
          />
        </div>
        <p className="text-sm text-blue-600">유튜브 영상을 추가하세요. 갤러리 하단에 표시됩니다.</p>

        {data.youtube?.enabled && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-1.5">
              <label className={labelClass}>YouTube URL <span className="text-red-500">*</span></label>
              <input
                className={inputClass}
                value={data.youtube.url}
                onChange={(e) => updateNestedData('youtube.url', e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <p className="text-xs text-gray-400">YouTube 링크를 붙여넣기 해주세요.</p>
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>영상 제목</label>
              <input
                className={inputClass}
                value={data.youtube.title}
                onChange={(e) => updateNestedData('youtube.title', e.target.value)}
                placeholder="우리의 웨딩 영상"
              />
              <p className="text-xs text-gray-400">비워두면 영상만 표시됩니다.</p>
            </div>
          </div>
        )}
      </section>

      {/* 오시는 길 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          🚗 오시는 길
        </h3>
        <p className="text-sm text-blue-600">교통 안내 정보를 입력해주세요.</p>

        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-1.5">
            <label className={labelClass}>자가용 / 주차</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              value={data.wedding.directions.car}
              onChange={(e) => updateNestedData('wedding.directions.car', e.target.value)}
              placeholder="건물 지하주차장 이용 가능 (2시간 무료)"
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>대중교통 (버스/지하철)</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              value={data.wedding.directions.publicTransport}
              onChange={(e) => updateNestedData('wedding.directions.publicTransport', e.target.value)}
              placeholder="지하철 2호선 강남역 3번 출구에서 도보 5분"
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>기차 (KTX/SRT)</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={2}
              value={data.wedding.directions.train}
              onChange={(e) => updateNestedData('wedding.directions.train', e.target.value)}
              placeholder="서울역 하차 → 지하철 환승 안내"
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>고속버스</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={2}
              value={data.wedding.directions.expressBus}
              onChange={(e) => updateNestedData('wedding.directions.expressBus', e.target.value)}
              placeholder="서울고속버스터미널 하차 → 이동 안내"
            />
          </div>

          {/* 추가 안내사항 (멀티 아이템) */}
          <div className="border-t border-gray-200 pt-4 space-y-3">
            <label className={labelClass}>추가 안내사항</label>

            {(() => {
              // 레거시 데이터 마이그레이션: extraItems가 없고 old 필드가 있으면 자동 생성
              const extraItems = data.wedding.directions.extraItems || []
              if (extraItems.length === 0 && data.wedding.directions.extraInfoEnabled && data.wedding.directions.extraInfoText) {
                const migrated = [{
                  id: `extra-migrated`,
                  emoji: '📌',
                  title: data.wedding.directions.extraInfoTitle || '추가 안내사항',
                  text: data.wedding.directions.extraInfoText,
                  enabled: true,
                }]
                // 마이그레이션 실행
                setTimeout(() => updateNestedData('wedding.directions.extraItems', migrated), 0)
                return migrated
              }
              return extraItems
            })().map((item, index) => (
              <div key={item.id} className="p-4 bg-white rounded-lg border border-gray-100 space-y-2">
                <div className="flex items-center gap-2">
                  <EmojiPicker
                    value={item.emoji || '📌'}
                    onChange={(emoji) => {
                      const newItems = [...(data.wedding.directions.extraItems || [])]
                      newItems[index] = { ...newItems[index], emoji }
                      updateNestedData('wedding.directions.extraItems', newItems)
                    }}
                  />
                  <input
                    value={item.title}
                    onChange={(e) => {
                      const newItems = [...(data.wedding.directions.extraItems || [])]
                      newItems[index] = { ...newItems[index], title: e.target.value }
                      updateNestedData('wedding.directions.extraItems', newItems)
                    }}
                    placeholder="제목을 입력하세요"
                    className="flex-1 text-sm font-medium px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                  />
                  <ToggleSwitch
                    checked={item.enabled}
                    onChange={(checked) => {
                      const newItems = [...(data.wedding.directions.extraItems || [])]
                      newItems[index] = { ...newItems[index], enabled: checked }
                      updateNestedData('wedding.directions.extraItems', newItems)
                    }}
                  />
                  <button
                    onClick={() => {
                      const newItems = (data.wedding.directions.extraItems || []).filter((_, i) => i !== index)
                      updateNestedData('wedding.directions.extraItems', newItems)
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {item.enabled && (
                  <textarea
                    value={item.text}
                    onChange={(e) => {
                      const newItems = [...(data.wedding.directions.extraItems || [])]
                      newItems[index] = { ...newItems[index], text: e.target.value }
                      updateNestedData('wedding.directions.extraItems', newItems)
                    }}
                    rows={3}
                    placeholder="예: 주차권은 안내데스크에서 수령 / 혼잡 시간대는 대중교통 추천"
                    className={`${inputClass} resize-none`}
                  />
                )}
              </div>
            ))}

            <button
              onClick={() => {
                const newItem = { id: `extra-${Date.now()}`, emoji: '📌', title: '추가 안내사항', text: '', enabled: true }
                const newItems = [...(data.wedding.directions.extraItems || []), newItem]
                updateNestedData('wedding.directions.extraItems', newItems)
              }}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
            >
              + 추가 안내사항 추가
            </button>
          </div>
        </div>

        {/* 오시는길 포스트 캡션 */}
        <div className="space-y-1.5">
          <label className={labelClass}>포스트 캡션</label>
          <input
            className={inputClass}
            value={data.postCaptions?.weddingInfo ?? '우리의 특별한 날에 초대합니다 💌'}
            onChange={(e) => updateNestedData('postCaptions.weddingInfo', e.target.value)}
            placeholder="우리의 특별한 날에 초대합니다 💌"
          />
          <p className="text-xs text-gray-400">게스트뷰에서 오시는길 포스트 하단에 표시됩니다.</p>
        </div>
      </section>

      {/* 안내사항 (레코드와 동일한 8개 항목) */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          ℹ️ 안내사항
        </h3>
        <p className="text-sm text-blue-600">하객분들께 전달할 안내사항을 작성해주세요.</p>

        <div className="space-y-3">
          {/* 8개 기본 항목 */}
          {INFO_KEYS.map((key) => {
            const item = (info as unknown as Record<string, { title: string; content: string; enabled: boolean; buttonText?: string; url?: string }>)[key]
            if (!item) return null
            return (
              <div key={key} className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{item.title}</span>
                  <ToggleSwitch
                    checked={item.enabled}
                    onChange={() => toggleInfoItem(key)}
                  />
                </div>
                {item.enabled && (
                  <div className="space-y-2">
                    <textarea
                      value={item.content}
                      onChange={(e) => updateNestedData(`content.info.${key}.content`, e.target.value)}
                      rows={3}
                      placeholder="내용을 입력해주세요."
                      className={`${inputClass} resize-none`}
                    />
                    {key === 'photoShare' && (
                      <>
                        <input
                          value={item.buttonText || ''}
                          onChange={(e) => updateNestedData(`content.info.${key}.buttonText`, e.target.value)}
                          placeholder="버튼 텍스트 (예: 사진 공유하기)"
                          className={inputClass}
                        />
                        <input
                          value={item.url || ''}
                          onChange={(e) => updateNestedData(`content.info.${key}.url`, e.target.value)}
                          placeholder="공유 링크 URL"
                          className={inputClass}
                        />
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* 커스텀 안내 항목들 */}
          {info.customItems?.map((item, index) => (
            <div key={item.id} className="p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <EmojiPicker
                  value={item.emoji || '📋'}
                  onChange={(emoji) => {
                    const newItems = [...(info.customItems || [])]
                    newItems[index] = { ...newItems[index], emoji }
                    updateNestedData('content.info.customItems', newItems)
                  }}
                />
                <input
                  value={item.title}
                  onChange={(e) => {
                    const newItems = [...(info.customItems || [])]
                    newItems[index] = { ...newItems[index], title: e.target.value }
                    updateNestedData('content.info.customItems', newItems)
                  }}
                  placeholder="제목을 입력하세요"
                  className="flex-1 text-sm font-medium px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                />
                <ToggleSwitch
                  checked={item.enabled}
                  onChange={(checked) => {
                    const newItems = [...(info.customItems || [])]
                    newItems[index] = { ...newItems[index], enabled: checked }
                    updateNestedData('content.info.customItems', newItems)
                  }}
                />
                <button
                  onClick={() => {
                    const newItems = (info.customItems || []).filter((_, i) => i !== index)
                    updateNestedData('content.info.customItems', newItems)
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {item.enabled && (
                <textarea
                  value={item.content}
                  onChange={(e) => {
                    const newItems = [...(info.customItems || [])]
                    newItems[index] = { ...newItems[index], content: e.target.value }
                    updateNestedData('content.info.customItems', newItems)
                  }}
                  rows={3}
                  placeholder="안내 내용을 입력해주세요."
                  className={`${inputClass} resize-none`}
                />
              )}
            </div>
          ))}

          <button
            onClick={() => {
              const newItem = { id: `custom-${Date.now()}`, emoji: '📋', title: '새 안내사항', content: '', enabled: true }
              const newItems = [...(info.customItems || []), newItem]
              updateNestedData('content.info.customItems', newItems)
            }}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
          >
            + 안내사항 추가
          </button>

          {/* 안내사항 포스트 캡션 */}
          <div className="space-y-1.5 pt-3 border-t border-gray-200">
            <label className={labelClass}>포스트 캡션</label>
            <input
              className={inputClass}
              value={data.postCaptions?.guidance ?? '결혼식 안내사항을 알려드립니다 ✨'}
              onChange={(e) => updateNestedData('postCaptions.guidance', e.target.value)}
              placeholder="결혼식 안내사항을 알려드립니다 ✨"
            />
            <p className="text-xs text-gray-400">게스트뷰에서 안내사항 포스트 하단에 표시됩니다.</p>
          </div>
        </div>
      </section>

      {/* 감사인사 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          📝 감사인사
        </h3>

        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
          <div className="space-y-1.5">
            <label className={labelClass}>제목</label>
            <input
              className={inputClass}
              value={data.content.thankYou.title}
              onChange={(e) => updateNestedData('content.thankYou.title', e.target.value)}
              placeholder="THANK YOU"
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>감사 메시지</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={4}
              value={data.content.thankYou.message}
              onChange={(e) => updateNestedData('content.thankYou.message', e.target.value)}
              placeholder={'소중한 자리에 함께해 주셔서\n진심으로 감사합니다.\n\n여러분의 축하와 응원이\n가장 큰 선물입니다.'}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>게시글 캡션</label>
            <input
              className={inputClass}
              value={data.content.thankYou.caption ?? ''}
              onChange={(e) => updateNestedData('content.thankYou.caption', e.target.value)}
              placeholder="축하해주셔서 감사합니다"
            />
            <p className="text-xs text-gray-400">포스트 하단에 표시되는 짧은 문구입니다. 비워두면 &quot;축하해주셔서 감사합니다&quot;로 표시됩니다.</p>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>서명</label>
            <input
              className={inputClass}
              value={data.content.thankYou.sign}
              onChange={(e) => updateNestedData('content.thankYou.sign', e.target.value)}
              placeholder="길동 & 민지 올림"
            />
          </div>
        </div>
      </section>

      {/* 방명록 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            📖 방명록
          </h3>
          <ToggleSwitch
            checked={data.sectionVisibility.guestbook}
            onChange={(checked) => updateNestedData('sectionVisibility.guestbook', checked)}
          />
        </div>
        <p className="text-sm text-blue-600">하객분들이 축하 메시지를 남길 수 있는 방명록이 표시됩니다.</p>

        {data.sectionVisibility.guestbook && (
          <div className="p-4 bg-amber-50 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-amber-800">질문 설정 (최대 10개)</p>
              <span className="text-xs text-amber-600">{questions.length}/10</span>
            </div>
            <p className="text-xs text-amber-700">하객분들에게 보여질 질문을 설정하세요.</p>

            <div className="space-y-2">
              {questions.map((question, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-xs text-amber-600 w-5">{index + 1}.</span>
                  <input
                    value={question}
                    onChange={(e) => updateQuestion(index, e.target.value)}
                    placeholder="질문을 입력하세요"
                    className={`${inputClass} flex-1 bg-white`}
                  />
                  <button
                    onClick={() => deleteQuestion(index)}
                    className="p-1.5 text-amber-600 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {questions.length < 10 && (
              <button
                onClick={addQuestion}
                className="w-full py-2 border-2 border-dashed border-amber-300 rounded-lg text-sm text-amber-600 hover:border-amber-400 hover:text-amber-700 hover:bg-amber-100/50 transition-colors flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" />
                질문 추가
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
