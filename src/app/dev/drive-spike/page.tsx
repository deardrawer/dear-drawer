'use client'

import { useState } from 'react'

/**
 * [Phase 2 SPIKE 전용 / dev] 브라우저 → Google Drive resumable session URI 직결 업로드 검증.
 * 오너 로그인 상태에서 /dev/drive-spike 접속 → invitationId 입력 → 파일 선택 → 업로드.
 * 목적: CORS / 헤더 / 진행률 / 응답 상태 확인. 본구현 전 검증용이며 배포본 노출 불필요.
 */
export default function DriveSpikePage() {
  const [invitationId, setInvitationId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [log, setLog] = useState<string[]>([])
  const [progress, setProgress] = useState(0)
  const [busy, setBusy] = useState(false)

  const append = (m: string) => setLog((prev) => [...prev, `${new Date().toISOString().slice(11, 19)}  ${m}`])

  const run = async () => {
    if (!invitationId || !file) return
    setLog([]); setProgress(0); setBusy(true)
    try {
      append(`① 세션 발급 요청 (file=${file.name}, type=${file.type || '(빈 MIME)'}, size=${file.size})`)
      const sres = await fetch('/api/cloud/google/spike', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, fileName: file.name, mimeType: file.type || 'application/octet-stream' }),
      })
      const sdata = (await sres.json()) as { sessionUri?: string; error?: string }
      if (!sres.ok || !sdata.sessionUri) {
        append(`❌ 세션 발급 실패: ${sres.status} ${sdata.error || ''}`)
        setBusy(false); return
      }
      append(`✅ session URI 발급됨: ${sdata.sessionUri.slice(0, 80)}…`)

      append('② 브라우저 → Google 직결 PUT 시작 (Authorization 헤더 없음)')
      await new Promise<void>((resolve) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', sdata.sessionUri!, true)
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
        xhr.setRequestHeader('Content-Range', `bytes 0-${file.size - 1}/${file.size}`)
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100)) }
        xhr.onload = () => {
          append(`↩︎ 응답 status=${xhr.status}`)
          if (xhr.status === 200 || xhr.status === 201) append('🎉 업로드 성공! (CORS 통과, 직결 업로드 가능)')
          else if (xhr.status === 308) append('⏸ 308 Resume Incomplete (청크 업로드 필요 — 프로토콜 정상)')
          else append(`⚠️ 예상외 status=${xhr.status}, body=${xhr.responseText?.slice(0, 200)}`)
          resolve()
        }
        xhr.onerror = () => {
          append('❌ 네트워크/CORS 오류 (status=0). → 브라우저 콘솔의 CORS 메시지를 확인하세요.')
          resolve()
        }
        xhr.send(file)
      })
    } catch (e) {
      append(`❌ 예외: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: '40px auto', padding: 20, fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 18, fontWeight: 600 }}>Drive Resumable 직결 업로드 SPIKE</h1>
      <p style={{ fontSize: 13, color: '#666', marginTop: 4 }}>오너 로그인 + 해당 청첩장 Drive 연결이 되어 있어야 합니다.</p>

      <label style={{ display: 'block', marginTop: 16, fontSize: 13 }}>invitationId</label>
      <input value={invitationId} onChange={(e) => setInvitationId(e.target.value)} placeholder="청첩장 id"
        style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 6, marginTop: 4 }} />

      <input type="file" accept="image/*,video/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        style={{ display: 'block', marginTop: 12 }} />

      <button onClick={run} disabled={busy || !invitationId || !file}
        style={{ marginTop: 12, padding: '10px 16px', background: '#111', color: '#fff', borderRadius: 6, border: 'none', cursor: 'pointer', opacity: busy ? 0.5 : 1 }}>
        {busy ? '진행 중…' : '세션 발급 + 직결 업로드'}
      </button>

      {progress > 0 && <div style={{ marginTop: 12, height: 8, background: '#eee', borderRadius: 4 }}><div style={{ width: `${progress}%`, height: '100%', background: '#4ade80', borderRadius: 4 }} /></div>}

      <pre style={{ marginTop: 16, background: '#f6f6f6', padding: 12, borderRadius: 6, fontSize: 12, whiteSpace: 'pre-wrap', minHeight: 80 }}>{log.join('\n') || '결과 로그가 여기에 표시됩니다.'}</pre>
    </div>
  )
}
