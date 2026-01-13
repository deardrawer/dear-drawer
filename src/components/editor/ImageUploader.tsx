'use client'

import { useState, useRef, useCallback } from 'react'
import { uploadImage, UploadResult, isBase64, isUrl } from '@/lib/imageUpload'
import { Button } from '@/components/ui/button'

interface ImageUploaderProps {
  value?: string  // 현재 이미지 URL 또는 base64
  onChange: (url: string) => void
  onDelete?: () => void
  invitationId?: string
  placeholder?: string
  className?: string
  aspectRatio?: string  // e.g., "aspect-[3/4]", "aspect-square"
  showPreview?: boolean
  disabled?: boolean
}

export default function ImageUploader({
  value,
  onChange,
  onDelete,
  invitationId,
  placeholder = '이미지 업로드',
  className = '',
  aspectRatio = 'aspect-[3/4]',
  showPreview = true,
  disabled = false,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // input 초기화 (같은 파일 재선택 가능하도록)
    if (inputRef.current) {
      inputRef.current.value = ''
    }

    setIsUploading(true)
    setProgress(0)
    setError(null)

    const result: UploadResult = await uploadImage(file, {
      invitationId,
      onProgress: setProgress,
    })

    setIsUploading(false)

    if (result.success && result.webUrl) {
      onChange(result.webUrl)
    } else {
      setError(result.error || '업로드 실패')
      // 3초 후 에러 메시지 숨김
      setTimeout(() => setError(null), 3000)
    }
  }, [invitationId, onChange])

  const handleClick = () => {
    if (!disabled && !isUploading) {
      inputRef.current?.click()
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete()
    } else {
      onChange('')
    }
  }

  const hasImage = value && (isUrl(value) || isBase64(value))

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      <div
        onClick={handleClick}
        className={`
          relative overflow-hidden rounded-lg border-2 border-dashed
          transition-all cursor-pointer
          ${hasImage ? 'border-transparent' : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${aspectRatio}
        `}
      >
        {/* 이미지 미리보기 */}
        {hasImage && showPreview ? (
          <div className="absolute inset-0">
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {/* 오버레이 */}
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleClick}
                disabled={isUploading}
              >
                변경
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={handleDelete}
              >
                삭제
              </Button>
            </div>
          </div>
        ) : (
          /* 업로드 플레이스홀더 */
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
            {isUploading ? (
              <>
                <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mb-2" />
                <span className="text-xs">{progress}%</span>
              </>
            ) : (
              <>
                <svg
                  className="w-8 h-8 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="text-xs text-center px-2">{placeholder}</span>
              </>
            )}
          </div>
        )}

        {/* 업로드 중 오버레이 */}
        {isUploading && hasImage && (
          <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mb-2" />
            <span className="text-xs text-gray-600">{progress}%</span>
          </div>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="absolute -bottom-6 left-0 right-0 text-center">
          <span className="text-xs text-red-500">{error}</span>
        </div>
      )}
    </div>
  )
}

/**
 * 다중 이미지 업로더
 */
interface MultiImageUploaderProps {
  images: string[]
  onChange: (images: string[]) => void
  invitationId?: string
  maxImages?: number
  placeholder?: string
  className?: string
  itemClassName?: string
  aspectRatio?: string
  disabled?: boolean
}

export function MultiImageUploader({
  images,
  onChange,
  invitationId,
  maxImages = 10,
  placeholder = '이미지 추가',
  className = '',
  itemClassName = '',
  aspectRatio = 'aspect-square',
  disabled = false,
}: MultiImageUploaderProps) {
  const handleAdd = (url: string) => {
    if (images.length < maxImages) {
      onChange([...images, url])
    }
  }

  const handleChange = (index: number, url: string) => {
    const newImages = [...images]
    newImages[index] = url
    onChange(newImages)
  }

  const handleDelete = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onChange(newImages)
  }

  const canAdd = images.length < maxImages

  return (
    <div className={`grid grid-cols-3 gap-2 ${className}`}>
      {images.map((img, index) => (
        <ImageUploader
          key={index}
          value={img}
          onChange={(url) => handleChange(index, url)}
          onDelete={() => handleDelete(index)}
          invitationId={invitationId}
          aspectRatio={aspectRatio}
          className={itemClassName}
          disabled={disabled}
        />
      ))}
      {canAdd && (
        <ImageUploader
          value=""
          onChange={handleAdd}
          invitationId={invitationId}
          placeholder={placeholder}
          aspectRatio={aspectRatio}
          className={itemClassName}
          disabled={disabled}
        />
      )}
    </div>
  )
}
