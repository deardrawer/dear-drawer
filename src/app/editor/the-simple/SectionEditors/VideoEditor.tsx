'use client'

import { useRef, useState } from 'react'
import type { SectionContents } from '../page'

interface VideoEditorProps {
  value: SectionContents['video']
  invitationId?: string | null
  onChange: (next: SectionContents['video']) => void
}

/** YouTube URL → videoId 추출 */
function extractVideoId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([a-zA-Z0-9_-]+)/
  )
  return match?.[1] ?? null
}

const MAX_MB = 50

export default function VideoEditor({ value, invitationId, onChange }: VideoEditorProps) {
  const [ytError, setYtError] = useState(false)
  const [mode, setMode] = useState<'youtube' | 'file'>(value.fileUrl ? 'file' : 'youtube')
  const [uploading, setUploading] = useState(false)
  const [fileMsg, setFileMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const videoId = value.url ? extractVideoId(value.url) : null

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setFileMsg('')
    if (file.type !== 'video/mp4') {
      setFileMsg('MP4 파일만 올릴 수 있어요.')
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setFileMsg(`파일이 너무 커요. ${MAX_MB}MB 이하로 올려주세요.`)
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      if (invitationId) fd.append('invitationId', invitationId)
      const res = await fetch('/api/upload-video', { method: 'POST', body: fd })
      const d = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
      if (!res.ok || !d.url) {
        setFileMsg(d.error || '업로드에 실패했어요.')
        return
      }
      // 파일을 넣으면 유튜브 URL은 비워 파일이 우선 재생되도록
      onChange({ ...value, fileUrl: d.url, url: '' })
      setFileMsg('업로드 완료!')
      setTimeout(() => setFileMsg(''), 1800)
    } catch {
      setFileMsg('업로드에 실패했어요.')
    } finally {
      setUploading(false)
    }
  }

  const removeFile = () => onChange({ ...value, fileUrl: undefined })

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-[10px] uppercase tracking-wider text-stone-400">Eyebrow</span>
        <input
          type="text"
          value={value.eyebrow}
          onChange={(e) => onChange({ ...value, eyebrow: e.target.value })}
          placeholder="Video"
          className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
        />
      </label>

      {/* 소스 선택: 유튜브 / 파일 */}
      <div className="inline-flex rounded-md border border-stone-200 overflow-hidden">
        {([
          { id: 'youtube', label: '유튜브 (추천)' },
          { id: 'file', label: '파일 업로드' },
        ] as const).map((opt) => {
          const active = mode === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setMode(opt.id)}
              className={`px-3 py-1.5 text-xs transition-colors ${active ? 'bg-stone-800 text-white' : 'bg-white text-stone-500 hover:text-stone-800'}`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {mode === 'youtube' ? (
        <>
          <label className="block">
            <span className="text-[10px] uppercase tracking-wider text-stone-400">유튜브 URL</span>
            <input
              type="url"
              value={value.url}
              onChange={(e) => {
                setYtError(false)
                // 유튜브 URL을 넣으면 파일은 비움
                onChange({ ...value, url: e.target.value, fileUrl: undefined })
              }}
              placeholder="https://www.youtube.com/watch?v=... 또는 https://youtu.be/..."
              className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
            />
          </label>
          {value.url && !videoId && <p className="text-[10px] text-red-500">올바른 유튜브 URL을 입력해주세요.</p>}
        </>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] text-stone-500 leading-relaxed">
            <b className="text-stone-700">유튜브 업로드를 가장 권장해요.</b> 화질·재생 안정성이 좋고 모든 기기에서 잘 보여요. 파일은 용량·기기 호환에 따라 재생이 불안정할 수 있어요.
          </p>
          {!invitationId ? (
            <p className="text-[11px] text-stone-500 bg-stone-50 rounded-md px-2.5 py-2 leading-relaxed">
              청첩장을 저장하면 동영상 파일을 올릴 수 있어요.
            </p>
          ) : value.fileUrl ? (
            <div className="space-y-1.5">
              <div className={`${value.portrait ? 'aspect-[9/16] max-w-[55%] mx-auto' : 'aspect-video'} rounded-md overflow-hidden bg-black`}>
                <video src={value.fileUrl} controls playsInline preload="metadata" className="w-full h-full object-contain bg-black" />
              </div>
              <button type="button" onClick={removeFile} className="text-[10px] text-stone-500 underline">
                파일 제거
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="w-full border border-dashed border-stone-300 rounded-md px-3 py-4 text-xs text-stone-600 hover:border-stone-500 disabled:opacity-50"
            >
              {uploading ? '업로드 중…' : `MP4 동영상 올리기 (${MAX_MB}MB 이하)`}
            </button>
          )}
          <input ref={fileRef} type="file" accept="video/mp4" hidden onChange={onPickFile} />
          {fileMsg && <p className="text-[10px] text-stone-500">{fileMsg}</p>}
          <p className="text-[10px] text-stone-400 leading-relaxed">
            mp4(H.264) 권장. 미리보기에서 재생되면 하객도 볼 수 있어요. (아이폰 원본 HEVC는 일부 기기에서 재생이 안 될 수 있어요)
          </p>
        </div>
      )}

      <label className="flex items-center justify-between pt-1">
        <span className="text-xs text-stone-600">
          세로형(숏폼)으로 표시 <span className="text-[10px] text-stone-400">9:16</span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={value.portrait ?? false}
          onClick={() => onChange({ ...value, portrait: !(value.portrait ?? false) })}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${value.portrait ? 'bg-stone-800' : 'bg-stone-200'}`}
        >
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${value.portrait ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
        </button>
      </label>

      {mode === 'youtube' && videoId && (
        <div className="space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-stone-400">미리보기</span>
          <div className={`${value.portrait ? 'aspect-[9/16] max-w-[55%] mx-auto' : 'aspect-video'} rounded-md overflow-hidden bg-black`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ytError ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
              onError={() => setYtError(true)}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </div>
  )
}
