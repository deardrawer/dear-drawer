'use client'

import { useEditorStore } from '@/store/editorStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import ImageUploader from '@/components/editor/ImageUploader'

interface Step2BasicInfoProps {
  templateId?: string
}

export default function Step2BasicInfo({ templateId }: Step2BasicInfoProps) {
  const { invitation, updateField, updateNestedField, validationError } = useEditorStore()

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
          👫 신랑신부 정보
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
          💒 결혼식 정보
        </h3>

        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          {/* 날짜/시간 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">날짜 <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                value={invitation.wedding.date}
                onChange={(e) => updateNestedField('wedding.date', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">시간</Label>
              <Input
                type="time"
                value={invitation.wedding.time}
                onChange={(e) => updateNestedField('wedding.time', e.target.value)}
              />
            </div>
          </div>

          {/* 예식장 정보 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">예식장 이름 <span className="text-red-500">*</span></Label>
            <Input
              value={invitation.wedding.venue.name}
              onChange={(e) => updateNestedField('wedding.venue.name', e.target.value)}
              placeholder="더채플앳청담"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">예식 홀</Label>
            <Input
              value={invitation.wedding.venue.hall}
              onChange={(e) => updateNestedField('wedding.venue.hall', e.target.value)}
              placeholder="그랜드볼룸 3층"
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
          📲 카카오톡 공유 썸네일 <span className="text-red-500">*</span>
        </h3>
        <p className="text-sm text-blue-600">
          💙 카카오톡으로 공유할 때 표시되는 이미지입니다. (권장: 1:1 비율)
        </p>

        {/* 경고 문구 */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-700">
            ⚠️ <strong>중요:</strong> 카카오톡 썸네일은 한번 공유된 후 변경하면 캐시로 인해
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
          <p className="text-xs text-red-500">⚠️ 카카오톡 썸네일은 필수입니다.</p>
        )}
      </section>
    </div>
  )
}
