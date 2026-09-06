'use client'

import '../postdrawer.css'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'

// API 응답 형태(서버 lib를 import하지 않고 로컬 타입으로 — 클라이언트 번들 안전)
interface Stamp {
  photo: string | null
  name: string
  weddingDate: string | null
  message: string | null
}
interface DrawerMessage {
  id: string
  guestName: string
  message: string
  source: string | null
  isPublic: boolean
  createdAt: string
  images: number
  videos: number
  photoUrl?: string | null
  group?: string | null
}
interface MomentBundle {
  key: string
  guestName: string | null
  message: string | null
  createdAt: string
  images: number
  videos: number
}
interface CapsuleStamp {
  key: string // 'wedding' | 'd100' | 'y1' | 'y2' | 'y3'
  label: string
  dateIso: string | null
  dday: number
  unlocked: boolean
  recorded: boolean
  photo: string | null
  message: string | null
}
interface DrawerData {
  archiveSlug: string
  invitation: { id: string; slug: string | null; templateId: string }
  share: { enabled: boolean; shareSlug: string | null }
  stamp: Stamp
  daysMarried: number | null
  capsules: CapsuleStamp[]
  messages: DrawerMessage[]
  moments: MomentBundle[]
  summary: { totalMessages: number; publicMessages: number; privateMessages: number; totalImages: number; totalVideos: number }
}

/** 선택 이미지를 webp Blob으로 변환(최대 변 1200px). */
async function fileToWebp(file: File, maxDim = 1200): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas 미지원')
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()
  return await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('변환 실패'))), 'image/webp', 0.9))
}

// 미디어(Drive 표시용 URL) — on-demand 로드
interface MediaItem {
  id: string
  kind: 'image' | 'video'
  thumb: string | null
  full: string | null
  view: string | null
  name: string | null
  error: boolean
}
interface MediaState {
  items: MediaItem[]
  total: number
  loading: boolean
  error: string | null // 'drive_disconnected' | 기타 메시지
  reconnectUrl: string | null
  loaded: boolean
  open: boolean
}
const EMPTY_MEDIA: MediaState = { items: [], total: 0, loading: false, error: null, reconnectUrl: null, loaded: false, open: false }
const PAGE = 24

function fmtDate(s: string | null): string {
  if (!s) return ''
  const d = s.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d.replace(/-/g, '.') : d
}
function fmtDateTime(s: string): string {
  const d = s.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d.replace(/-/g, '.') : s
}
function countLabel(images: number, videos: number): string {
  const parts: string[] = []
  if (images > 0) parts.push(`사진 ${images}장`)
  if (videos > 0) parts.push(`영상 ${videos}개`)
  return parts.length ? parts.join(' · ') : '파일 없음'
}
const PARENTS = new Set(['narrative-parents', 'parents', 'parents-formal'])
function invPath(inv: { id: string; slug: string | null; templateId: string }): string {
  const base = PARENTS.has(inv.templateId) ? '/invite' : '/i'
  return `${base}/${inv.slug || inv.id}`
}

