// AI 스토리 생성기 타입 정의

// 버전 타입
// 'short' = 간결 (핵심 위주, 5-7문장)
// 'rich' = 풍부 (에피소드 포함, 10-15문장)
export type Version = 'short' | 'rich';

// 톤 타입
export type Tone = 'sincere' | 'warm' | 'concise' | 'cheerful';

// 톤 라벨
export const ToneLabels: Record<Tone, string> = {
  sincere: '진심 어린',
  warm: '따뜻한',
  concise: '간결한',
  cheerful: '밝고 경쾌한',
};

// 감사 스타일 타입
export type ThanksStyle = 'formal' | 'warm' | 'friendly' | 'simple' | 'humble';

// 감사 스타일 라벨
export const ThanksStyleLabels: Record<ThanksStyle, string> = {
  formal: '격식 있는',
  warm: '따뜻한',
  friendly: '친근한',
  simple: '간결한',
  humble: '겸손한',
};

// 인사말/감사말 폼 데이터
export interface GreetingFormData {
  relationshipDuration: string;
  relationshipTraits: string[];
  marriageMeaning: string;
  specialNote?: string;
  greetingTone: Tone;
  thanksTo: string[];  // 항상 ['everyone']으로 설정됨
  thanksStyle: ThanksStyle;
}

// 신랑신부 소개 폼 데이터
export interface ProfileFormData {
  version: Version;
  name: string;
  metaphor: string;
  characteristics: string[];
  togetherFeeling: string;
  tone: Tone;
  // 풍부한 버전 추가 필드
  firstImpressionVsReality?: string;
  specificDetails?: string;
  duality?: string;
  futureExpectation?: string;
  relationshipHistory?: string;
}

// 러브스토리 폼 데이터
export interface StoryFormData {
  version: Version;
  // 1단계: 연애의 시작
  firstMeetDate: { year: number; month: number };
  firstMeetPlace: string;
  howStarted: string;
  officialDate?: { year: number; month: number; day: number };
  // 2단계: 함께 성장
  relationshipDuration: { years: number; months: number };
  memorableEvents: string[];
  specificEpisodes?: string;
  // 3단계: 결혼 준비
  proposalStory?: string;
  preparationDuration: { years: number; months: number };
  preparationFeeling?: string;
}

// 웨딩 인터뷰 폼 데이터
export interface InterviewFormData {
  version: Version;
  // 'short' = 간결 (핵심 위주, 5-7문장)
  // 'rich' = 풍부 (에피소드 포함, 10-15문장)

  type: 'auto' | 'popular' | 'custom';

  // auto인 경우 (2-3개 선택)
  topics?: string[];
  answerStyle?: 'individual' | 'together' | 'mixed';

  // popular인 경우 (2-3개 선택)
  selectedQuestions?: string[];

  // custom인 경우 (2-3개 작성)
  customQuestions?: Array<{
    question: string;
    answerStyle: 'individual' | 'together';
  }>;

  // 답변 힌트 (선택)
  hints?: Record<string, { groom?: string; bride?: string; joint?: string }>;
}

// 전체 폼 데이터
export interface AllFormData {
  greeting: GreetingFormData;
  groomProfile: ProfileFormData;
  brideProfile: ProfileFormData;
  story: StoryFormData;
  interview: InterviewFormData;
}

// 생성된 결과
export interface GeneratedContent {
  greeting: string;
  thanks: string;
  groomProfile: string;
  brideProfile: string;
  story: {
    first: string;
    together: string;
    preparation: string;
  };
  interview: Array<{
    question: string;
    groomAnswer?: string;
    brideAnswer?: string;
    jointAnswer?: string;
  }>;
}

// 스텝 정의
export type StepId = 'greeting' | 'profile' | 'story' | 'interview' | 'result';

export interface Step {
  id: StepId;
  title: string;
  description: string;
}

export const STEPS: Step[] = [
  { id: 'greeting', title: '인사말', description: '인사말과 감사의 글을 작성해요' },
  { id: 'profile', title: '소개', description: '신랑·신부를 소개해요' },
  { id: 'story', title: '스토리', description: '우리의 러브스토리를 작성해요' },
  { id: 'interview', title: '인터뷰', description: '웨딩 인터뷰를 만들어요' },
  { id: 'result', title: '결과', description: '생성된 결과를 확인해요' },
];

// 기본값
export const defaultGreetingForm: GreetingFormData = {
  relationshipDuration: '',
  relationshipTraits: [],
  marriageMeaning: '',
  specialNote: '',
  greetingTone: 'warm',
  thanksTo: ['everyone'],  // 항상 'everyone'으로 설정
  thanksStyle: 'formal',
};

export const defaultProfileForm: ProfileFormData = {
  version: 'short',
  name: '',
  metaphor: '',
  characteristics: [],
  togetherFeeling: '',
  tone: 'warm',
};

export const defaultStoryForm: StoryFormData = {
  version: 'short',
  firstMeetDate: { year: new Date().getFullYear() - 3, month: 1 },
  firstMeetPlace: '',
  howStarted: '',
  relationshipDuration: { years: 0, months: 0 },
  memorableEvents: [],
  preparationDuration: { years: 0, months: 0 },
};

export const defaultInterviewForm: InterviewFormData = {
  version: 'short',
  type: 'auto',
  topics: [],
  answerStyle: 'mixed',
};

