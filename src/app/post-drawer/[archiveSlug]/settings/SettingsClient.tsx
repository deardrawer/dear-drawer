'use client'

import '../../postdrawer.css'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { STAMP_MESSAGE_PLACEHOLDER } from '@/lib/postDrawerConstants'

interface StampInfo {
  photo: string | null // 실제 표시되는 사진(전용값 || 카카오)
  hasCustomPhoto: boolean // 서랍 전용 사진 지정 여부
  kakaoThumbnail: string | null
  message: string | null // 결혼식 한 조각(한마디)
  messageMax: number
}
interface Settings {
  invitationId: string
  weddingDate: string | null
  active: boolean // Day 1+
  archived: boolean // Day 31+
  canTogglePublic: boolean // Day 1~30
  publicHidden: boolean
  stamp: StampInfo
  share: { hasPassword: boolean; shareSlug: string | null } // 링크는 활성 시 항상 존재, 비번은 선택
}

/** 선택 이미지를 webp Blob으로 변환(최대 변 1200px). 우리 업로드 파이프라인과 동일한 포맷. */
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
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('변환 실패'))), 'image/webp', 0.9),
  )
}

// 자동 종료(Day 31)까지 남은 일수. 공개 중일 때만 의미.
function daysLeftToArchive(weddingDate: string | null): number | null {
  if (!weddingDate) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(weddingDate)
  if (!m) return null
  const weddingDay = Math.floor(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / 86400000)
  const today = Math.floor((Date.now() + 9 * 3600 * 1000) / 86400000)
  return 31 - (today - weddingDay)
}

