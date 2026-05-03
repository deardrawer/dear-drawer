// OUR 템플릿 샘플 데이터
export const ourSampleContent = {
  groom: {
    name: '한지훈',
    phone: '010-1234-5678',
    father: { name: '한영수', phone: '010-1111-2222', deceased: false, bank: { bank: '', account: '', holder: '', enabled: false } },
    mother: { name: '김미경', phone: '010-3333-4444', deceased: false, bank: { bank: '', account: '', holder: '', enabled: false } },
    bank: { bank: '신한은행', account: '110-123-456789', holder: '한지훈', enabled: true },
    profile: {
      images: ['/sample/groom1.png', '/sample/groom2.png'],
      imageSettings: [{ scale: 1, positionX: 0, positionY: 0 }, { scale: 1, positionX: 0, positionY: 0 }],
      aboutLabel: 'ABOUT GROOM',
      subtitle: '신부가 소개하는 신랑 🤵',
      intro: '지훈이는\n마음이 단단한 사람입니다.\n\n한번 마음을 주면 쉽게 흔들리지 않고,\n좋아하는 것들을 오래, 꾸준히 곁에 두는 사람이에요.\n산책, 운동, 매일의 작은 루틴까지\n자기만의 속도로 성실하게 지켜갑니다.\n\n가끔은 그 단단함이 고집처럼 보일 때도 있지만,\n그래서 더 믿음이 가요.\n스스로에게 한 약속은\n반드시 지켜내는 사람이니까요.\n\n운동도 잘하고, 게임도 잘하고,\n무엇보다 처음 해보는 것 앞에서도\n주저하지 않는 용기가 있어요.\n\n그래서 어떤 날이 와도\n지훈이와 함께라면 저는 쉽게 무너지지 않아요. 😌',
      tag: '세상에서 가장 따뜻한 사람',
    },
  },
  bride: {
    name: '윤서연',
    phone: '010-5678-1234',
    father: { name: '윤정호', phone: '010-5555-6666', deceased: false, bank: { bank: '', account: '', holder: '', enabled: false } },
    mother: { name: '이선영', phone: '010-7777-8888', deceased: false, bank: { bank: '', account: '', holder: '', enabled: false } },
    bank: { bank: '국민은행', account: '123-45-678901', holder: '윤서연', enabled: true },
    profile: {
      images: ['/sample/bride1.png', '/sample/bride2.png'],
      imageSettings: [{ scale: 1, positionX: 0, positionY: 0 }, { scale: 1, positionX: 0, positionY: 0 }],
      aboutLabel: 'ABOUT BRIDE',
      subtitle: '신랑이 소개하는 신부 👰',
      intro: '서연이는\n세상을 조금 다르게 바라보는 사람입니다.\n\n늘 "이건 왜 그럴까?"를 묻고,\n익숙한 것에서도 새로운 의미를 발견하려고 해요.\n그렇게 하나씩 생각을 더하다 보면\n어느새 저는, 제가 몰랐던 세상을 다시 보고 있더라고요.\n\n호기심은 아이처럼 많지만\n막상 무언가를 시작할 땐 누구보다 꼼꼼하고 성실해요.\n한번 마음먹은 일은\n끝까지 해내야 마음이 놓이는 사람이거든요.\n\n그래서 서연이와 함께 있으면\n작은 하루도 그냥 지나가지 않게 됩니다.\n\n아마 앞으로의 매일도\n서연이 덕분에 조금 더 특별하고, 조금 더 반짝일 거예요. 😊',
      tag: '매일 웃게 해주는 사람',
    },
  },
  wedding: {
    date: '2026-12-26',
    time: '14:00',
    timeDisplay: '오후 2시',
    dayOfWeek: '토요일',
    title: 'OUR WEDDING',
    venue: {
      name: '더채플앳청담',
      hall: '그랜드볼룸 5층',
      address: '서울특별시 강남구 청담동 123-45',
    },
    directions: {
      car: '네비게이션에 "더채플앳청담" 검색\n강남역 방면에서 청담사거리 방향으로 직진 후 우회전',
      publicTransport: '지하철: 압구정로데오역 5번 출구 도보 10분, 청담역 9번 출구 도보 15분\n버스: 146, 301, 401, 3422, 4412',
    },
  },
  relationship: {
    startDate: '2020-03-15',
    stories: [
      {
        date: '2020. 03',
        title: '운명처럼 다가온 만남',
        desc: '친구의 소개로 처음 만났던 그 날,\n어색한 인사를 나누며 시작된 우리의 이야기.\n카페에서 나눈 세 시간의 대화가\n우리 사랑의 첫 페이지가 되었습니다.',
        images: ['/sample/story1-1.png', '/sample/story1-2.png'],
        imageSettings: [{ scale: 1, positionX: 0, positionY: 0 }, { scale: 1, positionX: 0, positionY: 0 }],
      },
      {
        date: '2022. 12',
        title: '함께한 첫 해외여행',
        desc: '제주도부터 시작해 일본, 유럽까지.\n함께 떠난 여행에서 서로를 더 깊이 알게 되었고,\n어떤 상황에서도 함께라면 즐거울 수 있다는 걸 깨달았습니다.',
        images: ['/sample/story2-1.png', '/sample/story2-2.png'],
        imageSettings: [{ scale: 1, positionX: 0, positionY: 0 }, { scale: 1, positionX: 0, positionY: 0 }],
      },
      {
        date: '2024. 09',
        title: '프러포즈',
        desc: '우리가 처음 만났던 그 카페에서,\n떨리는 마음으로 건넨 반지와 함께\n평생을 약속했습니다.',
        images: ['/sample/story3-1.jpeg', '/sample/story3-2.png'],
        imageSettings: [{ scale: 1, positionX: 0, positionY: 0 }, { scale: 1, positionX: 0, positionY: 0 }],
      },
    ],
    closingText: '그리고 이제 드디어 부르는 서로의 이름에\n\'신랑\', \'신부\'라는 호칭을 담습니다.',
  },
  content: {
    greeting: '서로 다른 길을 걸어온 두 사람이\n이제 같은 길을 함께 걸어가려 합니다.\n\n저희의 새로운 시작을\n축복해 주시면 감사하겠습니다.\n\n귀한 걸음 하시어\n자리를 빛내주세요.',
    quote: {
      text: '사랑은 서로 마주보는 것이 아니라\n함께 같은 방향을 바라보는 것이다',
      author: '생텍쥐페리',
    },
    thankYou: {
      title: 'THANK YOU',
      message: '바쁘신 와중에도 저희의 결혼을\n축하해 주셔서 진심으로 감사드립니다.\n\n여러분의 축복을 마음에 새기며\n서로 아끼고 사랑하며 살겠습니다.',
      sign: '지훈 & 서연 올림',
    },
    info: {
      dressCode: { title: '드레스코드', content: '결혼식에 맞는 옷차림을 고민하지 않으셔도 괜찮아요.\n여러분이 가장 좋아하는 옷, 가장 여러분 다운 모습으로 오셔서 함께 웃고 즐겨주신다면 그걸로 충분합니다.\n우리의 특별한 하루를 함께 빛내주세요.', enabled: true },
      photoShare: { title: '사진 공유', content: '결혼식에서 찍은 사진들을 공유해주세요!\n여러분의 시선으로 담긴 우리의 결혼식,\n소중한 추억으로 간직하겠습니다.', buttonText: '사진 공유하기', url: 'https://photos.google.com', enabled: true },
      photoBooth: { title: '포토부스', content: '로비에서 포토부스를 즐겨보세요!', enabled: false },
      flowerChild: { title: '화동 안내', content: '', enabled: false },
      customItems: [],
    },
    interviews: [
      {
        question: '상대방의 첫인상은 어땠나요?',
        answer: '처음 본 순간, 이 사람이다 싶었어요. 말로 설명하기 어려운 느낌이었는데, 대화를 나눌수록 확신이 들었습니다. 서로의 눈을 바라보며 웃던 그 순간을 잊을 수 없어요.',
        images: ['/sample/interview1-1.png', '/sample/interview1-2.png', '/sample/interview1-3.jpeg'],
        imageSettings: [{ scale: 1, positionX: 0, positionY: 0 }, { scale: 1, positionX: 0, positionY: 0 }, { scale: 1, positionX: 0, positionY: 0 }],
        bgClass: 'pink-bg',
      },
      {
        question: '결혼을 결심하게 된 계기는?',
        answer: '함께 있을 때 가장 나다울 수 있었어요. 아무리 힘든 일이 있어도 이 사람 곁에 있으면 괜찮아지더라구요. 평생 이 사람과 함께라면 어떤 일이든 해낼 수 있을 것 같았습니다.',
        images: ['/sample/interview2-1.png', '/sample/interview2-2.png', '/sample/interview2-3.png'],
        imageSettings: [{ scale: 1, positionX: 0, positionY: 0 }, { scale: 1, positionX: 0, positionY: 0 }, { scale: 1, positionX: 0, positionY: 0 }],
        bgClass: 'white-bg',
      },
      {
        question: '앞으로의 결혼생활 계획은?',
        answer: '서로를 존중하고 배려하며 살고 싶어요. 작은 일상에서도 감사함을 잊지 않고, 함께 웃으며 나이 들어가고 싶습니다. 무엇보다 서로의 꿈을 응원하는 부부가 되고 싶어요.',
        images: ['/sample/interview3-1.png', '/sample/interview3-2.png', '/sample/interview3-3.png'],
        imageSettings: [{ scale: 1, positionX: 0, positionY: 0 }, { scale: 1, positionX: 0, positionY: 0 }, { scale: 1, positionX: 0, positionY: 0 }],
        bgClass: 'pink-bg',
      },
    ],
    guestbookQuestions: ['두 사람에게 해주고 싶은 말은?', '결혼생활에서 가장 중요한 건?', '두 사람의 첫인상은 어땠나요?'],
  },
  gallery: {
    images: ['/sample/gallery1.png', '/sample/gallery2.png', '/sample/gallery3.png', '/sample/gallery4.png', '/sample/gallery5.png', '/sample/gallery6.png'],
    imageSettings: Array(6).fill({ scale: 1, positionX: 0, positionY: 0 }),
  },
  media: {
    coverImage: '/sample/cover3.png',
    infoImage: '/sample/info.png',
    bgm: '',
  },
  meta: {
    title: '지훈 ♥ 서연 결혼합니다',
    description: '2025년 5월 24일 토요일 오후 2시\n더채플앳청담 그랜드볼룸',
    ogImage: '/sample/cover3.png',
    kakaoThumbnail: '/sample/cover3.png',
  },
  templateId: 'our',
  primaryColor: '#A67B5B',
  secondaryColor: '#D4A574',
  accentColor: '#d4a574',
  backgroundColor: '#FDF8F5',
  textColor: '#333333',
  fontStyle: 'modern' as const,
  colorTheme: 'classic-rose' as const,
  rsvpEnabled: true,
  rsvpDeadline: '2025-05-17',
  rsvpAllowGuestCount: true,
  profileTextStyle: { lineHeight: 1.6, textAlign: 'left' as const },
  highlightColor: '#FFFFFF',
  sectionVisibility: {
    coupleProfile: true,
    ourStory: true,
    interview: true,
    guidance: true,
    bankAccounts: true,
    guestbook: true,
  },
  design: {
    introAnimation: 'fade-in' as const,
    coverTitle: 'OUR WEDDING',
    sectionDividers: {
      invitation: 'INVITATION',
      ourStory: 'OUR STORY',
      aboutUs: 'ABOUT US',
      interview: 'INTERVIEW',
      gallery: 'GALLERY',
      information: 'INFORMATION',
      location: 'LOCATION',
      rsvp: 'RSVP',
      thankYou: 'THANK YOU',
      guestbook: 'GUESTBOOK',
    },
  },
  bgm: { enabled: true, url: '/samples/parents/wedding-bgm.mp3', autoplay: true },
  guidance: { enabled: true, title: '행복한 시간을 위한 안내', content: '따뜻한 마음으로 함께해주세요', image: '/sample/info.png', imageSettings: { scale: 1, positionX: 0, positionY: 0 } },
  intro: {
    presetId: 'cinematic' as const,
    mainTitle: 'Welcome to our wedding',
    showDate: true,
    showVenue: false,
    backgroundOverlay: 0.4,
    textColor: '#ffffff',
    animationDuration: 3,
  },
  ourStory: '',
  decision: '',
  invitation: '',
}

