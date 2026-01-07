export type AIQuestion = {
  id: string
  question: string
  description: string
  placeholder: string
  type: 'text' | 'textarea' | 'select' | 'date'
  options?: string[]
  required: boolean
  category: 'basic' | 'story' | 'style' | 'message'
  templateType?: 'all' | 'our' | 'family' // 특정 템플릿용 질문
}

export const aiQuestions: AIQuestion[] = [
  {
    id: 'couple_story',
    question: '두 분은 어떻게 만나셨나요?',
    description: '첫 만남의 에피소드를 들려주세요. AI가 감동적인 스토리로 만들어 드립니다.',
    placeholder: '예: 대학교 동아리에서 처음 만났어요. 같은 프로젝트 팀이 되면서 자연스럽게 가까워졌습니다.',
    type: 'textarea',
    required: true,
    category: 'story',
  },
  {
    id: 'proposal_story',
    question: '프로포즈는 어떻게 하셨나요?',
    description: '특별한 프로포즈 순간을 공유해 주세요.',
    placeholder: '예: 제주도 여행 중 일몰을 보며 프로포즈했어요.',
    type: 'textarea',
    required: false,
    category: 'story',
  },
  {
    id: 'wedding_theme',
    question: '원하시는 결혼식 분위기는 어떤가요?',
    description: '청첩장의 전체적인 톤과 분위기를 결정하는 데 참고합니다.',
    placeholder: '',
    type: 'select',
    options: ['격식있고 우아한', '따뜻하고 감성적인', '모던하고 세련된', '자연스럽고 편안한', '유니크하고 개성있는'],
    required: true,
    category: 'style',
  },
  {
    id: 'guest_relation',
    question: '주로 어떤 분들을 초대하시나요?',
    description: '하객 구성에 맞는 문구 톤을 추천해 드립니다.',
    placeholder: '',
    type: 'select',
    options: ['가족/친척 위주', '직장 동료 위주', '친구 위주', '고르게 섞여 있음'],
    required: true,
    category: 'basic',
  },
  {
    id: 'special_message',
    question: '하객분들께 전하고 싶은 특별한 메시지가 있나요?',
    description: '감사 인사나 특별히 전하고 싶은 말씀을 적어주세요.',
    placeholder: '예: 바쁘신 와중에도 저희의 새 출발을 축하해 주셔서 감사합니다.',
    type: 'textarea',
    required: false,
    category: 'message',
  },
  {
    id: 'couple_hobby',
    question: '두 분의 공통 취미나 관심사가 있나요?',
    description: '청첩장에 두 분의 개성을 담을 수 있습니다.',
    placeholder: '예: 함께 등산하는 것을 좋아해요. 여행도 자주 다녀요.',
    type: 'textarea',
    required: false,
    category: 'story',
  },
  {
    id: 'wedding_wish',
    question: '결혼 후 어떤 가정을 꿈꾸시나요?',
    description: '두 분의 미래 비전을 담은 문구를 만들어 드립니다.',
    placeholder: '예: 서로를 존중하고 응원하는 따뜻한 가정을 만들고 싶어요.',
    type: 'textarea',
    required: false,
    category: 'message',
  },
  {
    id: 'formality_level',
    question: '청첩장 문구의 격식 수준을 선택해 주세요.',
    description: '문구의 존댓말 수준과 격식을 결정합니다.',
    placeholder: '',
    type: 'select',
    options: ['매우 격식있게 (어르신 중심)', '적당히 격식있게', '친근하고 편안하게', '캐주얼하게'],
    required: true,
    category: 'style',
  },
  {
    id: 'venue_description',
    question: '예식장의 특징이나 분위기를 설명해 주세요.',
    description: '장소 안내 문구 작성에 참고합니다.',
    placeholder: '예: 한강이 보이는 호텔 루프탑에서 진행해요. 야외 예식입니다.',
    type: 'textarea',
    required: false,
    category: 'basic',
  },
  {
    id: 'additional_info',
    question: '청첩장에 꼭 포함되었으면 하는 내용이 있나요?',
    description: '특별한 요청사항이나 추가 정보를 알려주세요.',
    placeholder: '예: 주차 안내, 드레스코드, 축의금 대신 기부 요청 등',
    type: 'textarea',
    required: false,
    category: 'message',
  },
]

