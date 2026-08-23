'use client'

import { useState } from 'react'
import ColorField from '@/components/editor/ColorField'
import ImageUploader from '@/components/editor/ImageUploader'
import ClassicPhotoField from '../../ClassicPhotoField'
import { DISPLAY_FONTS, KOREAN_FONTS } from '@/app/editor/the-simple/fontOptions'
import ClassicBgmEditor from '../../ClassicBgmEditor'
import type { ClassicInvitationData } from '../../page'

interface Props {
  data: ClassicInvitationData
  updateData: (updates: Partial<ClassicInvitationData>) => void
  updateNestedData: (path: string, value: unknown) => void
  invitationId: string | null
}

type OpeningId = ClassicInvitationData['content']['classicOpeningStyle']
const OPENING_GROUPS: { title: string; desc: string; items: { id: OpeningId; label: string; desc: string }[] }[] = [
  {
    title: '바로 시작', desc: '오프닝 없이 커버 → 스크롤하면 본문',
    items: [
      { id: '프레임', label: '프레임', desc: '엠보스 프레임 커버' },
    ],
  },
  {
    title: '오프닝', desc: '눌러서 여는 인트로 연출',
    items: [
      { id: '실링', label: '실링', desc: '밀랍 인장을 눌러 편지 봉투를 여는 연출' },
      { id: '트레이싱지', label: '트레이싱지', desc: '화면을 눌러 서리를 걷어내는 연출' },
    ],
  },
  {
    title: '예식장 정보 바로보기', desc: '펼치거나 뒤집어 날짜 · 예식장 정보 표시',
    items: [
      { id: '접힌 편지', label: '접힌 편지', desc: '펼치면 날짜 · 예식장 정보 표시' },
      { id: '사진 뒤집기', label: '사진 뒤집기', desc: '뒤집으면 예식 상세 정보 표시' },
    ],
  },
]

// 커스텀 컬러 테마 프리셋 (포인트 / 기본배경 / 틴티드배경 / 기본텍스트 / 틴티드텍스트 / 버튼텍스트)
const COLOR_THEMES: { name: string; accent: string; bg: string; tinted: string; defText: string; tintText: string; btnText: string; sections?: string[] }[] = [
  { name: '클래식', accent: '#111111', bg: '#FFFFFF', tinted: '#F3F1EC', defText: '#111111', tintText: '#111111', btnText: '#FFFFFF' },
  { name: '딥브라운', accent: '#351714', bg: '#F7F3EC', tinted: '#2B1613', defText: '#351714', tintText: '#F2EEE6', btnText: '#FFFFFF', sections: ['intro', 'date', 'rsvp'] },
  { name: '세이지', accent: '#3B4A3A', bg: '#F7F6F1', tinted: '#C8CFBE', defText: '#2E3A2C', tintText: '#2E3A2C', btnText: '#FFFFFF' },
  { name: '더스티블루', accent: '#3A4657', bg: '#F5F6F8', tinted: '#C3CCD6', defText: '#2C3542', tintText: '#2C3542', btnText: '#FFFFFF' },
  { name: '로즈', accent: '#7A3A3A', bg: '#FBF6F4', tinted: '#E4C9C4', defText: '#4A2626', tintText: '#4A2626', btnText: '#FFFFFF' },
  { name: '차콜', accent: '#2B2B2B', bg: '#F4F3F1', tinted: '#CFCBC4', defText: '#232323', tintText: '#232323', btnText: '#FFFFFF' },
  { name: '크림', accent: '#6B5636', bg: '#FBF7EE', tinted: '#E4D8BF', defText: '#4A3B22', tintText: '#4A3B22', btnText: '#FFFFFF' },
  { name: '올리브', accent: '#4A4A2E', bg: '#F7F6EF', tinted: '#D2CFB0', defText: '#38381F', tintText: '#38381F', btnText: '#FFFFFF' },
  { name: '모브', accent: '#4E3A50', bg: '#F8F5F7', tinted: '#D3C4D2', defText: '#3A2C3C', tintText: '#3A2C3C', btnText: '#FFFFFF' },
]

