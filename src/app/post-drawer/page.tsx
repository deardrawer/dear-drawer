import './postdrawer.css'
import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import { getStampCollection } from '@/lib/postDrawer'
import PostDrawerCollection from './PostDrawerCollection'

export const metadata: Metadata = {
  title: 'POST DRAWER — dear drawer',
  description: '결혼식이 지나도, 이야기는 남으니까. Dear Drawer에서 만들어진 결혼식들이 한 장의 우표가 되어 쌓입니다.',
}
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

// D1(getStampCollection)이 런타임에만 있으므로 정적 prerender 대신 요청 시 렌더
export const dynamic = 'force-dynamic'

/**
 * [공개] POST DRAWER 우표 컬렉션 (P4-1).
 * getStampCollection()은 우표 최소필드({photo,name,weddingDate,message})만 반환 — archiveSlug/개인 데이터 미포함.
 */
export default async function PostDrawerPage() {
  const stamps = await getStampCollection()

  return (
    <div className="pd">
      <nav className="nav">
        <Link href="/" className="wm" style={{ color: 'inherit', textDecoration: 'none' }}>
          Dear&nbsp;Drawer
        </Link>
        <ul>
          <li><Link href="/post-drawer/mine" style={{ color: 'inherit', textDecoration: 'none' }}>내 서랍</Link></li>
        </ul>
        <Link href="/" className="burger" aria-label="홈으로">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </Link>
      </nav>

      <header className="hero">
        <div className="t13 sb prim">POST DRAWER</div>
        <h1>
          결혼식이 지나도,
          <br />
          이야기는 남으니까.
        </h1>
        <p className="lead t16 lneutral">
          Dear Drawer에서 만들어진 결혼식들이 한 장의 우표가 되어 이곳에 쌓입니다.
          <br />
          각 우표는 그 결혼식의 아주 작은 한 조각입니다.
        </p>
      </header>

      <PostDrawerCollection stamps={stamps} />

      <footer className="footer">
        <p>공개 우표는 날짜 · 결혼식 한 조각만 담습니다. 이름은 담지 않습니다.</p>
      </footer>
    </div>
  )
}
