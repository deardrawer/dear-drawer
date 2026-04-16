'use client'

import { useState } from 'react'
import type { SectionContents } from '../page'

interface VideoEditorProps {
  value: SectionContents['video']
  onChange: (next: SectionContents['video']) => void
}

/** YouTube URL → videoId 추출 */
function extractVideoId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([a-zA-Z0-9_-]+)/
  )
  return match?.[1] ?? null
}

export default function VideoEditor({ value, onChange }: VideoEditorProps) {
  const [error, setError] = useState(false)
  const videoId = value.url ? extractVideoId(value.url) : null

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
      <label className="block">
        <span className="text-[10px] uppercase tracking-wider text-stone-400">유튜브 URL</span>
        <input
          type="url"
          value={value.url}
          onChange={(e) => {
            setError(false)
            onChange({ ...value, url: e.target.value })
          }}
          placeholder="https://www.youtube.com/watch?v=... 또는 https://youtu.be/..."
          className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
        />
      </label>
      {value.url && !videoId && (
        <p className="text-[10px] text-red-500">올바른 유튜브 URL을 입력해주세요.</p>
      )}
      {videoId && (
        <div className="space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-stone-400">미리보기</span>
          <div className="aspect-video rounded-md overflow-hidden bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={error ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
              onError={() => setError(true)}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </div>
  )
}