// FAMILY 템플릿 샘플 데이터
export const familySampleContent = {
  ...ourSampleContent,
  templateId: 'family',
  fontStyle: 'contemporary' as const,
  parentIntro: {
    groom: {
      enabled: true,
      parentNames: '한○○ · 김○○의',
      childOrder: '첫째',
      images: ['/images/son.png'],
      imageSettings: [{ scale: 1, positionX: 0, positionY: 0 }],
      message: '말썽보다 웃음이 더 많았던 아이였습니다.\n잠든 얼굴을 한참 바라보다가\n\n\'이 아이가 어떤 사람과 함께할까\' 상상하던 밤이\n아직도 선명합니다.\n\n축구를 좋아해서 해 질 때까지 공만 차던 아이가\n지금은 누군가를 웃게 하고, 지켜주고 싶다는 사람이 되었습니다.\n\n처음으로, "이 사람이 있으면 마음이 편안해요"라고 말했을 때\n저는 더 이상 바랄 게 없겠다는 생각이 들었습니다.\n\n그렇게, 저희 아들이 사랑하는 사람과\n인생의 길을 함께 걸어가려 합니다.\n\n기쁘고 설레는 이 시작에,\n오셔서 따뜻한 마음으로 축복해주신다면\n부모로서 더없이 감사하겠습니다.',
    },
    bride: {
      enabled: true,
      parentNames: '윤○○ · 이○○의',
      childOrder: '첫째',
      images: ['/images/daughter.png'],
      imageSettings: [{ scale: 1, positionX: 0, positionY: 0 }],
      message: '웃음이 많고, 주변을 환하게 만들던 아이였습니다.\n작은 일에도 깔깔 웃고,\n가족 모두를 힘나게 하던 그 웃음이 저에겐 참 큰 선물이었지요.\n\n친구를 좋아하고, 사랑을 잘 표현하던 아이가\n이제는 누군가의 가장 가까운 사람이 되어\n함께하는 삶을 선택하게 되었습니다.\n\n"이 사람과 함께 있으면 나다워져요."\n그렇게 말하던 딸의 눈빛을 보며\n저 역시 마음 깊이 안심이 되었습니다.\n\n사랑하는 사람과 함께\n인생의 계절을 함께 걸어가려는 딸의 시작에\n귀한 걸음을 함께해 주신다면\n부모로서 그보다 더 감사한 일이 없겠습니다.',
    },
  },
  wedding: {
    ...ourSampleContent.wedding,
    title: 'WEDDING INVITATION',
  },
  design: {
    ...ourSampleContent.design,
    coverTitle: 'WEDDING INVITATION',
  },
  content: {
    ...ourSampleContent.content,
    greeting: '누군가와 나누고 싶은 순간들이 있죠.\n이 날이 바로 그런 날입니다.\n우리의 결혼식에 초대합니다.',
    quote: {
      text: 'We warmly invite you to our wedding.',
      author: '',
    },
  },
  media: {
    ...ourSampleContent.media,
    coverImage: '/sample/family-main.png',
  },
  intro: {
    ...ourSampleContent.intro,
    mainTitle: 'Welcome to our wedding',
  },
  fullHeightDividers: {
    enabled: true,
    items: [
      {
        id: 'divider-1',
        englishTitle: 'From Our Family to Yours',
        koreanText: '우리의 봄이, 누군가의 평생이 됩니다',
        image: '/sample/divider1.png',
        imageSettings: { scale: 1.0, positionX: 0, positionY: 0, grayscale: 100, opacity: 100 },
      },
      {
        id: 'divider-2',
        englishTitle: 'Why We Chose Each Other for Life',
        koreanText: '서로의 부족한 점을 채워줄 수 있는\n사람을 만났습니다.',
        image: '/sample/divider2.png',
        imageSettings: { scale: 1.0, positionX: 0, positionY: 0, grayscale: 100, opacity: 100 },
      },
      {
        id: 'divider-3',
        englishTitle: 'Our way to marriage',
        koreanText: '같은 시간, 같은 마음으로\n하나의 계절을 준비하고 있습니다.',
        image: '/sample/divider3.png',
        imageSettings: { scale: 1.0, positionX: 0, positionY: 0, grayscale: 100, opacity: 100 },
      },
    ],
  },
}