export default function ArchiveClient({ archiveSlug }: { archiveSlug: string }) {
  const [state, setState] = useState<'loading' | 'ok' | 'pending' | 'forbidden' | 'notfound' | 'error'>('loading')
  const [data, setData] = useState<DrawerData | null>(null)
  const [pendingDate, setPendingDate] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [msgFilter, setMsgFilter] = useState<'all' | 'guestbook' | 'rsvp' | 'geunnal'>('all')
  const [msgSort, setMsgSort] = useState<'recent' | 'name'>('recent')

  // 함께 남겨준 순간 — 보기 모드 + 미디어 상태
  const [momentsView, setMomentsView] = useState<'people' | 'all'>('people')
  const [bundleMedia, setBundleMedia] = useState<Record<string, MediaState>>({})
  const [allMedia, setAllMedia] = useState<MediaState>(EMPTY_MEDIA)
  const [lightbox, setLightbox] = useState<{ items: MediaItem[]; index: number } | null>(null)

  // 타임머신 우표 — 기록 모달
  const [capsuleKey, setCapsuleKey] = useState<string | null>(null)
  const [capsuleMode, setCapsuleMode] = useState<'view' | 'edit'>('edit')
  const [capsuleMsg, setCapsuleMsg] = useState('')
  const [capsuleUploading, setCapsuleUploading] = useState(false)
  const [capsuleSaving, setCapsuleSaving] = useState(false)
  const [capsuleErr, setCapsuleErr] = useState('')
  const [capsuleAdding, setCapsuleAdding] = useState(false)
  const capsuleFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetch(`/api/post-drawer/${archiveSlug}`)
        if (!alive) return
        if (res.status === 403) return setState('forbidden')
        if (res.status === 404) return setState('notfound')
        if (!res.ok) return setState('error')
        const json = (await res.json()) as { data?: DrawerData; pending?: boolean; weddingDate?: string | null }
        if (json.pending) {
          setPendingDate(json.weddingDate ?? null)
          return setState('pending')
        }
        if (!json.data) return setState('error')
        setData(json.data)
        setState('ok')
      } catch {
        if (alive) setState('error')
      }
    })()
    return () => {
      alive = false
    }
  }, [archiveSlug])

  // Drive 표시용 URL 발급 요청
  const fetchMedia = useCallback(
    async (scope: 'bundle' | 'all', key: string | null, offset: number) => {
      const qs = new URLSearchParams({ scope, offset: String(offset), limit: String(PAGE) })
      if (scope === 'bundle' && key) qs.set('key', key)
      const res = await fetch(`/api/post-drawer/${archiveSlug}/media?${qs.toString()}`)
      return (await res.json()) as {
        items?: MediaItem[]
        total?: number
        nextOffset?: number | null
        error?: string
        reconnectUrl?: string
        pending?: boolean
      }
    },
    [archiveSlug],
  )

  // 사람별 묶음 로드( fresh=true → 재발급/처음, false → 더 불러오기 )
  const loadBundle = useCallback(
    async (key: string, fresh: boolean) => {
      setBundleMedia((s) => {
        const cur = s[key] || EMPTY_MEDIA
        return { ...s, [key]: { ...cur, open: true, loading: true, error: null } }
      })
      const cur = bundleMedia[key] || EMPTY_MEDIA
      const offset = fresh ? 0 : cur.items.length
      try {
        const json = await fetchMedia('bundle', key, offset)
        setBundleMedia((s) => {
          const prev = s[key] || EMPTY_MEDIA
          if (json.error) {
            return { ...s, [key]: { ...prev, loading: false, error: json.error, reconnectUrl: json.reconnectUrl ?? null, loaded: true } }
          }
          const items = fresh ? json.items || [] : [...prev.items, ...(json.items || [])]
          return { ...s, [key]: { items, total: json.total ?? items.length, loading: false, error: null, reconnectUrl: null, loaded: true, open: true } }
        })
      } catch {
        setBundleMedia((s) => ({ ...s, [key]: { ...(s[key] || EMPTY_MEDIA), loading: false, error: '불러오지 못했습니다.', loaded: true } }))
      }
    },
    [bundleMedia, fetchMedia],
  )

  // 전체보기 로드
  const loadAll = useCallback(
    async (fresh: boolean) => {
      setAllMedia((s) => ({ ...s, open: true, loading: true, error: null }))
      const offset = fresh ? 0 : allMedia.items.length
      try {
        const json = await fetchMedia('all', null, offset)
        setAllMedia((s) => {
          if (json.error) return { ...s, loading: false, error: json.error, reconnectUrl: json.reconnectUrl ?? null, loaded: true }
          const items = fresh ? json.items || [] : [...s.items, ...(json.items || [])]
          return { items, total: json.total ?? items.length, loading: false, error: null, reconnectUrl: null, loaded: true, open: true }
        })
      } catch {
        setAllMedia((s) => ({ ...s, loading: false, error: '불러오지 못했습니다.', loaded: true }))
      }
    },
    [allMedia.items.length, fetchMedia],
  )

  // 전체보기 탭으로 전환(최초 진입 시 첫 페이지 로드)
  const showAll = useCallback(() => {
    setMomentsView('all')
    if (!allMedia.loaded && !allMedia.loading) loadAll(true)
  }, [allMedia.loaded, allMedia.loading, loadAll])

  // ── 우표 기록/편집 (결혼식 + 타임머신 통합) ──
  // 결혼식 우표는 설정 엔드포인트(공개 반영), 마일스톤은 캡슐 엔드포인트로 저장. 저장 후 서랍 재조회.
  const refreshDrawer = useCallback(async () => {
    try {
      const res = await fetch(`/api/post-drawer/${archiveSlug}`)
      if (res.ok) {
        const j = (await res.json()) as { data?: DrawerData }
        if (j.data) setData(j.data)
      }
    } catch {
      /* noop */
    }
  }, [archiveSlug])

  const addCapsuleYear = async () => {
    if (capsuleAdding) return
    setCapsuleAdding(true)
    try {
      const res = await fetch(`/api/post-drawer/${archiveSlug}/capsule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addYear: true }),
      })
      const d = (await res.json()) as { capsules?: CapsuleStamp[] }
      if (res.ok && d.capsules) {
        const caps = d.capsules
        setData((prev) => (prev ? { ...prev, capsules: caps } : prev))
      }
    } catch {
      /* noop */
    } finally {
      setCapsuleAdding(false)
    }
  }

  const openCapsule = (c: CapsuleStamp) => {
    if (!c.unlocked) return // 잠긴 마일스톤은 열 수 없음(결혼식·열린 마일스톤만)
    setCapsuleKey(c.key)
    setCapsuleMode(c.recorded ? 'view' : 'edit') // 기록된 우표는 엽서로 보기, 빈 우표는 바로 편집
    setCapsuleMsg(c.message || '')
    setCapsuleErr('')
  }
  const closeCapsule = () => {
    if (!capsuleSaving && !capsuleUploading) setCapsuleKey(null)
  }
  // 결혼식이면 설정 라우트, 아니면 캡슐 라우트로 PATCH
  const patchStamp = async (key: string, body: Record<string, unknown>): Promise<boolean> => {
    const url = key === 'wedding' ? `/api/post-drawer/${archiveSlug}/settings` : `/api/post-drawer/${archiveSlug}/capsule`
    const payload = key === 'wedding' ? body : { milestone: key, ...body }
    const res = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const d = (await res.json().catch(() => ({}))) as { error?: string }
    if (!res.ok) {
      setCapsuleErr(d.error || '저장에 실패했어요.')
      return false
    }
    await refreshDrawer()
    return true
  }
  const onCapsulePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !capsuleKey || !data) return
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setCapsuleErr('JPG · PNG · WebP 이미지만 가능해요.')
      return
    }
    setCapsuleUploading(true)
    setCapsuleErr('')
    try {
      const blob = await fileToWebp(file)
      const fd = new FormData()
      fd.append('web', new File([blob], 'capsule.webp', { type: 'image/webp' }))
      fd.append('invitationId', data.invitation.id)
      fd.append('imageId', capsuleKey === 'wedding' ? 'drawer-stamp' : `capsule-${capsuleKey}`)
      const up = await fetch('/api/upload', { method: 'POST', body: fd })
      const ud = (await up.json()) as { webUrl?: string; error?: string }
      if (!up.ok || !ud.webUrl) {
        setCapsuleErr(ud.error || '업로드에 실패했어요.')
        return
      }
      const busted = `${ud.webUrl}${ud.webUrl.includes('?') ? '&' : '?'}t=${Date.now()}`
      await patchStamp(capsuleKey, capsuleKey === 'wedding' ? { stampPhoto: busted } : { photo: busted })
    } catch {
      setCapsuleErr('업로드에 실패했어요.')
    } finally {
      setCapsuleUploading(false)
    }
  }
  const removeCapsulePhoto = async () => {
    if (!capsuleKey) return
    setCapsuleUploading(true)
    await patchStamp(capsuleKey, capsuleKey === 'wedding' ? { removeStampPhoto: true } : { removePhoto: true })
    setCapsuleUploading(false)
  }
  const saveCapsuleMessage = async () => {
    if (!capsuleKey) return
    setCapsuleSaving(true)
    setCapsuleErr('')
    const ok = await patchStamp(capsuleKey, capsuleKey === 'wedding' ? { stampMessage: capsuleMsg } : { message: capsuleMsg })
    setCapsuleSaving(false)
    if (ok) setCapsuleMode('view') // 저장하면 엽서 보기로 전환
  }

  // 라이트박스 키보드
  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null)
      else if (e.key === 'ArrowRight') setLightbox((lb) => (lb ? { ...lb, index: Math.min(lb.items.length - 1, lb.index + 1) } : lb))
      else if (e.key === 'ArrowLeft') setLightbox((lb) => (lb ? { ...lb, index: Math.max(0, lb.index - 1) } : lb))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox])

  // 상태 화면
  if (state !== 'ok' || !data) {
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
        <div className="dstate">
          {state === 'loading' ? (
            <p>불러오는 중…</p>
          ) : state === 'pending' ? (
            <>
              <h1>아직 준비 중이에요</h1>
              <p>POST DRAWER는 예식 다음날부터 이용할 수 있어요.{pendingDate ? ` (${fmtDate(pendingDate)} 예식)` : ''}</p>
              <Link href="/post-drawer/mine" className="btn btn-m btn-assist">내 서랍</Link>
            </>
          ) : state === 'forbidden' ? (
            <>
              <h1>이 서랍은 두 사람만 볼 수 있습니다</h1>
              <p>로그인한 뒤 &lsquo;내 청첩장&rsquo;에서 열어주세요.</p>
              <Link href="/login" className="btn btn-m btn-solid">로그인</Link>
            </>
          ) : state === 'notfound' ? (
            <>
              <h1>서랍을 찾을 수 없습니다</h1>
              <p>주소가 올바른지 확인해주세요.</p>
              <Link href="/my-invitations" className="btn btn-m btn-assist">내 청첩장</Link>
            </>
          ) : (
            <>
              <h1>불러오지 못했습니다</h1>
              <p>잠시 후 다시 시도해주세요.</p>
              <Link href="/my-invitations" className="btn btn-m btn-assist">내 청첩장</Link>
            </>
          )}
        </div>
      </div>
    )
  }

  const { stamp, invitation, share: shareInfo, daysMarried, capsules, messages, moments, summary } = data
  const currentCapsule = capsuleKey ? capsules.find((c) => c.key === capsuleKey) || null : null
  // 추가(＋)는 마지막 우표가 채워졌을 때만, 최대 30년까지
  const yearCaps = capsules.filter((c) => /^y\d+$/.test(c.key))
  const canAddYear = yearCaps.length < 30 && (yearCaps.length === 0 || yearCaps[yearCaps.length - 1].recorded)
  // 받은 마음 소스 분류(photo_share는 여기 없음 — 함께 남겨준 순간으로 분리됨)
  const catOf = (m: DrawerMessage): 'guestbook' | 'rsvp' | 'geunnal' =>
    m.source === 'rsvp' ? 'rsvp' : m.source === 'geunnal' ? 'geunnal' : 'guestbook'
  const cGuestbook = messages.filter((m) => catOf(m) === 'guestbook').length
  const cRsvp = messages.filter((m) => catOf(m) === 'rsvp').length
  const cGeunnal = messages.filter((m) => catOf(m) === 'geunnal').length
  const sortMsgs = (arr: DrawerMessage[]) =>
    [...arr].sort((a, b) =>
      msgSort === 'name'
        ? (a.guestName || '').localeCompare(b.guestName || '', 'ko')
        : a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0,
    )
  const visible = msgFilter === 'all' ? messages : messages.filter((m) => catOf(m) === msgFilter)
  const cells = sortMsgs(visible)
  const geunnalGroups: Record<string, DrawerMessage[]> = {}
  if (msgFilter === 'geunnal') {
    for (const m of cells) {
      const g = m.group || '모임'
      ;(geunnalGroups[g] = geunnalGroups[g] || []).push(m)
    }
  }

  const invRel = invPath(invitation)
  const shareUrl = `https://invite.deardrawer.com${invRel}`
  const openUrl = shareInfo.shareSlug ? `/s/${shareInfo.shareSlug}` : `${invRel}?preview=true`

  const renderCell = (m: DrawerMessage) => (
    <div className="cell" key={m.id}>
      <div className="cellbody">
        <div className="nm">
          <span className="from">From.</span> {m.guestName || '익명'}
          {m.source === 'rsvp' && <span className="ptag">RSVP</span>}
          {m.source === 'geunnal' && msgFilter !== 'geunnal' && <span className="ptag">모임</span>}
        </div>
        {m.message && <div className="msg">{m.message}</div>}
        {m.photoUrl && (
          <button
            type="button"
            className="cellphoto-btn"
            onClick={() => setLightbox({ items: [{ id: m.id, kind: 'image', thumb: m.photoUrl!, full: m.photoUrl!, view: null, name: m.guestName, error: false }], index: 0 })}
            aria-label="사진 보기"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.photoUrl} alt="" className="cellphoto" />
          </button>
        )}
      </div>
      <div className="cellstamp" aria-hidden>
        <span className="pcstamp">♥</span>
        <span className="pcmark">{fmtDateTime(m.createdAt)}</span>
      </div>
    </div>
  )

  // 미디어 그리드(썸네일) — 클릭 시 라이트박스
  const renderMediaGrid = (items: MediaItem[]) => (
    <div className="mgrid">
      {items.map((it, i) => (
        <button
          type="button"
          key={it.id}
          className={`mcell${it.kind === 'video' ? ' vid' : ''}${it.error ? ' err' : ''}`}
          onClick={() => setLightbox({ items, index: i })}
          aria-label={it.kind === 'video' ? '영상 보기' : '사진 보기'}
        >
          {it.error || !it.thumb ? (
            <span className="mcell-ph">불러오기 실패</span>
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.thumb} alt="" loading="lazy" />
              {it.kind === 'video' && (
                <span className="playbadge" aria-hidden>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              )}
            </>
          )}
        </button>
      ))}
    </div>
  )

  // Drive 연결 끊김/에러 안내
  const renderMediaError = (st: MediaState, onRetry: () => void) => {
    if (st.error === 'drive_disconnected') {
      return (
        <div className="mdrive-err">
          <p>Google Drive 연결이 필요합니다.</p>
          <p className="setnote">사진 원본은 두 사람의 Google Drive에 있어요. 다시 연결하면 여기서 바로 볼 수 있습니다.</p>
          {st.reconnectUrl && (
            <a href={st.reconnectUrl} className="btn btn-s btn-solid">Google Drive 다시 연결</a>
          )}
        </div>
      )
    }
    return (
      <div className="mdrive-err">
        <p>{st.error}</p>
        <button type="button" className="btn btn-s btn-assist" onClick={onRetry}>다시 불러오기</button>
      </div>
    )
  }

  const share = async () => {
    const nav = navigator as Navigator & { share?: (d: { title?: string; url?: string }) => Promise<void> }
    if (nav.share) {
      try {
        await nav.share({ title: `${stamp.name || '우리'}의 청첩장`, url: shareUrl })
      } catch {
        /* 사용자 취소 */
      }
      return
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* noop */
    }
  }

  const hasMoments = moments.length > 0
  const lb = lightbox ? lightbox.items[lightbox.index] : null

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

      <div className="drawer">
        <header className="dhead">
          <h1>{stamp.name ? `${stamp.name}의 서랍` : '우리의 서랍'}</h1>
          {(stamp.weddingDate || (daysMarried != null && daysMarried >= 0)) && (
            <div className="dmeta">
              {stamp.weddingDate && <span className="dm-date">{fmtDate(stamp.weddingDate)} 결혼</span>}
              {daysMarried != null && daysMarried >= 0 && (
                <span className="dm-dday">결혼 <b>{daysMarried === 0 ? '오늘' : `${daysMarried}일째`}</b></span>
              )}
            </div>
          )}
          <p className="sub">받은 마음과 우리의 순간을 두 사람만 다시 꺼내봅니다.</p>
          <div className="acts">
            <a href={openUrl} target="_blank" rel="noopener noreferrer" className="btn btn-m btn-solid">
              내 청첩장 바로가기
            </a>
            <button type="button" className="btn btn-m btn-assist" onClick={share}>
              {copied ? '링크 복사됨!' : '공유하기'}
            </button>
            <Link href={`/post-drawer/${archiveSlug}/settings`} className="btn btn-m btn-assist">
              설정
            </Link>
          </div>
        </header>

        {/* 우리의 우표 — 결혼식 + 타임머신(100일/1년/2년/3년). 우표를 눌러 사진·한마디 남기기 */}
        <section className="sect">
          <h2>우리의 우표</h2>
          <p className="setdesc">
            결혼식부터 100일 · 1년 · 2년, 해마다 그날이 오면 그때의 마음을 사진 한 장과 함께 우표로 남겨요.
            <br />
            두 사람만의 서랍에 쌓입니다.
          </p>
          <div className="tmstrip">
            {capsules.map((c) => {
              const editable = c.unlocked // 결혼식 + 열린 마일스톤은 눌러서 편집
              return (
                <button
                  key={c.key}
                  type="button"
                  className={`tmcard${c.recorded ? ' done' : ''}${!c.unlocked ? ' locked' : ''}${editable ? ' editable' : ''}`}
                  onClick={() => openCapsule(c)}
                  disabled={!editable}
                  aria-label={`${c.label} 우표`}
                >
                  <div className="tmstamp">
                    {c.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.photo} alt="" />
                    ) : !c.unlocked ? (
                      <span className="tmlock" aria-hidden>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="5" y="11" width="14" height="10" rx="2" />
                          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                        </svg>
                      </span>
                    ) : (
                      <span className="tmadd" aria-hidden>＋</span>
                    )}
                  </div>
                  <div className="tmlabel">{c.label}</div>
                  <div className="tmstat">
                    {c.recorded ? '기록됨' : !c.unlocked ? `D-${c.dday}` : '기록하기'}
                  </div>
                </button>
              )
            })}
            {/* 해마다 우표 한 칸 추가 — 마지막 우표가 채워졌을 때만(최대 30년) */}
            {canAddYear && (
              <button type="button" className="tmcard tmadd-card editable" onClick={addCapsuleYear} disabled={capsuleAdding} aria-label="우표 추가">
                <div className="tmstamp tmadd-stamp"><span className="tmadd">＋</span></div>
                <div className="tmlabel">추가</div>
                <div className="tmstat">{capsuleAdding ? '추가 중…' : '해마다'}</div>
              </button>
            )}
          </div>
        </section>

        {/* 2. 받은 마음 — 청첩장 방명록 + RSVP + 모임(근날) */}
        <section className="sect">
          <h2>받은 마음 <span className="cnt2">{messages.length}</span></h2>
          {messages.length === 0 ? (
            <div className="empty-box">
              아직 받은 마음이 없습니다.
              <br />
              청첩장이 닫힌 뒤에도 이 자리는 그대로 둡니다.
            </div>
          ) : (
            <>
              <div className="msgbar">
                <div className="msgchips">
                  <button type="button" className={`chip${msgFilter === 'all' ? ' on' : ''}`} onClick={() => setMsgFilter('all')}>전체 {messages.length}</button>
                  {cGuestbook > 0 && <button type="button" className={`chip${msgFilter === 'guestbook' ? ' on' : ''}`} onClick={() => setMsgFilter('guestbook')}>방명록 {cGuestbook}</button>}
                  {cRsvp > 0 && <button type="button" className={`chip${msgFilter === 'rsvp' ? ' on' : ''}`} onClick={() => setMsgFilter('rsvp')}>RSVP {cRsvp}</button>}
                  {cGeunnal > 0 && <button type="button" className={`chip${msgFilter === 'geunnal' ? ' on' : ''}`} onClick={() => setMsgFilter('geunnal')}>모임 {cGeunnal}</button>}
                </div>
                <button type="button" className="sortbtn" onClick={() => setMsgSort((s) => (s === 'recent' ? 'name' : 'recent'))}>
                  {msgSort === 'recent' ? '최신순' : '이름순'}
                </button>
              </div>

              {cells.length === 0 ? (
                <p className="setnote">해당 조건의 메시지가 없습니다.</p>
              ) : msgFilter === 'geunnal' ? (
                Object.entries(geunnalGroups).map(([ev, items]) => (
                  <div key={ev} className="msggroup">
                    <div className="msggroup-h">{ev} <span className="cnt2">{items.length}</span></div>
                    <div className="gb">{items.map(renderCell)}</div>
                  </div>
                ))
              ) : (
                <div className="gb">{cells.map(renderCell)}</div>
              )}
            </>
          )}
        </section>

        {/* 3. 우리의 순간 — Guest Share: 사람별 / 전체보기 */}
        <section className="sect">
          <h2>우리의 순간</h2>
          {!hasMoments ? (
            <div className="empty-box">
              아직 우리의 순간이 없습니다.
              <br />
              하객이 함께 남겨준 사진 · 영상이 이곳에 모입니다.
            </div>
          ) : (
            <>
              <div className="moments-sum">
                사진 <b>{summary.totalImages}</b>장 · 영상 <b>{summary.totalVideos}</b>개
              </div>

              {/* 보기 모드 토글 */}
              <div className="mtoggle" role="tablist">
                <button type="button" role="tab" aria-selected={momentsView === 'people'} className={momentsView === 'people' ? 'on' : ''} onClick={() => setMomentsView('people')}>
                  하객별 보기
                </button>
                <button type="button" role="tab" aria-selected={momentsView === 'all'} className={momentsView === 'all' ? 'on' : ''} onClick={showAll}>
                  사진 전체보기
                </button>
              </div>

              {momentsView === 'people' ? (
                <div className="mbundles">
                  {moments.map((b) => {
                    const st = bundleMedia[b.key]
                    return (
                      <div className="mbundle" key={b.key}>
                        <div className="meta">
                          <div className="nm"><span className="from">From.</span> {b.guestName || '이름만 남긴 하객'}</div>
                          {b.message && <div className="msg">{b.message}</div>}
                          <div className="cnt">{countLabel(b.images, b.videos)}</div>
                        </div>

                        {!st || !st.open ? (
                          (b.images > 0 || b.videos > 0) && (
                            <button type="button" className="loadbtn" onClick={() => loadBundle(b.key, true)}>
                              사진 불러오기
                            </button>
                          )
                        ) : st.error ? (
                          renderMediaError(st, () => loadBundle(b.key, true))
                        ) : (
                          <>
                            {st.items.length > 0 && renderMediaGrid(st.items)}
                            {st.loading && <p className="setnote">불러오는 중…</p>}
                            {!st.loading && st.items.length === 0 && st.loaded && (
                              <p className="setnote">아직 Drive에 올라온 파일이 없습니다. (전송 중이거나 처리 대기 중)</p>
                            )}
                            <div className="mrow">
                              {!st.loading && st.items.length < st.total && (
                                <button type="button" className="btn btn-s btn-assist" onClick={() => loadBundle(b.key, false)}>
                                  더 불러오기 ({st.items.length}/{st.total})
                                </button>
                              )}
                              {!st.loading && st.items.length > 0 && (
                                <button type="button" className="mreload" onClick={() => loadBundle(b.key, true)} title="사진이 안 보이면 다시 불러오세요">
                                  다시 불러오기
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="mall">
                  {allMedia.error ? (
                    renderMediaError(allMedia, () => loadAll(true))
                  ) : (
                    <>
                      {allMedia.items.length > 0 && renderMediaGrid(allMedia.items)}
                      {allMedia.loading && <p className="setnote">불러오는 중…</p>}
                      {!allMedia.loading && allMedia.loaded && allMedia.items.length === 0 && (
                        <p className="setnote">아직 Drive에 올라온 파일이 없습니다. (전송 중이거나 처리 대기 중)</p>
                      )}
                      <div className="mrow">
                        {!allMedia.loading && allMedia.items.length < allMedia.total && (
                          <button type="button" className="btn btn-s btn-assist" onClick={() => loadAll(false)}>
                            더 불러오기 ({allMedia.items.length}/{allMedia.total})
                          </button>
                        )}
                        {!allMedia.loading && allMedia.items.length > 0 && (
                          <button type="button" className="mreload" onClick={() => loadAll(true)} title="사진이 안 보이면 다시 불러오세요">
                            다시 불러오기
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              <p className="moments-note">원본 사진 · 영상은 두 사람의 Google Drive에 안전하게 보관됩니다.</p>
            </>
          )}
        </section>

        <div className="dfoot">
          <p className="note">
            이 서랍은 두 사람만 볼 수 있습니다.
            <br />
            가족 · 친구 공유는 준비 중입니다.
          </p>
        </div>
      </div>

      {/* 라이트박스 */}
      {lb && lightbox && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setLightbox(null)}>
          <button type="button" className="lb-close" onClick={() => setLightbox(null)} aria-label="닫기">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
          {lightbox.index > 0 && (
            <button type="button" className="lb-nav prev" onClick={(e) => { e.stopPropagation(); setLightbox((l) => (l ? { ...l, index: l.index - 1 } : l)) }} aria-label="이전">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
          )}
          {lightbox.index < lightbox.items.length - 1 && (
            <button type="button" className="lb-nav next" onClick={(e) => { e.stopPropagation(); setLightbox((l) => (l ? { ...l, index: l.index + 1 } : l)) }} aria-label="다음">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
            </button>
          )}
          <div className="lb-stage" onClick={(e) => e.stopPropagation()}>
            {lb.kind === 'video' ? (
              <div className="lb-video">
                {lb.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={lb.full || lb.thumb} alt="" />
                ) : (
                  <div className="lb-ph">영상</div>
                )}
                {lb.view && (
                  <a href={lb.view} target="_blank" rel="noopener noreferrer" className="btn btn-m btn-solid lb-drivelink">
                    Drive에서 영상 보기
                  </a>
                )}
              </div>
            ) : lb.full || lb.thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="lb-img" src={lb.full || lb.thumb || ''} alt="" />
            ) : (
              <div className="lb-ph">불러오기 실패</div>
            )}
            <div className="lb-bar">
              {lb.name && <span className="lb-name">{lb.name}</span>}
              <span className="lb-count">{lightbox.index + 1} / {lightbox.items.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* 우표 — 엽서(보기) + 편집 */}
      {currentCapsule && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={closeCapsule}>
          <div className={`capmodal${capsuleMode === 'view' ? ' pcardview' : ''}`} onClick={(e) => e.stopPropagation()}>
            <button type="button" className="lb-close" onClick={closeCapsule} aria-label="닫기">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>

            {capsuleMode === 'view' ? (
              /* 엽서 보기 */
              <div className="pcard">
                <div className={`pcard-photo${currentCapsule.photo ? '' : ' noimg'}`}>
                  {currentCapsule.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={currentCapsule.photo} alt="" />
                  ) : (
                    <span>사진 없이<br />남긴 기록</span>
                  )}
                </div>
                <div className="pcard-body">
                  <span className={`pcard-stamp${currentCapsule.photo ? ' has-photo' : ''}`} aria-hidden>
                    {currentCapsule.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={currentCapsule.photo} alt="" />
                    ) : (
                      '♥'
                    )}
                  </span>
                  <div className="pcard-label">{currentCapsule.key === 'wedding' ? '행복했던 결혼식' : currentCapsule.label}</div>
                  {currentCapsule.dateIso && <div className="pcard-mark">{fmtDate(currentCapsule.dateIso)}</div>}
                  <div className="pcard-rule" />
                  {currentCapsule.message ? (
                    <p className="pcard-msg">{currentCapsule.message}</p>
                  ) : (
                    <p className="pcard-msg muted">아직 한 조각이 없어요</p>
                  )}
                  <button type="button" className="btn btn-m btn-assist pcard-edit" onClick={() => setCapsuleMode('edit')}>
                    편집
                  </button>
                </div>
              </div>
            ) : (
              /* 편집 */
              <>
                <h3 className="capttl">
                  {currentCapsule.recorded && (
                    <button type="button" className="capback" onClick={() => setCapsuleMode('view')} aria-label="엽서 보기">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                    </button>
                  )}
                  {currentCapsule.label} 우표
                </h3>
                {currentCapsule.dateIso && <p className="capdate">{fmtDate(currentCapsule.dateIso)}</p>}
                <div className="capphoto">
                  {currentCapsule.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={currentCapsule.photo} alt="" />
                  ) : (
                    <span>사진 한 장을 남겨보세요</span>
                  )}
                </div>
                <div className="caprow">
                  <button type="button" className="btn btn-s btn-assist" disabled={capsuleUploading || capsuleSaving} onClick={() => capsuleFileRef.current?.click()}>
                    {capsuleUploading ? '업로드 중…' : currentCapsule.photo ? '사진 변경' : '사진 추가'}
                  </button>
                  {currentCapsule.photo && (
                    <button type="button" className="mreload" disabled={capsuleUploading || capsuleSaving} onClick={removeCapsulePhoto}>
                      사진 삭제
                    </button>
                  )}
                  <input ref={capsuleFileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onCapsulePhoto} />
                </div>
                <textarea
                  className="stamp-ta"
                  rows={3}
                  maxLength={80}
                  value={capsuleMsg}
                  placeholder="그때의 마음을 한 줄로 남겨보세요."
                  onChange={(e) => setCapsuleMsg(e.target.value)}
                />
                <div className="stamp-ta-row">
                  <span className="setnote">{capsuleMsg.length}/80</span>
                  <button type="button" className="btn btn-m btn-solid" disabled={capsuleSaving || capsuleMsg === (currentCapsule.message ?? '')} onClick={saveCapsuleMessage}>
                    저장
                  </button>
                </div>
                {capsuleErr && <p className="caperr">{capsuleErr}</p>}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