export default function ClassicStepDesign({ data, updateData, updateNestedData, invitationId }: Props) {
  const openingStyle = data.content.classicOpeningStyle || '프레임'
  const applyColorTheme = (t: typeof COLOR_THEMES[number]) => {
    updateData({ customAccentColor: t.accent, customBgColor: t.bg, customSectionBgColor: t.tinted })
    updateNestedData('content.classicDefaultTextColor', t.defText)
    updateNestedData('content.classicTintedTextColor', t.tintText)
    updateNestedData('content.classicButtonTextColor', t.btnText)
    // 딥 테마 등 section 기본값이 정의된 테마: 지정 섹션을 틴티드(진한 배경)로 자동 적용
    if (t.sections) {
      const map: Record<string, 'tinted'> = {}
      t.sections.forEach((k) => { map[k] = 'tinted' })
      updateNestedData('content.classicSectionBgMap', map)
    }
  }
  const displayFont = data.content.classicDisplayFont || 'italiana'
  const bodyFont = data.content.classicBodyFont || 'classic'
  const displayFontFamily = DISPLAY_FONTS.find((f) => f.id === displayFont)?.fontFamily || 'inherit'
  const [displayFontOpen, setDisplayFontOpen] = useState(true) // 영문 폰트 목록 펼침 (기본 펼침 + 접기)
  const [koreanFontOpen, setKoreanFontOpen] = useState(true) // 한글 폰트 목록 펼침

  // 오프닝별 세부 설정 (선택 시 해당 옵션 아래에 펼쳐짐)
  const renderOpeningSettings = (id: OpeningId) => {
    if (id === '프레임') {
      return (
        <div className="mt-2 space-y-3 rounded-lg border border-gray-200 p-4 bg-white">
          <div>
            <p className="text-sm font-medium text-gray-700">엠보스 프레임</p>
            <p className="text-[10px] text-gray-400 leading-tight">선택한 배경색 위에 프레임이 얹혀집니다.</p>
          </div>
          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
            {([
              { id: 'frame1', label: '프레임 1' },
              { id: 'frame2', label: '프레임 2' },
              { id: 'none', label: '없음' },
            ] as const).map((opt) => {
              const active = (data.content.classicOpeningFrame || 'frame1') === opt.id
              return (
                <button key={opt.id} type="button" onClick={() => updateNestedData('content.classicOpeningFrame', opt.id)} className={`px-4 py-1.5 text-xs transition-colors ${active ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:text-gray-800'}`}>
                  {opt.label}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
            <ColorField
              label="글자색"
              value={data.content.classicFrameHintColor || data.customAccentColor || '#351714'}
              onChange={(hex) => updateNestedData('content.classicFrameHintColor', hex)}
            />
            <div className="flex flex-col">
              <span className="text-sm text-gray-700">글자색</span>
              <span className="text-[10px] text-gray-400 leading-tight">이름 · 날짜 · ‘터치 또는 스크롤’ 모두 적용 (기본: 포인트색)</span>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
            <ColorField
              label="배경색"
              value={data.content.classicOpeningBgColor || data.customBgColor || '#FFFFFF'}
              onChange={(hex) => updateNestedData('content.classicOpeningBgColor', hex)}
            />
            <div className="flex flex-col">
              <span className="text-sm text-gray-700">배경 색상</span>
              <span className="text-[10px] text-gray-400 leading-tight">컬러 테마와 독립적으로 프레임 배경을 지정</span>
            </div>
          </div>
        </div>
      )
    }
    if (id === '실링') {
      const op = Math.round((data.content.classicInfoPhotoOpacity ?? 0) * 100)
      return (
        <div className="mt-2 space-y-3 rounded-lg border border-gray-200 p-4 bg-white">
          <div>
            <p className="text-sm font-medium text-gray-700">실링(인장)</p>
            <p className="text-[10px] text-gray-400 leading-tight">봉투를 눌러 여는 오프닝입니다. 인장 색상과 배경을 설정하세요.</p>
          </div>
          <div className="flex items-center gap-3">
            <ColorField
              label="실링 색상"
              value={data.content.classicSealColor || '#7A3A31'}
              onChange={(hex) => updateNestedData('content.classicSealColor', hex)}
            />
            <div className="flex flex-col">
              <span className="text-sm text-gray-700">실링 색상</span>
              <span className="text-[10px] text-gray-400 leading-tight">인장을 원하는 색으로 물들입니다</span>
            </div>
          </div>
          <div className="pt-3 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700">배경 · 사진</p>
            <p className="text-[10px] text-gray-400 leading-tight">처음엔 어둡다가 봉투를 열면 밝아집니다. 배경 오버레이 색상과 첫 사진 배경 투명도를 설정하세요. (컬러 테마와 독립)</p>
          </div>
          <div className="flex items-center gap-3">
            <ColorField
              label="오버레이 색상"
              value={data.content.classicInfoOverlayColor || '#1C100D'}
              onChange={(hex) => updateNestedData('content.classicInfoOverlayColor', hex)}
            />
            <div className="flex-1">
              <div className="flex justify-between text-[11px] text-gray-500 mb-1"><span>배경 사진 투명도</span><span>{op}%</span></div>
              <input
                type="range"
                min={0}
                max={100}
                value={op}
                onChange={(e) => updateNestedData('content.classicInfoPhotoOpacity', Number(e.target.value) / 100)}
                className="w-full accent-gray-900"
              />
            </div>
          </div>
        </div>
      )
    }
    if (id === '트레이싱지') {
      const op = Math.round((data.content.classicTraceVeilOpacity ?? 0) * 100)
      return (
        <div className="mt-2 space-y-3 rounded-lg border border-gray-200 p-4 bg-white">
          <div>
            <p className="text-sm font-medium text-gray-700">시작 전 문구</p>
            <input
              value={data.content.classicTraceStartText ?? ''}
              onChange={(e) => updateNestedData('content.classicTraceStartText', e.target.value)}
              placeholder="소중한 분을 초대합니다."
              className="mt-1 w-full border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-gray-600"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">사진 오버레이</p>
            <p className="text-[10px] text-gray-400 leading-tight">걷어낸 뒤 사진 위에 얹을 색과 투명도 (0%면 원본 사진 그대로)</p>
          </div>
          <div className="flex items-center gap-3">
            <ColorField
              label="오버레이 색상"
              value={data.content.classicTraceVeilColor || '#141008'}
              onChange={(hex) => updateNestedData('content.classicTraceVeilColor', hex)}
            />
            <div className="flex-1">
              <div className="flex justify-between text-[11px] text-gray-500 mb-1"><span>투명도</span><span>{op}%</span></div>
              <input
                type="range"
                min={0}
                max={100}
                value={op}
                onChange={(e) => updateNestedData('content.classicTraceVeilOpacity', Number(e.target.value) / 100)}
                className="w-full accent-gray-900"
              />
            </div>
          </div>
        </div>
      )
    }
    if (id === '접힌 편지' || id === '사진 뒤집기') {
      const ovOp = Math.round((data.content.classicInfoOverlayOpacity ?? 0.42) * 100)
      return (
        <div className="mt-2 space-y-3 rounded-lg border border-gray-200 p-4 bg-white">
          <div>
            <p className="text-sm font-medium text-gray-700">안내 문구</p>
            <input
              value={data.content.classicInfoStartText ?? ''}
              onChange={(e) => updateNestedData('content.classicInfoStartText', e.target.value)}
              placeholder="예식 정보 빠르게 확인하기"
              className="mt-1 w-full border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-gray-600"
            />
          </div>
          {id === '사진 뒤집기' && (
            <div>
              <p className="text-sm font-medium text-gray-700">뒤집기 사진</p>
              <p className="text-[10px] text-gray-400 leading-tight mb-1.5">카드 앞면과 배경에 쓰입니다. 비우면 갤러리 첫 사진이 사용됩니다.</p>
              <ClassicPhotoField
                value={data.content.classicFlipPhoto}
                onChange={(p) => updateNestedData('content.classicFlipPhoto', p)}
                invitationId={invitationId || undefined}
                aspectRatio={250 / 330}
                containerWidth={200}
              />
            </div>
          )}
          <div className="flex items-center gap-3">
            <ColorField
              label="오버레이 색상"
              value={data.content.classicInfoOverlayColor || '#1C100D'}
              onChange={(hex) => updateNestedData('content.classicInfoOverlayColor', hex)}
            />
            <div className="flex-1">
              <div className="flex justify-between text-[11px] text-gray-500 mb-1"><span>오버레이 투명도</span><span>{ovOp}%</span></div>
              <input
                type="range"
                min={0}
                max={100}
                value={ovOp}
                onChange={(e) => updateNestedData('content.classicInfoOverlayOpacity', Number(e.target.value) / 100)}
                className="w-full accent-gray-900"
              />
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="p-6 space-y-8">
      {/* 안내 */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-base text-purple-800 font-medium mb-1">디자인 설정</p>
        <p className="text-sm text-purple-700">
          THE CLASSIC의 색상, 오프닝 연출, 계좌 표시 방식을 설정해주세요.
        </p>
      </div>

      {/* 색상 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
            <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
            <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
            <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
          </svg>
          컬러
        </h3>
        <p className="w-fit flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50/70 rounded-md px-2.5 py-1.5">
          <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="rgba(37,99,235,0.12)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
          청첩장 전체에 사용될 색상을 설정해주세요.
        </p>

        <div className="space-y-2 rounded-lg border border-gray-200 p-4 bg-gray-50/50">
          <div>
            <p className="text-sm font-medium text-gray-700">컬러 테마</p>
            <p className="text-[10px] text-gray-400 leading-tight">프리셋을 누르면 전체 색상이 한번에 적용됩니다. 이후 아래에서 개별 조정할 수 있습니다.</p>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {COLOR_THEMES.map((t) => {
              const active = (data.customAccentColor || '').toUpperCase() === t.accent.toUpperCase()
                && (data.customBgColor || '').toUpperCase() === t.bg.toUpperCase()
                && (data.customSectionBgColor || '').toUpperCase() === t.tinted.toUpperCase()
              return (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => applyColorTheme(t)}
                  className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-1.5 transition-colors ${active ? 'border-gray-900 ring-1 ring-gray-900/20' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <span className="flex overflow-hidden rounded-full">
                    <span className="w-4 h-4" style={{ background: t.accent }} />
                    <span className="w-4 h-4" style={{ background: t.tinted }} />
                    <span className="w-4 h-4 border border-gray-200" style={{ background: t.bg }} />
                  </span>
                  <span className="text-[10px] text-gray-600">{t.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-gray-200 p-4 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <ColorField
              label="포인트 컬러"
              value={data.customAccentColor || '#351714'}
              onChange={(hex) => updateData({ customAccentColor: hex })}
            />
            <div className="flex flex-col">
              <span className="text-sm text-gray-700">포인트 컬러</span>
              <span className="text-[10px] text-gray-400 leading-tight">강조요소</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ColorField
              label="버튼 텍스트"
              value={data.content.classicButtonTextColor || '#FFFFFF'}
              onChange={(hex) => updateNestedData('content.classicButtonTextColor', hex)}
            />
            <div className="flex flex-col">
              <span className="text-sm text-gray-700">버튼 텍스트</span>
              <span className="text-[10px] text-gray-400 leading-tight">채움 버튼(참석합니다 등) 글자색</span>
            </div>
          </div>
          <div className="h-px bg-gray-200" />
          <div className="flex items-center gap-3">
            <ColorField
              label="기본 배경"
              value={data.customBgColor || '#FFFFFF'}
              onChange={(hex) => updateData({ customBgColor: hex })}
            />
            <div className="flex flex-col">
              <span className="text-sm text-gray-700">기본 배경</span>
              <span className="text-[10px] text-gray-400 leading-tight">기본 섹션 배경색</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ColorField
              label="기본 배경 텍스트"
              value={data.content.classicDefaultTextColor || '#351714'}
              onChange={(hex) => updateNestedData('content.classicDefaultTextColor', hex)}
            />
            <div className="flex flex-col">
              <span className="text-sm text-gray-700">기본 배경 텍스트</span>
              <span className="text-[10px] text-gray-400 leading-tight">기본 배경 위 글자색</span>
            </div>
          </div>
          <div className="h-px bg-gray-200" />
          <div className="flex items-center gap-3">
            <ColorField
              label="틴티드 배경"
              value={data.customSectionBgColor || '#DDD1BB'}
              onChange={(hex) => updateData({ customSectionBgColor: hex })}
            />
            <div className="flex flex-col">
              <span className="text-sm text-gray-700">틴티드 배경</span>
              <span className="text-[10px] text-gray-400 leading-tight">틴티드로 지정한 섹션 배경</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ColorField
              label="틴티드 배경 텍스트"
              value={data.content.classicTintedTextColor || '#351714'}
              onChange={(hex) => updateNestedData('content.classicTintedTextColor', hex)}
            />
            <div className="flex flex-col">
              <span className="text-sm text-gray-700">틴티드 배경 텍스트</span>
              <span className="text-[10px] text-gray-400 leading-tight">틴티드 배경 위 글자색</span>
            </div>
          </div>
        </div>
      </section>

      {/* 폰트 (THE SIMPLE과 동일 목록) */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7V4h16v3" />
            <path d="M9 20h6" />
            <path d="M12 4v16" />
          </svg>
          폰트
        </h3>
        <p className="text-sm text-gray-500">청첩장에 사용할 영문 · 한글 폰트를 선택하세요.</p>

        <div className="space-y-3 rounded-lg border border-gray-200 p-4 bg-gray-50/50">
          <div>
            <button type="button" onClick={() => setDisplayFontOpen((o) => !o)} className="w-full flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">영문 디스플레이 폰트</span>
              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                {DISPLAY_FONTS.find((f) => f.id === displayFont)?.name}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: displayFontOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease' }}><path d="M6 9l6 6 6-6" /></svg>
              </span>
            </button>
            {displayFontOpen && (
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {DISPLAY_FONTS.map((font) => {
                  const active = font.id === displayFont
                  return (
                    <button key={font.id} type="button" onClick={() => updateNestedData('content.classicDisplayFont', font.id)} className={`px-2 py-2 rounded-md border text-sm text-center transition-colors ${active ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'}`} style={{ fontFamily: font.fontFamily }}>
                      {font.name}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">영문 대소문자</span>
            <div className="mt-1 inline-flex rounded-lg border border-gray-200 overflow-hidden">
              {([
                { id: 'upper', label: '전부 대문자 (THEO)' },
                { id: 'title', label: '첫 글자만 (Theo)' },
              ] as const).map((opt) => {
                const active = (data.content.classicNameCase || 'upper') === opt.id
                return (
                  <button key={opt.id} type="button" onClick={() => updateNestedData('content.classicNameCase', opt.id)} className={`px-4 py-1.5 text-xs transition-colors ${active ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:text-gray-800'}`}>
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <button type="button" onClick={() => setKoreanFontOpen((o) => !o)} className="w-full flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">한글 본문 폰트</span>
              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                {KOREAN_FONTS.find((f) => f.id === bodyFont)?.name}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: koreanFontOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease' }}><path d="M6 9l6 6 6-6" /></svg>
              </span>
            </button>
            {koreanFontOpen && (
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {KOREAN_FONTS.map((font) => {
                  const active = font.id === bodyFont
                  return (
                    <button key={font.id} type="button" onClick={() => updateNestedData('content.classicBodyFont', font.id)} className={`px-2 py-2 rounded-md border text-sm text-center transition-colors ${active ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'}`} style={{ fontFamily: font.fontFamily }}>
                      {font.name}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* 글자 크기 · 상단문구 · 섹션 간격 */}
        {(() => {
          const fontPct = Math.round((data.content.classicFontScale ?? 1) * 100)
          const eyebrowPct = Math.round((data.content.classicEyebrowScale ?? 1) * 100)
          return (
            <div className="space-y-4 rounded-lg border border-gray-200 p-4 bg-gray-50/50">
              <div>
                <div className="flex justify-between text-[11px] text-gray-500 mb-1"><span className="font-medium text-gray-700">본문 글자 크기</span><span>{fontPct}%</span></div>
                <input
                  type="range" min={85} max={130} value={fontPct}
                  onChange={(e) => updateNestedData('content.classicFontScale', parseInt(e.target.value, 10) / 100)}
                  className="w-full accent-gray-900"
                />
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-gray-500 mb-1"><span className="font-medium text-gray-700">상단문구 크기</span><span>{eyebrowPct}%</span></div>
                <input
                  type="range" min={85} max={130} value={eyebrowPct}
                  onChange={(e) => updateNestedData('content.classicEyebrowScale', parseInt(e.target.value, 10) / 100)}
                  className="w-full accent-gray-900"
                />
              </div>
            </div>
          )
        })()}
      </section>

      {/* 오프닝 스타일 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
          오프닝 연출
        </h3>
        <p className="text-sm text-gray-500">청첩장을 열었을 때 처음 보여지는 방식을 선택하세요.</p>

        {/* 이름 표기 (5종 오프닝 공통) */}
        <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 bg-gray-50/50">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">이름 표기</span>
            <span className="text-[10px] text-gray-400 leading-tight">모든 오프닝 공통 · 영문 / 한글</span>
          </div>
          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
            {([
              { id: 'en', label: '영문' },
              { id: 'ko', label: '한글' },
            ] as const).map((opt) => {
              const active = (data.content.classicOpeningNameLang || 'en') === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateNestedData('content.classicOpeningNameLang', opt.id)}
                  className={`px-4 py-1.5 text-xs transition-colors ${active ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:text-gray-800'}`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-4">
          {OPENING_GROUPS.map((group, gi) => {
            const startIdx = OPENING_GROUPS.slice(0, gi).reduce((a, g) => a + g.items.length, 0)
            return (
            <div key={group.title} className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{group.title}</span>
                <span className="text-[11px] text-gray-400">{group.desc}</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {group.items.map((opt, ii) => {
                  const isSelected = openingStyle === opt.id
                  const num = startIdx + ii + 1
                  return (
                    <div key={opt.id}>
                      <button
                        onClick={() => updateNestedData('content.classicOpeningStyle', opt.id)}
                        className={`w-full flex items-center justify-between py-2.5 px-3.5 transition-all neu-card ${isSelected ? 'neu-card-selected' : ''}`}
                      >
                        <div className="flex items-center gap-2.5">
                          {isSelected && (
                            <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center shrink-0">
                              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                          <span className="text-sm text-gray-800"><span className="text-gray-400 tabular-nums">{num}.</span> {opt.label}</span>
                        </div>
                        <span className="text-xs text-gray-400">{opt.desc}</span>
                      </button>
                      {isSelected && renderOpeningSettings(opt.id)}
                    </div>
                  )
                })}
              </div>
            </div>
            )
          })}
        </div>

        {/* 오프닝 배경/텍스트 커스텀 */}
        <div className="space-y-4 rounded-lg border border-gray-200 p-4 bg-gray-50/50">
          <p className="text-sm font-medium text-gray-700">오프닝 배경 · 텍스트</p>

          <div className="space-y-1.5">
            <span className="text-sm font-medium text-gray-700">배경 이미지 (선택)</span>
            <p className="text-[10px] text-gray-400 leading-tight">업로드하면 오프닝 배경으로 사용됩니다. 비우면 배경 색상이 적용됩니다.</p>
            <ImageUploader
              value={data.content.classicOpeningBgImage || ''}
              onChange={(url) => updateNestedData('content.classicOpeningBgImage', url)}
              invitationId={invitationId || undefined}
              placeholder="오프닝 배경 이미지 업로드"
              aspectRatio="aspect-[3/4]"
              className="max-w-[200px]"
            />
          </div>

          <div className="flex items-center gap-3">
            <ColorField
              label="오프닝 배경색"
              value={data.content.classicOpeningBgColor || data.customBgColor || '#FFFFFF'}
              onChange={(hex) => updateNestedData('content.classicOpeningBgColor', hex)}
            />
            <div className="flex flex-col">
              <span className="text-sm text-gray-700">배경 색상</span>
              <span className="text-[10px] text-gray-400 leading-tight">배경 이미지가 없을 때 사용</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ColorField
              label="오프닝 텍스트색"
              value={data.content.classicOpeningTextColor || data.customAccentColor || '#351714'}
              onChange={(hex) => updateNestedData('content.classicOpeningTextColor', hex)}
            />
            <div className="flex flex-col">
              <span className="text-sm text-gray-700">텍스트 색상</span>
              <span className="text-[10px] text-gray-400 leading-tight">이름 · 라벨 · 날짜 글자색</span>
            </div>
          </div>
        </div>
      </section>

      {/* 배경음악 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
          </svg>
          배경음악
        </h3>
        <ClassicBgmEditor
          enabled={data.content.classicBgmEnabled || false}
          url={data.content.classicBgmUrl || ''}
          autoplay={data.content.classicBgmAutoplay ?? true}
          onChange={(patch) => {
            if ('enabled' in patch) updateNestedData('content.classicBgmEnabled', patch.enabled)
            if ('url' in patch) updateNestedData('content.classicBgmUrl', patch.url)
            if ('autoplay' in patch) updateNestedData('content.classicBgmAutoplay', patch.autoplay)
          }}
          invitationId={invitationId || undefined}
        />
      </section>

    </div>
  )
}