// MOVIE 템플릿 샘플 데이터
export const filmSampleContent = {
  ...ourSampleContent,
  templateId: 'film',
  colorTheme: 'film-dark' as const,
  fontStyle: 'roundgothic' as const,
  displayFont: 'italianno',
  groom: {
    ...ourSampleContent.groom,
    name: '한지훈',
    nameEn: 'Jihun',
    lastName: '한',
    firstName: '지훈',
    profile: {
      ...ourSampleContent.groom.profile,
      images: ['/sample/movie-groom.png'],
      imageSettings: [{ scale: 1, positionX: 0, positionY: 0 }],
    },
  },
  bride: {
    ...ourSampleContent.bride,
    name: '윤서연',
    nameEn: 'Seoyeon',
    lastName: '윤',
    firstName: '서연',
    profile: {
      ...ourSampleContent.bride.profile,
      images: ['/sample/movie-bride.png'],
      imageSettings: [{ scale: 1, positionX: 0, positionY: 0 }],
    },
  },
  wedding: {
    ...ourSampleContent.wedding,
    date: '2026-05-23',
    time: '13:30',
    timeDisplay: '오후 1시 30분',
    venue: {
      name: '더채플앳청담',
      hall: '그랜드홀',
      address: '서울특별시 강남구 청담동 123-45',
    },
  },
  content: {
    ...ourSampleContent.content,
    filmTitle: 'THE WEDDING',
    greeting: '솔직히 말하면,\n처음엔 그냥 밥 한번 먹자는 거였는데\n어쩌다 보니 평생 같이 먹게 됐습니다.\n\n이 예상 밖의 전개에\n여러분을 초대합니다.',
    quote: {
      text: 'I came here tonight because when you realize you want to spend the rest of your life with somebody, you want the rest of your life to start as soon as possible.',
      author: 'When Harry Met Sally',
    },
    interviews: [
      {
        question: '처음 만났을 때 서로의 첫인상은?',
        answer: '"카페에서 책을 읽고 있는 모습이 정말 예뻤어요"\n"웃을 때 눈이 반달처럼 되는 게 인상적이었어요"',
        images: ['/sample/story1-1.png', '/sample/story1-2.png'],
        imageSettings: [{ scale: 1, positionX: 0, positionY: 0 }, { scale: 1, positionX: 0, positionY: 0 }],
        bgClass: 'pink-bg',
      },
      {
        question: '결혼을 결심하게 된 순간은?',
        answer: '"아플 때 밤새 간호해주는 모습을 보고 확신했어요"\n"이 사람과 함께라면 어떤 어려움도 이겨낼 수 있겠다 싶었어요"',
        images: ['/sample/story2-1.png', '/sample/story2-2.png'],
        imageSettings: [{ scale: 1, positionX: 0, positionY: 0 }, { scale: 1, positionX: 0, positionY: 0 }],
        bgClass: 'white-bg',
      },
      {
        question: '서로에게 하고 싶은 한마디는?',
        answer: '"평생 웃게 해줄게요. 사랑해요"\n"당신을 만나서 정말 행복해요. 영원히 함께해요"',
        images: ['/sample/movie-story3-1.png', '/sample/movie-story3-2.png'],
        imageSettings: [{ scale: 1, positionX: 0, positionY: 0 }, { scale: 1, positionX: 0, positionY: 0 }],
        bgClass: 'pink-bg',
      },
    ],
    thankYou: {
      title: 'SPECIAL THANKS',
      message: '바쁘신 와중에도 저희의 결혼을\n축하해 주셔서 진심으로 감사드립니다.\n\n여러분의 축복을 마음에 새기며\n서로 아끼고 사랑하며 살겠습니다.',
      sign: '지훈 & 서연 올림',
    },
  },
  gallery: {
    images: ['/sample/movie-gallery1.png', '/sample/movie-gallery2.png', '/sample/movie-gallery3.png', '/sample/movie-gallery4.png', '/sample/movie-gallery5.png', '/sample/movie-gallery6.png'],
    imageSettings: Array(6).fill({ scale: 1, positionX: 0, positionY: 0 }),
  },
  media: {
    coverImage: '/sample/cover.png',
    infoImage: '/sample/movie-information1.png',
    bgm: '',
  },
  guidance: { ...ourSampleContent.guidance, image: '/sample/movie-information1.png', imageSettings: { scale: 1, positionX: 0, positionY: 0 } },
  design: {
    ...ourSampleContent.design,
    coverTitle: 'A MOVIE BY US',
    sectionDividers: {
      ...ourSampleContent.design.sectionDividers,
      invitation: 'CHAPTER 1',
      ourStory: 'CHAPTER 2',
      aboutUs: 'CHAPTER 2',
      interview: 'CHAPTER 2',
      gallery: 'CHAPTER 3',
      location: 'THE PREMIERE',
      rsvp: 'RESERVATION',
      thankYou: 'SPECIAL THANKS',
      guestbook: 'AUDIENCE REVIEWS',
    },
  },
  youtube: {
    enabled: true,
    title: '',
    url: 'https://youtu.be/iK1eXqrFZ6s',
  },
}

