'use client'

import { useState, useRef, useEffect } from 'react'
import ThankYouPage, { type ThankYouFontStyle } from '@/components/thank-you/ThankYouPage'
import type { ThankYouData } from '@/components/thank-you/types'
import type { Invitation } from '@/types/invitation'

interface InvitationClientThankYouProps {
  invitation: Invitation
  content: Record<string, unknown> | null
  isPaid: boolean
  isPreview?: boolean
  isSample?: boolean
}

export default function InvitationClientThankYou({
  invitation,
  content,
  isPaid,
  isPreview,
  isSample,
}: InvitationClientThankYouProps) {
  const [bgmPlaying, setBgmPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  // content JSON -> ThankYouData 파싱
  const thankYouData: ThankYouData | undefined = content ? {
    coupleNames: (content.coupleNames as string) || '',
    date: (content.date as string) || '',
    heroMessage: (content.heroMessage as string) || '',
    heroImage: (content.heroImage as string) || '',
    heroCrop: content.heroCrop as ThankYouData['heroCrop'],
    polaroids: Array.isArray(content.polaroids) ? content.polaroids.map((p: Record<string, unknown>) => ({
      image: (p.image as string) || '',
      caption: (p.caption as string) || '',
      rotation: (p.rotation as number) || 0,
      offsetX: (p.offsetX as number) || 0,
      crop: p.crop as ThankYouData['heroCrop'],
    })) : [],
    closingLines: Array.isArray(content.closingLines) ? content.closingLines as string[] : [],
    photoShare: content.photoShare as ThankYouData['photoShare'],
  } : undefined

  // 폰트 스타일
  const fontStyleValue = (content?.fontStyle as ThankYouFontStyle) || 'classic'

  // 메인컬러 + 실링 (하위호환: colorTheme → accentColor)
  let accentColorValue = (content?.accentColor as string) || ''
  if (!accentColorValue && content?.colorTheme) {
    const legacyMap: Record<string, string> = {
      burgundy: '#B89878', navy: '#8898A8', sage: '#98907E',
      dustyRose: '#A898A8', emerald: '#B8B0A5', slateBlue: '#B5A590',
    }
    accentColorValue = legacyMap[content.colorTheme as string] || '#B89878'
  }
  if (!accentColorValue) accentColorValue = '#B89878'
  const sealColorValue = (content?.sealColor as string) || '#722F37'

  // BGM 설정
  const bgmConfig = content?.bgm as { enabled?: boolean; url?: string; autoplay?: boolean } | undefined
  const bgmEnabled = bgmConfig?.enabled ?? false
  const bgmUrl = bgmConfig?.url || ''
  const bgmAutoplay = bgmConfig?.autoplay ?? false

  // 자동 재생
  useEffect(() => {
    if (bgmEnabled && bgmUrl && bgmAutoplay && audioRef.current) {
      const playBgm = () => {
        audioRef.current?.play().then(() => {
          setBgmPlaying(true)
        }).catch(() => {
          // 자동 재생 실패 (브라우저 정책)
        })
      }
      // 사용자 인터랙션 후 재생 시도
      const handleInteraction = () => {
        playBgm()
        document.removeEventListener('scroll', handleInteraction)
        document.removeEventListener('click', handleInteraction)
        document.removeEventListener('touchstart', handleInteraction)
      }
      document.addEventListener('scroll', handleInteraction, { once: true })
      document.addEventListener('click', handleInteraction, { once: true })
      document.addEventListener('touchstart', handleInteraction, { once: true })
      // 즉시 시도
      playBgm()

      return () => {
        document.removeEventListener('scroll', handleInteraction)
        document.removeEventListener('click', handleInteraction)
        document.removeEventListener('touchstart', handleInteraction)
      }
    }
  }, [bgmEnabled, bgmUrl, bgmAutoplay])

  const toggleBgm = () => {
    if (!audioRef.current) return
    if (bgmPlaying) {
      audioRef.current.pause()
      setBgmPlaying(false)
    } else {
      audioRef.current.play().then(() => setBgmPlaying(true)).catch(() => {})
    }
  }

  return (
    <div className="relative">
      <ThankYouPage data={thankYouData} fontStyle={fontStyleValue} accentColor={accentColorValue} sealColor={sealColorValue} />

      {/* BGM 토글 버튼 */}
      {bgmEnabled && bgmUrl && (
        <>
          <audio ref={audioRef} src={bgmUrl} loop preload="auto" />
          <button
            onClick={toggleBgm}
            className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors"
            aria-label={bgmPlaying ? '음악 끄기' : '음악 켜기'}
          >
            {bgmPlaying ? (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M9 9v6m-3-3h.01M12 12h.01" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
          </button>
        </>
      )}

      {/* 미리보기/무료 워터마크 */}
      {isPreview && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full">
          <p className="text-xs text-white/80">미리보기 모드</p>
        </div>
      )}
      {!isPaid && !isPreview && !isSample && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 16px', backgroundColor: 'rgba(0,0,0,0.9)' }}>
          <span style={{ color: 'rgba(255,255,255,0.95)', fontSize: '13px', fontWeight: 500 }}>결제 후 워터마크가 제거됩니다</span>
        </div>
      )}
    </div>
  )
}
