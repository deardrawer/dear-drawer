'use client'

import { useEditorStore } from '@/store/editorStore'
import { useState, useRef } from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Play, Pause } from 'lucide-react'
import { bgmPresets } from '@/lib/bgmPresets'

// 색상 테마 옵션
const COLOR_THEMES = [
  { id: 'classic-rose', name: '클래식 로즈', primary: '#E91E63', preview: 'bg-gradient-to-br from-rose-100 to-rose-300' },
  { id: 'modern-black', name: '모던 블랙', primary: '#1A1A1A', preview: 'bg-gradient-to-br from-gray-200 to-gray-400' },
  { id: 'romantic-blush', name: '로맨틱 블러시', primary: '#D4A5A5', preview: 'bg-gradient-to-br from-pink-100 to-pink-200' },
  { id: 'nature-green', name: '네이처 그린', primary: '#6B8E6B', preview: 'bg-gradient-to-br from-green-100 to-green-300' },
  { id: 'luxury-navy', name: '럭셔리 네이비', primary: '#1E3A5F', preview: 'bg-gradient-to-br from-blue-200 to-indigo-300' },
  { id: 'sunset-coral', name: '선셋 코럴', primary: '#E8846B', preview: 'bg-gradient-to-br from-orange-100 to-orange-300' },
] as const

// 테마별 기본 강조 텍스트 색상
const DEFAULT_ACCENT_TEXT_COLORS: Record<string, string> = {
  'classic-rose': '#C41050',
  'modern-black': '#000000',
  'romantic-blush': '#A67A7A',
  'nature-green': '#4A7A4A',
  'luxury-navy': '#B8956A',
  'sunset-coral': '#B85040',
}

// 테마별 기본 본문 텍스트 색상
const DEFAULT_BODY_TEXT_COLORS: Record<string, string> = {
  'classic-rose': '#3d3d3d',
  'modern-black': '#3d3d3d',
  'romantic-blush': '#3d3d3d',
  'nature-green': '#3d3d3d',
  'luxury-navy': '#3d3d3d',
  'sunset-coral': '#3d3d3d',
}

// 폰트 스타일 옵션
const FONT_STYLES = [
  { id: 'classic', name: '클래식', sample: '우리 결혼합니다', fontFamily: "'Ridibatang', serif", desc: '정갈한 바탕체' },
  { id: 'modern', name: '모던', sample: '우리 결혼합니다', fontFamily: "'Pretendard', sans-serif", desc: '세련된 산세리프체' },
  { id: 'romantic', name: '손글씨', sample: '우리 결혼합니다', fontFamily: "'Okticon', serif", desc: 'okticon' },
  { id: 'contemporary', name: '컨템포러리', sample: '우리 결혼합니다', fontFamily: "'JeonnamEducationBarun', sans-serif", desc: '깔끔한 바른체' },
  { id: 'luxury', name: '포멀', sample: '우리 결혼합니다', fontFamily: "'ELandChoice', serif", desc: '고급스러운 명조체' },
] as const

// BGM 프리셋은 @/lib/bgmPresets에서 import

interface Step2StyleProps {
  templateId?: string
}

