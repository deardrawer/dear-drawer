'use client'

import { useEffect, useCallback, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ============================================================
// Types
// ============================================================

interface PreviewModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  type?: 'greeting' | 'profile' | 'story' | 'interview'
  tone?: string
  customContent?: ReactNode
}

// ============================================================
// Sample Content
// ============================================================

const SAMPLE_CONTENTS = {
  greeting: {
    sincere: `저희 두 사람이 사랑으로 만나
이제 한 길을 걸어가려 합니다.

긴 시간 서로를 알아가며
깊어진 마음을 모아
이 자리에서 영원을 약속합니다.

바쁘신 가운데 저희의 시작을
함께 축복해 주시면
더없는 기쁨이 되겠습니다.`,
    warm: `두 사람이 만나 사랑을 키우고
이제 함께 걸어갈 길 앞에 섰어요.

설레는 마음으로 서로의 손을 잡고
평생을 함께할 약속을 하려 해요.

소중한 분들과 함께 이 기쁨을 나누고 싶어
이렇게 초대장을 보내드려요.
와주시면 정말 감사하겠습니다.`,
    cheerful: `드디어! 저희가 결혼합니다!

오랜 연애 끝에 드디어 결혼이라는
새로운 챕터를 시작하게 되었어요.

맛있는 밥과 함께
저희의 행복한 시작을 축하해 주세요!

여러분의 축복이 저희에게
최고의 웨딩 선물이 될 거예요!`,
    concise: `두 사람이 하나 되어
새로운 시작을 알립니다.

함께해 주시면 감사하겠습니다.`
  },
  profile: {
    groom: `처음 만났을 때부터 느꼈어요.
이 사람과 함께라면 어떤 어려움도
함께 이겨낼 수 있겠다고.

그녀의 밝은 미소가 제 하루를 환하게 만들고,
따뜻한 말 한마디가 지친 마음을 녹여주죠.

이제 평생 그녀의 든든한 버팀목이 되어
함께 행복한 가정을 꾸려나가겠습니다.`,
    bride: `그는 제 이야기에 언제나 진지하게
귀 기울여주는 사람이에요.

함께 있으면 마음이 편안하고,
그의 웃음소리가 제 하루 중 가장
행복한 순간을 만들어줘요.

이제 평생 그의 곁에서
서로를 응원하며 살아가겠습니다.`
  },
  story: {
    first: `2020년 가을, 친구의 소개로
처음 만나게 되었어요.

첫 만남에서 나눈 대화가
새벽까지 이어졌고,
그때 이미 서로에게 빠져들었던 것 같아요.

공통 관심사였던 영화 이야기로
시작된 우리의 연애는
어느덧 3년이 넘는 시간을 함께했어요.`,
    together: `함께한 시간 동안 많은 일이 있었어요.
처음 함께 떠난 제주도 여행,
힘든 시기를 함께 이겨낸 순간들,
그리고 서로의 가족들과의 첫 만남까지.

매 순간 서로에게 의지하며
더 깊은 사랑을 키워왔어요.

때로는 다투기도 했지만,
그마저도 우리를 더 단단하게 만들었죠.`,
    preparation: `"평생 함께할래요?"

어느 봄날 저녁, 그가 건넨 말에
두근거리는 마음으로 "네"라고 답했어요.

그 후 약 6개월간의 준비 기간 동안
웨딩홀을 찾아다니고, 스드메를 준비하며
설레는 마음으로 이 날을 기다려왔어요.

드디어 여러분께 이 소식을 전하게 되어
정말 기쁩니다.`
  },
  interview: {
    sample: [
      {
        question: '결혼을 결심한 계기가 있나요?',
        groomAnswer: '힘든 일이 있을 때 가장 먼저 그녀 생각이 났어요. 이 사람과 평생 함께하고 싶다고 확신했죠.',
        brideAnswer: '그가 아플 때 간호하면서 느꼈어요. 이 사람의 곁을 지키고 싶다고요.'
      },
      {
        question: '결혼 생활에서 꼭 지키고 싶은 것은?',
        jointAnswer: '하루에 한 번은 꼭 대화하는 시간을 갖고, 서로에게 고마움을 표현하기로 약속했어요.'
      }
    ]
  }
}

// ============================================================
// Preview Modal Component
// ============================================================

export function PreviewModal({
  isOpen,
  onClose,
  title = '예시 미리보기',
  type = 'greeting',
  tone = 'warm',
  customContent
}: PreviewModalProps) {
  // ESC 키로 닫기
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  // 컨텐츠 가져오기
  const getContent = () => {
    if (customContent) return customContent

    switch (type) {
      case 'greeting':
        return SAMPLE_CONTENTS.greeting[tone as keyof typeof SAMPLE_CONTENTS.greeting] ||
               SAMPLE_CONTENTS.greeting.warm
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-blue-600 mb-2">신랑 소개</h4>
              <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {SAMPLE_CONTENTS.profile.groom}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-pink-600 mb-2">신부 소개</h4>
              <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {SAMPLE_CONTENTS.profile.bride}
              </p>
            </div>
          </div>
        )
      case 'story':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-rose-600 mb-2">연애의 시작</h4>
              <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {SAMPLE_CONTENTS.story.first}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-rose-600 mb-2">함께 성장한 시간</h4>
              <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {SAMPLE_CONTENTS.story.together}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-rose-600 mb-2">결혼 준비</h4>
              <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {SAMPLE_CONTENTS.story.preparation}
              </p>
            </div>
          </div>
        )
      case 'interview':
        return (
          <div className="space-y-4">
            {SAMPLE_CONTENTS.interview.sample.map((item, index) => (
              <div key={index} className="border-l-4 border-rose-200 pl-4 py-2">
                <p className="font-semibold text-gray-800 mb-2">
                  Q. {item.question}
                </p>
                {item.groomAnswer && (
                  <p className="text-gray-600 mb-1">
                    <span className="text-blue-600 font-medium">신랑:</span> {item.groomAnswer}
                  </p>
                )}
                {item.brideAnswer && (
                  <p className="text-gray-600 mb-1">
                    <span className="text-pink-600 font-medium">신부:</span> {item.brideAnswer}
                  </p>
                )}
                {item.jointAnswer && (
                  <p className="text-gray-600">
                    <span className="text-purple-600 font-medium">함께:</span> {item.jointAnswer}
                  </p>
                )}
              </div>
            ))}
          </div>
        )
      default:
        return null
    }
  }

  const toneLabel = {
    sincere: '진심 어린',
    warm: '따뜻한',
    cheerful: '밝고 경쾌한',
    concise: '간결한'
  }[tone] || tone

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h3 id="modal-title" className="text-xl font-bold text-gray-800">
              {title}
            </h3>
            {type === 'greeting' && tone && (
              <p className="text-sm text-gray-500 mt-0.5">
                {toneLabel} 톤 예시
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
            aria-label="닫기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
          <div className="bg-rose-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-rose-700 flex items-center gap-2">
              <span className="text-lg">💡</span>
              이런 느낌으로 만들어드려요!
            </p>
          </div>

          <div className="prose prose-sm max-w-none">
            {typeof getContent() === 'string' ? (
              <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {getContent()}
              </p>
            ) : (
              getContent()
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4">
          <Button
            onClick={onClose}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white"
          >
            확인
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default PreviewModal
