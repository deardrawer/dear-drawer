'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import SocialProofCounter from '@/components/social-proof/SocialProofCounter'

// 랜덤 슬러그 생성
const generateRandomSlug = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const randomPart = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `invitation-${randomPart}`
}

type TemplateCategory = null | 'story' | 'mini' | 'parents'
type QuizStep = 'q1' | 'q2a' | 'q2b' | 'q3a' | 'q3b' | 'result' | null

// 퀴즈 결과 데이터
const QUIZ_RESULTS: Record<string, {
  templateId: string
  templateName: string
  category: string
  categoryLabel: string
  tagline: string
  color: string
  colorBg: string
  colorBorder: string
  points: string[]
  sampleUrl: string
}> = {
  'narrative-our': {
    templateId: 'narrative-our',
    templateName: 'OUR',
    category: 'story',
    categoryLabel: '스토리형',
    tagline: '우리만의 페이지를 천천히 넘기고 싶다면',
    color: 'text-rose-500',
    colorBg: 'bg-rose-500',
    colorBorder: 'border-rose-200',
    points: [
      '풍부한 서사로 우리 이야기를 깊이 있게 전달',
      'AI가 답변을 바탕으로 감동적인 스토리 생성',
      '장기연애, 특별한 에피소드가 있는 커플에게 딱',
    ],
    sampleUrl: '/i/sample-our',
  },
  'narrative-family': {
    templateId: 'narrative-family',
    templateName: 'FAMILY',
    category: 'story',
    categoryLabel: '스토리형',
    tagline: '우리의 시작을 가능하게 해준 이야기를 함께 담고 싶다면',
    color: 'text-blue-500',
    colorBg: 'bg-blue-500',
    colorBorder: 'border-blue-200',
    points: [
      '양가 부모님의 축하 인사말을 함께 담을 수 있어요',
      '서로가 선택한 이유를 신랑/신부 소개로 전달',
      '가족의 축복이 느껴지는 따뜻한 청첩장',
    ],
    sampleUrl: '/i/sample-family',
  },
  'narrative-magazine': {
    templateId: 'narrative-magazine',
    templateName: 'MAGAZINE',
    category: 'mini',
    categoryLabel: '미니 스토리형',
    tagline: '덜어낼수록 더 세련되게',
    color: 'text-gray-800',
    colorBg: 'bg-gray-900',
    colorBorder: 'border-gray-200',
    points: [
      '매거진 인터뷰 형식의 모던한 레이아웃',
      'Q&A로 서로를 소개하는 세련된 구성',
      '스튜디오 촬영 사진과 찰떡 궁합',
    ],
    sampleUrl: '/i/sample-magazine',
  },
  'narrative-film': {
    templateId: 'narrative-film',
    templateName: 'MOVIE',
    category: 'mini',
    categoryLabel: '미니 스토리형',
    tagline: '한 편의 영화처럼, 장면으로 기억되길',
    color: 'text-gray-600',
    colorBg: 'bg-gray-500',
    colorBorder: 'border-gray-200',
    points: [
      '시네마틱한 무드의 독특한 연출',
      '야외/스냅 사진이 영화 장면처럼 연출돼요',
      '남들과 다른 분위기를 원하는 커플에게',
    ],
    sampleUrl: '/i/sample-film',
  },
  'narrative-record': {
    templateId: 'narrative-record',
    templateName: 'RECORD',
    category: 'mini',
    categoryLabel: '미니 스토리형',
    tagline: '우리의 감정을 플레이리스트처럼 담아내는',
    color: '',
    colorBg: '',
    colorBorder: '',
    points: [
      '뮤직 앨범 스타일의 아날로그 감성',
      '따뜻하고 포근한 톤의 디자인',
      '연애 사진을 감성적으로 담고 싶을 때',
    ],
    sampleUrl: '/i/sample-record',
  },
  'narrative-exhibit': {
    templateId: 'narrative-exhibit',
    templateName: 'FEED',
    category: 'mini',
    categoryLabel: '미니 스토리형',
    tagline: '우리의 순간을 피드처럼 펼쳐보는',
    color: 'text-violet-500',
    colorBg: 'bg-violet-500',
    colorBorder: 'border-violet-200',
    points: [
      '인스타 피드 스타일의 트렌디한 구성',
      '여러 컨셉의 사진을 다양하게 보여줄 수 있어요',
      'SNS 감성을 좋아하는 커플에게 추천',
    ],
    sampleUrl: '/i/sample-feed',
  },
}

function TemplatesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') as TemplateCategory
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>(initialCategory)
  const [quizStep, setQuizStep] = useState<QuizStep>(null)
  const [quizResult, setQuizResult] = useState<string | null>(null)

  // 퀴즈 스텝 전환 (히스토리 관리)
  const goQuizStep = useCallback((step: QuizStep) => {
    setQuizStep(step)
    window.history.pushState({ quizStep: step }, '', '/templates')
  }, [])

  // 퀴즈 결과 설정
  const showResult = useCallback((templateId: string) => {
    setQuizResult(templateId)
    setQuizStep('result')
    window.history.pushState({ quizStep: 'result', quizResult: templateId }, '', '/templates')
  }, [])

  // 카테고리 선택 시 히스토리에 상태 기록
  const selectCategory = useCallback((category: TemplateCategory) => {
    setSelectedCategory(category)
    setQuizStep(null)
    if (category) {
      window.history.pushState({ category }, '', `/templates?category=${category}`)
    }
  }, [])

  // 뒤로가기 시 상태 복원
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state?.category) {
        setSelectedCategory(e.state.category)
        setQuizStep(null)
      } else if (e.state?.quizStep) {
        setSelectedCategory(null)
        setQuizStep(e.state.quizStep)
        if (e.state.quizResult) setQuizResult(e.state.quizResult)
      } else {
        setSelectedCategory(null)
        setQuizStep(null)
        setQuizResult(null)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleTemplateSelect = (templateId: string) => {
    const autoSlug = generateRandomSlug()
    if (templateId === 'narrative-parents') {
      router.push(`/editor/parents?slug=${autoSlug}`)
    } else if (templateId === 'narrative-exhibit') {
      router.push(`/editor/feed?slug=${autoSlug}`)
    } else {
      router.push(`/editor?template=${templateId}&slug=${autoSlug}`)
    }
  }

  // 직접 선택하기
  const goDirectSelect = useCallback(() => {
    setQuizStep(null)
    setQuizResult(null)
    window.history.pushState({}, '', '/templates')
  }, [])

  // 퀴즈 총 스텝 수 계산
  const getQuizProgress = (step: QuizStep) => {
    switch (step) {
      case 'q1': return { current: 1, total: 2 }
      case 'q2a': return { current: 2, total: 2 }
      case 'q2b': return { current: 2, total: 3 }
      case 'q3a': return { current: 3, total: 3 }
      case 'q3b': return { current: 3, total: 3 }
      default: return { current: 1, total: 2 }
    }
  }

  // 퀴즈 결과 화면 렌더
  const renderQuizResult = () => {
    if (!quizResult || !QUIZ_RESULTS[quizResult]) return null
    const r = QUIZ_RESULTS[quizResult]
    const isRecord = quizResult === 'narrative-record'
    const btnBg = isRecord ? { background: '#E89B8F' } : {}
    const btnClass = isRecord ? 'text-white text-sm font-medium rounded-xl transition-colors px-8 py-3' : `px-8 py-3 ${r.colorBg} hover:opacity-90 text-white text-sm font-medium rounded-xl transition-colors`

    return (
      <div className="max-w-md mx-auto text-center">
        <p className="text-xs tracking-widest text-gray-400 uppercase mb-3">Your Match</p>
        <div className="mb-4">
          <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${r.category === 'story' ? 'bg-rose-50 text-rose-500' : 'bg-gray-100 text-gray-600'}`}>
            {r.categoryLabel}
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{r.templateName}</h2>
        <p className="text-sm sm:text-base text-gray-500 mb-8">{r.tagline}</p>

        <div className={`bg-white rounded-2xl border ${isRecord ? '' : r.colorBorder} shadow-lg p-6 sm:p-8 mb-6 text-left`} style={isRecord ? { borderColor: '#F5E6E3' } : {}}>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">추천 포인트</p>
          <div className="space-y-3">
            {r.points.map((point, i) => (
              <p key={i} className="flex items-start gap-3 text-sm text-gray-600">
                <span className={`mt-0.5 flex-shrink-0 ${isRecord ? '' : r.color}`} style={isRecord ? { color: '#E89B8F' } : {}}>&#10003;</span>
                {point}
              </p>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => handleTemplateSelect(r.templateId)}
            className={btnClass}
            style={btnBg}
          >
            이 템플릿으로 시작하기
          </button>
          <div className="flex items-center justify-center gap-4 text-sm">
            <a href={r.sampleUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2">
              샘플 보기
            </a>
            <span className="text-gray-200">|</span>
            <button onClick={() => { setQuizResult(null); goQuizStep('q1') }} className="text-gray-400 hover:text-gray-600 transition-colors">
              다시 선택하기
            </button>
            <span className="text-gray-200">|</span>
            <button onClick={goDirectSelect} className="text-gray-400 hover:text-gray-600 transition-colors">
              다른 템플릿 보기
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 퀴즈 질문 카드 컴포넌트
  const QuizOption = ({ icon, title, sub, onClick }: { icon: React.ReactNode; title: string; sub: string; onClick: () => void }) => (
    <button
      onClick={onClick}
      className="group w-full p-4 sm:p-5 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-lg hover:border-gray-300 hover:scale-[1.01] transition-all duration-200 text-left"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 bg-gray-50 rounded-full flex items-center justify-center text-lg sm:text-xl">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-0.5">{title}</h3>
          <p className="text-xs sm:text-sm text-gray-400">{sub}</p>
        </div>
        <svg className="w-4 h-4 text-gray-200 group-hover:text-gray-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )

  // 퀴즈 렌더링
  const renderQuiz = () => {
    if (quizStep === 'result') return renderQuizResult()

    const progress = getQuizProgress(quizStep)

    return (
      <div className="max-w-lg mx-auto">
        {/* 프로그레스 */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="text-xs tracking-widest text-gray-400 uppercase">Step {progress.current} / {progress.total}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1 mb-10 max-w-xs mx-auto">
          <div
            className="bg-gray-800 h-1 rounded-full transition-all duration-300"
            style={{ width: `${(progress.current / progress.total) * 100}%` }}
          />
        </div>

        {/* Q1: 서사 깊이 */}
        {quizStep === 'q1' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2">
                청첩장에 담고 싶은 이야기의 깊이는?
              </h2>
              <p className="text-xs sm:text-sm text-gray-400">우리 스타일에 맞는 템플릿을 찾아드릴게요</p>
            </div>
            <div className="flex flex-col gap-3">
              <QuizOption
                icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" fill="rgba(253,164,175,0.15)" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>}
                title="천천히, 깊이 있게"
                sub="우리의 연애 이야기를 풍부하게 담고 싶어요"
                onClick={() => goQuizStep('q2a')}
              />
              <QuizOption
                icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="9" rx="1.5" fill="rgba(196,181,253,0.15)" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="3" y="15" width="7" height="6" rx="1.5" /><rect x="14" y="11" width="7" height="10" rx="1.5" fill="rgba(196,181,253,0.1)" /></svg>}
                title="핵심만, 감각적으로"
                sub="디자인 중심으로 간결하게 전달하고 싶어요"
                onClick={() => goQuizStep('q2b')}
              />
            </div>
            <div className="mt-8 text-center space-y-3">
              <button onClick={goDirectSelect} className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2">
                직접 선택할게요
              </button>
              <div>
                <button
                  onClick={() => selectCategory('parents')}
                  className="text-xs text-amber-500 hover:text-amber-600 transition-colors"
                >
                  혼주용 청첩장을 찾으시나요?
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Q2A: 이야기 범위 (스토리형 분기) */}
        {quizStep === 'q2a' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2">
                이야기의 중심은 누구인가요?
              </h2>
              <p className="text-xs sm:text-sm text-gray-400">가장 자연스러운 구성을 추천해 드릴게요</p>
            </div>
            <div className="flex flex-col gap-3">
              <QuizOption
                icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="rgba(253,164,175,0.15)" /></svg>}
                title="우리 둘의 이야기"
                sub="커플 중심의 연애 서사를 담고 싶어요"
                onClick={() => showResult('narrative-our')}
              />
              <QuizOption
                icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="7" r="4" /><path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" fill="rgba(147,197,253,0.15)" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /><path d="M21 21v-2a4 4 0 0 0-3-3.87" /></svg>}
                title="부모님의 이야기도 함께"
                sub="양가 부모님의 축복까지 담고 싶어요"
                onClick={() => showResult('narrative-family')}
              />
            </div>
            <div className="mt-8 text-center">
              <button onClick={() => window.history.back()} className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 mx-auto">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                이전으로
              </button>
            </div>
          </div>
        )}

        {/* Q2B: 촬영 분위기 (미니 스토리형 분기) */}
        {quizStep === 'q2b' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2">
                웨딩 촬영 분위기는 어떤가요?
              </h2>
              <p className="text-xs sm:text-sm text-gray-400">사진 스타일에 맞는 템플릿을 추천해 드릴게요</p>
            </div>
            <div className="flex flex-col gap-3">
              <QuizOption
                icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" fill="rgba(100,116,139,0.06)" /><circle cx="12" cy="12" r="3" /><path d="M3 9h18" /></svg>}
                title="스튜디오 촬영"
                sub="깔끔한 배경의 정돈된 사진이 많아요"
                onClick={() => goQuizStep('q3a')}
              />
              <QuizOption
                icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 3l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" fill="rgba(129,140,248,0.08)" /><path d="M7 21l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>}
                title="야외/스냅 촬영"
                sub="자연스러운 분위기의 스냅 사진이 많아요"
                onClick={() => goQuizStep('q3b')}
              />
              <QuizOption
                icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" fill="rgba(196,181,253,0.1)" /><circle cx="12" cy="13" r="4" /></svg>}
                title="여러 컨셉 믹스"
                sub="다양한 장소/컨셉의 사진이 있어요"
                onClick={() => showResult('narrative-exhibit')}
              />
            </div>
            <div className="mt-8 text-center">
              <button onClick={() => window.history.back()} className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 mx-auto">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                이전으로
              </button>
            </div>
          </div>
        )}

        {/* Q3A: 스튜디오 → RECORD or MAGAZINE */}
        {quizStep === 'q3a' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2">
                어떤 사진을 더 많이 담고 싶나요?
              </h2>
              <p className="text-xs sm:text-sm text-gray-400">사진 구성에 맞는 레이아웃을 추천해 드릴게요</p>
            </div>
            <div className="flex flex-col gap-3">
              <QuizOption
                icon={<svg className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#E89B8F' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" fill="rgba(232,155,143,0.12)" /><circle cx="18" cy="16" r="3" fill="rgba(232,155,143,0.12)" /></svg>}
                title="연애 사진도 함께"
                sub="웨딩 + 일상/연애 사진을 골고루 넣고 싶어요"
                onClick={() => showResult('narrative-record')}
              />
              <QuizOption
                icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" fill="rgba(100,116,139,0.06)" /><line x1="10" y1="6" x2="18" y2="6" /><line x1="10" y1="10" x2="18" y2="10" /><line x1="10" y1="14" x2="14" y2="14" /></svg>}
                title="웨딩 사진 중심"
                sub="웨딩 촬영 사진을 깔끔하게 보여주고 싶어요"
                onClick={() => showResult('narrative-magazine')}
              />
            </div>
            <div className="mt-8 text-center">
              <button onClick={() => window.history.back()} className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 mx-auto">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                이전으로
              </button>
            </div>
          </div>
        )}

        {/* Q3B: 야외/스냅 → MOVIE or RECORD */}
        {quizStep === 'q3b' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2">
                어떤 분위기가 더 마음에 드나요?
              </h2>
              <p className="text-xs sm:text-sm text-gray-400">취향에 맞는 디자인을 추천해 드릴게요</p>
            </div>
            <div className="flex flex-col gap-3">
              <QuizOption
                icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2" fill="rgba(129,140,248,0.08)" /><path d="M2 10h20" /><path d="M6 4l3 6" /><path d="M12 4l3 6" /></svg>}
                title="영화 같은 무드"
                sub="시네마틱하고 독특한 분위기가 좋아요"
                onClick={() => showResult('narrative-film')}
              />
              <QuizOption
                icon={<svg className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#E89B8F' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" fill="rgba(232,155,143,0.12)" /><circle cx="18" cy="16" r="3" fill="rgba(232,155,143,0.12)" /></svg>}
                title="따뜻하고 러블리하게"
                sub="포근하고 감성적인 분위기가 좋아요"
                onClick={() => showResult('narrative-record')}
              />
            </div>
            <div className="mt-8 text-center">
              <button onClick={() => window.history.back()} className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 mx-auto">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                이전으로
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-blue-50">
      {/* 헤더 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Dear Drawer" className="h-5 w-auto" />
          </Link>
          <Link href="/my-invitations" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
            내 청첩장
          </Link>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">

          <SocialProofCounter />

          {/* 퀴즈 플로우 */}
          {quizStep !== null && !selectedCategory && (
            <div>
              {quizStep !== 'result' && (
                <div className="text-center mb-2">
                  <p className="text-[10px] sm:text-xs tracking-widest text-gray-300 uppercase">Style Quiz</p>
                </div>
              )}
              {renderQuiz()}
            </div>
          )}

          {/* Step 1: 카테고리 직접 선택 (퀴즈 스킵 시) */}
          {quizStep === null && !selectedCategory && (
            <div>
              <div className="text-center mb-8 sm:mb-12">
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
                  어떤 청첩장을 원하세요?
                </h1>
                <p className="text-xs sm:text-base text-gray-500">
                  스타일을 선택하면 맞춤 템플릿을 추천해 드려요
                </p>
              </div>

              {/* 취향 퀴즈 배너 */}
              <div className="max-w-2xl mx-auto mb-4 sm:mb-6">
                <button
                  onClick={() => goQuizStep('q1')}
                  className="group w-full p-4 sm:p-5 rounded-2xl border-2 border-dashed border-gray-200 bg-gradient-to-r from-rose-50/60 via-violet-50/60 to-blue-50/60 hover:border-gray-300 hover:shadow-md transition-all duration-300 text-center"
                >
                  <div className="flex items-center justify-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white shadow-sm border border-gray-100">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </span>
                    <div className="text-left">
                      <p className="text-sm sm:text-base font-semibold text-gray-800">어떤 템플릿이 나에게 맞을까?</p>
                      <p className="text-[11px] sm:text-xs text-gray-400">2~3개 질문으로 맞춤 템플릿 추천받기</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-violet-400 transition-colors ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:gap-5 max-w-2xl mx-auto">
                {/* 스토리형 */}
                <button
                  onClick={() => selectCategory('story')}
                  className="group relative p-5 sm:p-8 rounded-2xl border border-gray-100 bg-white shadow-sm hover:border-rose-300 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 text-left"
                >
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="relative w-10 h-10 sm:w-14 sm:h-14 flex-shrink-0">
                      <div className="absolute -inset-1 bg-rose-200 rounded-full opacity-[0.12] blur-[10px]" />
                      <div className="relative w-full h-full bg-rose-50/80 border border-rose-100/60 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-7 sm:h-7 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" fill="rgba(253,164,175,0.15)" />
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base sm:text-xl font-semibold text-gray-900">스토리형</h3>
                        <span className="px-2 py-0.5 text-[9px] sm:text-xs bg-rose-50 text-rose-500 rounded-full font-medium">깊이 있는 이야기</span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 mb-1.5 sm:mb-2">
                        우리의 사랑 이야기를 풍부하게 담는 청첩장
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-400">OUR &middot; FAMILY</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-300 group-hover:text-rose-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>

                {/* 미니 스토리형 */}
                <button
                  onClick={() => selectCategory('mini')}
                  className="group relative p-5 sm:p-8 rounded-2xl border border-gray-100 bg-white shadow-sm hover:border-gray-800 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 text-left"
                >
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="relative w-10 h-10 sm:w-14 sm:h-14 flex-shrink-0">
                      <div className="absolute -inset-1 bg-violet-200 rounded-full opacity-[0.12] blur-[10px]" />
                      <div className="relative w-full h-full bg-violet-50/80 border border-violet-100/60 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-7 sm:h-7 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="7" height="9" rx="1.5" fill="rgba(196,181,253,0.15)" />
                          <rect x="14" y="3" width="7" height="5" rx="1.5" />
                          <rect x="3" y="15" width="7" height="6" rx="1.5" />
                          <rect x="14" y="11" width="7" height="10" rx="1.5" fill="rgba(196,181,253,0.1)" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base sm:text-xl font-semibold text-gray-900">미니 스토리형</h3>
                        <span className="px-2 py-0.5 text-[9px] sm:text-xs bg-gray-100 text-gray-600 rounded-full font-medium">감각적 디자인</span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 mb-1.5 sm:mb-2">
                        감각적인 디자인에 이야기를 간결하게 담는 청첩장
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-400">MAGAZINE &middot; MOVIE &middot; RECORD</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-800 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>

                {/* 혼주용 */}
                <button
                  onClick={() => selectCategory('parents')}
                  className="group relative p-5 sm:p-8 rounded-2xl border border-gray-100 bg-white shadow-sm hover:border-amber-300 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 text-left"
                >
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="relative w-10 h-10 sm:w-14 sm:h-14 flex-shrink-0">
                      <div className="absolute -inset-1 bg-sky-200 rounded-full opacity-[0.12] blur-[10px]" />
                      <div className="relative w-full h-full bg-sky-50/80 border border-sky-100/60 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-7 sm:h-7 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="9" cy="7" r="4" />
                          <path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" fill="rgba(125,211,252,0.15)" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base sm:text-xl font-semibold text-gray-900">혼주용</h3>
                        <span className="px-2 py-0.5 text-[9px] sm:text-xs bg-amber-50 text-amber-600 rounded-full font-medium">격식 있는</span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 mb-1.5 sm:mb-2">
                        부모님이 지인분들께 보내는 격식 있는 청첩장
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-400">PARENTS</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-300 group-hover:text-amber-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </div>

            </div>
          )}

          {/* Step 2: 스토리형 → OUR, FAMILY */}
          {selectedCategory === 'story' && (
            <div>
              <button onClick={() => window.history.back()} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                다른 스타일 보기
              </button>
              <div className="text-center mb-8">
                <p className="text-xs tracking-widest text-rose-400 uppercase mb-2">Story Type</p>
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2">스토리형 청첩장</h1>
                <p className="text-xs sm:text-base text-gray-500">우리의 이야기를 깊이 있게 전달하는 템플릿</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* OUR */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-2xl hover:border-rose-300 transition-all duration-300 overflow-hidden">
                  <div className="p-5 sm:p-8">
                    <div className="relative w-12 h-12 sm:w-16 sm:h-16 mb-2 sm:mb-4">
                      <div className="absolute -inset-1 bg-rose-200 rounded-full opacity-[0.12] blur-[10px]" />
                      <div className="relative w-full h-full bg-rose-50/80 border border-rose-100/60 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="rgba(253,164,175,0.15)" />
                        </svg>
                      </div>
                    </div>
                    <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">OUR</h2>
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-6">커플의 서사가 중심이 되는 청첩장</p>
                    <div className="space-y-1 sm:space-y-2 mb-4 sm:mb-8 text-xs sm:text-sm text-gray-500">
                      <p className="flex items-center gap-2"><span className="text-rose-400">♥</span> 장기연애를 해온 커플</p>
                      <p className="flex items-center gap-2"><span className="text-rose-400">♥</span> 특별한 스토리가 있는 커플</p>
                      <p className="flex items-center gap-2"><span className="text-rose-400">♥</span> 우리만의 이야기를 담고 싶은 커플</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleTemplateSelect('narrative-our')} className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-xl text-center transition-colors">
                        시작하기
                      </button>
                      <a href="/i/sample-our" target="_blank" rel="noopener noreferrer" className="px-4 py-3 border border-gray-200 hover:border-gray-300 text-gray-600 text-sm rounded-xl transition-colors">
                        샘플
                      </a>
                    </div>
                  </div>
                </div>

                {/* FAMILY */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-2xl hover:border-blue-300 transition-all duration-300 overflow-hidden">
                  <div className="p-5 sm:p-8">
                    <div className="relative w-12 h-12 sm:w-16 sm:h-16 mb-2 sm:mb-4">
                      <div className="absolute -inset-1 bg-blue-200 rounded-full opacity-[0.12] blur-[10px]" />
                      <div className="relative w-full h-full bg-blue-50/80 border border-blue-100/60 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="9" cy="7" r="4" />
                          <path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" fill="rgba(147,197,253,0.15)" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
                        </svg>
                      </div>
                    </div>
                    <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">FAMILY</h2>
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-6">두 가족의 축복으로 완성되는 청첩장</p>
                    <div className="space-y-1 sm:space-y-2 mb-4 sm:mb-8 text-xs sm:text-sm text-gray-500">
                      <p className="flex items-center gap-2"><span className="text-blue-400">♥</span> 양가 부모님의 축하 인사말</p>
                      <p className="flex items-center gap-2"><span className="text-blue-400">♥</span> 서로가 선택한 이유 (신랑/신부 소개)</p>
                      <p className="flex items-center gap-2"><span className="text-blue-400">♥</span> 커플 인터뷰 & 풀스크린 포토</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleTemplateSelect('narrative-family')} className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl text-center transition-colors">
                        시작하기
                      </button>
                      <a href="/i/sample-family" target="_blank" rel="noopener noreferrer" className="px-4 py-3 border border-gray-200 hover:border-gray-300 text-gray-600 text-sm rounded-xl transition-colors">
                        샘플
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: 미니 스토리형 → MAGAZINE, MOVIE, RECORD */}
          {selectedCategory === 'mini' && (
            <div>
              <button onClick={() => window.history.back()} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                다른 스타일 보기
              </button>
              <div className="text-center mb-8">
                <p className="text-xs tracking-widest text-gray-800 uppercase mb-2">Mini Story Type</p>
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2">미니 스토리형 청첩장</h1>
                <p className="text-xs sm:text-base text-gray-500">감각적인 디자인에 이야기를 간결하게 담는 템플릿</p>
              </div>

              <div className="flex flex-col gap-4 sm:gap-5 max-w-2xl mx-auto">
                {/* MAGAZINE */}
                <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-300 transition-all duration-300 overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    {/* 왼쪽: 비주얼 */}
                    <div className="sm:w-40 flex-shrink-0 bg-gray-50 flex flex-col items-center justify-center p-5 sm:p-6 border-b sm:border-b-0 sm:border-r border-gray-100">
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2">
                        <div className="absolute -inset-1 bg-slate-400 rounded-full opacity-[0.1] blur-[10px]" />
                        <div className="relative w-full h-full bg-slate-50 border border-slate-200/60 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 sm:w-7 sm:h-7 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" fill="rgba(100,116,139,0.06)" />
                            <line x1="10" y1="6" x2="18" y2="6" />
                            <line x1="10" y1="10" x2="18" y2="10" />
                            <line x1="10" y1="14" x2="14" y2="14" />
                          </svg>
                        </div>
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">MAGAZINE</h2>
                      <p className="text-[10px] text-gray-400 mt-0.5">매거진 인터뷰 스타일</p>
                    </div>
                    {/* 오른쪽: 추천 정보 */}
                    <div className="flex-1 p-5 sm:p-6">
                      <span className="inline-block px-2.5 py-1 text-[11px] font-medium bg-gray-900 text-white rounded-full mb-3">세련된 커플에게 추천</span>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className="text-[11px] text-gray-400">#모던</span>
                        <span className="text-[11px] text-gray-400">#인터뷰형식</span>
                        <span className="text-[11px] text-gray-400">#미니멀</span>
                      </div>
                      <div className="space-y-1.5 mb-4 text-[13px] text-gray-600">
                        <p className="flex items-start gap-2"><span className="text-gray-800 mt-0.5 text-xs">&#10003;</span> 모던하고 세련된 분위기를 좋아하는 커플</p>
                        <p className="flex items-start gap-2"><span className="text-gray-800 mt-0.5 text-xs">&#10003;</span> Q&A 인터뷰로 서로를 소개하고 싶은 커플</p>
                        <p className="flex items-start gap-2"><span className="text-gray-800 mt-0.5 text-xs">&#10003;</span> 고급스럽고 깔끔한 레이아웃을 원할 때</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleTemplateSelect('narrative-magazine')} className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl transition-colors">
                          시작하기
                        </button>
                        <a href="/i/sample-magazine" target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 border border-gray-200 hover:border-gray-300 text-gray-500 text-sm rounded-xl transition-colors">
                          샘플 보기
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* MOVIE */}
                <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-400 transition-all duration-300 overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    {/* 왼쪽: 비주얼 */}
                    <div className="sm:w-40 flex-shrink-0 bg-gray-50 flex flex-col items-center justify-center p-5 sm:p-6 border-b sm:border-b-0 sm:border-r border-gray-100">
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2">
                        <div className="absolute -inset-1 bg-indigo-300 rounded-full opacity-[0.1] blur-[10px]" />
                        <div className="relative w-full h-full bg-indigo-50/80 border border-indigo-100/60 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 sm:w-7 sm:h-7 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="4" width="20" height="16" rx="2" fill="rgba(129,140,248,0.08)" />
                            <path d="M2 10h20" />
                            <path d="M6 4l3 6" />
                            <path d="M12 4l3 6" />
                          </svg>
                        </div>
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">MOVIE</h2>
                      <p className="text-[10px] text-gray-400 mt-0.5">시네마틱 무드</p>
                    </div>
                    {/* 오른쪽: 추천 정보 */}
                    <div className="flex-1 p-5 sm:p-6">
                      <span className="inline-block px-2.5 py-1 text-[11px] font-medium bg-gray-500 text-white rounded-full mb-3">감성적인 커플에게 추천</span>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className="text-[11px] text-gray-400">#시네마틱</span>
                        <span className="text-[11px] text-gray-400">#무드있는</span>
                        <span className="text-[11px] text-gray-400">#다크테마</span>
                      </div>
                      <div className="space-y-1.5 mb-4 text-[13px] text-gray-600">
                        <p className="flex items-start gap-2"><span className="text-gray-500 mt-0.5 text-xs">&#10003;</span> 영화 같은 분위기를 좋아하는 커플</p>
                        <p className="flex items-start gap-2"><span className="text-gray-500 mt-0.5 text-xs">&#10003;</span> 무드 있는 사진이 많은 커플</p>
                        <p className="flex items-start gap-2"><span className="text-gray-500 mt-0.5 text-xs">&#10003;</span> 남들과 다른 독특한 연출을 원할 때</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleTemplateSelect('narrative-film')} className="px-5 py-2.5 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-xl transition-colors">
                          시작하기
                        </button>
                        <a href="/i/sample-film" target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 border border-gray-200 hover:border-gray-300 text-gray-500 text-sm rounded-xl transition-colors">
                          샘플 보기
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RECORD */}
                <div className="group bg-white rounded-2xl border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden" style={{ borderColor: '#F5E6E3' }}>
                  <div className="flex flex-col sm:flex-row">
                    {/* 왼쪽: 비주얼 */}
                    <div className="sm:w-40 flex-shrink-0 flex flex-col items-center justify-center p-5 sm:p-6 border-b sm:border-b-0 sm:border-r" style={{ background: '#FDF8F6', borderColor: '#F5E6E3' }}>
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2">
                        <div className="absolute -inset-1 rounded-full opacity-[0.1] blur-[10px]" style={{ background: '#E89B8F' }} />
                        <div className="relative w-full h-full border rounded-full flex items-center justify-center" style={{ background: 'rgba(232,155,143,0.06)', borderColor: 'rgba(232,155,143,0.2)' }}>
                          <svg className="w-5 h-5 sm:w-7 sm:h-7" style={{ color: '#E89B8F' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 18V5l12-2v13" />
                            <circle cx="6" cy="18" r="3" fill="rgba(232,155,143,0.12)" />
                            <circle cx="18" cy="16" r="3" fill="rgba(232,155,143,0.12)" />
                          </svg>
                        </div>
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">RECORD</h2>
                      <p className="text-[10px] text-gray-400 mt-0.5">뮤직 앨범 스타일</p>
                    </div>
                    {/* 오른쪽: 추천 정보 */}
                    <div className="flex-1 p-5 sm:p-6">
                      <span className="inline-block px-2.5 py-1 text-[11px] font-medium text-white rounded-full mb-3" style={{ background: '#E89B8F' }}>음악을 사랑하는 커플에게 추천</span>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className="text-[11px] text-gray-400">#아날로그</span>
                        <span className="text-[11px] text-gray-400">#따뜻한톤</span>
                        <span className="text-[11px] text-gray-400">#LP감성</span>
                      </div>
                      <div className="space-y-1.5 mb-4 text-[13px] text-gray-600">
                        <p className="flex items-start gap-2"><span style={{ color: '#E89B8F' }} className="mt-0.5 text-xs">&#10003;</span> 음악이 우리 사랑의 배경인 커플</p>
                        <p className="flex items-start gap-2"><span style={{ color: '#E89B8F' }} className="mt-0.5 text-xs">&#10003;</span> 아날로그 감성을 좋아하는 커플</p>
                        <p className="flex items-start gap-2"><span style={{ color: '#E89B8F' }} className="mt-0.5 text-xs">&#10003;</span> 따뜻하고 포근한 분위기를 원할 때</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleTemplateSelect('narrative-record')} className="px-5 py-2.5 text-white text-sm font-medium rounded-xl transition-colors" style={{ background: '#E89B8F' }}>
                          시작하기
                        </button>
                        <a href="/i/sample-record" target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 border border-gray-200 hover:border-gray-300 text-gray-500 text-sm rounded-xl transition-colors">
                          샘플 보기
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FEED */}
                <div className="group bg-white rounded-2xl border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden" style={{ borderColor: '#E4E0F5' }}>
                  <div className="flex flex-col sm:flex-row">
                    {/* 왼쪽: 비주얼 */}
                    <div className="sm:w-40 flex-shrink-0 flex flex-col items-center justify-center p-5 sm:p-6 border-b sm:border-b-0 sm:border-r" style={{ background: '#F8F6FD', borderColor: '#E4E0F5' }}>
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2">
                        <div className="absolute -inset-1 bg-violet-300 rounded-full opacity-[0.1] blur-[10px]" />
                        <div className="relative w-full h-full bg-violet-50/80 border border-violet-100/60 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 sm:w-7 sm:h-7 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" fill="rgba(196,181,253,0.1)" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                        </div>
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">FEED</h2>
                      <p className="text-[10px] text-gray-400 mt-0.5">인스타 포토 스타일</p>
                    </div>
                    {/* 오른쪽: 추천 정보 */}
                    <div className="flex-1 p-5 sm:p-6">
                      <span className="inline-block px-2.5 py-1 text-[11px] font-medium text-white rounded-full mb-3" style={{ background: '#8B5CF6' }}>사진이 많은 커플에게 추천</span>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className="text-[11px] text-gray-400">#SNS감성</span>
                        <span className="text-[11px] text-gray-400">#포토중심</span>
                        <span className="text-[11px] text-gray-400">#캐주얼</span>
                      </div>
                      <div className="space-y-1.5 mb-4 text-[13px] text-gray-600">
                        <p className="flex items-start gap-2"><span style={{ color: '#8B5CF6' }} className="mt-0.5 text-xs">&#10003;</span> 스냅 사진이 자산인 커플</p>
                        <p className="flex items-start gap-2"><span style={{ color: '#8B5CF6' }} className="mt-0.5 text-xs">&#10003;</span> SNS 감성을 좋아하는 커플</p>
                        <p className="flex items-start gap-2"><span style={{ color: '#8B5CF6' }} className="mt-0.5 text-xs">&#10003;</span> 캐주얼하고 트렌디한 분위기를 원할 때</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleTemplateSelect('narrative-exhibit')} className="px-5 py-2.5 text-white text-sm font-medium rounded-xl transition-colors" style={{ background: '#8B5CF6' }}>
                          시작하기
                        </button>
                        <a href="/i/sample-feed" target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 border border-gray-200 hover:border-gray-300 text-gray-500 text-sm rounded-xl transition-colors">
                          샘플 보기
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: 혼주용 → PARENTS */}
          {selectedCategory === 'parents' && (
            <div>
              <button onClick={() => window.history.back()} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                다른 스타일 보기
              </button>
              <div className="text-center mb-8">
                <p className="text-xs tracking-widest text-amber-500 uppercase mb-2">Parents Type</p>
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2">혼주용 청첩장</h1>
                <p className="text-xs sm:text-base text-gray-500">부모님이 지인분들께 보내는 격식 있는 청첩장</p>
              </div>

              <div className="max-w-md mx-auto">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-2xl hover:border-amber-300 transition-all duration-300 overflow-hidden text-center">
                  <div className="p-6 sm:p-10">
                    <div className="relative w-14 h-14 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-5">
                      <div className="absolute -inset-1 bg-amber-200 rounded-full opacity-[0.15] blur-[10px]" />
                      <div className="relative w-full h-full bg-amber-50/80 border border-amber-100/60 rounded-full flex items-center justify-center">
                        <svg className="w-7 h-7 sm:w-10 sm:h-10 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="9" cy="7" r="4" />
                          <path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" fill="rgba(251,191,36,0.12)" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
                        </svg>
                      </div>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1.5 sm:mb-3">PARENTS</h2>
                    <p className="text-xs sm:text-base text-gray-600 mb-4 sm:mb-8">
                      간결한 인사말과 예식 정보 중심의<br />
                      격식 있는 청첩장
                    </p>
                    <div className="space-y-1 sm:space-y-2 mb-5 sm:mb-8 text-xs sm:text-sm text-gray-500 text-left max-w-xs mx-auto">
                      <p className="flex items-center gap-2"><span className="text-amber-500">✦</span> 봉투 오프닝 연출</p>
                      <p className="flex items-center gap-2"><span className="text-amber-500">✦</span> 혼주 시점 인사말</p>
                      <p className="flex items-center gap-2"><span className="text-amber-500">✦</span> 부모님 지인 대상 최적화</p>
                    </div>
                    <div className="flex items-center justify-center gap-4">
                      <button onClick={() => handleTemplateSelect('narrative-parents')} className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl transition-colors">
                        시작하기
                      </button>
                      <a href="/sample/parents" target="_blank" rel="noopener noreferrer" className="px-4 py-3 border border-gray-200 hover:border-gray-300 text-gray-600 text-sm rounded-xl transition-colors">
                        샘플
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

export default function TemplatesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <TemplatesContent />
    </Suspense>
  )
}
