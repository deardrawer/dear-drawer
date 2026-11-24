'use client'

import { useState, useRef, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Play, Pause, Upload, X, Loader2, ImageIcon } from 'lucide-react'
import { FONT_STYLES, HEADING_FONTS, type FontStyleId, type HeadingFontId } from '@/components/parents/types'
import { bgmPresets } from '@/lib/bgmPresets'
import { uploadImage } from '@/lib/imageUpload'
import InlineCropEditor from '@/components/editor/InlineCropEditor'
import ColorField from '@/components/editor/ColorField'
import type { ParentsInvitationData } from '../../page'
import { PARENTS_COLOR_PRESETS, matchColorPreset, colorPresetsFor } from '@/components/parents/stylePresets'

interface ParentsStep1DesignProps {
  data: ParentsInvitationData
  updateData: (updates: Partial<ParentsInvitationData>) => void
  updateNestedData: (path: string, value: unknown) => void
  invitationId: string | null
}

// C안 포인트 색 — 흰 바탕 위에서 잘 읽히는 짙은 색만 (먹색 = 기본, 저장값 없음)
const POINT_COLORS: { label: string; value?: string }[] = [
  { label: '먹색 (기본)' },
  { label: '네이비', value: '#2B3A55' },
  { label: '딥그린', value: '#2F4A3A' },
  { label: '와인', value: '#5A2A35' },
  { label: '브라운', value: '#5A4535' },
  { label: '차콜', value: '#3D3D3D' },
]

// 샘플 청첩장(/sample/parents)에 쓰인 서체 — '추천' 표시
const RECOMMENDED_HEADING: HeadingFontId = 'chosun'
const RECOMMENDED_BODY: FontStyleId = 'ridibatang'

function RecommendBadge() {
  return (
    <span
      className="inline-block align-middle text-[10px] font-medium leading-none px-1.5 py-[3px] ml-1.5"
      style={{ borderRadius: 'var(--ed-radius-pill)', backgroundColor: 'var(--ed-accent-weak)', color: 'var(--ed-accent)' }}
    >
      추천
    </span>
  )
}

// 섹션 배경 프리셋
const BASE_BG_PRESETS = ['#FFFFFF', '#FAFAF9', '#F4F4F5', '#1F1D1A']
const TINT_BG_PRESETS = ['#F4F4F5', '#EEF0F2', '#F1F3EF', '#F5F0F0', '#2B3A55', '#1F1D1A']
// 섹션 목록 (본문 순서) — 키는 ParentsInvitationView 의 secTinted 키
const SECTION_BG_LIST: { key: string; label: string }[] = [
  { key: 'greeting', label: '모시는 글' },
  { key: 'timeline', label: '가족 이야기' },
  { key: 'couple', label: '대표 사진 · 양가' },
  { key: 'youtube', label: '영상' },
  { key: 'date', label: '예식 일시' },
  { key: 'venue', label: '오시는 길' },
  { key: 'gallery', label: '갤러리' },
  { key: 'weddingInfo', label: '결혼식 안내' },
  { key: 'account', label: '마음 전하실 곳' },
  { key: 'share', label: '공유 · 맺음' },
]

// 부제 · 제목 색 팔레트 (point = 고른 포인트 색)
const TEXT_COLORS: { label: string; value: string }[] = [
  { label: '먹색', value: '#1F1D1A' },
  { label: '보조 회색', value: '#8A8378' },
  { label: '포인트 색', value: 'point' },
  { label: '네이비', value: '#2B3A55' },
  { label: '딥그린', value: '#2F4A3A' },
  { label: '버건디', value: '#5A2A35' },
  { label: '브라운', value: '#5A4535' },
]

// 본문 폰트 선택지 (기존 fontStyle 값 그대로 저장 — 이전 청첩장 본문 서체 유지)
const BODY_FONT_OPTIONS: FontStyleId[] = ['elegant', 'pretendard', 'ridibatang', 'soft', 'myungjo', 'classic', 'dandi', 'suit', 'modern', 'friendly', 'roundgothic', 'contemporary', 'luxury', 'gulim', 'neathand', 'roundhand', 'okticon']

