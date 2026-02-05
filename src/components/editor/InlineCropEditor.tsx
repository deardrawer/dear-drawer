'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { RotateCcw, Move } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImageSettings } from '@/store/editorStore'

interface InlineCropEditorProps {
  imageUrl: string
  settings: Partial<ImageSettings>
  onUpdate: (settings: Partial<ImageSettings>) => void
  aspectRatio?: number // 고정 비율 (1 = 정사각형, 3/4 = 세로형)
  containerWidth?: number
  colorClass?: string
}

export default function InlineCropEditor({
  imageUrl,
  settings,
  onUpdate,
  aspectRatio = 1,
  containerWidth = 200,
  colorClass = 'rose',
}: InlineCropEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [containerSize, setContainerSize] = useState({ width: containerWidth, height: containerWidth })

  // 드래그 상태
  const [dragType, setDragType] = useState<'move' | 'nw' | 'ne' | 'sw' | 'se' | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, cropX: 0, cropY: 0, cropW: 0, cropH: 0 })

  // 드래그 중 로컬 크롭 값 (깜빡임 방지)
  const [localCrop, setLocalCrop] = useState<{ cropX: number; cropY: number; cropWidth: number; cropHeight: number } | null>(null)

  // 현재 크롭 값 (드래그 중에는 로컬 값 사용, 아니면 props에서)
  const cropX = localCrop?.cropX ?? settings.cropX ?? 0
  const cropY = localCrop?.cropY ?? settings.cropY ?? 0
  const cropWidth = localCrop?.cropWidth ?? settings.cropWidth ?? 1
  const cropHeight = localCrop?.cropHeight ?? settings.cropHeight ?? 1

  // 이미지 로드 시 크기 계산 및 초기 크롭 영역 설정
  useEffect(() => {
    if (imageUrl) {
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

        // 처음 크롭 데이터가 없으면 초기화
        if (settings.cropWidth === undefined || settings.cropHeight === undefined) {
          const imgAspect = img.naturalWidth / img.naturalHeight
          const maxInitSize = 0.98 // 최대 크기 제한 (항상 이동 여유 확보)
          let cW, cH, cX, cY

          if (imgAspect > aspectRatio) {
            cH = maxInitSize
            cW = Math.min(maxInitSize, (aspectRatio * img.naturalHeight) / img.naturalWidth)
            cX = (1 - cW) / 2
            cY = (1 - cH) / 2
          } else {
            cW = maxInitSize
            cH = Math.min(maxInitSize, img.naturalWidth / (aspectRatio * img.naturalHeight))
            cX = (1 - cW) / 2
            cY = (1 - cH) / 2
          }

          onUpdate({
            cropX: cX,
            cropY: cY,
            cropWidth: cW,
            cropHeight: cH,
          })
        }
      }
      img.src = imageUrl
    }
  }, [imageUrl])

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
      cropX,
      cropY,
      cropW: cropWidth,
      cropH: cropHeight,
    })
  }

  // 드래그 이동
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
    const maxSize = 0.98 // 최대 크기 제한 (항상 2%의 이동 여유 확보)
    const imgAspect = imageSize.width / imageSize.height
    const targetAspect = aspectRatio / imgAspect

    if (dragType === 'move') {
      newCropX = Math.max(0, Math.min(1 - newCropW, dragStart.cropX + dx))
      newCropY = Math.max(0, Math.min(1 - newCropH, dragStart.cropY + dy))
    } else {
      const diagonal = (dx + dy) / 2

      if (dragType === 'se') {
        newCropW = Math.max(minSize, Math.min(Math.min(maxSize, 1 - dragStart.cropX), dragStart.cropW + diagonal))
        newCropH = newCropW / targetAspect
        if (newCropH > maxSize) {
          newCropH = maxSize
          newCropW = newCropH * targetAspect
        }
        if (dragStart.cropY + newCropH > 1) {
          newCropH = Math.min(maxSize, 1 - dragStart.cropY)
          newCropW = newCropH * targetAspect
        }
      } else if (dragType === 'sw') {
        const delta = (-dx + dy) / 2
        newCropW = Math.max(minSize, Math.min(maxSize, dragStart.cropW + delta))
        newCropH = newCropW / targetAspect
        if (newCropH > maxSize) {
          newCropH = maxSize
          newCropW = newCropH * targetAspect
        }
        const oldRight = dragStart.cropX + dragStart.cropW
        newCropX = oldRight - newCropW
        if (newCropX < 0) {
          newCropX = 0
          newCropW = Math.min(maxSize, oldRight)
          newCropH = newCropW / targetAspect
        }
        if (dragStart.cropY + newCropH > 1) {
          newCropH = Math.min(maxSize, 1 - dragStart.cropY)
          newCropW = newCropH * targetAspect
          newCropX = oldRight - newCropW
        }
      } else if (dragType === 'ne') {
        const delta = (dx - dy) / 2
        newCropW = Math.max(minSize, Math.min(Math.min(maxSize, 1 - dragStart.cropX), dragStart.cropW + delta))
        newCropH = newCropW / targetAspect
        if (newCropH > maxSize) {
          newCropH = maxSize
          newCropW = newCropH * targetAspect
        }
        const oldBottom = dragStart.cropY + dragStart.cropH
        newCropY = oldBottom - newCropH
        if (newCropY < 0) {
          newCropY = 0
          newCropH = Math.min(maxSize, oldBottom)
          newCropW = newCropH * targetAspect
        }
      } else if (dragType === 'nw') {
        newCropW = Math.max(minSize, Math.min(maxSize, dragStart.cropW - diagonal))
        newCropH = newCropW / targetAspect
        if (newCropH > maxSize) {
          newCropH = maxSize
          newCropW = newCropH * targetAspect
        }
        const oldRight = dragStart.cropX + dragStart.cropW
        const oldBottom = dragStart.cropY + dragStart.cropH
        newCropX = oldRight - newCropW
        newCropY = oldBottom - newCropH
        if (newCropX < 0) {
          newCropX = 0
          newCropW = Math.min(maxSize, oldRight)
          newCropH = newCropW / targetAspect
          newCropY = oldBottom - newCropH
        }
        if (newCropY < 0) {
          newCropY = 0
          newCropH = Math.min(maxSize, oldBottom)
          newCropW = newCropH * targetAspect
          newCropX = oldRight - newCropW
        }
      }
    }

    // 드래그 중에는 로컬 상태만 업데이트 (깜빡임 방지)
    setLocalCrop({
      cropX: newCropX,
      cropY: newCropY,
      cropWidth: newCropW,
      cropHeight: newCropH,
    })
  }, [dragType, dragStart, containerSize, aspectRatio, imageSize])

  // 드래그 종료 - 최종 값을 부모에게 전달
  const handleDragEnd = useCallback(() => {
    if (localCrop) {
      onUpdate(localCrop)
      setLocalCrop(null)
    }
    setDragType(null)
  }, [localCrop, onUpdate])

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

  // 리셋
  const handleReset = () => {
    if (!imageSize.width || !imageSize.height) return

    const imgAspect = imageSize.width / imageSize.height
    const maxResetSize = 0.98 // 최대 크기 제한 (항상 이동 여유 확보)
    let cW, cH, cX, cY

    if (imgAspect > aspectRatio) {
      cH = maxResetSize
      cW = Math.min(maxResetSize, (aspectRatio * imageSize.height) / imageSize.width)
      cX = (1 - cW) / 2
      cY = (1 - cH) / 2
    } else {
      cW = maxResetSize
      cH = Math.min(maxResetSize, imageSize.width / (aspectRatio * imageSize.height))
      cX = (1 - cW) / 2
      cY = (1 - cH) / 2
    }

    onUpdate({
      cropX: cX,
      cropY: cY,
      cropWidth: cW,
      cropHeight: cH,
    })
  }

  // 크롭 영역 스타일
  const cropStyle = {
    left: `${cropX * 100}%`,
    top: `${cropY * 100}%`,
    width: `${cropWidth * 100}%`,
    height: `${cropHeight * 100}%`,
  }

  const borderColorClass = {
    rose: 'border-rose-400',
    purple: 'border-purple-400',
    blue: 'border-blue-400',
    pink: 'border-pink-400',
    amber: 'border-amber-400',
  }[colorClass] || 'border-rose-400'

  return (
    <div className="space-y-2">
      {/* 에디터 영역 */}
      <div
        ref={containerRef}
        className="relative mx-auto overflow-hidden rounded-lg"
        style={{
          width: containerSize.width,
          height: containerSize.height,
          backgroundColor: '#1a1a1a',
        }}
      >
        <img
          src={imageUrl}
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
                rgba(0,0,0,0.6) ${cropX * 100}%,
                transparent ${cropX * 100}%,
                transparent ${(cropX + cropWidth) * 100}%,
                rgba(0,0,0,0.6) ${(cropX + cropWidth) * 100}%
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
            top: `${(cropY + cropHeight) * 100}%`,
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
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/50 -translate-x-px" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/50 -translate-y-px" />
          </div>

          {/* 코너 핸들 */}
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
      </div>

      {/* 리셋 버튼 */}
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className={`text-[10px] h-6 px-2 ${colorClass === 'gray' ? 'text-white hover:text-white hover:bg-white/20' : ''}`}
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          리셋
        </Button>
      </div>
    </div>
  )
}
