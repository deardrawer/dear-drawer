'use client'

import { useEffect, useState } from 'react'

interface Props {
  invitationId: string
}

interface StatusData {
  connected: boolean
  accountEmail: string | null
  guestFolderReady: boolean
  guestShareEnabled: boolean
  guestShareTitle: string | null
  guestShareDescription: string | null
  slug: string
}

/**
 * 대시보드 하단에 추가되는 하객 사진 공유 설정 카드 (독립 컴포넌트, 기존 대시보드 구조 미변경).
 * - Google Drive 연결 상태 / 연결·해제
 * - 사진 공유 ON/OFF
 * - 공유 페이지 제목·설명
 * - /i/{slug}/share 링크 복사
 */
export default function GuestShareSettings({ invitationId }: Props) {
  const [status, setStatus] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedToast, setSavedToast] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetch(`/api/cloud/google/status?invitationId=${invitationId}`)
        if (!res.ok) {
          if (alive) setLoading(false)
          return
        }
        const data = (await res.json()) as StatusData
        if (!alive) return
        setStatus(data)
        setEnabled(data.guestShareEnabled)
        setTitle(data.guestShareTitle ?? '')
        setDescription(data.guestShareDescription ?? '')
      } catch {
        /* ignore */
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [invitationId])

  const shareUrl = status ? `${typeof window !== 'undefined' ? window.location.origin : ''}/i/${status.slug}/share` : ''

  const saveSettings = async (payload: { enabled?: boolean; title?: string | null; description?: string | null }) => {
    setError('')
    const res = await fetch('/api/guest-share/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitationId, ...payload }),
    })
    if (!res.ok) {
      const e = (await res.json().catch(() => ({}))) as { error?: string }
      throw new Error(e.error || '저장 실패')
    }
  }

  const onToggle = async () => {
    const next = !enabled
    setEnabled(next)
    try {
      await saveSettings({ enabled: next })
    } catch (e) {
      setEnabled(!next) // revert
      setError(e instanceof Error ? e.message : '저장 실패')
    }
  }

  const onSaveText = async () => {
    setSaving(true)
    setError('')
    try {
      await saveSettings({ title, description })
      setSavedToast(true)
      setTimeout(() => setSavedToast(false), 1800)
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패')
    } finally {
      setSaving(false)
    }
  }

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setError('링크 복사에 실패했어요.')
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="h-5 w-32 animate-pulse rounded bg-gray-100" />
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">하객 사진 공유 🤍</h2>
        <label className="inline-flex cursor-pointer items-center gap-2">
          <span className="text-xs text-gray-500">{enabled ? '공유 켜짐' : '공유 꺼짐'}</span>
          <span className="relative">
            <input type="checkbox" checked={enabled} onChange={onToggle} className="peer sr-only" />
            <span className="block h-6 w-11 rounded-full bg-gray-200 transition peer-checked:bg-gray-900" />
            <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
          </span>
        </label>
      </div>

      {error && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>}

      {/* Google Drive 연결 상태 */}
      <div className="mb-4 rounded-xl bg-gray-50 p-4">
        {status?.connected ? (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800">Google Drive 연결됨</p>
              <p className="truncate text-xs text-gray-500">{status.accountEmail}</p>
            </div>
            <button
              onClick={() => {
                if (confirm('Google Drive 연결을 해제할까요? 새로 업로드된 사진이 Drive로 이전되지 않습니다.')) {
                  fetch('/api/cloud/google/disconnect', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ invitationId }),
                  }).then(() => window.location.reload())
                }
              }}
              className="shrink-0 rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 active:bg-gray-100"
            >
              연결 해제
            </button>
          </div>
        ) : (
          <div>
            <p className="mb-3 text-sm text-gray-700">
              사진을 신랑·신부의 Google Drive에 자동 보관하려면 연결이 필요해요.
            </p>
            <button
              onClick={() => {
                window.location.href = `/api/cloud/google/connect?invitationId=${invitationId}`
              }}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white active:scale-[0.99]"
            >
              Google Drive 연결
            </button>
          </div>
        )}
      </div>

      {enabled && !status?.connected && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Drive 미연결 상태에서도 하객이 사진을 보낼 수 있지만, Drive 자동 이전은 연결 후부터 진행돼요.
        </p>
      )}

      {/* 공유 페이지 문구 */}
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">공유 페이지 제목</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={40}
            placeholder="사진 공유"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-gray-400"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">안내 문구</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={120}
            rows={2}
            placeholder="결혼식의 소중한 순간을 함께 나눠주세요 🤍"
            className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-gray-400"
          />
        </label>
        <button
          onClick={onSaveText}
          disabled={saving}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white active:scale-[0.99] disabled:opacity-50"
        >
          {saving ? '저장 중…' : savedToast ? '저장됨 ✓' : '문구 저장'}
        </button>
      </div>

      {/* 공유 링크 */}
      <div className="mt-5 border-t border-gray-100 pt-4">
        <span className="mb-1 block text-xs font-medium text-gray-600">하객 공유 링크</span>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={shareUrl}
            onFocus={(e) => e.target.select()}
            className="min-w-0 flex-1 truncate rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600"
          />
          <button
            onClick={onCopy}
            className="shrink-0 rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 active:bg-gray-200"
          >
            {copied ? '복사됨' : '복사'}
          </button>
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 active:bg-gray-200"
          >
            열기
          </a>
        </div>
      </div>
    </div>
  )
}
