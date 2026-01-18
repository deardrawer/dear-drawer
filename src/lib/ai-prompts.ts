/**
 * AI 스토리 생성 프롬프트 유틸리티
 * - 실제 샘플 스타일 기반
 * - 톤별 상세 가이드 포함
 */

import type { AllFormData, InterviewFormData } from '@/types/ai-generator'

// ============================================================
// SAMPLE_TEXTS - 실제 샘플 스타일 (프롬프트에 직접 포함됨)
// ============================================================

export const SAMPLE_TEXTS = {
  greeting: {
    sincere: `20대의 인생을 함께 걸어오며 서로의 성장과 변화를 지켜본 우리는
더 나은 우리가 되기를 꿈꾸며 새로운 여정을 시작하려 합니다.

떨어져 있어도 마음만은 늘 가까웠던 두 사람이
이제는 하나의 이름 아래 평생을 함께 걸어가려 합니다.

우리의 새로운 이야기를 약속하는 자리에
소중한 여러분들을 초대합니다.`,

    warm: `처음 마주친 눈빛 속에서 시작된 설렘이
어느새 평생을 약속하는 사랑이 되었습니다.

서로의 곁에서 웃고 울며 함께한 시간들이
우리를 더 단단하게, 더 따뜻하게 만들어 주었습니다.

그 소중한 발걸음을 여러분과 함께 나누고 싶어
이 자리에 초대합니다.`,

    cheerful: `"어? 우리 진짜 결혼하는 거야?"
"응, 진짜야!"

매일 티격태격하면서도 결국 서로를 찾게 되는
우리 두 사람, 드디어 결혼합니다!

웃음과 행복이 가득한 그 날,
함께해 주시면 더없이 기쁘겠습니다.`
  },

  thanks: {
    sincere: `지금까지 저희를 아껴주신 모든 분들께 감사드립니다.
앞으로도 많은 응원과 축복 부탁드립니다.`,

    warm: `저희의 첫 걸음을 축복해 주시는 모든 분들께
진심으로 감사드립니다.`,

    cheerful: `바쁘신 와중에도 함께해 주셔서 정말 감사합니다!
맛있는 식사와 함께 즐거운 시간 보내세요!`
  },

  profile: {
    sincere: {
      short: `아주 커다란 나무 한 그루 같은 사람입니다.
자기만의 기준이 또렷하고, 한번 마음먹은 일은 망설임 없이 끝까지 밀고 나가는 사람이라
처음에는 그 모습이 조금은 고집처럼 보일 수도 있어요.

그런데 가까이에서 지켜볼수록 알게 됩니다.
그 뿌리가 얼마나 깊은지, 그 품이 얼마나 넓은지.`,

      rich: `아주 커다란 나무 한 그루 같은 사람입니다.
자기만의 기준이 또렷하고, 한번 마음먹은 일은 망설임 없이 끝까지 밀고 나가는 사람이라
처음에는 그 모습이 조금은 고집처럼 보일 수도 있어요.

그런데 가까이에서 지켜볼수록 알게 됩니다.
그 뿌리가 얼마나 깊은지, 그 품이 얼마나 넓은지.

예민하고 감정적인 제 옆에서 늘 변함없이 그 자리를 지켜주는 사람.
세상이 어지러워도 흔들리지 않는 그 사람 덕분에 저도 조금씩 단단해지고 있어요.

때로는 무뚝뚝해 보여도, 그 안에는 깊은 다정함이 있습니다.
표현은 서툴지만 행동으로 보여주는 사람, 그게 제가 사랑하는 이 사람이에요.`
    },

    warm: {
      short: `따뜻한 햇살 같은 사람입니다.
곁에 있으면 자연스럽게 미소가 번지고, 마음이 포근해지는 그런 사람이에요.

어떤 상황에서도 긍정적인 에너지를 잃지 않고
주변 사람들까지 환하게 만드는 힘이 있어요.`,

      rich: `따뜻한 햇살 같은 사람입니다.
곁에 있으면 자연스럽게 미소가 번지고, 마음이 포근해지는 그런 사람이에요.

어떤 상황에서도 긍정적인 에너지를 잃지 않고
주변 사람들까지 환하게 만드는 힘이 있어요.

처음 만났을 때는 밝고 쾌활한 모습만 보였는데,
가까이 지낼수록 그 안에 깊은 배려와 섬세함이 있다는 걸 알게 됐어요.

힘든 날에는 말없이 곁에 있어주고,
기쁜 날에는 누구보다 함께 기뻐해주는 사람.
그런 따뜻함이 매일 저를 살게 해요.`
    }
  },

  story: {
    first: `2019년 가을, 대학 동아리 MT에서 처음 만났습니다.
어색한 자기소개 시간, 서로의 이름을 알게 되었고
그게 우리 이야기의 시작이었습니다.

처음엔 그저 동기 사이었지만,
어느 순간부터 서로를 찾게 되었고
자연스럽게 연인이 되었습니다.`,

    together: `5년이라는 시간 동안 많은 것을 함께했습니다.
첫 해외여행에서의 설렘,
서로 다른 도시에서 보낸 그리운 날들,
힘든 취업 준비 기간의 위로.

때로는 다투기도 했지만
결국엔 서로를 더 이해하게 되었고,
그 시간들이 우리를 지금의 우리로 만들어 주었습니다.`,

    preparation: `2024년 봄, 제주도 여행에서 프로포즈를 했습니다.
노을이 지는 바다를 앞에 두고
떨리는 마음으로 건넨 반지와 약속.

그 후로 6개월간의 결혼 준비.
때로는 지치기도 했지만
함께라서 행복한 시간이었습니다.`
  },

  interview: {
    individual: {
      question: '결혼을 결심한 이유는 무엇인가요?',
      groomAnswer: '이 사람과 함께라면 어떤 어려움도 이겨낼 수 있겠다는 확신이 들었습니다. 평생 옆에서 웃고 울고 싶은 사람을 만났기 때문입니다.',
      brideAnswer: '어느 날 문득, 이 사람 없는 미래가 상상이 안 됐어요. 그때 알았죠, 이 사람이 제 평생의 동반자라는 걸.'
    },

    joint: {
      question: '결혼 생활에서 꼭 지키고 싶은 약속은?',
      jointAnswer: '하루에 한 번은 꼭 함께 식사하기, 그리고 서운한 건 그날 안에 풀기. 작지만 소중한 약속들을 지켜나가고 싶어요.'
    }
  }
}

