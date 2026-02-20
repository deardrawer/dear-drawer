'use client'

import { useEditorStore } from '@/store/editorStore'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import ImageUploader from '@/components/editor/ImageUploader'
import InlineCropEditor from '@/components/editor/InlineCropEditor'
import ImageCropEditor, { CropData } from '@/components/parents/ImageCropEditor'

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

interface ShareSettingsSectionProps {
  invitationId?: string | null
}

export default function ShareSettingsSection({ invitationId }: ShareSettingsSectionProps) {
  const { invitation, updateNestedField } = useEditorStore()

  if (!invitation) return null

  return (
    <>
      {/* 카카오톡 공유 설정 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          📲 카카오톡 공유 설정
        </h3>
        <p className="text-sm text-blue-600">
          💙 카카오톡으로 공유할 때 표시되는 정보를 설정해주세요.
        </p>

        {/* 경고 문구 */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-700 mb-2">
            ⚠️ <strong>중요:</strong> 카카오톡 공유 정보는 한번 공유된 후 변경하면 캐시로 인해
            반영되기까지 시간이 오래 걸릴 수 있습니다.
          </p>
          <details className="text-xs text-amber-700">
            <summary className="cursor-pointer font-medium hover:text-amber-900">이미지 변경하기 (펼쳐보기)</summary>
            <div className="mt-2 space-y-1 pl-2 border-l-2 border-amber-300">
              <p>이미지 변경을 위해 썸네일 캐시 초기화가 필요합니다.</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>
                  <a
                    href="https://developers.kakao.com/tool/clear/og"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-800 underline hover:text-amber-900"
                  >
                    카카오톡 디벨로퍼
                  </a>에 접속
                </li>
                <li>URL 부분에 카카오톡 공유링크를 입력</li>
                <li>캐시초기화 버튼 클릭</li>
                <li>다시 카카오톡 링크 공유</li>
              </ol>
            </div>
          </details>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
          {/* 썸네일 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">공유 썸네일</Label>
            <p className="text-xs text-gray-400">권장 사이즈: 600 x 600px (1:1 정사각형)</p>
            {invitation.meta.kakaoThumbnail ? (
              <div className="space-y-3">
                <InlineCropEditor
                  imageUrl={invitation.meta.kakaoThumbnail}
                  settings={invitation.meta.kakaoThumbnailSettings || { scale: 1.0, positionX: 0, positionY: 0 }}
                  onUpdate={(s) => {
                    const current = invitation.meta.kakaoThumbnailSettings || { scale: 1.0, positionX: 0, positionY: 0 }
                    updateNestedField('meta.kakaoThumbnailSettings', { ...current, ...s })
                  }}
                  aspectRatio={1}
                  containerWidth={180}
                  colorClass="amber"
                />
                <button
                  type="button"
                  onClick={() => {
                    updateNestedField('meta.kakaoThumbnail', '')
                    updateNestedField('meta.kakaoThumbnailSettings', undefined)
                  }}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  이미지 삭제
                </button>
              </div>
            ) : (
              <div className="max-w-[150px]">
                <ImageUploader
                  value={invitation.meta.kakaoThumbnail}
                  onChange={(url) => updateNestedField('meta.kakaoThumbnail', url)}
                  invitationId={invitationId || undefined}
                  placeholder="썸네일 업로드"
                  aspectRatio="aspect-square"
                />
              </div>
            )}
          </div>

          {/* 공유 제목 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">공유 제목</Label>
            <Input
              value={invitation.meta.title || ''}
              onChange={(e) => updateNestedField('meta.title', e.target.value)}
              placeholder={`${invitation.groom.name || '신랑'} ♥ ${invitation.bride.name || '신부'} 결혼합니다`}
            />
            <p className="text-xs text-gray-400">비워두면 자동 생성됩니다.</p>
          </div>

          {/* 공유 설명 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">공유 설명</Label>
            <Textarea
              value={invitation.meta.description || ''}
              onChange={(e) => updateNestedField('meta.description', e.target.value)}
              placeholder={generateKakaoDescription(invitation.wedding.date, invitation.wedding.time, invitation.wedding.venue.name) || '2025년 5월 24일 토요일 오후 2시\n더채플앳청담'}
              rows={2}
              className="resize-none"
            />
            <p className="text-xs text-gray-400">비워두면 날짜, 시간, 장소가 자동으로 표시됩니다.</p>
          </div>
        </div>
      </section>

      {/* OG 이미지 설정 (문자, SNS 공유용) */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          🖼️ 공유 미리보기 이미지 (OG 이미지)
        </h3>
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            💙 <strong>권장 크기:</strong> 1200 x 630 픽셀 (가로형)<br />
            카카오톡 이외의 플랫폼(문자, 인스타그램, 페이스북 등)에서 공유할 때 표시되는 이미지입니다.
          </p>
        </div>

        <div className="space-y-3">
          <ImageCropEditor
            value={{
              url: invitation.meta.ogImage || '',
              cropX: invitation.meta.ogImageSettings?.cropX ?? 0,
              cropY: invitation.meta.ogImageSettings?.cropY ?? 0,
              cropWidth: invitation.meta.ogImageSettings?.cropWidth ?? 1,
              cropHeight: invitation.meta.ogImageSettings?.cropHeight ?? 1,
            }}
            onChange={(data: CropData) => {
              updateNestedField('meta.ogImage', data.url)
              updateNestedField('meta.ogImageSettings', {
                ...(invitation.meta.ogImageSettings || { scale: 1, positionX: 0, positionY: 0 }),
                cropX: data.cropX,
                cropY: data.cropY,
                cropWidth: data.cropWidth,
                cropHeight: data.cropHeight,
              })
            }}
            aspectRatio={1200 / 630}
            containerWidth={280}
            invitationId={invitationId || undefined}
            label="공유 미리보기 이미지"
          />

          {!invitation.meta.ogImage && invitation.meta.kakaoThumbnail && (
            <div className="p-3 bg-amber-50 rounded-lg">
              <p className="text-xs text-amber-700">
                ⚠️ OG 이미지를 설정하지 않으면 카카오톡 썸네일이 기본으로 사용됩니다.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
