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

      <div className="flex items-center justify-center gap-2">
        <button
          onClick={onKakaoShare}
          onMouseEnter={(e) => buttonHoverStyle(e, true)}
          onMouseLeave={(e) => buttonHoverStyle(e, false)}
          className="px-4 py-2 text-xs tracking-wide rounded-full transition-all"
          style={{ backgroundColor: '#F5F0EB', color: '#666' }}
        >
          카카오톡
        </button>
        <button
          onClick={onSmsShare}
          onMouseEnter={(e) => buttonHoverStyle(e, true)}
          onMouseLeave={(e) => buttonHoverStyle(e, false)}
          className="px-4 py-2 text-xs tracking-wide rounded-full transition-all"
          style={{ backgroundColor: '#F5F0EB', color: '#666' }}
        >
          문자
        </button>
        <button
          onClick={handleCopyLink}
          onMouseEnter={(e) => buttonHoverStyle(e, true)}
          onMouseLeave={(e) => buttonHoverStyle(e, false)}
          className="px-4 py-2 text-xs tracking-wide rounded-full transition-all"
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
