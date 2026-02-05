'use client'

import { useSectionHighlight } from './SectionHighlightContext'
import { useTheme } from './ThemeContext'

interface ShareSectionProps {
  onKakaoShare?: () => void
  onSmsShare?: () => void
  onCopyLink?: () => void
}

export default function ShareSection({
  onKakaoShare,
  onSmsShare,
  onCopyLink,
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

  const buttonHoverStyle = (e: React.MouseEvent<HTMLButtonElement>, hover: boolean) => {
    e.currentTarget.style.backgroundColor = hover ? theme.accent : '#F5F0EB'
    e.currentTarget.style.color = hover ? 'white' : '#666'
  }

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      className="px-8 py-20 transition-all duration-500 min-h-screen"
      style={{
        backgroundColor: theme.background,
        opacity: hasAppeared ? (isActive ? 1 : 0.3) : 0,
        transform: hasAppeared ? 'translateY(0)' : 'translateY(20px)',
        filter: isActive ? 'none' : 'grayscale(30%)',
      }}
    >
      <p
        className="text-center text-sm mb-8 tracking-wide transition-colors duration-500"
        style={{ color: isActive ? '#666' : '#aaa' }}
      >
        소중한 분들께 알려주세요
      </p>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => {
            if (onKakaoShare) {
              onKakaoShare()
            } else {
              // Kakao SDK를 사용한 공유
              const kakaoWindow = window as typeof window & {
                Kakao?: {
                  isInitialized?: () => boolean
                  init?: (key: string) => void
                  Share?: { sendDefault: (config: object) => void }
                }
              }

              if (typeof window !== 'undefined' && kakaoWindow.Kakao) {
                try {
                  // SDK 초기화 확인 및 초기화
                  if (!kakaoWindow.Kakao.isInitialized?.()) {
                    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY || '0890847927f3189d845391481ead8ecc'
                    kakaoWindow.Kakao.init?.(kakaoKey)
                  }

                  // Share 기능 사용 가능 여부 확인
                  if (kakaoWindow.Kakao.Share?.sendDefault) {
                    kakaoWindow.Kakao.Share.sendDefault({
                      objectType: 'feed',
                      content: {
                        title: '결혼식에 초대합니다',
                        description: '소중한 분들을 결혼식에 초대합니다.',
                        imageUrl: 'https://invite.deardrawer.com/og-image.png',
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
                    // SDK가 아직 로딩 중일 수 있음 - 링크 복사로 대체
                    navigator.clipboard.writeText(window.location.href)
                    alert('카카오톡 공유 준비 중입니다. 링크가 복사되었습니다.')
                  }
                } catch (error) {
                  console.error('Kakao share error:', error)
                  navigator.clipboard.writeText(window.location.href)
                  alert('카카오톡 공유에 실패했습니다. 링크가 복사되었습니다.')
                }
              } else {
                // SDK 로드 안됨 - 링크 복사로 대체
                navigator.clipboard.writeText(window.location.href)
                alert('카카오톡 공유를 사용할 수 없습니다. 링크가 복사되었습니다.')
              }
            }
          }}
          onMouseEnter={(e) => buttonHoverStyle(e, true)}
          onMouseLeave={(e) => buttonHoverStyle(e, false)}
          className="px-5 py-2.5 text-xs tracking-wide rounded-full transition-all"
          style={{ backgroundColor: '#FEE500', color: '#3C1E1E' }}
        >
          카카오톡
        </button>
        <button
          onClick={handleCopyLink}
          onMouseEnter={(e) => buttonHoverStyle(e, true)}
          onMouseLeave={(e) => buttonHoverStyle(e, false)}
          className="px-5 py-2.5 text-xs tracking-wide rounded-full transition-all"
          style={{ backgroundColor: '#F5F0EB', color: '#666' }}
        >
          링크복사
        </button>
      </div>

      <p className="text-center text-xs mt-16" style={{ color: '#CCC' }}>
        dear drawer
      </p>
    </section>
  )
}
