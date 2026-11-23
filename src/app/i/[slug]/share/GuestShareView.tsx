/**
 * 하객 사진 공유 — 화면 조각 (서버 · 클라이언트 공용, 훅 없음)
 * 흰 바탕 · 대표 사진 커버 · 세리프 이름 · 두 사람 말투
 */
import type { CSSProperties, ReactNode } from 'react'
import type { ShareLook } from '@/lib/guestShareLook'
import { GUEST_SHARE_OPEN_DAYS } from '@/lib/guestShareLook'
import { PHONE_FONT_VARS } from '@/components/invitation/phone/phoneFonts'
import CroppedImageDiv from '@/components/ui/CroppedImageDiv'

export const GS = {
  ink: '#1F1D1A',
  sub: '#8A8378',
  accent: '#3F4A3C',
  field: '#F4F4F5',
  serif: "var(--font-instrument-serif), 'Instrument Serif', serif",
  italic: "var(--font-cormorant), 'Cormorant Garamond', serif",
  mono: "var(--font-courier-prime), 'Courier Prime', monospace",
  krSerif: "'ChosunIlboMyungjo', var(--font-noto-serif-kr), serif",
  sans: "'Pretendard Variable', 'Pretendard', sans-serif",
}

/** 페이지 틀 — 모바일 폭, 흰 바탕 */
export function GsShell({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <main className={PHONE_FONT_VARS} style={{ minHeight: 'var(--gs-vh, 100dvh)', background: '#FFFFFF', color: GS.ink, fontFamily: GS.sans, WebkitTextSizeAdjust: '100%', ...style }}>
      <div style={{ position: 'relative', maxWidth: 440, margin: '0 auto', minHeight: 'var(--gs-vh, 100dvh)' }}>{children}</div>
    </main>
  )
}

export function GsCover({ look, dim = 0, height = 420 }: { look: ShareLook; dim?: number; height?: number | string }) {
  return (
    <div style={{ position: 'relative', height, overflow: 'hidden', background: '#EDEDED' }}>
      {look.cover && (look.coverCrop
        ? <CroppedImageDiv src={look.cover} crop={look.coverCrop} style={{ position: 'absolute', inset: 0, filter: dim ? 'blur(6px)' : undefined, transform: dim ? 'scale(1.06)' : undefined }} />
        // eslint-disable-next-line @next/next/no-img-element
        : <img src={look.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `50% ${look.coverY ?? 22}%`, display: 'block', filter: dim ? 'blur(6px)' : undefined, transform: dim ? 'scale(1.06)' : undefined }} />)}
      {dim > 0 && <div style={{ position: 'absolute', inset: 0, background: `rgba(255,255,255,${dim})` }} />}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.16) 0%, rgba(0,0,0,0) 22%, rgba(255,255,255,0) 50%, #FFFFFF 100%)' }} />
    </div>
  )
}

/** 두 사람 이름 — 영문이 있으면 영문 세리프, 없으면 한글 명조 */
export function GsName({ look, size }: { look: ShareLook; size: number }) {
  return look.nameEn
    ? <span style={{ fontFamily: GS.serif, fontSize: size, lineHeight: 1.08, letterSpacing: '-0.01em', wordBreak: 'keep-all' }}>{look.nameEn}</span>
    : <span style={{ fontFamily: GS.krSerif, fontSize: Math.round(size * 0.76), lineHeight: 1.25, letterSpacing: '-0.02em' }}>{look.groomKo} <span style={{ opacity: 0.55 }}>&amp;</span> {look.brideKo}</span>
}

export function GsNames({ look }: { look: ShareLook }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.32em', color: GS.accent }}>PHOTO BOX</div>
      <div style={{ marginTop: 8 }}><GsName look={look} size={40} /></div>
      {look.meta && <div style={{ fontSize: 12.5, color: GS.sub, marginTop: 8, letterSpacing: '0.02em' }}>{look.meta}</div>}
    </div>
  )
}

export function GsSign({ look, mt = 12 }: { look: ShareLook; mt?: number }) {
  return look.nameEn
    ? <p style={{ fontFamily: GS.italic, fontStyle: 'italic', fontSize: 18, textAlign: 'center', margin: `${mt}px 0 0` }}>— {look.nameEn}</p>
    : <p style={{ fontFamily: GS.krSerif, fontSize: 14.5, textAlign: 'center', margin: `${mt}px 0 0` }}>— {look.groomKo} · {look.brideKo} 드림</p>
}

