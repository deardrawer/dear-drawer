'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2 } from 'lucide-react'
import { useThankYouEditorStore } from '@/store/thankYouEditorStore'

interface ThankYouStep3PhotosProps {
  invitationId: string | null
}

export default function ThankYouStep3Photos({ invitationId }: ThankYouStep3PhotosProps) {
  const { data, updateField, updatePolaroid } = useThankYouEditorStore()
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleImageUpload = async (file: File, index: number) => {
    // index: -1 = heroImage, 0/1/2 = polaroid
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
      const formData = new FormData()
      formData.append('file', file)
      if (invitationId) {
        formData.append('invitationId', invitationId)
      }
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const result = await res.json() as { url?: string; error?: string }

      if (result.url) {
        if (index === -1) {
          updateField('heroImage', result.url)
        } else {
          updatePolaroid(index, { image: result.url })
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
    } else {
      updatePolaroid(index, { image: '' })
    }
  }

  const PhotoUploader = ({
    imageUrl,
    index,
    label,
    description,
  }: {
    imageUrl: string
    index: number
    label: string
    description: string
  }) => (
    <div>
      <label className="block text-sm font-medium text-[#2C2824] mb-2">{label}</label>
      <p className="text-xs text-gray-400 mb-3">{description}</p>

      {imageUrl ? (
        <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border border-gray-200">
          <Image
            src={imageUrl}
            alt={label}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
          />
          <button
            onClick={() => handleRemoveImage(index)}
            className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full aspect-[3/4] border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 transition-colors bg-gray-50">
          {uploadingIndex === index ? (
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">사진 업로드</span>
              <span className="text-xs text-gray-400 mt-1">3:4 비율 권장</span>
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
      )}
    </div>
  )

  return (
    <div className="p-6 space-y-8">
      {/* 안내 */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-base text-green-800 font-medium mb-1">사진 설정</p>
        <p className="text-sm text-green-600">메인 사진 1장과 서브 사진 2장, 각 캡션을 설정해주세요.</p>
      </div>

      {/* 메인 사진 (히어로) */}
      <PhotoUploader
        imageUrl={data.heroImage}
        index={-1}
        label="메인 사진 (히어로)"
        description="인트로 배경으로 사용되는 대표 사진입니다. 스크롤 시 폴라로이드 카드 1로 변합니다."
      />

      {/* 폴라로이드 캡션 1 */}
      <div>
        <label className="block text-sm font-medium text-[#2C2824] mb-2">카드 1 캡션</label>
        <input
          type="text"
          value={data.polaroids[0]?.caption || ''}
          onChange={(e) => updatePolaroid(0, { caption: e.target.value })}
          placeholder="예: 우리의 시작"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#A37E69] focus:ring-1 focus:ring-[#A37E69]/20 transition-colors"
        />
        <p className="text-xs text-gray-400 mt-1">메인 사진이 폴라로이드로 변할 때 표시됩니다</p>
      </div>

      <div className="h-px bg-gray-100" />

      {/* 서브 사진 2 */}
      <PhotoUploader
        imageUrl={data.polaroids[1]?.image || ''}
        index={1}
        label="서브 사진 2"
        description="두 번째 폴라로이드 카드 사진입니다."
      />
      <div>
        <label className="block text-sm font-medium text-[#2C2824] mb-2">카드 2 캡션</label>
        <input
          type="text"
          value={data.polaroids[1]?.caption || ''}
          onChange={(e) => updatePolaroid(1, { caption: e.target.value })}
          placeholder="예: 함께한 날들"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#A37E69] focus:ring-1 focus:ring-[#A37E69]/20 transition-colors"
        />
      </div>

      <div className="h-px bg-gray-100" />

      {/* 서브 사진 3 */}
      <PhotoUploader
        imageUrl={data.polaroids[2]?.image || ''}
        index={2}
        label="서브 사진 3"
        description="세 번째 폴라로이드 카드 사진입니다."
      />
      <div>
        <label className="block text-sm font-medium text-[#2C2824] mb-2">카드 3 캡션</label>
        <input
          type="text"
          value={data.polaroids[2]?.caption || ''}
          onChange={(e) => updatePolaroid(2, { caption: e.target.value })}
          placeholder="예: 영원히 함께"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#A37E69] focus:ring-1 focus:ring-[#A37E69]/20 transition-colors"
        />
      </div>
    </div>
  )
}
