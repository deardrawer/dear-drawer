// 필드 헬퍼 - 각 입력 필드에 대한 설명과 예시 제공

export type PreviewSection =
  | 'cover'           // 표지
  | 'greeting'        // 인사말
  | 'family'          // 가족 소개
  | 'couple-profile'  // 커플 소개
  | 'our-story'       // 우리 이야기
  | 'interview'       // 인터뷰
  | 'gallery'         // 갤러리
  | 'info'            // 안내 정보
  | 'directions'      // 오시는 길
  | 'rsvp'            // RSVP
  | 'bank-accounts'   // 축의금
  | 'thank-you'       // 감사 인사
  | 'guestbook'       // 방명록

export interface FieldHelper {
  label: string           // 필드 라벨
  explanation: string     // 간단한 설명
  example: string         // 예시 텍스트/플레이스홀더
  previewSection?: PreviewSection // 매핑되는 미리보기 섹션
}

// 섹션 라벨 (한글)
export const sectionLabels: Record<PreviewSection, string> = {
  'cover': '표지',
  'greeting': '인사말',
  'family': '가족 소개',
  'couple-profile': '커플 소개',
  'our-story': '우리 이야기',
  'interview': '인터뷰',
  'gallery': '갤러리',
  'info': '안내 정보',
  'directions': '오시는 길',
  'rsvp': 'RSVP',
  'bank-accounts': '축의금',
  'thank-you': '감사 인사',
  'guestbook': '방명록',
}

// 섹션 배지 색상
export const sectionColors: Record<PreviewSection, string> = {
  'cover': 'bg-purple-100 text-purple-700',
  'greeting': 'bg-blue-100 text-blue-700',
  'family': 'bg-amber-100 text-amber-700',
  'couple-profile': 'bg-pink-100 text-pink-700',
  'our-story': 'bg-rose-100 text-rose-700',
  'interview': 'bg-indigo-100 text-indigo-700',
  'gallery': 'bg-emerald-100 text-emerald-700',
  'info': 'bg-cyan-100 text-cyan-700',
  'directions': 'bg-orange-100 text-orange-700',
  'rsvp': 'bg-violet-100 text-violet-700',
  'bank-accounts': 'bg-yellow-100 text-yellow-700',
  'thank-you': 'bg-teal-100 text-teal-700',
  'guestbook': 'bg-lime-100 text-lime-700',
}

