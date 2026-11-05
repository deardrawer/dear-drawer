'use client'

import { useEffect, useState } from 'react'
import { preload } from 'react-dom'

/**
 * 하객 페이지 사진 로딩 순서 도우미 (카톡 인앱 첫 진입 속도)
 *
 * 1) preloadOpeningImage — 첫 화면(인트로·표지) 사진을 렌더 중에 preload(우선순위 high)
 *    서버 렌더 때 <head>에 들어가 폰트·스크립트보다 먼저 받음. 화면에 그리는 주소와 똑같아야 중복 다운로드가 없음.
 * 2) usePrefetchAfter — 첫 사진을 다 받은 뒤(최대 waitMs) 다음 사진들(갤러리 앞쪽·본문 첫 사진)을 뒤에서 미리 받음
 *    인트로·표지를 보는 동안 받아 두어, 본문으로 넘어가면 바로 보이게. 첫 사진과 대역폭을 다투지 않게 순서만 뒤로.
 * 3) useVisible — 요소가 화면에 보이는 동안만 true (자동 슬라이드 시작·정지용)
 *    페이지를 열자마자 슬라이드가 돌아 갤러리에 도착하면 중간 사진부터 보이던 문제 방지.
 */

function isFetchableUrl(u: unknown): u is string {
  return typeof u === 'string' && u.length > 0 && !u.startsWith('data:') && !u.startsWith('blob:')
}

/** 렌더 중 호출 (훅 아님 — 조건부 호출 가능) */
export function preloadOpeningImage(url: string | null | undefined) {
  if (isFetchableUrl(url)) preload(url, { as: 'image', fetchPriority: 'high' })
}

export function usePrefetchAfter(
  primary: string | null | undefined,
  next: Array<string | null | undefined>,
  waitMs = 2500
) {
  const urls = Array.from(new Set(next.filter(isFetchableUrl))).filter((u) => u !== primary)
  const key = urls.join('|')
  useEffect(() => {
    if (!key) return
    const list = key.split('|')
    let started = false
    let cancelled = false
    const start = () => {
      if (started || cancelled) return
      started = true
      list.forEach((u) => {
        const im = new Image()
        ;(im as HTMLImageElement & { fetchPriority?: string }).fetchPriority = 'low'
        im.decoding = 'async'
        im.src = u
      })
    }
    const fallback = setTimeout(start, waitMs)
    if (isFetchableUrl(primary)) {
      // 같은 주소라 preload·화면용과 한 번만 받음 — 끝났는지만 확인
      const p = new Image()
      p.onload = p.onerror = () => start()
      p.src = primary
    } else {
      start()
    }
    return () => {
      cancelled = true
      clearTimeout(fallback)
    }
  }, [primary, key, waitMs])
}

export function useVisible(ref: React.RefObject<HTMLElement | null>, active = true, threshold = 0.35): boolean {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!active) return
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, active, threshold])
  return visible
}
