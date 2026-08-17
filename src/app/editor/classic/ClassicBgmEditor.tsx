'use client'

import { useState, useRef } from 'react'
import { bgmPresets, getBgmPresetByUrl } from '@/lib/bgmPresets'

interface Props {
  enabled: boolean
  url: string
  autoplay: boolean
  onChange: (patch: { enabled?: boolean; url?: string; autoplay?: boolean }) => void
  invitationId?: string
}

/** THE CLASSIC 배경음악 편집 — THE SIMPLE과 동일한 UI (프리셋 미리듣기·선택 + 직접 업로드 + 자동재생) */
export default function ClassicBgmEditor({ enabled, url, autoplay, onChange, invitationId }: Props) {
  const [playing, setPlaying] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const preview = (u: string) => {
    const a = audioRef.current
    if (!a) return
    if (playing === u) { a.pause(); setPlaying(null) }
    else { a.src = u; a.play().then(() => setPlaying(u)).catch(() => {}) }
  }

  return (
    <div className="space-y-3">
      <audio ref={audioRef} onEnded={() => setPlaying(null)} />

      {/* 활성화 토글 */}
      <label className="flex items-center justify-between rounded-lg border border-gray-200 p-3 bg-gray-50/50">
        <span className="text-sm font-medium text-gray-700">배경음악 사용</span>
        <button
          type="button"
          onClick={() => { const next = !enabled; onChange({ enabled: next }); if (!next && audioRef.current) { audioRef.current.pause(); setPlaying(null) } }}
          className={`relative w-9 h-5 rounded-full transition-colors ${enabled ? 'bg-gray-900' : 'bg-gray-300'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${enabled ? 'translate-x-4' : ''}`} />
        </button>
      </label>

      {enabled && (
        <>
          {/* 프리셋 목록 */}
          <div className="space-y-1.5">
            {bgmPresets.map((preset) => {
              const isSelected = url === preset.url
              const isPlaying = playing === preset.url
              return (
                <div
                  key={preset.id}
                  onClick={() => onChange({ url: preset.url, enabled: true })}
                  className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${isSelected ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <button
                    type="button"
                    className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 shrink-0 transition-colors"
                    onClick={(e) => { e.stopPropagation(); preview(preset.url) }}
                  >
                    {isPlaying ? (
                      <svg className="w-3.5 h-3.5 text-gray-700" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                    ) : (
                      <svg className="w-3.5 h-3.5 text-gray-700 ml-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-800 font-medium truncate">{preset.name}</div>
                    <div className="text-[10px] text-gray-400 truncate">{preset.description}</div>
                  </div>
                  {isSelected && (
                    <svg className="w-4 h-4 text-gray-900 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  )}
                </div>
              )
            })}
          </div>

          {/* 직접 업로드 */}
          <div className="pt-1 space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-gray-400">직접 업로드</div>
            {url && !getBgmPresetByUrl(url) ? (
              <div className="flex items-center gap-2 p-2 rounded-md border border-gray-900 bg-gray-50">
                <div className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-200 shrink-0">
                  <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-800 font-medium truncate">내 음악</div>
                  <div className="text-[10px] text-gray-400 truncate">직접 업로드한 파일</div>
                </div>
                <button type="button" onClick={() => { onChange({ url: '', enabled: false }); if (audioRef.current) { audioRef.current.pause(); setPlaying(null) } }} className="text-[10px] text-gray-400 hover:text-gray-600 shrink-0 px-1">삭제</button>
              </div>
            ) : (
              <label className="block">
                <input
                  type="file"
                  accept="audio/mpeg,audio/mp3"
                  className="hidden"
                  disabled={!invitationId}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    e.target.value = ''
                    if (!file || !invitationId) return
                    if (file.size > 10 * 1024 * 1024) { alert('파일 크기는 10MB 이하만 가능합니다.'); return }
                    try {
                      const fd = new FormData()
                      fd.append('file', file)
                      fd.append('invitationId', invitationId)
                      const res = await fetch('/api/upload-audio', { method: 'POST', body: fd })
                      const r = await res.json() as { success?: boolean; url?: string; error?: string }
                      if (r.success && r.url) onChange({ url: r.url, enabled: true })
                      else alert(r.error || '업로드에 실패했습니다.')
                    } catch { alert('업로드 중 오류가 발생했습니다.') }
                  }}
                />
                <div className={`w-full border-2 border-dashed rounded-md px-4 py-3 text-center text-[11px] transition-colors ${!invitationId ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-300 text-gray-500 hover:border-gray-500 hover:text-gray-700 cursor-pointer'}`}>
                  + MP3 파일 업로드 (최대 10MB)
                </div>
              </label>
            )}
            {!invitationId && <p className="text-[10px] text-amber-500">저장 후 음악 파일을 업로드할 수 있습니다</p>}
            <p className="text-[10px] text-gray-400 leading-relaxed">저작권이 있는 음악을 업로드할 경우 발생하는 모든 법적 책임은 사용자에게 있습니다. 저작권에 위배되지 않는 MP3 파일만 업로드해주세요.</p>
          </div>

          {/* 자동재생 토글 */}
          <label className="flex items-center justify-between rounded-lg border border-gray-200 p-3 bg-gray-50/50">
            <div>
              <span className="text-sm font-medium text-gray-700">자동 재생</span>
              <p className="text-[10px] text-gray-400 leading-tight">청첩장 열면 자동으로 음악이 재생됩니다</p>
            </div>
            <button type="button" onClick={() => onChange({ autoplay: !autoplay })} className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${autoplay ? 'bg-gray-900' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${autoplay ? 'translate-x-4' : ''}`} />
            </button>
          </label>

          {url && (() => { const sel = getBgmPresetByUrl(url); return sel ? <div className="text-[10px] text-gray-400 text-center">선택됨: {sel.name}</div> : null })()}
        </>
      )}
    </div>
  )
}
