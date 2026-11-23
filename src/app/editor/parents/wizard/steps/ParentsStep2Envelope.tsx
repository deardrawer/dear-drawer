'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Upload } from 'lucide-react'
import { uploadImage } from '@/lib/imageUpload'
import type { ParentsInvitationData } from '../../page'
import DdayPopupEditor from '@/components/dday/DdayPopupEditor'
import { DEFAULT_DDAY_POPUP } from '@/lib/ddayPopupTypes'
import { parseDateOnly } from '@/lib/dateOnly'
import { childCallName } from '@/components/parents/cStyle'
import ColorField from '@/components/editor/ColorField'

// 편지 화면 배경 선택지 (기본 흰색 — 저장값 없음)
const LETTER_BG_OPTIONS: { value: string; label: string; swatch?: string }[] = [
  { value: 'white', label: '흰색', swatch: '#FFFFFF' },
  { value: 'gray', label: '연회색', swatch: '#F4F4F5' },
  { value: 'ink', label: '먹색', swatch: '#1F1D1A' },
  { value: 'point', label: '포인트 연하게' },
]

interface ParentsStep2EnvelopeProps {
  data: ParentsInvitationData
  updateData: (updates: Partial<ParentsInvitationData>) => void
  updateNestedData: (path: string, value: unknown) => void
  invitationId: string | null
  onDdayPreview?: () => void
}

