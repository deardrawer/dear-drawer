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
              if (typeof window !== 'undefined' && (window as any).Kakao) {
                const Kakao = (window as any).Kakao
                if (!Kakao.isInitialized()) {
                  Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY || '')
                }
                Kakao.Share.sendDefault({
                  objectType: 'feed',
                  content: {
                    title: '결혼식에 초대합니다',
                    description: '소중한 분들을 결혼식에 초대합니다.',
                    imageUrl: '',
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
                alert('카카오톡 공유 기능을 사용할 수 없습니다.')
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
