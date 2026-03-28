'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2 } from 'lucide-react'
import { useThankYouEditorStore } from '@/store/thankYouEditorStore'
import InlineCropEditor from '@/components/editor/InlineCropEditor'
import { uploadImage } from '@/lib/imageUpload'
import type { ImageSettings } from '@/store/editorStore'
import type { CropData } from '@/components/thank-you/types'

interface ThankYouStep3PhotosProps {
  invitationId: string | null
}

/** ImageSettings ↔ CropData 변환 */
function cropToSettings(crop?: CropData): Partial<ImageSettings> {
  return {
    scale: 1,
    positionX: 0,
    positionY: 0,
    cropX: crop?.cropX,
    cropY: crop?.cropY,
    cropWidth: crop?.cropWidth,
    cropHeight: crop?.cropHeight,
  }
}
function settingsToCrop(s: Partial<ImageSettings>): CropData {
  return { cropX: s.cropX, cropY: s.cropY, cropWidth: s.cropWidth, cropHeight: s.cropHeight }
}

export default function ThankYouStep3Photos({ invitationId }: ThankYouStep3PhotosProps) {
  const { data, updateField, updatePolaroid } = useThankYouEditorStore()
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleImageUpload = async (file: File, index: number) => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다.')
      return
    }

    setUploadingIndex(index)
    try {
      const result = await uploadImage(file, { invitationId: invitationId || undefined })

      if (result.success && result.webUrl) {
        if (index === -1) {
          updateField('heroImage', result.webUrl)
          updateField('heroCrop', undefined as unknown as CropData)
        } else {
          updatePolaroid(index, { image: result.webUrl, crop: undefined })
        }
      } else {
        alert(result.error || '업로드에 실패했습니다.')
      }
    } catch {
      alert('업로드 중 오류가 발생했습니다.')
    } finally {
      setUploadingIndex(null)
    }
  }

  const handleRemoveImage = (index: number) => {
    if (index === -1) {
      updateField('heroImage', '')
      updateField('heroCrop', undefined as unknown as CropData)
    } else {
      updatePolaroid(index, { image: '', crop: undefined })
    }
  }

  const PhotoSection = ({
    imageUrl,
    index,
    label,
    description,
    crop,
    onCropUpdate,
  }: {
    imageUrl: string
    index: number
    label: string
    description: string
    crop?: CropData
    onCropUpdate: (crop: CropData) => void
  }) => (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-[#2C2824]">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>

      {imageUrl ? (
        <div className="space-y-2">
          {/* 크롭 에디터 */}
          <div className="flex justify-center">
            <div className="relative">
              <InlineCropEditor
                imageUrl={imageUrl}
                settings={cropToSettings(crop)}
                onUpdate={(s) => onCropUpdate(settingsToCrop(s))}
                aspectRatio={3 / 4}
                containerWidth={220}
                colorClass="amber"
              />
              <button
                onClick={() => handleRemoveImage(index)}
                className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <label className="flex flex-col items-center justify-center w-[220px] aspect-[3/4] border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#A37E69] hover:bg-[#A37E69]/5 transition-colors bg-gray-50">
            {uploadingIndex === index ? (
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                  <Upload className="w-5 h-5 text-gray-500" />
                </div>
                <span className="text-sm text-gray-500">사진 추가</span>
                <span className="text-xs text-gray-400 mt-0.5">3:4 비율 권장</span>
              </>
            )}
            <input
              ref={(el) => { fileInputRefs.current[index + 1] = el }}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleImageUpload(file, index)
                e.target.value = ''
              }}
            />
          </label>
        </div>
      )}
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      {/* 안내 */}
      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-800 font-medium">사진 3장과 캡션을 설정해주세요</p>
        <p className="text-xs text-green-600 mt-0.5">사진 업로드 후 크롭 영역을 드래그하여 조정할 수 있습니다.</p>
      </div>

      {/* 메인 사진 (히어로 = 카드 1) */}
      <PhotoSection
        imageUrl={data.heroImage}
        index={-1}
        label="메인 사진 (카드 1)"
        description="인트로 배경 + 첫 번째 폴라로이드 카드"
        crop={data.heroCrop}
        onCropUpdate={(crop) => updateField('heroCrop', crop)}
      />
      <input
        type="text"
        value={data.polaroids[0]?.caption || ''}
        onChange={(e) => updatePolaroid(0, { caption: e.target.value })}
        placeholder="카드 1 캡션 (예: 소중한 분들과)"
        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#A37E69] focus:ring-1 focus:ring-[#A37E69]/20 transition-colors"
      />

      <div className="h-px bg-gray-100" />

      {/* 카드 2 */}
      <PhotoSection
        imageUrl={data.polaroids[1]?.image || ''}
        index={1}
        label="카드 2"
        description="두 번째 폴라로이드 카드"
        crop={data.polaroids[1]?.crop}
        onCropUpdate={(crop) => updatePolaroid(1, { crop })}
      />
      <input
        type="text"
        value={data.polaroids[1]?.caption || ''}
        onChange={(e) => updatePolaroid(1, { caption: e.target.value })}
        placeholder="카드 2 캡션 (예: 함께한 이 순간)"
        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#A37E69] focus:ring-1 focus:ring-[#A37E69]/20 transition-colors"
      />

      <div className="h-px bg-gray-100" />

      {/* 카드 3 */}
      <PhotoSection
        imageUrl={data.polaroids[2]?.image || ''}
        index={2}
        label="카드 3"
        description="세 번째 폴라로이드 카드"
        crop={data.polaroids[2]?.crop}
        onCropUpdate={(crop) => updatePolaroid(2, { crop })}
      />
      <input
        type="text"
        value={data.polaroids[2]?.caption || ''}
        onChange={(e) => updatePolaroid(2, { caption: e.target.value })}
        placeholder="카드 3 캡션 (예: 오래 간직하겠습니다.)"
        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#A37E69] focus:ring-1 focus:ring-[#A37E69]/20 transition-colors"
      />
    </div>
  )
}
