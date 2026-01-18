'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  StoryFormData,
  Version,
} from '@/types/ai-generator'

// 년도 옵션 생성 (현재-30년 ~ 현재)
const currentYear = new Date().getFullYear()
const years = Array.from({ length: 31 }, (_, i) => currentYear - i)
const months = Array.from({ length: 12 }, (_, i) => i + 1)
const days = Array.from({ length: 31 }, (_, i) => i + 1)

// 일수 계산
function calculateDays(duration: { years: number; months: number }) {
  return Math.floor(duration.years * 365.25 + duration.months * 30.44)
}

// 날짜로부터 관계 기간 계산
function calculateDurationFromDate(date: { year: number; month: number; day?: number }): { years: number; months: number } {
  if (!date.year || !date.month) {
    return { years: 0, months: 0 }
  }

  const startDate = new Date(date.year, date.month - 1, date.day || 1)
  const now = new Date()

  let years = now.getFullYear() - startDate.getFullYear()
  let months = now.getMonth() - startDate.getMonth()

  if (months < 0) {
    years--
    months += 12
  }

  // 일자 고려
  if (date.day && now.getDate() < startDate.getDate()) {
    months--
    if (months < 0) {
      years--
      months += 12
    }
  }

  return { years: Math.max(0, years), months: Math.max(0, months) }
}

// 만남 장소 옵션
const FIRST_MEET_PLACE_OPTIONS = [
  { value: 'school', label: '학교 (캠퍼스)' },
  { value: 'work', label: '직장' },
  { value: 'blind-date', label: '소개팅' },
  { value: 'club', label: '동호회/모임' },
  { value: 'app', label: '앱/온라인' },
  { value: 'reunion', label: '재회' },
  { value: 'other', label: '기타' }
]

// 사귀게 된 계기 옵션
const HOW_STARTED_OPTIONS = [
  { value: 'friend-to-lover', label: '친구에서 연인으로' },
  { value: 'first-sight', label: '첫눈에 반해서' },
  { value: 'gradual-confession', label: '조심스러운 고백들이 쌓여서' },
  { value: 'natural', label: '자연스럽게 마음이 스며들어' },
  { value: 'custom', label: '직접 입력' }
]

// 기억에 남는 일들 옵션
const MEMORABLE_EVENTS_OPTIONS = [
  { value: 'long-distance', label: '장거리 연애' },
  { value: 'job-search', label: '취업 준비 함께 함' },
  { value: 'living-together', label: '타지 생활 함께 함' },
  { value: 'pet', label: '반려동물 입양' },
  { value: 'hardship', label: '힘든 시기 극복' },
  { value: 'daily-life', label: '일상 쌓아가기' },
  { value: 'travel', label: '함께한 여행' },
  { value: 'other', label: '기타' }
]

// 프로포즈 옵션
const PROPOSAL_OPTIONS = [
  { value: 'formal', label: '정식 프로포즈 있었음' },
  { value: 'natural', label: '자연스럽게 결혼 결정' },
  { value: 'skip', label: '건너뛰기' }
]

// 결혼 준비 느낌 옵션
const PREPARATION_FEELING_OPTIONS = [
  { value: 'fun', label: '재미있게 준비 중' },
  { value: 'together', label: '하나의 마음으로 준비 중' },
  { value: 'exciting', label: '설레는 마음으로 준비 중' },
  { value: 'custom', label: '직접 입력' }
]

// 첫 만남 예상 옵션
const EXPECTED_MARRIAGE_OPTIONS = [
  { value: 'no', label: '결혼할 줄 정말 몰랐다' },
  { value: 'special', label: '특별한 인연이라 느꼈다' },
  { value: 'friend', label: '친구로만 생각했다' }
]

interface StoryFormProps {
  data: StoryFormData
  onChange: (data: StoryFormData) => void
}

// 섹션 컴포넌트
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-800 border-l-4 border-rose-400 pl-3">
        {title}
      </h4>
      <div className="space-y-4 pl-1">
        {children}
      </div>
    </div>
  )
}

// 필드 라벨 컴포넌트
function FieldLabel({
  children,
  required,
  hint
}: {
  children: React.ReactNode
  required?: boolean
  hint?: string
}) {
  return (
    <div className="space-y-1">
      <Label className="text-sm font-medium text-gray-700">
        {children}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  )
}