// RECORD 템플릿 샘플 데이터
export const recordSampleContent = {
  ...ourSampleContent,
  templateId: 'record',
  colorTheme: 'record-coral' as const,
  fontStyle: 'modern' as const,
  groom: {
    ...ourSampleContent.groom,
    name: '한지훈',
    lastName: '한',
    firstName: '지훈',
  },
  bride: {
    ...ourSampleContent.bride,
    name: '윤서연',
    lastName: '윤',
    firstName: '서연',
  },
  wedding: {
    ...ourSampleContent.wedding,
    date: '2026-06-20',
    time: '14:00',
    timeDisplay: '오후 2시',
    venue: {
      name: '그랜드힐 컨벤션',
      hall: '크리스탈홀',
      address: '서울특별시 강남구 청담동 123-45',
    },
  },
  content: {
    ...ourSampleContent.content,
    greeting: '서로 다른 길을 걷던 두 사람이\n같은 방향을 바라보게 되었습니다.\n\n저희의 새로운 시작을\n함께 축하해 주시겠어요?',
    quote: {
      text: 'The best thing to hold onto in life is each other.',
      author: 'Audrey Hepburn',
    },
    interviews: [
      {
        question: '우리의 첫 만남',
        answer: '친구의 소개로 처음 만났어요.\n어색할 줄 알았는데 대화가 끊이질 않았고\n헤어지는 게 아쉬웠던 그날,\n다음 만남을 기약하며 돌아왔습니다.',
        images: ['/sample/story1-1.png', '/sample/story1-2.png'],
        imageSettings: [{ scale: 1, positionX: 0, positionY: 0 }, { scale: 1, positionX: 0, positionY: 0 }],
        bgClass: 'pink-bg',
      },
      {
        question: '함께한 시간들',
        answer: '같이 있으면 특별한 일이 아니어도\n늘 웃음이 끊이지 않았어요.\n서로의 부족한 부분을 채워주며\n함께라서 더 좋은 사람이 되어갔습니다.',
        images: ['/sample/story2-1.png', '/sample/story2-2.png'],
        imageSettings: [{ scale: 1, positionX: 0, positionY: 0 }, { scale: 1, positionX: 0, positionY: 0 }],
        bgClass: 'white-bg',
      },
      {
        question: '평생의 약속',
        answer: '"앞으로도 계속 함께하고 싶어."\n떨리는 마음으로 건넨 말에\n그녀는 눈물을 글썽이며 고개를 끄덕였습니다.\n서로의 손을 꼭 잡았던 그 순간을 잊지 못해요.',
        images: ['/sample/story3-1.jpeg', '/sample/story3-2.png'],
        imageSettings: [{ scale: 1, positionX: 0, positionY: 0 }, { scale: 1, positionX: 0, positionY: 0 }],
        bgClass: 'pink-bg',
      },
    ],
    thankYou: {
      title: 'THANK YOU',
      message: '바쁘신 와중에도 저희의 결혼을\n축하해 주셔서 진심으로 감사드립니다.\n\n여러분의 축복을 마음에 새기며\n서로 아끼고 사랑하며 살겠습니다.',
      sign: '지훈 & 서연 올림',
    },
  },
  guidance: { ...ourSampleContent.guidance, imageSettings: { scale: 1, positionX: 0, positionY: 35 } },
  design: {
    ...ourSampleContent.design,
    coverTitle: 'WE ARE GETTING MARRIED',
    sectionDividers: {
      ...ourSampleContent.design.sectionDividers,
      invitation: 'TRACK 01',
      ourStory: 'TRACK 03',
      aboutUs: 'TRACK 02',
      interview: 'TRACK 03',
      gallery: 'TRACK 04',
      location: 'TRACK 05',
      rsvp: 'RSVP',
      thankYou: 'EPILOGUE',
      guestbook: 'GUESTBOOK',
    },
  },
  youtube: {
    enabled: true,
    title: '',
    url: 'https://youtu.be/iK1eXqrFZ6s',
  },
}