// ============================================================
// TONE_GUIDES - 톤별 상세 작성 가이드
// ============================================================

export const TONE_GUIDES = {
  sincere: {
    description: '진솔하고 깊이있는 톤',
    style: [
      '담담하지만 진정성 있는 문장',
      '과장 없이 솔직한 감정 표현',
      '깊이 있는 성찰과 의미 부여',
      '서술형 어미 사용 (-습니다, -입니다)',
      '문장 간 자연스러운 연결'
    ],
    avoid: [
      '과도한 감탄사 (!, ~)',
      '지나친 미사여구',
      '구어체/반말 표현',
      '이모티콘이나 특수문자'
    ],
    endings: ['습니다', '입니다', '있습니다', '됩니다', '합니다']
  },

  warm: {
    description: '따뜻하고 감성적인 톤',
    style: [
      '부드럽고 포근한 느낌의 문장',
      '감정을 섬세하게 표현',
      '비유와 은유를 적절히 활용',
      '정감 있는 표현 사용',
      '독자의 공감을 유도'
    ],
    avoid: [
      '차갑거나 사무적인 표현',
      '딱딱한 문어체',
      '지나치게 긴 문장',
      '복잡한 문장 구조'
    ],
    endings: ['요', '습니다', '있어요', '됐어요', '했습니다']
  },

  concise: {
    description: '간결하고 단정한 톤',
    style: [
      '짧고 명확한 문장',
      '핵심만 전달',
      '군더더기 없는 표현',
      '단문 위주 구성',
      '임팩트 있는 마무리'
    ],
    avoid: [
      '불필요한 수식어',
      '반복되는 표현',
      '장황한 설명',
      '모호한 표현'
    ],
    endings: ['다', '습니다', '입니다', '했다', '됐다']
  },

  cheerful: {
    description: '유머러스하고 밝은 톤',
    style: [
      '밝고 경쾌한 문장',
      '적절한 유머 포함',
      '친근한 대화체',
      '생동감 있는 표현',
      '재미있는 에피소드 활용'
    ],
    avoid: [
      '너무 진지한 표현',
      '무거운 분위기',
      '격식체 문장',
      '과도한 유머 (적절히 조절)'
    ],
    endings: ['요', '예요', '죠', '했어요', '이에요']
  }
}

// ============================================================
// STYLE_GUIDES - 섹션별 스타일 가이드
// ============================================================

