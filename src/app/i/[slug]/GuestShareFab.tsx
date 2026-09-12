'use client'

import { useEffect, useState } from 'react'

/**
 * 청첩장 → 하객 사진 공유 페이지 진입 FAB (오버레이).
 * InvitationClient 내부를 건드리지 않고 page.tsx에서 조건부로 덧붙인다.
 * (guest_share_enabled === 1 && !preview && !sample 일 때만 렌더)
 *
 * 오프닝(첫 화면)에서는 숨기고, 본문으로 스크롤해 들어가면 나타난다.
 * 템플릿마다 스크롤 주체가 다르므로(윈도우 vs 내부 컨테이너) 캡처 단계로 모든 스크롤을 관찰한다.
 */
export default function GuestShareFab({ slug }: { slug: string }) {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const onScroll = (e: Event) => {
      const t = e.target as (Document | HTMLElement | null)
      let y = 0
      let h = window.innerHeight
      if (!t || t === document || t === document.documentElement || t === document.body) {
        y = window.scrollY || document.documentElement.scrollTop || 0
      } else if (t instanceof HTMLElement) {
        y = t.scrollTop
        h = t.clientHeight || window.innerHeight
      }
      // 첫 화면(오프닝)의 약 75%를 지나 스크롤해 들어가면 표시
      setShown(y > h * 0.75)
    }
    // capture: 내부 스크롤 컨테이너(OUR 등)의 scroll 이벤트까지 포착
    window.addEventListener('scroll', onScroll, { capture: true, passive: true })
    return () => window.removeEventListener('scroll', onScroll, { capture: true } as EventListenerOptions)
  }, [])

  return (
    <a
      href={`/i/${slug}/share`}
      aria-label="하객 사진 공유"
      aria-hidden={!shown}
      tabIndex={shown ? 0 : -1}
      className={`fixed right-4 bottom-24 z-[60] flex items-center gap-1.5 rounded-full bg-neutral-900/90 px-4 py-2.5 text-sm font-medium text-white shadow-lg backdrop-blur transition-all duration-300 active:scale-95 ${shown ? 'opacity-100 translate-y-0' : 'pointer-events-none translate-y-3 opacity-0'}`}
    >
      <span aria-hidden>📷</span>
      <span>사진 공유</span>
    </a>
  )
}