// FEED 템플릿 샘플 데이터
export const exhibitSampleContent = {
  ...ourSampleContent,
  templateId: 'exhibit',
  colorTheme: 'exhibit-white' as const,
  fontStyle: 'modern' as const,
  displayId: 'jh♥sy',
  wedding: {
    ...ourSampleContent.wedding,
    directions: {
      car: '네비게이션에 "더채플앳청담" 검색\n강남역 방면에서 청담사거리 방향으로 직진 후 우회전\n주차: 건물 지하주차장 이용 가능 (3시간 무료)',
      publicTransport: '지하철: 압구정로데오역 5번 출구 도보 10분, 청담역 9번 출구 도보 15분\n버스: 146, 301, 401, 3422, 4412',
      train: '서울역 하차 → 4호선 → 사당역 환승 → 2호선 → 압구정로데오역 5번 출구',
      expressBus: '서울고속버스터미널 하차 → 3호선 → 압구정역 → 택시 10분',
    },
  },
  media: {
    ...ourSampleContent.media,
    coverImage: '/sample/feed-cover1.png',
    coverImages: ['/sample/feed-cover1.png', '/sample/feed-cover2.png', '/sample/feed-cover3.png'],
  },
  rooms: [
    {
      title: 'Outdoor',
      subtitle: '야외 로케이션',
      images: ['/sample/feed-room1-1.jpeg', '/sample/feed-room1-2.jpeg', '/sample/feed-room1-3.jpeg', '/sample/feed-room1-4.jpeg', '/sample/feed-room1-5.jpeg', '/sample/feed-room1-6.jpeg', '/sample/feed-room1-7.jpeg', '/sample/feed-room1-8.jpeg', '/sample/feed-room1-9.jpeg'],
      imageSettings: Array(9).fill({ scale: 1, positionX: 0, positionY: 0 }),
    },
    {
      title: 'Studio',
      subtitle: '스튜디오 촬영',
      images: ['/sample/feed-room2-1.png', '/sample/feed-room2-2.png', '/sample/feed-room2-3.png', '/sample/feed-room2-4.png', '/sample/feed-room2-5.png', '/sample/feed-room2-6.png'],
      imageSettings: Array(6).fill({ scale: 1, positionX: 0, positionY: 0 }),
    },
    {
      title: 'Traditional',
      subtitle: '한복 촬영',
      images: ['/sample/feed-room3-1.png', '/sample/feed-room3-2.png', '/sample/feed-room3-3.png', '/sample/feed-room3-4.png', '/sample/feed-room3-5.png', '/sample/feed-room3-6.png'],
      imageSettings: Array(6).fill({ scale: 1, positionX: 0, positionY: 0 }),
    },
  ],
  bgm: { enabled: true, url: '/api/r2/audio/wedding-bgm.mp3', autoplay: true },
  rsvpEnabled: true,
  rsvpDeadline: '2025-05-17',
  rsvpAllowGuestCount: true,
  sectionVisibility: {
    guestbook: true,
    guidance: true,
  },
  content: {
    ...ourSampleContent.content,
    greeting: '소중한 분들을 초대합니다.\n\n저희 두 사람이 함께하는\n새로운 시작의 자리에\n함께해 주세요.',
    stories: [
      {
        image: '/sample/story1-1.png',
        caption: '첫 만남 그 날 ☕ 세 시간이 어떻게 갔는지 모르겠어',
      },
      {
        image: '/sample/story2-1.png',
        caption: '같이 있으면 뭘 해도 재밌는 사람 🤍',
      },
      {
        image: '/sample/story3-1.jpeg',
        caption: '평생 같이 있자 💍 YES라고 해줘서 고마워',
      },
    ],
    guestbookQuestions: ['두 사람에게 축하 메시지를 남겨주세요', '결혼생활에서 가장 중요한 건?', '두 사람의 첫인상은 어땠나요?'],
    sampleGuestbook: [
      { id: 'g1', guest_name: '박지영', message: '두 분의 결혼을 진심으로 축하해요! 항상 행복하세요 💕', created_at: '2026-02-19T10:30:00Z' },
      { id: 'g2', guest_name: '최현우', message: '지훈아 결혼 축하한다! 서연님과 행복한 가정 꾸려라 🎉', created_at: '2026-02-19T09:15:00Z' },
      { id: 'g3', guest_name: '정소희', message: '세상에서 가장 예쁜 커플! 결혼 너무너무 축하드려요 🤍', created_at: '2026-02-18T22:00:00Z' },
      { id: 'g4', guest_name: '김태호', message: '축하축하! 결혼식 날 꼭 갈게요. 행복하게 잘 살아 😊', created_at: '2026-02-18T18:30:00Z' },
      { id: 'g5', guest_name: '이수진', message: '서연아 결혼 축하해!! 지훈님이랑 오래오래 행복해 💐', created_at: '2026-02-18T15:00:00Z' },
      { id: 'g6', guest_name: '한도윤', message: '두 분 정말 잘 어울려요! 결혼 진심으로 축하합니다 🥂', created_at: '2026-02-17T20:00:00Z' },
    ],
    info: {
      dressCode: { title: '드레스코드', content: '편안한 복장으로 오셔도 좋습니다.\n여러분 다운 모습으로 와주세요.', enabled: true },
      photoShare: { title: '사진 공유', content: '결혼식에서 찍은 사진들을 공유해주세요!\n소중한 추억으로 간직하겠습니다.', buttonText: '사진 공유하기', url: 'https://photos.google.com', enabled: true },
      photoBooth: { title: '포토부스', content: '', enabled: false },
      flowerChild: { title: '화동 안내', content: '', enabled: false },
      customItems: [],
    },
    thankYou: {
      title: 'THANK YOU',
      message: '바쁘신 와중에도 저희의 결혼을\n축하해 주셔서 진심으로 감사드립니다.\n\n여러분의 축복을 마음에 새기며\n서로 아끼고 사랑하며 살겠습니다.',
      sign: '지훈 & 서연 올림',
    },
  },
  design: {
    ...ourSampleContent.design,
    coverTitle: '',
  },
}