export const STYLE_GUIDES = {
  greeting: {
    structure: '2-3문단, 문단 사이 빈 줄 구분',
    length: '150-250자',
    tips: [
      '첫 문단: 두 사람의 관계/여정 소개',
      '중간 문단: 결혼의 의미/다짐',
      '마지막 문단: 초대 문구'
    ],
    mustInclude: ['관계 기간 또는 특징', '결혼 결심 이유', '초대 표현']
  },

  thanks: {
    structure: '1-2문장',
    length: '50-100자',
    tips: [
      '감사 대상 명시',
      '앞으로의 바람 표현',
      '짧고 진심어린 표현'
    ],
    mustInclude: ['감사 표현', '축복/응원 요청']
  },

  profile: {
    structure: {
      short: '2-3문단, 150-200자',
      rich: '4-5문단, 300-400자'
    },
    tips: [
      '상대방을 소개하는 관점 (신랑←신부, 신부←신랑)',
      '비유를 통한 인상적인 첫 문장',
      '구체적 특징과 에피소드',
      '함께할 미래에 대한 기대'
    ],
    mustInclude: ['비유 표현', '성격/특징', '함께 있을 때 느낌']
  },

  story: {
    structure: '각 단계별 2-3문단',
    tips: {
      first: ['만남의 시공간 명시', '첫인상 또는 특별한 순간', '연인으로 발전 과정'],
      together: ['함께한 시간의 길이', '기억에 남는 에피소드', '성장/변화 이야기'],
      preparation: ['프로포즈 (있는 경우)', '준비 과정의 감정', '함께여서 좋았던 점']
    },
    mustInclude: ['구체적인 시간/장소', '감정 표현', '자연스러운 연결']
  },

  interview: {
    structure: 'Q&A 형식, 질문당 1-3문장 답변',
    tips: [
      '질문에 맞는 답변 길이 조절',
      '신랑/신부 개성이 드러나는 답변',
      '진정성 있고 구체적인 표현'
    ],
    answerStyles: {
      individual: '각자의 관점과 생각 표현',
      joint: '두 사람의 공통된 생각/계획 표현'
    }
  }
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * 톤 설명 텍스트
 */
export function getToneDescription(tone: string): string {
  const tones: Record<string, string> = {
    sincere: '진솔하고 깊이있는',
    warm: '따뜻하고 감성적인',
    concise: '간결하고 단정한',
    cheerful: '유머러스하고 밝은'
  }
  return tones[tone] || tone
}

/**
 * 톤별 상세 가이드 텍스트 생성
 */
export function getToneGuideText(tone: string): string {
  const guide = TONE_GUIDES[tone as keyof typeof TONE_GUIDES]
  if (!guide) return ''

  return `
[${guide.description} 작성 가이드]
스타일:
${guide.style.map(s => `- ${s}`).join('\n')}

피해야 할 것:
${guide.avoid.map(a => `- ${a}`).join('\n')}

권장 어미: ${guide.endings.join(', ')}
`
}

/**
 * 비유 텍스트
 */
export function getMetaphorText(metaphor: string): string {
  const metaphors: Record<string, string> = {
    tree: '큰 나무 같은 사람',
    sun: '따뜻한 햇살 같은 사람',
    sea: '편안한 바다 같은 사람',
    mountain: '든든한 산 같은 사람',
    wind: '자유로운 바람 같은 사람',
    star: '빛나는 별 같은 사람',
    diverse: '다양한 결을 가진 사람',
    different: '세상을 다르게 바라보는 사람'
  }
  return metaphors[metaphor] || metaphor
}

/**
 * 함께 있을 때 느낌 텍스트
 */
export function getTogetherFeelingText(feeling: string): string {
  const feelings: Record<string, string> = {
    comfortable: '마음이 놓이고 안심이 된다',
    'different-view': '세상을 다르게 보게 된다',
    'special-day': '하루하루가 특별해진다',
    pleasant: '편안하고 즐겁다',
    courage: '용기가 생긴다',
    growth: '함께 성장하게 된다',
    calm: '마음이 평온해진다',
    energy: '에너지가 충전된다'
  }
  return feelings[feeling] || feeling
}

/**
 * 첫 만남 장소 텍스트
 */
export function getMeetPlaceText(place: string): string {
  const places: Record<string, string> = {
    school: '학교',
    work: '직장',
    friend: '친구 소개',
    app: '소개팅 앱',
    church: '교회/성당',
    hobby: '취미 활동',
    neighborhood: '동네',
    travel: '여행',
    event: '행사/모임',
    other: '기타'
  }
  return places[place] || place
}

/**
 * 사귀게 된 계기 텍스트
 */
export function getHowStartedText(howStarted: string): string {
  const starts: Record<string, string> = {
    confession: '고백으로',
    natural: '자연스럽게',
    event: '특별한 계기로',
    long_friend: '오랜 친구에서',
    blind: '소개팅에서',
    other: '기타'
  }
  return starts[howStarted] || howStarted
}

/**
 * 기억에 남는 일 텍스트
 */
export function getMemorableEventText(event: string): string {
  const events: Record<string, string> = {
    first_trip: '첫 여행',
    anniversary: '기념일',
    hardship: '힘든 시기 극복',
    family_intro: '가족 소개',
    cohabitation: '동거 시작',
    pet: '반려동물',
    milestone: '인생의 전환점',
    surprise: '서프라이즈 이벤트',
    sick: '아플 때 돌봐줌'
  }
  return events[event] || event
}

/**
 * 인기 질문 텍스트
 */
export function getPopularQuestionText(qId: string): string {
  const questions: Record<string, string> = {
    q1: '결혼을 결심한 이유는 무엇인가요?',
    q2: '결혼 생활의 행복은 무엇이라고 생각하나요?',
    q3: '두 사람의 결혼생활은 어떤 장르면 좋겠나요?',
    q4: '결혼 생활 중 이것만은 절대 하지 말자는 한 가지는?',
    q5: '결혼 생활에서 꼭 지키고 싶은 약속은 무엇인가요?',
    q6: '상대방의 어떤 점이 가장 좋나요?',
    q7: '결혼 준비는 어떠했나요?',
    q8: '신혼여행은 어디로 가나요?',
    q9: '결혼 후 가장 하고 싶은 일은?',
    q10: '상대방의 첫인상은?',
    q11: '상대방 때문에 변한 점이 있나요?',
    q12: '평생 함께하고 싶은 이유는?'
  }
  return questions[qId] || qId
}

// ============================================================
// Text Quality Validation
// ============================================================

export interface TextQualityResult {
  isValid: boolean
  score: number
  issues: string[]
  suggestions: string[]
}

/**
 * 생성된 텍스트 품질 검증
 */
export function validateTextQuality(
  text: string,
  section: 'greeting' | 'thanks' | 'profile' | 'story' | 'interview',
  tone?: string
): TextQualityResult {
  const issues: string[] = []
  const suggestions: string[] = []
  let score = 100

  // 기본 검증
  if (!text || text.trim().length === 0) {
    return {
      isValid: false,
      score: 0,
      issues: ['텍스트가 비어있습니다.'],
      suggestions: ['콘텐츠를 다시 생성해주세요.']
    }
  }

  // 길이 검증
  const lengthLimits: Record<string, { min: number; max: number }> = {
    greeting: { min: 100, max: 300 },
    thanks: { min: 30, max: 150 },
    profile: { min: 100, max: 500 },
    story: { min: 80, max: 400 },
    interview: { min: 20, max: 200 }
  }

  const limit = lengthLimits[section]
  if (text.length < limit.min) {
    issues.push(`텍스트가 너무 짧습니다. (최소 ${limit.min}자 권장)`)
    suggestions.push('더 풍부한 내용을 추가해주세요.')
    score -= 15
  }
  if (text.length > limit.max) {
    issues.push(`텍스트가 너무 깁니다. (최대 ${limit.max}자 권장)`)
    suggestions.push('핵심 내용 위주로 간결하게 작성해주세요.')
    score -= 10
  }

  // 문단 구분 검증 (greeting, profile, story)
  if (['greeting', 'profile', 'story'].includes(section)) {
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim())
    if (paragraphs.length < 2) {
      issues.push('문단 구분이 부족합니다.')
      suggestions.push('내용을 2-3개 문단으로 나눠주세요.')
      score -= 10
    }
  }

  // 어미 일관성 검증
  if (tone) {
    const guide = TONE_GUIDES[tone as keyof typeof TONE_GUIDES]
    if (guide) {
      const sentences = text.split(/[.!?]\s*/).filter(s => s.trim())
      const lastWords = sentences.map(s => {
        const words = s.trim().split(/\s+/)
        return words[words.length - 1] || ''
      })

      // 어미 패턴 체크
      const expectedEndings = guide.endings
      let matchCount = 0
      lastWords.forEach(word => {
        if (expectedEndings.some(e => word.endsWith(e))) {
          matchCount++
        }
      })

      const matchRatio = sentences.length > 0 ? matchCount / sentences.length : 0
      if (matchRatio < 0.5 && sentences.length >= 3) {
        issues.push('어미 톤이 일관되지 않습니다.')
        suggestions.push(`${guide.description}에 맞는 어미(${expectedEndings.join(', ')})를 사용해주세요.`)
        score -= 15
      }
    }
  }

  // 반복 표현 검증
  const words = text.split(/\s+/)
  const wordCounts: Record<string, number> = {}
  words.forEach(w => {
    const cleaned = w.replace(/[^가-힣a-zA-Z]/g, '')
    if (cleaned.length >= 2) {
      wordCounts[cleaned] = (wordCounts[cleaned] || 0) + 1
    }
  })

  const repeatedWords = Object.entries(wordCounts)
    .filter(([word, count]) => count > 3 && word.length >= 2)
    .map(([word]) => word)

  if (repeatedWords.length > 0) {
    issues.push(`반복 사용되는 단어: ${repeatedWords.slice(0, 3).join(', ')}`)
    suggestions.push('다양한 표현을 사용해주세요.')
    score -= 5 * Math.min(repeatedWords.length, 3)
  }

  // 부적절한 표현 검증
  const inappropriatePatterns = [
    /[ㅋㅎㅠㅜ]{2,}/g,  // 과도한 ㅋㅋ, ㅎㅎ
    /[!]{3,}/g,          // 과도한 느낌표
    /[~]{2,}/g,          // 과도한 물결
    /이모티콘|emoji|😀|🎉|❤️/gi  // 이모티콘
  ]

  inappropriatePatterns.forEach(pattern => {
    if (pattern.test(text)) {
      issues.push('부적절한 표현이 포함되어 있습니다.')
      suggestions.push('정제된 표현을 사용해주세요.')
      score -= 10
    }
  })

  return {
    isValid: score >= 60,
    score: Math.max(0, score),
    issues: [...new Set(issues)],  // 중복 제거
    suggestions: [...new Set(suggestions)]
  }
}

