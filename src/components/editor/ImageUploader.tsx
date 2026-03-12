'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import { uploadImage, uploadImages, UploadResult, isBase64, isUrl } from '@/lib/imageUpload'
import { Button } from '@/components/ui/button'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

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
 * 드래그 가능한 이미지 아이템
 */
function SortableImageItem({
  id,
  img,
  index,
  onChangeImage,
  onDeleteImage,
  invitationId,
  aspectRatio,
  itemClassName,
  disabled,
}: {
  id: string
  img: string
  index: number
  onChangeImage: (index: number, url: string) => void
  onDeleteImage: (index: number) => void
  invitationId?: string
  aspectRatio: string
  itemClassName: string
  disabled: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="relative">
      {/* 드래그 핸들 */}
      <div
        {...listeners}
        className="absolute top-1 left-1 z-10 p-1 rounded bg-black/40 cursor-grab active:cursor-grabbing touch-manipulation"
      >
        <GripVertical className="w-3.5 h-3.5 text-white" />
      </div>
      <ImageUploader
        value={img}
        onChange={(url) => onChangeImage(index, url)}
        onDelete={() => onDeleteImage(index)}
        invitationId={invitationId}
        aspectRatio={aspectRatio}
        className={itemClassName}
        disabled={disabled}
      />
    </div>
  )
}

/**
 * 업로드 큐 아이템
 */
interface UploadQueueItem {
  localPreviewUrl: string
  status: 'uploading' | 'complete' | 'error'
  progress: number
  resultUrl?: string
  error?: string
  file: File
}

/**
 * 업로드 중인 이미지의 프리뷰 + 진행률 오버레이
 */
