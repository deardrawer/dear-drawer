'use client'

import { useMemo } from 'react'
import InvitationClientExhibit from '@/app/i/[slug]/InvitationClientExhibit'
import type { FeedInvitationData } from './page'

interface FeedPreviewProps {
  data: FeedInvitationData
  fullscreen?: boolean
}

export default function FeedPreview({ data, fullscreen: _fullscreen }: FeedPreviewProps) {
  // 에디터의 FeedInvitationData를 InvitationClientExhibit이 요구하는 content 형식으로 변환
  const content = useMemo(() => ({
    groom: data.groom,
    bride: data.bride,
    wedding: data.wedding,
    media: {
      ...data.media,
      coverImages: data.media.coverImages || (data.media.coverImage ? [data.media.coverImage] : []),
    },
    content: data.content,
    rooms: data.rooms,
    gallery: { images: data.rooms.flatMap((r) => r.images) },
    youtube: data.youtube,
    bgm: data.bgm,
    rsvpEnabled: data.rsvpEnabled,
    rsvpDeadline: data.rsvpDeadline,
    rsvpAllowGuestCount: data.rsvpAllowGuestCount,
    sectionVisibility: data.sectionVisibility,
    accounts: data.accounts,
    displayId: data.displayId,
    galleryPreviewCount: data.galleryPreviewCount,
    meta: data.meta,
    design: {},
    templateId: 'exhibit',
    colorTheme: 'exhibit-white',
    fontStyle: 'modern',
  }), [data])

  // InvitationClientExhibit이 요구하는 invitation 객체 형식으로 변환
  const invitation = useMemo(() => ({
    id: data.id || 'preview',
    groom_name: data.groom.name,
    bride_name: data.bride.name,
    wedding_date: data.wedding.date,
    wedding_time: data.wedding.timeDisplay,
    venue_name: data.wedding.venue.name,
    venue_address: data.wedding.venue.address,
    greeting_message: data.content.greeting,
    content: JSON.stringify(content),
    is_paid: 1,
    is_published: 0,
  }), [data, content])

  return (
    <div
      className="overflow-y-auto h-full"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <InvitationClientExhibit
        invitation={invitation}
        content={content}
        isPaid={true}
        isPreview={true}
        skipIntro={true}
      />
    </div>
  )
}
