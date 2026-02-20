'use client'

import { ChevronUp, ChevronDown, Trash2, Plus } from 'lucide-react'
import { MultiImageUploader } from '@/components/editor/ImageUploader'
import type { ImageSettings } from '@/store/editorStore'
import type { FeedInvitationData } from '../../page'

interface StepProps {
  data: FeedInvitationData
  updateData: (updates: Partial<FeedInvitationData>) => void
  updateNestedData: (path: string, value: unknown) => void
  invitationId: string | null
}

export default function FeedStep3Rooms({
  data,
  updateData,
  invitationId,
}: StepProps) {
  const rooms = data.rooms

  const updateRoom = (index: number, field: 'title', value: string) => {
    const newRooms = [...rooms]
    newRooms[index] = { ...newRooms[index], [field]: value }
    updateData({ rooms: newRooms })
  }

  const updateRoomImages = (index: number, newImages: string[]) => {
    const newRooms = [...rooms]
    const existingSettings = newRooms[index].imageSettings || []
    newRooms[index] = {
      ...newRooms[index],
      images: newImages,
      imageSettings: newImages.map((_, i) =>
        existingSettings[i] || { scale: 1, positionX: 0, positionY: 0, cropX: 0, cropY: 0, cropWidth: 1, cropHeight: 1 } as ImageSettings
      ),
    }
    updateData({ rooms: newRooms })
  }

  const addRoom = () => {
    if (rooms.length >= 8) return
    updateData({
      rooms: [...rooms, { title: '', subtitle: '', images: [], imageSettings: [] as ImageSettings[] }],
    })
  }

  const deleteRoom = (index: number) => {
    if (rooms.length <= 1) return
    updateData({ rooms: rooms.filter((_, i) => i !== index) })
  }

  const moveRoom = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= rooms.length) return
    const newRooms = [...rooms]
    const temp = newRooms[index]
    newRooms[index] = newRooms[newIndex]
    newRooms[newIndex] = temp
    updateData({ rooms: newRooms })
  }

  return (
    <div className="pb-4">
      {/* Step header */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">포토룸</h2>
        <p className="text-xs text-gray-500 mt-1">
          컨셉별 사진 컬렉션을 룸으로 구성해요. 룸당 최대 30장까지 추가할 수 있어요.
        </p>
      </div>

      {/* Room list */}
      {rooms.map((room, index) => (
        <div key={index} className="px-6 py-5 border-b border-gray-100">
          {/* Room header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400">ROOM {index + 1}</span>
              <h3 className="text-sm font-semibold text-gray-900">
                {room.title || '새 룸'}
              </h3>
            </div>
            <div className="flex items-center gap-1">
              {/* Move up */}
              <button
                type="button"
                disabled={index === 0}
                onClick={() => moveRoom(index, -1)}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"
                aria-label="위로 이동"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              {/* Move down */}
              <button
                type="button"
                disabled={index === rooms.length - 1}
                onClick={() => moveRoom(index, 1)}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"
                aria-label="아래로 이동"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              {/* Delete */}
              <button
                type="button"
                disabled={rooms.length <= 1}
                onClick={() => deleteRoom(index)}
                className="p-1.5 rounded hover:bg-red-50 text-red-400 disabled:opacity-30"
                aria-label="룸 삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Room title input */}
          <input
            value={room.title}
            onChange={(e) => updateRoom(index, 'title', e.target.value)}
            placeholder="룸 제목 (예: Studio)"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-black"
          />

          <div className="mb-4" />

          {/* All 갤러리 미리보기 수 (per room) */}
          <div className="mb-4">
            <p className="text-[11px] font-medium text-gray-500 mb-1.5">All 갤러리 미리보기</p>
            <div className="flex gap-2">
              {([3, 6] as const).map((count) => (
                <button
                  key={count}
                  onClick={() => {
                    const newRooms = [...rooms]
                    newRooms[index] = { ...newRooms[index], galleryPreviewCount: count }
                    updateData({ rooms: newRooms })
                  }}
                  className={`flex-1 py-1.5 rounded-md border text-center transition-all text-[11px] font-medium ${
                    (room.galleryPreviewCount || 3) === count
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400'
                  }`}
                >
                  {count}장 ({count === 3 ? '1줄' : '2줄'})
                </button>
              ))}
            </div>
          </div>

          {/* Photo grid */}
          <MultiImageUploader
            images={room.images}
            onChange={(newImages) => updateRoomImages(index, newImages)}
            invitationId={invitationId || undefined}
            maxImages={30}
            placeholder="사진 추가"
            aspectRatio="aspect-[3/4]"
            sortable
          />
        </div>
      ))}

      {/* Add room button */}
      {rooms.length < 8 && (
        <div className="px-6 py-4">
          <button
            type="button"
            onClick={addRoom}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            새 포토룸 추가 ({rooms.length}/8)
          </button>
        </div>
      )}
    </div>
  )
}