function UploadingImageItem({
  item,
  aspectRatio,
  itemClassName,
  onRetry,
}: {
  item: UploadQueueItem
  aspectRatio: string
  itemClassName: string
  onRetry: () => void
}) {
  return (
    <div className={`relative ${itemClassName}`}>
      <div className={`relative overflow-hidden rounded-lg border-2 border-dashed border-gray-200 ${aspectRatio}`}>
        <img
          src={item.localPreviewUrl}
          alt="Uploading"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* 업로드 중 오버레이 */}
        {item.status === 'uploading' && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
            <div className="relative w-10 h-10">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15" fill="none" stroke="white" strokeWidth="3"
                  strokeDasharray={`${item.progress * 0.94} 100`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                {item.progress}%
              </span>
            </div>
          </div>
        )}
        {/* 완료 오버레이 */}
        {item.status === 'complete' && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}
        {/* 에러 오버레이 */}
        {item.status === 'error' && (
          <div
            className="absolute inset-0 bg-red-500/60 flex flex-col items-center justify-center cursor-pointer"
            onClick={onRetry}
          >
            <svg className="w-6 h-6 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-[10px] text-white font-medium">재시도</span>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * 다중 이미지 업로더 (배치 업로드 지원)
 */
interface MultiImageUploaderProps {
  images: string[]
  onChange: (images: string[]) => void
  onReorder?: (newImages: string[]) => void
  invitationId?: string
  maxImages?: number
  placeholder?: string
  className?: string
  itemClassName?: string
  aspectRatio?: string
  disabled?: boolean
  sortable?: boolean
}

export function MultiImageUploader({
  images,
  onChange,
  onReorder,
  invitationId,
  maxImages = 10,
  placeholder = '이미지 추가',
  className = '',
  itemClassName = '',
  aspectRatio = 'aspect-square',
  disabled = false,
  sortable = false,
}: MultiImageUploaderProps) {
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([])
  const [overLimitMsg, setOverLimitMsg] = useState<string | null>(null)
  const batchInputRef = useRef<HTMLInputElement>(null)
  // 최신 images를 콜백에서 참조하기 위한 ref
  const imagesRef = useRef(images)
  imagesRef.current = images
  // 완료된 URL을 누적하기 위한 ref
  const completedUrlsRef = useRef<string[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const isUploading = uploadQueue.some(item => item.status === 'uploading')

  const handleChange = (index: number, url: string) => {
    const newImages = [...images]
    newImages[index] = url
    onChange(newImages)
  }

  const handleDelete = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onChange(newImages)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const sortableIds = images.map((img, i) => `${img}-${i}`)
    const oldIndex = sortableIds.indexOf(active.id as string)
    const newIndex = sortableIds.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return

    const newImages = arrayMove(images, oldIndex, newIndex)
    if (onReorder) {
      onReorder(newImages)
    } else {
      onChange(newImages)
    }
  }

  // 배치 파일 선택 핸들러
  const handleBatchSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return

    // FileList는 live DOM 객체이므로 input 초기화 전에 Array로 변환해야 함
    let files = Array.from(fileList)

    // input 초기화 (같은 파일 재선택 가능하도록)
    if (batchInputRef.current) {
      batchInputRef.current.value = ''
    }

    const available = maxImages - imagesRef.current.length
    if (available <= 0) return

    // maxImages 초과 시 잘라냄
    if (files.length > available) {
      setOverLimitMsg(`최대 ${maxImages}장까지 가능합니다. ${files.length}장 중 ${available}장만 업로드합니다.`)
      setTimeout(() => setOverLimitMsg(null), 4000)
      files = files.slice(0, available)
    }

    // 완료된 URL 초기화
    completedUrlsRef.current = []

    // 큐 아이템 초기화
    const queueItems: UploadQueueItem[] = files.map(file => ({
      localPreviewUrl: '',
      status: 'uploading' as const,
      progress: 0,
      file,
    }))
    setUploadQueue(queueItems)

    await uploadImages(files, {
      invitationId,
      maxConcurrent: 3,
      onFileStart: (index, previewUrl) => {
        setUploadQueue(prev => {
          const next = [...prev]
          if (next[index]) {
            next[index] = { ...next[index], localPreviewUrl: previewUrl }
          }
          return next
        })
      },
      onFileProgress: (index, progress) => {
        setUploadQueue(prev => {
          const next = [...prev]
          if (next[index]) {
            next[index] = { ...next[index], progress }
          }
          return next
        })
      },
      onFileComplete: (index, result) => {
        setUploadQueue(prev => {
          const next = [...prev]
          if (next[index]) {
            next[index] = { ...next[index], status: 'complete', progress: 100, resultUrl: result.webUrl }
          }
          return next
        })
        // 완료된 URL 누적
        if (result.webUrl) {
          completedUrlsRef.current.push(result.webUrl)
        }
      },
      onFileError: (index, error) => {
        setUploadQueue(prev => {
          const next = [...prev]
          if (next[index]) {
            next[index] = { ...next[index], status: 'error', error }
          }
          return next
        })
      },
    })

    // 모든 업로드 완료 → images에 반영
    const successUrls = completedUrlsRef.current
    if (successUrls.length > 0) {
      onChange([...imagesRef.current, ...successUrls])
    }

    // 에러가 있는 아이템만 남기고 큐 정리
    setUploadQueue(prev => prev.filter(item => item.status === 'error'))
  }, [invitationId, maxImages, onChange])

  // 실패한 아이템 재시도
  const handleRetry = useCallback(async (queueIndex: number) => {
    const item = uploadQueue[queueIndex]
    if (!item || item.status !== 'error') return

    setUploadQueue(prev => {
      const next = [...prev]
      next[queueIndex] = { ...next[queueIndex], status: 'uploading', progress: 0, error: undefined }
      return next
    })

    const result = await uploadImage(item.file, {
      invitationId,
      onProgress: (progress) => {
        setUploadQueue(prev => {
          const next = [...prev]
          if (next[queueIndex]) {
            next[queueIndex] = { ...next[queueIndex], progress }
          }
          return next
        })
      },
    })

    if (result.success && result.webUrl) {
      setUploadQueue(prev => prev.filter((_, i) => i !== queueIndex))
      onChange([...imagesRef.current, result.webUrl])
    } else {
      setUploadQueue(prev => {
        const next = [...prev]
        if (next[queueIndex]) {
          next[queueIndex] = { ...next[queueIndex], status: 'error', error: result.error || '업로드 실패' }
        }
        return next
      })
    }
  }, [uploadQueue, invitationId, onChange])

  const canAdd = images.length < maxImages && !isUploading
  const sortableIds = useMemo(() => images.map((img, i) => `${img}-${i}`), [images])

  // 배치 추가 버튼
  const addButton = canAdd ? (
    <div className={`relative ${itemClassName}`}>
      <input
        ref={batchInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleBatchSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />
      <div
        onClick={() => !disabled && !isUploading && batchInputRef.current?.click()}
        className={`
          relative overflow-hidden rounded-lg border-2 border-dashed
          transition-all cursor-pointer border-gray-300 hover:border-gray-400
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${aspectRatio}
        `}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
          <svg className="w-7 h-7 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-[11px] text-center px-1 font-medium">{placeholder}</span>
          <span className="text-[9px] text-gray-300 mt-0.5">여러 장 선택 가능</span>
        </div>
      </div>
    </div>
  ) : null

  // 업로드 중인 아이템 렌더링
  const uploadingItems = uploadQueue.map((item, idx) => (
    <UploadingImageItem
      key={`uploading-${idx}`}
      item={item}
      aspectRatio={aspectRatio}
      itemClassName={itemClassName}
      onRetry={() => handleRetry(idx)}
    />
  ))

  // 초과 알림
  const limitNotice = overLimitMsg ? (
    <div className="col-span-3 text-center py-1.5 px-2 bg-amber-50 border border-amber-200 rounded-md">
      <span className="text-[11px] text-amber-700">{overLimitMsg}</span>
    </div>
  ) : null

  if (sortable && images.length > 1) {
    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
          <div className={`grid grid-cols-3 gap-2 ${className}`}>
            {images.map((img, index) => (
              <SortableImageItem
                key={sortableIds[index]}
                id={sortableIds[index]}
                img={img}
                index={index}
                onChangeImage={handleChange}
                onDeleteImage={handleDelete}
                invitationId={invitationId}
                aspectRatio={aspectRatio}
                itemClassName={itemClassName}
                disabled={disabled}
              />
            ))}
            {uploadingItems}
            {addButton}
            {limitNotice}
          </div>
        </SortableContext>
      </DndContext>
    )
  }

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
      {uploadingItems}
      {addButton}
      {limitNotice}
    </div>
  )
}
