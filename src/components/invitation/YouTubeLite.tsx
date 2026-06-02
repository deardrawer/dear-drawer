'use client'

import { useState, useRef, useEffect } from 'react'
import { loadYouTubeApi } from '@/lib/youtubeApi'

export function YouTubeLite({ videoId, onPlay, onStop }: {
  videoId: string; onPlay?: () => void; onStop?: () => void
}) {
  const [active, setActive] = useState(false)
  const [thumbErr, setThumbErr] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const stoppedRef = useRef(false)
  const iframeId = useRef(`yt-${videoId}-${Math.random().toString(36).slice(2, 8)}`).current

  // 영상이 화면 밖으로 벗어나면 정지 + BGM 복구
  useEffect(() => {
    if (!active || !containerRef.current) return
    const el = containerRef.current
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && !stoppedRef.current) {
          stoppedRef.current = true
          playerRef.current = null
          setActive(false)
          onStop?.()
        }
      },
      { threshold: 0.3 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [active, onStop])

  // iframe 렌더링 후 YT API로 이벤트 감지 연결 (영상은 iframe이 즉시 재생)
  useEffect(() => {
    if (!active) return
    stoppedRef.current = false
    let destroyed = false

    const init = () => {
      if (destroyed) return
      const el = document.getElementById(iframeId)
      if (!el) return
      try {
        const YT = (window as any).YT
        playerRef.current = new YT.Player(iframeId, {
          events: {
            onStateChange: (e: any) => {
              // ENDED(0) → 영상 종료 시 BGM 복구
              if (e.data === YT.PlayerState.ENDED && !stoppedRef.current) {
                stoppedRef.current = true
                setActive(false)
                onStop?.()
              }
              // PAUSED(2) → BGM 복구하지 않음
            },
          },
        })
      } catch {
        // YT API 래핑 실패 시 영상은 계속 재생 (이벤트 감지만 불가)
      }
    }

    loadYouTubeApi(init)
    return () => {
      destroyed = true
      playerRef.current = null
    }
  }, [active, videoId, iframeId, onStop])

  const handleClick = () => {
    setActive(true)
    onPlay?.()
  }

  const handleClose = () => {
    if (stoppedRef.current) return
    stoppedRef.current = true
    playerRef.current = null
    setActive(false)
    onStop?.()
  }

  return (
    <div ref={containerRef} style={{ aspectRatio: '16/9', width: '100%', position: 'relative', background: '#000' }}>
      {active ? (
        <>
          <iframe
            id={iframeId}
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&playsinline=1&rel=0`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="YouTube video"
          />
          {/* 닫기 버튼 */}
          <button
            onClick={handleClose}
            style={{
              position: 'absolute', top: 8, right: 8, width: 32, height: 32,
              borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 2,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </>
      ) : (
        <div
          onClick={handleClick}
          style={{ width: '100%', height: '100%', cursor: 'pointer', position: 'relative' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbErr
              ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
              : `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
            onError={() => setThumbErr(true)}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {/* 재생 버튼 오버레이 */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
