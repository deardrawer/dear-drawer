// OUR 템플릿 샘플 데이터
export const ourSampleContent = {
  groom: {
    name: '김민준',
    phone: '010-1234-5678',
    father: { name: '김철수', phone: '010-1111-2222', deceased: false, bank: { bank: '', account: '', holder: '', enabled: false } },
    mother: { name: '박영희', phone: '010-3333-4444', deceased: false, bank: { bank: '', account: '', holder: '', enabled: false } },
    bank: { bank: '신한은행', account: '110-123-456789', holder: '김민준', enabled: true },
    profile: {
      images: ['/sample/groom1.png', '/sample/groom2.png'],
      imageSettings: [{ scale: 1, positionX: 0, positionY: 0 }, { scale: 1, positionX: 0, positionY: 0 }],
      aboutLabel: 'ABOUT GROOM',
      subtitle: '신랑을 소개합니다 🤵',
      intro: '처음 만났을 때부터 따뜻한 미소가 인상적이었던 사람.\n항상 제 이야기에 귀 기울여주고, 힘들 때 묵묵히 곁에 있어주는 든든한 사람입니다.\n\n요리를 좋아하고, 주말마다 새로운 레시피에 도전하는 모습이 참 사랑스러워요.',
      tag: '세상에서 가장 따뜻한 사람',
    },
  },
  bride: {
    name: '이서연',
    phone: '010-5678-1234',
    father: { name: '이정호', phone: '010-5555-6666', deceased: false, bank: { bank: '', account: '', holder: '', enabled: false } },
    mother: { name: '최미경', phone: '010-7777-8888', deceased: false, bank: { bank: '', account: '', holder: '', enabled: false } },
    bank: { bank: '국민은행', account: '123-45-678901', holder: '이서연', enabled: true },
    profile: {
      images: ['/sample/bride1.png', '/sample/bride2.png'],
      imageSettings: [{ scale: 1, positionX: 0, positionY: 0 }, { scale: 1, positionX: 0, positionY: 0 }],
      aboutLabel: 'ABOUT BRIDE',
      subtitle: '신부를 소개합니다 👰',
      intro: '밝은 웃음소리가 참 예쁜 사람.\n제가 지칠 때마다 힘이 되어주고, 작은 것에도 감사할 줄 아는 따뜻한 마음의 소유자입니다.\n\n그림 그리기를 좋아하고, 가끔 저를 위해 그려주는 그림들이 우리 집의 보물이에요.',
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
      sign: '민준 & 서연 올림',
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
        images: ['/sample/story1-1.png', '/sample/interview1-2.png', '/sample/interview1-3.jpeg'],
        imageSettings: [{ scale: 1, positionX: 0, positionY: 0 }, { scale: 1, positionX: 0, positionY: 0 }, { scale: 1, positionX: 0, positionY: 0 }],
        bgClass: 'pink-bg',
      },
      {
        question: '결혼을 결심하게 된 계기는?',
        answer: '함께 있을 때 가장 나다울 수 있었어요. 아무리 힘든 일이 있어도 이 사람 곁에 있으면 괜찮아지더라구요. 평생 이 사람과 함께라면 어떤 일이든 해낼 수 있을 것 같았습니다.',
        images: ['/sample/story2-1.png', '/sample/interview2-2.png', '/sample/interview2-3.png'],
        imageSettings: [{ scale: 1, positionX: 0, positionY: 0 }, { scale: 1, positionX: 0, positionY: 0 }, { scale: 1, positionX: 0, positionY: 0 }],
        bgClass: 'white-bg',
      },
      {
        question: '앞으로의 결혼생활 계획은?',
        answer: '서로를 존중하고 배려하며 살고 싶어요. 작은 일상에서도 감사함을 잊지 않고, 함께 웃으며 나이 들어가고 싶습니다. 무엇보다 서로의 꿈을 응원하는 부부가 되고 싶어요.',
        images: ['/sample/story3-1.jpeg', '/sample/interview3-2.png', '/sample/interview3-3.png'],
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
    coverImage: '/sample/cover.png',
    infoImage: '/sample/info.png',
    bgm: '',
  },
  meta: {
    title: '민준 ♥ 서연 결혼합니다',
    description: '2025년 5월 24일 토요일 오후 2시\n더채플앳청담 그랜드볼룸',
    ogImage: '/sample/cover.png',
    kakaoThumbnail: '/sample/cover.png',
  },
  templateId: 'our',
  primaryColor: '#A67B5B',
  secondaryColor: '#D4A574',
  accentColor: '#d4a574',
  backgroundColor: '#FDF8F5',
  textColor: '#333333',
  fontStyle: 'luxury' as const,
  colorTheme: 'classic-rose' as const,
  rsvpEnabled: true,
  rsvpDeadline: '2025-05-17',
  rsvpAllowGuestCount: true,
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
  guidance: { enabled: true, title: '행복한 시간을 위한 안내', content: '따뜻한 마음으로 함께해주세요', image: '/sample/info.png', imageSettings: { scale: 1, positionX: 0, positionY: -25 } },
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
      parentNames: '김○○ · 박○○의',
      childOrder: '첫째',
      images: ['/images/son.png'],
      imageSettings: [{ scale: 1, positionX: 0, positionY: 0 }],
      message: '말썽보다 웃음이 더 많았던 아이였습니다.\n잠든 얼굴을 한참 바라보다가\n\n\'이 아이가 어떤 사람과 함께할까\' 상상하던 밤이\n아직도 선명합니다.\n\n축구를 좋아해서 해 질 때까지 공만 차던 아이가\n지금은 누군가를 웃게 하고, 지켜주고 싶다는 사람이 되었습니다.\n\n처음으로, "이 사람이 있으면 마음이 편안해요"라고 말했을 때\n저는 더 이상 바랄 게 없겠다는 생각이 들었습니다.\n\n그렇게, 저희 아들이 사랑하는 사람과\n인생의 길을 함께 걸어가려 합니다.\n\n기쁘고 설레는 이 시작에,\n오셔서 따뜻한 마음으로 축복해주신다면\n부모로서 더없이 감사하겠습니다.',
    },
    bride: {
      enabled: true,
      parentNames: '이○○ · 김○○의',
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
  fontStyle: 'contemporary' as const,
  groom: {
    ...ourSampleContent.groom,
    name: '김민준',
    nameEn: 'MINJU',
    lastName: '김',
    firstName: '민준',
  },
  bride: {
    ...ourSampleContent.bride,
    name: '이서연',
    nameEn: 'SEOYEON',
    lastName: '이',
    firstName: '서연',
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
        question: '첫 만남',
        answer: '"첫인상이 어땠냐고? 솔직히 별 생각 없었어."\n"나도. 근데 두 번째 만났을 때 좀 설렜어. 아주 조금."',
        images: ['/sample/story1-1.png', '/sample/story1-2.png'],
        imageSettings: [{ scale: 1, positionX: 0, positionY: 0 }, { scale: 1, positionX: 0, positionY: 0 }],
        bgClass: 'pink-bg',
      },
      {
        question: '우리의 시간',
        answer: '"이 사람 장점? 제가 하는 말에 잘 웃어줘요."\n"아니 진짜 웃긴 걸 어떡해. 근데 본인은 모름."',
        images: ['/sample/story2-1.png', '/sample/story2-2.png'],
        imageSettings: [{ scale: 1, positionX: 0, positionY: 0 }, { scale: 1, positionX: 0, positionY: 0 }],
        bgClass: 'white-bg',
      },
      {
        question: '프로포즈',
        answer: '"프로포즈를 엄청 준비했는데 긴장해서 다 까먹었어."\n"그래서 그냥 울었잖아. 그게 더 감동이었어 사실."',
        images: ['/sample/story3-1.jpeg', '/sample/story3-2.png'],
        imageSettings: [{ scale: 1, positionX: 0, positionY: 0 }, { scale: 1, positionX: 0, positionY: 0 }],
        bgClass: 'pink-bg',
      },
    ],
    thankYou: {
      title: 'SPECIAL THANKS',
      message: '바쁘신 와중에도 저희의 결혼을\n축하해 주셔서 진심으로 감사드립니다.\n\n여러분의 축복을 마음에 새기며\n서로 아끼고 사랑하며 살겠습니다.',
      sign: '민준 & 서연 올림',
    },
  },
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
}