// 인기 인터뷰 질문
export const POPULAR_INTERVIEW_QUESTIONS = [
  '첫 만남의 인상은 어땠나요?',
  '프로포즈는 어떻게 했나요?',
  '상대방의 가장 좋아하는 점은?',
  '함께하면서 가장 행복했던 순간은?',
  '결혼을 결심한 계기는?',
  '앞으로 어떤 가정을 꾸리고 싶나요?',
  '상대방에게 하고 싶은 말은?',
  '하객분들께 전하고 싶은 말은?',
];

// 인터뷰 주제 (AI 자동 생성용)
export const INTERVIEW_TOPICS = [
  { id: 'decision', label: '결혼 결심 이유', description: '왜 결혼하기로 했는지' },
  { id: 'promise', label: '관계의 약속/원칙', description: '지키고 싶은 약속, 하지 말아야 할 것' },
  { id: 'preparation', label: '결혼 준비 과정', description: '준비하면서 느낀 점' },
  { id: 'future', label: '미래 계획', description: '신혼여행, 결혼 후 계획' },
  { id: 'each-other', label: '서로에 대한 질문', description: '첫인상, 좋은 점, 변한 점' },
];

// 인기 질문 상세 데이터
export type AnswerStyle = 'individual' | 'together';
export type QuestionCategory = 'meaning' | 'promise' | 'preparation' | 'each-other';

export interface PopularQuestion {
  id: string;
  text: string;
  answerStyle: AnswerStyle;
  category: QuestionCategory;
}

export const POPULAR_QUESTIONS: Record<string, PopularQuestion> = {
  q1: {
    id: 'q1',
    text: '결혼을 결심한 이유는 무엇인가요?',
    answerStyle: 'individual',
    category: 'meaning'
  },
  q2: {
    id: 'q2',
    text: '결혼 생활의 행복은 무엇이라고 생각하나요?',
    answerStyle: 'together',
    category: 'meaning'
  },
  q3: {
    id: 'q3',
    text: '두 사람의 결혼생활은 어떤 장르면 좋겠나요?',
    answerStyle: 'together',
    category: 'meaning'
  },
  q4: {
    id: 'q4',
    text: '결혼 생활 중 이것만은 절대 하지 말자는 한 가지는?',
    answerStyle: 'together',
    category: 'promise'
  },
  q5: {
    id: 'q5',
    text: '결혼 생활에서 꼭 지키고 싶은 약속은 무엇인가요?',
    answerStyle: 'together',
    category: 'promise'
  },
  q6: {
    id: 'q6',
    text: '상대방의 어떤 점이 가장 좋나요?',
    answerStyle: 'individual',
    category: 'promise'
  },
  q7: {
    id: 'q7',
    text: '결혼 준비는 어떠했나요?',
    answerStyle: 'together',
    category: 'preparation'
  },
  q8: {
    id: 'q8',
    text: '신혼여행은 어디로 가나요?',
    answerStyle: 'together',
    category: 'preparation'
  },
  q9: {
    id: 'q9',
    text: '결혼 후 가장 하고 싶은 일은?',
    answerStyle: 'individual',
    category: 'preparation'
  },
  q10: {
    id: 'q10',
    text: '상대방의 첫인상은?',
    answerStyle: 'individual',
    category: 'each-other'
  },
  q11: {
    id: 'q11',
    text: '상대방 때문에 변한 점이 있나요?',
    answerStyle: 'individual',
    category: 'each-other'
  },
  q12: {
    id: 'q12',
    text: '평생 함께하고 싶은 이유는?',
    answerStyle: 'individual',
    category: 'each-other'
  }
};

// 카테고리별 질문 그룹
export const QUESTION_CATEGORIES = [
  { id: 'meaning', title: '💕 결혼의 의미', questions: ['q1', 'q2', 'q3'] },
  { id: 'promise', title: '🤝 관계의 약속', questions: ['q4', 'q5', 'q6'] },
  { id: 'preparation', title: '💍 결혼 준비 & 계획', questions: ['q7', 'q8', 'q9'] },
  { id: 'each-other', title: '💑 서로에 대해', questions: ['q10', 'q11', 'q12'] },
];

// 질문 텍스트 가져오기 헬퍼
export function getQuestionText(qId: string): string {
  return POPULAR_QUESTIONS[qId]?.text || '';
}

// 기억에 남는 이벤트 옵션
export const MEMORABLE_EVENTS = [
  { id: 'first_trip', label: '첫 여행' },
  { id: 'anniversary', label: '기념일' },
  { id: 'hardship', label: '힘든 시기 극복' },
  { id: 'family_intro', label: '가족 소개' },
  { id: 'cohabitation', label: '동거 시작' },
  { id: 'pet', label: '반려동물' },
  { id: 'milestone', label: '인생의 전환점' },
];

// 관계 특성 옵션
export const RELATIONSHIP_TRAITS = [
  { id: 'best_friend', label: '절친한 친구 같은' },
  { id: 'supportive', label: '서로 응원하는' },
  { id: 'playful', label: '장난스러운' },
  { id: 'calm', label: '차분하고 편안한' },
  { id: 'passionate', label: '열정적인' },
  { id: 'growth', label: '함께 성장하는' },
];

// 감사 대상 옵션
export const THANKS_TO_OPTIONS = [
  { id: 'parents', label: '부모님' },
  { id: 'family', label: '가족' },
  { id: 'friends', label: '친구들' },
  { id: 'colleagues', label: '직장 동료' },
  { id: 'guests', label: '하객 분들' },
];