export default function ParentsStep2Envelope({
  data,
  updateData,
  updateNestedData,
  invitationId,
  onDdayPreview,
}: ParentsStep2EnvelopeProps) {
  const kakaoAspectMap: Record<string, string> = { '3:4': '3/4', '1:1': '1/1', '3:2': '3/2' }
  const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set())
  // 첫 화면 자녀 문장 자동 문구 (입력란 예시로 표시)
  const childFirst = ((data.sender.side === 'groom' ? data.groom.firstName : data.bride.firstName) || '').trim() || (data.sender.side === 'groom' ? '지훈' : '서연')
  const autoHeadline = `저희 ${data.sender.side === 'groom' ? '아들' : '딸'} ${childCallName(childFirst)}가\n결혼합니다`

  // 이미지 업로드 핸들러
  const handleImageUpload = async (file: File, key: string, onSuccess: (url: string) => void) => {
    setUploadingImages(prev => new Set(prev).add(key))

    try {
      const result = await uploadImage(file, { invitationId: invitationId || undefined })

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
        const newSet = new Set(prev)
        newSet.delete(key)
        return newSet
      })
    }
  }

  return (
    <div className="p-6 space-y-8">
      {/* 보내는 사람 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900">
          보내는 사람
        </h3>

        {/* 혼주 선택 */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">누구의 청첩장인가요?</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => updateNestedData('sender.side', 'groom')}
              className={`p-3 rounded-lg border-2 text-center transition-all ${
                data.sender.side === 'groom'
                  ? 'border-gray-800 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm">신랑측 혼주</div>
            </button>
            <button
              onClick={() => updateNestedData('sender.side', 'bride')}
              className={`p-3 rounded-lg border-2 text-center transition-all ${
                data.sender.side === 'bride'
                  ? 'border-gray-800 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm">신부측 혼주</div>
            </button>
          </div>
        </div>

        {/* 부모님 이름 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{data.sender.side === 'bride' ? '신부측 아버지 성함' : '신랑측 아버지 성함'}</Label>
            <Input
              value={data.sender.fatherName}
              onChange={(e) => updateNestedData('sender.fatherName', e.target.value)}
              placeholder="홍길동"
            />
            <div className="flex items-center gap-1.5">
              <Switch
                checked={data.sender.fatherDeceased ?? false}
                onCheckedChange={(checked) => updateNestedData('sender.fatherDeceased', checked)}
                className="scale-75 origin-left"
              />
              <span className="text-[10px] text-gray-400">고인</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{data.sender.side === 'bride' ? '신부측 어머니 성함' : '신랑측 어머니 성함'}</Label>
            <Input
              value={data.sender.motherName}
              onChange={(e) => updateNestedData('sender.motherName', e.target.value)}
              placeholder="김영희"
            />
            <div className="flex items-center gap-1.5">
              <Switch
                checked={data.sender.motherDeceased ?? false}
                onCheckedChange={(checked) => updateNestedData('sender.motherDeceased', checked)}
                className="scale-75 origin-left"
              />
              <span className="text-[10px] text-gray-400">고인</span>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-gray-500 leading-relaxed">
          ※ 이름을 비운 분은 봉투·인사말에 표시되지 않으며, 두 분 모두 비우면 서명 영역이 숨겨집니다.
        </p>

        {/* 고인 표시 스타일 (sender 고인이 한 명이라도 있을 때만 노출) */}
        {(data.sender.fatherDeceased || data.sender.motherDeceased) && (
          <div className="p-3 bg-gray-50 rounded-lg space-y-2">
            <Label className="text-xs font-medium text-gray-700">고인 표시 스타일</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateData({ deceasedDisplayStyle: 'flower' })}
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  (data.deceasedDisplayStyle || 'flower') === 'flower'
                    ? 'border-gray-800 bg-white'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <img src="/icons/chrysanthemum.svg" alt="" className="w-4 h-4 opacity-70" />
                  <span className="text-sm font-medium">국화꽃</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => updateData({ deceasedDisplayStyle: 'hanja' })}
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  data.deceasedDisplayStyle === 'hanja'
                    ? 'border-gray-800 bg-white'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-sm opacity-70">故</span>
                  <span className="text-sm font-medium">한자</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 신랑·신부 이름 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900">
          신랑 · 신부
        </h3>
        <p className="text-[11px] text-gray-500 leading-relaxed">
          ※ 양가 부모님 정보와 고인 표시는 <b>03 본문 &gt; 메인 사진</b>에서 입력합니다.
        </p>
        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--ed-text-muted)' }}>
          영문 이름은 첫 화면과 양가 소개에 표시됩니다. 비워 두면 한글 이름을 영문으로 바꿔 표시합니다.
        </p>

        {/* 신랑 */}
        <div className="space-y-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--ed-surface-2)' }}>
          <div className="text-sm font-medium" style={{ color: 'var(--ed-text)' }}>신랑</div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] text-gray-500">성</Label>
              <Input
                value={data.groom.lastName}
                onChange={(e) => updateNestedData('groom.lastName', e.target.value)}
                placeholder="한"
                className="text-sm"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-[10px] text-gray-500">이름</Label>
              <Input
                value={data.groom.firstName}
                onChange={(e) => updateNestedData('groom.firstName', e.target.value)}
                placeholder="지훈"
                className="text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-gray-500">영문 이름 (선택)</Label>
            <Input
              value={data.groom.nameEn || ''}
              onChange={(e) => updateNestedData('groom.nameEn', e.target.value)}
              placeholder="Jihoon"
              className="text-sm"
            />
          </div>
        </div>

        {/* 신부 */}
        <div className="space-y-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--ed-surface-2)' }}>
          <div className="text-sm font-medium" style={{ color: 'var(--ed-text)' }}>신부</div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] text-gray-500">성</Label>
              <Input
                value={data.bride.lastName}
                onChange={(e) => updateNestedData('bride.lastName', e.target.value)}
                placeholder="윤"
                className="text-sm"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-[10px] text-gray-500">이름</Label>
              <Input
                value={data.bride.firstName}
                onChange={(e) => updateNestedData('bride.firstName', e.target.value)}
                placeholder="서연"
                className="text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-gray-500">영문 이름 (선택)</Label>
            <Input
              value={data.bride.nameEn || ''}
              onChange={(e) => updateNestedData('bride.nameEn', e.target.value)}
              placeholder="Seoyeon"
              className="text-sm"
            />
          </div>
        </div>
      </section>

      {/* 첫 화면 문구 — 사진 첫 화면의 자녀 문장 */}
      <section className="space-y-2">
        <h3 className="text-base font-semibold" style={{ color: 'var(--ed-text)' }}>
          첫 화면 문구
        </h3>
        <Textarea
          value={data.envelope.headline || ''}
          onChange={(e) => updateNestedData('envelope.headline', e.target.value)}
          placeholder={autoHeadline}
          rows={2}
          maxLength={40}
          className="leading-relaxed"
        />
        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--ed-text-muted)' }}>
          비워 두면 위 문구가 표시됩니다.
        </p>
      </section>

      {/* 봉투 메시지 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900">
          봉투 메시지
        </h3>

        <div className="space-y-1.5">
          <Label className="text-xs">편지 메시지 (줄바꿈으로 구분)</Label>
          <Textarea
            value={data.envelope.message.join('\n')}
            onChange={(e) => updateNestedData('envelope.message', e.target.value.split('\n'))}
            placeholder="항상 저희 가족&#10;챙겨주셔서 감사합니다&#10;&#10;좋은 사람 만나&#10;결혼하게 되었습니다"
            rows={8}
            className="font-light leading-relaxed"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">편지 화면 배경</Label>
          <div className="grid grid-cols-4 gap-2">
            {LETTER_BG_OPTIONS.map((opt) => {
              const isSelected = (data.envelope.letterBg || 'white') === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateNestedData('envelope.letterBg', opt.value === 'white' ? undefined : opt.value)}
                  className="flex flex-col items-center gap-1.5 py-2 transition-all"
                  style={{
                    borderRadius: 'var(--ed-radius-sm)',
                    border: `1.5px solid ${isSelected ? 'var(--ed-accent)' : 'var(--ed-border)'}`,
                    backgroundColor: isSelected ? 'var(--ed-accent-weak)' : 'var(--ed-surface)',
                  }}
                >
                  <span
                    className="w-6 h-6 rounded-full"
                    style={{
                      background: opt.value === 'point'
                        ? `color-mix(in srgb, ${data.customPrimaryColor || '#1F1D1A'} 8%, #FFFFFF)`
                        : opt.swatch,
                      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.12)',
                    }}
                  />
                  <span className="text-[11px]" style={{ color: 'var(--ed-text)' }}>{opt.label}</span>
                </button>
              )
            })}
          </div>
          <div
            className="flex items-center justify-between p-2.5"
            style={{
              borderRadius: 'var(--ed-radius-sm)',
              border: `1.5px solid ${(data.envelope.letterBg || '').startsWith('#') ? 'var(--ed-accent)' : 'transparent'}`,
              backgroundColor: 'var(--ed-surface-2)',
            }}
          >
            <span className="text-xs font-medium" style={{ color: 'var(--ed-text)' }}>직접 고르기</span>
            <ColorField
              label="편지 화면 배경"
              value={(data.envelope.letterBg || '').startsWith('#') ? (data.envelope.letterBg as string) : '#FFFFFF'}
              onChange={(hex) => updateNestedData('envelope.letterBg', hex)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">기본 인사 (게스트 정보 없을 때)</Label>
          <Input
            value={data.envelope.defaultGreeting}
            onChange={(e) => updateNestedData('envelope.defaultGreeting', e.target.value)}
            placeholder="소중한 분께"
          />
        </div>
      </section>

      {/* 공유 설정 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900">
          공유 설정
        </h3>

        {/* 공유 제목 */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">공유 제목</Label>
          <Input
            value={data.meta?.title || ''}
            onChange={(e) => updateNestedData('meta.title', e.target.value)}
            placeholder={`${data.groom.firstName || '신랑'} ♥ ${data.bride.firstName || '신부'} 결혼합니다`}
            className="text-sm"
          />
        </div>

        {/* 공유 설명 */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">공유 설명</Label>
          <Input
            value={data.meta?.description || ''}
            onChange={(e) => updateNestedData('meta.description', e.target.value)}
            placeholder={data.wedding.date ? parseDateOnly(data.wedding.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }) : '2025년 3월 15일 토요일 오후 2시'}
            className="text-sm"
          />
        </div>

        {/* 카카오톡 공유 썸네일 */}
        <div className="space-y-2 pt-3 border-t">
          <Label className="text-xs font-medium">카카오톡 공유 썸네일</Label>
        </div>

        {/* Kakao 비율 선택 */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">썸네일 비율</Label>
          <div className="grid grid-cols-3 gap-2">
            {(['3:4', '1:1', '3:2'] as const).map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => updateNestedData('meta.kakaoThumbnailRatio', ratio)}
                className={`p-2 rounded-lg border-2 text-center transition-all ${
                  (data.meta?.kakaoThumbnailRatio || '1:1') === ratio
                    ? 'border-gray-800 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-xs font-medium">
                  {ratio === '3:4' ? '세로형' : ratio === '1:1' ? '정사각형' : '가로형'}
                </div>
                <div className="text-[10px] text-gray-500">{ratio}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Kakao 썸네일 미리보기 */}
        <div className="space-y-3">
          {(() => {
            const thumbnailUrl = typeof data.meta?.kakaoThumbnail === 'string'
              ? data.meta.kakaoThumbnail
              : data.meta?.kakaoThumbnail?.url || ''
            const selectedRatio = data.meta?.kakaoThumbnailRatio || '1:1'
            const aspectRatio = kakaoAspectMap[selectedRatio]

            return thumbnailUrl ? (
              <div className="max-w-[200px] mx-auto space-y-2">
                <div className="rounded-lg border border-stone-200 bg-white shadow-sm overflow-hidden">
                  <div
                    className="w-full bg-stone-100"
                    style={{ aspectRatio }}
                  >
                    <img
                      src={thumbnailUrl}
                      alt="카카오 썸네일"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="px-2 py-1 border-t border-stone-100">
                    <p className="text-[10px] font-medium text-stone-800 leading-tight truncate">{data.meta?.title || `${data.groom.firstName || '신랑'} ❤ ${data.bride.firstName || '신부'} 결혼합니다`}</p>
                    <p className="text-[9px] text-stone-500 leading-tight mt-0.5">{data.meta?.description || (data.wedding.date ? (() => { const d = new Date(data.wedding.date + 'T00:00:00'); const wd = ['일','월','화','수','목','금','토']; return isNaN(d.getTime()) ? '' : `${String(d.getFullYear()).slice(2)}년 ${d.getMonth()+1}월 ${d.getDate()}일 ${wd[d.getDay()]}요일${data.wedding.timeDisplay ? ` ${data.wedding.timeDisplay}` : ''}` })() : '')}</p>
                  </div>
                  <div className="flex border-t border-stone-100">
                    <div className="flex-1 text-center py-1 text-[9px] text-stone-500 border-r border-stone-100">청첩장 보기</div>
                    <div className="flex-1 text-center py-1 text-[9px] text-stone-500">위치보기</div>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 border-t border-stone-100 bg-stone-50">
                    <span className="text-[9px] text-stone-400">dear drawer</span>
                    <span className="text-[9px] text-stone-300">&gt;</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <label className="flex-1 text-center text-xs py-1.5 px-3 bg-gray-100 hover:bg-gray-200 rounded-md cursor-pointer transition-colors">
                    교체
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleImageUpload(file, 'kakao-thumbnail', (url) => {
                            updateNestedData('meta.kakaoThumbnail', url)
                          })
                          e.target.value = ''
                        }
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => updateNestedData('meta.kakaoThumbnail', '')}
                    className="text-xs py-1.5 px-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center max-w-[200px] mx-auto border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 relative"
                style={{ aspectRatio }}
              >
                <div className="flex flex-col items-center justify-center p-4">
                  <Upload className="w-6 h-6 mb-1 text-gray-400" />
                  <p className="text-xs text-gray-500 text-center">클릭하여 업로드</p>
                  <p className="text-[10px] text-gray-400 mt-1">{selectedRatio}</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleImageUpload(file, 'kakao-thumbnail', (url) => {
                        updateNestedData('meta.kakaoThumbnail', url)
                      })
                      e.target.value = ''
                    }
                  }}
                />
                {uploadingImages.has('kakao-thumbnail') && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
                  </div>
                )}
              </label>
            )
          })()}
        </div>

        {/* 링크 공유 썸네일 이미지 (OG Image) */}
        <div className="space-y-2 pt-4 border-t">
          <Label className="text-xs font-medium">링크 공유 썸네일 (OG 이미지)</Label>
          <p className="text-xs text-gray-500">
            이미지는 1.91:1 비율로 자동 잘립니다
          </p>
        </div>

        {/* OG 이미지 미리보기 및 업로드 */}
        <div className="space-y-3">
          {(() => {
            const kakaoThumb = typeof data.meta?.kakaoThumbnail === 'string' ? data.meta.kakaoThumbnail : (data.meta?.kakaoThumbnail as { url?: string })?.url || ''
            return (
              <>
                <div className="max-w-[220px] mx-auto rounded-lg border border-stone-200 bg-white shadow-sm overflow-hidden">
                  {(data.meta?.ogImage || kakaoThumb) ? (
                    <div className="relative w-full bg-stone-100" style={{ aspectRatio: '1.91/1' }}>
                      <img src={data.meta?.ogImage || kakaoThumb} alt="OG 썸네일" className="w-full h-full object-cover" />
                      {!data.meta?.ogImage && kakaoThumb && (
                        <div className="absolute bottom-0 left-0 right-0 bg-amber-500/80 px-1 py-0.5">
                          <p className="text-[8px] text-white text-center font-medium">카카오 썸네일 사용 중</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full bg-stone-100 flex items-center justify-center" style={{ aspectRatio: '1.91/1' }}>
                      <span className="text-[10px] text-stone-400">이미지 미설정</span>
                    </div>
                  )}
                  <div className="px-2 py-1.5 border-t border-stone-100">
                    <p className="text-[9px] text-stone-400 leading-tight">invite.deardrawer.com</p>
                    <p className="text-[10px] font-medium text-stone-800 leading-tight mt-0.5 truncate">
                      {data.meta?.title || `${data.groom.firstName || '신랑'} ♥ ${data.bride.firstName || '신부'} 결혼합니다`}
                    </p>
                  </div>
                </div>

                {data.meta?.ogImage ? (
                  <div className="flex gap-2 justify-center">
                    <label className="text-center text-xs py-1.5 px-3 bg-gray-100 hover:bg-gray-200 rounded-md cursor-pointer transition-colors">
                      교체
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleImageUpload(file, 'og-image', (url) => {
                              updateNestedData('meta.ogImage', url)
                            })
                            e.target.value = ''
                          }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => updateNestedData('meta.ogImage', '')}
                      className="text-xs py-1.5 px-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                ) : kakaoThumb ? (
                  <label className="flex items-center justify-center w-full h-10 border border-amber-300 bg-amber-50 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors relative">
                    <span className="text-[11px] text-amber-700 font-medium">
                      {uploadingImages.has('og-image') ? '업로드 중...' : '별도 OG 이미지로 교체하기'}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      disabled={uploadingImages.has('og-image')}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleImageUpload(file, 'og-image', (url) => updateNestedData('meta.ogImage', url))
                          e.target.value = ''
                        }
                      }}
                    />
                  </label>
                ) : (
                  <label className="flex flex-col items-center justify-center max-w-[220px] mx-auto border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 relative"
                    style={{ aspectRatio: '1.91/1' }}
                  >
                    <div className="flex flex-col items-center justify-center p-4">
                      <Upload className="w-6 h-6 mb-1 text-gray-400" />
                      <p className="text-xs text-gray-500 text-center">클릭하여 업로드</p>
                      <p className="text-[10px] text-gray-400 mt-1">1200 x 630px</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleImageUpload(file, 'og-image', (url) => updateNestedData('meta.ogImage', url))
                          e.target.value = ''
                        }
                      }}
                    />
                    {uploadingImages.has('og-image') && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
                      </div>
                    )}
                  </label>
                )}
              </>
            )
          })()}
        </div>
      </section>

      {/* D-Day 팝업 설정 */}
      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">D-Day 팝업</h3>
        </div>
        <DdayPopupEditor
          value={data.ddayPopup || DEFAULT_DDAY_POPUP}
          weddingDate={data.wedding.date}
          onChange={(patch) => {
            const current = data.ddayPopup || DEFAULT_DDAY_POPUP
            updateNestedData('ddayPopup', { ...current, ...patch })
          }}
          onPreview={onDdayPreview}
        />
      </section>
    </div>
  )
}