// 라디오 버튼 그룹 컴포넌트
function RadioGroup({
  name,
  value,
  options,
  onChange,
  columns = 1
}: {
  name: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  columns?: number
}) {
  return (
    <div
      className={`grid gap-2 ${columns === 2 ? 'grid-cols-2' : columns === 3 ? 'grid-cols-3' : 'grid-cols-1'}`}
      role="radiogroup"
      aria-label={name}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all min-h-[44px] ${
            value === option.value
              ? 'border-rose-500 bg-rose-50 ring-1 ring-rose-500'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
            className="w-4 h-4 text-rose-500 border-gray-300 focus:ring-rose-500"
          />
          <span className="text-sm">{option.label}</span>
        </label>
      ))}
    </div>
  )
}

// 체크박스 그룹 컴포넌트
function CheckboxGroup({
  name,
  values,
  options,
  onChange
}: {
  name: string
  values: string[]
  options: { value: string; label: string }[]
  onChange: (values: string[]) => void
}) {
  const toggle = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value))
    } else {
      onChange([...values, value])
    }
  }

  return (
    <div
      className="grid grid-cols-2 gap-2"
      role="group"
      aria-label={name}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all min-h-[44px] ${
            values.includes(option.value)
              ? 'border-rose-500 bg-rose-50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Checkbox
            checked={values.includes(option.value)}
            onCheckedChange={() => toggle(option.value)}
          />
          <span className="text-sm">{option.label}</span>
        </label>
      ))}
    </div>
  )
}

