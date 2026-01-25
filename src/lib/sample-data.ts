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
      subtitle: '신부가 소개하는 신랑',
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
      subtitle: '신랑이 소개하는 신부',
      intro: '밝은 웃음소리가 참 예쁜 사람.\n제가 지칠 때마다 힘이 되어주고, 작은 것에도 감사할 줄 아는 따뜻한 마음의 소유자입니다.\n\n그림 그리기를 좋아하고, 가끔 저를 위해 그려주는 그림들이 우리 집의 보물이에요.',
      tag: '매일 웃게 해주는 사람',
    },
  },
  wedding: {
    date: '2025-05-24',
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
      car: {
        desc: '네비게이션에 "더채플앳청담" 검색',
        route: '강남역 방면에서 청담사거리 방향으로 직진 후 우회전',
      },
      subway: ['압구정로데오역 5번 출구 도보 10분', '청담역 9번 출구 도보 15분'],
      bus: { main: ['146', '301', '401'], branch: ['3422', '4412'] },
      parking: { location: '건물 지하 1~3층 주차장 이용 가능', fee: '3시간 무료 주차권 제공' },
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
      dressCode: { title: 'Dress Code', content: '결혼식에 맞는 옷차림을 고민하지 않으셔도 괜찮아요.\n여러분이 가장 좋아하는 옷, 가장 여러분 다운 모습으로 오셔서 함께 웃고 즐겨주신다면 그걸로 충분합니다.\n우리의 특별한 하루를 함께 빛내주세요.', enabled: true },
      photoShare: { title: 'Photo Sharing', content: '결혼식에서 찍은 사진들을 공유해주세요!\n여러분의 시선으로 담긴 우리의 결혼식,\n소중한 추억으로 간직하겠습니다.', buttonText: '사진 공유하기', url: 'https://photos.google.com', enabled: true },
      photoBooth: { title: 'Photo Booth', content: '로비에서 포토부스를 즐겨보세요!', enabled: false },
      flowerChild: { title: '화동 안내', content: '', enabled: false },
      customItems: [],
    },
    interviews: [
      {
        question: '상대방의 첫인상은 어땠나요?',
        answer: '처음 본 순간, 이 사람이다 싶었어요. 말로 설명하기 어려운 느낌이었는데, 대화를 나눌수록 확신이 들었습니다. 서로의 눈을 바라보며 웃던 그 순간을 잊을 수 없어요.',
        images: ['/sample/interview1-1.png', '/sample/interview1-2.png'],
        imageSettings: [{ scale: 1, positionX: 0, positionY: 0 }, { scale: 1, positionX: 0, positionY: 0 }],
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
  fontStyle: 'romantic' as const,
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
  bgm: { enabled: false, url: '', autoplay: false },
  guidance: { enabled: false, title: '행복한 시간을 위한 안내', content: '', image: '', imageSettings: { scale: 1, positionX: 0, positionY: 0 } },
  intro: {
    presetId: 'cinematic' as const,
    welcomeText: 'Welcome to our wedding',
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
    welcomeText: '결혼식에 초대합니다',
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

// 샘플 청첩장 객체 생성 함수
export function createSampleInvitation(type: 'our' | 'family') {
  const content = type === 'our' ? ourSampleContent : familySampleContent
  const now = new Date().toISOString()

  return {
    id: `sample-${type}-id`,
    user_id: 'sample-user-id',
    template_id: type === 'our' ? 'narrative-our' : 'narrative-family',
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
    content: JSON.stringify(content),
    is_paid: 1,
    is_published: 1,
    slug: `sample-${type}`,
    created_at: now,
    updated_at: now,
  }
}
