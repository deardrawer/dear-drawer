'use client'

import { useSectionHighlight } from './SectionHighlightContext'
import { C_TXT_BODY, C_TXT, C_KSERIF, C_SERIF, C_TXT_SUB, cCaption, cDim, cPill, cStagger } from './cStyle'

interface ShareSectionProps {
  onKakaoShare?: () => void
  onSmsShare?: () => void
  onCopyLink?: () => void
  shareTitle?: string
  shareDescription?: string
  thumbnailUrl?: string
  kakaoThumbnailRatio?: '3:4' | '1:1' | '3:2'
  signature?: React.ReactNode   // C안 맺음말 아래 보내는 분 (선택)
  showCaption?: boolean         // 참석 여부 섹션이 없을 때 작은 안내 문구 표시
}

export default function ShareSection({
  onKakaoShare,
  onCopyLink,
  shareTitle,
  shareDescription,
  thumbnailUrl,
  kakaoThumbnailRatio,
  signature,
  showCaption = false,
}: ShareSectionProps) {
  const { ref, isActive, hasAppeared } = useSectionHighlight('share')

  const handleCopyLink = () => {
    if (onCopyLink) {
      onCopyLink()
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('링크가 복사되었습니다.')
    }
  }

  const handleKakaoShare = () => {
    if (onKakaoShare) {
      onKakaoShare()
    } else {
      const kakaoWindow = window as typeof window & {
        Kakao?: {
          isInitialized?: () => boolean
          init?: (key: string) => void
          Share?: { sendDefault: (config: object) => void }
        }
      }

      if (typeof window !== 'undefined' && kakaoWindow.Kakao) {
        try {
          if (!kakaoWindow.Kakao.isInitialized?.()) {
            const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY || '0890847927f3189d845391481ead8ecc'
            kakaoWindow.Kakao.init?.(kakaoKey)
          }

          if (kakaoWindow.Kakao.Share?.sendDefault) {
            let imageUrl = 'https://invite.deardrawer.com/og-image.png'
            if (thumbnailUrl) {
              if (thumbnailUrl.startsWith('https://')) {
                imageUrl = thumbnailUrl
              } else if (thumbnailUrl.startsWith('/')) {
                imageUrl = `https://invite.deardrawer.com${thumbnailUrl}`
              }
            }

            const kakaoRatioSizes: Record<string, { w: number; h: number }> = { '3:4': { w: 900, h: 1200 }, '1:1': { w: 800, h: 800 }, '3:2': { w: 1200, h: 800 } }
            const kakaoImgSize = kakaoRatioSizes[kakaoThumbnailRatio || '1:1']

            kakaoWindow.Kakao.Share.sendDefault({
              objectType: 'feed',
              content: {
                title: shareTitle || '결혼식에 초대합니다',
                description: shareDescription || '소중한 분들을 결혼식에 초대합니다.',
                imageUrl,
                imageWidth: kakaoImgSize.w,
                imageHeight: kakaoImgSize.h,
                link: {
                  mobileWebUrl: window.location.href,
                  webUrl: window.location.href,
                },
              },
              buttons: [
                {
                  title: '청첩장 보기',
                  link: {
                    mobileWebUrl: window.location.href,
                    webUrl: window.location.href,
                  },
                },
              ],
            })
          } else {
            navigator.clipboard.writeText(window.location.href)
            alert('카카오톡 공유 준비 중입니다. 링크가 복사되었습니다.')
          }
        } catch (error) {
          console.error('Kakao share error:', error)
          navigator.clipboard.writeText(window.location.href)
          alert('카카오톡 공유에 실패했습니다. 링크가 복사되었습니다.')
        }
      } else {
        navigator.clipboard.writeText(window.location.href)
        alert('카카오톡 공유를 사용할 수 없습니다. 링크가 복사되었습니다.')
      }
    }
  }

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      // 기존과 같은 높이(min-h-screen) — 맨 끝 참석 여부 시트가 올라오는 시점을 그대로 유지
      className="min-h-screen"
      style={{ backgroundColor: 'transparent', padding: showCaption ? '72px 28px 110px' : '0 28px 110px', ...cDim(isActive) }}
    >
      {showCaption && (
        <p style={{ ...cCaption, textAlign: 'center', marginBottom: 20, ...cStagger(hasAppeared, 0) }}>소중한 분들께 알려 주세요</p>
      )}
      <div style={{ display: 'flex', gap: 8, ...cStagger(hasAppeared, 0.2) }}>
        <button type="button" onClick={handleKakaoShare} style={cPill(false)}>
          카카오톡 공유
        </button>
        <button type="button" onClick={handleCopyLink} style={cPill(false)}>
          링크 복사
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: 64, ...cStagger(hasAppeared, 0.4) }}>
        <div style={{ fontFamily: C_SERIF, fontStyle: 'italic', fontSize: 22, color: C_TXT }}>with love</div>
        {signature && (
          <div style={{ fontFamily: C_KSERIF, fontSize: 15, marginTop: 8, color: C_TXT_BODY }}>{signature}</div>
        )}
        <div style={{ fontSize: 11, letterSpacing: '0.12em', color: C_TXT_SUB, marginTop: 40, opacity: 0.7 }}>dear drawer</div>
      </div>
    </section>
  )
}