// ESSAY 템플릿 샘플 데이터 (러브스토리 모드)
export const essayStorySampleContent = {
  contentMode: 'story' as const,
  colorTheme: 'essay-mono' as const,
  fontStyle: 'modern' as const,
  bgm: { enabled: true, url: '/api/r2/audio/marigold.mp3', autoplay: true },
  groom: {
    name: '한지훈',
    nameEn: 'JIHUN',
    lastName: '한',
    firstName: '지훈',
    phone: '010-1234-5678',
    phoneEnabled: true,
    father: { name: '한영수', phone: '010-1111-2222', phoneEnabled: true, deceased: false, bank: { bank: '우리은행', account: '1002-123-456789', holder: '한영수', enabled: true } },
    mother: { name: '김미경', phone: '010-3333-4444', phoneEnabled: true, deceased: false, bank: { bank: '하나은행', account: '267-910123-45678', holder: '김미경', enabled: true } },
    bank: { bank: '신한은행', account: '110-123-456789', holder: '한지훈', enabled: true },
  },
  bride: {
    name: '윤서연',
    nameEn: 'SEOYEON',
    lastName: '윤',
    firstName: '서연',
    phone: '010-5678-1234',
    phoneEnabled: true,
    father: { name: '윤정호', phone: '010-5555-6666', phoneEnabled: true, deceased: false, bank: { bank: 'NH농협', account: '302-1234-5678-91', holder: '윤정호', enabled: true } },
    mother: { name: '이선영', phone: '010-7777-8888', phoneEnabled: true, deceased: false, bank: { bank: '카카오뱅크', account: '3333-12-3456789', holder: '이선영', enabled: true } },
    bank: { bank: '국민은행', account: '123-45-678901', holder: '윤서연', enabled: true },
  },
  wedding: {
    date: '2026-05-23',
    time: '14:00',
    timeDisplay: '오후 2시',
    dayOfWeek: '토요일',
    venue: {
      name: '더채플앳청담',
      hall: '그랜드볼룸 5층',
      address: '서울특별시 강남구 청담동 123-45',
      hideHall: false,
    },
    directions: {
      car: '네비게이션에 "더채플앳청담" 검색\n강남역 방면에서 청담사거리 방향으로 직진 후 우회전',
      publicTransport: '지하철: 압구정로데오역 5번 출구 도보 10분\n버스: 146, 301, 401, 3422',
    },
  },
  greeting: '서로 다른 길을 걸어온 두 사람이\n같은 산 위에서 멈춰 섰습니다.\n\n오래 기다려온 이 순간,\n당신과 함께하고 싶습니다.\n\n귀한 걸음으로 축복해 주세요.',
  chapters: [
    {
      title: '시작',
      subtitle: 'The Beginning',
      body: '2020년 가을, 북한산 둘레길에서\n처음 만났습니다.\n\n같은 방향으로 걷고 있던 두 사람.\n길을 물어보는 척 건넨 인사에\n돌아온 건 해맑은 웃음이었습니다.\n\n정상까지 함께 오르며 나눈 대화가\n어찌나 편하던지.\n\n산을 내려오는 길이\n아쉬웠던 건 처음이었습니다.',
    },
    {
      title: '우리의 시간',
      subtitle: 'Our Days Together',
      body: '그 뒤로 매주 함께 산에 올랐습니다.\n\n봄에는 진달래가 핀 능선을 걸었고,\n여름에는 계곡에 발을 담갔습니다.\n가을 단풍 아래에서 도시락을 나눠 먹고,\n겨울 설산에서는 서로의 손을 꼭 잡았습니다.\n\n>>"이번 주말 어디 갈까?"가\n"이번 주말 어느 산 갈까?"로<<\n\n바뀐 것은 아주 자연스러운 일이었습니다.',
    },
    {
      title: '약속',
      subtitle: 'The Promise',
      body: '프로포즈는 북한산 정상에서\n하려고 했습니다.\n\n그런데 반지를 배낭 맨 아래에 넣어둔 걸\n깜빡하고 말았습니다.\n\n정상에서 허겁지겁 짐을 뒤지는 저를 보며\n그녀가 물었습니다.\n>>"혹시 반지 찾는 거야?"<<\n\n들켰지만, 어쨌든 무릎을 꿇었고\n그녀는 웃으면서 울었습니다.\n\n완벽하진 않았지만\n우리다운 약속이었습니다.',
    },
  ],
  interviews: [
    { question: '상대방의 첫인상은 어땠나요?', answer: '산에서 만나서 그런지, 꾸밈없는 모습이 좋았어요. 등산화 신고 환하게 웃는 얼굴이 아직도 선명합니다.', answerer: 'groom' as const },
    { question: '결혼을 결심하게 된 계기는?', answer: '비가 쏟아지는 산속에서 길을 잃었을 때, 겁먹은 저를 안심시키며 묵묵히 길을 찾아준 사람이에요. 이 사람이면 어디든 괜찮겠다 싶었습니다.', answerer: 'bride' as const },
    { question: '서로에게 하고 싶은 말은?', answer: '매일 "고마워"라고 말하지만, 진짜 고마운 건 네가 내 옆에서 같은 방향을 바라봐 주는 것 자체야. 앞으로도 잘 부탁해.', answerer: 'both' as const },
    { question: '결혼 후 가장 하고 싶은 것은?', answer: '1년간 세계 여행을 떠날 거예요. 히말라야 트레킹부터 파타고니아까지, 세상의 모든 길을 함께 걸어보고 싶습니다.', answerer: 'groom' as const },
  ],
  quote: {
    text: '인생에서 가장 아름다운 여행은\n사랑하는 사람과 같은 길을 걷는 것이다.',
    author: '파울로 코엘료',
  },
  thankYou: {
    title: '감사 인사',
    message: '바쁘신 와중에도\n저희의 결혼을 축하해 주셔서\n진심으로 감사드립니다.\n\n여러분의 축복을 마음에 새기며\n서로 아끼고 사랑하며 살겠습니다.',
    sign: '지훈 & 서연 올림',
  },
  sectionVisibility: {
    contacts: true,
    bankAccounts: true,
    guestbook: true,
    rsvp: true,
    parentNames: true,
  },
  rsvpEnabled: true,
  rsvpDeadline: '2026-05-16',
  rsvpSideOption: true,
  info: {
    dressCode: { title: '드레스코드', content: '', enabled: false },
    photoShare: { title: '사진 공유', content: '식장에서 찍으신 사진을\n공유 앨범에 올려주세요.\n소중한 순간을 함께 나눠요.', buttonText: '사진 올리기', url: '', enabled: false },
    photoBooth: { title: '포토부스', content: '로비에 포토부스가 준비되어 있습니다.\n자유롭게 촬영하시고 추억을 남겨주세요.', enabled: true },
    flowerGift: { title: '꽃 답례품', content: '', enabled: false },
    flowerChild: { title: '화동 안내', content: '', enabled: false },
    wreath: { title: '화환 안내', content: '', enabled: false },
    shuttle: { title: '셔틀버스', content: '강남역 10번 출구에서\n12시 30분, 1시에 셔틀이 운행됩니다.', enabled: true },
    reception: { title: '식사 안내', content: '예식 후 5층 연회장에서\n식사가 준비되어 있습니다.\n편안하게 즐겨주세요.', enabled: true },
    customItems: [],
  },
  meta: {
    kakaoThumbnail: '',
    kakaoTitle: '',
    kakaoDescription: '',
  },
  content: {
    guestbookQuestions: ['두 사람에게 축하 메시지를 남겨주세요'],
    sampleGuestbook: [
      { id: 'g1', guest_name: '박지영', message: '사진 없는 청첩장인데 오히려 더 감동이에요. 진심이 느껴지는 글이 최고입니다 💕', created_at: '2026-02-19T10:30:00Z' },
      { id: 'g2', guest_name: '최현우', message: '지훈아 드디어! 축하한다 형! 행복해라 🎉', created_at: '2026-02-19T09:15:00Z' },
      { id: 'g3', guest_name: '정소희', message: '두 분의 이야기가 정말 아름다워요. 결혼 축하드립니다 🤍', created_at: '2026-02-18T22:00:00Z' },
    ],
    bonusInterviews: [
      { question: '우리에게 결혼의 의미', answer: '결혼은 저희에게 "함께 늙어가자"는 약속입니다.\n\n연애할 때는 설렘이 전부인 줄 알았는데,\n시간이 지나며 알게 되었습니다.\n\n진짜 사랑은 일상을 함께 견디는 것,\n그리고 그 일상이 충분히 아름다울 수 있다는\n믿음이라는 것을요.', answerer: 'both' as const },
      { question: '1년 해외여행을 신혼여행으로 선택한 이유', answer: '산에서 만난 우리니까,\n세상의 더 많은 길을 함께 걷고 싶었습니다.\n\n히말라야 트레킹, 산티아고 순례길,\n파타고니아의 끝없는 초원까지.\n\n"1년이면 충분할까?"\n"부족하면 더 가면 되지."\n\n그 대화로 결정되었습니다.', answerer: 'both' as const },
      { question: '결혼을 준비하며 든 생각', answer: '결혼 준비는 생각보다 복잡했지만,\n하나 확실히 알게 된 게 있습니다.\n\n이 사람이 아니면 안 된다는 것.\n\n의견이 다를 때도, 지칠 때도,\n결국 마주 보고 웃게 되는 사람.\n그런 사람을 만난 건 정말 행운입니다.', answerer: 'both' as const },
    ],
  },
}

// ESSAY 인터뷰 모드 샘플
export const essayInterviewSampleContent = {
  ...essayStorySampleContent,
  contentMode: 'interview' as const,
  colorTheme: 'essay-blush' as const,
}

// THE SIMPLE 템플릿 샘플 데이터
// 주의: the-simple은 독자적 스키마를 사용 (SectionContents + sectionOrder + sectionVariants)
const tsImg = (filename: string) => ({
  url: `/sample/${filename}`,
  settings: { scale: 1, positionX: 0, positionY: 0 },
})
const tsGalleryImg = (filename: string, idx: number) => ({
  id: `sample-${idx}`,
  webUrl: `/sample/${filename}`,
  thumbUrl: `/sample/${filename}`,
  settings: { scale: 1, positionX: 0, positionY: 0 },
})