// 버전 카드 컴포넌트
function VersionCard({
  selected,
  onClick,
  icon,
  title,
  description,
  detail
}: {
  selected: boolean
  onClick: () => void
  icon: string
  title: string
  description: string
  detail: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-4 rounded-xl border-2 text-left transition-all ${
        selected
          ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-200'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <h4 className="font-semibold text-gray-900">{title}</h4>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
      <p className="text-xs text-gray-400 mt-2">{detail}</p>
    </button>
  )
}

// 단계 헤더 컴포넌트
function StepHeader({
  step,
  title,
  description
}: {
  step: number
  title: string
  description: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-sm">
        {step}
      </span>
      <div className="text-left">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  )
}

export default function StoryForm({ data, onChange }: StoryFormProps) {
  const [version, setVersion] = useState<Version>(data.version || 'short')
  const [openItems, setOpenItems] = useState<string[]>(['step1', 'step2', 'step3'])

  // 버전 변경시 데이터 업데이트
  useEffect(() => {
    if (data.version !== version) {
      const newData = { ...data, version }
      onChange(newData)
    }
  }, [version, data, onChange])

  // 공식 사귄 날짜가 있으면 관계 기간 자동 계산
  useEffect(() => {
    if ((data as any).hasOfficialDate && data.officialDate?.year && data.officialDate?.month) {
      const calculatedDuration = calculateDurationFromDate(data.officialDate)
      // 현재 값과 다를 때만 업데이트 (무한 루프 방지)
      if (
        calculatedDuration.years !== data.relationshipDuration.years ||
        calculatedDuration.months !== data.relationshipDuration.months
      ) {
        onChange({ ...data, relationshipDuration: calculatedDuration })
      }
    }
  }, [(data as any).hasOfficialDate, data.officialDate?.year, data.officialDate?.month, data.officialDate?.day])

  const updateField = <K extends keyof StoryFormData>(
    field: K,
    value: StoryFormData[K]
  ) => {
    const newData = { ...data, [field]: value }
    onChange(newData)
  }

  const totalDays = calculateDays(data.relationshipDuration)

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="text-center pb-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">우리의 러브스토리</h2>
        <p className="text-sm text-gray-500 mt-1">두 분의 사랑 이야기를 3단계로 만들어드려요</p>
      </div>

      {/* 버전 선택 */}
      <Section title="어떤 스타일을 원하시나요?">
        <div className="grid grid-cols-2 gap-3">
          <VersionCard
            selected={version === 'short'}
            onClick={() => setVersion('short')}
            icon="📝"
            title="간결한 스토리"
            description="7개 필수 질문"
            detail="예상 길이: 200-300자"
          />
          <VersionCard
            selected={version === 'rich'}
            onClick={() => setVersion('rich')}
            icon="📖"
            title="풍부한 스토리"
            description="12개 질문"
            detail="예상 길이: 400-500자"
          />
        </div>
      </Section>

      {/* 3단계 아코디언 */}
      <Accordion
        type="multiple"
        value={openItems}
        onValueChange={setOpenItems}
        className="space-y-4"
      >
        {/* 1단계: 연애의 시작 */}
        <AccordionItem value="step1" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50">
            <StepHeader
              step={1}
              title="연애의 시작"
              description="첫 만남부터 사귀게 된 순간까지"
            />
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-6 pt-4">
              {/* 첫 만남 시기 */}
              <div className="space-y-2">
                <FieldLabel required>처음 만난 시기는?</FieldLabel>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={data.firstMeetDate.year}
                    onChange={(e) => updateField('firstMeetDate', { ...data.firstMeetDate, year: Number(e.target.value) })}
                    className="h-10 rounded-md border border-gray-200 px-3 text-sm bg-white"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>{y}년</option>
                    ))}
                  </select>
                  <select
                    value={data.firstMeetDate.month}
                    onChange={(e) => updateField('firstMeetDate', { ...data.firstMeetDate, month: Number(e.target.value) })}
                    className="h-10 rounded-md border border-gray-200 px-3 text-sm bg-white"
                  >
                    {months.map((m) => (
                      <option key={m} value={m}>{m}월</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 만남 장소 */}
              <div className="space-y-2">
                <FieldLabel required>어디서 만나셨나요?</FieldLabel>
                <RadioGroup
                  name="firstMeetPlace"
                  value={data.firstMeetPlace}
                  options={FIRST_MEET_PLACE_OPTIONS}
                  onChange={(v) => updateField('firstMeetPlace', v)}
                  columns={2}
                />
                {data.firstMeetPlace && (
                  <Input
                    className="mt-2"
                    placeholder='구체적 장소 (선택): 예: "성실관 5층", "같은 캠퍼스"'
                    value={(data as any).firstMeetPlaceDetail || ''}
                    onChange={(e) => updateField('firstMeetPlaceDetail' as any, e.target.value)}
                  />
                )}
              </div>

              {/* 사귀게 된 계기 */}
              <div className="space-y-2">
                <FieldLabel required>어떻게 사귀게 되었나요?</FieldLabel>
                <RadioGroup
                  name="howStarted"
                  value={data.howStarted}
                  options={HOW_STARTED_OPTIONS}
                  onChange={(v) => updateField('howStarted', v)}
                />
                {data.howStarted === 'custom' && (
                  <Input
                    className="mt-2"
                    placeholder="어떻게 사귀게 되었나요?"
                    value={(data as any).customHowStarted || ''}
                    onChange={(e) => updateField('customHowStarted' as any, e.target.value)}
                  />
                )}
              </div>

              {/* 공식 사귄 날짜 (선택) */}
              <div className="space-y-2">
                <FieldLabel hint="선택사항">공식적으로 사귄 날짜</FieldLabel>
                <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all border-gray-200 hover:border-gray-300">
                  <Checkbox
                    checked={(data as any).hasOfficialDate || false}
                    onCheckedChange={(checked) => updateField('hasOfficialDate' as any, checked)}
                  />
                  <span className="text-sm">정확한 날짜가 있어요</span>
                </label>
                {(data as any).hasOfficialDate && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <select
                      value={data.officialDate?.year || ''}
                      onChange={(e) => updateField('officialDate', { ...(data.officialDate || {}), year: Number(e.target.value) } as any)}
                      className="h-10 rounded-md border border-gray-200 px-3 text-sm bg-white"
                    >
                      <option value="">년</option>
                      {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    <select
                      value={data.officialDate?.month || ''}
                      onChange={(e) => updateField('officialDate', { ...(data.officialDate || {}), month: Number(e.target.value) } as any)}
                      className="h-10 rounded-md border border-gray-200 px-3 text-sm bg-white"
                    >
                      <option value="">월</option>
                      {months.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <select
                      value={data.officialDate?.day || ''}
                      onChange={(e) => updateField('officialDate', { ...(data.officialDate || {}), day: Number(e.target.value) } as any)}
                      className="h-10 rounded-md border border-gray-200 px-3 text-sm bg-white"
                    >
                      <option value="">일</option>
                      {days.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* 풍부한 버전 추가 질문 */}
              {version === 'rich' && (
                <>
                  <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                    <FieldLabel hint="선택사항">첫 만남 당시 결혼까지 예상했나요?</FieldLabel>
                    <RadioGroup
                      name="expectedMarriage"
                      value={(data as any).expectedMarriage || ''}
                      options={EXPECTED_MARRIAGE_OPTIONS}
                      onChange={(v) => updateField('expectedMarriage' as any, v)}
                    />
                  </div>

                  <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                    <FieldLabel hint='예: "내 말 하나하나에 귀 기울여주고 늘 내 편이 되어주는 모습"'>
                      연인으로 발전하게 된 계기를 더 자세히 (선택)
                    </FieldLabel>
                    <Textarea
                      placeholder="자유롭게 작성해주세요"
                      value={(data as any).loverTransitionDetail || ''}
                      onChange={(e) => updateField('loverTransitionDetail' as any, e.target.value)}
                      rows={3}
                    />
                  </div>
                </>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 2단계: 함께 성장한 시간 */}
        <AccordionItem value="step2" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50">
            <StepHeader
              step={2}
              title="함께 성장한 시간"
              description="특별한 순간들과 함께한 일상"
            />
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-6 pt-4">
              {/* 관계 기간 */}
              <div className="space-y-2">
                <FieldLabel required>현재까지 관계 기간은?</FieldLabel>
                {(data as any).hasOfficialDate && data.officialDate?.year && data.officialDate?.month ? (
                  // 공식 사귄 날짜가 있으면 자동 계산된 값 표시
                  <div className="p-4 bg-rose-50 rounded-lg border border-rose-100">
                    <p className="text-sm text-gray-600 mb-2">
                      📅 {data.officialDate.year}년 {data.officialDate.month}월 {data.officialDate.day || 1}일부터
                    </p>
                    <p className="text-lg font-semibold text-rose-600">
                      {data.relationshipDuration.years}년 {data.relationshipDuration.months}개월째 함께하고 있어요!
                    </p>
                    {totalDays > 0 && (
                      <p className="text-sm text-rose-500 mt-1">
                        (약 {totalDays.toLocaleString()}일) 💕
                      </p>
                    )}
                  </div>
                ) : (
                  // 공식 날짜 없으면 직접 입력
                  <>
                    <p className="text-xs text-gray-500 mb-2">
                      💡 위에서 &apos;공식 사귄 날짜&apos;를 입력하면 자동으로 계산됩니다
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500">년</label>
                        <Input
                          type="number"
                          min="0"
                          max="30"
                          value={data.relationshipDuration.years}
                          onChange={(e) => updateField('relationshipDuration', {
                            ...data.relationshipDuration,
                            years: parseInt(e.target.value) || 0
                          })}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">개월</label>
                        <Input
                          type="number"
                          min="0"
                          max="11"
                          value={data.relationshipDuration.months}
                          onChange={(e) => updateField('relationshipDuration', {
                            ...data.relationshipDuration,
                            months: parseInt(e.target.value) || 0
                          })}
                        />
                      </div>
                    </div>
                    {totalDays > 0 && (
                      <p className="text-sm text-rose-600 mt-2">
                        약 {totalDays.toLocaleString()}일 함께 하셨네요! 💕
                      </p>
                    )}
                  </>
                )}
                <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all border-gray-200 hover:border-gray-300 mt-2">
                  <Checkbox
                    checked={(data as any).showDays || false}
                    onCheckedChange={(checked) => updateField('showDays' as any, checked)}
                  />
                  <span className="text-sm">일수로도 표시하기 (예: &ldquo;함께한 4,135일&rdquo;)</span>
                </label>
              </div>

              {/* 기억에 남는 일들 */}
              <div className="space-y-2">
                <FieldLabel required hint="해당하는 것을 모두 선택해주세요">
                  함께한 시간 중 기억에 남는 일은?
                </FieldLabel>
                <CheckboxGroup
                  name="memorableEvents"
                  values={data.memorableEvents || []}
                  options={MEMORABLE_EVENTS_OPTIONS}
                  onChange={(v) => updateField('memorableEvents', v)}
                />
              </div>

              <div className="space-y-2">
                <FieldLabel hint='예: "서울과 부산 오가는 장거리", "심쿵이와 심바 가족 늘어남"'>
                  구체적으로 설명해주세요 (선택)
                </FieldLabel>
                <Textarea
                  placeholder="선택한 항목들을 구체적으로 설명해주세요"
                  value={(data as any).memorableEventsDetail || ''}
                  onChange={(e) => updateField('memorableEventsDetail' as any, e.target.value)}
                  rows={3}
                />
              </div>

              {/* 풍부한 버전 추가 질문 */}
              {version === 'rich' && (
                <>
                  <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                    <FieldLabel hint='예: "캠퍼스에서 공부하며 다투고 웃고", "타지에서 서로를 가장 든든한 편으로"'>
                      구체적인 에피소드들을 더 들려주세요 (선택)
                    </FieldLabel>
                    <Textarea
                      placeholder="여러 에피소드를 자유롭게 작성해주세요"
                      value={data.specificEpisodes || ''}
                      onChange={(e) => updateField('specificEpisodes', e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                    <FieldLabel hint='예: "조금씩 스며들어 당연한 사이가 됨", "조용히 하지만 분명하게 단단해짐"'>
                      관계가 어떻게 발전했나요? (선택)
                    </FieldLabel>
                    <Textarea
                      placeholder="관계의 변화와 발전을 설명해주세요"
                      value={(data as any).relationshipDevelopment || ''}
                      onChange={(e) => updateField('relationshipDevelopment' as any, e.target.value)}
                      rows={3}
                    />
                  </div>
                </>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 3단계: 결혼 준비 */}
        <AccordionItem value="step3" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50">
            <StepHeader
              step={3}
              title="결혼 준비"
              description="프로포즈부터 현재까지"
            />
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-6 pt-4">
              {/* 프로포즈 에피소드 */}
              <div className="space-y-2">
                <FieldLabel hint="선택사항">프로포즈 에피소드가 있나요?</FieldLabel>
                <RadioGroup
                  name="hasProposal"
                  value={(data as any).hasProposal || ''}
                  options={PROPOSAL_OPTIONS}
                  onChange={(v) => updateField('hasProposal' as any, v)}
                />
                {((data as any).hasProposal === 'formal' || (data as any).hasProposal === 'natural') && (
                  <Textarea
                    className="mt-2"
                    placeholder='예: "파리에서 깜짝 프로포즈", "세미 깜짝 프로포즈"'
                    value={data.proposalStory || ''}
                    onChange={(e) => updateField('proposalStory', e.target.value)}
                    rows={3}
                  />
                )}
              </div>

              {/* 결혼 준비 기간 */}
              <div className="space-y-2">
                <FieldLabel required>결혼 준비 기간은?</FieldLabel>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">년</label>
                    <Input
                      type="number"
                      min="0"
                      max="5"
                      value={data.preparationDuration.years}
                      onChange={(e) => updateField('preparationDuration', {
                        ...data.preparationDuration,
                        years: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">개월</label>
                    <Input
                      type="number"
                      min="0"
                      max="11"
                      value={data.preparationDuration.months}
                      onChange={(e) => updateField('preparationDuration', {
                        ...data.preparationDuration,
                        months: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* 결혼 준비 중 느낌 */}
              <div className="space-y-2">
                <FieldLabel hint="선택사항">결혼 준비 중 느낌</FieldLabel>
                <RadioGroup
                  name="preparationFeeling"
                  value={data.preparationFeeling || ''}
                  options={PREPARATION_FEELING_OPTIONS}
                  onChange={(v) => updateField('preparationFeeling', v)}
                  columns={2}
                />
                {data.preparationFeeling === 'custom' && (
                  <Input
                    className="mt-2"
                    placeholder="결혼 준비 중 느낌을 적어주세요"
                    value={(data as any).customPreparationFeeling || ''}
                    onChange={(e) => updateField('customPreparationFeeling' as any, e.target.value)}
                  />
                )}
              </div>

              {/* 풍부한 버전 추가 질문 */}
              {version === 'rich' && (
                <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                  <FieldLabel hint='예: "10주년 파리에서 깜짝 프로포즈", "영상과 꽃, 반지까지 준비한 세미 깜짝 프로포즈"'>
                    프로포즈 에피소드를 더 자세히 (선택)
                  </FieldLabel>
                  <Textarea
                    placeholder="프로포즈의 시기, 장소, 에피소드를 상세히 적어주세요"
                    value={(data as any).proposalDetail || ''}
                    onChange={(e) => updateField('proposalDetail' as any, e.target.value)}
                    rows={4}
                  />
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
