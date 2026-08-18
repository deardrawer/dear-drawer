'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import ImageUploader from '@/components/editor/ImageUploader'
import DdayPopupEditor from '@/components/dday/DdayPopupEditor'
import { DEFAULT_DDAY_POPUP } from '@/lib/ddayPopupTypes'
import type { ClassicInvitationData } from '../../page'

interface Props {
  data: ClassicInvitationData
  updateData: (updates: Partial<ClassicInvitationData>) => void
  updateNestedData: (path: string, value: unknown) => void
  invitationId: string | null
  onDdayPreview?: () => void
}

const RATIO_OPTIONS = [
  { value: '3:4', label: '세로형', aspect: 'aspect-[3/4]' },
  { value: '1:1', label: '정사각형', aspect: 'aspect-square' },
  { value: '3:2', label: '가로형', aspect: 'aspect-[3/2]' },
] as const

export default function ClassicStepBasicInfo({ data, updateNestedData, invitationId, onDdayPreview }: Props) {
  const kakaoRatio = data.meta.kakaoThumbnailRatio || '1:1'
  const getDayOfWeek = (dateStr: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return ['일', '월', '화', '수', '목', '금', '토'][d.getDay()] + '요일'
  }

  return (
    <div className="p-6 space-y-8">
      {/* 안내 배너 */}
      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <p className="text-base text-orange-800 font-medium mb-1">기본 정보</p>
        <p className="text-sm text-orange-700">
          신랑신부 정보와 결혼식 정보를 입력하세요.
        </p>
      </div>

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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">이름 <span className="text-red-500">*</span></Label>
              <Input
                value={data.groom.name}
                onChange={(e) => updateNestedData('groom.name', e.target.value)}
                placeholder="테오"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">영문 이름</Label>
              <Input
                value={data.groom.nameEn}
                onChange={(e) => updateNestedData('groom.nameEn', e.target.value)}
                placeholder="THEO"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 p-4 bg-pink-50 rounded-lg">
          <p className="text-base font-semibold text-pink-800">신부</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">이름 <span className="text-red-500">*</span></Label>
              <Input
                value={data.bride.name}
                onChange={(e) => updateNestedData('bride.name', e.target.value)}
                placeholder="엘리스"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">영문 이름</Label>
              <Input
                value={data.bride.nameEn}
                onChange={(e) => updateNestedData('bride.nameEn', e.target.value)}
                placeholder="ELISE"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 혼주 성함 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          혼주 성함
        </h3>
        <p className="text-sm text-gray-500">인사말 · 소개 문구에 자동으로 반영됩니다.</p>

        <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm font-semibold text-blue-800">신랑측</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">아버지</Label>
              <Input value={data.groom.father.name} onChange={(e) => updateNestedData('groom.father.name', e.target.value)} placeholder="김OO" />
              <label className="flex items-center gap-1.5 text-[11px] text-gray-500 cursor-pointer">
                <input type="checkbox" checked={data.groom.father.deceased || false} onChange={(e) => updateNestedData('groom.father.deceased', e.target.checked)} /> 고인
              </label>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">어머니</Label>
              <Input value={data.groom.mother.name} onChange={(e) => updateNestedData('groom.mother.name', e.target.value)} placeholder="박OO" />
              <label className="flex items-center gap-1.5 text-[11px] text-gray-500 cursor-pointer">
                <input type="checkbox" checked={data.groom.mother.deceased || false} onChange={(e) => updateNestedData('groom.mother.deceased', e.target.checked)} /> 고인
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-3 p-4 bg-pink-50 rounded-lg">
          <p className="text-sm font-semibold text-pink-800">신부측</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">아버지</Label>
              <Input value={data.bride.father.name} onChange={(e) => updateNestedData('bride.father.name', e.target.value)} placeholder="이OO" />
              <label className="flex items-center gap-1.5 text-[11px] text-gray-500 cursor-pointer">
                <input type="checkbox" checked={data.bride.father.deceased || false} onChange={(e) => updateNestedData('bride.father.deceased', e.target.checked)} /> 고인
              </label>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">어머니</Label>
              <Input value={data.bride.mother.name} onChange={(e) => updateNestedData('bride.mother.name', e.target.value)} placeholder="최OO" />
              <label className="flex items-center gap-1.5 text-[11px] text-gray-500 cursor-pointer">
                <input type="checkbox" checked={data.bride.mother.deceased || false} onChange={(e) => updateNestedData('bride.mother.deceased', e.target.checked)} /> 고인
              </label>
            </div>
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

        <div className="space-y-4 rounded-lg border border-gray-200 p-4 bg-gray-50/50">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">날짜 <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                value={data.wedding.date}
                onChange={(e) => updateNestedData('wedding.date', e.target.value)}
              />
              {data.wedding.date && <p className="text-xs text-gray-400 mt-1">{getDayOfWeek(data.wedding.date)}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">시간</Label>
              <Input
                value={data.wedding.timeDisplay}
                onChange={(e) => updateNestedData('wedding.timeDisplay', e.target.value)}
                placeholder="오후 두 시"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">예식장 이름 <span className="text-red-500">*</span></Label>
            <Input
              value={data.wedding.venue.name}
              onChange={(e) => updateNestedData('wedding.venue.name', e.target.value)}
              placeholder="더 클래식 하우스"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">예식 홀</Label>
            <Input
              value={data.wedding.venue.hall}
              onChange={(e) => updateNestedData('wedding.venue.hall', e.target.value)}
              placeholder="그랜드홀"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">주소 <span className="text-red-500">*</span></Label>
            <Input
              value={data.wedding.venue.address}
              onChange={(e) => updateNestedData('wedding.venue.address', e.target.value)}
              placeholder="서울 중구 정동길 24"
            />
          </div>
        </div>
      </section>

      {/* D-Day 팝업 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4" />
            <path d="M8 2v4" />
            <path d="M3 10h18" />
            <path d="M12 14v4" />
            <path d="M10 16h4" />
          </svg>
          D-Day 팝업
        </h3>
        <p className="text-sm text-gray-500">결혼식 당일 안내 팝업을 설정합니다.</p>

        <div className="rounded-lg border border-gray-200 p-4 bg-gray-50/50">
          <DdayPopupEditor
            value={data.content.classicDdayPopup || DEFAULT_DDAY_POPUP}
            weddingDate={data.wedding.date}
            onChange={(patch) => {
              const current = data.content.classicDdayPopup || DEFAULT_DDAY_POPUP
              updateNestedData('content.classicDdayPopup', { ...current, ...patch })
            }}
            onPreview={onDdayPreview}
          />
        </div>
      </section>

      {/* 공유 설정 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          공유 설정
        </h3>
        <p className="text-sm text-gray-500">카카오톡·링크로 공유될 때 표시되는 제목·설명·썸네일입니다.</p>

        <div className="rounded-lg border border-gray-200 p-4 bg-gray-50/50 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">공유 제목</Label>
            <Input value={data.meta.title} onChange={(e) => updateNestedData('meta.title', e.target.value)} placeholder={`${data.groom.name || '신랑'} ❤ ${data.bride.name || '신부'}의 결혼식`} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">공유 설명</Label>
            <Textarea value={data.meta.description} onChange={(e) => updateNestedData('meta.description', e.target.value)} placeholder="모바일 청첩장이 도착했습니다" rows={2} className="resize-none" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">카카오톡 공유 썸네일</Label>
            <p className="text-[10px] text-gray-400">비워두면 갤러리 첫 사진이 사용됩니다.</p>
            <ImageUploader
              value={data.meta.kakaoThumbnail}
              onChange={(url) => updateNestedData('meta.kakaoThumbnail', url)}
              invitationId={invitationId || undefined}
              placeholder="카카오 썸네일 업로드"
              aspectRatio={RATIO_OPTIONS.find((r) => r.value === kakaoRatio)?.aspect || 'aspect-square'}
              className="max-w-[200px]"
            />
            <div className="pt-1 space-y-1.5">
              <span className="text-sm font-medium text-gray-700">썸네일 비율</span>
              <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
                {RATIO_OPTIONS.map((opt) => {
                  const active = kakaoRatio === opt.value
                  return (
                    <button key={opt.value} type="button" onClick={() => updateNestedData('meta.kakaoThumbnailRatio', opt.value)} className={`px-4 py-1.5 text-xs transition-colors ${active ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:text-gray-800'}`}>
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">링크 공유 썸네일 (OG)</Label>
            <p className="text-[10px] text-gray-400">문자·SNS 링크 미리보기 이미지 (1.91:1). 비워두면 카카오 썸네일이 사용됩니다.</p>
            <ImageUploader
              value={data.meta.ogImage || ''}
              onChange={(url) => updateNestedData('meta.ogImage', url)}
              invitationId={invitationId || undefined}
              placeholder="링크 썸네일 업로드"
              aspectRatio="aspect-video"
              className="max-w-[240px]"
            />
          </div>
        </div>
      </section>
    </div>
  )
}
