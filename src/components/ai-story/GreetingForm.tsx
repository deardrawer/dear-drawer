'use client'

import * as React from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  GreetingFormData,
  Tone,
  ThanksStyle,
} from '@/types/ai-generator'

// 미리보기 텍스트 상수
const GREETING_PREVIEWS: Record<Tone, string> = {
  sincere: '20대의 인생을 함께 걸어오며 서로의 성장과 변화를 지켜본 우리는 더 나은 우리가 되기를 꿈꾸며 새로운 여정을 시작하려 합니다.',
  warm: '사랑하는 두 사람이 평생을 약속하는 순간, 가장 소중한 분들을 모시고자 합니다. 저희의 첫 걸음에 함께해주세요.',
  concise: '저희 두 사람이 하나 되는 날, 여러분을 초대합니다.',
  cheerful: '드디어! 저희 둘이 결혼합니다! 이 특별한 날, 꼭 함께해주세요!'
}

const THANKS_PREVIEWS: Record<ThanksStyle, string> = {
  formal: '지금까지 저희를 지켜봐 주시고 아껴주신 모든 분들께 진심으로 감사드립니다. 앞으로도 많은 응원과 축복 부탁드립니다.',
  warm: '오늘 이 자리까지 함께해주신 모든 분들께 감사드립니다. 여러분의 축복이 저희에게 큰 힘이 됩니다. 앞으로도 따뜻한 시선으로 지켜봐 주세요.',
  friendly: '지금까지 저희를 아껴주신 모든 분들께 감사드립니다. 앞으로도 많은 응원과 축복 부탁드립니다. 💕',
  simple: '함께해주셔서 감사합니다. 앞으로도 지켜봐주세요.',
  humble: '부족한 저희 두 사람을 여기까지 이끌어주신 모든 분들께 깊이 감사드립니다. 앞으로도 변함없는 관심과 사랑 부탁드립니다.'
}

// 관계 기간 옵션
const RELATIONSHIP_DURATION_OPTIONS = [
  { value: '1year-', label: '1년 미만' },
  { value: '1-3years', label: '1-3년' },
  { value: '3-5years', label: '3-5년' },
  { value: '5-10years', label: '5-10년' },
  { value: '10years+', label: '10년 이상' }
]

// 관계 특징 옵션
const RELATIONSHIP_TRAITS_OPTIONS = [
  { value: 'growth', label: '함께 성장해온' },
  { value: 'understanding', label: '서로를 이해하는' },
  { value: 'dream', label: '같은 꿈을 꾸는' },
  { value: 'friend', label: '오랜 친구 같은' },
  { value: 'destiny', label: '운명 같은' }
]

// 결혼 의미 옵션
const MARRIAGE_MEANING_OPTIONS = [
  { value: 'newStart', label: '새로운 시작' },
  { value: 'lifelong', label: '평생의 약속' },
  { value: 'growTogether', label: '함께 성장하기' },
  { value: 'family', label: '가족 되기' },
  { value: 'other', label: '기타' }
]

// 톤 옵션
const TONE_OPTIONS: { value: Tone; label: string; preview: string }[] = [
  { value: 'sincere', label: '진솔하고 깊이있는', preview: '20대의 인생을 함께 걸어오며...' },
  { value: 'warm', label: '따뜻하고 감성적인', preview: '사랑하는 두 사람이 평생을 약속하는...' },
  { value: 'concise', label: '간결하고 단정한', preview: '저희 두 사람이 하나 되는 날...' },
  { value: 'cheerful', label: '유머러스하고 밝은', preview: '드디어! 저희 둘이 결혼합니다!' }
]

// 감사 스타일 옵션 (5가지)
const THANKS_STYLE_OPTIONS = [
  {
    value: 'formal',
    label: '정중하고 공손한',
    preview: '지금까지 저희를 지켜봐 주시고 아껴주신 모든 분들께 진심으로 감사드립니다. 앞으로도 많은 응원과 축복 부탁드립니다.'
  },
  {
    value: 'warm',
    label: '따뜻하고 감성적인',
    preview: '오늘 이 자리까지 함께해주신 모든 분들께 감사드립니다. 여러분의 축복이 저희에게 큰 힘이 됩니다. 앞으로도 따뜻한 시선으로 지켜봐 주세요.'
  },
  {
    value: 'friendly',
    label: '친근하고 밝은 (이모지)',
    preview: '지금까지 저희를 아껴주신 모든 분들께 감사드립니다. 앞으로도 많은 응원과 축복 부탁드립니다. 💕'
  },
  {
    value: 'simple',
    label: '간결하고 진솔한',
    preview: '함께해주셔서 감사합니다. 앞으로도 지켜봐주세요.'
  },
  {
    value: 'humble',
    label: '겸손하고 정중한',
    preview: '부족한 저희 두 사람을 여기까지 이끌어주신 모든 분들께 깊이 감사드립니다. 앞으로도 변함없는 관심과 사랑 부탁드립니다.'
  }
]

