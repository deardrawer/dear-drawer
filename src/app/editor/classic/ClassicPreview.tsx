'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import InvitationClientClassic from '@/app/i/[slug]/InvitationClientClassic'
import type { ClassicInvitationData } from './page'

interface ClassicPreviewProps {
  data: ClassicInvitationData
  fullscreen?: boolean
}

export default function ClassicPreview({ data, fullscreen }: ClassicPreviewProps) {
  const [tab, setTab] = useState<'intro' | 'main'>('intro')
  // 오프닝 연출 리셋용 key — 값이 바뀌면 InvitationClientClassic이 리마운트되어
  // 오프닝 애니메이션이 처음 상태로 초기화된다.
  const [resetKey, setResetKey] = useState(0)
  const openingStyle = data.content?.classicOpeningStyle
  const prevOpening = useRef(openingStyle)

  // 디자인 탭에서 오프닝 옵션을 바꾸면 → 인트로로 전환 + 처음부터 다시 보기
  useEffect(() => {
    if (prevOpening.current !== openingStyle) {
      prevOpening.current = openingStyle
      setTab('intro')
      setResetKey((k) => k + 1)
    }
  }, [openingStyle])

  // Intro 탭을 (다시) 누르면 오프닝을 처음부터 재생
  const showIntro = () => {
    setTab('intro')
    setResetKey((k) => k + 1)
  }
  // 에디터의 ClassicInvitationData를 InvitationClientClassic이 요구하는 content 형식으로 변환
  const content = useMemo(() => ({
    customAccentColor: data.customAccentColor,
    customBgColor: data.customBgColor,
    customSectionBgColor: data.customSectionBgColor,
    groom: data.groom,
    bride: data.bride,
    wedding: data.wedding,
    gallery: data.gallery,
    content: data.content,
    meta: data.meta,
  }), [data])

  // InvitationClientClassic이 요구하는 invitation 객체 형식으로 변환 (essay 프리뷰 패턴과 동일)
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
    <div className="h-full flex flex-col relative">
      {/* Intro / Main 토글 (풀스크린 미리보기에서는 숨김 — 인트로부터 실제 게스트처럼 표시)
          · 절대 오버레이로 띄워 프레임 높이를 잡아먹지 않게 → 인트로가 프레임 비율(9:18) 그대로 채워짐 */}
      {!fullscreen && (
      <div className="absolute top-0 left-0 right-0 z-30 pt-2.5 flex justify-center pointer-events-none">
        <div className="inline-flex items-center gap-1 p-1 rounded-full bg-gray-100/95 backdrop-blur border border-gray-200/70 shadow-inner pointer-events-auto">
          <button
            type="button"
            onClick={showIntro}
            className={`px-6 py-1.5 text-xs font-semibold tracking-wide rounded-full transition-all select-none ${tab === 'intro' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Intro
          </button>
          <button
            type="button"
            onClick={() => setTab('main')}
            className={`px-6 py-1.5 text-xs font-semibold tracking-wide rounded-full transition-all select-none ${tab === 'main' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Main
          </button>
        </div>
      </div>
      )}
      <div className="flex-1 min-h-0 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <InvitationClientClassic
          key={resetKey}
          invitation={invitation as any}
          content={content as any}
          isPaid={true}
          isPreview={true}
          skipIntro={fullscreen ? false : tab === 'main'}
          introClickAdvance={fullscreen}
        />
      </div>
    </div>
  )
}