// OUR 템플릿용 질문 (커플 서사 중심)
export const ourTemplateQuestions: AIQuestion[] = [
  {
    id: 'our_first_meeting',
    question: '두 분은 언제, 어디서, 어떻게 처음 만나셨나요?',
    description: '첫 만남의 시간, 장소, 상황을 알려주세요.',
    placeholder: '예: 2019년 봄, 회사 복도에서 우연히 마주쳤어요.',
    type: 'textarea',
    required: true,
    category: 'story',
    templateType: 'our',
  },
  {
    id: 'our_first_impression',
    question: '첫 만남에서 가장 기억에 남는 장면이나 감정은 무엇인가요?',
    description: '그때의 느낌이나 인상적인 순간을 떠올려 주세요.',
    placeholder: '예: 웃을 때 눈이 초승달처럼 휘어지는 게 인상적이었어요.',
    type: 'textarea',
    required: true,
    category: 'story',
    templateType: 'our',
  },
  {
    id: 'our_special_moment',
    question: '"이 사람이 특별하다"고 처음 느낀 순간은 언제였나요?',
    description: '상대방이 특별하게 느껴진 결정적 순간이 있다면 알려주세요.',
    placeholder: '예: 제가 아플 때 새벽에 죽을 끓여 와줬을 때요.',
    type: 'textarea',
    required: true,
    category: 'story',
    templateType: 'our',
  },
  {
    id: 'our_precious_memory',
    question: '함께한 시간 중 가장 소중한 추억은 무엇인가요?',
    description: '구체적인 에피소드로 알려주세요.',
    placeholder: '예: 제주도 여행에서 새벽 일출을 함께 본 것이 가장 기억에 남아요.',
    type: 'textarea',
    required: true,
    category: 'story',
    templateType: 'our',
  },
  {
    id: 'our_meaning',
    question: '서로에게 어떤 의미인가요?',
    description: '상대방이 나에게 어떤 존재인지 표현해 주세요.',
    placeholder: '예: 안식처 같은 사람이에요. 함께 있으면 편안해요.',
    type: 'textarea',
    required: true,
    category: 'story',
    templateType: 'our',
  },
  {
    id: 'our_overcome',
    question: '힘들었던 순간을 함께 극복한 경험이 있다면?',
    description: '선택 사항입니다. 함께 이겨낸 어려움이 있다면 알려주세요.',
    placeholder: '예: 장거리 연애 시절, 2년간 매주 KTX를 타고 만났어요.',
    type: 'textarea',
    required: false,
    category: 'story',
    templateType: 'our',
  },
  {
    id: 'our_love_point',
    question: '상대방의 어떤 점이 가장 좋으신가요?',
    description: '성격, 습관, 가치관 등 무엇이든 좋아요.',
    placeholder: '예: 어떤 상황에서도 긍정적인 점이 좋아요.',
    type: 'textarea',
    required: true,
    category: 'story',
    templateType: 'our',
  },
  {
    id: 'our_decision',
    question: '결혼을 결심하게 된 결정적인 이유나 순간은?',
    description: '프로포즈 순간이 아니어도 괜찮아요.',
    placeholder: '예: 부모님이 아프셨을 때 함께 간병해주는 모습을 보고 결심했어요.',
    type: 'textarea',
    required: true,
    category: 'story',
    templateType: 'our',
  },
  {
    id: 'our_future',
    question: '결혼 후 어떤 모습으로 함께 살아가고 싶으신가요?',
    description: '꿈꾸는 결혼 생활의 모습을 알려주세요.',
    placeholder: '예: 매일 저녁 함께 산책하며 소소한 일상을 나누고 싶어요.',
    type: 'textarea',
    required: false,
    category: 'message',
    templateType: 'our',
  },
  {
    id: 'our_guest_message',
    question: '하객들에게 전하고 싶은 한 문장이 있다면?',
    description: '청첩장에 담고 싶은 메시지가 있다면 알려주세요.',
    placeholder: '예: 우리의 첫 장을 함께 열어주세요.',
    type: 'textarea',
    required: false,
    category: 'message',
    templateType: 'our',
  },
]

