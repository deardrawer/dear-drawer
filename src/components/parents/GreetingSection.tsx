'use client'

import { useSectionHighlight } from './SectionHighlightContext'
import { useTheme } from './ThemeContext'

interface GreetingSectionProps {
  childName?: string
  greeting?: string
  parentSignature?: string
  senderSide?: 'groom' | 'bride'
}

export default function GreetingSection({
  childName = '서연',
  greeting = `서연이는 저희 부부에게
늘 선물 같은 아이였습니다.

어릴 적에는 소문날 만큼 많이 울던 아이였지만,
자라면서는 무엇이든 스스로 해내고
가족을 먼저 챙길 줄 아는,
마음이 참 단단한 딸로 컸습니다.

그런 서연이가 어느덧 서른둘이 되어
좋은 사람을 만나 새로운 가정을 꾸린다 하니
기쁨과 함께 여러 마음이 교차합니다.

이제는 저희 품을 떠나
남편과 함께 새로운 삶을 시작하는
서연이의 앞날에
따뜻한 축복과 응원을 보내주시길
부탁드립니다.`,
  parentSignature = '아버지 이○○ · 어머니 김○○',
  senderSide = 'bride',
}: GreetingSectionProps) {
  // 신랑측 혼주면 "아들", 신부측 혼주면 "딸"
  const childTitle = senderSide === 'groom' ? '아들' : '딸'
  const { ref, isActive, hasAppeared } = useSectionHighlight('greeting')
  const theme = useTheme()

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      className="min-h-screen flex flex-col items-center justify-center px-8 py-20 transition-all duration-500"
      style={{
        backgroundColor: theme.background,
        opacity: hasAppeared ? (isActive ? 1 : 0.3) : 0,
        transform: hasAppeared ? 'translateY(0)' : 'translateY(20px)',
        filter: isActive ? 'none' : 'grayscale(30%)',
      }}
    >
      <span className="text-2xl mb-8" style={{ color: theme.accent }}>
        ✦
      </span>

      <h2
        className="font-serif text-xl font-semibold tracking-wider mb-10 transition-colors duration-500"
        style={{ color: isActive ? theme.text : '#999' }}
      >
        저희 {childTitle} <span style={{ color: theme.accent }}>{childName}</span> 결혼합니다
      </h2>

      <div className="text-center mb-12 max-w-[300px]">
        <p
          className="font-serif text-sm leading-[1.8] transition-colors duration-500 whitespace-pre-line"
          style={{ color: isActive ? theme.textLight : '#999' }}
        >
          {greeting}
        </p>
      </div>

      <p
        className="mt-8 text-sm tracking-wide transition-colors duration-500"
        style={{ color: isActive ? theme.accent : `${theme.accent}80` }}
      >
        {parentSignature}
      </p>
    </section>
  )
}
