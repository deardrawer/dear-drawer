'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import ParentsInvitationView from '@/components/parents/ParentsInvitationView'
import type { ParentsInvitationContent, GuestInfo } from '@/components/parents/types'

interface InvitationData {
  id: string
  template_id: string | null
  content: string | ParentsInvitationContent | null
  is_paid?: number | boolean
}

// 핸드폰 프레임 스타일
const frameStyles = `
  @media (min-width: 768px) {
    .desktop-frame-wrapper {
      min-height: 100vh;
      background: linear-gradient(135deg, #f8f8f8 0%, #e8e8e8 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px 20px 40px;
    }

    .mobile-frame {
      position: relative;
      width: 390px;
      min-height: 844px;
      background: #1a1a1a;
      border-radius: 50px;
      padding: 12px;
      box-shadow:
        0 50px 100px rgba(0,0,0,0.25),
        0 30px 60px rgba(0,0,0,0.15),
        inset 0 0 0 2px rgba(255,255,255,0.1);
    }

    .mobile-frame::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 150px;
      height: 30px;
      background: #1a1a1a;
      border-radius: 0 0 20px 20px;
      z-index: 10;
    }

    .mobile-frame::after {
      content: '';
      position: absolute;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      width: 80px;
      height: 8px;
      background: #333;
      border-radius: 10px;
      z-index: 11;
    }

    .mobile-frame-screen {
      width: 100%;
      height: 844px;
      background: #fff;
      border-radius: 40px;
      overflow: hidden;
      position: relative;
      border: 8px solid #722F37;
      box-sizing: border-box;
    }

    .mobile-frame-content {
      width: 100%;
      height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
    }

    .mobile-frame-content::-webkit-scrollbar {
      display: none;
    }

    .mobile-frame-content {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  }

  @media (max-width: 767px) {
    .desktop-frame-wrapper {
      min-height: 100vh;
    }

    .mobile-frame {
      min-height: 100vh;
    }

    .mobile-frame-screen {
      min-height: 100vh;
    }

    .mobile-frame-content {
      min-height: 100vh;
    }
  }
`

export default function InvitationPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const inviteId = params.inviteId as string
  const guestId = searchParams.get('guest')
  const isPreview = searchParams.get('preview') === 'true'

  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // 청첩장 정보 조회
        const inviteRes = await fetch(`/api/invite/${inviteId}`)
        if (!inviteRes.ok) {
          throw new Error('청첩장을 찾을 수 없습니다')
        }
        const inviteData: { invitation?: unknown } = await inviteRes.json()
        setInvitation(inviteData.invitation as typeof invitation)

        // 게스트 정보 조회 (파라미터가 있는 경우)
        if (guestId) {
          const guestRes = await fetch(`/api/invite/${inviteId}/guest/${guestId}`)
          if (guestRes.ok) {
            const guestData: unknown = await guestRes.json()
            setGuestInfo(guestData as typeof guestInfo)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [inviteId, guestId])

  // 로딩 화면
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#F5F3EE' }}
      >
        <div
          className="w-10 h-10 border-2 rounded-full animate-spin"
          style={{ borderColor: '#C9A962', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  // 에러 화면
  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: '#F5F3EE' }}
      >
        <div className="text-center">
          <p className="text-lg mb-2" style={{ color: '#666' }}>
            {error}
          </p>
        </div>
      </div>
    )
  }

  // content 파싱
  let parsedContent: ParentsInvitationContent | null = null
  if (invitation?.content) {
    try {
      parsedContent = typeof invitation.content === 'string'
        ? JSON.parse(invitation.content)
        : invitation.content
    } catch (e) {
      console.error('Failed to parse content:', e)
    }
  }

  // content가 없는 경우
  if (!parsedContent) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: '#F5F3EE' }}
      >
        <div className="text-center">
          <p className="text-lg mb-2" style={{ color: '#666' }}>
            청첩장 내용을 불러올 수 없습니다
          </p>
        </div>
      </div>
    )
  }

  // 결제 상태 확인
  const isPaid = invitation?.is_paid === 1 || invitation?.is_paid === true

  // Parents 템플릿으로 렌더링
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: frameStyles }} />
      <div className="desktop-frame-wrapper">
        {/* 결제 안내 배너 - 핸드폰 프레임 밖 상단 */}
        {!isPaid && !isPreview && (
          <div
            style={{
              width: '100%',
              maxWidth: '390px',
              marginBottom: '16px',
              padding: '12px 16px',
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <span
              style={{
                color: 'rgba(255, 255, 255, 0.95)',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              결제 후 워터마크가 제거됩니다
            </span>
          </div>
        )}
        <div className="mobile-frame">
          <div className="mobile-frame-screen">
            <div className="mobile-frame-content">
              <ParentsInvitationView
                data={parsedContent}
                guestInfo={guestInfo}
                isPreview={false}
                isPaid={isPaid || isPreview}
                hideInternalFrame={true}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