// FAMILY 템플릿용 질문 (가족 서사 중심)
export const familyTemplateQuestions: AIQuestion[] = [
  // 신랑 관련
  {
    id: 'family_groom_background',
    question: '신랑님은 어떤 가정에서 자라셨나요?',
    description: '부모님 성향, 가족 분위기 등을 알려주세요.',
    placeholder: '예: 아버지는 군인이셨고, 어머니는 선생님이셨어요. 엄격하지만 따뜻한 가정이었습니다.',
    type: 'textarea',
    required: true,
    category: 'story',
    templateType: 'family',
  },
  {
    id: 'family_groom_values',
    question: '신랑님의 성격이나 가치관 중 가족으로부터 물려받은 것이 있다면?',
    description: '가족에게서 배운 것을 알려주세요.',
    placeholder: '예: 아버지의 성실함과 어머니의 다정함을 닮았다고 해요.',
    type: 'textarea',
    required: true,
    category: 'story',
    templateType: 'family',
  },
  {
    id: 'family_groom_parent_value',
    question: '신랑님 부모님이 자녀 양육에서 가장 중요하게 생각하신 가치는?',
    description: '성실함, 배려, 책임감 등의 키워드로 알려주세요.',
    placeholder: '예: 항상 "약속을 지키는 사람이 되라"고 하셨어요.',
    type: 'textarea',
    required: false,
    category: 'story',
    templateType: 'family',
  },
  {
    id: 'family_groom_role',
    question: '신랑님이 가족에게 어떤 존재인가요?',
    description: '가족 내에서의 역할을 알려주세요.',
    placeholder: '예: 든든한 장남으로 동생들을 잘 챙겨요.',
    type: 'textarea',
    required: false,
    category: 'story',
    templateType: 'family',
  },
  // 신부 관련
  {
    id: 'family_bride_background',
    question: '신부님은 어떤 가정에서 자라셨나요?',
    description: '부모님 성향, 가족 분위기 등을 알려주세요.',
    placeholder: '예: 부모님 두 분 다 교육자셨어요. 늘 대화가 많은 가정이었습니다.',
    type: 'textarea',
    required: true,
    category: 'story',
    templateType: 'family',
  },
  {
    id: 'family_bride_values',
    question: '신부님의 성격이나 가치관 중 가족으로부터 물려받은 것이 있다면?',
    description: '가족에게서 배운 것을 알려주세요.',
    placeholder: '예: 어머니의 낙천적인 성격을 많이 닮았어요.',
    type: 'textarea',
    required: true,
    category: 'story',
    templateType: 'family',
  },
  {
    id: 'family_bride_parent_value',
    question: '신부님 부모님이 자녀 양육에서 가장 중요하게 생각하신 가치는?',
    description: '성실함, 배려, 책임감 등의 키워드로 알려주세요.',
    placeholder: '예: "네 행복이 가장 중요하다"고 항상 말씀해주셨어요.',
    type: 'textarea',
    required: false,
    category: 'story',
    templateType: 'family',
  },
  {
    id: 'family_bride_role',
    question: '신부님이 가족에게 어떤 존재인가요?',
    description: '가족 내에서의 역할을 알려주세요.',
    placeholder: '예: 막내딸로 가족 분위기를 밝게 만드는 역할이에요.',
    type: 'textarea',
    required: false,
    category: 'story',
    templateType: 'family',
  },
  // 커플 및 가족 관계
  {
    id: 'family_couple_meeting',
    question: '두 분은 어떻게 만나셨고, 언제부터 가족이 되고 싶다고 생각하셨나요?',
    description: '만남의 계기와 결혼을 결심한 시점을 알려주세요.',
    placeholder: '예: 친구 소개로 만났고, 서로의 가족을 만난 후 확신이 생겼어요.',
    type: 'textarea',
    required: true,
    category: 'story',
    templateType: 'family',
  },
  {
    id: 'family_first_family_meeting',
    question: '서로의 가족을 처음 만났을 때 느낌은 어땠나요?',
    description: '상대 가족을 만났을 때의 인상을 알려주세요.',
    placeholder: '예: 신랑 부모님이 정말 따뜻하게 맞아주셔서 긴장이 풀렸어요.',
    type: 'textarea',
    required: false,
    category: 'story',
    templateType: 'family',
  },
  {
    id: 'family_future_home',
    question: '결혼을 통해 어떤 가정을 꾸리고 싶으신가요?',
    description: '가치관, 분위기 등 원하는 가정의 모습을 알려주세요.',
    placeholder: '예: 서로 존중하고, 아이들에게 사랑을 듬뿍 주는 가정을 만들고 싶어요.',
    type: 'textarea',
    required: true,
    category: 'message',
    templateType: 'family',
  },
  {
    id: 'family_parent_words',
    question: '부모님께서 두 분의 결혼에 대해 하신 말씀 중 기억에 남는 것이 있다면?',
    description: '부모님 메시지 섹션에 활용됩니다. (선택 사항)',
    placeholder: '예: "좋은 사람 만났구나. 행복하게 살아라."라고 하셨어요.',
    type: 'textarea',
    required: false,
    category: 'message',
    templateType: 'family',
  },
]

export function getQuestionsByCategory(category: AIQuestion['category']): AIQuestion[] {
  return aiQuestions.filter((q) => q.category === category)
}

export function getRequiredQuestions(): AIQuestion[] {
  return aiQuestions.filter((q) => q.required)
}

export function getQuestionById(id: string): AIQuestion | undefined {
  return [...aiQuestions, ...ourTemplateQuestions, ...familyTemplateQuestions].find((q) => q.id === id)
}

// 템플릿 타입별 질문 가져오기
export function getQuestionsByTemplateType(templateType: 'our' | 'family'): AIQuestion[] {
  if (templateType === 'our') {
    return ourTemplateQuestions
  }
  return familyTemplateQuestions
}

// 모든 질문 가져오기 (기본 + 템플릿 특화)
export function getAllQuestions(): AIQuestion[] {
  return [...aiQuestions, ...ourTemplateQuestions, ...familyTemplateQuestions]
}
