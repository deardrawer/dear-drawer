'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ProfileFormData,
  Tone,
  Version,
} from '@/types/ai-generator'

// 비유 옵션
const METAPHOR_OPTIONS = [
  { value: 'tree', label: '큰 나무 같은 사람' },
  { value: 'sun', label: '따뜻한 햇살 같은 사람' },
  { value: 'sea', label: '편안한 바다 같은 사람' },
  { value: 'diverse', label: '다양한 결을 가진 사람' },
  { value: 'different', label: '세상을 다르게 바라보는 사람' },
  { value: 'custom', label: '직접 입력' }
]

// 특징 옵션
const CHARACTERISTICS_OPTIONS = [
  { value: 'firm', label: '단단하고 흔들리지 않는' },
  { value: 'sensitive-rational', label: '감성적이면서도 냉철한' },
  { value: 'proactive', label: '주도적이고 독립적인' },
  { value: 'curious', label: '호기심이 많고 꼼꼼한' },
  { value: 'delicate', label: '섬세하고 세심한' },
  { value: 'comfortable', label: '편안하고 한결같은' },
  { value: 'perfectionist', label: '완벽주의적이고 주관 뚜렷한' },
  { value: 'clear-standards', label: '자기만의 기준이 또렷한' },
  { value: 'sincere', label: '성실하고 책임감 있는' }
]

// 함께 있을 때 느낌 옵션
const TOGETHER_FEELING_OPTIONS = [
  { value: 'comfortable', label: '마음이 놓이고 안심이 된다' },
  { value: 'different-view', label: '세상을 다르게 보게 된다' },
  { value: 'special-day', label: '하루하루가 특별해진다' },
  { value: 'pleasant', label: '편안하고 즐겁다' },
  { value: 'courage', label: '용기가 생긴다' },
  { value: 'growth', label: '함께 성장하게 된다' },
  { value: 'custom', label: '직접 입력' }
]

// 톤 옵션
const TONE_OPTIONS: { value: Tone; label: string; preview: string }[] = [
  { value: 'sincere', label: '깊이있고 진지한', preview: '아주 커다란 나무 한 그루 같은 사람입니다...' },
  { value: 'warm', label: '따뜻하고 감성적인', preview: '다양한 결을 가진 사람입니다...' },
  { value: 'cheerful', label: '밝고 경쾌한', preview: '함께 있으면 자연스럽게 웃게 되는 사람입니다...' }
]

// 관계 역사 옵션
const RELATIONSHIP_HISTORY_OPTIONS = [
  { value: 'childhood', label: '어린 시절부터 함께' },
  { value: 'friend-to-lover', label: '오랜 친구에서 연인으로' },
  { value: 'recent', label: '최근에 만남' },
  { value: 'none', label: '해당없음' }
]

