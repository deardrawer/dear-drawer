'use client'

import { useSectionHighlight } from './SectionHighlightContext'
import { useTheme } from './ThemeContext'

interface GreetingSectionProps {
  childName?: string
  greeting?: string
  parentSignature?: React.ReactNode
  senderSide?: 'groom' | 'bride'
}

// Staggered entrance animation helper
const stagger = (hasAppeared: boolean, delay: number) => ({
  opacity: hasAppeared ? 1 : 0,
  transform: hasAppeared ? 'translateY(0)' : 'translateY(18px)',
  transition: 'opacity 0.8s ease, transform 0.8s ease',
  transitionDelay: hasAppeared ? `${delay}s` : '0s',
})

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
  parentSignature = '아버지 이○○ · 어머니 김○○ 올림',
  senderSide = 'bride',
}: GreetingSectionProps) {
  const childTitle = senderSide === 'groom' ? '아들' : '딸'
  const { ref, isActive, hasAppeared } = useSectionHighlight('greeting')
  const theme = useTheme()

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      className="min-h-screen flex flex-col items-center justify-center px-8 py-20"
      style={{
        backgroundColor: theme.background,
        filter: isActive ? 'none' : 'grayscale(30%)',
        opacity: isActive ? 1 : 0.3,
        transition: 'filter 0.5s, opacity 0.5s',
      }}
    >
      {/* Ornament: horizontal line with center circle */}
      <div
        className="relative mb-10"
        style={{
          width: '48px',
          height: '1px',
          backgroundColor: theme.accent,
          ...stagger(hasAppeared, 0),
          transform: hasAppeared ? 'scaleX(1)' : 'scaleX(0)',
        }}
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            border: `1px solid ${theme.accent}`,
            backgroundColor: theme.background,
          }}
        />
      </div>

      {/* INVITATION label */}
      <span
        className="text-[11px] tracking-[6px] uppercase mb-7"
        style={{
          color: `${theme.accent}80`,
          fontWeight: 300,
          ...stagger(hasAppeared, 0.15),
        }}
      >
        invitation
      </span>

      <h2
        className="font-serif text-[19px] leading-[2] tracking-wider mb-9 text-center"
        style={{
          color: isActive ? theme.text : '#999',
          fontWeight: 300,
          ...stagger(hasAppeared, 0.3),
        }}
      >
        저희 {childTitle}{' '}
        <em
          className="not-italic"
          style={{ color: theme.primary, fontWeight: 400 }}
        >
          {childName}
        </em>
        {' '}결혼합니다
      </h2>

      <div
        className="text-center mb-12 max-w-[280px]"
        style={stagger(hasAppeared, 0.5)}
      >
        <p
          className="font-serif text-[13px] leading-[2.2] whitespace-pre-line"
          style={{ color: isActive ? theme.textLight : '#999', letterSpacing: '0.3px' }}
        >
          {greeting}
        </p>
      </div>

      {/* Signature area with short divider line */}
      {parentSignature && (
        <div
          className="flex flex-col items-center gap-2 mt-12"
          style={stagger(hasAppeared, 0.7)}
        >
          <div
            style={{
              width: '24px',
              height: '1px',
              backgroundColor: `${theme.accent}30`,
            }}
          />
          <p
            className="text-xs tracking-[3px]"
            style={{ color: isActive ? `${theme.accent}90` : `${theme.accent}50`, fontWeight: 300 }}
          >
            {parentSignature}
          </p>
        </div>
      )}
    </section>
  )
}
