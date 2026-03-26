'use client'

import { useState, useRef } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Play, Pause, Upload, X, Loader2 } from 'lucide-react'
import { bgmPresets } from '@/lib/bgmPresets'
import { useThankYouEditorStore, type ThankYouFontStyle } from '@/store/thankYouEditorStore'

const FONT_STYLE_OPTIONS: { id: ThankYouFontStyle; name: string; desc: string; preview: string }[] = [
  { id: 'classic', name: '클래식 세리프', desc: 'Noto Serif KR', preview: '고급스럽고 정제된' },
  { id: 'modern', name: '모던 고딕', desc: 'Pretendard', preview: '깔끔하고 현대적' },
  { id: 'romantic', name: '손글씨체', desc: 'Okticon', preview: '따뜻하고 감성적인' },
]

interface ThankYouStep1DesignProps {
  invitationId: string | null
}

export default function ThankYouStep1Design({ invitationId }: ThankYouStep1DesignProps) {
  const { fontStyle, setFontStyle, bgm, setBgm } = useThankYouEditorStore()
  const [previewingBgmId, setPreviewingBgmId] = useState<string | null>(null)
  const [isUploadingAudio, setIsUploadingAudio] = useState(false)
  const bgmAudioRef = useRef<HTMLAudioElement>(null)

  const isCustomBgm = bgm.url && !bgmPresets.some(p => p.url === bgm.url)

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
        setBgm({ url: result.url })
      } else {
        alert(result.error || '업로드에 실패했습니다.')
      }
    } catch {
      alert('업로드 중 오류가 발생했습니다.')
    } finally {
      setIsUploadingAudio(false)
    }
  }

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

  return (
    <div className="p-6 space-y-8">
      {/* 안내 */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-base text-purple-800 font-medium mb-1">디자인 선택</p>
        <p className="text-sm text-purple-600">폰트와 배경음악을 설정해주세요.</p>
      </div>

      {/* 폰트 스타일 */}
      <div>
        <h3 className="text-base font-semibold text-[#2C2824] mb-4 flex items-center gap-2">
          <span className="text-lg">Aa</span> 폰트 스타일
        </h3>
        <div className="space-y-2">
          {FONT_STYLE_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => setFontStyle(option.id)}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                fontStyle === option.id
                  ? 'border-[#A37E69] bg-[#A37E69]/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[#2C2824]">{option.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{option.desc}</p>
                </div>
                <span className="text-sm text-gray-400">{option.preview}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 배경음악 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-[#2C2824] flex items-center gap-2">
            <span className="text-lg">🎵</span> 배경음악
          </h3>
          <div className="flex items-center gap-2">
            <Label htmlFor="bgm-toggle" className="text-sm text-gray-500">사용</Label>
            <Switch
              id="bgm-toggle"
              checked={bgm.enabled}
              onCheckedChange={(checked) => setBgm({ enabled: checked })}
            />
          </div>
        </div>

        {bgm.enabled && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Switch
                id="bgm-autoplay"
                checked={bgm.autoplay}
                onCheckedChange={(checked) => setBgm({ autoplay: checked })}
              />
              <Label htmlFor="bgm-autoplay" className="text-sm text-gray-600">자동 재생</Label>
            </div>

            {/* 프리셋 목록 */}
            <div className="space-y-2">
              {bgmPresets.map((preset) => (
                <div
                  key={preset.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    bgm.url === preset.url
                      ? 'border-[#A37E69] bg-[#A37E69]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setBgm({ url: preset.url })}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); handleBgmPreview(preset) }}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 hover:bg-gray-200 transition-colors"
                  >
                    {previewingBgmId === preset.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#2C2824] truncate">{preset.name}</p>
                    <p className="text-xs text-gray-500 truncate">{preset.description}</p>
                  </div>
                  {bgm.url === preset.url && (
                    <div className="w-5 h-5 rounded-full bg-[#A37E69] flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 커스텀 업로드 */}
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2">또는 직접 업로드 (MP3, 최대 10MB)</p>
              {isCustomBgm && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl mb-2">
                  <span className="text-sm text-blue-700 flex-1 truncate">커스텀 BGM 사용 중</span>
                  <button onClick={() => setBgm({ url: '' })} className="text-blue-400 hover:text-blue-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 transition-colors">
                {isUploadingAudio ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                ) : (
                  <Upload className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-sm text-gray-500">{isUploadingAudio ? '업로드 중...' : 'MP3 파일 선택'}</span>
                <input
                  type="file"
                  accept=".mp3,audio/mpeg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleAudioUpload(file)
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
          </div>
        )}
      </div>

      <audio ref={bgmAudioRef} onEnded={() => setPreviewingBgmId(null)} />
    </div>
  )
}