interface ProfileFormProps {
  data: ProfileFormData
  onChange: (data: ProfileFormData) => void
  role: 'groom' | 'bride'
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
  options: { value: string; label: string; preview?: string }[]
  onChange: (value: string) => void
  columns?: number
}) {
  return (
    <div
      className={`grid break-keep wrap-anywhere gap-2 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}
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

// 체크박스 그룹 컴포넌트 (최대 선택 제한)
function CheckboxGroup({
  name,
  values,
  options,
  onChange,
  max = 2
}: {
  name: string
  values: string[]
  options: { value: string; label: string }[]
  onChange: (values: string[]) => void
  max?: number
}) {
  const toggle = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value))
    } else {
      if (values.length >= max) {
        // 최대치 도달시 첫 번째 선택 제거 후 새로운 것 추가
        onChange([...values.slice(1), value])
      } else {
        onChange([...values, value])
      }
    }
  }

  return (
    <div
      className="grid break-keep wrap-anywhere grid-cols-2 gap-2"
      role="group"
      aria-label={name}
    >
      {options.map((option) => {
        const isSelected = values.includes(option.value)
        const isDisabled = !isSelected && values.length >= max

        return (
          <label
            key={option.value}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all min-h-[44px] ${
              isSelected
                ? 'border-rose-500 bg-rose-50'
                : isDisabled
                ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => !isDisabled && toggle(option.value)}
              disabled={isDisabled}
            />
            <span className="text-sm">{option.label}</span>
          </label>
        )
      })}
    </div>
  )
}

// 버전 카드 컴포넌트
function VersionCard({
  selected,
  onClick,
  title,
  description,
  detail
}: {
  selected: boolean
  onClick: () => void
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
      <h4 className="font-semibold text-gray-900">{title}</h4>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
      <p className="text-xs text-gray-400 mt-2">{detail}</p>
    </button>
  )
}

// 메인 컴포넌트
export default function ProfileForm({ data, onChange, role }: ProfileFormProps) {
  const [version, setVersion] = useState<Version>(data.version || 'short')

  // 버전 변경시 데이터 업데이트
  useEffect(() => {
    if (data.version !== version) {
      const newData = { ...data, version }
      onChange(newData)
    }
  }, [version, data, onChange])

  const updateField = <K extends keyof ProfileFormData>(
    field: K,
    value: ProfileFormData[K]
  ) => {
    const newData = { ...data, [field]: value }
    onChange(newData)
  }

  const personLabel = role === 'groom' ? '신랑' : '신부'
  const partnerLabel = role === 'groom' ? '신부' : '신랑'
  const bgColor = role === 'groom' ? 'bg-blue-50' : 'bg-pink-50'
  const borderColor = role === 'groom' ? 'border-blue-200' : 'border-pink-200'

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className={`p-4 rounded-lg ${bgColor} border ${borderColor}`}>
        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
          {personLabel} 소개
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {partnerLabel}가 작성하는 {personLabel} 소개글이에요
        </p>
      </div>

      {/* 버전 선택 */}
      <Section title="어떤 스타일을 원하시나요?">
        <div className="grid break-keep wrap-anywhere grid-cols-2 gap-3">
          <VersionCard
            selected={version === 'short'}
            onClick={() => setVersion('short')}
            title="간결한 소개"
            description="2-3문단 / 4개 질문"
            detail="예상 길이: 150-200자"
          />
          <VersionCard
            selected={version === 'rich'}
            onClick={() => setVersion('rich')}
            title="풍부한 소개"
            description="4-5문단 / 9개 질문"
            detail="예상 길이: 300-400자"
          />
        </div>
      </Section>

      {/* 필수 질문들 */}
      <Section title="기본 정보">
        {/* 이름 */}
        <div className="space-y-2">
          <FieldLabel required>{personLabel} 이름</FieldLabel>
          <Input
            value={data.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="이름을 입력해주세요"
          />
        </div>

        {/* 비유 */}
        <div className="space-y-2">
          <FieldLabel required>
            {partnerLabel}가 {personLabel}을 한 문장으로 비유한다면?
          </FieldLabel>
          <RadioGroup
            name={`${role}-metaphor`}
            value={data.metaphor}
            options={METAPHOR_OPTIONS}
            onChange={(v) => updateField('metaphor', v)}
          />
          {data.metaphor === 'custom' && (
            <Input
              className="mt-2"
              placeholder="예: 마음의 속도가 흔들리지 않는 사람"
              value={(data as any).customMetaphor || ''}
              onChange={(e) => updateField('customMetaphor' as any, e.target.value)}
            />
          )}
        </div>

        {/* 특징 2가지 */}
        <div className="space-y-2">
          <FieldLabel required hint="정확히 2개를 선택해주세요">
            {personLabel}의 대표 특징 2가지는?
          </FieldLabel>
          <CheckboxGroup
            name={`${role}-characteristics`}
            values={data.characteristics || []}
            options={CHARACTERISTICS_OPTIONS}
            onChange={(v) => updateField('characteristics', v)}
            max={2}
          />
          <p className="text-sm text-gray-500">
            {(data.characteristics || []).length}/2 선택됨
          </p>
        </div>

        {/* 함께 있을 때 느낌 */}
        <div className="space-y-2">
          <FieldLabel required>
            {personLabel}와 함께 있으면 어떤 기분이 드나요?
          </FieldLabel>
          <RadioGroup
            name={`${role}-togetherFeeling`}
            value={data.togetherFeeling}
            options={TOGETHER_FEELING_OPTIONS}
            onChange={(v) => updateField('togetherFeeling', v)}
          />
          {data.togetherFeeling === 'custom' && (
            <Input
              className="mt-2"
              placeholder="어떤 기분인지 적어주세요"
              value={(data as any).customTogetherFeeling || ''}
              onChange={(e) => updateField('customTogetherFeeling' as any, e.target.value)}
            />
          )}
        </div>

        {/* 톤 선택 */}
        <div className="space-y-2">
          <FieldLabel required>어떤 느낌으로 소개하고 싶나요?</FieldLabel>
          <RadioGroup
            name={`${role}-tone`}
            value={data.tone}
            options={TONE_OPTIONS}
            onChange={(v) => updateField('tone', v as Tone)}
          />
        </div>
      </Section>

      {/* 풍부한 버전 추가 질문들 */}
      {version === 'rich' && (
        <Section title="더 풍부한 소개를 위한 추가 질문 (선택)">
          {/* 첫인상 vs 실제 */}
          <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
            <FieldLabel hint="선택사항">첫인상과 실제 모습의 차이가 있나요?</FieldLabel>
            <RadioGroup
              name={`${role}-firstImpressionDiff`}
              value={(data as any).hasFirstImpressionDiff || ''}
              options={[
                { value: 'yes', label: '차이가 있다' },
                { value: 'no', label: '겉과 속이 비슷하다 (건너뛰기)' }
              ]}
              onChange={(v) => updateField('hasFirstImpressionDiff' as any, v)}
              columns={2}
            />
            {(data as any).hasFirstImpressionDiff === 'yes' && (
              <Textarea
                className="mt-2"
                placeholder='예: "처음엔 차갑게 보였지만, 알고 보니 따뜻한 사람"'
                value={data.firstImpressionVsReality || ''}
                onChange={(e) => updateField('firstImpressionVsReality', e.target.value)}
                rows={2}
              />
            )}
          </div>

          {/* 구체적 모습/습관 */}
          <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
            <FieldLabel hint='예: "운동도 잘하고, 게임도 잘해요"'>
              {personLabel}의 구체적인 모습이나 습관은? (선택)
            </FieldLabel>
            <Textarea
              placeholder="구체적인 모습을 자유롭게 적어주세요"
              value={data.specificDetails || ''}
              onChange={(e) => updateField('specificDetails', e.target.value)}
              rows={2}
            />
          </div>

          {/* 양면성 */}
          <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
            <FieldLabel hint='예: "감성적이면서도 냉철한"'>
              {personLabel}이 가진 대비되는 특징이 있나요? (선택)
            </FieldLabel>
            <RadioGroup
              name={`${role}-duality`}
              value={(data as any).hasDuality || ''}
              options={[
                { value: 'yes', label: '있음' },
                { value: 'no', label: '없음 (건너뛰기)' }
              ]}
              onChange={(v) => updateField('hasDuality' as any, v)}
              columns={2}
            />
            {(data as any).hasDuality === 'yes' && (
              <Textarea
                className="mt-2"
                placeholder="어떤 양면성이 있나요?"
                value={data.duality || ''}
                onChange={(e) => updateField('duality', e.target.value)}
                rows={2}
              />
            )}
          </div>

          {/* 미래 기대 */}
          <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
            <FieldLabel hint='예: "앞으로의 매일도 더 특별하고 반짝일 거예요"'>
              {personLabel}와 함께하는 미래가 어떨 것 같나요? (선택)
            </FieldLabel>
            <Textarea
              placeholder="기대되는 미래를 적어주세요"
              value={data.futureExpectation || ''}
              onChange={(e) => updateField('futureExpectation', e.target.value)}
              rows={2}
            />
          </div>

          {/* 관계 역사 */}
          <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
            <FieldLabel hint="선택사항">관계의 역사</FieldLabel>
            <RadioGroup
              name={`${role}-relationshipHistory`}
              value={data.relationshipHistory || ''}
              options={RELATIONSHIP_HISTORY_OPTIONS}
              onChange={(v) => updateField('relationshipHistory', v)}
              columns={2}
            />
          </div>
        </Section>
      )}
    </div>
  )
}
