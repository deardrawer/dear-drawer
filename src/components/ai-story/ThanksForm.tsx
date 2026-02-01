'use client'

import * as React from 'react'
import { Label } from '@/components/ui/label'
import {
  GreetingFormData,
  ThanksStyle,
} from '@/types/ai-generator'

// 감사 스타일 옵션
const THANKS_STYLE_OPTIONS = [
  {
    value: 'formal',
    label: '정중하고 공손한',
    preview: '지금까지 저희를 지켜봐 주시고 아껴주신 모든 분들께 진심으로 감사드립니다.'
  },
  {
    value: 'warm',
    label: '따뜻하고 감성적인',
    preview: '오늘 이 자리까지 함께해주신 모든 분들께 감사드립니다. 여러분의 축복이 저희에게 큰 힘이 됩니다.'
  },
  {
    value: 'friendly',
    label: '친근하고 밝은',
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
    preview: '부족한 저희 두 사람을 여기까지 이끌어주신 모든 분들께 깊이 감사드립니다.'
  }
]

interface ThanksFormProps {
  data: GreetingFormData
  onChange: (data: GreetingFormData) => void
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

export default function ThanksForm({ data, onChange }: ThanksFormProps) {
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
        <h2 className="text-lg font-bold text-gray-900">감사 인사 작성하기</h2>
        <p className="text-sm text-gray-500 mt-1">하객분들께 전하는 감사의 마음을 담아드려요</p>
      </div>

      {/* 감사 스타일 선택 */}
      <div className="space-y-4">
        <FieldLabel required>어떤 느낌의 감사 인사를 원하세요?</FieldLabel>

        <div className="space-y-2">
          {THANKS_STYLE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex flex-col p-4 rounded-lg border cursor-pointer transition-all ${
                data.thanksStyle === option.value
                  ? 'border-rose-500 bg-rose-50 ring-1 ring-rose-500'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="thanksStyle"
                  value={option.value}
                  checked={data.thanksStyle === option.value}
                  onChange={(e) => updateField('thanksStyle', e.target.value as ThanksStyle)}
                  className="w-4 h-4 text-rose-500 border-gray-300 focus:ring-rose-500"
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
          💡 선택하신 스타일에 맞춰 두 분만의 감사 인사를 생성해드립니다.
        </p>
      </div>
    </div>
  )
}
