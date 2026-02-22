'use client'

import { useState, useCallback } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import InlineCropEditor from '@/components/editor/InlineCropEditor'
import { uploadImage } from '@/lib/imageUpload'
import { X, Plus } from 'lucide-react'
import ShareSettingsSection from '@/components/editor/ShareSettingsSection'

function generateKakaoDescription(date: string, time: string, venueName: string): string {
  if (!date) return ''
  const dateObj = new Date(date)
  const year = dateObj.getFullYear()
  const month = dateObj.getMonth() + 1
  const day = dateObj.getDate()
  const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][dateObj.getDay()]
  let timeStr = ''
  if (time) {
    const [hour, minute] = time.split(':').map(Number)
    const period = hour < 12 ? '오전' : '오후'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    timeStr = minute === 0 ? ` ${period} ${displayHour}시` : ` ${period} ${displayHour}시 ${minute}분`
  }
  const dateLine = `${year}년 ${month}월 ${day}일 ${dayOfWeek}요일${timeStr}`
  const venueLine = venueName || ''
  return venueLine ? `${dateLine}\n${venueLine}` : dateLine
}

interface Step2RecordProps {
  templateId?: string
  invitationId?: string | null
}

export default function Step2Record({ invitationId }: Step2RecordProps) {
  const { invitation, updateNestedField, setActiveSection, validationError } = useEditorStore()
  const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set())

  const updateKakaoDescriptionIfAuto = useCallback((newDate?: string, newTime?: string, newVenueName?: string) => {
    if (!invitation) return
    const date = newDate ?? invitation.wedding.date
    const time = newTime ?? invitation.wedding.time
    const venueName = newVenueName ?? invitation.wedding.venue.name
    const currentDesc = invitation.meta.description || ''
    const currentAutoDesc = generateKakaoDescription(invitation.wedding.date, invitation.wedding.time, invitation.wedding.venue.name)
    if (!currentDesc.trim() || currentDesc === currentAutoDesc) {
      const newDesc = generateKakaoDescription(date, time, venueName)
      updateNestedField('meta.description', newDesc)
    }
  }, [invitation, updateNestedField])

  const handleImageUpload = async (file: File, uploadKey: string, onSuccess: (url: string) => void) => {
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

  if (!invitation) return null

  return (
    <div className="p-6 space-y-8">
      {/* 안내 */}
      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <p className="text-base text-orange-800 font-medium mb-1">기본 정보</p>
        <p className="text-sm text-orange-700">
          앨범 커버와 신랑신부 정보, 결혼식 정보를 입력하세요.
        </p>
      </div>

      {/* 앨범 커버 이미지 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          앨범 커버 이미지
        </h3>
        <p className="text-sm text-blue-600">바이닐 레코드 커버에 사용될 정사각형 이미지를 업로드하세요.</p>

        {invitation.media.coverImage ? (
          <div className="space-y-3">
            <div className="relative w-48 h-48 mx-auto rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
              <img src={invitation.media.coverImage} alt="앨범 커버" className="w-full h-full object-cover" />
              <button
                onClick={() => {
                  updateNestedField('media.coverImage', '')
                  updateNestedField('media.coverImageSettings', undefined)
                }}
                className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg space-y-2">
              <p className="text-[10px] font-medium text-gray-600">이미지 크롭 조정</p>
              <InlineCropEditor
                imageUrl={invitation.media.coverImage}
                settings={invitation.media.coverImageSettings || { scale: 1.0, positionX: 0, positionY: 0 }}
                onUpdate={(s) => updateNestedField('media.coverImageSettings', { ...(invitation.media.coverImageSettings || {}), ...s })}
                aspectRatio={1}
                containerWidth={160}
              />
            </div>
          </div>
        ) : (
          <label className="block cursor-pointer">
            <div className="w-48 h-48 mx-auto border-2 border-dashed border-orange-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-orange-400 hover:bg-orange-50/50 transition-colors">
              {uploadingImages.has('cover') ? (
                <div className="animate-spin w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full" />
              ) : (
                <>
                  <Plus className="w-8 h-8 text-orange-400" />
                  <span className="text-xs text-orange-500">1:1 정사각형</span>
                </>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingImages.has('cover')}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  handleImageUpload(file, 'cover', (url) => {
                    updateNestedField('media.coverImage', url)
                  })
                  e.target.value = ''
                }
              }}
            />
          </label>
        )}
      </section>

      {/* 커버 타이틀 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg> 커버 타이틀
        </h3>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">인트로 텍스트</Label>
          <Input
            value={invitation.design?.coverTitle || ''}
            onChange={(e) => updateNestedField('design.coverTitle', e.target.value)}
            placeholder="WE ARE GETTING MARRIED"
          />
        </div>
      </section>

      {/* 신랑신부 이름 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          신랑신부 이름
        </h3>

        <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
          <p className="text-base font-semibold text-blue-800">신랑</p>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">이름 <span className="text-red-500">*</span></Label>
            <Input
              autoFocus
              value={invitation.groom.name}
              onChange={(e) => updateNestedField('groom.name', e.target.value)}
              placeholder="홍길동"
              className={validationError?.tab === 'names' && !invitation.groom.name?.trim() ? 'border-red-500 ring-2 ring-red-200' : ''}
            />
          </div>
        </div>

        <div className="space-y-3 p-4 bg-pink-50 rounded-lg">
          <p className="text-base font-semibold text-pink-800">신부</p>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">이름 <span className="text-red-500">*</span></Label>
            <Input
              value={invitation.bride.name}
              onChange={(e) => updateNestedField('bride.name', e.target.value)}
              placeholder="김민지"
              className={validationError?.tab === 'names' && !invitation.bride.name?.trim() ? 'border-red-500 ring-2 ring-red-200' : ''}
            />
          </div>
        </div>
      </section>

      {/* 결혼식 정보 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <path d="M9 22V12h6v10" />
            <path d="M8 6h.01" />
            <path d="M16 6h.01" />
            <path d="M12 6h.01" />
            <path d="M12 10h.01" />
            <path d="M8 10h.01" />
            <path d="M16 10h.01" />
          </svg>
          결혼식 정보
        </h3>

        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">날짜 <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                value={invitation.wedding.date}
                onChange={(e) => {
                  const newDate = e.target.value
                  updateNestedField('wedding.date', newDate)
                  updateKakaoDescriptionIfAuto(newDate, undefined, undefined)
                }}
                onFocus={() => setActiveSection('venue-info')}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">시간</Label>
              <Input
                type="time"
                value={invitation.wedding.time}
                onChange={(e) => {
                  const newTime = e.target.value
                  updateNestedField('wedding.time', newTime)
                  updateKakaoDescriptionIfAuto(undefined, newTime, undefined)
                }}
                onFocus={() => setActiveSection('venue-info')}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">예식장 이름 <span className="text-red-500">*</span></Label>
            <Input
              value={invitation.wedding.venue.name}
              onChange={(e) => {
                const newVenueName = e.target.value
                updateNestedField('wedding.venue.name', newVenueName)
                updateKakaoDescriptionIfAuto(undefined, undefined, newVenueName)
              }}
              onFocus={() => setActiveSection('venue-info')}
              placeholder="더그랜드홀"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">예식 홀</Label>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-gray-500">표시안함</span>
                <button
                  type="button"
                  onClick={() => updateNestedField('wedding.venue.hideHall', !invitation.wedding.venue.hideHall)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    invitation.wedding.venue.hideHall ? 'bg-gray-400' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    invitation.wedding.venue.hideHall ? 'translate-x-4' : 'translate-x-0.5'
                  }`} />
                </button>
              </label>
            </div>
            <Input
              value={invitation.wedding.venue.hall}
              onChange={(e) => updateNestedField('wedding.venue.hall', e.target.value)}
              onFocus={() => setActiveSection('venue-info')}
              placeholder="그랜드홀 2층"
              disabled={invitation.wedding.venue.hideHall}
              className={invitation.wedding.venue.hideHall ? 'bg-gray-100 text-gray-400' : ''}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">주소 <span className="text-red-500">*</span></Label>
            <Input
              value={invitation.wedding.venue.address}
              onChange={(e) => updateNestedField('wedding.venue.address', e.target.value)}
              onFocus={() => setActiveSection('venue-info')}
              placeholder="서울시 강남구 테헤란로 123"
            />
          </div>
        </div>
      </section>

      {/* 카카오톡 공유 설정 + OG 이미지 */}
      <ShareSettingsSection invitationId={invitationId} />
    </div>
  )
}
