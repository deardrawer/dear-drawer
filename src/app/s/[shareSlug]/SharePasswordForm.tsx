'use client'

import { useState } from 'react'

export default function SharePasswordForm({ shareSlug, coupleName }: { shareSlug: string; coupleName: string }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading || !pw) return
    setLoading(true)
    setErr('')
    try {
      const res = await fetch(`/api/s/${shareSlug}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      })
      if (res.ok) {
        window.location.reload()
        return
      }
      const d = (await res.json()) as { error?: string }
      setErr(d.error || '비밀번호가 올바르지 않습니다.')
    } catch {
      setErr('오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f5f1', padding: '0 24px' }}>
      <form onSubmit={submit} style={{ width: '100%', maxWidth: 320, textAlign: 'center' }}>
        <p style={{ fontSize: 34, margin: '0 0 14px' }}>💌</p>
        <h1 style={{ fontSize: 17, fontWeight: 600, color: '#3a352c', margin: '0 0 6px' }}>
          {coupleName || '두 사람'}의 청첩장
        </h1>
        <p style={{ fontSize: 13, color: '#8b8271', margin: '0 0 22px', lineHeight: 1.7 }}>
          비밀번호를 입력하면 청첩장을 볼 수 있어요.
        </p>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="비밀번호"
          autoComplete="off"
          style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', fontSize: 15, border: '1px solid #e4dfd6', borderRadius: 10, outline: 'none', background: '#fff' }}
        />
        {err && <p style={{ fontSize: 12.5, color: '#c0392b', margin: '10px 0 0' }}>{err}</p>}
        <button
          type="submit"
          disabled={loading || !pw}
          style={{ width: '100%', marginTop: 14, padding: '12px 0', fontSize: 15, fontWeight: 600, color: '#fff', background: loading || !pw ? '#c9c1b3' : '#3a352c', border: 0, borderRadius: 10, cursor: loading || !pw ? 'default' : 'pointer' }}
        >
          {loading ? '확인 중…' : '청첩장 보기'}
        </button>
      </form>
    </main>
  )
}