export default function ParentsStep1Design({
  data,
  updateData,
  updateNestedData,
  invitationId,
}: ParentsStep1DesignProps) {
  const [previewingBgmId, setPreviewingBgmId] = useState<string | null>(null)
  const [isUploadingAudio, setIsUploadingAudio] = useState(false)
  const [isUploadingBg, setIsUploadingBg] = useState(false)
  const bgmAudioRef = useRef<HTMLAudioElement>(null)
  const currentPoint = (data.customPrimaryColor || '').toUpperCase()
  const [detailOpen, setDetailOpen] = useState(false)
  const selectedPreset = matchColorPreset(data, data.sender?.side)

  // 컬러 스타일 적용 — 색 관련 값만 바꿈
  const applyColorPreset = (id: string) => {
    const preset = PARENTS_COLOR_PRESETS.find((p) => p.id === id)
    if (!preset) return
    const v = preset.values
    updateData({
      customPrimaryColor: v.customPrimaryColor,
      captionColor: v.captionColor,
      titleColor: v.titleColor,
      sectionBaseColor: v.sectionBaseColor,
      sectionTintColor: v.sectionTintColor,
      tintedSections: v.tintedSections && v.tintedSections.length ? [...v.tintedSections] : undefined,
    })
    updateNestedData('envelope.letterBg', v.letterBg)
  }

  // 새 청첩장: 색을 아직 고르지 않았으면 '샘플 (기본)' 색으로 시작 (한 번만)
  const presetInitRef = useRef(false)
  useEffect(() => {
    if (presetInitRef.current) return
    presetInitRef.current = true
    if (!invitationId && selectedPreset === 'white' && !data.envelope?.letterBg) applyColorPreset('sample')
  })
  // 틴티드 배경 기본값: 포인트 색을 고른 경우 그 색을 연하게, 아니면 연회색
  const autoTint = data.customPrimaryColor ? `color-mix(in srgb, ${data.customPrimaryColor} 7%, #FFFFFF)` : '#F4F4F5'

  // 커스텀 BGM인지 확인 (프리셋 URL이 아닌 경우)
  const isCustomBgm = data.bgm?.url && !bgmPresets.some(p => p.url === data.bgm?.url)

  // MP3 업로드 핸들러
  const handleAudioUpload = async (file: File) => {
    if (file.type !== 'audio/mpeg' && !file.name.endsWith('.mp3')) {
      alert('MP3 파일만 업로드 가능합니다.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다.')
      return
    }

    setIsUploadingAudio(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('invitationId', invitationId || 'temp')

      const res = await fetch('/api/upload-audio', { method: 'POST', body: formData })
      const result = await res.json() as { success?: boolean; url?: string; error?: string }

      if (result.success && result.url) {
        updateNestedData('bgm.url', result.url)
      } else {
        alert(result.error || '업로드에 실패했습니다.')
      }
    } catch {
      alert('업로드 중 오류가 발생했습니다.')
    } finally {
      setIsUploadingAudio(false)
    }
  }

  // BGM 미리듣기
  const handleBgmPreview = (preset: typeof bgmPresets[number]) => {
    if (!bgmAudioRef.current) return

    if (previewingBgmId === preset.id) {
      bgmAudioRef.current.pause()
      setPreviewingBgmId(null)
    } else {
      bgmAudioRef.current.src = preset.url
      bgmAudioRef.current.play()
      setPreviewingBgmId(preset.id)
    }
  }

  // BGM 선택
  const handleBgmSelect = (url: string) => {
    updateNestedData('bgm.url', url)
  }

  return (
    <div className="p-6 space-y-8">
      {/* 컬러 스타일 — 색만 한 번에 바꿈 (폰트 · 사진 모양 · 내용은 그대로) */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold" style={{ color: 'var(--ed-text)' }}>
          컬러 고르기
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {colorPresetsFor(data.sender?.side).map((preset) => {
            const v = preset.values
            const isSelected = selectedPreset === preset.id
            const point = v.customPrimaryColor || '#1F1D1A'
            const base = v.sectionBaseColor || '#FFFFFF'
            const tint = v.sectionTintColor || (v.customPrimaryColor ? `color-mix(in srgb, ${v.customPrimaryColor} 7%, #FFFFFF)` : '#F4F4F5')
            const hasTint = (v.tintedSections || []).length > 0
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyColorPreset(preset.id)}
                title={preset.mood}
                className="p-1.5 transition-all"
                style={{
                  borderRadius: 'var(--ed-radius-sm)',
                  border: `1.5px solid ${isSelected ? 'var(--ed-accent)' : 'var(--ed-border)'}`,
                  backgroundColor: isSelected ? 'var(--ed-accent-weak)' : 'var(--ed-surface)',
                }}
              >
                {/* 색 조합 — 기본 배경 위 포인트 점 + 아래 틴티드 띠 */}
                <span className="block relative overflow-hidden h-9" style={{ borderRadius: 4, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)', backgroundColor: base }}>
                  <span className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full" style={{ background: point }} />
                  <span className="absolute left-0 right-0 bottom-0 h-3" style={{ background: hasTint ? tint : base, boxShadow: hasTint ? 'none' : 'inset 0 1px 0 rgba(0,0,0,0.06)' }} />
                </span>
                <span className="block text-[11px] font-semibold mt-1 text-center leading-tight truncate" style={{ color: 'var(--ed-text)' }}>{preset.name.replace(' (기본)', '')}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* 첫 화면 — 사진 사용 / 사진 없이(글자만) */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold" style={{ color: 'var(--ed-text)' }}>
          첫 화면
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: '사진 사용', value: false },
            { label: '사진 없이 (글자만)', value: true },
          ].map((opt) => {
            const isSelected = !!data.envelope?.textOnly === opt.value
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => updateNestedData('envelope.textOnly', opt.value ? true : undefined)}
                className="py-2.5 text-sm font-medium transition-all"
                style={{
                  borderRadius: 'var(--ed-radius-sm)',
                  border: `1.5px solid ${isSelected ? 'var(--ed-accent)' : 'var(--ed-border)'}`,
                  backgroundColor: isSelected ? 'var(--ed-accent-weak)' : 'var(--ed-surface)',
                  color: 'var(--ed-text)',
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>

        {!data.envelope?.textOnly && (
          <>
            {/* 첫 화면 사진 (기존 봉투 배경 이미지) */}
        <div className="p-4 space-y-3" style={{ backgroundColor: 'var(--ed-surface-2)', borderRadius: 'var(--ed-radius)' }}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium" style={{ color: 'var(--ed-text)' }}>첫 화면 사진</p>
            {data.envelope?.backgroundImage && (
              <button
                type="button"
                onClick={() => {
                  updateNestedData('envelope.backgroundImage', undefined)
                  updateNestedData('envelope.backgroundImageSettings', undefined)
                }}
                className="text-xs underline"
                style={{ color: 'var(--ed-text-muted)' }}
              >
                삭제
              </button>
            )}
          </div>
          {data.envelope?.backgroundImage ? (
            <div className="space-y-3">
              {/* 크롭 에디터 */}
              <InlineCropEditor
                imageUrl={data.envelope.backgroundImage}
                settings={data.envelope.backgroundImageSettings || { scale: 1.0, positionX: 0, positionY: 0 }}
                onUpdate={(s) => {
                  const current = data.envelope?.backgroundImageSettings || { scale: 1.0, positionX: 0, positionY: 0 }
                  updateNestedData('envelope.backgroundImageSettings', { ...current, ...s })
                }}
                aspectRatio={9 / 16}
                containerWidth={200}
                colorClass="gray"
              />

              {/* 이미지 교체 */}
              <div className="flex gap-2">
                <label className="flex-1 text-center text-xs py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-md cursor-pointer transition-colors">
                  이미지 교체
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setIsUploadingBg(true)
                        uploadImage(file, { invitationId: invitationId || undefined })
                          .then((result) => {
                            if (result.success && result.webUrl) {
                              updateNestedData('envelope.backgroundImage', result.webUrl)
                              updateNestedData('envelope.backgroundImageSettings', { scale: 1.0, positionX: 0, positionY: 0 })
                            } else {
                              alert(result.error || '이미지 업로드에 실패했습니다.')
                            }
                          })
                          .catch(() => alert('이미지 업로드 중 오류가 발생했습니다.'))
                          .finally(() => setIsUploadingBg(false))
                        e.target.value = ''
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center aspect-[9/16] max-w-[200px] mx-auto border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors relative">
              {isUploadingBg ? (
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              ) : (
                <>
                  <ImageIcon className="w-8 h-8 mb-2 text-gray-400" />
                  <p className="text-xs text-gray-500">눌러서 업로드</p>
                </>
              )}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setIsUploadingBg(true)
                    uploadImage(file, { invitationId: invitationId || undefined })
                      .then((result) => {
                        if (result.success && result.webUrl) {
                          updateNestedData('envelope.backgroundImage', result.webUrl)
                          updateNestedData('envelope.backgroundImageSettings', { scale: 1.0, positionX: 0, positionY: 0 })
                        } else {
                          alert(result.error || '이미지 업로드에 실패했습니다.')
                        }
                      })
                      .catch(() => alert('이미지 업로드 중 오류가 발생했습니다.'))
                      .finally(() => setIsUploadingBg(false))
                    e.target.value = ''
                  }
                }}
              />
            </label>
          )}
          {!data.envelope?.backgroundImage && (
            <p className="text-[11px] text-center" style={{ color: 'var(--ed-text-muted)' }}>사진을 올리면 첫 화면에 표시됩니다.</p>
          )}
        </div>


            {/* 받는 분 이름 색 — 사진 위 이름에만 적용되므로 사진이 있을 때만 표시 */}
            {data.envelope?.backgroundImage && (
              <div className="p-4 space-y-3" style={{ backgroundColor: 'var(--ed-surface-2)', borderRadius: 'var(--ed-radius)' }}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium" style={{ color: 'var(--ed-text)' }}>받는 분 이름 색</p>
                  <ColorField
                    label="받는 분 이름 색"
                    value={data.envelope?.hintTextColor || '#FFFFFF'}
                    onChange={(hex) => updateNestedData('envelope.hintTextColor', hex)}
                  />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { color: undefined, swatch: '#FFFFFF', label: '화이트' },
                    { color: '#1F1D1A', swatch: '#1F1D1A', label: '먹색' },
                    { color: '#F4F4F5', swatch: '#F4F4F5', label: '연회색' },
                    { color: data.customPrimaryColor || '#1F1D1A', swatch: data.customPrimaryColor || '#1F1D1A', label: '포인트 색' },
                  ].map(({ color, swatch, label }) => {
                    const cur = data.envelope?.hintTextColor
                    const isSelected = color ? (cur || '').toUpperCase() === color.toUpperCase() : (!cur || cur.toUpperCase() === '#FFFFFF')
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => updateNestedData('envelope.hintTextColor', color)}
                        className="flex flex-col items-center gap-1 py-1.5 transition-all"
                        style={{
                          borderRadius: 'var(--ed-radius-sm)',
                          border: `1.5px solid ${isSelected ? 'var(--ed-accent)' : 'transparent'}`,
                          backgroundColor: isSelected ? 'var(--ed-accent-weak)' : 'transparent',
                        }}
                      >
                        <span className="w-7 h-7 rounded-full" style={{ backgroundColor: swatch, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.15)' }} />
                        <span className="text-[11px]" style={{ color: 'var(--ed-text)' }}>{label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* 세부 조정 — 처음엔 접힘 */}
      <section>
        <button
          type="button"
          onClick={() => setDetailOpen((o) => !o)}
          className="w-full flex items-center justify-between py-3 px-4"
          style={{ borderRadius: 'var(--ed-radius-sm)', backgroundColor: 'var(--ed-surface-2)', color: 'var(--ed-text)' }}
          aria-expanded={detailOpen}
        >
          <span className="text-sm font-semibold">세부 조정</span>
          <span className="text-[11px]" style={{ color: 'var(--ed-text-muted)' }}>
            포인트 색 · 글자 색 · 섹션 배경 · 폰트 {detailOpen ? '▲' : '▼'}
          </span>
        </button>
        {detailOpen && (
          <div className="pt-5 space-y-8">
          {/* 포인트 색 — C안은 흰 바탕 · 먹색 기본, 포인트 색만 고객이 고름 */}
          <section className="space-y-4">
            <h4 className="text-sm font-semibold" style={{ color: 'var(--ed-text)' }}>
              포인트 색
            </h4>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--ed-text-muted)' }}>
              부제, 예식일, 버튼 등에 쓰입니다.
            </p>

            <div className="grid grid-cols-3 gap-2">
              {POINT_COLORS.map((c) => {
                const isSelected = c.value ? currentPoint === c.value : !data.customPrimaryColor
                return (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => updateData({ customPrimaryColor: c.value })}
                    className="flex items-center gap-2 p-2.5 text-left transition-all"
                    style={{
                      borderRadius: 'var(--ed-radius-sm)',
                      border: `1.5px solid ${isSelected ? 'var(--ed-accent)' : 'var(--ed-border)'}`,
                      backgroundColor: isSelected ? 'var(--ed-accent-weak)' : 'var(--ed-surface)',
                    }}
                  >
                    <span className="w-5 h-5 rounded-full shrink-0" style={{ backgroundColor: c.value || '#1F1D1A' }} />
                    <span className="text-xs font-medium break-keep wrap-anywhere" style={{ color: 'var(--ed-text)' }}>{c.label}</span>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center justify-between p-3" style={{ backgroundColor: 'var(--ed-surface-2)', borderRadius: 'var(--ed-radius-sm)' }}>
              <span className="text-xs font-medium" style={{ color: 'var(--ed-text)' }}>직접 고르기</span>
              <ColorField
                label="포인트 색"
                value={data.customPrimaryColor || '#1F1D1A'}
                onChange={(hex) => updateData({ customPrimaryColor: hex })}
              />
            </div>
          </section>

          {/* 부제 · 제목 색 */}
          <section className="space-y-4">
            <h4 className="text-sm font-semibold" style={{ color: 'var(--ed-text)' }}>
              글자 색
            </h4>
            {([
              { key: 'captionColor', label: '부제 색', sample: '모시는 글', hint: '기본: 포인트 색 (없으면 회색)' },
              { key: 'titleColor', label: '제목 색', sample: '귀한 걸음 하시어', hint: '기본: 먹색' },
            ] as const).map((row) => {
              const current = data[row.key]
              return (
                <div key={row.key} className="p-3 space-y-2.5" style={{ backgroundColor: 'var(--ed-surface-2)', borderRadius: 'var(--ed-radius-sm)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium" style={{ color: 'var(--ed-text)' }}>{row.label}</span>
                    <span className="text-[11px]" style={{ color: 'var(--ed-text-muted)' }}>{row.hint}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateData({ [row.key]: undefined } as Partial<ParentsInvitationData>)}
                      className="h-7 px-2.5 text-[11px] font-medium"
                      style={{
                        borderRadius: 'var(--ed-radius-pill)',
                        border: `1.5px solid ${!current ? 'var(--ed-accent)' : 'var(--ed-border)'}`,
                        backgroundColor: !current ? 'var(--ed-accent-weak)' : 'var(--ed-surface)',
                        color: 'var(--ed-text)',
                      }}
                    >
                      기본
                    </button>
                    {TEXT_COLORS.map((c) => {
                      const value = c.value === 'point' ? (data.customPrimaryColor || '#1F1D1A') : c.value
                      const isSelected = !!current && current.toUpperCase() === value.toUpperCase()
                      return (
                        <button
                          key={c.label}
                          type="button"
                          title={c.label}
                          aria-label={c.label}
                          onClick={() => updateData({ [row.key]: value } as Partial<ParentsInvitationData>)}
                          className="w-7 h-7 rounded-full transition-all"
                          style={{
                            backgroundColor: value,
                            boxShadow: isSelected ? '0 0 0 2px var(--ed-surface), 0 0 0 3.5px var(--ed-accent)' : 'inset 0 0 0 1px rgba(0,0,0,0.12)',
                          }}
                        />
                      )
                    })}
                    <div className="ml-auto">
                      <ColorField
                        label={row.label}
                        value={current || (row.key === 'titleColor' ? '#1F1D1A' : (data.customPrimaryColor || '#8A8378'))}
                        onChange={(hex) => updateData({ [row.key]: hex } as Partial<ParentsInvitationData>)}
                      />
                    </div>
                  </div>
                  <div
                    className="text-[15px]"
                    style={{
                      color: row.key === 'titleColor' ? (current || '#1F1D1A') : (current || (data.customPrimaryColor || '#8A8378')),
                      fontFamily: row.key === 'titleColor' ? "'ChosunIlboMyungjo', serif" : undefined,
                      fontSize: row.key === 'titleColor' ? 17 : 12.5,
                    }}
                  >
                    {row.sample}
                  </div>
                </div>
              )
            })}
          </section>


          {/* 섹션 배경 — 기본 배경 / 틴티드 배경 + 섹션별 선택 */}
          <section className="space-y-4">
            <h4 className="text-sm font-semibold" style={{ color: 'var(--ed-text)' }}>
              섹션 배경
            </h4>
            {([
              { key: 'sectionBaseColor', label: '기본 배경', presets: BASE_BG_PRESETS, auto: '#FFFFFF' },
              { key: 'sectionTintColor', label: '틴티드 배경', presets: TINT_BG_PRESETS, auto: autoTint },
            ] as const).map((row) => {
              const current = data[row.key]
              return (
                <div key={row.key} className="p-3 space-y-2.5" style={{ backgroundColor: 'var(--ed-surface-2)', borderRadius: 'var(--ed-radius-sm)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium" style={{ color: 'var(--ed-text)' }}>{row.label}</span>
                    <ColorField
                      label={row.label}
                      value={current || (row.auto.startsWith('#') ? row.auto : '#F4F4F5')}
                      onChange={(hex) => updateData({ [row.key]: hex } as Partial<ParentsInvitationData>)}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateData({ [row.key]: undefined } as Partial<ParentsInvitationData>)}
                      className="h-7 px-2.5 text-[11px] font-medium inline-flex items-center gap-1.5"
                      style={{
                        borderRadius: 'var(--ed-radius-pill)',
                        border: `1.5px solid ${!current ? 'var(--ed-accent)' : 'var(--ed-border)'}`,
                        backgroundColor: !current ? 'var(--ed-accent-weak)' : 'var(--ed-surface)',
                        color: 'var(--ed-text)',
                      }}
                    >
                      <span className="w-3.5 h-3.5 rounded-full" style={{ background: row.auto, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.15)' }} />
                      기본
                    </button>
                    {row.presets.map((c) => {
                      const isSelected = !!current && current.toUpperCase() === c.toUpperCase()
                      return (
                        <button
                          key={c}
                          type="button"
                          aria-label={c}
                          onClick={() => updateData({ [row.key]: c } as Partial<ParentsInvitationData>)}
                          className="w-7 h-7 rounded-full transition-all"
                          style={{
                            backgroundColor: c,
                            boxShadow: isSelected ? '0 0 0 2px var(--ed-surface), 0 0 0 3.5px var(--ed-accent)' : 'inset 0 0 0 1px rgba(0,0,0,0.15)',
                          }}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* 섹션별 배경 선택 (본문 순서) */}
            <div className="overflow-hidden" style={{ borderRadius: 'var(--ed-radius-sm)', border: '1px solid var(--ed-border)' }}>
              {SECTION_BG_LIST.map((sec, i) => {
                const tinted = (data.tintedSections || []).includes(sec.key)
                return (
                  <div
                    key={sec.key}
                    className="flex items-center justify-between px-3 py-2.5"
                    style={{ borderTop: i ? '1px solid var(--ed-border)' : undefined, backgroundColor: 'var(--ed-surface)' }}
                  >
                    <span className="text-xs" style={{ color: 'var(--ed-text)' }}>{sec.label}</span>
                    <div className="flex p-0.5" style={{ borderRadius: 'var(--ed-radius-pill)', backgroundColor: 'var(--ed-surface-2)' }}>
                      {[false, true].map((v) => (
                        <button
                          key={String(v)}
                          type="button"
                          onClick={() => {
                            const cur = data.tintedSections || []
                            const next = v ? Array.from(new Set([...cur, sec.key])) : cur.filter(k => k !== sec.key)
                            updateData({ tintedSections: next.length ? next : undefined })
                          }}
                          className="h-6 px-2.5 text-[11px] inline-flex items-center gap-1 transition-all"
                          style={{
                            borderRadius: 'var(--ed-radius-pill)',
                            backgroundColor: tinted === v ? 'var(--ed-surface)' : 'transparent',
                            boxShadow: tinted === v ? '0 0 0 1px var(--ed-accent)' : undefined,
                            color: 'var(--ed-text)',
                            fontWeight: tinted === v ? 600 : 400,
                          }}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ background: v ? (data.sectionTintColor || autoTint) : (data.sectionBaseColor || '#FFFFFF'), boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.18)' }}
                          />
                          {v ? '틴티드' : '기본'}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* 메인 폰트 — 제목 · 한글 이름 · 인사말 제목 */}
          <section className="space-y-4">
            <h4 className="text-sm font-semibold" style={{ color: 'var(--ed-text)' }}>
              메인 폰트
            </h4>
            <p className="text-xs" style={{ color: 'var(--ed-text-muted)' }}>섹션 제목, 이름, 인사말 제목에 쓰입니다.</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(HEADING_FONTS) as HeadingFontId[]).map((id) => {
                const f = HEADING_FONTS[id]
                const isSelected = (data.headingFont || 'chosun') === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => updateData({ headingFont: id === 'chosun' ? undefined : id })}
                    className="p-3 text-left transition-all"
                    style={{
                      borderRadius: 'var(--ed-radius-sm)',
                      border: `1.5px solid ${isSelected ? 'var(--ed-accent)' : 'var(--ed-border)'}`,
                      backgroundColor: isSelected ? 'var(--ed-accent-weak)' : 'var(--ed-surface)',
                    }}
                  >
                    <div className="text-[17px] leading-snug" style={{ fontFamily: f.cssVariable, color: 'var(--ed-text)' }}>저희 딸 서연이가</div>
                    <div className="text-[11px] mt-1" style={{ color: 'var(--ed-text-muted)' }}>{f.name}{id === RECOMMENDED_HEADING && <RecommendBadge />}</div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* 본문 폰트 — 인사말 · 편지 · 타임라인 설명 */}
          <section className="space-y-4">
            <h4 className="text-sm font-semibold" style={{ color: 'var(--ed-text)' }}>
              본문 폰트
            </h4>
            <p className="text-xs" style={{ color: 'var(--ed-text-muted)' }}>인사말, 편지, 타임라인 설명에 쓰입니다.</p>
            <div className="space-y-2">
              {BODY_FONT_OPTIONS.map((id) => {
                const f = FONT_STYLES[id]
                const isSelected = (data.fontStyle || 'elegant') === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => updateData({ fontStyle: id as typeof data.fontStyle })}
                    className="w-full p-3 text-left transition-all flex items-center justify-between gap-3"
                    style={{
                      borderRadius: 'var(--ed-radius-sm)',
                      border: `1.5px solid ${isSelected ? 'var(--ed-accent)' : 'var(--ed-border)'}`,
                      backgroundColor: isSelected ? 'var(--ed-accent-weak)' : 'var(--ed-surface)',
                    }}
                  >
                    <span className="text-[15px] min-w-0 break-keep" style={{ fontFamily: f.cssVariable, color: 'var(--ed-text)' }}>늘 저희 가족을 아껴 주셔서 감사합니다</span>
                    <span className="text-[11px] shrink-0" style={{ color: 'var(--ed-text-muted)' }}>{f.fontName}{id === RECOMMENDED_BODY && <RecommendBadge />}</span>
                  </button>
                )
              })}
            </div>
          </section>
          </div>
        )}
      </section>


      {/* 배경음악 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">
            배경음악
          </h3>
          <Switch
            checked={data.bgm?.enabled ?? false}
            onCheckedChange={(checked) => {
              updateNestedData('bgm.enabled', checked)
              if (!checked && bgmAudioRef.current) {
                bgmAudioRef.current.pause()
                setPreviewingBgmId(null)
              }
            }}
          />
        </div>
        <p className="text-sm" style={{ color: 'var(--ed-text-muted)' }}>
          브라우저 정책에 따라 자동재생이 동작하지 않을 수 있습니다.
        </p>

        {/* 숨겨진 오디오 */}
        <audio
          ref={bgmAudioRef}
          onEnded={() => setPreviewingBgmId(null)}
          onPause={() => setPreviewingBgmId(null)}
        />

        <div className="space-y-4">
          {/* BGM 프리셋 리스트 */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">음악 선택</Label>
            <div className="space-y-2">
              {bgmPresets.map((preset) => {
                const isSelected = data.bgm?.url === preset.url
                const isPreviewing = previewingBgmId === preset.id

                return (
                  <div
                    key={preset.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-gray-800 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleBgmSelect(preset.url)}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleBgmPreview(preset)
                      }}
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                      {isPreviewing ? (
                        <Pause className="w-4 h-4 text-gray-600" />
                      ) : (
                        <Play className="w-4 h-4 text-gray-600 ml-0.5" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{preset.name}</div>
                      <div className="text-xs text-gray-500">{preset.artist}</div>
                    </div>
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                    )}
                  </div>
                )
              })}
            </div>

            {/* 직접추가 옵션 */}
            <div
              className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                isCustomBgm
                  ? 'border-gray-800 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => {
                // 직접추가 클릭 시 파일 선택 트리거
                const input = document.getElementById('bgm-file-input') as HTMLInputElement
                input?.click()
              }}
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                {isUploadingAudio ? (
                  <Loader2 className="w-4 h-4 text-gray-600 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 text-gray-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">직접 추가</div>
                <div className="text-xs text-gray-500">
                  {isCustomBgm ? '업로드된 음악 사용 중' : 'MP3 파일 업로드'}
                </div>
              </div>
              {isCustomBgm && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    updateNestedData('bgm.url', '')
                  }}
                  className="p-1 rounded hover:bg-red-100 text-red-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {isCustomBgm && !isUploadingAudio && (
                <div className="w-2 h-2 rounded-full bg-green-500" />
              )}
            </div>
            <input
              id="bgm-file-input"
              type="file"
              accept=".mp3,audio/mpeg"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleAudioUpload(file)
                e.target.value = ''
              }}
            />

            {/* 저작권 안내 */}
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-700">
                <strong>저작권 안내</strong><br />
                저작권이 있는 음악을 업로드할 경우 발생하는 모든 법적 책임은 사용자에게 있습니다.
              </p>
            </div>
          </div>

          {/* 자동 재생 토글 */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium">자동 재생</p>
            </div>
            <Switch
              checked={data.bgm?.autoplay ?? false}
              onCheckedChange={(checked) => updateNestedData('bgm.autoplay', checked)}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