// RECORD 템플릿 샘플 데이터
export const recordSampleContent = {
  ...ourSampleContent,
  templateId: 'record',
  colorTheme: 'record-coral' as const,
  fontStyle: 'modern' as const,
  groom: {
    ...ourSampleContent.groom,
    name: '김민준',
    lastName: '김',
    firstName: '민준',
  },
  bride: {
    ...ourSampleContent.bride,
    name: '이서연',
    lastName: '이',
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
    greeting: '두 사람의 하모니가 하나의 멜로디가 되어\n평생의 노래를 함께 부르려 합니다.\n\n저희의 첫 번째 합주에\n귀 기울여 주시겠어요?',
    quote: {
      text: 'Every love story is a beautiful song, but ours is my favorite.',
      author: '',
    },
    interviews: [
      {
        question: '첫 만남의 멜로디',
        answer: '우연히 같은 카페에서 흘러나온 노래에\n동시에 흥얼거리기 시작했어요.\n서로를 바라보며 웃었던 그 순간,\n우리만의 첫 번째 곡이 시작되었습니다.',
        images: ['/sample/story1-1.png', '/sample/story1-2.png'],
        imageSettings: [{ scale: 1, positionX: 0, positionY: 0 }, { scale: 1, positionX: 0, positionY: 0 }],
        bgClass: 'pink-bg',
      },
      {
        question: '함께 만든 하모니',
        answer: '서로 다른 음색이 만나\n더 아름다운 화음이 되었어요.\n때로는 불협화음도 있었지만\n그마저도 우리만의 음악이 되었습니다.',
        images: ['/sample/story2-1.png', '/sample/story2-2.png'],
        imageSettings: [{ scale: 1, positionX: 0, positionY: 0 }, { scale: 1, positionX: 0, positionY: 0 }],
        bgClass: 'white-bg',
      },
      {
        question: '영원한 듀엣',
        answer: '"평생 너와 듀엣을 하고 싶어."\n떨리는 목소리로 건넨 프로포즈에\n그녀는 눈물을 글썽이며 고개를 끄덕였습니다.\n우리의 가장 아름다운 곡이 시작되는 순간이었어요.',
        images: ['/sample/story3-1.jpeg', '/sample/story3-2.png'],
        imageSettings: [{ scale: 1, positionX: 0, positionY: 0 }, { scale: 1, positionX: 0, positionY: 0 }],
        bgClass: 'pink-bg',
      },
    ],
    thankYou: {
      title: 'LINER NOTES',
      message: '이 앨범이 완성되기까지\n함께해주신 모든 분들께 감사드립니다.\n\n여러분의 축복이 담긴 이 노래를\n평생 함께 부르며 살겠습니다.',
      sign: '민준 & 서연 올림',
    },
  },
  guidance: { ...ourSampleContent.guidance, imageSettings: { scale: 1, positionX: 0, positionY: -8 } },
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
      thankYou: 'BONUS TRACK',
      guestbook: 'FAN MAIL',
    },
  },
}

