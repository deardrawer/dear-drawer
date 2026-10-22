'use client'

import ZoomableImage from './ZoomableImage'

/**
 * 라이트박스 위에 띄우는 전체 화면 확대 레이어 (사진 확대 허용 시).
 * 각 타입의 라이트박스 레이아웃·애니메이션은 그대로 두고, 현재 사진만 이 레이어에서 핀치·더블탭·팬으로 확대.
 * 확대하지 않은 상태에서 한 손가락 좌우 스와이프(또는 ‹ › 버튼)로 이전/다음 사진 이동 — 인덱스는 부모(라이트박스)와 공유.
 */
export default function LightboxZoomLayer({
  images,
  index,
  onIndexChange,
  onClose,
}: {
  images: string[]
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
}) {
  const total = images.length
  const go = (dir: 1 | -1) => {
    if (total < 2) return
    onIndexChange((index + dir + total) % total)
  }

  const src = images[index]
  if (!src) return null

  return (
    <div
      className="lbz-layer"
      onClick={e => e.stopPropagation()}
      onContextMenu={e => e.preventDefault()}
    >
      {/* 확대하지 않은 상태의 좌우 스와이프 → 이전/다음 (확대 중엔 팬, 핀치는 제외 — ZoomableImage가 판정) */}
      <ZoomableImage src={src} alt="" className="lbz-box" resetKey={index} onSwipe={go} />
      {total > 1 && <span className="lbz-counter">{index + 1} / {total}</span>}
      <button type="button" className="lbz-close" onClick={onClose} aria-label="확대 닫기">&times;</button>
      {total > 1 && (
        <>
          <button type="button" className="lbz-arrow lbz-arrow--prev" onClick={() => go(-1)} aria-label="이전 사진">&#8249;</button>
          <button type="button" className="lbz-arrow lbz-arrow--next" onClick={() => go(1)} aria-label="다음 사진">&#8250;</button>
        </>
      )}
      <p className="lbz-hint">두 손가락으로 확대 · 두 번 탭</p>
      {/* touch-action: none — 레이어 안 제스처를 브라우저가 가로채지 않게(가로 스와이프가 뒤로가기/스크롤로 새지 않도록) */}
      <style>{`
        .lbz-layer { position: fixed; inset: 0; z-index: 10001; background: rgba(0,0,0,.94); display: flex; align-items: center; justify-content: center; animation: lbzIn .2s ease; touch-action: none; overscroll-behavior: contain; }
        .lbz-box { width: 100%; height: 100%; }
        .lbz-close { position: absolute; top: calc(env(safe-area-inset-top, 0px) + 14px); right: 16px; width: 40px; height: 40px; border-radius: 50%; border: 0; background: rgba(255,255,255,.14); color: #fff; font-size: 24px; line-height: 1; cursor: pointer; }
        .lbz-counter { position: absolute; top: calc(env(safe-area-inset-top, 0px) + 25px); left: 18px; font-size: 12px; letter-spacing: .04em; color: rgba(255,255,255,.7); pointer-events: none; }
        .lbz-arrow { position: absolute; top: 50%; transform: translateY(-50%); width: 40px; height: 40px; border-radius: 50%; border: 0; background: rgba(255,255,255,.14); color: #fff; font-size: 26px; line-height: 1; padding-bottom: 3px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .lbz-arrow--prev { left: 12px; }
        .lbz-arrow--next { right: 12px; }
        .lbz-hint { position: absolute; left: 0; right: 0; bottom: calc(env(safe-area-inset-bottom, 0px) + 18px); margin: 0; text-align: center; font-size: 11px; letter-spacing: .02em; color: rgba(255,255,255,.55); pointer-events: none; }
        @keyframes lbzIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </div>
  )
}

/** 라이트박스 위 돋보기 버튼 — 누르면 LightboxZoomLayer를 연다 (OUR의 .our-lb-zoom-btn과 같은 모양) */
export function LightboxZoomButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); onClick() }}
      aria-label="사진 확대"
      style={{
        position: 'fixed', zIndex: 10000, right: 16, bottom: 'calc(env(safe-area-inset-bottom, 0px) + 56px)',
        width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,.38)', color: '#fff', border: '1px solid rgba(255,255,255,.28)',
        WebkitBackdropFilter: 'blur(4px)', backdropFilter: 'blur(4px)', cursor: 'pointer', padding: 0,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5M11 8.5v5M8.5 11h5" /></svg>
    </button>
  )
}