export const theSimpleSampleContent = {
  groom: { name: '한지훈', phone: '010-1234-5678', nameEn: 'Jihun' },
  bride: { name: '윤서연', phone: '010-5678-1234', nameEn: 'Seoyeon' },
  wedding: {
    date: '2026-05-16',
    time: '13:00',
    timeDisplay: '오후 1시',
    venue: {
      name: '그랜드 하얏트 서울',
      hall: '그랜드 볼룸',
      address: '서울특별시 용산구 소월로 322',
    },
  },
  sections: {
    intro: {
      eyebrow: 'The Simple · Invitation',
      title: 'THE SIMPLE',
      body: '가장 평범한 단어로\n가장 특별한 하루를 전합니다.',
      showNames: 'english',
      photo: tsImg('ts-intro.png'),
    },
    greeting: {
      label: 'Invitation',
      title: '초대합니다',
      body: '서로 다른 시간을 걸어온 두 사람이\n같은 길 위에서 만났습니다.\n\n저희 두 사람의 시작에\n귀한 걸음으로 축복해 주세요.',
    },
    couple: {
      eyebrow: 'The Couple',
      groom: {
        role: 'Groom',
        bio: '따뜻한 미소가 매력적인 사람',
        photo: tsImg('ts-groom.png'),
        photos: [tsImg('ts-groom.png'), tsImg('groom2.png')],
      },
      bride: {
        role: 'Bride',
        bio: '밝은 에너지로 주변을 환하게 하는 사람',
        photo: tsImg('ts-bride.jpeg'),
        photos: [tsImg('ts-bride.jpeg'), tsImg('bride2.png')],
      },
    },
    info: {
      eyebrow: 'Wedding Date',
      timeLabel: 'Time',
      placeLabel: 'Place',
    },
    direction: {
      eyebrow: 'Direction',
      transport: {
        car: '내비게이션 "그랜드 하얏트 서울" 검색\n주차장 2시간 무료 (웨딩홀 도장 지참)',
        bus: '강남역 2번 출구 앞 472번, 741번\n그랜드 하얏트 정류장 하차 도보 3분',
        subway: '2호선 강남역 2번 출구 도보 10분\n분당선 한티역 3번 출구 도보 5분',
      },
    },
    interview: {
      eyebrow: 'Q&A',
      items: [
        { question: '서로의 첫인상은 어땠나요?', answer: '처음 본 순간, 이 사람이구나 싶었습니다.' },
        {
          question: '결혼을 결심한 이유는?',
          answer:
            '평범한 하루가 특별해지는 사람이라는 걸 알게 되었을 때, 망설일 이유가 없었습니다.',
        },
        { question: '앞으로의 다짐 한마디.', answer: '같은 방향을 바라보며 천천히, 오래 걸어가겠습니다.' },
      ],
    },
    lovestory: {
      eyebrow: 'Love Story',
      items: [
        {
          body: '어느 봄날, 같은 카페에서 눈이 마주쳤습니다.',
          photo1: tsImg('couple1.jpg'),
          photo2: tsImg('couple2.jpg'),
        },
        {
          body: '함께하는 시간이 늘어갈수록 서로에게 빠져들었습니다.',
          photo1: tsImg('couple3.jpg'),
        },
      ],
    },
    guide: {
      eyebrow: 'Guide',
      items: [
        { label: 'Dress Code', title: '드레스코드', body: '블랙 & 화이트를 제외한\n여러분의 스타일로 함께해주세요.' },
        { label: 'Photo Booth', title: '포토부스 안내', body: '1F 로비 · 3F 테라스\n오픈 13:00' },
        { label: 'Flower', title: '꽃 답례품 안내', body: '감사의 마음을 담은\n작은 꽃다발을 준비했습니다.' },
        { label: 'Photo', title: '사진공유', body: '여러분의 시선으로 담긴\n우리의 순간을 나눠주세요.' },
      ],
    },
    rsvp: {
      title: 'R.S.V.P.',
      body: '본 예식은 동시 예식으로 진행되어\n소중한 하루를 더 잘 준비하고자\n참석 여부와 식사 여부를\n미리 여쭙고자 합니다.\n\n부담없이 편하신 마음으로 알려주시면\n감사한 마음으로 정성껏 준비하겠습니다.',
      showSideOption: true,
    },
    account: {
      eyebrow: 'Account',
      guide: '참석이 어려우신 분들을 위해 기재했습니다.\n너그러운 마음으로 양해 부탁드립니다.',
      groom: [{ bank: '신한은행', number: '110-123-456789', holder: '한지훈' }],
      bride: [{ bank: '국민은행', number: '123-45-678901', holder: '윤서연' }],
    },
    thanks: {
      mark: 'Thank You',
      title: '소중한 걸음에 감사드립니다',
      body: '귀한 시간 내어 축복해 주신 마음,\n오래도록 간직하겠습니다.',
    },
  },
  sectionOrder: [
    'intro',
    'greeting',
    'couple',
    'info',
    'direction',
    'gallery',
    'interview',
    'guide',
    'account',
    'rsvp',
    'guestbook',
    'gallery-2',
    'thanks',
  ],
  sectionVariants: {
    intro: 1,
    greeting: 1,
    couple: 1,
    lovestory: 1,
    info: 1,
    direction: 1,
    interview: 1,
    gallery: 1,
    guide: 1,
    account: 1,
    rsvp: 1,
    guestbook: 1,
    thanks: 1,
    'gallery-2': 3,
  } as Record<string, number>,
  hiddenSections: [] as string[],
  galleries: {
    gallery: [
      tsGalleryImg('ts-1galley1.png', 0),
      tsGalleryImg('ts-1galley2.png', 1),
      tsGalleryImg('ts-1galley3.png', 2),
      tsGalleryImg('ts-1galley4.png', 3),
      tsGalleryImg('ts-1galley5.png', 4),
      tsGalleryImg('ts-1galley6.png', 5),
      tsGalleryImg('ts-1galley7.png', 6),
      tsGalleryImg('ts-1galley8.png', 7),
      tsGalleryImg('ts-1galley9.png', 8),
    ],
    'gallery-2': [
      tsGalleryImg('ts-2galley1.png', 10),
      tsGalleryImg('ts-2galley2.png', 11),
      tsGalleryImg('ts-2galley3.png', 12),
      tsGalleryImg('ts-2galley4.png', 13),
      tsGalleryImg('ts-2galley5.png', 14),
      tsGalleryImg('ts-2galley6.png', 15),
      tsGalleryImg('ts-2galley7.png', 16),
    ],
  } as Record<string, unknown[]>,
  galleryRowPatterns: {} as Record<string, number[]>,
  galleryShowMoreRow: {} as Record<string, number>,
  galleryEyebrows: {
    gallery: 'Gallery',
    'gallery-2': 'Gallery II',
  },
  coverVariant: 5,
  dividerVariant: 1,
  navStyle: 'hamburger',
  bgm: {
    enabled: true,
    url: '/api/r2/audio/wedding-bgm.mp3',
    autoplay: true,
  },
  meta: {
    title: 'THE SIMPLE · 지훈 ♥ 서연 결혼합니다',
    description: '2026년 5월 16일 토요일 오후 1시\n그랜드 하얏트 서울 그랜드 볼룸',
    ogImage: '',
  },
}