// FEED 템플릿 샘플 데이터
export const exhibitSampleContent = {
  ...ourSampleContent,
  templateId: 'exhibit',
  colorTheme: 'exhibit-white' as const,
  fontStyle: 'modern' as const,
  displayId: 'mj♥sy',
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
      { id: 'g2', guest_name: '최현우', message: '민준아 결혼 축하한다! 서연님과 행복한 가정 꾸려라 🎉', created_at: '2026-02-19T09:15:00Z' },
      { id: 'g3', guest_name: '정소희', message: '세상에서 가장 예쁜 커플! 결혼 너무너무 축하드려요 🤍', created_at: '2026-02-18T22:00:00Z' },
      { id: 'g4', guest_name: '김태호', message: '축하축하! 결혼식 날 꼭 갈게요. 행복하게 잘 살아 😊', created_at: '2026-02-18T18:30:00Z' },
      { id: 'g5', guest_name: '이수진', message: '서연아 결혼 축하해!! 민준님이랑 오래오래 행복해 💐', created_at: '2026-02-18T15:00:00Z' },
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
      sign: '민준 & 서연 올림',
    },
  },
  design: {
    ...ourSampleContent.design,
    coverTitle: '',
  },
}

// 샘플 청첩장 객체 생성 함수
export function createSampleInvitation(type: 'our' | 'family' | 'magazine' | 'film' | 'record' | 'exhibit') {
  const content = type === 'family' ? familySampleContent : type === 'film' ? filmSampleContent : type === 'record' ? recordSampleContent : type === 'exhibit' ? exhibitSampleContent : ourSampleContent
  const templateIdMap = { our: 'narrative-our', family: 'narrative-family', magazine: 'narrative-magazine', film: 'narrative-film', record: 'narrative-record', exhibit: 'narrative-exhibit' } as const
  const now = new Date().toISOString()

  // magazine uses OUR content with modern-black theme override + interview images adjusted (1장/2장/2장)
  const magazineInterviews = [
    {
      question: '상대방의 첫인상은 어땠나요?',
      answer: '처음 본 순간, 이 사람이다 싶었어요. 말로 설명하기 어려운 느낌이었는데, 대화를 나눌수록 확신이 들었습니다. 서로의 눈을 바라보며 웃던 그 순간을 잊을 수 없어요.',
      images: ['/sample/story1-1.png'],
      imageSettings: [{ scale: 1, positionX: 0, positionY: 0 }],
      bgClass: 'pink-bg',
    },
    {
      question: '결혼을 결심하게 된 계기는?',
      answer: '함께 있을 때 가장 나다울 수 있었어요. 아무리 힘든 일이 있어도 이 사람 곁에 있으면 괜찮아지더라구요. 평생 이 사람과 함께라면 어떤 일이든 해낼 수 있을 것 같았습니다.',
      images: ['/sample/interview2-1.png', '/sample/interview2-2.png'],
      imageSettings: [{ scale: 1, positionX: 0, positionY: 0 }, { scale: 1, positionX: 0, positionY: 0 }],
      bgClass: 'white-bg',
    },
    {
      question: '앞으로의 결혼생활 계획은?',
      answer: '서로를 존중하고 배려하며 살고 싶어요. 작은 일상에서도 감사함을 잊지 않고, 함께 웃으며 나이 들어가고 싶습니다. 무엇보다 서로의 꿈을 응원하는 부부가 되고 싶어요.',
      images: ['/sample/interview3-1.png', '/sample/interview3-2.png'],
      imageSettings: [{ scale: 1, positionX: 0, positionY: 0 }, { scale: 1, positionX: 0, positionY: 0 }],
      bgClass: 'pink-bg',
    },
  ]
  const magazineGuidance = { ...content.guidance, imageSettings: { scale: 1, positionX: 0, positionY: -8 } }
  const finalContent = type === 'magazine' ? { ...content, colorTheme: 'modern-black', fontStyle: 'modern', interviews: magazineInterviews, guidance: magazineGuidance } : content

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
    main_image: content.media.coverImage,
    gallery_images: JSON.stringify(content.gallery.images),
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
