'use client'

import { useEditorStore } from '@/store/editorStore'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { X, Upload, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import Image from 'next/image'
import HighlightTextarea from './HighlightTextarea'
import InlineCropEditor from './InlineCropEditor'

interface ParentIntroEditorProps {
  uploadingImages: Set<string>
  handleImageUpload: (file: File, uploadKey: string, onSuccess: (url: string) => void) => void
}

export default function ParentIntroEditor({
  uploadingImages,
  handleImageUpload,
}: ParentIntroEditorProps) {
  const { invitation, updateNestedField } = useEditorStore()

  if (!invitation) return null

  const parentIntro = invitation.parentIntro || {
    groom: { enabled: true, parentNames: '', childOrder: '첫째', images: [], message: '' },
    bride: { enabled: true, parentNames: '', childOrder: '첫째', images: [], message: '' },
  }

  const childOrderOptions = ['첫째', '둘째', '셋째', '넷째', '막내', '외동']

  const addImage = (side: 'groom' | 'bride', url: string) => {
    const currentImages = [...(parentIntro[side].images || [])]
    currentImages.push(url)
    updateNestedField(`parentIntro.${side}.images`, currentImages)
  }

  const removeImage = (side: 'groom' | 'bride', index: number) => {
    const currentImages = [...(parentIntro[side].images || [])]
    currentImages.splice(index, 1)
    updateNestedField(`parentIntro.${side}.images`, currentImages)
  }

  const renderSideEditor = (side: 'groom' | 'bride', label: string) => {
    const data = parentIntro[side]
    const fieldPrefix = `parentIntro.${side}`

    return (
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">{label} 부모님 소개</h4>
          <div className="flex items-center gap-2">
            <Label htmlFor={`${side}-enabled`} className="text-xs text-gray-500">표시</Label>
            <Switch
              id={`${side}-enabled`}
              checked={data.enabled}
              onCheckedChange={(checked) => updateNestedField(`${fieldPrefix}.enabled`, checked)}
            />
          </div>
        </div>

        {data.enabled && (
          <>
            {/* 부모님 이름 */}
            <div className="space-y-2">
              <Label className="text-xs">부모님 표기</Label>
              <Input
                value={data.parentNames}
                onChange={(e) => updateNestedField(`${fieldPrefix}.parentNames`, e.target.value)}
                placeholder="예: 홍길동, 김영희의"
                className="text-sm"
              />
              <p className="text-[10px] text-gray-400">아버지, 어머니 이름 뒤에 &apos;의&apos;를 붙여주세요</p>
            </div>

            {/* 자녀 순서 */}
            <div className="space-y-2">
              <Label className="text-xs">자녀 순서</Label>
              <select
                value={data.childOrder}
                onChange={(e) => updateNestedField(`${fieldPrefix}.childOrder`, e.target.value)}
                className="w-full h-9 px-3 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                {childOrderOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {/* 가족 사진 */}
            <div className="space-y-2">
              <Label className="text-xs">가족 사진 (최대 2장, 4:3 비율 권장)</Label>
              <div className="grid grid-cols-2 gap-2">
                {[0, 1].map((imgIndex) => {
                  const imageUrl = (data.images || [])[imgIndex]
                  const uploadKey = `parentIntro-${side}-${imgIndex}`

                  return (
                    <div key={imgIndex} className="relative aspect-[4/3] bg-gray-100 rounded overflow-hidden group">
                      {imageUrl ? (
                        <>
                          <Image
                            src={imageUrl}
                            alt={`가족사진 ${imgIndex + 1}`}
                            fill
                            className="object-cover"
                          />
                          <button
                            onClick={() => removeImage(side, imgIndex)}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </>
                      ) : (
                        <label className="absolute inset-0 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleImageUpload(file, uploadKey, (url) => addImage(side, url))
                                e.target.value = ''
                              }
                            }}
                            disabled={uploadingImages.has(uploadKey)}
                          />
                          {uploadingImages.has(uploadKey) ? (
                            <span className="text-xs text-gray-400">업로드중...</span>
                          ) : (
                            <>
                              <Upload className="w-5 h-5 text-gray-400 mb-1" />
                              <span className="text-xs text-gray-400">사진 {imgIndex + 1}</span>
                            </>
                          )}
                        </label>
                      )}
                    </div>
                  )
                })}
              </div>
              <p className="text-[10px] text-gray-400">2장 등록 시 자동 슬라이드됩니다</p>

              {/* 이미지 크롭 조정 */}
              {(data.images || []).length > 0 && (
                <div className="mt-3 p-3 bg-white rounded-lg space-y-4">
                  <p className="text-[10px] font-medium text-gray-600">이미지 크롭 조정</p>
                  {(data.images || []).map((imageUrl, imgIndex) => {
                    const settings = data.imageSettings?.[imgIndex] || { scale: 1.0, positionX: 0, positionY: 0 }
                    return (
                      <div key={imgIndex} className="space-y-2 pb-3 border-b border-gray-200 last:border-0 last:pb-0">
                        <p className="text-[9px] text-gray-500">사진 {imgIndex + 1}</p>
                        <InlineCropEditor
                          imageUrl={imageUrl}
                          settings={settings}
                          onUpdate={(newSettings) => {
                            const currentSettings = [...(data.imageSettings || [])]
                            while (currentSettings.length <= imgIndex) {
                              currentSettings.push({ scale: 1.0, positionX: 0, positionY: 0 })
                            }
                            currentSettings[imgIndex] = { ...currentSettings[imgIndex], ...newSettings }
                            updateNestedField(`${fieldPrefix}.imageSettings`, currentSettings)
                          }}
                          aspectRatio={4/3}
                          containerWidth={140}
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 부모님 메시지 */}
            <div className="space-y-2">
              <Label className="text-xs">부모님 메시지</Label>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-gray-500">행간</span>
                  {[1.4, 1.6, 1.8, 2.0, 2.2].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => updateNestedField(`${fieldPrefix}.lineHeight`, v)}
                      className={`px-1.5 py-0.5 text-[10px] rounded border ${(data.lineHeight ?? invitation.parentIntroTextStyle?.lineHeight ?? 2.0) === v ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-gray-500">정렬</span>
                  {([['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight]] as const).map(([align, Icon]) => (
                    <button
                      key={align}
                      type="button"
                      onClick={() => updateNestedField(`${fieldPrefix}.textAlign`, align)}
                      className={`p-1 rounded border ${(data.textAlign ?? invitation.parentIntroTextStyle?.textAlign ?? 'left') === align ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'}`}
                    >
                      <Icon className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              </div>
              <HighlightTextarea
                value={data.message}
                onChange={(value) => updateNestedField(`${fieldPrefix}.message`, value)}
                placeholder="자녀를 소개하는 부모님의 진심어린 메시지를 작성해주세요..."
                rows={8}
                className="text-sm min-h-[200px] leading-relaxed"
              />
              <p className="text-[10px] text-gray-400">줄바꿈을 사용하여 문단을 나눌 수 있습니다</p>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <AccordionItem value="parent-intro">
      <AccordionTrigger className="text-base font-medium">
        <div className="flex items-center justify-between w-full mr-2">
          <span><svg className="w-4 h-4 text-gray-900 flex-shrink-0 inline -mt-0.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>부모님 소개</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pb-4">
        {renderSideEditor('groom', '신랑측')}
        {renderSideEditor('bride', '신부측')}
      </AccordionContent>
    </AccordionItem>
  )
}
