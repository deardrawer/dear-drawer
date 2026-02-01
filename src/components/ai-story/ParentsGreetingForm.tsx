'use client'

import * as React from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'

// 부모님 인사말 스타일 옵션
const PARENTS_STYLE_OPTIONS = [
  {
    value: 'proud',
    label: '자랑스럽고 감사한',
    preview: '저희 딸/아들이 좋은 사람을 만나 새로운 가정을 꾸리게 되었습니다.'
  },
  {
    value: 'emotional',
    label: '감성적이고 따뜻한',
    preview: '어느덧 훌쩍 커버린 아이가 평생의 반려자를 만나 새 출발을 합니다.'
  },
  {
    value: 'grateful',
    label: '감사하고 정중한',
    preview: '그동안 저희 가족을 아껴주신 모든 분들께 감사드립니다.'
  },
  {
    value: 'simple',
    label: '간결하고 담백한',
    preview: '저희 자녀가 결혼합니다. 함께 축복해주세요.'
  }
]

export interface ParentsGreetingFormData {
  childName: string           // 자녀 이름
  childDescription: string    // 자녀에 대한 설명
  partnerDescription: string  // 배우자에 대한 첫인상/느낌
  parentsFeelings: string     // 부모님의 마음/감정
  greetingStyle: 'proud' | 'emotional' | 'grateful' | 'simple'
}

interface ParentsGreetingFormProps {
  data: ParentsGreetingFormData
  onChange: (data: ParentsGreetingFormData) => void
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

export const defaultParentsGreetingForm: ParentsGreetingFormData = {
  childName: '',
  childDescription: '',
  partnerDescription: '',
  parentsFeelings: '',
  greetingStyle: 'proud',
}

export default function ParentsGreetingForm({ data, onChange }: ParentsGreetingFormProps) {
  const updateField = <K extends keyof ParentsGreetingFormData>(
    field: K,
    value: ParentsGreetingFormData[K]
  ) => {
    const newData = { ...data, [field]: value }
    onChange(newData)
  }

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="text-center pb-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">부모님 인사말 작성하기</h2>
        <p className="text-sm text-gray-500 mt-1">부모님의 시선으로 자녀의 결혼을 축하해주세요</p>
      </div>

      {/* 자녀 이름 */}
      <div className="space-y-3">
        <FieldLabel required hint="결혼하는 자녀의 이름을 입력해주세요">
          자녀 이름
        </FieldLabel>
        <Input
          value={data.childName}
          onChange={(e) => updateField('childName', e.target.value)}
          placeholder="예: 서연"
          className="w-full"
        />
      </div>

      {/* 자녀에 대한 설명 */}
      <div className="space-y-3">
        <FieldLabel required hint="자녀가 어떤 사람인지, 어떻게 자랐는지 설명해주세요">
          자녀에 대해 이야기해주세요
        </FieldLabel>
        <Textarea
          value={data.childDescription}
          onChange={(e) => updateField('childDescription', e.target.value)}
          placeholder="예: 어릴 적부터 마음이 따뜻하고 다정한 아이였습니다. 언제나 가족을 먼저 생각하고..."
          rows={4}
          className="w-full resize-none"
        />
      </div>

      {/* 배우자에 대한 첫인상 */}
      <div className="space-y-3">
        <FieldLabel hint="자녀의 배우자를 처음 만났을 때 느낌이나 인상">
          배우자에 대한 인상
        </FieldLabel>
        <Textarea
          value={data.partnerDescription}
          onChange={(e) => updateField('partnerDescription', e.target.value)}
          placeholder="예: 처음 만났을 때부터 믿음직하고 성실한 분이라고 느꼈습니다..."
          rows={3}
          className="w-full resize-none"
        />
      </div>

      {/* 부모님의 마음 */}
      <div className="space-y-3">
        <FieldLabel hint="결혼을 앞둔 자녀에게 전하고 싶은 부모님의 마음">
          부모님의 마음
        </FieldLabel>
        <Textarea
          value={data.parentsFeelings}
          onChange={(e) => updateField('parentsFeelings', e.target.value)}
          placeholder="예: 이제 저희 품을 떠나지만, 항상 응원하고 있다는 것을 잊지 않았으면 합니다..."
          rows={4}
          className="w-full resize-none"
        />
      </div>

      {/* 인사말 스타일 선택 */}
      <div className="space-y-4">
        <FieldLabel required>어떤 느낌의 인사말을 원하세요?</FieldLabel>

        <div className="space-y-2">
          {PARENTS_STYLE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex flex-col p-4 rounded-lg border cursor-pointer transition-all ${
                data.greetingStyle === option.value
                  ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="greetingStyle"
                  value={option.value}
                  checked={data.greetingStyle === option.value}
                  onChange={(e) => updateField('greetingStyle', e.target.value as ParentsGreetingFormData['greetingStyle'])}
                  className="w-4 h-4 text-amber-500 border-gray-300 focus:ring-amber-500"
                />
                <span className="text-sm font-medium">{option.label}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2 ml-7">{option.preview}</p>
            </label>
          ))}
        </div>
      </div>

      {/* 안내 메시지 */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          💡 입력하신 내용을 바탕으로 부모님의 마음이 담긴 인사말을 생성해드립니다.
        </p>
      </div>
    </div>
  )
}
