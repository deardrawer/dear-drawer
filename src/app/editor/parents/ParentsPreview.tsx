'use client'

import { useCallback, useEffect, useRef } from 'react'
import { ParentsInvitationView, EnvelopeScreen } from '@/components/parents'
import { COLOR_THEMES, FONT_STYLES } from '@/components/parents/types'
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
  data,
  fullscreen,
  activeTab = 'intro',
  onTabChange,
  selectedGuest,
  activeSection,
}: ParentsPreviewProps) {
  const previewContentRef = useRef<HTMLDivElement>(null)
  const prevActiveSectionRef = useRef<string | null>(null)

  // 테마 가져오기
  const theme = COLOR_THEMES[data.colorTheme || 'burgundy']

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

  // 부모님 서명 생성
  const senderSignature = data.sender.signature ||
    `아버지 ${data.sender.fatherName || '○○○'} · 어머니 ${data.sender.motherName || '○○○'} 드림`

  // 봉투 메시지 - 선택된 게스트의 맞춤 메시지가 있으면 사용
  const envelopeMessage = selectedGuest?.custom_message
    ? selectedGuest.custom_message.split('\n')
    : data.envelope.message

  const handleEnvelopeOpen = useCallback(() => {
    if (onTabChange) {
      onTabChange('main')
    }
  }, [onTabChange])

  return (
    <div className={`relative ${fullscreen ? 'w-full h-full' : 'w-full h-full'} overflow-hidden`}>
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
            fontClassName={fontStyle.className}
            fontFamily={fontStyle.cssVariable}
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
          {/* 라운드 테두리 - 스크롤과 무관하게 고정 */}
          <div
            style={{
              position: 'absolute',
              inset: '6px',
              border: `2px solid ${theme.primary}`,
              borderRadius: '26px',
              pointerEvents: 'none',
              zIndex: 9999,
              boxShadow: `0 0 0 100px ${theme.primary}`,
            }}
          />
        </>
      )}
    </div>
  )
}
