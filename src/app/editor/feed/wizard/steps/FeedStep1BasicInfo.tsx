'use client'

import { useState, useRef } from 'react'
import { Music, Upload, X, Loader2, Volume2, VolumeX } from 'lucide-react'
import { bgmPresets } from '@/lib/bgmPresets'
import type { FeedInvitationData } from '../../page'

interface StepProps {
  data: FeedInvitationData
  updateData: (updates: Partial<FeedInvitationData>) => void
  updateNestedData: (path: string, value: unknown) => void
  invitationId: string | null
}

const inputClass =
  'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black'
const sectionClass = 'px-6 py-6 border-b border-gray-100'

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-black' : 'bg-gray-300'}`}
      aria-pressed={checked}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  )
}

// Instagram-style equalizer bars animation
function EqualzerBars() {
  return (
    <div className="flex items-end gap-[2px] h-3">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="w-[2px] bg-white rounded-full animate-pulse"
          style={{
            height: '100%',
            animationDelay: `${i * 0.15}s`,
            animationDuration: '0.6s',
          }}
        />
      ))}
    </div>
  )
}

// Gradient album art circle (Instagram music style)
const GRADIENTS = [
  'from-purple-500 to-pink-500',
  'from-blue-500 to-cyan-400',
  'from-orange-400 to-red-500',
  'from-emerald-400 to-teal-500',
  'from-violet-500 to-indigo-500',
  'from-rose-400 to-pink-500',
  'from-amber-400 to-orange-500',
  'from-sky-400 to-blue-500',
]

