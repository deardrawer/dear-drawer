'use client'

import Link from 'next/link'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqItems = [
  {
    question: '후기이벤트 어떻게 참여하나요?',
    answer: `네이버 블로그에 디어드로어 청첩장 사용 후기를 작성해주시면 참여하실 수 있습니다.\n\n• 네이버 블로그: 제목에 디어드로어 포함, 사진 3장 이상 업로드\n\nURL을 카카오톡 채널로 남겨주시면 확인 후 이벤트코드를 전달드립니다.`,
  },
  {
    question: '미리 만들고 사진 수정은 계속 가능한가요?',
    answer: `네, 가능합니다! 청첩장을 먼저 만들어두고, 사진이나 내용은 언제든지 수정할 수 있습니다. 내 청첩장 목록에서 수정할 청첩장을 선택하면 편집 화면으로 이동하며, 사진 교체·크롭·텍스트 수정 등 모든 항목을 자유롭게 변경하실 수 있습니다.`,
  },
  {
    question: '혼주용 청첩장은 양가 다르게 커스텀 공유가 가능한가요?',
    answer: `네, 가능합니다. 혼주용(부모님이 보내는) 청첩장은 신랑측/신부측 각각 별도로 제작하실 수 있습니다. 청첩장 만들기에서 혼주용 템플릿을 선택한 뒤, 신랑측과 신부측을 각각 만들어 다른 링크로 공유하시면 됩니다.`,
  },
  {
    question: '세부 내용은 커스텀이 어렵나요?',
    answer: `아닙니다! 각 템플릿별로 6~10개의 섹션이 제공되며, 텍스트·사진·배경음악·컬러 등 대부분의 요소를 자유롭게 커스텀하실 수 있습니다. OUR/FAMILY 템플릿은 스토리 초안 기능을 활용하면 질문에 답하는 것만으로 맞춤형 스토리도 자동 생성됩니다. 추가적인 커스텀이 필요하시면 카카오톡으로 문의해주세요.`,
  },
  {
    question: '식 몇 주 뒤에 삭제되나요?',
    answer: `• 결제 완료된 청첩장: 예식일로부터 30일 후 자동 삭제 예정입니다.\n• 미결제 청첩장: 생성일로부터 7일 후 자동 삭제 예정입니다.\n\n내 청첩장 목록에서 남은 기간을 확인하실 수 있습니다.`,
  },
  {
    question: '결제 완료했는데 미결제로 뜨고 있어요.',
    answer: `결제 후 내 청첩장보기 > 해당 청첩장의 대시보드 > 워터마크 제거하기 > 주문번호, 주문자명, 연락처를 입력해주세요. (새벽시간에는 확인이 어렵습니다.) 입력 후에도 미결제로 표시된다면 카카오톡으로 문의해주시면 빠르게 확인 도와드리겠습니다.`,
  },
  {
    question: '디어드로어(청첩장 모임 관리 서비스)는 언제부터 이용가능한가요?',
    answer: `청첩장 모임 관리 서비스는 워터마크 제거 후 이용 가능합니다! 내 청첩장 목록에서 '청첩장 모임관리' 버튼을 통해 바로 이용하실 수 있으며, 이벤트 관리·참석자 관리·포토부스 등 다양한 기능을 제공합니다.`,
  },
  {
    question: '게스트북 내용은 어떻게 삭제하나요?',
    answer: `내 청첩장 > 해당 청첩장의 대시보드 > 방명록 관리 탭에서 삭제할 수 있습니다. 각 메시지 옆의 '삭제' 버튼을 눌러 개별적으로 삭제하실 수 있습니다.`,
  },
  {
    question: '커스텀 URL을 설정할 수 있나요?',
    answer: `네, 가능합니다! 청첩장 편집 화면에서 원하시는 URL을 직접 설정하실 수 있습니다. 예를 들어 invite.deardrawer.com/i/minho-jiyoung 처럼 두 분의 이름이나 원하는 문구로 만들 수 있습니다. 이미 사용 중인 URL은 자동으로 중복 확인되며, 설정 후에도 언제든 변경 가능합니다.`,
  },
]

export default function FaqPage() {
  return (
    <div className="container mx-auto max-w-3xl py-20 px-6">
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
        자주 묻는 질문
      </h1>
      <p className="text-sm text-gray-500 mb-10">
        고객님들이 자주 묻는 질문을 모았습니다.
      </p>

      <Accordion type="single" collapsible className="w-full">
        {faqItems.map((item, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left text-sm font-medium text-gray-900 hover:no-underline">
              Q{index + 1}. {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-12 p-6 bg-gray-50 rounded-xl text-center">
        <p className="text-sm text-gray-700 mb-1">
          원하시는 답변을 찾지 못하셨나요?
        </p>
        <p className="text-sm text-gray-500 mb-4">
          카카오톡 채널로 편하게 문의해주세요.
        </p>
        <a
          href="https://pf.kakao.com/_bEpxen/chat"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FEE500] text-[#3C1E1E] text-sm font-medium rounded-full hover:bg-[#FDD800] transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3c-5.52 0-10 3.58-10 8 0 2.84 1.86 5.33 4.66 6.73-.15.54-.96 3.48-1 3.64 0 .07.02.14.08.19.06.05.14.06.21.03.28-.04 3.22-2.12 4.55-3 .49.07.99.11 1.5.11 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
          </svg>
          카카오톡 문의하기
        </a>
      </div>
    </div>
  )
}
