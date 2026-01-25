'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Upload, RotateCcw, X, Move } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { uploadImage } from '@/lib/imageUpload'

export interface CropData {
  url: string
  // 크롭 영역 (이미지 기준 비율 0~1)
  cropX: number
  cropY: number
  cropWidth: number
  cropHeight: number
}

interface ImageCropEditorProps {
  value?: CropData
  onChange: (data: CropData) => void
  aspectRatio?: number // 고정 비율 (3/4 = 세로형, 1 = 정사각형)
  containerWidth?: number
  invitationId?: string
  label?: string
}

const DEFAULT_CROP: CropData = {
  url: '',
  cropX: 0,
  cropY: 0,
  cropWidth: 1,
  cropHeight: 1,
}

export default function ImageCropEditor({
  value = DEFAULT_CROP,
  onChange,
  aspectRatio = 1,
  containerWidth = 280,
  invitationId,
  label = '이미지',
}: ImageCropEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [containerSize, setContainerSize] = useState({ width: containerWidth, height: containerWidth })

  // 드래그 상태 (이동 또는 코너 확장만 가능)
  const [dragType, setDragType] = useState<'move' | 'nw' | 'ne' | 'sw' | 'se' | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, cropX: 0, cropY: 0, cropW: 0, cropH: 0 })

  // 이미지 로드 시 크기 계산 및 초기 크롭 영역 설정
  useEffect(() => {
    if (value.url && imageRef.current) {
      const img = new Image()
      img.onload = () => {
        const imgRatio = img.naturalWidth / img.naturalHeight
        let displayWidth = containerWidth
        let displayHeight = containerWidth / imgRatio

        if (displayHeight > containerWidth * 1.5) {
          displayHeight = containerWidth * 1.5
          displayWidth = displayHeight * imgRatio
        }

        setImageSize({ width: img.naturalWidth, height: img.naturalHeight })
        setContainerSize({ width: displayWidth, height: displayHeight })

        // 처음 이미지 로드 시 or 기본값일 때 크롭 영역 설정 (가운데 정렬, 비율 고정)
        if (value.cropWidth === 1 && value.cropHeight === 1) {
          const imgAspect = img.naturalWidth / img.naturalHeight
          let cropW, cropH, cropX, cropY

          if (imgAspect > aspectRatio) {
            // 이미지가 더 넓음 → 높이 기준으로 최대 크기
            cropH = 1
            cropW = (aspectRatio * img.naturalHeight) / img.naturalWidth
            cropX = (1 - cropW) / 2
            cropY = 0
          } else {
            // 이미지가 더 좁음 → 너비 기준으로 최대 크기
            cropW = 1
            cropH = img.naturalWidth / (aspectRatio * img.naturalHeight)
            cropX = 0
            cropY = (1 - cropH) / 2
          }

          onChange({
            ...value,
            cropX,
            cropY,
            cropWidth: cropW,
            cropHeight: cropH,
          })
        }
      }
      img.src = value.url
    }
  }, [value.url])

  // 파일 선택 처리
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)

    const result = await uploadImage(file, {
      invitationId: invitationId || 'temp',
      onProgress: setUploadProgress,
    })

    if (result.success && result.webUrl) {
      onChange({
        url: result.webUrl,
        cropX: 0,
        cropY: 0,
        cropWidth: 1,
        cropHeight: 1,
      })
    } else {
      alert(result.error || '업로드에 실패했습니다.')
    }

    setIsUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 드래그 시작
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, type: typeof dragType) => {
    e.preventDefault()
    e.stopPropagation()

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    setDragType(type)
    setDragStart({
      x: clientX,
      y: clientY,
      cropX: value.cropX,
      cropY: value.cropY,
      cropW: value.cropWidth,
      cropH: value.cropHeight,
    })
  }

  // 드래그 이동 (비율 고정)
  const handleDrag = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragType || !containerRef.current || !imageSize.width) return

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    const dx = (clientX - dragStart.x) / containerSize.width
    const dy = (clientY - dragStart.y) / containerSize.height

    let newCropX = dragStart.cropX
    let newCropY = dragStart.cropY
    let newCropW = dragStart.cropW
    let newCropH = dragStart.cropH

    const minSize = 0.2
    // 이미지 비율 대비 목표 비율 계산
    const imgAspect = imageSize.width / imageSize.height
    const targetAspect = aspectRatio / imgAspect

    if (dragType === 'move') {
      // 이동만 (비율 유지)
      newCropX = Math.max(0, Math.min(1 - newCropW, dragStart.cropX + dx))
      newCropY = Math.max(0, Math.min(1 - newCropH, dragStart.cropY + dy))
    } else {
      // 코너 핸들로 크기 조정 (비율 고정)
      // 대각선 방향으로 확대/축소
      const diagonal = (dx + dy) / 2

      if (dragType === 'se') {
        // 오른쪽 아래로 확장
        newCropW = Math.max(minSize, Math.min(1 - dragStart.cropX, dragStart.cropW + diagonal))
        newCropH = newCropW / targetAspect
        if (dragStart.cropY + newCropH > 1) {
          newCropH = 1 - dragStart.cropY
          newCropW = newCropH * targetAspect
        }
      } else if (dragType === 'sw') {
        // 왼쪽 아래로 확장
        const delta = (-dx + dy) / 2
        newCropW = Math.max(minSize, dragStart.cropW + delta)
        newCropH = newCropW / targetAspect
        const oldRight = dragStart.cropX + dragStart.cropW
        newCropX = oldRight - newCropW
        if (newCropX < 0) {
          newCropX = 0
          newCropW = oldRight
          newCropH = newCropW / targetAspect
        }
        if (dragStart.cropY + newCropH > 1) {
          newCropH = 1 - dragStart.cropY
          newCropW = newCropH * targetAspect
          newCropX = oldRight - newCropW
        }
      } else if (dragType === 'ne') {
        // 오른쪽 위로 확장
        const delta = (dx - dy) / 2
        newCropW = Math.max(minSize, Math.min(1 - dragStart.cropX, dragStart.cropW + delta))
        newCropH = newCropW / targetAspect
        const oldBottom = dragStart.cropY + dragStart.cropH
        newCropY = oldBottom - newCropH
        if (newCropY < 0) {
          newCropY = 0
          newCropH = oldBottom
          newCropW = newCropH * targetAspect
        }
      } else if (dragType === 'nw') {
        // 왼쪽 위로 확장
        newCropW = Math.max(minSize, dragStart.cropW - diagonal)
        newCropH = newCropW / targetAspect
        const oldRight = dragStart.cropX + dragStart.cropW
        const oldBottom = dragStart.cropY + dragStart.cropH
        newCropX = oldRight - newCropW
        newCropY = oldBottom - newCropH
        if (newCropX < 0) {
          newCropX = 0
          newCropW = oldRight
          newCropH = newCropW / targetAspect
          newCropY = oldBottom - newCropH
        }
        if (newCropY < 0) {
          newCropY = 0
          newCropH = oldBottom
          newCropW = newCropH * targetAspect
          newCropX = oldRight - newCropW
        }
      }
    }

    onChange({
      ...value,
      cropX: newCropX,
      cropY: newCropY,
      cropWidth: newCropW,
      cropHeight: newCropH,
    })
  }, [dragType, dragStart, containerSize, value, onChange, aspectRatio, imageSize])

  // 드래그 종료
  const handleDragEnd = useCallback(() => {
    setDragType(null)
  }, [])

  // 이벤트 리스너
  useEffect(() => {
    if (dragType) {
      window.addEventListener('mousemove', handleDrag)
      window.addEventListener('mouseup', handleDragEnd)
      window.addEventListener('touchmove', handleDrag)
      window.addEventListener('touchend', handleDragEnd)
    }

    return () => {
      window.removeEventListener('mousemove', handleDrag)
      window.removeEventListener('mouseup', handleDragEnd)
      window.removeEventListener('touchmove', handleDrag)
      window.removeEventListener('touchend', handleDragEnd)
    }
  }, [dragType, handleDrag, handleDragEnd])

  // 리셋 (최대 크기로)
  const handleReset = () => {
    if (!imageSize.width || !imageSize.height) return

    const imgAspect = imageSize.width / imageSize.height
    let cropW, cropH, cropX, cropY

    if (imgAspect > aspectRatio) {
      // 이미지가 더 넓음 → 높이 기준으로 최대
      cropH = 1
      cropW = (aspectRatio * imageSize.height) / imageSize.width
      cropX = (1 - cropW) / 2
      cropY = 0
    } else {
      // 이미지가 더 좁음 → 너비 기준으로 최대
      cropW = 1
      cropH = imageSize.width / (aspectRatio * imageSize.height)
      cropX = 0
      cropY = (1 - cropH) / 2
    }

    onChange({
      ...value,
      cropX,
      cropY,
      cropWidth: cropW,
      cropHeight: cropH,
    })
  }

  // 이미지 삭제
  const handleRemove = () => {
    onChange(DEFAULT_CROP)
  }

  // 크롭 영역 픽셀 계산
  const cropStyle = {
    left: `${value.cropX * 100}%`,
    top: `${value.cropY * 100}%`,
    width: `${value.cropWidth * 100}%`,
    height: `${value.cropHeight * 100}%`,
  }

  return (
    <div className="space-y-3">
      {label && (
        <div className="text-xs font-medium text-gray-600">{label}</div>
      )}

      {/* 에디터 영역 */}
      <div
        ref={containerRef}
        className="relative mx-auto overflow-hidden rounded-lg"
        style={{
          width: containerSize.width,
          height: value.url ? containerSize.height : containerWidth,
          backgroundColor: '#1a1a1a',
        }}
      >
        {/* 이미지 */}
        {value.url ? (
          <>
            <img
              ref={imageRef}
              src={value.url}
              alt="편집 중"
              className="w-full h-full object-contain select-none"
              draggable={false}
            />

            {/* 어두운 오버레이 (크롭 영역 외부) */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `
                  linear-gradient(to right,
                    rgba(0,0,0,0.6) ${value.cropX * 100}%,
                    transparent ${value.cropX * 100}%,
                    transparent ${(value.cropX + value.cropWidth) * 100}%,
                    rgba(0,0,0,0.6) ${(value.cropX + value.cropWidth) * 100}%
                  )
                `,
              }}
            />
            <div
              className="absolute pointer-events-none"
              style={{
                left: cropStyle.left,
                width: cropStyle.width,
                top: 0,
                height: cropStyle.top,
                backgroundColor: 'rgba(0,0,0,0.6)',
              }}
            />
            <div
              className="absolute pointer-events-none"
              style={{
                left: cropStyle.left,
                width: cropStyle.width,
                top: `${(value.cropY + value.cropHeight) * 100}%`,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.6)',
              }}
            />

            {/* 크롭 프레임 */}
            <div
              className="absolute border-2 border-white cursor-move"
              style={cropStyle}
              onMouseDown={(e) => handleDragStart(e, 'move')}
              onTouchStart={(e) => handleDragStart(e, 'move')}
            >
              {/* 가로/세로 중앙 가이드 라인 */}
              <div className="absolute inset-0 pointer-events-none">
                {/* 세로 중앙선 */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/50 -translate-x-px" />
                {/* 가로 중앙선 */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-white/50 -translate-y-px" />
              </div>

              {/* 코너 핸들 (정확히 모서리 중앙에 위치) */}
              <div
                className="absolute w-3 h-3 bg-white rounded-full shadow-md cursor-nwse-resize z-10 border border-gray-300"
                style={{ top: '-6px', left: '-6px' }}
                onMouseDown={(e) => handleDragStart(e, 'nw')}
                onTouchStart={(e) => handleDragStart(e, 'nw')}
              />
              <div
                className="absolute w-3 h-3 bg-white rounded-full shadow-md cursor-nesw-resize z-10 border border-gray-300"
                style={{ top: '-6px', right: '-6px' }}
                onMouseDown={(e) => handleDragStart(e, 'ne')}
                onTouchStart={(e) => handleDragStart(e, 'ne')}
              />
              <div
                className="absolute w-3 h-3 bg-white rounded-full shadow-md cursor-nesw-resize z-10 border border-gray-300"
                style={{ bottom: '-6px', left: '-6px' }}
                onMouseDown={(e) => handleDragStart(e, 'sw')}
                onTouchStart={(e) => handleDragStart(e, 'sw')}
              />
              <div
                className="absolute w-3 h-3 bg-white rounded-full shadow-md cursor-nwse-resize z-10 border border-gray-300"
                style={{ bottom: '-6px', right: '-6px' }}
                onMouseDown={(e) => handleDragStart(e, 'se')}
                onTouchStart={(e) => handleDragStart(e, 'se')}
              />
            </div>

            {/* 드래그 힌트 */}
            {dragType && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/60 rounded text-[10px] text-white flex items-center gap-1 z-20">
                <Move className="w-3 h-3" />
                {dragType === 'move' ? '드래그로 위치 조정' : '크기 조정 중'}
              </div>
            )}
          </>
        ) : (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-8 h-8 text-gray-500 mb-2" />
            <span className="text-xs text-gray-500">클릭하여 업로드</span>
          </div>
        )}

        {/* 업로드 진행 중 */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-30">
            <div className="w-24 h-1 bg-gray-700 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-white transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="text-xs text-white">{uploadProgress}%</span>
          </div>
        )}
      </div>

      {/* 컨트롤 */}
      {value.url && (
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs flex-1"
          >
            <Upload className="w-3 h-3 mr-1" />
            교체
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-xs"
            title="리셋"
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemove}
            className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
            title="삭제"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* 파일 input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