export default function FeedStep1BasicInfo({
  data,
  updateData,
  updateNestedData,
  invitationId,
}: StepProps) {
  const [playingBgm, setPlayingBgm] = useState<string | null>(null)
  const [isUploadingAudio, setIsUploadingAudio] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const isCustomBgm = data.bgm?.url && !bgmPresets.some(p => p.url === data.bgm?.url)

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

  const selectBgm = (url: string) => {
    updateNestedData('bgm.url', url)
    updateNestedData('bgm.enabled', true)
  }

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
        updateNestedData('bgm.enabled', true)
      } else {
        alert(result.error || '업로드에 실패했습니다.')
      }
    } catch {
      alert('업로드 중 오류가 발생했습니다.')
    } finally {
      setIsUploadingAudio(false)
    }
  }

  return (
    <div className="pb-4">
      {/* 안내 가이드 */}
      <div className="px-6 pt-6 pb-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 font-medium mb-1">디자인 설정</p>
          <p className="text-xs text-blue-700">
            표시 아이디와 배경음악을 설정해주세요.
          </p>
        </div>
      </div>

      {/* 아이디 설정 */}
      <div className={sectionClass}>
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-2">
          🆔 표시 아이디
        </h3>
        <p className="text-xs text-blue-600 mb-3">인스타그램 프로필에 표시될 아이디를 설정해주세요.</p>
        <input
          className={inputClass}
          value={data.displayId}
          onChange={(e) => updateData({ displayId: e.target.value })}
          placeholder="예: mj♥sy (비워두면 신랑_신부 이름으로 표시)"
        />
        <p className="text-xs text-gray-400 mt-1">특수문자, 이모지 사용 가능</p>
      </div>

      {/* 폰트 스타일 */}
      <div className={sectionClass}>
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          폰트 스타일
        </h3>
        <p className="text-xs text-blue-600 mb-3">텍스트의 글꼴을 선택해주세요.</p>

        <div className="grid grid-cols-1 gap-1.5">
          {([
            { id: 'classic', name: '클래식', sample: '우리 결혼합니다', fontFamily: "'Ridibatang', serif", desc: '리디바탕' },
            { id: 'modern', name: '모던', sample: '우리 결혼합니다', fontFamily: "'Pretendard', sans-serif", desc: '프리텐다드', recommended: true },
            { id: 'romantic', name: '손글씨', sample: '우리 결혼합니다', fontFamily: "'Okticon', serif", desc: '오케이티콘체' },
            { id: 'contemporary', name: '컨템포러리', sample: '우리 결혼합니다', fontFamily: "'JeonnamEducationBarun', sans-serif", desc: '전남교육바른체' },
            { id: 'luxury', name: '포멀', sample: '우리 결혼합니다', fontFamily: "'ELandChoice', serif", desc: '이랜드초이스체' },
            { id: 'gulim', name: '굴림', sample: '우리 결혼합니다', fontFamily: "'JoseonGulim', serif", desc: '조선굴림체' },
            { id: 'adulthand', name: '어른손글씨', sample: '우리 결혼합니다', fontFamily: "'GangwonEducationModuche', sans-serif", desc: '강원교육모두체' },
            { id: 'neathand', name: '또박또박', sample: '우리 결혼합니다', fontFamily: "'OmuDaye', sans-serif", desc: '오무다예체' },
            { id: 'roundhand', name: '둥근손글씨', sample: '우리 결혼합니다', fontFamily: "'OngleipKonkon', sans-serif", desc: '온글잎 콘콘체' },
            { id: 'roundgothic', name: '둥근고딕', sample: '우리 결혼합니다', fontFamily: "'NanumSquareRound', sans-serif", desc: '나눔스퀘어라운드' },
            { id: 'suit', name: 'SUIT', sample: '우리 결혼합니다', fontFamily: "'Suit', sans-serif", desc: 'SUIT' },
            { id: 'myungjo', name: '명조', sample: '우리 결혼합니다', fontFamily: "'ChosunIlboMyungjo', serif", desc: '조선일보명조체' },
          ] as const).map((font) => {
            const isSelected = (data.fontStyle || 'modern') === font.id
            return (
              <button
                key={font.id}
                onClick={() => updateData({ fontStyle: font.id })}
                className={`flex items-center justify-between py-2.5 px-3.5 rounded-xl border-2 transition-all ${
                  isSelected ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {isSelected && (
                    <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <span className="text-xs text-gray-500 flex items-center gap-1.5">
                    {font.desc}
                    {'recommended' in font && font.recommended && <span className="text-[10px] text-white bg-black px-1.5 py-0.5 rounded-full font-normal">추천</span>}
                  </span>
                </div>
                <span
                  className="text-base text-gray-800"
                  style={{ fontFamily: font.fontFamily }}
                >
                  {font.sample}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 배경음악 - Instagram Music Selector Style */}
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Music className="w-4 h-4" />
            배경음악
          </h3>
          <ToggleSwitch
            checked={data.bgm?.enabled || false}
            onChange={(checked) => updateNestedData('bgm.enabled', checked)}
          />
        </div>

        {(data.bgm?.enabled || data.bgm?.url) && (
          <div className="space-y-3">
            {/* 현재 선택된 음악 미니 플레이어 (Instagram story music sticker style) */}
            {data.bgm?.url && (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 p-3">
                <div className="flex items-center gap-3">
                  {/* Album art */}
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${
                    GRADIENTS[bgmPresets.findIndex(p => p.url === data.bgm?.url) % GRADIENTS.length] || 'from-purple-500 to-pink-500'
                  } flex items-center justify-center shrink-0 ${playingBgm === data.bgm.url ? 'animate-spin' : ''}`}
                    style={{ animationDuration: '3s' }}
                  >
                    <Music className="w-4 h-4 text-white/80" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {bgmPresets.find(p => p.url === data.bgm?.url)?.name || '커스텀 음악'}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">
                      {bgmPresets.find(p => p.url === data.bgm?.url)?.artist || '업로드된 파일'}
                    </p>
                  </div>
                  {/* Play/Pause */}
                  <button
                    type="button"
                    onClick={() => toggleBgmPreview(data.bgm!.url!)}
                    className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0"
                  >
                    {playingBgm === data.bgm.url ? (
                      <EqualzerBars />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-white" />
                    )}
                  </button>
                </div>
                {/* Waveform decoration */}
                <div className="flex items-end gap-[1px] mt-2 h-4 opacity-30">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-white rounded-full"
                      style={{
                        height: `${20 + Math.sin(i * 0.7) * 60 + Math.random() * 20}%`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Music list (Instagram style vertical list) */}
            <div className="rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
              {bgmPresets.map((preset, idx) => {
                const isSelected = data.bgm?.url === preset.url
                const isPlaying = playingBgm === preset.url
                return (
                  <div
                    key={preset.id}
                    className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                      isSelected ? 'bg-gray-50' : 'hover:bg-gray-50/50'
                    }`}
                    onClick={() => selectBgm(preset.url)}
                  >
                    {/* Gradient album art thumbnail */}
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${GRADIENTS[idx % GRADIENTS.length]} flex items-center justify-center shrink-0 relative`}>
                      <Music className="w-3.5 h-3.5 text-white/70" />
                      {isPlaying && (
                        <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                          <EqualzerBars />
                        </div>
                      )}
                    </div>
                    {/* Track info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] truncate ${isSelected ? 'font-semibold text-gray-900' : 'text-gray-800'}`}>
                        {preset.name}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {preset.artist || preset.description}
                      </p>
                    </div>
                    {/* Preview button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleBgmPreview(preset.url)
                      }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isPlaying
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {isPlaying ? (
                        <VolumeX className="w-3 h-3" />
                      ) : (
                        <Volume2 className="w-3 h-3" />
                      )}
                    </button>
                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center shrink-0">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Custom upload row */}
              <div
                className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                  isCustomBgm ? 'bg-gray-50' : 'hover:bg-gray-50/50'
                }`}
                onClick={() => {
                  const input = document.getElementById('feed-bgm-file-input') as HTMLInputElement
                  input?.click()
                }}
              >
                <div className={`w-10 h-10 rounded-lg border-2 border-dashed flex items-center justify-center shrink-0 ${
                  isCustomBgm ? 'border-gray-900 bg-gray-900' : 'border-gray-300 bg-gray-50'
                }`}>
                  {isUploadingAudio ? (
                    <Loader2 className={`w-4 h-4 animate-spin ${isCustomBgm ? 'text-white' : 'text-gray-400'}`} />
                  ) : (
                    <Upload className={`w-4 h-4 ${isCustomBgm ? 'text-white' : 'text-gray-400'}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] ${isCustomBgm ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                    내 음악 업로드
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {isCustomBgm ? '업로드된 음악 사용 중' : 'MP3 파일 (10MB 이하)'}
                  </p>
                </div>
                {isCustomBgm && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleBgmPreview(data.bgm!.url!)
                      }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        playingBgm === data.bgm?.url
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {playingBgm === data.bgm?.url ? (
                        <VolumeX className="w-3 h-3" />
                      ) : (
                        <Volume2 className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        updateNestedData('bgm.url', '')
                      }}
                      className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0 hover:bg-red-50"
                    >
                      <X className="w-3 h-3 text-gray-500" />
                    </button>
                    <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </>
                )}
              </div>
            </div>

            <input
              id="feed-bgm-file-input"
              type="file"
              accept=".mp3,audio/mpeg"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleAudioUpload(file)
                e.target.value = ''
              }}
            />

            {/* Auto-play toggle (Instagram style) */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
              <div className="flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs text-gray-700">자동 재생</span>
              </div>
              <ToggleSwitch
                checked={data.bgm?.autoplay ?? true}
                onChange={(checked) => updateNestedData('bgm.autoplay', checked)}
              />
            </div>

            {/* Copyright notice (subtle) */}
            <p className="text-[10px] text-gray-400 leading-relaxed px-1">
              저작권이 있는 음악 업로드 시 법적 책임은 사용자에게 있습니다.
            </p>
          </div>
        )}
      </div>

      {/* 오디오 플레이어 (숨김) */}
      <audio
        ref={audioRef}
        onEnded={() => setPlayingBgm(null)}
        className="hidden"
      />
    </div>
  )
}