// ============================================================
// Interview Prompt Builder
// ============================================================

/**
 * 인터뷰 프롬프트 생성
 */
function getInterviewPrompt(interviewData: InterviewFormData): string {
  const questionCount = interviewData.version === 'short' ? '3-4' : '6-8'

  // 인터뷰 샘플 포함
  const sampleText = `
참고 샘플:
[개별 답변 예시]
질문: "${SAMPLE_TEXTS.interview.individual.question}"
신랑: "${SAMPLE_TEXTS.interview.individual.groomAnswer}"
신부: "${SAMPLE_TEXTS.interview.individual.brideAnswer}"

[공동 답변 예시]
질문: "${SAMPLE_TEXTS.interview.joint.question}"
함께: "${SAMPLE_TEXTS.interview.joint.jointAnswer}"
`

  if (interviewData.type === 'auto') {
    const topicLabels: Record<string, string> = {
      decision: '결혼 결심 이유',
      promise: '관계의 약속/원칙',
      preparation: '결혼 준비 과정',
      future: '미래 계획',
      'each-other': '서로에 대한 질문'
    }
    const topics = interviewData.topics?.map(t => topicLabels[t] || t).join(', ')

    const answerStyleDesc: Record<string, string> = {
      individual: '신랑과 신부가 각각 답변 (groomAnswer, brideAnswer 사용)',
      together: '함께 답변 (jointAnswer 사용)',
      mixed: '질문에 따라 적절히 각각 또는 함께 답변'
    }

    return `
AI 자동 생성 모드
- 선택된 주제: ${topics}
- 답변 스타일: ${answerStyleDesc[interviewData.answerStyle || 'mixed']}
- 생성할 질문 수: ${questionCount}개

위 주제들을 바탕으로 자연스럽고 개성있는 질문을 만들고 답변을 작성해주세요.
답변은 앞서 입력된 정보들(스토리, 소개 등)을 바탕으로 일관성있게 작성해주세요.

${sampleText}

중요:
- 각 답변은 1-3문장으로 간결하게
- 신랑/신부 각자의 개성이 드러나도록
- 진정성 있고 구체적인 표현 사용
`
  } else if (interviewData.type === 'popular') {
    const questions = interviewData.selectedQuestions?.map((qId, i) =>
      `${i + 1}. ${getPopularQuestionText(qId)}`
    ).join('\n')

    return `
인기 질문 선택 모드
선택된 질문들:
${questions}

각 질문에 대해 답변을 작성해주세요.
질문 성격에 따라 개별 답변(groomAnswer, brideAnswer) 또는 공동 답변(jointAnswer) 사용

${sampleText}
`
  } else {
    const questions = interviewData.customQuestions?.map((q, i) =>
      `${i + 1}. ${q.question} → ${q.answerStyle === 'individual' ? '각자 답변' : '함께 답변'}`
    ).join('\n')

    const hintsText = interviewData.hints
      ? Object.entries(interviewData.hints)
          .map(([key, hint]) => `질문 ${key}: 신랑 힌트="${hint.groom || ''}", 신부 힌트="${hint.bride || ''}", 공동 힌트="${hint.joint || ''}"`)
          .join('\n')
      : ''

    return `
직접 입력 모드
질문들:
${questions}

${hintsText ? `답변 힌트:\n${hintsText}\n\n힌트가 제공된 경우 이를 참고하되, 자연스럽고 진정성있게 확장해주세요.` : ''}

각 질문에 대해 지정된 답변 스타일로 작성해주세요.
- 각자 답변: groomAnswer, brideAnswer 필드 사용
- 함께 답변: jointAnswer 필드 사용

${sampleText}
`
  }
}