interface GreetingFormProps {
  data: GreetingFormData
  onChange: (data: GreetingFormData) => void
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
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
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
  columns = 2
}: {
  name: string;
  value: string;
  options: { value: string; label: string; preview?: string }[];
  onChange: (value: string) => void;
  columns?: number;
}) {
  return (
    <div
      className={`grid break-keep wrap-anywhere gap-2 ${columns === 2 ? 'grid-cols-2' : columns === 3 ? 'grid-cols-3' : 'grid-cols-1'}`}
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
            aria-required="true"
          />
          <div className="flex-1">
            <span className="text-sm font-medium">{option.label}</span>
            {option.preview && (
              <p className="text-xs text-gray-500 mt-0.5">{option.preview}</p>
            )}
          </div>
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
  name: string;
  values: string[];
  options: { value: string; label: string }[];
  onChange: (values: string[]) => void;
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
      className="grid break-keep wrap-anywhere grid-cols-2 gap-2"
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
            aria-required="true"
          />
          <span className="text-sm">{option.label}</span>
        </label>
      ))}
    </div>
  )
}

// 미리보기 박스 컴포넌트
function PreviewBox({
  title,
  content,
  show
}: {
  title: string;
  content: string;
  show: boolean;
}) {
  if (!show) return null

  return (
    <div className="mt-3 p-4 bg-rose-50 rounded-lg border border-rose-200">
      <p className="text-xs text-rose-600 font-medium mb-2">{title}</p>
      <p className="text-sm text-gray-700 leading-relaxed">{content}</p>
    </div>
  )
}

export default function GreetingForm({ data, onChange }: GreetingFormProps) {
  const updateField = <K extends keyof GreetingFormData>(
    field: K,
    value: GreetingFormData[K]
  ) => {
    const newData = { ...data, [field]: value }
    onChange(newData)
  }

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="text-center pb-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">인사말 & 감사말 작성하기</h2>
        <p className="text-sm text-gray-500 mt-1">두 분의 이야기를 담은 인사말과 감사말을 만들어드려요</p>
      </div>

      {/* 섹션 1: 관계 정보 */}
      <Section title="두 분의 관계에 대해 알려주세요">
        {/* 관계 기간 */}
        <div className="space-y-2">
          <FieldLabel required>연애 기간</FieldLabel>
          <RadioGroup
            name="relationshipDuration"
            value={data.relationshipDuration}
            options={RELATIONSHIP_DURATION_OPTIONS}
            onChange={(v) => updateField('relationshipDuration', v)}
            columns={2}
          />
        </div>

        {/* 관계 특징 */}
        <div className="space-y-2">
          <FieldLabel required hint="복수 선택 가능">관계의 특징</FieldLabel>
          <CheckboxGroup
            name="relationshipTraits"
            values={data.relationshipTraits || []}
            options={RELATIONSHIP_TRAITS_OPTIONS}
            onChange={(v) => updateField('relationshipTraits', v)}
          />
        </div>

        {/* 결혼의 의미 */}
        <div className="space-y-2">
          <FieldLabel required>두 분에게 결혼은 어떤 의미인가요?</FieldLabel>
          <RadioGroup
            name="marriageMeaning"
            value={data.marriageMeaning}
            options={MARRIAGE_MEANING_OPTIONS}
            onChange={(v) => updateField('marriageMeaning', v)}
            columns={2}
          />
          {data.marriageMeaning === 'other' && (
            <Textarea
              value={data.specialNote || ''}
              onChange={(e) => updateField('specialNote', e.target.value)}
              placeholder="결혼의 의미를 직접 적어주세요"
              rows={2}
              className="mt-2"
            />
          )}
        </div>

        {/* 특별한 메시지 */}
        <div className="space-y-2">
          <FieldLabel hint="예: '20대를 함께 보냈어요', '같은 고향에서 자랐어요'">
            특별히 담고 싶은 내용이 있나요? (선택)
          </FieldLabel>
          <Textarea
            value={data.specialNote || ''}
            onChange={(e) => updateField('specialNote', e.target.value)}
            placeholder="선택사항입니다"
            rows={2}
          />
        </div>
      </Section>

      {/* 섹션 2: 인사말 스타일 */}
      <Section title="인사말 스타일">
        <div className="space-y-2">
          <FieldLabel required>어떤 느낌의 인사말을 원하세요?</FieldLabel>
          <RadioGroup
            name="greetingTone"
            value={data.greetingTone}
            options={TONE_OPTIONS}
            onChange={(v) => updateField('greetingTone', v as Tone)}
            columns={1}
          />
        </div>

        {/* 선택한 톤의 미리보기 */}
        <PreviewBox
          title="💡 이런 느낌으로 만들어드려요"
          content={GREETING_PREVIEWS[data.greetingTone]}
          show={!!data.greetingTone}
        />
      </Section>

      {/* 섹션 3: 감사말 */}
      <Section title="감사의 마음 전하기">
        {/* 감사 스타일 */}
        <div className="space-y-2">
          <FieldLabel required>감사말 스타일</FieldLabel>
          <RadioGroup
            name="thanksStyle"
            value={data.thanksStyle || 'formal'}
            options={THANKS_STYLE_OPTIONS.map(opt => ({
              value: opt.value,
              label: opt.label,
              preview: opt.preview
            }))}
            onChange={(v) => updateField('thanksStyle', v as ThanksStyle)}
            columns={1}
          />
        </div>
      </Section>
    </div>
  )
}
