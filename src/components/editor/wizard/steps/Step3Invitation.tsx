'use client'

import { useState, useCallback } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import ImageUploader from '@/components/editor/ImageUploader'
import InlineCropEditor from '@/components/editor/InlineCropEditor'
import ImageCropEditor, { CropData } from '@/components/parents/ImageCropEditor'
import { getPresetById } from '@/lib/introPresets'
import { SAMPLE_GREETING, SAMPLE_QUOTE } from '@/lib/sampleData'
import { Sparkles, X, Loader2 } from 'lucide-react'

// 공유 설명 자동 생성 헬퍼 함수
function generateKakaoDescription(date: string, time: string, venueName: string): string {
  if (!date) return ''

  const dateObj = new Date(date)
  const year = dateObj.getFullYear()
  const month = dateObj.getMonth() + 1
  const day = dateObj.getDate()
  const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][dateObj.getDay()]

  let timeStr = ''
  if (time) {
    const [hour, minute] = time.split(':').map(Number)
    const period = hour < 12 ? '오전' : '오후'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    timeStr = minute === 0 ? ` ${period} ${displayHour}시` : ` ${period} ${displayHour}시 ${minute}분`
  }

  const dateLine = `${year}년 ${month}월 ${day}일 ${dayOfWeek}요일${timeStr}`
  const venueLine = venueName || ''

  return venueLine ? `${dateLine}\n${venueLine}` : dateLine
}

// 이미지 크롭 스타일 계산 헬퍼 함수 (Preview.tsx와 동일)
function getImageCropStyle(img: string, s: { scale?: number; positionX?: number; positionY?: number; cropX?: number; cropY?: number; cropWidth?: number; cropHeight?: number }) {
  const hasCropData = s.cropWidth !== undefined && s.cropHeight !== undefined && (s.cropWidth < 1 || s.cropHeight < 1)

  if (hasCropData) {
    const cw = s.cropWidth || 1
    const ch = s.cropHeight || 1
    const cx = s.cropX || 0
    const cy = s.cropY || 0
    const posX = cw >= 1 ? 0 : (cx / (1 - cw)) * 100
    const posY = ch >= 1 ? 0 : (cy / (1 - ch)) * 100

    return {
      backgroundImage: `url(${img})`,
      backgroundSize: `${100 / cw}% ${100 / ch}%`,
      backgroundPosition: `${posX}% ${posY}%`,
      backgroundRepeat: 'no-repeat' as const,
    }
  }

  // 기존 scale/position 방식 (호환성 유지)
  return {
    backgroundImage: `url(${img})`,
    backgroundSize: 'cover' as const,
    backgroundPosition: 'center' as const,
    transform: `scale(${s.scale || 1}) translate(${s.positionX || 0}%, ${s.positionY || 0}%)`,
  }
}

interface Step3InvitationProps {
  onOpenIntroSelector?: () => void
  templateId?: string
  onScrollPreviewToTop?: () => void
  invitationId?: string | null
}

// 인사말 AI 생성 질문
const GREETING_QUESTIONS = [
  {
    id: 'relationship_duration',
    question: '두 분은 얼마나 사귀셨나요?',
    options: ['1년 미만', '1~3년', '3~5년', '5년 이상', '10년 이상'],
  },
  {
    id: 'relationship_character',
    question: '두 분의 관계를 가장 잘 표현하는 건?',
    options: ['서로의 가장 친한 친구', '서로를 성장시키는 파트너', '편안한 일상의 동반자', '설레는 연인', '운명 같은 만남'],
  },
  {
    id: 'marriage_meaning',
    question: '두 분에게 결혼은 어떤 의미인가요?',
    options: ['새로운 가정을 이루는 시작', '서로에 대한 약속과 책임', '평생 함께 걸어갈 동반자', '두 가족이 하나가 되는 것', '사랑의 완성'],
  },
  {
    id: 'greeting_style',
    question: '어떤 분위기의 인사말을 원하세요?',
    options: ['따뜻하고 감성적인', '간결하고 세련된', '스토리텔링 형식', '밝고 경쾌한', '전통적이고 격식있는'],
  },
]

type GreetingAnswers = {
  relationship_duration: string
  relationship_character: string
  marriage_meaning: string
  greeting_style: string
}