export const fieldHelpers: Record<string, FieldHelper> = {
  // ===== 디자인 설정 =====
  'design.coverTitle': {
    label: '표지 제목',
    explanation: '청첩장 표지에 크게 표시되는 제목이에요',
    example: 'OUR WEDDING',
    previewSection: 'cover',
  },
  'design.introAnimation': {
    label: '인트로 애니메이션',
    explanation: '청첩장을 열었을 때 나타나는 애니메이션 효과예요',
    example: '페이드 인',
    previewSection: 'cover',
  },
  'bgm.url': {
    label: '배경음악 URL',
    explanation: '청첩장에 재생될 배경음악 링크예요',
    example: 'https://example.com/wedding-bgm.mp3',
    previewSection: 'cover',
  },

  // ===== 신랑신부 기본정보 =====
  'groom.name': {
    label: '신랑 이름',
    explanation: '청첩장에 표시될 신랑 이름이에요',
    example: '김민준',
    previewSection: 'cover',
  },
  'groom.phone': {
    label: '신랑 연락처 (선택)',
    explanation: '선택 입력이에요. 입력하면 하단 버튼의 "안내정보 → 연락처"에 표시돼요.',
    example: '010-1234-5678',
    previewSection: 'info',
  },
  'bride.name': {
    label: '신부 이름',
    explanation: '청첩장에 표시될 신부 이름이에요',
    example: '이서연',
    previewSection: 'cover',
  },
  'bride.phone': {
    label: '신부 연락처 (선택)',
    explanation: '선택 입력이에요. 입력하면 하단 버튼의 "안내정보 → 연락처"에 표시돼요.',
    example: '010-8765-4321',
    previewSection: 'info',
  },

  // ===== 가족 정보 =====
  'groom.father.name': {
    label: '신랑 아버지 성함',
    explanation: '청첩장에 표시될 신랑 아버지 성함이에요',
    example: '김철수',
    previewSection: 'family',
  },
  'groom.mother.name': {
    label: '신랑 어머니 성함',
    explanation: '청첩장에 표시될 신랑 어머니 성함이에요',
    example: '박영희',
    previewSection: 'family',
  },
  'bride.father.name': {
    label: '신부 아버지 성함',
    explanation: '청첩장에 표시될 신부 아버지 성함이에요',
    example: '이정호',
    previewSection: 'family',
  },
  'bride.mother.name': {
    label: '신부 어머니 성함',
    explanation: '청첩장에 표시될 신부 어머니 성함이에요',
    example: '김미영',
    previewSection: 'family',
  },

  // ===== 인사말 =====
  'content.greeting': {
    label: '인사말',
    explanation: '하객분들께 전하는 인사말이에요. 형식적인 말보다 두 사람의 이야기를 담아보세요.',
    example: '처음 만난 순간부터 지금까지, 서로의 곁에서 함께 웃고 울며 걸어왔습니다. 이제 평생을 약속하는 자리에 소중한 분들을 초대합니다.',
    previewSection: 'greeting',
  },
  'content.quote.text': {
    label: '명언/문구',
    explanation: '인사말 위에 표시될 특별한 문구예요 (선택사항)',
    example: '사랑한다는 것은 서로의 눈을 바라보는 것이 아니라, 같은 방향을 바라보는 것이다.',
    previewSection: 'greeting',
  },
  'content.quote.author': {
    label: '명언 출처',
    explanation: '문구의 출처나 작가 이름이에요',
    example: '생텍쥐페리',
    previewSection: 'greeting',
  },

  // ===== 결혼식 정보 =====
  'wedding.date': {
    label: '결혼식 날짜',
    explanation: '예식 날짜를 선택해주세요',
    example: '2024-11-04',
    previewSection: 'cover',
  },
  'wedding.time': {
    label: '결혼식 시간',
    explanation: '예식 시간을 선택해주세요',
    example: '14:00',
    previewSection: 'cover',
  },
  'wedding.timeDisplay': {
    label: '시간 표시 형식',
    explanation: '청첩장에 표시될 시간 형식이에요',
    example: '오후 2시',
    previewSection: 'cover',
  },
  'wedding.venue.name': {
    label: '예식장명',
    explanation: '결혼식이 진행될 예식장 이름이에요',
    example: '더클래식500',
    previewSection: 'directions',
  },
  'wedding.venue.hall': {
    label: '홀/층',
    explanation: '예식장 내 구체적인 위치예요',
    example: '5층 그랜드홀',
    previewSection: 'directions',
  },
  'wedding.venue.address': {
    label: '주소',
    explanation: '예식장 주소예요',
    example: '서울특별시 강남구 테헤란로 123',
    previewSection: 'directions',
  },

  // ===== 오시는 길 =====
  'wedding.directions.car.desc': {
    label: '자가용 안내',
    explanation: '자가용으로 오시는 분들을 위한 안내예요',
    example: '강남역 방향에서 테헤란로를 따라 직진',
    previewSection: 'directions',
  },
  'wedding.directions.parking.location': {
    label: '주차 안내',
    explanation: '주차장 위치를 안내해주세요',
    example: '건물 지하 1~3층 주차장',
    previewSection: 'directions',
  },
  'wedding.directions.parking.fee': {
    label: '주차 요금',
    explanation: '주차 요금 정보예요',
    example: '3시간 무료, 이후 10분당 1,000원',
    previewSection: 'directions',
  },

  // ===== 커플 소개 =====
  'groom.profile.aboutLabel': {
    label: '소개 라벨',
    explanation: '프로필 섹션의 제목이에요',
    example: 'ABOUT GROOM',
    previewSection: 'couple-profile',
  },
  'groom.profile.subtitle': {
    label: '소개 부제목',
    explanation: '누가 작성한 소개인지 알려주는 부제목이에요',
    example: '신부가 소개하는 신랑',
    previewSection: 'couple-profile',
  },
  'groom.profile.intro': {
    label: '신랑 소개글',
    explanation: '신부가 작성하는 신랑 소개예요. 어떤 사람인지, 어떤 점이 좋은지 자유롭게 써보세요.',
    example: '처음 만났을 때 무뚝뚝해 보였는데, 알고 보니 세상에서 가장 따뜻한 사람이었어요. 힘들 때 말없이 옆에 있어주는 사람, 그게 이 사람이에요.',
    previewSection: 'couple-profile',
  },
  'groom.profile.tag': {
    label: '신랑 태그',
    explanation: '신랑을 한마디로 표현하는 태그예요',
    example: '세상에서 제일 따뜻한 사람',
    previewSection: 'couple-profile',
  },
  'bride.profile.aboutLabel': {
    label: '소개 라벨',
    explanation: '프로필 섹션의 제목이에요',
    example: 'ABOUT BRIDE',
    previewSection: 'couple-profile',
  },
  'bride.profile.subtitle': {
    label: '소개 부제목',
    explanation: '누가 작성한 소개인지 알려주는 부제목이에요',
    example: '신랑이 소개하는 신부',
    previewSection: 'couple-profile',
  },
  'bride.profile.intro': {
    label: '신부 소개글',
    explanation: '신랑이 작성하는 신부 소개예요. 어떤 사람인지, 어떤 점이 좋은지 자유롭게 써보세요.',
    example: '언제나 밝은 미소로 주변을 환하게 만드는 사람이에요. 이 사람 옆에 있으면 왠지 모든 게 잘 될 것 같은 기분이 들어요.',
    previewSection: 'couple-profile',
  },
  'bride.profile.tag': {
    label: '신부 태그',
    explanation: '신부를 한마디로 표현하는 태그예요',
    example: '웃음이 예쁜 사람',
    previewSection: 'couple-profile',
  },

  // ===== 우리의 이야기 =====
  'relationship.startDate': {
    label: '처음 만난 날',
    explanation: '두 사람이 처음 만난 날짜예요',
    example: '2020-03-15',
    previewSection: 'our-story',
  },
  'relationship.closingText': {
    label: '마무리 문구',
    explanation: '연애 이야기 마지막을 장식할 문장이에요',
    example: '그리고 이제 드디어 부르는 서로의 이름에 \'신랑\', \'신부\'라는 호칭을 담습니다.',
    previewSection: 'our-story',
  },
  'relationship.stories[].date': {
    label: '날짜/시기',
    explanation: '이 이야기가 있었던 시기예요',
    example: '2020년 봄',
    previewSection: 'our-story',
  },
  'relationship.stories[].title': {
    label: '제목',
    explanation: '이 시기를 한 문장으로 표현해보세요',
    example: '어색한 첫 만남',
    previewSection: 'our-story',
  },
  'relationship.stories[].desc': {
    label: '내용',
    explanation: '그때의 이야기를 편하게 써보세요',
    example: '친구 소개로 처음 만났어요. 어색하게 커피만 마시다 헤어졌는데, 집에 가는 내내 그 사람 생각만 났어요.',
    previewSection: 'our-story',
  },

  // ===== 인터뷰 =====
  'content.interviews[].question': {
    label: '질문',
    explanation: '하객분들께 보여줄 웨딩 인터뷰 질문이에요',
    example: '결혼을 결심하게 된 계기는 무엇인가요?',
    previewSection: 'interview',
  },
  'content.interviews[].answer': {
    label: '답변',
    explanation: '인터뷰 질문에 대한 두 분의 답변이에요',
    example: '함께하는 모든 순간이 행복했고, 이 사람과 평생을 함께하고 싶다는 확신이 들었어요.',
    previewSection: 'interview',
  },

  // ===== 갤러리 =====
  'gallery.images': {
    label: '사진 갤러리',
    explanation: '두 사람의 특별한 순간들을 담은 사진이에요 (최대 6장)',
    example: '사진을 추가하세요',
    previewSection: 'gallery',
  },

  // ===== 행복한 시간을 위한 안내 =====
  'guidance.title': {
    label: '안내 제목',
    explanation: '안내 섹션의 제목이에요',
    example: '행복한 시간을 위한 안내',
    previewSection: 'info',
  },
  'guidance.content': {
    label: '안내 내용',
    explanation: '하객분들께 전달하고 싶은 안내 사항이에요',
    example: '예식 후 별도의 식사를 준비하지 않았습니다. 축하해 주시는 마음만 감사히 받겠습니다.',
    previewSection: 'info',
  },

  // ===== 기타 안내 =====
  'content.info.dressCode.content': {
    label: '드레스 코드',
    explanation: '하객분들께 요청드리는 복장 안내예요',
    example: '화이트, 블랙 계열의 세미 정장을 부탁드려요',
    previewSection: 'info',
  },
  'content.info.photoBooth.content': {
    label: '포토부스 안내',
    explanation: '포토부스 이용 안내예요',
    example: '소중한 하루를 오래 기억할 수 있도록\n포토부스가 준비되어 있습니다.\n즐거운 추억을 사진으로 남겨주세요.',
    previewSection: 'info',
  },
  'content.info.photoShare.content': {
    label: '사진 공유 안내',
    explanation: '사진 공유 방법을 안내해주세요',
    example: '예식 사진은 아래 링크에서 공유해 주세요!',
    previewSection: 'info',
  },
  'content.info.flowerGift.content': {
    label: '꽃 답례품 안내',
    explanation: '꽃 답례품 안내 문구예요',
    example: '예식 후 하객분들께 감사의 마음을 전하기 위해\n계절의 꽃으로 만든 작은 꽃다발을 준비했습니다.\n소중한 발걸음에 대한 감사의 선물로 받아주세요.',
    previewSection: 'info',
  },
  'content.info.flowerChild.content': {
    label: '화동 안내',
    explanation: '화동 입장 안내 문구예요',
    example: '예식 중 사랑스러운 화동 입장이 예정되어 있습니다.\n아이들의 소중한 순간도 함께 따뜻하게 지켜봐 주세요.',
    previewSection: 'info',
  },
  'content.info.wreath.content': {
    label: '화환 안내',
    explanation: '화환 관련 안내 문구예요',
    example: '축하의 마음만으로도 충분히 감사하여\n화환은 정중히 사양하고자 합니다.\n따뜻한 마음으로 축복해주시면 감사하겠습니다.',
    previewSection: 'info',
  },
  'content.info.reception.content': {
    label: '피로연 안내',
    explanation: '피로연 안내 문구예요',
    example: '피로연 자리를 마련하였습니다.\n\n참석하시어 두 사람의 앞날을\n따뜻한 축복으로 함께해 주시면\n감사하겠습니다.',
    previewSection: 'info',
  },

  // ===== 감사 인사 =====
  'content.thankYou.message': {
    label: '감사 메시지',
    explanation: '청첩장 마지막에 전하는 감사의 말이에요',
    example: '바쁘신 와중에도 저희의 결혼을 축하해 주셔서 진심으로 감사드립니다. 함께해 주신 모든 분들의 사랑을 가슴 깊이 간직하며, 더 예쁘게 살겠습니다.',
    previewSection: 'thank-you',
  },
  'content.thankYou.sign': {
    label: '서명',
    explanation: '감사 인사 아래 표시될 서명이에요',
    example: '민준 & 서연 드림',
    previewSection: 'thank-you',
  },

  // ===== 축의금 =====
  'groom.bank.bank': {
    label: '신랑 은행',
    explanation: '축의금을 받을 은행이에요',
    example: '국민은행',
    previewSection: 'bank-accounts',
  },
  'groom.bank.account': {
    label: '신랑 계좌번호',
    explanation: '축의금을 받을 계좌번호예요',
    example: '123-456-789012',
    previewSection: 'bank-accounts',
  },
  'groom.bank.holder': {
    label: '예금주',
    explanation: '계좌 예금주 이름이에요',
    example: '김민준',
    previewSection: 'bank-accounts',
  },

  // ===== RSVP =====
  'rsvpDeadline': {
    label: '회신 마감일',
    explanation: '참석 여부를 알려주실 마감 날짜예요',
    example: '2024-10-25',
    previewSection: 'rsvp',
  },

}

// 인트로 애니메이션 옵션
export const introAnimationOptions = [
  { id: 'none', name: '없음', description: '애니메이션 없이 바로 표시' },
  { id: 'fade-in', name: '페이드 인', description: '부드럽게 나타나는 효과' },
  { id: 'slide-up', name: '슬라이드 업', description: '아래에서 위로 올라오는 효과' },
  { id: 'zoom-reveal', name: '줌 인', description: '중앙에서 확대되며 나타나는 효과' },
  { id: 'curtain-open', name: '커튼 오픈', description: '양쪽으로 열리는 커튼 효과' },
  { id: 'letter-unfold', name: '편지 펼치기', description: '편지가 펼쳐지는 3D 효과' },
] as const
