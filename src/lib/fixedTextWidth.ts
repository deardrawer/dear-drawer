'use client'

import { useEffect } from 'react'

/**
 * 휴대폰 폭과 상관없이 같은 자리에서 줄바꿈 (OUR · FAMILY 사용자 글 단락)
 *
 * - 청첩장 맨 바깥 래퍼(.dd-fw-root)의 실제 폭을 --dd-fw 로 넣어 두고,
 *   글 단락(.dd-fixw)의 최대 폭을 '지금 폭 − (화면 폭 − 360px)' 로 제한한다
 *   → 어느 폰에서든 360px 폰에서의 글 폭과 같아져 줄바꿈 위치가 같다 (에디터 미리보기도 같은 기준)
 *   360px 이하 폰은 제한 없음(그대로). 넓은 폰에선 글 묶음이 가운데에 놓이고 정렬은 그대로.
 * - 휴대폰에서도 단어 중간에서 줄이 바뀌지 않게 (예전엔 PC 화면에만 keep-all 이 걸려 있었음)
 */
export const FIXED_TEXT_WIDTH_CSS = `
.dd-fw-root{word-break:keep-all;overflow-wrap:anywhere}
.dd-fixw{width:100%;max-width:calc(100% - (var(--dd-fw, 360px) - 360px));margin-left:auto;margin-right:auto;box-sizing:border-box}
`

/** .dd-fw-root 요소들의 폭을 재서 CSS 변수(--dd-fw)로 넣어 둔다 (크기가 바뀌면 다시) */
export function useFrameWidthVar() {
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return
    const els = Array.from(document.getElementsByClassName('dd-fw-root')) as HTMLElement[]
    const set = (el: HTMLElement) => el.style.setProperty('--dd-fw', `${el.clientWidth}px`)
    const ro = new ResizeObserver((entries) => entries.forEach((e) => set(e.target as HTMLElement)))
    els.forEach((el) => { set(el); ro.observe(el) })
    return () => ro.disconnect()
  }, [])
}
