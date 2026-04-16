'use client'

import { useMemo } from 'react'
import InvitationClientEssay from '@/app/i/[slug]/InvitationClientEssay'
import type { EssayInvitationData } from './page'

interface EssayPreviewProps {
  data: EssayInvitationData
  fullscreen?: boolean
}

export default function EssayPreview({ data, fullscreen }: EssayPreviewProps) {
  const isBook = data.designConcept === 'book'

  // 에디터의 EssayInvitationData를 InvitationClientEssay가 요구하는 content 형식으로 변환
  const content = useMemo(() => ({
    groom: data.groom,
    bride: data.bride,
    wedding: data.wedding,
    intro: data.intro,
    greeting: data.greeting,
    chapters: data.chapters,
    interviews: data.interviews,
    quote: data.quote,
    thankYou: data.thankYou,
    contentMode: data.contentMode,
    designConcept: data.designConcept || 'default',
    colorTheme: data.colorTheme || 'essay-ivory',
    highlightColor: data.highlightColor,
    fontStyle: data.fontStyle || 'modern',
    fontSizeLevel: data.fontSizeLevel || 0,
    bgm: data.bgm,
    media: data.media,
    design: data.design,
    content: data.content,
    info: data.info,
    sectionVisibility: data.sectionVisibility,
    rsvpEnabled: data.rsvpEnabled,
    rsvpDeadline: data.rsvpDeadline,
    rsvpMealOption: data.rsvpMealOption,
    rsvpShuttleOption: data.rsvpShuttleOption,
    rsvpNotice: data.rsvpNotice,
    deceasedDisplayStyle: data.deceasedDisplayStyle,
    meta: data.meta,
  }), [data, fullscreen])

  // InvitationClientEssay가 요구하는 invitation 객체 형식으로 변환
  const invitation = useMemo(() => ({
    id: data.id || 'preview',
    groom_name: data.groom.name,
    bride_name: data.bride.name,
    wedding_date: data.wedding.date,
    wedding_time: data.wedding.timeDisplay,
    venue_name: data.wedding.venue.name,
    venue_address: data.wedding.venue.address,
    greeting_message: data.greeting,
    content: JSON.stringify(content),
    is_paid: 1,
    is_published: 0,
  }), [data, content])

  return (
    <div
      className={`h-full ${!fullscreen ? (isBook ? 'essay-preview-book-container' : 'essay-preview-scroll-container') : 'overflow-y-auto'}`}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Preview: fixed→absolute 변환 + min-h-screen→container 높이 변환 + 데스크탑 wrapper 위치 보정 */}
      {!fullscreen && (
        <style>{`
          .essay-preview-book-container,
          .essay-preview-scroll-container {
            position: relative;
            container-type: size;
          }
          .essay-preview-book-container {
            overflow: hidden;
          }
          .essay-preview-scroll-container {
            overflow-y: auto;
          }
          .essay-preview-book-container .fixed,
          .essay-preview-scroll-container .fixed {
            position: absolute !important;
          }
          .essay-preview-book-container .min-h-screen,
          .essay-preview-scroll-container .min-h-screen {
            min-height: 100cqh !important;
          }
          .essay-preview-book-container .bk-page {
            min-height: calc(100cqh - 80px) !important;
          }
          /* 데스크탑 wrapper의 viewport 기준 위치 계산을 컨테이너 기준으로 리셋 */
          .essay-preview-book-container .essay-book-desktop-wrapper {
            display: block !important;
            height: 100% !important;
            min-height: 100% !important;
            background: transparent !important;
          }
          .essay-preview-book-container .essay-book-desktop-wrapper > .essay-font-container {
            width: 100% !important;
            max-width: 100% !important;
            height: 100% !important;
            position: relative !important;
            box-shadow: none !important;
          }
          .essay-preview-book-container.essay-preview-book-container .essay-book-desktop-wrapper .fixed.inset-0 {
            left: 0 !important;
            right: 0 !important;
            top: 0 !important;
            bottom: 0 !important;
            width: auto !important;
          }
          .essay-preview-book-container.essay-preview-book-container .essay-book-desktop-wrapper .fixed.left-0:not(.inset-0) {
            left: 0 !important;
          }
          .essay-preview-book-container.essay-preview-book-container .essay-book-desktop-wrapper .fixed.right-0:not(.inset-0) {
            right: 0 !important;
            left: auto !important;
          }
          .essay-preview-book-container.essay-preview-book-container .essay-book-desktop-wrapper .fixed.top-0:not(.inset-0) {
            top: 0 !important;
          }
          .essay-preview-book-container.essay-preview-book-container .essay-book-desktop-wrapper .fixed.bottom-0:not(.inset-0) {
            bottom: 0 !important;
          }
          .essay-preview-book-container.essay-preview-book-container .essay-book-desktop-wrapper > button.fixed {
            right: 16px !important;
            left: auto !important;
          }
          .essay-preview-book-container.essay-preview-book-container .essay-book-desktop-wrapper .bk-arrow-left {
            left: 6px !important;
          }
          .essay-preview-book-container.essay-preview-book-container .essay-book-desktop-wrapper .bk-arrow-right {
            right: 6px !important;
            left: auto !important;
          }
          .essay-preview-book-container.essay-preview-book-container .essay-book-desktop-wrapper .fixed.bottom-0.left-0.right-0 {
            left: 0 !important;
            right: 0 !important;
          }
          /* scroll/paper 컨셉의 데스크탑 wrapper도 프리뷰에서는 리셋 */
          .essay-preview-scroll-container .essay-desktop-wrapper {
            display: block !important;
            min-height: 100% !important;
            background: transparent !important;
          }
          .essay-preview-scroll-container .essay-desktop-wrapper > .essay-font-container {
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
          }
          .essay-preview-scroll-container .essay-desktop-wrapper > button.fixed {
            right: 16px !important;
            left: auto !important;
            top: 16px !important;
          }
        `}</style>
      )}
      <InvitationClientEssay
        invitation={invitation as any}
        content={content}
        isPaid={true}
        isPreview={true}
      />
    </div>
  )
}
