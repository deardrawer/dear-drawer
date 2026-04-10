'use client'

import { useSectionHighlight } from './SectionHighlightContext'
import { useTheme } from './ThemeContext'

interface ShareSectionProps {
  onKakaoShare?: () => void
  onSmsShare?: () => void
  onCopyLink?: () => void
  shareTitle?: string
  shareDescription?: string
  thumbnailUrl?: string
}

const stagger = (hasAppeared: boolean, delay: number) => ({
  opacity: hasAppeared ? 1 : 0,
  transform: hasAppeared ? 'translateY(0)' : 'translateY(18px)',
  transition: 'opacity 0.8s ease, transform 0.8s ease',
  transitionDelay: hasAppeared ? `${delay}s` : '0s',
})

export default function ShareSection({
  onKakaoShare,
  onSmsShare,
  onCopyLink,
  shareTitle,
  shareDescription,
  thumbnailUrl,
}: ShareSectionProps) {
  const { ref, isActive, hasAppeared } = useSectionHighlight('share')
  const theme = useTheme()

  const handleCopyLink = () => {
    if (onCopyLink) {
      onCopyLink()
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('링크가 복사되었습니다.')
    }
  }

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      className="px-6 py-20 min-h-screen"
      style={{
        backgroundColor: theme.background,
        filter: isActive ? 'none' : 'grayscale(30%)',
        opacity: isActive ? 1 : 0.3,
        transition: 'filter 0.5s, opacity 0.5s',
      }}
    >
      <p
        className="text-center text-xs mb-5 tracking-[1px]"
        style={{
          color: isActive ? `${theme.accent}80` : '#aaa',
          fontWeight: 300,
          ...stagger(hasAppeared, 0),
        }}
      >
        소중한 분들께 알려주세요
      </p>

      <div
        className="flex items-center justify-center gap-3"
        style={stagger(hasAppeared, 0.2)}
      >
        <button
          onClick={() => {
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

                    kakaoWindow.Kakao.Share.sendDefault({
                      objectType: 'feed',
                      content: {
                        title: shareTitle || '결혼식에 초대합니다',
                        description: shareDescription || '소중한 분들을 결혼식에 초대합니다.',
                        imageUrl,
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
          }}
          className="flex items-center gap-1.5 px-5 py-2.5 text-[11px] tracking-[0.5px] rounded-3xl transition-all duration-200"
          style={{
            backgroundColor: '#FEE500',
            border: '1px solid #FEE500',
            color: '#3C1E1E',
          }}
        >
          카카오톡
        </button>
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 px-5 py-2.5 text-[11px] tracking-[0.5px] rounded-3xl transition-all duration-200"
          style={{
            backgroundColor: '#FFFFFF',
            border: `1px solid ${isActive ? '#E8E2DA' : '#eee'}`,
            color: isActive ? theme.textLight : '#aaa',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.color = theme.accent; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = isActive ? '#E8E2DA' : '#eee'; e.currentTarget.style.color = isActive ? theme.textLight : '#aaa'; }}
        >
          링크복사
        </button>
      </div>

      <p
        className="text-center text-[10px] mt-12 tracking-[4px]"
        style={{
          color: isActive ? `${theme.accent}60` : '#ccc',
          fontWeight: 300,
          ...stagger(hasAppeared, 0.4),
        }}
      >
        dear drawer
      </p>
    </section>
  )
}
