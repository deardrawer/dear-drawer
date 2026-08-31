'use client'

import '../postdrawer.css'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Inv {
  id: string
  groom_name: string
  bride_name: string
  wedding_date: string
  content?: string
  is_paid?: number | boolean
}

function fmtDate(s: string | null | undefined): string {
  if (!s) return ''
  const d = s.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d.replace(/-/g, '.') : d
}
function coupleName(inv: Inv): string {
  return [inv.groom_name, inv.bride_name].filter(Boolean).join(' · ') || '우리'
}
function kakaoThumb(content?: string): string | null {
  if (!content) return null
  try {
    const c = JSON.parse(content) as { meta?: { kakaoThumbnail?: unknown } }
    const t = c?.meta?.kakaoThumbnail
    return typeof t === 'string' && t.trim() ? t : null
  } catch {
    return null
  }
}

export default function MineClient() {
  const router = useRouter()
  const [state, setState] = useState<'loading' | 'auth' | 'empty' | 'choose' | 'error'>('loading')
  const [invs, setInvs] = useState<Inv[]>([])
  const [openingId, setOpeningId] = useState<string | null>(null)

  const open = async (inv: Inv) => {
    if (openingId) return
    setOpeningId(inv.id)
    try {
      const res = await fetch('/api/post-drawer/ensure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId: inv.id }),
      })
      const data = (await res.json()) as { archiveSlug?: string; error?: string }
      if (res.ok && data.archiveSlug) {
        router.replace(`/post-drawer/${data.archiveSlug}`)
      } else {
        alert(data.error || '서랍을 열 수 없습니다.')
        setOpeningId(null)
      }
    } catch {
      alert('서랍을 열 수 없습니다.')
      setOpeningId(null)
    }
  }

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetch('/api/invitations')
        if (!alive) return
        if (res.status === 401) return setState('auth')
        if (!res.ok) return setState('error')
        const data = (await res.json()) as { invitations?: Inv[] }
        const list = (data.invitations || []).filter((inv) => !!inv.is_paid) // 결제완료 청첩장만 내 서랍 활성
        if (list.length === 0) return setState('empty')
        if (list.length === 1) {
          open(list[0]) // 한 개면 바로 이동
          return
        }
        setInvs(list)
        setState('choose')
      } catch {
        if (alive) setState('error')
      }
    })()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="pd">
      <nav className="nav">
        <Link href="/post-drawer" className="back" aria-label="POST DRAWER로">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          POST DRAWER
        </Link>
        <span aria-hidden style={{ width: 20 }} />
      </nav>

      {state === 'choose' ? (
        <div className="drawer">
          <header className="dhead">
            <h1>어떤 서랍을 열까요?</h1>
            <p className="sub">청첩장마다 방명록 · 하객 사진 · 받은 메시지가 담긴 서랍이 있습니다.</p>
          </header>
          <div className="minelist">
            {invs.map((inv) => {
              const thumb = kakaoThumb(inv.content)
              return (
                <button
                  key={inv.id}
                  type="button"
                  className="minerow"
                  onClick={() => open(inv)}
                  disabled={openingId === inv.id}
                >
                  <span className={`mthumb${thumb ? '' : ' noimg'}`}>
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt="" />
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    )}
                  </span>
                  <span className="minemeta">
                    <span className="nm">{coupleName(inv)}의 서랍</span>
                    <span className="dt">{inv.wedding_date ? fmtDate(inv.wedding_date) : '날짜 미정'}</span>
                  </span>
                  <span className="mchev" aria-hidden>
                    {openingId === inv.id ? (
                      '…'
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 6l6 6-6 6" />
                      </svg>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="dstate">
          {state === 'loading' ? (
            <p>서랍을 여는 중…</p>
          ) : state === 'auth' ? (
            <>
              <h1>로그인이 필요합니다</h1>
              <p>로그인하면 두 사람의 서랍을 열 수 있습니다.</p>
              <Link href="/login" className="btn btn-m btn-solid">로그인</Link>
            </>
          ) : state === 'empty' ? (
            <>
              <h1>아직 서랍이 없습니다</h1>
              <p>청첩장을 만들면 방명록과 하객 사진을 담는 서랍이 생깁니다.</p>
              <Link href="/templates" className="btn btn-m btn-solid">청첩장 만들기</Link>
            </>
          ) : (
            <>
              <h1>불러오지 못했습니다</h1>
              <p>잠시 후 다시 시도해주세요.</p>
              <Link href="/post-drawer" className="btn btn-m btn-assist">POST DRAWER</Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}
