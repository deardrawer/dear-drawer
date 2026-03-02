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
      className={`h-full ${isBook && !fullscreen ? 'essay-preview-book-container' : 'overflow-y-auto'}`}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Book 컨셉: fixed→absolute 변환으로 사이드 패널 안에 가둠 */}
      {isBook && !fullscreen && (
        <style>{`
          .essay-preview-book-container {
            overflow: hidden;
            position: relative;
            container-type: size;
          }
          .essay-preview-book-container .fixed {
            position: absolute !important;
          }
          .essay-preview-book-container .min-h-screen {
            min-height: 100cqh !important;
          }
          .essay-preview-book-container .bk-page {
            min-height: calc(100cqh - 80px) !important;
          }
        `}</style>
      )}
      <InvitationClientEssay
        invitation={invitation as any}
        content={content}
        isPaid={true}
        isPreview={true}
        skipIntro={true}
      />
    </div>
  )
}