export default function SettingsClient({ archiveSlug }: { archiveSlug: string }) {
  const [state, setState] = useState<'loading' | 'ok' | 'forbidden' | 'notfound' | 'error'>('loading')
  const [s, setS] = useState<Settings | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [pw, setPw] = useState('')
  const [copied, setCopied] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [stampMsg, setStampMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    try {
      const res = await fetch(`/api/post-drawer/${archiveSlug}/settings`)
      if (res.status === 403) return setState('forbidden')
      if (res.status === 404) return setState('notfound')
      if (!res.ok) return setState('error')
      const data = (await res.json()) as Settings
      setS(data)
      setStampMsg(data.stamp?.message ?? '')
      setState('ok')
    } catch {
      setState('error')
    }
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [archiveSlug])

  const patch = async (body: Record<string, unknown>, okMsg: string): Promise<Settings | null> => {
    if (saving) return null
    setSaving(true)
    setMsg('')
    try {
      const res = await fetch(`/api/post-drawer/${archiveSlug}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = (await res.json()) as Settings & { error?: string }
      if (!res.ok) {
        setMsg(d.error || '저장에 실패했습니다.')
        return null
      }
      setS(d)
      setMsg(okMsg)
      setPw('')
      setTimeout(() => setMsg(''), 2500)
      return d
    } catch {
      setMsg('저장에 실패했습니다.')
      return null
    } finally {
      setSaving(false)
    }
  }

  // 우표 사진 업로드 (webp 변환 → /api/upload → PATCH)
  const onPickPhoto = () => fileRef.current?.click()
  const onPhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // 같은 파일 재선택 허용
    if (!file || !s) return
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setMsg('JPG · PNG · WebP 이미지만 가능해요.')
      return
    }
    setUploading(true)
    setMsg('')
    try {
      const blob = await fileToWebp(file)
      const fd = new FormData()
      fd.append('web', new File([blob], 'stamp.webp', { type: 'image/webp' }))
      fd.append('invitationId', s.invitationId)
      fd.append('imageId', 'drawer-stamp')
      const up = await fetch('/api/upload', { method: 'POST', body: fd })
      const ud = (await up.json()) as { webUrl?: string; error?: string }
      if (!up.ok || !ud.webUrl) {
        setMsg(ud.error || '업로드에 실패했어요.')
        return
      }
      const busted = `${ud.webUrl}${ud.webUrl.includes('?') ? '&' : '?'}t=${Date.now()}`
      await patch({ stampPhoto: busted }, '우표 사진을 변경했어요')
    } catch {
      setMsg('업로드에 실패했어요.')
    } finally {
      setUploading(false)
    }
  }

  const saveMessage = async () => {
    const d = await patch({ stampMessage: stampMsg }, '한마디를 저장했어요')
    if (d) setStampMsg(d.stamp?.message ?? '')
  }

  if (state !== 'ok' || !s) {
    return (
      <div className="pd">
        <nav className="nav">
          <Link href={`/post-drawer/${archiveSlug}`} className="back" aria-label="서랍으로">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            서랍
          </Link>
          <span aria-hidden style={{ width: 20 }} />
        </nav>
        <div className="dstate">
          {state === 'loading' ? <p>불러오는 중…</p> : state === 'forbidden' ? (
            <><h1>권한이 없습니다</h1><p>두 사람만 설정할 수 있어요.</p><Link href="/login" className="btn btn-m btn-solid">로그인</Link></>
          ) : (
            <><h1>불러오지 못했습니다</h1><p>잠시 후 다시 시도해주세요.</p></>
          )}
        </div>
      </div>
    )
  }

  const dLeft = daysLeftToArchive(s.weddingDate)
  const publicStatus = s.archived ? '공개 종료됨' : s.publicHidden ? '비공개' : '공개 중'
  const shareUrl = s.share.shareSlug ? `https://invite.deardrawer.com/s/${s.share.shareSlug}` : ''

  return (
    <div className="pd">
      <nav className="nav">
        <Link href={`/post-drawer/${archiveSlug}`} className="back" aria-label="서랍으로">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          서랍
        </Link>
        <span aria-hidden style={{ width: 20 }} />
      </nav>

      <div className="drawer">
        <header className="dhead">
          <h1>설정</h1>
          <p className="sub">우표 · 한마디와 청첩장 공개 · 비공개 공유를 관리합니다.</p>
        </header>

        {/* 섹션 0-a: 우표 사진 */}
        <section className="sect">
          <h2>우표 사진</h2>
          <p className="setdesc">서랍과 공개 컬렉션에서 보이는 우표 사진이에요. 카카오 공유 썸네일과 별개로 지정할 수 있고, 지정하지 않으면 카카오 공유 썸네일을 사용합니다.</p>
          <div className="stamp-edit">
            <div className={`stamp-prev${s.stamp.photo ? '' : ' noimg'}`}>
              {s.stamp.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.stamp.photo} alt="" />
              ) : (
                <span>사진 없음</span>
              )}
            </div>
            <div className="stamp-edit-body">
              <p className="setnote">
                {s.stamp.hasCustomPhoto
                  ? '서랍 전용 사진을 사용 중이에요.'
                  : s.stamp.kakaoThumbnail
                    ? '지금은 카카오 공유 썸네일을 사용 중이에요.'
                    : '아직 사진이 없어요. 지정하면 우표에 보여요.'}
              </p>
              <div className="stamp-btns">
                <button type="button" className="btn btn-m btn-solid" disabled={uploading || saving} onClick={onPickPhoto}>
                  {uploading ? '업로드 중…' : s.stamp.hasCustomPhoto ? '사진 변경' : '사진 지정'}
                </button>
                {s.stamp.hasCustomPhoto && (
                  <button
                    type="button"
                    className="btn btn-m btn-assist"
                    disabled={uploading || saving}
                    onClick={() => patch({ removeStampPhoto: true }, '카카오 썸네일로 되돌렸어요')}
                  >
                    카카오 썸네일로 되돌리기
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onPhotoSelected} />
            </div>
          </div>
        </section>

        {/* 섹션 0-b: 결혼식 한 조각(한마디) */}
        <section className="sect">
          <h2>결혼식 한 조각</h2>
          <p className="setdesc">우표와 서랍에 함께 보이는 짧은 한마디예요. (최대 {s.stamp.messageMax}자)</p>
          <textarea
            className="stamp-ta"
            value={stampMsg}
            maxLength={s.stamp.messageMax}
            rows={3}
            placeholder={STAMP_MESSAGE_PLACEHOLDER}
            onChange={(e) => setStampMsg(e.target.value)}
          />
          <div className="stamp-ta-row">
            <span className="setnote">{stampMsg.length}/{s.stamp.messageMax}</span>
            <button type="button" className="btn btn-m btn-solid" disabled={saving || stampMsg === (s.stamp.message ?? '')} onClick={saveMessage}>
              한마디 저장
            </button>
          </div>
        </section>

        {/* 섹션 1: 기존 청첩장 공개 설정 (Mode 1) */}
        <section className="sect">
          <h2>기존 청첩장 공개</h2>
          <p className="setdesc">예식 다음날부터 30일까지, 기존에 공유한 링크(/i)의 공개 여부를 선택할 수 있어요. Day 31부터는 자동으로 종료됩니다.</p>
          <div className="setrow">
            <div>
              <div className="setlb">현재 상태 <span className={`badge2 ${s.archived ? 'off' : s.publicHidden ? 'hidden' : 'on'}`}>{publicStatus}</span></div>
              {!s.archived && !s.publicHidden && dLeft != null && dLeft > 0 && (
                <div className="setnote">자동 종료까지 D-{dLeft}</div>
              )}
            </div>
            {s.archived ? (
              <button type="button" className="btn btn-m btn-assist" disabled>공개 기간 종료</button>
            ) : (
              <button
                type="button"
                className={`btn btn-m ${s.publicHidden ? 'btn-solid' : 'btn-assist'}`}
                disabled={saving || !s.canTogglePublic}
                onClick={() => patch({ publicHidden: !s.publicHidden }, '변경되었습니다')}
              >
                {s.publicHidden ? '다시 공개하기' : '비공개로 전환'}
              </button>
            )}
          </div>
          {s.archived && <p className="setnote">청첩장 공개 기간이 종료되었습니다.</p>}
        </section>

        {/* 섹션 2: 결혼 후 비밀 청첩장 (Mode 2 = P3) */}
        <section className="sect">
          <h2>결혼 후 비밀 청첩장</h2>
          <p className="setdesc">예식 다음날부터, 공개가 종료된 뒤에도 이 링크로 청첩장을 볼 수 있어요. 비밀번호를 설정하면 비밀번호를 아는 사람만 볼 수 있습니다.</p>

          {!shareUrl ? (
            <p className="setnote">예식 다음날부터 이용할 수 있어요.</p>
          ) : (
            <>
              {/* 공유 링크 (항상) */}
              <div className="setfield">
                <label className="setlb">공유 링크</label>
                <div className="setinline">
                  <input readOnly value={shareUrl} className="setinput" onFocus={(e) => e.currentTarget.select()} />
                  <button
                    type="button"
                    className="btn btn-m btn-assist"
                    onClick={() => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                  >
                    {copied ? '복사됨' : '복사'}
                  </button>
                </div>
              </div>

              {/* 비밀번호 (선택) */}
              <div className="setfield">
                <label className="setlb">
                  비밀번호 <span className={`badge2 ${s.share.hasPassword ? 'on' : 'off'}`}>{s.share.hasPassword ? '설정됨' : '없음(링크만 알면 열람)'}</span>
                </label>
                <div className="setinline">
                  <input
                    type="password"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    placeholder={s.share.hasPassword ? '새 비밀번호(변경 시)' : '비밀번호(4자 이상)'}
                    className="setinput"
                  />
                  <button
                    type="button"
                    className="btn btn-m btn-assist"
                    disabled={saving || pw.length < 4}
                    onClick={() => patch({ sharePassword: pw }, s.share.hasPassword ? '비밀번호를 변경했어요' : '비밀번호를 설정했어요')}
                  >
                    {s.share.hasPassword ? '변경' : '설정'}
                  </button>
                </div>
                {s.share.hasPassword && (
                  <button type="button" className="setlink" disabled={saving} onClick={() => patch({ removePassword: true }, '비밀번호를 해제했어요')}>
                    비밀번호 해제 (링크만으로 공개)
                  </button>
                )}
                <p className="setnote">
                  {s.share.hasPassword
                    ? '비밀번호를 변경/해제하면 기존에 인증했던 사람은 다시 접근해야 해요.'
                    : '비밀번호 없이도 링크를 아는 사람은 볼 수 있어요. 원치 않으면 비밀번호를 설정하세요.'}
                </p>
              </div>
            </>
          )}
        </section>

        {msg && <div className="setmsg">{msg}</div>}
      </div>
    </div>
  )
}
