'use client'

import { useEffect, useState } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { STAMP_MESSAGE_MAX, STAMP_MESSAGE_PLACEHOLDER } from '@/lib/postDrawerConstants'
import { Button } from '@/components/ui/button'

/**
 * 우표 '결혼식 한 조각'(post_drawers.stamp_message) 입력 — POST DRAWER 파일럿(OUR 발행 스텝).
 * - 선택 입력. 비워도 우표는 만들어짐.
 * - 저장은 PATCH /api/post-drawer/stamp (owner) — invitation.content는 건드리지 않음.
 * - 우측 미리보기는 스토어를 읽기 전용으로만 사용(썸네일/날짜). 이름은 공개 우표에 노출 안 하므로 미표시.
 */
function fmtDate(s: string): string {
  const d = (s || '').slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d.replace(/-/g, '.') : ''
}

export default function StampMessageEditor({ invitationId }: { invitationId: string }) {
  const { invitation } = useEditorStore()
  const [value, setValue] = useState('')
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [justSaved, setJustSaved] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetch(`/api/post-drawer/stamp?invitationId=${invitationId}`)
        if (!alive) return
        if (res.ok) {
          const d = (await res.json()) as { stampMessage?: string | null }
          setValue(d.stampMessage || '')
          setSavedMsg(d.stampMessage ?? null)
        }
      } catch {
        /* noop */
      } finally {
        if (alive) setLoaded(true)
      }
    })()
    return () => {
      alive = false
    }
  }, [invitationId])

  const over = value.length > STAMP_MESSAGE_MAX
  const dirty = loaded && value.trim() !== (savedMsg || '')

  const save = async () => {
    if (saving || over) return
    setSaving(true)
    setError('')
    setJustSaved(false)
    try {
      const res = await fetch('/api/post-drawer/stamp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, stampMessage: value }),
      })
      const d = (await res.json()) as { stampMessage?: string | null; error?: string }
      if (!res.ok) {
        setError(d.error || '저장에 실패했습니다.')
        return
      }
      setSavedMsg(d.stampMessage ?? null)
      setValue(d.stampMessage || '')
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2000)
    } catch {
      setError('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const photo = invitation?.meta?.kakaoThumbnail?.trim() || ''
  const wdate = invitation?.wedding?.date || ''

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <p className="text-sm text-gray-600 mb-4">
        예식이 끝나도 남는 한 문장을 적어보세요. 이 문장은 두 사람의 우표에 실려 <span className="font-medium text-gray-800">POST DRAWER</span>에 쌓입니다. 비워두어도 우표는 만들어집니다.
      </p>

      <div className="flex flex-col sm:flex-row gap-5">
        {/* 입력 */}
        <div className="flex-1 min-w-0">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={4}
            placeholder={STAMP_MESSAGE_PLACEHOLDER}
            className="w-full resize-none rounded-lg border border-gray-300 px-3.5 py-3 text-sm leading-relaxed focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">언제든 다시 고칠 수 있어요.</span>
            <span className={`text-xs tabular-nums ${over ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
              {value.length} / {STAMP_MESSAGE_MAX}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <Button size="sm" onClick={save} disabled={!dirty || over || saving} className="bg-gray-900 hover:bg-gray-800 text-white">
              {saving ? '저장 중…' : '한 조각 저장'}
            </Button>
            {justSaved && <span className="text-xs text-green-600">저장되었습니다</span>}
            {over && <span className="text-xs text-red-500">{STAMP_MESSAGE_MAX}자 이하로 줄여주세요</span>}
            {error && <span className="text-xs text-red-500">{error}</span>}
          </div>
        </div>

        {/* 미리보기 (공개 우표: 사진 · 날짜 · 한 조각. 이름은 미노출) */}
        <div className="shrink-0">
          <p className="text-[11px] font-semibold text-gray-500 mb-2">공개 우표 미리보기</p>
          <div style={{ width: 168 }}>
            <div style={{ background: '#fff', padding: 6, borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,.12)' }}>
              <div
                style={{
                  position: 'relative',
                  aspectRatio: '4 / 5',
                  borderRadius: 3,
                  overflow: 'hidden',
                  background: '#f1f1f3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 10, color: '#b0b0b8', textAlign: 'center', lineHeight: 1.5 }}>
                    사진 없이
                    <br />
                    남은 기록
                  </span>
                )}
                {fmtDate(wdate) && (
                  <span
                    style={{
                      position: 'absolute',
                      left: 6,
                      bottom: 6,
                      fontSize: 9,
                      fontWeight: 600,
                      color: '#fff',
                      background: 'rgba(0,0,0,.42)',
                      padding: '2px 6px',
                      borderRadius: 5,
                    }}
                  >
                    {fmtDate(wdate)}
                  </span>
                )}
              </div>
            </div>
            {value.trim() && (
              <p style={{ marginTop: 8, fontSize: 12, color: '#555', lineHeight: 1.5, wordBreak: 'keep-all' }}>{value.trim()}</p>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-2" style={{ maxWidth: 168 }}>
            사진은 카카오톡 공유 썸네일을 그대로 사용합니다.
          </p>
        </div>
      </div>
    </div>
  )
}
