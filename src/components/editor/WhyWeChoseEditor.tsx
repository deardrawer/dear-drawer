'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useEditorStore, ImageSettings } from '@/store/editorStore'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { uploadImage } from '@/lib/imageUpload'
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import InlineCropEditor from './InlineCropEditor'
import HighlightTextarea from './HighlightTextarea'

// 초안 작성 가능 표시
function AiIndicator() {
  return (
    <span className="ml-2 text-[10px] text-pink-500 font-medium">
      ✦ 초안 작성 가능
    </span>
  )
}

export default function WhyWeChoseEditor() {
  const { invitation, updateNestedField } = useEditorStore()
  const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set())

  if (!invitation) return null

  const whyWeChose = invitation.whyWeChose || {
    enabled: true,
    title: '우리가 서로를 선택한 이유',
    subtitle: '오래 보아도 좋은 사람, 서로 그렇게 되기까지',
    groom: { enabled: true, images: [], imageSettings: [], description: '', quote: '서로 아끼며 행복하게 살겠습니다.' },
    bride: { enabled: true, images: [], imageSettings: [], description: '', quote: '늘 처음처럼 행복하게 살겠습니다.' },
  }

  // 이미지 업로드 핸들러
  const handleImageUpload = async (
    file: File,
    uploadKey: string,
    onSuccess: (url: string) => void
  ) => {
    setUploadingImages(prev => new Set(prev).add(uploadKey))

    try {
      const result = await uploadImage(file)
      if (result.success && result.webUrl) {
        onSuccess(result.webUrl)
      } else {
        alert(result.error || '이미지 업로드에 실패했습니다.')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('이미지 업로드 중 오류가 발생했습니다.')
    } finally {
      setUploadingImages(prev => {
        const next = new Set(prev)
        next.delete(uploadKey)
        return next
      })
    }
  }

  // 이미지 추가
  const addImage = (side: 'groom' | 'bride', imageUrl: string) => {
    const currentImages = whyWeChose[side].images || []
    const currentSettings = whyWeChose[side].imageSettings || []
    if (currentImages.length < 2) {
      updateNestedField(`whyWeChose.${side}.images`, [...currentImages, imageUrl])
      updateNestedField(`whyWeChose.${side}.imageSettings`, [...currentSettings, { scale: 1.0, positionX: 0, positionY: 0 }])
    }
  }

  // 이미지 삭제
  const removeImage = (side: 'groom' | 'bride', imageIndex: number) => {
    const currentImages = [...(whyWeChose[side].images || [])]
    const currentSettings = [...(whyWeChose[side].imageSettings || [])]
    currentImages.splice(imageIndex, 1)
    currentSettings.splice(imageIndex, 1)
    updateNestedField(`whyWeChose.${side}.images`, currentImages)
    updateNestedField(`whyWeChose.${side}.imageSettings`, currentSettings)
  }

  // 이미지 설정 업데이트
  const updateImageSettings = (side: 'groom' | 'bride', imageIndex: number, settings: Partial<ImageSettings>) => {
    const currentSettings = [...(whyWeChose[side].imageSettings || [])]
    while (currentSettings.length <= imageIndex) {
      currentSettings.push({ scale: 1.0, positionX: 0, positionY: 0 })
    }
    currentSettings[imageIndex] = { ...currentSettings[imageIndex], ...settings }
    updateNestedField(`whyWeChose.${side}.imageSettings`, currentSettings)
  }

  const renderSideEditor = (side: 'groom' | 'bride', label: string) => {
    const data = whyWeChose[side]
    const fieldPrefix = `whyWeChose.${side}`
    const images = data.images || []
    const imageSettings = data.imageSettings || []

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
            {/* 사진 업로드 (인터뷰 방식) */}
            <div className="space-y-2">
              <Label className="text-xs">사진 (1~2장)</Label>
              <div className="grid grid-cols-2 gap-2">
                {[0, 1].map((imgIndex) => {
                  const imageUrl = images[imgIndex]
                  const imgSettings = imageSettings[imgIndex] || { scale: 1.0, positionX: 0, positionY: 0 }
                  const uploadKey = `whychose-${side}-${imgIndex}`

                  return (
                    <div key={imgIndex} className="relative">
                      {imageUrl ? (
                        <div className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden border border-pink-200">
                            <Image
                              src={imageUrl}
                              alt={`${label} ${imgIndex + 1}`}
                              fill
                              className="object-cover"
                              style={{
                                objectPosition: `${50 + (imgSettings.positionX || 0)}% ${50 + (imgSettings.positionY || 0)}%`,
                                transform: `scale(${imgSettings.scale || 1})`
                              }}
                            />
                          </div>
                          <button
                            onClick={() => removeImage(side, imgIndex)}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <label className={`aspect-square border-2 border-dashed border-pink-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-pink-400 transition-colors bg-white/50 ${uploadingImages.has(uploadKey) ? 'opacity-50' : ''}`}>
                          {uploadingImages.has(uploadKey) ? (
                            <>
                              <div className="w-5 h-5 border-2 border-pink-300 border-t-pink-600 rounded-full animate-spin" />
                              <span className="text-[10px] text-pink-400 mt-1">업로드중...</span>
                            </>
                          ) : (
                            <>
                              <span className="text-2xl text-pink-300">+</span>
                              <span className="text-[10px] text-pink-400">사진 추가</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            disabled={uploadingImages.has(uploadKey)}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleImageUpload(file, uploadKey, (url) => addImage(side, url))
                                e.target.value = ''
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* 이미지 크롭 조정 */}
              {images.length > 0 && (
                <div className="mt-3 p-3 bg-white/70 rounded-lg space-y-4">
                  <p className="text-[10px] font-medium text-pink-700">이미지 크롭 조정</p>
                  {images.map((imageUrl, imgIndex) => {
                    const settings = imageSettings[imgIndex] || { scale: 1.0, positionX: 0, positionY: 0 }
                    return (
                      <div key={imgIndex} className="space-y-2 pb-3 border-b border-pink-100 last:border-0 last:pb-0">
                        <p className="text-[9px] text-pink-600">사진 {imgIndex + 1}</p>
                        <InlineCropEditor
                          imageUrl={imageUrl}
                          settings={settings}
                          onUpdate={(newSettings) => updateImageSettings(side, imgIndex, newSettings)}
                          aspectRatio={1}
                          containerWidth={140}
                          colorClass="pink"
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 본문 */}
            <div className="space-y-2">
              <div className="flex items-center">
                <Label className="text-xs">본문</Label>
                <AiIndicator />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-gray-500">행간</span>
                  {[1.4, 1.6, 1.8, 2.0, 2.2].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => updateNestedField('whyWeChoseTextStyle', { ...invitation.whyWeChoseTextStyle, lineHeight: v })}
                      className={`px-1.5 py-0.5 text-[10px] rounded border ${(invitation.whyWeChoseTextStyle?.lineHeight ?? 2.0) === v ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
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
                      onClick={() => updateNestedField('whyWeChoseTextStyle', { ...invitation.whyWeChoseTextStyle, textAlign: align })}
                      className={`p-1 rounded border ${(invitation.whyWeChoseTextStyle?.textAlign ?? 'left') === align ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'}`}
                    >
                      <Icon className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              </div>
              <HighlightTextarea
                value={data.description}
                onChange={(value) => updateNestedField(`${fieldPrefix}.description`, value)}
                placeholder="상대방을 선택한 이유를 작성해주세요..."
                rows={8}
                className="text-sm min-h-[200px] leading-relaxed"
              />
            </div>

            {/* 인용문 */}
            <div className="space-y-2">
              <div className="flex items-center">
                <Label className="text-xs">약속의 말</Label>
                <AiIndicator />
              </div>
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
      <div className="flex items-center justify-between">
        <AccordionTrigger className="text-base font-medium flex-1">
          <span><svg className="w-4 h-4 text-gray-900 flex-shrink-0 inline -mt-0.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z" /></svg>서로를 선택한 이유</span>
        </AccordionTrigger>
        <Switch
          checked={whyWeChose.enabled}
          onCheckedChange={(checked) => updateNestedField('whyWeChose.enabled', checked)}
          className="mr-2"
        />
      </div>
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
