'use client'

import { useState, useRef } from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Palette, Type, Music, Play, Pause } from 'lucide-react'
import { COLOR_THEMES, type ColorThemeId } from '@/components/parents/types'
import { bgmPresets } from '@/lib/bgmPresets'
import type { ParentsInvitationData } from '../../page'

interface ParentsStep1DesignProps {
  data: ParentsInvitationData
  updateData: (updates: Partial<ParentsInvitationData>) => void
  updateNestedData: (path: string, value: unknown) => void
  invitationId: string | null
}

// 폰트 스타일 옵션
const FONT_STYLE_OPTIONS = [
  { id: 'soft', name: '부드러운 바탕', desc: '고운바탕', preview: '따뜻하고 부드러운' },
  { id: 'classic', name: '고전 세리프', desc: '함렛 (Hahmlet)', preview: '고급스럽고 정제된' },
  { id: 'modern', name: '모던 고딕', desc: 'IBM Plex Sans KR', preview: '깔끔하고 현대적' },
  { id: 'friendly', name: '친근한 고딕', desc: '나눔고딕', preview: '부드럽고 읽기 쉬운' },
  { id: 'ridibatang', name: '리디바탕', desc: 'RIDIBatang', preview: '깔끔하고 가독성 좋은' },
  { id: 'okticon', name: '오케이티콘', desc: 'Okticon', preview: '손글씨 느낌의 귀여운' },
] as const

export default function ParentsStep1Design({
  data,
  updateData,
  updateNestedData,
}: ParentsStep1DesignProps) {
  const [previewingBgmId, setPreviewingBgmId] = useState<string | null>(null)
  const [isCustomBgm, setIsCustomBgm] = useState(false)
  const bgmAudioRef = useRef<HTMLAudioElement>(null)

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
    setIsCustomBgm(false)
  }

  return (
    <div className="p-6 space-y-8">
      {/* 안내 */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-base text-purple-800 font-medium mb-1">디자인 선택</p>
        <p className="text-sm text-purple-700">
          💡 청첩장의 분위기를 결정하는 컬러와 폰트, 배경음악을 선택해주세요.
        </p>
      </div>

      {/* 컬러 테마 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${COLOR_THEMES[data.colorTheme || 'burgundy'].primary}20` }}
          >
            <Palette className="w-3 h-3" style={{ color: COLOR_THEMES[data.colorTheme || 'burgundy'].primary }} />
          </div>
          컬러 테마
        </h3>
        <p className="text-sm text-blue-600">💡 청첩장 전체 분위기를 결정하는 컬러 테마를 선택하세요.</p>

        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(COLOR_THEMES) as ColorThemeId[]).map((themeId) => {
            const theme = COLOR_THEMES[themeId]
            const isSelected = (data.colorTheme || 'burgundy') === themeId
            return (
              <button
                key={themeId}
                onClick={() => updateData({ colorTheme: themeId })}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? 'border-gray-800 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: theme.primary }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-white shadow-sm -ml-3"
                    style={{ backgroundColor: theme.accent }}
                  />
                  <span className="text-xs font-medium ml-1">{theme.name}</span>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* 폰트 스타일 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
            <Type className="w-3 h-3 text-indigo-600" />
          </div>
          폰트 스타일
        </h3>
        <p className="text-sm text-blue-600">💡 청첩장의 분위기를 결정하는 폰트 스타일을 선택하세요.</p>

        <div className="space-y-2">
          {FONT_STYLE_OPTIONS.map((font) => {
            const isSelected = (data.fontStyle || 'soft') === font.id
            return (
              <button
                key={font.id}
                onClick={() => updateData({ fontStyle: font.id as typeof data.fontStyle })}
                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                  isSelected
                    ? 'border-gray-800 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{font.name}</div>
                    <div className="text-xs text-gray-500">{font.desc}</div>
                  </div>
                  <div className="text-[10px] text-gray-400">{font.preview}</div>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* 배경음악 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
              <Music className="w-3 h-3 text-amber-600" />
            </div>
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
        <p className="text-sm text-blue-600">
          💡 스토리에 어울리는 배경음악을 선택해주세요.<br />
          <span className="text-amber-600">⚠️ 브라우저 정책에 따라 자동재생 기능이 동작하지 않을 수 있습니다.</span>
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
                const isSelected = !isCustomBgm && data.bgm?.url === preset.url
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
          </div>

          {/* 직접 입력 */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">또는 직접 입력</Label>
            <Input
              value={isCustomBgm ? data.bgm?.url || '' : ''}
              onChange={(e) => {
                setIsCustomBgm(true)
                updateNestedData('bgm.url', e.target.value)
              }}
              placeholder="MP3 파일 URL 입력"
              className="text-sm"
            />
          </div>

          {/* 자동 재생 토글 */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium">자동 재생</p>
              <p className="text-xs text-gray-500">페이지 열릴 때 자동으로 재생 (브라우저 제한 있음)</p>
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