// ============================================================
// Main Prompt Generator
// ============================================================

/**
 * 메인 프롬프트 생성 (전체 콘텐츠)
 */
export function generateFullPrompt(
  formData: AllFormData,
  groomName: string,
  brideName: string
): string {
  const { greeting, groomProfile, brideProfile, story, interview } = formData

  const groomMetaphor = getMetaphorText(groomProfile.metaphor)
  const brideMetaphor = getMetaphorText(brideProfile.metaphor)
  const groomFeeling = getTogetherFeelingText(groomProfile.togetherFeeling)
  const brideFeeling = getTogetherFeelingText(brideProfile.togetherFeeling)
  const meetPlace = getMeetPlaceText(story.firstMeetPlace)
  const howStarted = getHowStartedText(story.howStarted)
  const memorableEvents = story.memorableEvents.map(e => getMemorableEventText(e)).join(', ')

  const mainTone = greeting.greetingTone
  const toneGuide = getToneGuideText(mainTone)

  // 톤에 맞는 샘플 선택
  const greetingSample = SAMPLE_TEXTS.greeting[mainTone as keyof typeof SAMPLE_TEXTS.greeting] || SAMPLE_TEXTS.greeting.sincere
  const thanksSample = SAMPLE_TEXTS.thanks[mainTone as keyof typeof SAMPLE_TEXTS.thanks] || SAMPLE_TEXTS.thanks.sincere
  const profileTone = groomProfile.tone as keyof typeof SAMPLE_TEXTS.profile
  const profileVersion = groomProfile.version as 'short' | 'rich'
  const profileSample = SAMPLE_TEXTS.profile[profileTone]?.[profileVersion] || SAMPLE_TEXTS.profile.sincere.short

  return `당신은 감성적인 한국 웨딩 스토리 전문 작가입니다.
제공된 정보를 바탕으로 진정성 있고 아름다운 청첩장 텍스트를 작성해주세요.

═══════════════════════════════════════════════════
전체 작성 규칙
═══════════════════════════════════════════════════

1. 한국어로 작성
2. 전체 톤: ${getToneDescription(mainTone)}
3. 진정성과 감성을 중시하되 과장 없이
4. 문단 구분 시 빈 줄(\\n\\n)로 명확히 구분
5. 어미 통일: 각 섹션별 지정된 톤에 맞게

${toneGuide}

═══════════════════════════════════════════════════
기본 정보
═══════════════════════════════════════════════════

신랑: ${groomName}
신부: ${brideName}

═══════════════════════════════════════════════════
[1] 인사말 (greeting)
═══════════════════════════════════════════════════

▶ 형식: 2-3문단, 150-250자
▶ 톤: ${getToneDescription(greeting.greetingTone)}
▶ 구조:
  - 첫 문단: 두 사람의 관계/여정 소개
  - 중간 문단: 결혼의 의미와 다짐
  - 마지막 문단: 초대 문구

▶ 입력 정보:
- 관계 기간: ${greeting.relationshipDuration}
- 관계 특징: ${greeting.relationshipTraits.join(', ')}
- 결혼의 의미: ${greeting.marriageMeaning}
${greeting.specialNote ? `- 특별한 내용: ${greeting.specialNote}` : ''}

▶ 참고 샘플:
"${greetingSample}"

═══════════════════════════════════════════════════
[2] 감사말 (thanks)
═══════════════════════════════════════════════════

▶ 형식: 1-2문장, 50-100자
▶ 스타일: ${greeting.thanksStyle}
▶ 감사 대상: ${greeting.thanksTo.join(', ')}

▶ 참고 샘플:
"${thanksSample}"

═══════════════════════════════════════════════════
[3] 신랑 소개 (groomProfile) - 신부가 소개
═══════════════════════════════════════════════════

▶ 형식: ${groomProfile.version === 'short' ? '2-3문단, 150-200자' : '4-5문단, 300-400자'}
▶ 톤: ${getToneDescription(groomProfile.tone)}
▶ 관점: 신부가 신랑을 소개하는 형식

▶ 입력 정보:
- 이름: ${groomName}
- 비유: ${groomMetaphor}
- 특징: ${groomProfile.characteristics.join(', ')}
- 함께 있으면: ${groomFeeling}
${groomProfile.version === 'rich' ? `
- 첫인상 vs 실제: ${groomProfile.firstImpressionVsReality || '(미입력)'}
- 구체적 모습: ${groomProfile.specificDetails || '(미입력)'}
- 양면성: ${groomProfile.duality || '(미입력)'}
- 미래 기대: ${groomProfile.futureExpectation || '(미입력)'}
- 관계 속 역할: ${groomProfile.relationshipHistory || '(미입력)'}
` : ''}

▶ 참고 샘플:
"${profileSample}"

═══════════════════════════════════════════════════
[4] 신부 소개 (brideProfile) - 신랑이 소개
═══════════════════════════════════════════════════

▶ 형식: ${brideProfile.version === 'short' ? '2-3문단, 150-200자' : '4-5문단, 300-400자'}
▶ 톤: ${getToneDescription(brideProfile.tone)}
▶ 관점: 신랑이 신부를 소개하는 형식

▶ 입력 정보:
- 이름: ${brideName}
- 비유: ${brideMetaphor}
- 특징: ${brideProfile.characteristics.join(', ')}
- 함께 있으면: ${brideFeeling}
${brideProfile.version === 'rich' ? `
- 첫인상 vs 실제: ${brideProfile.firstImpressionVsReality || '(미입력)'}
- 구체적 모습: ${brideProfile.specificDetails || '(미입력)'}
- 양면성: ${brideProfile.duality || '(미입력)'}
- 미래 기대: ${brideProfile.futureExpectation || '(미입력)'}
- 관계 속 역할: ${brideProfile.relationshipHistory || '(미입력)'}
` : ''}

═══════════════════════════════════════════════════
[5] 러브스토리 (story) - 3단계 구조
═══════════════════════════════════════════════════

▶ 버전: ${story.version}
▶ 각 단계: 2-3문단씩

[5-1] 연애의 시작 (first)
- 첫 만남: ${story.firstMeetDate.year}년 ${story.firstMeetDate.month}월
- 만난 장소: ${meetPlace}
- 사귀게 된 계기: ${howStarted}
${story.officialDate ? `- 공식 사귄 날: ${story.officialDate.year}년 ${story.officialDate.month}월 ${story.officialDate.day}일` : ''}

참고 샘플:
"${SAMPLE_TEXTS.story.first}"

[5-2] 함께 성장한 시간 (together)
- 관계 기간: ${story.relationshipDuration.years}년 ${story.relationshipDuration.months}개월
- 기억에 남는 일: ${memorableEvents}
${story.specificEpisodes ? `- 구체적 에피소드: ${story.specificEpisodes}` : ''}

참고 샘플:
"${SAMPLE_TEXTS.story.together}"

[5-3] 결혼 준비 (preparation)
${story.proposalStory ? `- 프로포즈: ${story.proposalStory}` : ''}
- 준비 기간: ${story.preparationDuration.years}년 ${story.preparationDuration.months}개월
${story.preparationFeeling ? `- 준비 중 느낌: ${story.preparationFeeling}` : ''}

참고 샘플:
"${SAMPLE_TEXTS.story.preparation}"

═══════════════════════════════════════════════════
[6] 웨딩 인터뷰 (interview)
═══════════════════════════════════════════════════

${getInterviewPrompt(interview)}

═══════════════════════════════════════════════════
출력 형식 (반드시 준수)
═══════════════════════════════════════════════════

다음 JSON 형식으로 정확하게 출력해주세요.
- 문단 구분은 \\n\\n (빈 줄)로 표시
- 줄바꿈은 \\n으로 표시
- JSON 외 다른 텍스트 없이 순수 JSON만 출력

{
  "greeting": "인사말 텍스트",
  "thanks": "감사말 텍스트",
  "groomProfile": "신랑 소개 텍스트",
  "brideProfile": "신부 소개 텍스트",
  "story": {
    "first": "첫 만남/연애 시작",
    "together": "함께 성장한 시간",
    "preparation": "결혼 준비"
  },
  "interview": [
    {
      "question": "질문",
      "groomAnswer": "신랑 답변 (개별시)",
      "brideAnswer": "신부 답변 (개별시)",
      "jointAnswer": "공동 답변 (함께시)"
    }
  ]
}`
}