export default function Step3Invitation({ onOpenIntroSelector, templateId, onScrollPreviewToTop, invitationId }: Step3InvitationProps) {
  const { invitation, updateField, updateNestedField, setActiveSection, validationError, toggleSectionVisibility } = useEditorStore()

  // 공유설명 자동 업데이트 함수
  const updateKakaoDescriptionIfAuto = useCallback((newDate?: string, newTime?: string, newVenueName?: string) => {
    if (!invitation) return

    const date = newDate ?? invitation.wedding.date
    const time = newTime ?? invitation.wedding.time
    const venueName = newVenueName ?? invitation.wedding.venue.name
    const currentDesc = invitation.meta.description || ''

    // 현재 description이 비어있거나 자동 생성된 값과 같으면 자동 업데이트
    const currentAutoDesc = generateKakaoDescription(
      invitation.wedding.date,
      invitation.wedding.time,
      invitation.wedding.venue.name
    )

    // 비어있거나 이전 자동생성 값과 같은 경우에만 업데이트
    if (!currentDesc.trim() || currentDesc === currentAutoDesc) {
      const newDesc = generateKakaoDescription(date, time, venueName)
      updateNestedField('meta.description', newDesc)
    }
  }, [invitation, updateNestedField])

  // AI 인사말 생성 상태
  const [greetingModalOpen, setGreetingModalOpen] = useState(false)
  const [greetingAnswers, setGreetingAnswers] = useState<Partial<GreetingAnswers>>({})
  const [isGeneratingGreeting, setIsGeneratingGreeting] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [greetingGenerationCount, setGreetingGenerationCount] = useState(0)
  const MAX_GREETING_GENERATIONS = 3

  if (!invitation) return null

  const { intro, media } = invitation
  const currentPreset = getPresetById(intro.presetId)
  const isFamily = templateId === 'narrative-family' || invitation.templateId === 'narrative-family'
  const isMagazine = templateId === 'narrative-magazine' || invitation.templateId === 'narrative-magazine'

  // 샘플 인사말 적용
  const applySampleGreeting = () => {
    updateNestedField('content.greeting', SAMPLE_GREETING)
  }

  const hasGreeting = invitation.content.greeting?.trim()

  // AI 인사말 생성 모달 열기
  const openGreetingModal = () => {
    setGreetingAnswers({})
    setCurrentQuestionIndex(0)
    setGreetingModalOpen(true)
  }

  // 질문에 답변 선택
  const selectGreetingAnswer = (questionId: string, answer: string) => {
    setGreetingAnswers(prev => ({ ...prev, [questionId]: answer }))

    // 다음 질문으로 이동
    if (currentQuestionIndex < GREETING_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  // AI 인사말 생성 API 호출
  const generateGreeting = async () => {
    // 횟수 제한 확인
    if (greetingGenerationCount >= MAX_GREETING_GENERATIONS) {
      alert(`인사말 초안 작성은 최대 ${MAX_GREETING_GENERATIONS}회까지 가능합니다.`)
      return
    }

    // 모든 질문에 답변했는지 확인
    const allAnswered = GREETING_QUESTIONS.every(q => greetingAnswers[q.id as keyof GreetingAnswers])
    if (!allAnswered) {
      alert('모든 질문에 답변해주세요.')
      return
    }

    setIsGeneratingGreeting(true)

    try {
      const response = await fetch('/api/ai/generate-greeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: {
            ...greetingAnswers,
            groom_name: invitation.groom.name,
            bride_name: invitation.bride.name,
          }
        })
      })

      if (!response.ok) {
        throw new Error('인사말 작성에 실패했습니다.')
      }

      const data = await response.json() as { greeting?: string; error?: string }

      if (data.greeting) {
        updateNestedField('content.greeting', data.greeting)
        setGreetingGenerationCount(prev => prev + 1)
        setGreetingModalOpen(false)
      }
    } catch (error) {
      console.error('Greeting generation error:', error)
      alert(error instanceof Error ? error.message : '인사말 작성에 실패했습니다.')
    } finally {
      setIsGeneratingGreeting(false)
    }
  }

  // 인트로 스타일 편집 버튼 클릭 핸들러
  const handleOpenIntroSelector = () => {
    onScrollPreviewToTop?.()
    onOpenIntroSelector?.()
  }

  return (
    <div className="p-6 space-y-8">
      {/* 안내 */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-base text-purple-800 font-medium mb-1">{isMagazine ? '매거진 커버를 꾸며보세요' : '인트로를 꾸며보세요'}</p>
        <p className="text-sm text-purple-700">
          {isMagazine
            ? '커버 이미지와 기본 정보를 입력하고 매거진 첫 페이지를 완성하세요.'
            : '기본 정보를 입력하고 첫인상을 결정하는 인트로를 디자인해주세요.'}
        </p>
      </div>

      {/* 1. 인트로 스타일 편집 (매거진에서는 숨김) */}
      {!isMagazine && (
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" /><path d="M20 3v4" /><path d="M22 5h-4" /></svg>
          인트로 스타일
        </h3>
        <p className="text-sm text-blue-600"><svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>커버 이미지, 애니메이션 효과, 텍스트를 한 곳에서 설정하세요</p>

        {/* 미리보기 썸네일 - media.coverImageSettings 기준 (Preview.tsx와 동일) */}
        {media.coverImage && (
          <div className="relative w-full max-w-[160px] aspect-[9/16] mx-auto rounded-lg overflow-hidden shadow-md">
            <div
              className="absolute inset-0"
              style={getImageCropStyle(media.coverImage, media.coverImageSettings || {})}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <span className="text-white text-xs font-medium px-2 py-1 bg-black/50 rounded">
                {currentPreset?.name || '시네마틱'}
              </span>
            </div>
          </div>
        )}

        {/* 스타일 편집 버튼 */}
        <button
          onClick={handleOpenIntroSelector}
          className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          {media.coverImage ? '인트로 스타일 편집하기' : '커버 이미지 추가 & 스타일 편집'}
        </button>
      </section>
      )}

      {/* 매거진: 커버 이미지 업로드 (간단) */}
      {isMagazine && (
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
          커버 이미지
        </h3>
        <p className="text-sm text-blue-600"><svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>매거진 표지에 사용할 사진을 선택하세요</p>
        <button
          onClick={handleOpenIntroSelector}
          className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {media.coverImage ? '커버 이미지 변경하기' : '커버 이미지 추가하기'}
        </button>
        {media.coverImage && (
          <div className="relative w-full max-w-[200px] aspect-[3/4] mx-auto rounded-lg overflow-hidden shadow-md">
            <div className="absolute inset-0" style={getImageCropStyle(media.coverImage, media.coverImageSettings || {})} />
          </div>
        )}
      </section>
      )}

      {/* 2. 신랑신부 기본정보 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          신랑신부 정보
        </h3>

        {/* 신랑 */}
        <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
          <p className="text-base font-semibold text-blue-800">신랑</p>
          {isFamily ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">성</Label>
                <Input
                  autoFocus
                  value={invitation.groom.lastName || ''}
                  onChange={(e) => {
                    const lastName = e.target.value
                    const firstName = invitation.groom.firstName || ''
                    updateField('groom', {
                      ...invitation.groom,
                      lastName,
                      name: lastName + firstName
                    })
                  }}
                  placeholder="김"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">이름</Label>
                <Input
                  value={invitation.groom.firstName || ''}
                  onChange={(e) => {
                    const firstName = e.target.value
                    const lastName = invitation.groom.lastName || ''
                    updateField('groom', {
                      ...invitation.groom,
                      firstName,
                      name: lastName + firstName
                    })
                  }}
                  placeholder="민준"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">이름 <span className="text-red-500">*</span></Label>
              <Input
                autoFocus
                value={invitation.groom.name}
                onChange={(e) => updateNestedField('groom.name', e.target.value)}
                placeholder="김민준"
                className={validationError?.tab === 'names' && !invitation.groom.name?.trim() ? 'border-red-500 ring-2 ring-red-200' : ''}
              />
              {validationError?.tab === 'names' && !invitation.groom.name?.trim() && (
                <p className="text-xs text-red-500">신랑 이름을 입력해주세요</p>
              )}
            </div>
          )}
        </div>

        {/* 신부 */}
        <div className="space-y-3 p-4 bg-pink-50 rounded-lg">
          <p className="text-base font-semibold text-pink-800">신부</p>
          {isFamily ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">성</Label>
                <Input
                  value={invitation.bride.lastName || ''}
                  onChange={(e) => {
                    const lastName = e.target.value
                    const firstName = invitation.bride.firstName || ''
                    updateField('bride', {
                      ...invitation.bride,
                      lastName,
                      name: lastName + firstName
                    })
                  }}
                  placeholder="이"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">이름</Label>
                <Input
                  value={invitation.bride.firstName || ''}
                  onChange={(e) => {
                    const firstName = e.target.value
                    const lastName = invitation.bride.lastName || ''
                    updateField('bride', {
                      ...invitation.bride,
                      firstName,
                      name: lastName + firstName
                    })
                  }}
                  placeholder="서연"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">이름 <span className="text-red-500">*</span></Label>
              <Input
                value={invitation.bride.name}
                onChange={(e) => updateNestedField('bride.name', e.target.value)}
                placeholder="이서연"
                className={validationError?.tab === 'names' && !invitation.bride.name?.trim() ? 'border-red-500 ring-2 ring-red-200' : ''}
              />
              {validationError?.tab === 'names' && !invitation.bride.name?.trim() && (
                <p className="text-xs text-red-500">신부 이름을 입력해주세요</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 3. 명언/슬로건 (매거진에서는 스토리 탭으로 이동) */}
      {!isMagazine && (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" /><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" /></svg>
            명언/슬로건
          </h3>
          {!invitation.content.quote?.text?.trim() && (
            <button
              onClick={() => {
                updateNestedField('content.quote.text', '사랑은 서로를 바라보는 것이 아니라\n함께 같은 방향을 바라보는 것이다.')
                updateNestedField('content.quote.author', '생텍쥐페리')
              }}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              샘플 적용
            </button>
          )}
        </div>
        <p className="text-sm text-blue-600"><svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>인트로에 표시될 명언이나 슬로건을 입력해주세요. (선택)</p>

        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">문구</Label>
            <Textarea
              value={invitation.content.quote?.text || ''}
              onChange={(e) => updateNestedField('content.quote.text', e.target.value)}
              onFocus={() => setActiveSection('invitation')}
              placeholder={SAMPLE_QUOTE.text}
              rows={2}
              className="resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">출처</Label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <span className="text-xs text-gray-500">표시안함</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={invitation.content.quote?.hideAuthor || false}
                  onClick={() => updateNestedField('content.quote.hideAuthor', !invitation.content.quote?.hideAuthor)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    invitation.content.quote?.hideAuthor ? 'bg-gray-900' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                      invitation.content.quote?.hideAuthor ? 'translate-x-[18px]' : 'translate-x-[3px]'
                    }`}
                  />
                </button>
              </label>
            </div>
            <Input
              value={invitation.content.quote?.author || ''}
              onChange={(e) => updateNestedField('content.quote.author', e.target.value)}
              placeholder={SAMPLE_QUOTE.author}
              disabled={invitation.content.quote?.hideAuthor}
              className={invitation.content.quote?.hideAuthor ? 'opacity-50' : ''}
            />
          </div>
        </div>
      </section>
      )}

      {/* 4. 인트로 인사말 (매거진에서는 스토리 탭으로 이동) */}
      {!isMagazine && (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            인트로 인사말
          </h3>
          {!hasGreeting && (
            <button
              onClick={applySampleGreeting}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              샘플 적용
            </button>
          )}
        </div>
        <p className="text-sm text-blue-600"><svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>초안을 작성하거나, 샘플을 참고하여 직접 작성해보세요.</p>

        {/* TIP 섹션 */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800 mb-2"><svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>두 분이 왜 이 선택을 했는지, 시작의 마음을 담아 적어보세요.</p>
          <details className="text-xs text-blue-700">
            <summary className="cursor-pointer font-medium hover:text-blue-900">가이드 보기</summary>
            <div className="mt-3 space-y-3 pl-2 border-l-2 border-blue-300">
              <p className="font-medium">이렇게 작성해 보세요</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>한 문장의 인용구나 두 분의 말로 시작해요</li>
                <li>'왜 결혼하는지', 지금의 마음만 담아주세요</li>
                <li>부탁보다는 초대의 톤이 좋아요</li>
              </ul>
              <div className="p-2 bg-white/50 rounded text-gray-600 italic">
                예시) "서로 다른 길을 걸어온 두 사람이<br/>이제 같은 길을 함께 걸어가려 합니다."
              </div>
              <p className="text-blue-600"><svg className="w-3 h-3 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>완벽한 글보다 두 분의 말투가 느껴지는 글이면 충분합니다.</p>
            </div>
          </details>
        </div>

        {/* 초안 작성 버튼 */}
        <button
          onClick={openGreetingModal}
          disabled={greetingGenerationCount >= MAX_GREETING_GENERATIONS}
          className={`w-full py-3 px-4 text-white rounded-lg transition-all flex items-center justify-center gap-2 shadow-md ${
            greetingGenerationCount >= MAX_GREETING_GENERATIONS
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>
            {greetingGenerationCount >= MAX_GREETING_GENERATIONS
              ? '초안 작성 횟수 초과'
              : `인사말 초안 작성하기 (${MAX_GREETING_GENERATIONS - greetingGenerationCount}회 남음)`}
          </span>
        </button>

        <Textarea
          value={invitation.content.greeting || ''}
          onChange={(e) => updateNestedField('content.greeting', e.target.value)}
          onFocus={() => setActiveSection('invitation')}
          placeholder={SAMPLE_GREETING}
          rows={5}
          className={`resize-none ${!hasGreeting ? 'text-gray-400 italic' : ''}`}
        />
      </section>
      )}

      {/* 5. 부모님 정보 (매거진에서는 숨김) */}
      {!isMagazine && (
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          부모님 정보
        </h3>
        <p className="text-sm text-blue-600"><svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>인트로에 표시될 부모님 성함을 입력해주세요.</p>

        {/* 청첩장 본문 표시 토글 */}
        <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
          <span className="text-xs text-amber-800">청첩장에 표시</span>
          <Switch
            checked={invitation.sectionVisibility?.parentNames !== false}
            onCheckedChange={() => toggleSectionVisibility('parentNames')}
          />
        </div>

        {/* 신랑측 */}
        <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
          <p className="text-base font-semibold text-blue-800">신랑측</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">아버지 성함</Label>
              <Input
                value={invitation.groom.father.name}
                onChange={(e) => updateNestedField('groom.father.name', e.target.value)}
                onFocus={() => setActiveSection('invitation')}
                placeholder="김OO"
              />
            </div>
            <div className="flex items-end">
              <div className="flex items-center gap-2 pb-2">
                <Switch
                  checked={invitation.groom.father.deceased || false}
                  onCheckedChange={(checked) => updateNestedField('groom.father.deceased', checked)}
                />
                <span className="text-sm text-gray-500">고인</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">어머니 성함</Label>
              <Input
                value={invitation.groom.mother.name}
                onChange={(e) => updateNestedField('groom.mother.name', e.target.value)}
                onFocus={() => setActiveSection('invitation')}
                placeholder="박OO"
              />
            </div>
            <div className="flex items-end">
              <div className="flex items-center gap-2 pb-2">
                <Switch
                  checked={invitation.groom.mother.deceased || false}
                  onCheckedChange={(checked) => updateNestedField('groom.mother.deceased', checked)}
                />
                <span className="text-sm text-gray-500">고인</span>
              </div>
            </div>
          </div>
        </div>

        {/* 신부측 */}
        <div className="space-y-3 p-4 bg-pink-50 rounded-lg">
          <p className="text-base font-semibold text-pink-800">신부측</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">아버지 성함</Label>
              <Input
                value={invitation.bride.father.name}
                onChange={(e) => updateNestedField('bride.father.name', e.target.value)}
                onFocus={() => setActiveSection('invitation')}
                placeholder="이OO"
              />
            </div>
            <div className="flex items-end">
              <div className="flex items-center gap-2 pb-2">
                <Switch
                  checked={invitation.bride.father.deceased || false}
                  onCheckedChange={(checked) => updateNestedField('bride.father.deceased', checked)}
                />
                <span className="text-sm text-gray-500">고인</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">어머니 성함</Label>
              <Input
                value={invitation.bride.mother.name}
                onChange={(e) => updateNestedField('bride.mother.name', e.target.value)}
                onFocus={() => setActiveSection('invitation')}
                placeholder="최OO"
              />
            </div>
            <div className="flex items-end">
              <div className="flex items-center gap-2 pb-2">
                <Switch
                  checked={invitation.bride.mother.deceased || false}
                  onCheckedChange={(checked) => updateNestedField('bride.mother.deceased', checked)}
                />
                <span className="text-sm text-gray-500">고인</span>
              </div>
            </div>
          </div>
        </div>

        {/* 고인 표시 스타일 */}
        <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
          <Label className="text-sm font-medium">고인 표시 스타일</Label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => updateField('deceasedDisplayStyle', 'hanja')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                invitation.deceasedDisplayStyle === 'hanja'
                  ? 'border-gray-900 bg-white'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-base">故</span>
              <span className="text-sm text-gray-600">한자</span>
            </button>
            <button
              type="button"
              onClick={() => updateField('deceasedDisplayStyle', 'flower')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                invitation.deceasedDisplayStyle === 'flower'
                  ? 'border-gray-900 bg-white'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <img src="/icons/chrysanthemum.svg" alt="국화" className="w-5 h-5" />
              <span className="text-sm text-gray-600">국화꽃</span>
            </button>
          </div>
        </div>
      </section>
      )}

      {/* 6. 결혼식 정보 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22V12h6v10" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M8 10h.01" /><path d="M16 10h.01" /></svg>
          결혼식 정보
        </h3>
        <p className="text-sm text-blue-600"><svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>인트로 페이지, 오시는 길 안내, 카카오톡 공유 설정시 사용됩니다.</p>

        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          {/* 날짜/시간 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">날짜 <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                value={invitation.wedding.date}
                onChange={(e) => {
                  const newDate = e.target.value
                  updateNestedField('wedding.date', newDate)
                  updateKakaoDescriptionIfAuto(newDate, undefined, undefined)
                }}
                onFocus={() => setActiveSection('venue-info')}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">시간</Label>
              <Input
                type="time"
                value={invitation.wedding.time}
                onChange={(e) => {
                  const newTime = e.target.value
                  updateNestedField('wedding.time', newTime)
                  updateKakaoDescriptionIfAuto(undefined, newTime, undefined)
                }}
                onFocus={() => setActiveSection('venue-info')}
              />
            </div>
          </div>

          {/* 예식장 정보 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">예식장 이름 <span className="text-red-500">*</span></Label>
            <Input
              value={invitation.wedding.venue.name}
              onChange={(e) => {
                const newVenueName = e.target.value
                updateNestedField('wedding.venue.name', newVenueName)
                updateKakaoDescriptionIfAuto(undefined, undefined, newVenueName)
              }}
              onFocus={() => setActiveSection('venue-info')}
              placeholder="더채플앳청담"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">예식 홀</Label>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-gray-500">표시안함</span>
                <button
                  type="button"
                  onClick={() => updateNestedField('wedding.venue.hideHall', !invitation.wedding.venue.hideHall)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    invitation.wedding.venue.hideHall ? 'bg-gray-400' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      invitation.wedding.venue.hideHall ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </label>
            </div>
            <Input
              value={invitation.wedding.venue.hall}
              onChange={(e) => updateNestedField('wedding.venue.hall', e.target.value)}
              onFocus={() => setActiveSection('venue-info')}
              placeholder="그랜드볼룸 3층"
              disabled={invitation.wedding.venue.hideHall}
              className={invitation.wedding.venue.hideHall ? 'bg-gray-100 text-gray-400' : ''}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">주소 <span className="text-red-500">*</span></Label>
            <Input
              value={invitation.wedding.venue.address}
              onChange={(e) => updateNestedField('wedding.venue.address', e.target.value)}
              onFocus={() => setActiveSection('venue-info')}
              placeholder="서울특별시 강남구 삼성로 614"
            />
          </div>
        </div>
      </section>

      {/* 카카오톡 공유 설정 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" /></svg>
          카카오톡 공유 설정
        </h3>
        <p className="text-sm text-blue-600">
          <svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>카카오톡으로 공유할 때 표시되는 정보를 설정해주세요.
        </p>

        {/* 경고 문구 */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-700 mb-2">
            <svg className="w-3 h-3 text-amber-600 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg> <strong>중요:</strong> 카카오톡 공유 정보는 한번 공유된 후 변경하면 캐시로 인해
            반영되기까지 시간이 오래 걸릴 수 있습니다. 신중하게 설정해주세요.
          </p>
          <details className="text-xs text-amber-700">
            <summary className="cursor-pointer font-medium hover:text-amber-900">이미지 변경하기 (펼쳐보기)</summary>
            <div className="mt-2 space-y-1 pl-2 border-l-2 border-amber-300">
              <p>이미지 변경을 위해 썸네일 캐시 초기화가 필요합니다.</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>
                  <a
                    href="https://developers.kakao.com/tool/clear/og"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-800 underline hover:text-amber-900"
                  >
                    카카오톡 디벨로퍼
                  </a>에 접속
                </li>
                <li>URL 부분에 카카오톡 공유링크를 입력</li>
                <li>캐시초기화 버튼 클릭</li>
                <li>다시 카카오톡 링크 공유</li>
              </ol>
              <p className="text-amber-600 italic">※ 이전에 공유한 썸네일은 변경되지 않습니다.</p>
            </div>
          </details>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
          {/* 썸네일 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">공유 썸네일</Label>
            <p className="text-xs text-gray-400">권장 사이즈: 600 x 600px (1:1 정사각형)</p>
            {invitation.meta.kakaoThumbnail ? (
              <div className="space-y-3">
                <InlineCropEditor
                  imageUrl={invitation.meta.kakaoThumbnail}
                  settings={invitation.meta.kakaoThumbnailSettings || { scale: 1.0, positionX: 0, positionY: 0 }}
                  onUpdate={(s) => {
                    const current = invitation.meta.kakaoThumbnailSettings || { scale: 1.0, positionX: 0, positionY: 0 }
                    updateNestedField('meta.kakaoThumbnailSettings', { ...current, ...s })
                  }}
                  aspectRatio={1}
                  containerWidth={180}
                  colorClass="amber"
                />
                <button
                  type="button"
                  onClick={() => {
                    updateNestedField('meta.kakaoThumbnail', '')
                    updateNestedField('meta.kakaoThumbnailSettings', undefined)
                  }}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  이미지 삭제
                </button>
              </div>
            ) : (
              <div className="max-w-[150px]">
                <ImageUploader
                  value={invitation.meta.kakaoThumbnail}
                  onChange={(url) => updateNestedField('meta.kakaoThumbnail', url)}
                  placeholder="썸네일 업로드"
                  aspectRatio="aspect-square"
                />
              </div>
            )}
          </div>

          {/* 공유 제목 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">공유 제목</Label>
            <Input
              value={invitation.meta.title || ''}
              onChange={(e) => updateNestedField('meta.title', e.target.value)}
              placeholder={`${invitation.groom.name || '신랑'} ♥ ${invitation.bride.name || '신부'} 결혼합니다`}
            />
            <p className="text-xs text-gray-400">비워두면 자동 생성됩니다.</p>
          </div>

          {/* 공유 설명 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">공유 설명</Label>
            <Textarea
              value={invitation.meta.description || ''}
              onChange={(e) => updateNestedField('meta.description', e.target.value)}
              placeholder={generateKakaoDescription(invitation.wedding.date, invitation.wedding.time, invitation.wedding.venue.name) || '2025년 5월 24일 토요일 오후 2시\n더채플앳청담'}
              rows={2}
              className="resize-none"
            />
            <p className="text-xs text-gray-400">비워두면 날짜, 시간, 장소가 자동으로 표시됩니다.</p>
          </div>
        </div>
      </section>

      {/* OG 이미지 설정 (문자, SNS 공유용) */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
          공유 미리보기 이미지 (OG 이미지)
        </h3>
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            <svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg><strong>권장 크기:</strong> 1200 x 630 픽셀 (가로형)<br />
            카카오톡 이외의 플랫폼(문자, 인스타그램, 페이스북 등)에서 공유할 때 표시되는 이미지입니다.<br />
            카카오톡 썸네일과 다른 이미지를 사용하면 플랫폼별로 다른 미리보기를 보여줄 수 있어요.
          </p>
        </div>

        <div className="space-y-3">
          {/* OG 이미지 크롭 에디터 */}
          <ImageCropEditor
            value={{
              url: invitation.meta.ogImage || '',
              cropX: invitation.meta.ogImageSettings?.cropX ?? 0,
              cropY: invitation.meta.ogImageSettings?.cropY ?? 0,
              cropWidth: invitation.meta.ogImageSettings?.cropWidth ?? 1,
              cropHeight: invitation.meta.ogImageSettings?.cropHeight ?? 1,
            }}
            onChange={(data: CropData) => {
              updateNestedField('meta.ogImage', data.url)
              updateNestedField('meta.ogImageSettings', {
                ...(invitation.meta.ogImageSettings || { scale: 1, positionX: 0, positionY: 0 }),
                cropX: data.cropX,
                cropY: data.cropY,
                cropWidth: data.cropWidth,
                cropHeight: data.cropHeight,
              })
            }}
            aspectRatio={1200/630}
            containerWidth={280}
            invitationId={invitationId || undefined}
            label="공유 미리보기 이미지"
          />

          {/* OG 이미지가 없으면 카카오톡 썸네일 사용 안내 */}
          {!invitation.meta.ogImage && invitation.meta.kakaoThumbnail && (
            <div className="p-3 bg-amber-50 rounded-lg">
              <p className="text-xs text-amber-700">
                <svg className="w-3 h-3 text-amber-600 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg> OG 이미지를 설정하지 않으면 카카오톡 썸네일이 기본으로 사용됩니다.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 인사말 작성 모달 */}
      {greetingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl w-[90%] max-w-md max-h-[80vh] overflow-hidden shadow-xl">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <h3 className="text-lg font-semibold">인사말 초안 작성</h3>
              </div>
              <button
                onClick={() => setGreetingModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 진행 표시 */}
            <div className="px-4 pt-4">
              <div className="flex gap-1">
                {GREETING_QUESTIONS.map((_, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 h-1 rounded-full transition-colors ${
                      idx <= currentQuestionIndex ? 'bg-purple-500' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                {currentQuestionIndex + 1} / {GREETING_QUESTIONS.length}
              </p>
            </div>

            {/* 질문 영역 */}
            <div className="p-4 space-y-4">
              {/* 현재 질문 */}
              <div className="text-center py-4">
                <p className="text-lg font-medium text-gray-900">
                  {GREETING_QUESTIONS[currentQuestionIndex].question}
                </p>
              </div>

              {/* 옵션 버튼들 */}
              <div className="space-y-2">
                {GREETING_QUESTIONS[currentQuestionIndex].options.map((option) => {
                  const questionId = GREETING_QUESTIONS[currentQuestionIndex].id as keyof GreetingAnswers
                  const isSelected = greetingAnswers[questionId] === option
                  return (
                    <button
                      key={option}
                      onClick={() => selectGreetingAnswer(questionId, option)}
                      className={`w-full py-3 px-4 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-purple-300 text-gray-700'
                      }`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>

              {/* 이전/다음 네비게이션 */}
              <div className="flex gap-2 pt-2">
                {currentQuestionIndex > 0 && (
                  <button
                    onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                    className="flex-1 py-2 text-gray-600 hover:text-gray-800"
                  >
                    ← 이전
                  </button>
                )}
                {currentQuestionIndex < GREETING_QUESTIONS.length - 1 && greetingAnswers[GREETING_QUESTIONS[currentQuestionIndex].id as keyof GreetingAnswers] && (
                  <button
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                    className="flex-1 py-2 text-purple-600 hover:text-purple-800 font-medium"
                  >
                    다음 →
                  </button>
                )}
              </div>
            </div>

            {/* 푸터 - 생성 버튼 */}
            <div className="p-4 border-t bg-gray-50">
              {/* 선택한 답변 요약 */}
              <div className="mb-3 space-y-1">
                {GREETING_QUESTIONS.map((q) => {
                  const answer = greetingAnswers[q.id as keyof GreetingAnswers]
                  return answer ? (
                    <div key={q.id} className="flex items-center gap-2 text-xs">
                      <span className="text-gray-400">✓</span>
                      <span className="text-gray-600 truncate">{answer}</span>
                    </div>
                  ) : null
                })}
              </div>

              <button
                onClick={generateGreeting}
                disabled={isGeneratingGreeting || !GREETING_QUESTIONS.every(q => greetingAnswers[q.id as keyof GreetingAnswers])}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl transition-all flex items-center justify-center gap-2 font-medium"
              >
                {isGeneratingGreeting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>작성 중...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>인사말 작성하기</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
