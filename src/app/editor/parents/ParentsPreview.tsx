'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { ParentsInvitationView, EnvelopeScreen } from '@/components/parents'
import { COLOR_THEMES, FONT_STYLES, resolveHeadingFont } from '@/components/parents/types'
import { buildParentsCover } from '@/components/parents/coverInfo'
import { fillParentsPreview } from '@/components/parents/sampleContent'
import type { ParentsInvitationData } from './page'

interface ParentsPreviewProps {
  data: ParentsInvitationData
  fullscreen?: boolean
  activeTab?: 'intro' | 'main'
  onTabChange?: (tab: 'intro' | 'main') => void
  selectedGuest?: { name: string; honorific: string; relation?: string; intro_greeting?: string; custom_message?: string } | null
  activeSection?: string | null
}

export default function ParentsPreview({
  data: rawData,
  fullscreen,
  activeTab = 'intro',
  onTabChange,
  selectedGuest,
  activeSection,
}: ParentsPreviewProps) {
  const previewContentRef = useRef<HTMLDivElement>(null)
  // 미리보기 전용 샘플 채우기 — 비어 있는 칸만 샘플 내용으로 보여줌 (저장 · 입력칸에는 영향 없음)
  const data = useMemo(() => fillParentsPreview(rawData), [rawData])
  const prevActiveSectionRef = useRef<string | null>(null)

  // 테마 가져오기 (커스텀 색상 오버라이드)
  const baseTheme = COLOR_THEMES[data.colorTheme || 'burgundy']
  const theme = {
    ...baseTheme,
    ...(data.customPrimaryColor && { primary: data.customPrimaryColor }),
    ...(data.customAccentColor && { accent: data.customAccentColor }),
    ...(data.customBackgroundColor && { background: data.customBackgroundColor }),
    ...(data.customTextColor && { text: data.customTextColor, textLight: data.customTextColor }),
    tintedBg: !!data.tintedBg,
    cardText: data.cardTextColor || baseTheme.text,
    cardTextLight: data.cardTextColor || baseTheme.textLight,
  }

  // 폰트 스타일 가져오기
  const fontStyle = FONT_STYLES[data.fontStyle || 'elegant']

  // activeSection이 변경되면 해당 섹션으로 스크롤 (실제로 변경된 경우에만)
  useEffect(() => {
    // activeSection이 실제로 변경되었는지 확인
    if (activeSection === prevActiveSectionRef.current) return
    prevActiveSectionRef.current = activeSection ?? null

    if (!activeSection) return

    // envelope 섹션이면 intro 탭으로 전환
    if (activeSection === 'envelope') {
      onTabChange?.('intro')
      return
    }

    // intro 탭인 경우 main 탭으로 전환
    if (activeTab === 'intro') {
      onTabChange?.('main')
      // 탭 전환 후 스크롤을 위해 약간의 딜레이
      setTimeout(() => {
        const element = document.getElementById(`preview-${activeSection}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
      return
    }

    // main 탭에서 스크롤
    const element = document.getElementById(`preview-${activeSection}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [activeSection, activeTab, onTabChange])

  // 게스트 정보 처리 - 선택된 게스트가 있으면 그 정보 사용
  const recipientName = selectedGuest?.name || data.envelope.defaultGreeting?.replace(/님께$|께$|님$|에게$/, '') || '소중한 분'
  const recipientTitle = selectedGuest?.honorific || data.envelope.defaultGreeting?.match(/님께$|께$|님$|에게$/)?.[0] || '께'

  // 부모님 서명 생성 (이름만, 호칭 없음, 비어있으면 빈 문자열 → 봉투에서 자동 숨김)
  const senderNames = [data.sender.fatherName, data.sender.motherName]
    .map(n => (n || '').trim())
    .filter(Boolean)
  const deceasedStyle = data.deceasedDisplayStyle || 'flower'
  const hasSenderDeceased = data.sender.fatherDeceased || data.sender.motherDeceased

  // 고인 표시 인라인 헬퍼
  const DeceasedMark = ({ style }: { style: 'hanja' | 'flower' }) =>
    style === 'hanja'
      ? <span className="inline-block mr-0.5 opacity-70" style={{ fontSize: 'inherit' }}>故</span>
      : <img src="/icons/chrysanthemum.svg" alt="고인" className="inline w-3 h-3 mr-0.5 opacity-70 align-middle" style={{ verticalAlign: 'middle', marginTop: '-2px' }} />

  const senderSignature = hasSenderDeceased && senderNames.length > 0 ? (
    <>
      {[
        { name: (data.sender.fatherName || '').trim(), deceased: data.sender.fatherDeceased },
        { name: (data.sender.motherName || '').trim(), deceased: data.sender.motherDeceased },
      ]
        .filter(p => p.name)
        .map((p, i) => (
          <span key={i}>
            {i > 0 && ' · '}
            {p.deceased && <DeceasedMark style={deceasedStyle} />}
            {p.name}
          </span>
        ))}
      {' 올림'}
    </>
  ) : (senderNames.length > 0 ? `${senderNames.join(' · ')} 올림` : '')

  // 봉투 메시지 - 선택된 게스트의 맞춤 메시지가 있으면 사용
  const envelopeMessage = selectedGuest?.custom_message
    ? selectedGuest.custom_message.split('\n')
    : data.envelope.message

  // C안 첫 화면 문구 (본문 ParentsInvitationView와 같은 규칙)
  const cover = buildParentsCover(data)

  const handleEnvelopeOpen = useCallback(() => {
    if (onTabChange) {
      onTabChange('main')
    }
  }, [onTabChange])

  return (
    <div className={`ed-preview relative ${fullscreen ? 'w-full h-full' : 'w-full h-full'} overflow-hidden`}>
      <style jsx global>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .preview-container .min-h-screen {
          min-height: auto !important;
        }
      `}</style>

      {activeTab === 'intro' ? (
        // 인트로 (봉투) 화면
        <div className="w-full h-full relative">
          <EnvelopeScreen
            recipientName={recipientName}
            recipientTitle={recipientTitle}
            recipientRelation={selectedGuest?.relation}
            greetingTo={selectedGuest?.intro_greeting}
            message={envelopeMessage}
            signature={senderSignature}
            onOpen={handleEnvelopeOpen}
            isPreview={!fullscreen}
            themeColor={theme.primary}
            accentColor={theme.accent}
            sealColor={data.sealColor}
            fontClassName={fontStyle.className}
            fontFamily={fontStyle.cssVariable}
            backgroundImage={data.envelope?.backgroundImage}
            backgroundImageSettings={data.envelope?.backgroundImageSettings}
            hintTextColor={data.envelope?.hintTextColor}
            textOnly={!!data.envelope?.textOnly}
            letterBg={data.envelope?.letterBg}
            captionColor={data.captionColor || data.customPrimaryColor || undefined}
            titleColor={data.titleColor}
            textDateLine={cover.textDateLine}
            textVenueLine={cover.textVenueLine}
            fromNames={cover.fromNames}
            deceasedStyle={data.deceasedDisplayStyle || 'flower'}
            coverNames={cover.coverNames}
            childLine={cover.childLine}
            dateVenueLine={cover.dateVenueLine}
            headingFontFamily={resolveHeadingFont(data.headingFont)}
            pointColor={data.customPrimaryColor || undefined}
          />
        </div>
      ) : (
        // 본문 화면
        <>
          <div ref={previewContentRef} className="hide-scrollbar preview-container w-full h-full overflow-y-auto">
            <ParentsInvitationView
              data={data}
              isPreview={true}
            />
          </div>
        </>
      )}
    </div>
  )
}
