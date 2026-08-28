'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { validateFile, validateBatch, GUEST_SHARE_LIMITS, type FileKind } from '@/lib/guestShareLimits'
import { putFileToR2 } from '@/lib/guestUploadClient'

interface Props {
  slug: string
  coupleName: string
  title: string
  description: string
}

type ItemStatus = 'ready' | 'uploading' | 'done' | 'error'
interface Item {
  key: string
  file: File
  url: string
  kind: FileKind
  status: ItemStatus
  progress: number
  error?: string
}

type Phase = 'select' | 'uploading' | 'done' | 'partial'

function fmtSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))}MB`
  return `${Math.max(1, Math.round(bytes / 1024))}KB`
}

export default function GuestShareClient({ slug, coupleName, title, description }: Props) {
  const [guestName, setGuestName] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const [phase, setPhase] = useState<Phase>('select')
  const [globalError, setGlobalError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // 최신 items를 effect/핸들러에서 참조하기 위한 ref (렌더 중이 아닌 effect에서 동기화)
  const itemsRef = useRef<Item[]>([])
  useEffect(() => {
    itemsRef.current = items
  }, [items])
  // 언마운트 시 object URL 정리
  useEffect(() => {
    return () => {
      itemsRef.current.forEach((i) => URL.revokeObjectURL(i.url))
    }
  }, [])

  const patch = useCallback((key: string, p: Partial<Item>) => {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...p } : it)))
  }, [])

  const onPick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalError('')
    const picked = Array.from(e.target.files ?? [])
    e.target.value = '' // Array.from 이후 초기화 (FileList는 live 객체)
    if (!picked.length) return

    setItems((prev) => {
      const room = GUEST_SHARE_LIMITS.maxFiles - prev.length
      if (room <= 0) {
        setGlobalError(`한 번에 최대 ${GUEST_SHARE_LIMITS.maxFiles}장까지 보낼 수 있어요.`)
        return prev
      }
      const next: Item[] = []
      for (const file of picked) {
        if (next.length >= room) {
          setGlobalError(`한 번에 최대 ${GUEST_SHARE_LIMITS.maxFiles}장까지 보낼 수 있어요.`)
          break
        }
        const v = validateFile({ name: file.name, mimeType: file.type, size: file.size })
        if (!v.ok) {
          setGlobalError(`${file.name}: ${v.error}`)
          continue
        }
        next.push({
          key: crypto.randomUUID(),
          file,
          url: URL.createObjectURL(file),
          kind: v.kind ?? 'image',
          status: 'ready',
          progress: 0,
        })
      }
      return [...prev, ...next]
    })
  }, [])

  const removeItem = useCallback((key: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.key === key)
      if (target) URL.revokeObjectURL(target.url)
      return prev.filter((i) => i.key !== key)
    })
  }, [])

  const startUpload = useCallback(async () => {
    setGlobalError('')
    const name = guestName.trim()
    if (!name) {
      setGlobalError('보내는 분 이름을 입력해주세요.')
      return
    }
    // 아직 완료되지 않은(신규 + 실패) 파일만 대상
    const targets = itemsRef.current.filter((i) => i.status !== 'done')
    if (!targets.length) {
      setGlobalError('보낼 사진을 선택해주세요.')
      return
    }
    const metas = targets.map((i) => ({ name: i.file.name, size: i.file.size, mimeType: i.file.type }))
    const batch = validateBatch(metas)
    if (!batch.ok) {
      setGlobalError(batch.error ?? '')
      return
    }

    setPhase('uploading')
    targets.forEach((t) => patch(t.key, { status: 'uploading', progress: 0, error: undefined }))

    // 1) 세션 + presigned URL 발급
    let sessionData: { sessionId: string; files: { fileId: string; uploadUrl: string; contentType: string }[] }
    try {
      const res = await fetch('/api/guest-share/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, guestName: name, files: metas }),
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        setGlobalError(err.error || '업로드 준비에 실패했어요. 잠시 후 다시 시도해주세요.')
        targets.forEach((t) => patch(t.key, { status: 'error' }))
        setPhase('partial')
        return
      }
      sessionData = await res.json()
    } catch {
      setGlobalError('네트워크 오류로 업로드를 시작하지 못했어요.')
      targets.forEach((t) => patch(t.key, { status: 'error' }))
      setPhase('partial')
      return
    }

    // 2) 파일별 R2 직접 업로드 (순차 — 모바일 안정성) + 서버 검증
    let success = 0
    let failed = 0
    for (let idx = 0; idx < targets.length; idx++) {
      const item = targets[idx]
      const meta = sessionData.files[idx]
      if (!meta) {
        patch(item.key, { status: 'error', error: '업로드 정보 없음' })
        failed++
        continue
      }
      const put = await putFileToR2(meta.uploadUrl, item.file, meta.contentType, (pct) =>
        patch(item.key, { progress: pct }),
      )
      if (!put.ok) {
        patch(item.key, { status: 'error', progress: 0, error: `업로드 실패 (${put.status})` })
        failed++
        continue
      }
      // 서버가 R2 HEAD로 검증 + Drive 이전 enqueue. R2 저장 확인 = 성공 기준.
      try {
        const comp = await fetch('/api/guest-share/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId: meta.fileId }),
        })
        if (!comp.ok) {
          patch(item.key, { status: 'error', error: '저장 확인 실패' })
          failed++
          continue
        }
      } catch {
        patch(item.key, { status: 'error', error: '저장 확인 실패' })
        failed++
        continue
      }
      patch(item.key, { status: 'done', progress: 100 })
      success++
    }

    setPhase(failed === 0 ? 'done' : 'partial')
    if (failed > 0) {
      setGlobalError(`${success}장 전송 완료, ${failed}장 실패했어요. 실패한 사진을 다시 보낼 수 있어요.`)
    }
  }, [guestName, slug, patch])

  const resetForMore = useCallback(() => {
    itemsRef.current.forEach((i) => URL.revokeObjectURL(i.url))
    setItems([])
    setGlobalError('')
    setPhase('select')
  }, [])

  const totalBytes = items.reduce((s, i) => s + i.file.size, 0)
  const doneCount = items.filter((i) => i.status === 'done').length
  const uploading = phase === 'uploading'

  // ── 완료 화면 ──
  if (phase === 'done') {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center bg-neutral-50 px-6 text-center">
        <div className="max-w-sm">
          <p className="text-5xl mb-5">🤍</p>
          <h1 className="text-xl font-semibold text-neutral-800 mb-2">사진을 잘 받았어요</h1>
          <p className="text-sm text-neutral-500 leading-relaxed mb-8">
            {doneCount}장을 보내주셨어요.<br />
            소중한 순간 함께 나눠주셔서 감사합니다.
          </p>
          <button
            onClick={resetForMore}
            className="w-full rounded-xl bg-neutral-900 text-white py-3.5 text-sm font-medium active:scale-[0.99] transition"
          >
            사진 더 보내기
          </button>
        </div>
      </main>
    )
  }

  // ── 선택/업로드 화면 ──
  return (
    <main className="min-h-[100dvh] bg-neutral-50">
      <div className="mx-auto max-w-md px-5 pb-32 pt-10">
        <header className="text-center mb-7">
          <p className="text-xs tracking-widest text-neutral-400 mb-2">{coupleName}</p>
          <h1 className="text-xl font-semibold text-neutral-800 mb-2">{title}</h1>
          <p className="text-sm text-neutral-500 leading-relaxed whitespace-pre-line">{description}</p>
        </header>

        {/* 이름 */}
        <label className="block mb-5">
          <span className="mb-1.5 block text-xs font-medium text-neutral-600">보내는 분</span>
          <input
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            disabled={uploading}
            maxLength={40}
            placeholder="이름을 입력해주세요"
            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 outline-none focus:border-neutral-400 disabled:opacity-60"
          />
        </label>

        {/* 파일 선택 */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={onPick}
          disabled={uploading}
          className="hidden"
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="mb-4 flex w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-neutral-300 bg-white py-8 text-neutral-500 active:bg-neutral-100 disabled:opacity-60"
        >
          <span className="text-2xl">＋</span>
          <span className="text-sm font-medium">사진 · 영상 선택</span>
          <span className="text-xs text-neutral-400">
            사진 최대 {Math.round(GUEST_SHARE_LIMITS.imageMaxBytes / (1024 * 1024))}MB · 영상 최대{' '}
            {Math.round(GUEST_SHARE_LIMITS.videoMaxBytes / (1024 * 1024))}MB · {GUEST_SHARE_LIMITS.maxFiles}장까지
          </span>
        </button>

        {globalError && (
          <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{globalError}</p>
        )}

        {/* 미리보기 그리드 */}
        {items.length > 0 && (
          <>
            <div className="mb-2 flex items-center justify-between text-xs text-neutral-400">
              <span>
                {items.length}장 · {fmtSize(totalBytes)}
              </span>
              {uploading && <span>{doneCount}/{items.length} 완료</span>}
            </div>
            <ul className="grid grid-cols-3 gap-2">
              {items.map((it) => (
                <li key={it.key} className="relative aspect-square overflow-hidden rounded-xl bg-neutral-200">
                  {it.kind === 'video' ? (
                    <video src={it.url} muted playsInline className="h-full w-full object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.url} alt="" className="h-full w-full object-cover" />
                  )}

                  {it.kind === 'video' && (
                    <span className="absolute left-1.5 top-1.5 rounded bg-black/50 px-1 text-[10px] text-white">▶</span>
                  )}

                  {/* 상태 오버레이 */}
                  {it.status === 'uploading' && (
                    <div className="absolute inset-0 flex items-end bg-black/30">
                      <div className="h-1 w-full bg-white/40">
                        <div className="h-full bg-white transition-all" style={{ width: `${it.progress}%` }} />
                      </div>
                    </div>
                  )}
                  {it.status === 'done' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/25 text-lg text-white">✓</div>
                  )}
                  {it.status === 'error' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-rose-500/40 text-[10px] font-medium text-white">
                      실패
                    </div>
                  )}

                  {/* 삭제 (업로드 중 아닐 때) */}
                  {!uploading && (
                    <button
                      onClick={() => removeItem(it.key)}
                      aria-label="삭제"
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/55 text-xs text-white"
                    >
                      ×
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* 하단 고정 전송 버튼 */}
      <div className="fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white/95 px-5 py-3.5 backdrop-blur">
        <div className="mx-auto max-w-md">
          <button
            onClick={startUpload}
            disabled={uploading || items.length === 0 || !guestName.trim()}
            className="w-full rounded-xl bg-neutral-900 py-3.5 text-sm font-medium text-white transition active:scale-[0.99] disabled:opacity-40"
          >
            {uploading
              ? `보내는 중… ${doneCount}/${items.length}`
              : phase === 'partial'
                ? '실패한 사진 다시 보내기'
                : '사진 보내기'}
          </button>
        </div>
      </div>
    </main>
  )
}