// 샘플 청첩장 객체 생성 함수
export function createSampleInvitation(type: 'our' | 'family' | 'magazine' | 'film' | 'record' | 'exhibit' | 'essay' | 'the-simple', essayConcept?: string) {
  // the-simple 타입은 별도 처리 (독자 스키마)
  if (type === 'the-simple') {
    const now = new Date().toISOString()
    return {
      id: 'sample-the-simple-id',
      user_id: 'sample-user-id',
      template_id: 'narrative-the-simple' as const,
      groom_name: theSimpleSampleContent.groom.name,
      bride_name: theSimpleSampleContent.bride.name,
      wedding_date: theSimpleSampleContent.wedding.date,
      wedding_time: theSimpleSampleContent.wedding.timeDisplay,
      venue_name: theSimpleSampleContent.wedding.venue.name,
      venue_address: theSimpleSampleContent.wedding.venue.address,
      venue_detail: null,
      venue_map_url: null,
      main_image: '',
      gallery_images: '[]',
      greeting_message: theSimpleSampleContent.sections.greeting.body,
      contact_groom: theSimpleSampleContent.groom.phone,
      contact_bride: theSimpleSampleContent.bride.phone,
      account_info: JSON.stringify([]),
      content: JSON.stringify(theSimpleSampleContent),
      is_paid: 1,
      is_published: 1,
      slug: 'sample-the-simple',
      created_at: now,
      updated_at: now,
    }
  }


  // essay 타입은 별도 처리
  if (type === 'essay') {
    const now = new Date().toISOString()
    const essayContent = {
      ...essayStorySampleContent,
      ...(essayConcept && { designConcept: essayConcept }),
    }
    return {
      id: essayConcept ? `sample-essay-${essayConcept}-id` : 'sample-essay-id',
      user_id: 'sample-user-id',
      template_id: 'narrative-essay' as const,
      groom_name: essayStorySampleContent.groom.name,
      bride_name: essayStorySampleContent.bride.name,
      wedding_date: essayStorySampleContent.wedding.date,
      wedding_time: essayStorySampleContent.wedding.timeDisplay,
      venue_name: essayStorySampleContent.wedding.venue.name,
      venue_address: essayStorySampleContent.wedding.venue.address,
      venue_detail: null,
      venue_map_url: null,
      main_image: '',
      gallery_images: '[]',
      greeting_message: essayStorySampleContent.greeting,
      contact_groom: essayStorySampleContent.groom.phone,
      contact_bride: essayStorySampleContent.bride.phone,
      account_info: JSON.stringify([]),
      content: JSON.stringify(essayContent),
      is_paid: 1,
      is_published: 1,
      slug: essayConcept ? `sample-essay-${essayConcept}` : 'sample-essay',
      created_at: now,
      updated_at: now,
    }
  }

  const content = type === 'family' ? familySampleContent : type === 'film' ? filmSampleContent : type === 'record' ? recordSampleContent : type === 'exhibit' ? exhibitSampleContent : ourSampleContent
  const templateIdMap = { our: 'narrative-our', family: 'narrative-family', magazine: 'narrative-magazine', film: 'narrative-film', record: 'narrative-record', exhibit: 'narrative-exhibit' } as const
  const now = new Date().toISOString()

  // magazine uses OUR content with modern-black theme override + interview images adjusted (1장/2장/2장)
  const magazineInterviews = [
    {
      question: '상대방의 첫인상은 어땠나요?',
      answer: '처음 본 순간, 이 사람이다 싶었어요. 말로 설명하기 어려운 느낌이었는데, 대화를 나눌수록 확신이 들었습니다. 서로의 눈을 바라보며 웃던 그 순간을 잊을 수 없어요.',
      images: ['/sample/magazine-interview1-1.png'],
      imageSettings: [{ scale: 1, positionX: 0, positionY: 0 }],
      bgClass: 'pink-bg',
    },
    {
      question: '결혼을 결심하게 된 계기는?',
      answer: '함께 있을 때 가장 나다울 수 있었어요. 아무리 힘든 일이 있어도 이 사람 곁에 있으면 괜찮아지더라구요. 평생 이 사람과 함께라면 어떤 일이든 해낼 수 있을 것 같았습니다.',
      images: ['/sample/magazine-interview2-1.png', '/sample/magazine-interview2-2.png'],
      imageSettings: [{ scale: 1, positionX: 0, positionY: 0 }, { scale: 1, positionX: 0, positionY: 0 }],
      bgClass: 'white-bg',
    },
    {
      question: '앞으로의 결혼생활 계획은?',
      answer: '서로를 존중하고 배려하며 살고 싶어요. 작은 일상에서도 감사함을 잊지 않고, 함께 웃으며 나이 들어가고 싶습니다. 무엇보다 서로의 꿈을 응원하는 부부가 되고 싶어요.',
      images: ['/sample/magazine-interview3-1.png', '/sample/magazine-interview3-2.png'],
      imageSettings: [{ scale: 1, positionX: 0, positionY: 0 }, { scale: 1, positionX: 0, positionY: 0 }],
      bgClass: 'pink-bg',
    },
  ]
  const magazineGuidance = { ...content.guidance, image: '/sample/magazine-information.png', imageSettings: { scale: 1, positionX: 0, positionY: 30 } }
  const magazineGallery = {
    images: ['/sample/magazine-galley1.png', '/sample/magazine-galley2.png', '/sample/magazine-galley3.png', '/sample/magazine-galley4.jpeg', '/sample/magazine-galley5.png', '/sample/magazine-galley6.png'],
    imageSettings: Array(6).fill({ scale: 1, positionX: 0, positionY: 0 }),
  }
  const magazineMedia = { ...content.media, coverImage: '/sample/magazine-cover.png' }
  const magazineYoutube = { enabled: true, title: '', url: 'https://youtu.be/iK1eXqrFZ6s' }
  const finalContent = type === 'magazine' ? { ...content, colorTheme: 'modern-black', fontStyle: 'modern', profileFrameShape: 'portrait', interviews: magazineInterviews, guidance: magazineGuidance, gallery: magazineGallery, media: magazineMedia, youtube: magazineYoutube } : content

  return {
    id: `sample-${type}-id`,
    user_id: 'sample-user-id',
    template_id: templateIdMap[type],
    groom_name: content.groom.name,
    bride_name: content.bride.name,
    wedding_date: content.wedding.date,
    wedding_time: content.wedding.time,
    venue_name: content.wedding.venue.name,
    venue_address: content.wedding.venue.address,
    venue_detail: null,
    venue_map_url: null,
    main_image: type === 'magazine' ? magazineMedia.coverImage : content.media.coverImage,
    gallery_images: type === 'magazine' ? JSON.stringify(magazineGallery.images) : JSON.stringify(content.gallery.images),
    greeting_message: content.content.greeting,
    contact_groom: content.groom.phone,
    contact_bride: content.bride.phone,
    account_info: JSON.stringify([]),
    content: JSON.stringify(finalContent),
    is_paid: 1,
    is_published: 1,
    slug: `sample-${type}`,
    created_at: now,
    updated_at: now,
  }
}
