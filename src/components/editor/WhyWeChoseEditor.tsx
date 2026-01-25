'use client'

import { useEditorStore } from '@/store/editorStore'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

export default function WhyWeChoseEditor() {
  const { invitation, updateNestedField } = useEditorStore()

  if (!invitation) return null

  const whyWeChose = invitation.whyWeChose || {
    enabled: true,
    title: '우리가 서로를 선택한 이유',
    subtitle: '오래 보아도 좋은 사람, 서로 그렇게 되기까지',
    groom: { enabled: true, description: '', quote: '서로 아끼며 행복하게 살겠습니다.' },
    bride: { enabled: true, description: '', quote: '늘 처음처럼 행복하게 살겠습니다.' },
  }

  const renderSideEditor = (side: 'groom' | 'bride', label: string) => {
    const data = whyWeChose[side]
    const fieldPrefix = `whyWeChose.${side}`

    return (
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">{label}</h4>
          <div className="flex items-center gap-2">
            <Label htmlFor={`${side}-whychose-enabled`} className="text-xs text-gray-500">표시</Label>
            <Switch
              id={`${side}-whychose-enabled`}
              checked={data.enabled}
              onCheckedChange={(checked) => updateNestedField(`${fieldPrefix}.enabled`, checked)}
            />
          </div>
        </div>

        {data.enabled && (
          <>
            {/* 사진 안내 */}
            <p className="text-[11px] text-gray-500 bg-gray-100 p-2 rounded">
              💡 사진은 커플 소개에서 등록한 {side === 'groom' ? '신랑' : '신부'} 프로필 이미지가 자동으로 사용됩니다.
            </p>

            {/* 본문 */}
            <div className="space-y-2">
              <Label className="text-xs">본문</Label>
              <Textarea
                value={data.description}
                onChange={(e) => updateNestedField(`${fieldPrefix}.description`, e.target.value)}
                placeholder="상대방을 선택한 이유를 작성해주세요...&#10;&#10;강조하고 싶은 부분은 **텍스트** 로 감싸주세요."
                className="text-sm min-h-[200px] leading-relaxed"
              />
              <p className="text-[10px] text-gray-400">**강조텍스트** 형식으로 강조할 수 있습니다</p>
            </div>

            {/* 인용문 */}
            <div className="space-y-2">
              <Label className="text-xs">약속의 말</Label>
              <Input
                value={data.quote}
                onChange={(e) => updateNestedField(`${fieldPrefix}.quote`, e.target.value)}
                placeholder="예: 서로 아끼며 행복하게 살겠습니다."
                className="text-sm"
              />
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <AccordionItem value="why-we-chose">
      <AccordionTrigger className="text-base font-medium">
        <div className="flex items-center justify-between w-full mr-2">
          <span>💕 서로를 선택한 이유</span>
          <Switch
            checked={whyWeChose.enabled}
            onCheckedChange={(checked) => updateNestedField('whyWeChose.enabled', checked)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pb-4">
        {whyWeChose.enabled && (
          <>
            {/* 섹션 제목 설정 */}
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm">섹션 제목</h4>
              <div className="space-y-2">
                <Label className="text-xs">제목</Label>
                <Input
                  value={whyWeChose.title}
                  onChange={(e) => updateNestedField('whyWeChose.title', e.target.value)}
                  placeholder="우리가 서로를 선택한 이유"
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">부제목</Label>
                <Input
                  value={whyWeChose.subtitle}
                  onChange={(e) => updateNestedField('whyWeChose.subtitle', e.target.value)}
                  placeholder="오래 보아도 좋은 사람, 서로 그렇게 되기까지"
                  className="text-sm"
                />
              </div>
            </div>

            {renderSideEditor('groom', '신랑이 신부를 선택한 이유')}
            {renderSideEditor('bride', '신부가 신랑을 선택한 이유')}
          </>
        )}
      </AccordionContent>
    </AccordionItem>
  )
}
