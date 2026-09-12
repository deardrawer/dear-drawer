'use client'

import { useEffect, useState } from 'react'
import type { Stamp } from '@/lib/postDrawer'
import { pickLoveFragment } from '@/lib/postDrawerConstants'

const PAGE_SIZE = 20

export default function PostDrawerCollection({ stamps }: { stamps: Stamp[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE)
  // 우표 위에 '결혼식 한 조각'을 겹쳐 보여줄 대상(모바일 탭 토글용). PC는 CSS hover로도 표시.
  const [revealed, setRevealed] = useState<number | null>(null)

  // Esc로 열린 한 조각 접기
  useEffect(() => {
    if (revealed === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setRevealed(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [revealed])

  const shown = stamps.slice(0, visible)

  return (
    <>
      {/* 우표 그리드 */}
      {shown.length > 0 ? (
        <div className="grid">
          {shown.map((s, i) => (
            <button
              key={i}
              type="button"
              className={`stamp${s.photo ? '' : ' nophoto'}${revealed === i ? ' revealed' : ''}`}
              onClick={() => setRevealed((r) => (r === i ? null : i))}
              aria-label="결혼식 우표 — 결혼식 한 조각 보기"
            >
              <div className="ph">
                {s.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.photo} alt="" />
                ) : (
                  <div className="txt">
                    사진 없이<br />남은 기록
                  </div>
                )}
                {/* 결혼식 한 조각 — hover(PC)/탭(모바일) 시 사진 위에 겹쳐 표시.
                    미입력 우표는 사랑 문구를 대신(우표마다 다르게) 얹는다. */}
                <div className={`pconoverlay${s.message ? '' : ' fragment'}`} aria-hidden={revealed !== i}>
                  <p>{s.message ? s.message : pickLoveFragment(s.weddingDate || String(i))}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <p className="empty-all">아직 이 조건의 우표가 없습니다.</p>
      )}

      {/* 더보기 */}
      {stamps.length > visible && (
        <div className="more">
          <button type="button" className="btn btn-m btn-assist" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
            우표 더 보기
          </button>
        </div>
      )}
    </>
  )
}
