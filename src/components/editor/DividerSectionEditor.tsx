'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useEditorStore } from '@/store/editorStore'
import { uploadImage } from '@/lib/imageUpload'
import { useState } from 'react'

interface DividerSectionEditorProps {
  uploadingImages: Set<string>
  setUploadingImages: React.Dispatch<React.SetStateAction<Set<string>>>
  handleImageUpload: (
    file: File,
    uploadKey: string,
    onSuccess: (url: string) => void
  ) => Promise<void>
}

export default function DividerSectionEditor({
  uploadingImages,
  setUploadingImages,
  handleImageUpload,
}: DividerSectionEditorProps) {
  const { invitation, updateNestedField } = useEditorStore()

  if (!invitation) return null

  const fullHeightDividers = (invitation as any).fullHeightDividers

  return (
    <AccordionItem value="design-dividers">
      <AccordionTrigger className="text-base font-medium">🎬 섹션 디바이더</AccordionTrigger>
      <AccordionContent className="space-y-4 pb-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium">섹션 디바이더</p>
            <p className="text-xs text-gray-500">흑백 웨딩사진 배경으로 섹션을 구분해요</p>
          </div>
          <Switch
            checked={fullHeightDividers?.enabled || false}
            onCheckedChange={(checked) => updateNestedField('fullHeightDividers.enabled', checked)}
          />
        </div>

        {fullHeightDividers?.enabled && (
          <div className="space-y-6">
            {(fullHeightDividers?.items || []).map((item: any, index: number) => (
              <div key={item.id} className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl space-y-4">
                <p className="text-sm font-semibold text-gray-700">디바이더 {index + 1}</p>

                {/* 이미지 업로드 */}
                <div className="space-y-2">
                  <Label className="text-xs">배경 이미지</Label>
                  {item.image ? (
                    <div className="relative group">
                      <div
                        className="w-full aspect-[9/16] rounded-lg overflow-hidden border border-gray-200"
                        style={{
                          backgroundImage: `url(${item.image})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          filter: `grayscale(${item.imageSettings?.grayscale || 100}%)`,
                          opacity: (item.imageSettings?.opacity || 100) / 100,
                        }}
                      />
                      <button
                        onClick={() => updateNestedField(`fullHeightDividers.items.${index}.image`, '')}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <label className={`block w-full aspect-[9/16] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors bg-white ${uploadingImages.has(`divider-${index}`) ? 'opacity-50' : ''}`}>
                      {uploadingImages.has(`divider-${index}`) ? (
                        <>
                          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                          <span className="text-xs text-gray-400 mt-2">업로드중...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-xs text-gray-400 mt-2">이미지 추가</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={uploadingImages.has(`divider-${index}`)}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleImageUpload(file, `divider-${index}`, (url) => {
                              updateNestedField(`fullHeightDividers.items.${index}.image`, url)
                            })
                            e.target.value = ''
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* 이미지 설정 슬라이더 */}
                {item.image && (
                  <div className="space-y-3 p-3 bg-white rounded-lg">
                    <p className="text-[10px] font-medium text-gray-600">이미지 설정</p>

                    {/* 흑백 */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-gray-500">
                        <span>흑백</span>
                        <span>{item.imageSettings?.grayscale || 100}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={item.imageSettings?.grayscale || 100}
                        onChange={(e) => updateNestedField(`fullHeightDividers.items.${index}.imageSettings.grayscale`, parseInt(e.target.value))}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-600"
                      />
                    </div>

                    {/* 불투명도 */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-gray-500">
                        <span>밝기</span>
                        <span>{item.imageSettings?.opacity || 100}%</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        value={item.imageSettings?.opacity || 100}
                        onChange={(e) => updateNestedField(`fullHeightDividers.items.${index}.imageSettings.opacity`, parseInt(e.target.value))}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-600"
                      />
                    </div>

                  </div>
                )}

                {/* 텍스트 입력 */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">영문 타이틀</Label>
                    <Input
                      value={item.englishTitle}
                      onChange={(e) => updateNestedField(`fullHeightDividers.items.${index}.englishTitle`, e.target.value)}
                      placeholder="From Our Family to Yours"
                      className="text-sm italic"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">한글 텍스트</Label>
                    <Textarea
                      value={item.koreanText}
                      onChange={(e) => updateNestedField(`fullHeightDividers.items.${index}.koreanText`, e.target.value)}
                      placeholder="우리의 봄이, 누군가의 평생이 됩니다"
                      rows={2}
                      className="text-sm resize-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  )
}
