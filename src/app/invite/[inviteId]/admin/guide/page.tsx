'use client'

import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/admin/ui/Button'

interface GuideStep {
  icon: string
  title: string
  description: string
  details: string[]
}

const guideSteps: GuideStep[] = [
  {
    icon: '🔐',
    title: '시작하기',
    description: 'PIN 번호로 관리 페이지에 접속하세요',
    details: [
      '처음 접속 시: 4자리 PIN 번호를 새로 설정해요',
      '재접속 시: 설정한 PIN 번호를 입력해요',
      'PIN 번호는 관리 페이지에서 변경할 수 있어요',
    ],
  },
  {
    icon: '👥',
    title: '게스트 추가하기',
    description: '초대할 분들의 정보를 등록하세요',
    details: [
      '이름: 받는 분의 성함을 입력해요',
      '관계: 이모, 삼촌 등 관계를 입력해요 (선택)',
      '호칭: 님께, 께, 에게 중 선택해요',
      '인사말: 템플릿을 선택하거나 직접 작성해요',
    ],
  },
  {
    icon: '📤',
    title: '링크 공유하기',
    description: '게스트별 맞춤 링크를 공유하세요',
    details: [
      '각 게스트에게 개별 링크가 생성돼요',
      '링크 복사: 클립보드에 복사됩니다',
      '카카오톡 공유: 바로 전송할 수 있어요',
      '전체 링크 복사: 모든 링크를 한번에 복사해요',
    ],
  },
  {
    icon: '📋',
    title: 'RSVP 확인하기',
    description: '참석 여부를 한눈에 확인하세요',
    details: [
      '참석/불참 응답을 실시간으로 확인해요',
      '예상 인원 수가 자동으로 계산돼요',
      '하객분들의 축하 메시지도 볼 수 있어요',
    ],
  },
]

export default function AdminGuidePage() {
  const params = useParams()
  const router = useRouter()
  const inviteId = params.inviteId as string

  const handleGoToAdmin = () => {
    router.push(`/invite/${inviteId}/admin`)
  }

  return (
    <div
      className="min-h-screen pb-24"
      style={{ backgroundColor: '#F5F3EE' }}
    >
      {/* 헤더 */}
      <header
        className="sticky top-0 z-40 px-4 py-4"
        style={{ backgroundColor: '#F5F3EE', borderBottom: '1px solid #E8E4DD' }}
      >
        <div className="text-xs tracking-[2px]" style={{ color: '#C9A962' }}>
          USER GUIDE
        </div>
        <h1 className="text-lg font-semibold" style={{ color: '#2C2C2C' }}>
          게스트 관리 사용 가이드
        </h1>
      </header>

      {/* 인트로 */}
      <div className="px-4 py-6">
        <div
          className="p-5 rounded-2xl text-center"
          style={{ backgroundColor: '#FFF' }}
        >
          <div className="text-4xl mb-3">💌</div>
          <h2 className="text-base font-semibold mb-2" style={{ color: '#2C2C2C' }}>
            소중한 분들께 청첩장을 보내세요
          </h2>
          <p className="text-sm" style={{ color: '#888' }}>
            게스트별 맞춤 인사말이 담긴<br />
            특별한 모바일 청첩장을 공유할 수 있어요
          </p>
        </div>
      </div>

      {/* 가이드 단계들 */}
      <div className="px-4 space-y-4">
        {guideSteps.map((step, index) => (
          <div
            key={index}
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: '#FFF' }}
          >
            {/* 단계 헤더 */}
            <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid #F5F3EE' }}>
              <span className="text-2xl">{step.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: '#C9A962', color: '#FFF' }}
                  >
                    STEP {index + 1}
                  </span>
                  <span className="font-semibold" style={{ color: '#2C2C2C' }}>
                    {step.title}
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: '#888' }}>
                  {step.description}
                </p>
              </div>
            </div>

            {/* 단계 상세 */}
            <div className="px-5 py-4">
              <ul className="space-y-2">
                {step.details.map((detail, detailIndex) => (
                  <li key={detailIndex} className="flex items-start gap-2">
                    <span className="text-xs mt-0.5" style={{ color: '#C9A962' }}>•</span>
                    <span className="text-sm" style={{ color: '#555' }}>
                      {detail}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* 팁 섹션 */}
      <div className="px-4 py-6">
        <div
          className="p-5 rounded-2xl"
          style={{ backgroundColor: '#FFFBF0', border: '1px solid #F5E6B8' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">💡</span>
            <span className="font-semibold text-sm" style={{ color: '#8B7355' }}>
              유용한 팁
            </span>
          </div>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-xs mt-0.5" style={{ color: '#C9A962' }}>•</span>
              <span className="text-sm" style={{ color: '#8B7355' }}>
                인사말 템플릿을 미리 만들어두면 게스트 추가가 빨라져요
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-xs mt-0.5" style={{ color: '#C9A962' }}>•</span>
              <span className="text-sm" style={{ color: '#8B7355' }}>
                봉투 앞면에 관계와 호칭이 함께 표시돼요
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-xs mt-0.5" style={{ color: '#C9A962' }}>•</span>
              <span className="text-sm" style={{ color: '#8B7355' }}>
                열람 여부를 확인하면 누가 청첩장을 봤는지 알 수 있어요
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 py-4"
        style={{
          backgroundColor: '#F5F3EE',
          borderTop: '1px solid #E8E4DD',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
        }}
      >
        <div className="max-w-[480px] mx-auto">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleGoToAdmin}
          >
            관리 페이지로 이동
          </Button>
        </div>
      </div>
    </div>
  )
}
