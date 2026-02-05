'use client'

import { useState } from 'react'

interface Guest {
  id: string
  name: string
  relation: string | null
  honorific: string
  intro_greeting: string | null
  greeting_template_id: string | null
  custom_message: string | null
  opened_count: number
  last_opened_at: string | null
  personalLink: string
  templateName: string | null
}

interface GuestListProps {
  guests: Guest[]
  inviteId: string
  onEdit: (guest: Guest) => void
  onDelete: (guestId: string) => void
  onAdd: () => void
  onShowToast: (message: string) => void
  kakaoThumbnail?: string
  groomName?: string
  brideName?: string
}

export default function GuestList({
  guests,
  inviteId,
  onEdit,
  onDelete,
  onAdd,
  onShowToast,
  kakaoThumbnail,
  groomName,
  brideName,
}: GuestListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      // 프로덕션 환경에서는 invite.deardrawer.com 사용
      if (window.location.hostname === 'localhost') {
        return window.location.origin
      }
      return 'https://invite.deardrawer.com'
    }
    return 'https://invite.deardrawer.com'
  }

  const getGuestLink = (guestId: string) => {
    const baseUrl = getBaseUrl()
    return `${baseUrl}/invite/${inviteId}?guest=${guestId}`
  }

  // 단일 링크 복사
  const handleCopyLink = async (guest: Guest) => {
    const link = getGuestLink(guest.id)

    try {
      await navigator.clipboard.writeText(link)
      setCopiedId(guest.id)
      setTimeout(() => setCopiedId(null), 2000)
      onShowToast('링크가 복사되었습니다')
    } catch {
      onShowToast('복사에 실패했습니다')
    }
  }

  // 전체 링크 일괄 복사
  const handleCopyAllLinks = async () => {
    if (guests.length === 0) {
      onShowToast('복사할 게스트가 없습니다')
      return
    }

    const links = guests.map((guest) => {
      const displayName = guest.relation
        ? `${guest.name} ${guest.relation}${guest.honorific.replace('께', '')}`
        : `${guest.name}${guest.honorific}`
      const link = getGuestLink(guest.id)
      return `${displayName}\n${link}`
    })

    const allLinks = links.join('\n\n')

    try {
      await navigator.clipboard.writeText(allLinks)
      onShowToast(`${guests.length}명의 링크가 복사되었습니다`)
    } catch {
      onShowToast('복사에 실패했습니다')
    }
  }

  // 카카오톡 공유 (SDK 방식)
  const handleKakaoShare = (guest: Guest) => {
    const link = getGuestLink(guest.id)
    const displayName = guest.relation
      ? `${guest.name} ${guest.relation}${guest.honorific}`
      : `${guest.name} ${guest.honorific}`

    const kakaoWindow = window as typeof window & {
      Kakao?: {
        isInitialized?: () => boolean
        init?: (key: string) => void
        Share?: { sendDefault: (config: object) => void }
      }
    }

    if (typeof window !== 'undefined' && kakaoWindow.Kakao) {
      try {
        // SDK 초기화 확인 및 초기화
        if (!kakaoWindow.Kakao.isInitialized?.()) {
          const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY || '0890847927f3189d845391481ead8ecc'
          kakaoWindow.Kakao.init?.(kakaoKey)
        }

        // Share 기능 사용 가능 여부 확인
        if (kakaoWindow.Kakao.Share?.sendDefault) {
          const coupleNames = groomName && brideName ? `${groomName} ♥ ${brideName}` : ''
          const shareTitle = coupleNames ? `${coupleNames} 결혼합니다` : '청첩장이 도착했습니다'

          kakaoWindow.Kakao.Share.sendDefault({
            objectType: 'feed',
            content: {
              title: shareTitle,
              description: `${displayName}께 전하는 청첩장입니다 💌`,
              imageUrl: kakaoThumbnail || 'https://invite.deardrawer.com/og-image.png',
              link: {
                mobileWebUrl: link,
                webUrl: link,
              },
            },
            buttons: [
              {
                title: '청첩장 보기',
                link: {
                  mobileWebUrl: link,
                  webUrl: link,
                },
              },
            ],
          })
        } else {
          // SDK가 아직 로딩 중 - 링크 복사로 대체
          navigator.clipboard.writeText(link)
          onShowToast('카카오톡 공유 준비 중입니다. 링크가 복사되었습니다.')
        }
      } catch (error) {
        console.error('Kakao share error:', error)
        navigator.clipboard.writeText(link)
        onShowToast('카카오톡 공유에 실패했습니다. 링크가 복사되었습니다.')
      }
    } else {
      // SDK 로드 안됨 - 링크 복사로 대체
      navigator.clipboard.writeText(link)
      onShowToast('카카오톡 공유를 사용할 수 없어 링크가 복사되었습니다')
    }
  }

  // 삭제 확인
  const handleDelete = (guestId: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      onDelete(guestId)
    }
  }

  // 인사말 타입 표시
  const getGreetingType = (guest: Guest) => {
    if (guest.templateName) {
      return guest.templateName
    }
    if (guest.custom_message) {
      return '맞춤형 인사말'
    }
    return '기본 인사말'
  }

  return (
    <div className="space-y-3">
      {/* 게스트 목록 */}
      {guests.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm font-medium" style={{ color: '#888' }}>
            등록된 게스트가 없습니다
          </p>
          <button
            onClick={onAdd}
            className="mt-4 text-sm font-medium underline"
            style={{ color: '#C9A962' }}
          >
            첫 게스트 추가하기
          </button>
        </div>
      ) : (
        <>
          {guests.map((guest) => (
            <div
              key={guest.id}
              className="p-4 rounded-xl"
              style={{ backgroundColor: '#F5F3EE' }}
            >
              {/* 상단: 게스트 정보 + 수정/삭제 */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold text-base" style={{ color: '#2C2C2C' }}>
                    {guest.name}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-sm" style={{ color: '#666' }}>
                    {guest.relation && (
                      <>
                        <span>{guest.relation}</span>
                        <span style={{ color: '#CCC' }}>·</span>
                      </>
                    )}
                    <span>{getGreetingType(guest)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {/* 수정 */}
                  <button
                    onClick={() => onEdit(guest)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: '#FFF',
                      color: '#666',
                      border: '1px solid #E8E4DD',
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    수정
                  </button>

                  {/* 삭제 */}
                  <button
                    onClick={() => handleDelete(guest.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: '#FEF2F2',
                      color: '#DC2626',
                      border: '1px solid #FECACA',
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    삭제
                  </button>
                </div>
              </div>

              {/* 하단: 공유 버튼들 */}
              <div className="flex items-center gap-2">
                {/* 미리보기 */}
                <a
                  href={getGuestLink(guest.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium"
                  style={{
                    backgroundColor: '#FFF',
                    color: '#666',
                    border: '1px solid #E8E4DD',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  미리보기
                </a>

                {/* 링크 복사 */}
                <button
                  onClick={() => handleCopyLink(guest)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all"
                  style={{
                    backgroundColor: copiedId === guest.id ? '#C9A962' : '#FFF',
                    color: copiedId === guest.id ? '#FFF' : '#666',
                    border: '1px solid #E8E4DD',
                  }}
                >
                  {copiedId === guest.id ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      복사됨
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                      링크복사
                    </>
                  )}
                </button>

                {/* 카카오톡 공유 */}
                <button
                  onClick={() => handleKakaoShare(guest)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium"
                  style={{
                    backgroundColor: '#FEE500',
                    color: '#191919',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3C6.48 3 2 6.58 2 11c0 2.8 1.86 5.25 4.64 6.64-.15.54-.97 3.48-1 3.62 0 .08.03.16.09.21.05.04.12.06.19.06.1 0 .21-.04.32-.12 1.16-.82 4.26-3.02 4.9-3.5.61.06 1.23.09 1.86.09 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
                  </svg>
                  카카오톡
                </button>
              </div>
            </div>
          ))}

          {/* 하단 버튼들 */}
          <div className="pt-4 space-y-3">
            {/* 전체 링크 일괄 복사 */}
            <button
              onClick={handleCopyAllLinks}
              className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
              style={{
                backgroundColor: '#F5F3EE',
                color: '#666',
                border: '1px dashed #D0D0D0',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              전체 링크 일괄 복사 ({guests.length}명)
            </button>

            {/* 게스트 추가 */}
            <button
              onClick={onAdd}
              className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{
                backgroundColor: '#C9A962',
                color: '#FFF',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              게스트 추가
            </button>
          </div>
        </>
      )}
    </div>
  )
}
