'use client'

import { useCallback, useState, useRef } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ChevronDown } from 'lucide-react'
import { uploadImage } from '@/lib/imageUpload'
import InlineCropEditor from '@/components/editor/InlineCropEditor'
import ShareSettingsSection from '@/components/editor/ShareSettingsSection'

// 카카오 설명 자동 생성
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

interface Step3MagazineProps {
  templateId?: string
  invitationId?: string | null
}

export default function Step3Magazine({ templateId, invitationId }: Step3MagazineProps) {
  const { invitation, updateField, updateNestedField, setActiveSection, validationError } = useEditorStore()
  // showParents state removed - moved to Step4Magazine
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const handleCoverUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (coverInputRef.current) coverInputRef.current.value = ''
    setIsUploadingCover(true)
    setUploadProgress(0)
    const result = await uploadImage(file, { invitationId: invitationId || undefined, onProgress: setUploadProgress })
    setIsUploadingCover(false)
    if (result.success && result.webUrl) {
      updateNestedField('media.coverImage', result.webUrl)
    }
  }, [invitationId, updateNestedField])

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

  if (!invitation) return null

  const { media } = invitation

  const introStyle = invitation.magazineIntroStyle || 'cover'
  const needsCoverImage = introStyle === 'cover' || introStyle === 'editorial'

  return (
    <div className="p-6 space-y-8">
      {/* 안내 */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-base text-purple-800 font-medium mb-1">매거진 인트로를 꾸며보세요</p>
        <p className="text-sm text-purple-700">
          인트로 스타일을 선택하고 기본 정보를 입력하면 매거진 첫 페이지가 완성됩니다.
        </p>
      </div>

      {/* 0. 인트로 스타일 선택 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 10h20" /><path d="M6 4l3 6" /><path d="M12 4l3 6" /></svg>
          인트로 스타일
        </h3>
        <p className="text-sm text-blue-600"><svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>매거진 첫 페이지의 스타일을 선택하세요</p>

        <div className="grid grid-cols-3 gap-3">
          {/* Cover 스타일 */}
          <button
            onClick={() => updateField('magazineIntroStyle', 'cover')}
            className={`relative rounded-xl border-2 overflow-hidden transition-all ${
              introStyle === 'cover' ? 'border-gray-900 ring-2 ring-gray-900/20' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {introStyle === 'cover' && (
              <div className="absolute top-1.5 right-1.5 z-10 w-4 h-4 bg-black rounded-full flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            <div className="aspect-[3/4] bg-gradient-to-b from-gray-100 to-gray-50 flex flex-col items-center justify-center p-2">
              <div className="w-full h-[60%] bg-gray-300 rounded mb-1" />
              <div className="w-8 h-0.5 bg-gray-400 mt-1" />
              <div className="w-6 h-0.5 bg-gray-300 mt-0.5" />
            </div>
            <p className="text-[11px] text-gray-700 font-medium py-2 text-center">커버</p>
          </button>

          {/* Clean 스타일 */}
          <button
            onClick={() => updateField('magazineIntroStyle', 'clean')}
            className={`relative rounded-xl border-2 overflow-hidden transition-all ${
              introStyle === 'clean' ? 'border-gray-900 ring-2 ring-gray-900/20' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {introStyle === 'clean' && (
              <div className="absolute top-1.5 right-1.5 z-10 w-4 h-4 bg-black rounded-full flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            <div className="aspect-[3/4] bg-white flex flex-col items-center justify-center p-2">
              <div className="w-10 h-0.5 bg-gray-200 mb-2" />
              <div className="w-6 h-1 bg-gray-800 rounded-sm mb-0.5" />
              <div className="w-2 h-0.5 bg-gray-300 mb-0.5" />
              <div className="w-6 h-1 bg-gray-800 rounded-sm" />
              <div className="w-10 h-0.5 bg-gray-200 mt-2" />
              <div className="w-4 h-0.5 bg-gray-300 mt-1" />
            </div>
            <p className="text-[11px] text-gray-700 font-medium py-2 text-center">미니멀</p>
          </button>

          {/* Editorial 스타일 */}
          <button
            onClick={() => updateField('magazineIntroStyle', 'editorial')}
            className={`relative rounded-xl border-2 overflow-hidden transition-all ${
              introStyle === 'editorial' ? 'border-gray-900 ring-2 ring-gray-900/20' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {introStyle === 'editorial' && (
              <div className="absolute top-1.5 right-1.5 z-10 w-4 h-4 bg-black rounded-full flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            <div className="aspect-[3/4] bg-gradient-to-b from-gray-700 to-gray-900 relative flex flex-col justify-end p-2">
              <div className="w-8 h-1 bg-white/80 rounded-sm mb-0.5" />
              <div className="w-3 h-0.5 bg-white/50 mb-0.5" />
              <div className="w-8 h-1 bg-white/80 rounded-sm" />
            </div>
            <p className="text-[11px] text-gray-700 font-medium py-2 text-center">에디토리얼</p>
          </button>
        </div>
      </section>

      {/* 1. 커버 이미지 (cover, editorial 스타일에서만 표시) */}
      {needsCoverImage && (
        <section className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
            커버 이미지
          </h3>
          <p className="text-sm text-blue-600"><svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>매거진 표지에 사용할 사진을 선택하세요</p>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleCoverUpload}
            className="hidden"
          />
          {media.coverImage ? (
            <div className="space-y-3">
              <div className="relative w-full max-w-[200px] aspect-[3/4] mx-auto rounded-lg overflow-hidden shadow-md">
                <img src={media.coverImage} alt="커버" className="w-full h-full object-cover" />
                {isUploadingCover && (
                  <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mb-2" />
                    <span className="text-xs text-gray-600">{uploadProgress}%</span>
                  </div>
                )}
              </div>
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={isUploadingCover}
                  className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  사진 변경
                </button>
                <button
                  type="button"
                  onClick={() => updateNestedField('media.coverImage', '')}
                  className="px-4 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                >
                  삭제
                </button>
              </div>
              {/* 커버 이미지 크롭 조정 */}
              <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                <p className="text-[10px] font-medium text-gray-600">이미지 크롭 조정</p>
                <InlineCropEditor
                  imageUrl={media.coverImage}
                  settings={media.coverImageSettings || { scale: 1.0, positionX: 0, positionY: 0 }}
                  onUpdate={(s) => updateNestedField('media.coverImageSettings', { ...(media.coverImageSettings || {}), ...s })}
                  aspectRatio={3/4}
                  containerWidth={160}
                />
              </div>
            </div>
          ) : (
            <div
              onClick={() => !isUploadingCover && coverInputRef.current?.click()}
              className="w-full max-w-[200px] mx-auto aspect-[3/4] rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 cursor-pointer flex flex-col items-center justify-center text-gray-400 transition-colors"
            >
              {isUploadingCover ? (
                <>
                  <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mb-2" />
                  <span className="text-xs">{uploadProgress}%</span>
                </>
              ) : (
                <>
                  <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs">커버 사진 추가</span>
                </>
              )}
            </div>
          )}
        </section>
      )}

      {/* 2. 신랑신부 이름 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          신랑신부 이름
        </h3>

        <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
          <p className="text-base font-semibold text-blue-800">신랑</p>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">이름 <span className="text-red-500">*</span></Label>
            <Input
              value={invitation.groom.name}
              onChange={(e) => updateNestedField('groom.name', e.target.value)}
              placeholder="김민준"
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
              placeholder="이서연"
              className={validationError?.tab === 'names' && !invitation.bride.name?.trim() ? 'border-red-500 ring-2 ring-red-200' : ''}
            />
          </div>
        </div>
      </section>

      {/* 3. 결혼식 정보 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22V12h6v10" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M8 10h.01" /><path d="M16 10h.01" /></svg>
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
              placeholder="더채플앳청담"
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
              placeholder="그랜드볼룸 3층"
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
              placeholder="서울특별시 강남구 삼성로 614"
            />
          </div>
        </div>
      </section>

      {/* 카카오톡 공유 설정 + OG 이미지 */}
      <ShareSettingsSection invitationId={invitationId} />
    </div>
  )
}
