'use client'

import { useCallback } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import ImageUploader from '@/components/editor/ImageUploader'

// 공유 설명 자동 생성 헬퍼 함수
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

interface Step2BasicInfoProps {
  templateId?: string
}

export default function Step2BasicInfo({ templateId }: Step2BasicInfoProps) {
  const { invitation, updateField, updateNestedField, validationError } = useEditorStore()

  // 공유설명 자동 업데이트 함수
  const updateKakaoDescriptionIfAuto = useCallback((newDate?: string, newTime?: string, newVenueName?: string) => {
    if (!invitation) return

    const date = newDate ?? invitation.wedding.date
    const time = newTime ?? invitation.wedding.time
    const venueName = newVenueName ?? invitation.wedding.venue.name
    const currentDesc = invitation.meta.description || ''

    // 현재 description이 비어있거나 자동 생성된 값과 같으면 자동 업데이트
    const currentAutoDesc = generateKakaoDescription(
      invitation.wedding.date,
      invitation.wedding.time,
      invitation.wedding.venue.name
    )

    // 비어있거나 이전 자동생성 값과 같은 경우에만 업데이트
    if (!currentDesc.trim() || currentDesc === currentAutoDesc) {
      const newDesc = generateKakaoDescription(date, time, venueName)
      updateNestedField('meta.description', newDesc)
    }
  }, [invitation, updateNestedField])

  if (!invitation) return null

  const isFamily = templateId === 'narrative-family' || invitation.templateId === 'narrative-family'

  return (
    <div className="p-6 space-y-8">
      {/* 안내 */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-base text-purple-800 font-medium mb-1">필수 정보 입력</p>
        <p className="text-sm text-purple-700">
          청첩장에 표시될 기본 정보를 입력해주세요. 모든 필드가 필수입니다.
        </p>
      </div>

      {/* 신랑신부 기본정보 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          신랑신부 정보
        </h3>

        {/* 신랑 */}
        <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
          <p className="text-base font-semibold text-blue-800">신랑</p>
          {isFamily ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">성</Label>
                <Input
                  value={invitation.groom.lastName || ''}
                  onChange={(e) => {
                    const lastName = e.target.value
                    const firstName = invitation.groom.firstName || ''
                    updateField('groom', {
                      ...invitation.groom,
                      lastName,
                      name: lastName + firstName
                    })
                  }}
                  placeholder="김"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">이름</Label>
                <Input
                  value={invitation.groom.firstName || ''}
                  onChange={(e) => {
                    const firstName = e.target.value
                    const lastName = invitation.groom.lastName || ''
                    updateField('groom', {
                      ...invitation.groom,
                      firstName,
                      name: lastName + firstName
                    })
                  }}
                  placeholder="민준"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">이름 <span className="text-red-500">*</span></Label>
              <Input
                value={invitation.groom.name}
                onChange={(e) => updateNestedField('groom.name', e.target.value)}
                placeholder="김민준"
                className={validationError?.tab === 'names' && !invitation.groom.name?.trim() ? 'border-red-500 ring-2 ring-red-200' : ''}
              />
              {validationError?.tab === 'names' && !invitation.groom.name?.trim() && (
                <p className="text-xs text-red-500">신랑 이름을 입력해주세요</p>
              )}
            </div>
          )}
        </div>

        {/* 신부 */}
        <div className="space-y-3 p-4 bg-pink-50 rounded-lg">
          <p className="text-base font-semibold text-pink-800">신부</p>
          {isFamily ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">성</Label>
                <Input
                  value={invitation.bride.lastName || ''}
                  onChange={(e) => {
                    const lastName = e.target.value
                    const firstName = invitation.bride.firstName || ''
                    updateField('bride', {
                      ...invitation.bride,
                      lastName,
                      name: lastName + firstName
                    })
                  }}
                  placeholder="이"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">이름</Label>
                <Input
                  value={invitation.bride.firstName || ''}
                  onChange={(e) => {
                    const firstName = e.target.value
                    const lastName = invitation.bride.lastName || ''
                    updateField('bride', {
                      ...invitation.bride,
                      firstName,
                      name: lastName + firstName
                    })
                  }}
                  placeholder="서연"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">이름 <span className="text-red-500">*</span></Label>
              <Input
                value={invitation.bride.name}
                onChange={(e) => updateNestedField('bride.name', e.target.value)}
                placeholder="이서연"
                className={validationError?.tab === 'names' && !invitation.bride.name?.trim() ? 'border-red-500 ring-2 ring-red-200' : ''}
              />
              {validationError?.tab === 'names' && !invitation.bride.name?.trim() && (
                <p className="text-xs text-red-500">신부 이름을 입력해주세요</p>
              )}
            </div>
          )}
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
          {/* 날짜/시간 */}
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
              />
            </div>
          </div>

          {/* 예식장 정보 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">예식장 이름 <span className="text-red-500">*</span></Label>
            <Input
              value={invitation.wedding.venue.name}
              onChange={(e) => {
                const newVenueName = e.target.value
                updateNestedField('wedding.venue.name', newVenueName)
                updateKakaoDescriptionIfAuto(undefined, undefined, newVenueName)
              }}
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
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      invitation.wedding.venue.hideHall ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </label>
            </div>
            <Input
              value={invitation.wedding.venue.hall}
              onChange={(e) => updateNestedField('wedding.venue.hall', e.target.value)}
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
              placeholder="서울특별시 강남구 삼성로 614"
            />
          </div>
        </div>
      </section>

      {/* 카카오톡 공유 썸네일 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" />
            <path d="M12 18h.01" />
          </svg>
          카카오톡 공유 썸네일 <span className="text-red-500">*</span>
        </h3>
        <p className="text-sm text-blue-600">
          <svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg> 카카오톡으로 공유할 때 표시되는 이미지입니다. (권장: 1:1 비율)
        </p>

        {/* 경고 문구 */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-700">
            <svg className="w-3 h-3 text-amber-600 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg> <strong>중요:</strong> 카카오톡 썸네일은 한번 공유된 후 변경하면 캐시로 인해
            반영되기까지 시간이 오래 걸릴 수 있습니다. 신중하게 선택해주세요.
          </p>
        </div>

        <div className="max-w-[200px]">
          <ImageUploader
            value={invitation.meta.kakaoThumbnail}
            onChange={(url) => updateNestedField('meta.kakaoThumbnail', url)}
            placeholder="썸네일 업로드"
            aspectRatio="aspect-square"
          />
        </div>
        {!invitation.meta.kakaoThumbnail && (
          <p className="text-xs text-red-500"><svg className="w-3 h-3 text-amber-600 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg> 카카오톡 썸네일은 필수입니다.</p>
        )}
      </section>
    </div>
  )
}
