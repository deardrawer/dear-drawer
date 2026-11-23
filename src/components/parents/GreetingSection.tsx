'use client'

import { useSectionHighlight } from './SectionHighlightContext'
import { C_TXT, C_KSERIF, DEFAULT_GREETING_TITLE, cBody, cCaption, cDim, cStagger, cTitle } from './cStyle'

interface GreetingSectionProps {
  title?: string  // 인사말 제목 (비우면 기본 문구, 줄바꿈 가능)
  childName?: string
  greeting?: string
  parentSignature?: React.ReactNode
  senderSide?: 'groom' | 'bride'
}

export default function GreetingSection({
  title,
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
}: GreetingSectionProps) {
  // childName · senderSide 는 호환용 — 자녀 호칭 문장(저희 딸 ○○이가 결혼합니다)은 첫 화면(EnvelopeScreen)에 표시
  const { ref, isActive, hasAppeared } = useSectionHighlight('greeting')

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      style={{ backgroundColor: 'transparent', padding: '88px 32px 72px', ...cDim(isActive) }}
    >
      <p style={{ ...cCaption, ...cStagger(hasAppeared, 0.15) }}>모시는 글</p>
      <h2 style={{ ...cTitle(23, 12), whiteSpace: 'pre-line', ...cStagger(hasAppeared, 0.3) }}>
        {(title || '').trim() || DEFAULT_GREETING_TITLE}
      </h2>

      {greeting && (
        <p style={{ ...cBody(26), whiteSpace: 'pre-line', ...cStagger(hasAppeared, 0.5) }}>
          {greeting}
        </p>
      )}

      {parentSignature && (
        <p style={{ marginTop: 32, marginBottom: 0, fontFamily: C_KSERIF, fontSize: 15.5, color: C_TXT, ...cStagger(hasAppeared, 0.7) }}>
          {parentSignature}
        </p>
      )}
    </section>
  )
}