export default function Step2Style({ templateId }: Step2StyleProps) {
  const { invitation, updateField, updateNestedField } = useEditorStore()
  const [playingBgm, setPlayingBgm] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  if (!invitation) return null

  const { colorTheme, fontStyle, bgm, accentTextColor, bodyTextColor } = invitation

  // 현재 테마의 기본 색상들
  const defaultAccentColor = DEFAULT_ACCENT_TEXT_COLORS[colorTheme] || '#C41050'
  const defaultBodyColor = DEFAULT_BODY_TEXT_COLORS[colorTheme] || '#3d3d3d'
  // 사용자가 설정한 색상이 없으면 기본값 사용
  const currentAccentColor = accentTextColor || defaultAccentColor
  const currentBodyColor = bodyTextColor || defaultBodyColor

  // 테마 변경 핸들러 (색상들도 함께 초기화)
  const handleThemeChange = (themeId: string) => {
    updateField('colorTheme', themeId as typeof colorTheme)
    // 테마 변경 시 커스텀 색상 초기화 (새 테마의 기본값 사용)
    updateField('accentTextColor', undefined as unknown as string)
    updateField('bodyTextColor', undefined as unknown as string)
  }

  // BGM 재생/정지 토글
  const toggleBgmPreview = (url: string) => {
    if (playingBgm === url) {
      audioRef.current?.pause()
      setPlayingBgm(null)
    } else {
      if (audioRef.current) {
        audioRef.current.src = url
        audioRef.current.play()
        setPlayingBgm(url)
      }
    }
  }

  // BGM 선택
  const selectBgm = (url: string) => {
    updateNestedField('bgm.url', url)
    updateNestedField('bgm.enabled', true)
  }

  return (
    <div className="p-6 space-y-8">
      {/* 안내 */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-base text-purple-800 font-medium mb-1">디자인 설정</p>
        <p className="text-sm text-purple-700">
          청첩장의 폰트, 색상, 배경음악을 설정해주세요.
        </p>
      </div>

      {/* 폰트 스타일 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          ✒️ 폰트 스타일
        </h3>
        <p className="text-sm text-blue-600">💙 텍스트의 글꼴을 선택해주세요.</p>

        <div className="grid grid-cols-1 gap-2">
          {FONT_STYLES.map((font) => {
            const isSelected = fontStyle === font.id
            return (
              <button
                key={font.id}
                onClick={() => updateField('fontStyle', font.id as typeof fontStyle)}
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isSelected && (
                    <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <div className="text-left">
                    <span className="text-sm font-medium text-gray-700 block">{font.name}</span>
                    <span className="text-xs text-gray-400">{font.desc}</span>
                  </div>
                </div>
                <span
                  className="text-lg text-gray-800"
                  style={{ fontFamily: font.fontFamily }}
                >
                  {font.sample}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* 색상 테마 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          🎨 색상 테마
        </h3>
        <p className="text-sm text-blue-600">💙 청첩장의 전체적인 색상 분위기를 선택해주세요.</p>

        <div className="grid grid-cols-3 gap-3">
          {COLOR_THEMES.map((theme) => {
            const isSelected = colorTheme === theme.id
            return (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                className={`relative p-3 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-gray-900 ring-2 ring-gray-900/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-black rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <div className={`w-full h-12 rounded-lg mb-2 ${theme.preview}`} />
                <p className="text-xs text-gray-700 font-medium">{theme.name}</p>
              </button>
            )
          })}
        </div>

        {/* 텍스트 색상 커스텀 */}
        <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-4">
          <h4 className="text-sm font-medium text-gray-800">텍스트 색상 설정</h4>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            본문 입력 후 텍스트 색상을 조절하시는 것을 권장드립니다.<br />
            샘플 글씨는 실제 적용 색상이 아닌 미리보기용으로 연하게 표시됩니다.
          </p>

          {/* 본문 텍스트 색상 */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">본문 색상</p>
              <p className="text-xs text-gray-500">청첩장 전체 글자색</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentBodyColor}
                onChange={(e) => updateField('bodyTextColor', e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border border-gray-300"
                style={{ padding: 0 }}
              />
              <span className="text-xs text-gray-600 font-mono w-16">{currentBodyColor}</span>
            </div>
          </div>

          {/* 강조 텍스트 색상 */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">강조 색상</p>
              <p className="text-xs text-gray-500">**텍스트** 형식 강조색</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentAccentColor}
                onChange={(e) => updateField('accentTextColor', e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border border-gray-300"
                style={{ padding: 0 }}
              />
              <span className="text-xs text-gray-600 font-mono w-16">{currentAccentColor}</span>
            </div>
          </div>

          {/* 미리보기 */}
          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <p className="text-sm" style={{ color: currentBodyColor }}>
              본문 텍스트와 <span style={{ color: currentAccentColor, fontWeight: 500 }}>강조된 텍스트</span>를 비교해 보세요
            </p>
          </div>

          {/* 기본값 복원 버튼 */}
          {((accentTextColor && accentTextColor !== defaultAccentColor) ||
            (bodyTextColor && bodyTextColor !== defaultBodyColor)) && (
            <button
              type="button"
              onClick={() => {
                updateField('accentTextColor', undefined as unknown as string)
                updateField('bodyTextColor', undefined as unknown as string)
              }}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              테마 기본 색상으로 복원
            </button>
          )}
        </div>
      </section>

      {/* 배경음악 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            🎵 배경음악
          </h3>
          <Switch
            checked={bgm?.enabled || false}
            onCheckedChange={(checked) => updateNestedField('bgm.enabled', checked)}
          />
        </div>
        <p className="text-sm text-blue-600">
          💙 스토리에 어울리는 배경음악을 선택해주세요.<br />
          <span className="text-amber-600">⚠️ 브라우저 정책에 따라 자동재생 기능이 동작하지 않을 수 있습니다.</span>
        </p>

        {(bgm?.enabled || bgm?.url) && (
          <div className="space-y-4">

            {/* 프리셋 BGM */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">추천 배경음악</Label>
              <div className="grid grid-cols-2 gap-2">
                {bgmPresets.map((preset) => {
                  const isSelected = bgm?.url === preset.url
                  const isPlaying = playingBgm === preset.url
                  return (
                    <div
                      key={preset.id}
                      className={`relative flex items-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => selectBgm(preset.url)}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleBgmPreview(preset.url)
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          isPlaying ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-gray-700 block">{preset.name}</span>
                        <span className="text-[10px] text-gray-400 block truncate">{preset.description}</span>
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center shrink-0">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 자동재생 설정 */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Switch
                checked={bgm?.autoplay ?? true}
                onCheckedChange={(checked) => updateNestedField('bgm.autoplay', checked)}
              />
              <span className="text-sm text-gray-700">자동 재생</span>
              <span className="text-xs text-gray-400 ml-auto">모바일에서 자동재생</span>
            </div>
          </div>
        )}
      </section>

      {/* 오디오 플레이어 (숨김) */}
      <audio
        ref={audioRef}
        onEnded={() => setPlayingBgm(null)}
        className="hidden"
      />
    </div>
  )
}