// ============================================================
// Regeneration Prompt Generator
// ============================================================

/**
 * 개별 섹션 재생성 프롬프트
 */
export function generateRegeneratePrompt(
  section: string,
  formData: AllFormData,
  groomName: string,
  brideName: string,
  currentContent: Record<string, unknown>
): string {
  const { greeting, groomProfile, brideProfile, story, interview } = formData
  const mainTone = greeting.greetingTone
  const toneGuide = getToneGuideText(mainTone)

  // 기존 콘텐츠 컨텍스트
  const contextSummary = `
═══════════════════════════════════════════════════
기존 생성 콘텐츠 (참고용 - 톤과 스타일 유지)
═══════════════════════════════════════════════════

기본 정보: 신랑(${groomName}), 신부(${brideName})
전체 톤: ${getToneDescription(mainTone)}

[기존 인사말]
${currentContent.greeting || '(없음)'}

[기존 감사말]
${currentContent.thanks || '(없음)'}

[기존 신랑 소개]
${currentContent.groomProfile || '(없음)'}

[기존 신부 소개]
${currentContent.brideProfile || '(없음)'}

${toneGuide}

═══════════════════════════════════════════════════
재생성 요청
═══════════════════════════════════════════════════

위 콘텐츠의 톤과 스타일을 유지하면서,
새롭고 신선한 표현으로 아래 섹션만 다시 작성해주세요.
기존 내용을 그대로 복사하지 말고, 같은 정보를 다른 방식으로 표현해주세요.
`

  // 톤에 맞는 샘플 선택
  const greetingSample = SAMPLE_TEXTS.greeting[mainTone as keyof typeof SAMPLE_TEXTS.greeting] || SAMPLE_TEXTS.greeting.sincere
  const thanksSample = SAMPLE_TEXTS.thanks[mainTone as keyof typeof SAMPLE_TEXTS.thanks] || SAMPLE_TEXTS.thanks.sincere

  const sectionPrompts: Record<string, string> = {
    greeting: `${contextSummary}

[인사말 재생성]
▶ 형식: 2-3문단, 150-250자
▶ 톤: ${getToneDescription(greeting.greetingTone)}

▶ 입력 정보:
- 관계 기간: ${greeting.relationshipDuration}
- 관계 특징: ${greeting.relationshipTraits.join(', ')}
- 결혼의 의미: ${greeting.marriageMeaning}
${greeting.specialNote ? `- 특별한 내용: ${greeting.specialNote}` : ''}

▶ 참고 샘플 스타일:
"${greetingSample}"

▶ 출력: 인사말 텍스트만 출력 (JSON 아님)
문단 구분은 빈 줄로 해주세요.`,

    thanks: `${contextSummary}

[감사말 재생성]
▶ 형식: 1-2문장, 50-100자
▶ 스타일: ${greeting.thanksStyle}
▶ 감사 대상: ${greeting.thanksTo.join(', ')}

▶ 참고 샘플:
"${thanksSample}"

▶ 출력: 감사말 텍스트만 출력 (JSON 아님)`,

    groomProfile: `${contextSummary}

[신랑 소개 재생성] - 신부가 소개하는 형식
▶ 형식: ${groomProfile.version === 'short' ? '2-3문단, 150-200자' : '4-5문단, 300-400자'}
▶ 톤: ${getToneDescription(groomProfile.tone)}

▶ 입력 정보:
- 이름: ${groomName}
- 비유: ${getMetaphorText(groomProfile.metaphor)}
- 특징: ${groomProfile.characteristics.join(', ')}
- 함께 있으면: ${getTogetherFeelingText(groomProfile.togetherFeeling)}
${groomProfile.version === 'rich' ? `
- 첫인상 vs 실제: ${groomProfile.firstImpressionVsReality || ''}
- 구체적 모습: ${groomProfile.specificDetails || ''}
- 양면성: ${groomProfile.duality || ''}
` : ''}

▶ 참고 샘플 스타일:
"${SAMPLE_TEXTS.profile[groomProfile.tone as keyof typeof SAMPLE_TEXTS.profile]?.[groomProfile.version as 'short' | 'rich'] || SAMPLE_TEXTS.profile.sincere.short}"

▶ 출력: 신랑 소개 텍스트만 출력 (JSON 아님)
문단 구분은 빈 줄로 해주세요.`,

    brideProfile: `${contextSummary}

[신부 소개 재생성] - 신랑이 소개하는 형식
▶ 형식: ${brideProfile.version === 'short' ? '2-3문단, 150-200자' : '4-5문단, 300-400자'}
▶ 톤: ${getToneDescription(brideProfile.tone)}

▶ 입력 정보:
- 이름: ${brideName}
- 비유: ${getMetaphorText(brideProfile.metaphor)}
- 특징: ${brideProfile.characteristics.join(', ')}
- 함께 있으면: ${getTogetherFeelingText(brideProfile.togetherFeeling)}
${brideProfile.version === 'rich' ? `
- 첫인상 vs 실제: ${brideProfile.firstImpressionVsReality || ''}
- 구체적 모습: ${brideProfile.specificDetails || ''}
- 양면성: ${brideProfile.duality || ''}
` : ''}

▶ 출력: 신부 소개 텍스트만 출력 (JSON 아님)
문단 구분은 빈 줄로 해주세요.`,

    'story.first': `${contextSummary}

[연애 시작 이야기 재생성]
▶ 형식: 2-3문단
▶ 톤: ${getToneDescription(mainTone)}

▶ 입력 정보:
- 첫 만남: ${story.firstMeetDate.year}년 ${story.firstMeetDate.month}월
- 만난 장소: ${getMeetPlaceText(story.firstMeetPlace)}
- 사귀게 된 계기: ${getHowStartedText(story.howStarted)}
${story.officialDate ? `- 공식 사귄 날: ${story.officialDate.year}년 ${story.officialDate.month}월 ${story.officialDate.day}일` : ''}

▶ 참고 샘플:
"${SAMPLE_TEXTS.story.first}"

▶ 출력: 연애 시작 이야기 텍스트만 출력 (JSON 아님)
문단 구분은 빈 줄로 해주세요.`,

    'story.together': `${contextSummary}

[함께 성장한 시간 재생성]
▶ 형식: 2-3문단
▶ 톤: ${getToneDescription(mainTone)}

▶ 입력 정보:
- 관계 기간: ${story.relationshipDuration.years}년 ${story.relationshipDuration.months}개월
- 기억에 남는 일: ${story.memorableEvents.map(e => getMemorableEventText(e)).join(', ')}
${story.specificEpisodes ? `- 구체적 에피소드: ${story.specificEpisodes}` : ''}

▶ 참고 샘플:
"${SAMPLE_TEXTS.story.together}"

▶ 출력: 함께 성장한 시간 이야기 텍스트만 출력 (JSON 아님)
문단 구분은 빈 줄로 해주세요.`,

    'story.preparation': `${contextSummary}

[결혼 준비 이야기 재생성]
▶ 형식: 2-3문단
▶ 톤: ${getToneDescription(mainTone)}

▶ 입력 정보:
${story.proposalStory ? `- 프로포즈: ${story.proposalStory}` : ''}
- 준비 기간: ${story.preparationDuration.years}년 ${story.preparationDuration.months}개월
${story.preparationFeeling ? `- 준비 중 느낌: ${story.preparationFeeling}` : ''}

▶ 참고 샘플:
"${SAMPLE_TEXTS.story.preparation}"

▶ 출력: 결혼 준비 이야기 텍스트만 출력 (JSON 아님)
문단 구분은 빈 줄로 해주세요.`,

    interview: `${contextSummary}

[웨딩 인터뷰 재생성]
${getInterviewPrompt(interview)}

▶ 출력: JSON 배열 형식으로만 출력
[
  {
    "question": "질문",
    "groomAnswer": "신랑 답변 (개별시)",
    "brideAnswer": "신부 답변 (개별시)",
    "jointAnswer": "공동 답변 (함께시)"
  }
]`
  }

  return sectionPrompts[section] || ''
}