export function GsTitle({ children, mt }: { children: ReactNode; mt: number }) {
  return <h1 style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.55, textAlign: 'center', margin: `${mt}px 0 0`, letterSpacing: '-0.02em', wordBreak: 'keep-all', whiteSpace: 'pre-line' }}>{children}</h1>
}
export function GsSub({ children, mt = 8 }: { children: ReactNode; mt?: number }) {
  return <p style={{ fontSize: 13.5, color: GS.sub, lineHeight: 1.65, textAlign: 'center', margin: `${mt}px 0 0`, wordBreak: 'keep-all', whiteSpace: 'pre-line' }}>{children}</p>
}

const btnBase: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', minHeight: 54, padding: '0 16px', borderRadius: 999, fontSize: 15.5, fontWeight: 600, textAlign: 'center', textDecoration: 'none', border: 0, cursor: 'pointer', fontFamily: 'inherit', boxSizing: 'border-box' }
export const gsBtn = (dark = true): CSSProperties => (dark
  ? { ...btnBase, background: GS.ink, color: '#FFFFFF' }
  : { ...btnBase, background: 'transparent', color: GS.ink, boxShadow: 'inset 0 0 0 1px rgba(31,29,26,0.18)' })

/** 하단 고정 영역 */
export function GsBottom({ children }: { children: ReactNode }) {
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 5, background: 'linear-gradient(180deg, rgba(255,255,255,0), #FFFFFF 26%)', padding: '18px 24px calc(28px + env(safe-area-inset-bottom))' }}>
      <div style={{ maxWidth: 392, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  )
}

/** 폰 한 화면에 맞춤 — 사진이 남는 높이를 채우고 글 · 버튼은 아래에 붙음 (긴 화면에서 빈 공간이 안 생김) */
export function GsCoverLayout({ look, dim = 0, children, bottom }: { look: ShareLook; dim?: number; children: ReactNode; bottom?: ReactNode }) {
  return (
    <GsShell>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'var(--gs-vh, 100dvh)' }}>
        <div style={{ position: 'relative', flex: '1 1 auto', minHeight: 300, maxHeight: 640 }}>
          <div style={{ position: 'absolute', inset: 0 }}><GsCover look={look} dim={dim} height="100%" /></div>
        </div>
        <div style={{ position: 'relative', marginTop: -96, padding: '0 24px' }}>{children}</div>
        {bottom && <div style={{ padding: '28px 24px calc(28px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 10 }}>{bottom}</div>}
        {!bottom && <div style={{ height: 40 }} />}
      </div>
    </GsShell>
  )
}

/** 열리기 전 · 마감 · 준비 중 */
export function GsStatusScreen({ look, kind, invitationHref }: { look: ShareLook; kind: 'before' | 'closed' | 'off'; invitationHref?: string | null }) {
  const dday = look.since !== null && look.since < 0 ? `D-${-look.since}` : null
  return (
    <GsCoverLayout look={look} dim={0.35} bottom={invitationHref ? <a href={invitationHref} style={gsBtn(false)}>청첩장 보기</a> : undefined}>
      <GsNames look={look} />
      {kind === 'before' && (
        <>
          {dday && <div style={{ display: 'flex', justifyContent: 'center', marginTop: 28 }}><span style={{ fontFamily: GS.serif, fontSize: 60, lineHeight: 1, color: GS.accent }}>{dday}</span></div>}
          <GsTitle mt={dday ? 16 : 32}>결혼식 당일부터 열려요</GsTitle>
          <GsSub>결혼식 날부터 {GUEST_SHARE_OPEN_DAYS}일 동안 사진과 영상을 받아요.</GsSub>
        </>
      )}
      {kind === 'closed' && (
        <>
          <GsTitle mt={32}>사진·영상 보내기가 마감됐어요</GsTitle>
          <GsSub>함께해 주셔서 고마워요.</GsSub>
          <GsSign look={look} />
        </>
      )}
      {kind === 'off' && (
        <>
          <GsTitle mt={32}>아직 열리지 않았어요</GsTitle>
          <GsSub>신랑·신부가 사진 받을 준비를 하고 있어요.{'\n'}잠시 후 다시 찾아와 주세요.</GsSub>
        </>
      )}
    </GsCoverLayout>
  )
}
