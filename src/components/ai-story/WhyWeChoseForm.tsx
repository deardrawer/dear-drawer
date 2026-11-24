'use client'

import { useState } from 'react'
import { User, Users } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  WhyWeChoseFormData,
  WhyWeChoseTheme,
  WHY_WE_CHOSE_THEMES,
  Version,
} from '@/types/ai-generator'

interface WhyWeChoseFormProps {
  data: WhyWeChoseFormData
  onChange: (data: WhyWeChoseFormData) => void
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

// 테마 선택 카드 컴포넌트
function ThemeCard({
  theme,
  selected,
  onClick
}: {
  theme: typeof WHY_WE_CHOSE_THEMES[number]
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-3 rounded-lg border-2 text-left transition-all ${
        selected
          ? 'border-rose-500 bg-rose-50'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-2">
        <div>
          <p className="font-medium text-sm text-gray-900">{theme.title}</p>
          <p className="text-xs text-gray-500">{theme.description}</p>
        </div>
      </div>
    </button>
  )
}

// 섹션 헤더 컴포넌트
function PersonHeader({
  person,
  color,
  theme
}: {
  person: '신랑' | '신부'
  color: 'blue' | 'pink'
  theme?: string
}) {
  const bgColor = color === 'blue' ? 'bg-blue-100' : 'bg-pink-100'
  const textColor = color === 'blue' ? 'text-blue-600' : 'text-pink-600'

  return (
    <div className="flex items-center gap-3">
      <span className={`w-8 h-8 rounded-full ${bgColor} ${textColor} flex items-center justify-center font-bold text-sm`}>
        <User className="w-4 h-4" strokeWidth={1.75} />
      </span>
      <div className="text-left flex-1">
        <h3 className="font-semibold text-gray-900">{person}</h3>
        <p className="text-sm text-gray-500">
          {theme || '테마를 선택해주세요'}
        </p>
      </div>
    </div>
  )
}

export default function WhyWeChoseForm({ data, onChange }: WhyWeChoseFormProps) {
  const [version, setVersion] = useState<Version>(data.version || 'short')
  const [openItems, setOpenItems] = useState<string[]>(['names', 'groom', 'bride'])

  const updateField = <K extends keyof WhyWeChoseFormData>(
    field: K,
    value: WhyWeChoseFormData[K]
  ) => {
    onChange({ ...data, [field]: value })
  }

  const handleVersionChange = (newVersion: Version) => {
    setVersion(newVersion)
    onChange({ ...data, version: newVersion })
  }

  const handleThemeChange = (person: 'groom' | 'bride', themeId: WhyWeChoseTheme) => {
    if (person === 'groom') {
      onChange({
        ...data,
        groomTheme: themeId,
        groomAnswer1: '',
        groomAnswer2: '',
        groomAnswer3: '',
      })
    } else {
      onChange({
        ...data,
        brideTheme: themeId,
        brideAnswer1: '',
        brideAnswer2: '',
        brideAnswer3: '',
      })
    }
  }

  const groomThemeData = WHY_WE_CHOSE_THEMES.find(t => t.id === data.groomTheme)
  const brideThemeData = WHY_WE_CHOSE_THEMES.find(t => t.id === data.brideTheme)

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="text-center pb-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">서로를 선택한 이유</h2>
        <p className="text-sm text-gray-500 mt-1">각자의 테마를 선택하고 이야기를 들려주세요</p>
      </div>

      {/* 버전 선택 */}
      <Section title="어떤 스타일을 원하시나요?">
        <div className="grid break-keep wrap-anywhere grid-cols-2 gap-3">
          <VersionCard
            selected={version === 'short'}
            onClick={() => handleVersionChange('short')}
            title="간결한 이야기"
            description="핵심만 담백하게"
            detail="예상 길이: 3-4문장"
          />
          <VersionCard
            selected={version === 'rich'}
            onClick={() => handleVersionChange('rich')}
            title="풍부한 이야기"
            description="디테일하게 표현"
            detail="예상 길이: 5-6문장"
          />
        </div>
      </Section>

      {/* 아코디언 */}
      <Accordion
        type="multiple"
        value={openItems}
        onValueChange={setOpenItems}
        className="space-y-4"
      >
        {/* 이름 입력 */}
        <AccordionItem value="names" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm">
                <Users className="w-4 h-4" strokeWidth={1.75} />
              </span>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">커플 정보</h3>
                <p className="text-sm text-gray-500">신랑·신부 이름을 입력해주세요</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="space-y-2">
                <FieldLabel required>신랑 이름</FieldLabel>
                <Input
                  placeholder="예: 홍길동"
                  value={data.groomName}
                  onChange={(e) => updateField('groomName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <FieldLabel required>신부 이름</FieldLabel>
                <Input
                  placeholder="예: 김영희"
                  value={data.brideName}
                  onChange={(e) => updateField('brideName', e.target.value)}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 신랑 섹션 */}
        <AccordionItem value="groom" className="border rounded-lg overflow-hidden border-blue-200">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-blue-50/50">
            <PersonHeader
              person="신랑"
              color="blue"
              theme={groomThemeData ? groomThemeData.title : undefined}
            />
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 bg-blue-50/30">
            <div className="space-y-6 pt-4">
              {/* 테마 선택 */}
              <div className="space-y-3">
                <FieldLabel required>신부를 선택한 이유의 테마</FieldLabel>
                <div className="grid grid-cols-1 gap-2">
                  {WHY_WE_CHOSE_THEMES.map((theme) => (
                    <ThemeCard
                      key={theme.id}
                      theme={theme}
                      selected={data.groomTheme === theme.id}
                      onClick={() => handleThemeChange('groom', theme.id)}
                    />
                  ))}
                </div>
              </div>

              {/* 테마 선택 후 질문 표시 */}
              {groomThemeData && (
                <div className="space-y-4 pt-4 border-t border-blue-200">
                  <div className="space-y-2">
                    <FieldLabel required hint={groomThemeData.questions.q1.placeholder}>
                      {groomThemeData.questions.q1.label}
                    </FieldLabel>
                    <Textarea
                      placeholder={groomThemeData.questions.q1.placeholder}
                      value={data.groomAnswer1}
                      onChange={(e) => updateField('groomAnswer1', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <FieldLabel required hint={groomThemeData.questions.q2.placeholder}>
                      {groomThemeData.questions.q2.label}
                    </FieldLabel>
                    <Textarea
                      placeholder={groomThemeData.questions.q2.placeholder}
                      value={data.groomAnswer2}
                      onChange={(e) => updateField('groomAnswer2', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <FieldLabel required hint={groomThemeData.questions.q3.placeholder}>
                      {groomThemeData.questions.q3.label}
                    </FieldLabel>
                    <Textarea
                      placeholder={groomThemeData.questions.q3.placeholder}
                      value={data.groomAnswer3}
                      onChange={(e) => updateField('groomAnswer3', e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 신부 섹션 */}
        <AccordionItem value="bride" className="border rounded-lg overflow-hidden border-pink-200">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-pink-50/50">
            <PersonHeader
              person="신부"
              color="pink"
              theme={brideThemeData ? brideThemeData.title : undefined}
            />
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 bg-pink-50/30">
            <div className="space-y-6 pt-4">
              {/* 테마 선택 */}
              <div className="space-y-3">
                <FieldLabel required>신랑을 선택한 이유의 테마</FieldLabel>
                <div className="grid grid-cols-1 gap-2">
                  {WHY_WE_CHOSE_THEMES.map((theme) => (
                    <ThemeCard
                      key={theme.id}
                      theme={theme}
                      selected={data.brideTheme === theme.id}
                      onClick={() => handleThemeChange('bride', theme.id)}
                    />
                  ))}
                </div>
              </div>

              {/* 테마 선택 후 질문 표시 */}
              {brideThemeData && (
                <div className="space-y-4 pt-4 border-t border-pink-200">
                  <div className="space-y-2">
                    <FieldLabel required hint={brideThemeData.questions.q1.placeholder}>
                      {brideThemeData.questions.q1.label}
                    </FieldLabel>
                    <Textarea
                      placeholder={brideThemeData.questions.q1.placeholder}
                      value={data.brideAnswer1}
                      onChange={(e) => updateField('brideAnswer1', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <FieldLabel required hint={brideThemeData.questions.q2.placeholder}>
                      {brideThemeData.questions.q2.label}
                    </FieldLabel>
                    <Textarea
                      placeholder={brideThemeData.questions.q2.placeholder}
                      value={data.brideAnswer2}
                      onChange={(e) => updateField('brideAnswer2', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <FieldLabel required hint={brideThemeData.questions.q3.placeholder}>
                      {brideThemeData.questions.q3.label}
                    </FieldLabel>
                    <Textarea
                      placeholder={brideThemeData.questions.q3.placeholder}
                      value={data.brideAnswer3}
                      onChange={(e) => updateField('brideAnswer3', e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* 팁 */}
      <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
        <p className="text-sm text-amber-800">
          <span className="font-semibold">Tip</span><br />
          신랑과 신부가 서로 다른 테마를 선택해도 괜찮아요.<br />
          각자의 진심을 담아 작성해주세요.
        </p>
      </div>
    </div>
  )
}
