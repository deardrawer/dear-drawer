'use client';

import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import FamilyTimeline from '@/components/invitation/FamilyTimeline';

// ============================================
// 3D 봉투 화면 컴포넌트
// ============================================
function EnvelopeScreen({
  recipientName,
  recipientTitle = '님께',
  greetingTo = '김영희 이모님께',
  message = ['항상 저희 가족', '챙겨주셔서 감사합니다', '', '서연이가 좋은 사람 만나', '결혼하게 되었습니다', '', '꼭 오셔서', '축복해 주세요'],
  signature = '아버지 이○○ · 어머니 김○○ 드림',
  onOpen,
}: {
  recipientName: string;
  recipientTitle?: string;
  greetingTo?: string;
  message?: string[];
  signature?: string;
  onOpen: () => void;
}) {
  const [stage, setStage] = useState(0); // 0: 앞면, 1: 뒤집힘, 2: 열림, 3: 꺼냄
  const [isExtracted, setIsExtracted] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  const handleClick = useCallback(() => {
    if (stage === 0) {
      // 1단계: 뒤집기
      setStage(1);
    } else if (stage === 1) {
      // 2단계: 봉투 열기
      setStage(2);

      // 편지지 꺼내기
      setTimeout(() => {
        setIsExtracted(true);
        setStage(3);
      }, 1000);
    } else if (stage === 3) {
      // 3단계: 편지지 클릭 시 본문으로 전환
      onOpen();
    }
  }, [stage, onOpen]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ backgroundColor: '#722F37' }}>
      <style jsx>{`
        .envelope-wrapper {
          perspective: 1500px;
          height: 720px;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .envelope-container {
          position: relative;
          width: 300px;
          height: 420px;
          transform-style: preserve-3d;
          transition: transform 0.8s ease;
          cursor: pointer;
        }

        .envelope-container.flipped {
          transform: rotateY(180deg);
        }

        .envelope-front {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          background: linear-gradient(to bottom, #F7F4EF 0%, #EDE9E3 100%);
          border-radius: 0;
          box-shadow: 0 8px 30px rgba(0,0,0,0.12);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .envelope-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          transform: rotateY(180deg);
          border-radius: 0;
          background-color: #F7F4EF;
          transition: transform 0.8s ease, opacity 0.6s ease;
        }

        .envelope-back.hide {
          transform: rotateY(180deg) translateY(400px);
          opacity: 0;
          pointer-events: none;
        }

        .front {
          position: absolute;
          width: 0;
          height: 0;
          z-index: 3;
        }

        .flap {
          border-left: 150px solid transparent;
          border-right: 150px solid transparent;
          border-bottom: 180px solid transparent;
          border-top: 240px solid #EDE9E3;
          transform-origin: top;
          pointer-events: none;
          transition: transform 0.4s 0.4s ease, z-index 0.5s;
          z-index: 5;
          filter: drop-shadow(0 4px 6px rgba(0,0,0,0.15));
        }

        .pocket {
          border-left: 150px solid #F7F4EF;
          border-right: 150px solid #F7F4EF;
          border-bottom: 210px solid #EDE9E3;
          border-top: 210px solid transparent;
          border-radius: 0;
          filter: drop-shadow(0 -8px 12px rgba(0,0,0,0.25));
        }

        .letter {
          position: relative;
          background-color: #FFFFFF;
          width: 90%;
          margin-left: auto;
          margin-right: auto;
          height: 90%;
          top: 5%;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          text-align: center;
          transition: transform 0.4s ease, z-index 0.5s;
          z-index: 1;
          overflow: hidden;
        }

        .letter::after {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          right: 0;
          border-radius: 6px;
          background-image: linear-gradient(180deg,
            rgba(255,255,255,0) 40%,
            rgba(232,228,220,0.3) 70%,
            rgba(232,228,220,0.5) 100%);
          pointer-events: none;
        }

        .flap-decoration {
          position: absolute;
          top: 220px;
          left: 50%;
          transform: translateX(-50%);
          width: 36px;
          height: 36px;
          border: 1.5px solid #C9A962;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 6;
          background: #DED6CA;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }

        .envelope-back.open .flap {
          transform: rotateX(-180deg);
          transition: transform 1.2s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1;
        }

        .envelope-back.open .letter {
          transform: translateY(-320px);
          transition: transform 0.8s 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
          z-index: 2;
        }

        .envelope-back.open .flap-decoration {
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .envelope-back.extracted .flap {
          transform: rotateX(0deg);
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 5;
        }

        .envelope-back.extracted .letter {
          transform: translateY(0);
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 10;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        }

        .envelope-back.extracted .flap-decoration {
          opacity: 0;
        }

        .sealing-wax {
          position: absolute;
          top: 180px;
          left: 50%;
          transform: translateX(-50%);
          width: 70px;
          height: 70px;
          z-index: 20;
          pointer-events: none;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
        }

        .sealing-wax img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .envelope-back.open .sealing-wax {
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .envelope-back.extracted .sealing-wax {
          opacity: 0;
          z-index: -1;
          transition: opacity 0.3s ease;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-3px); }
        }

        .hint {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>

      <div className="envelope-wrapper" onClick={handleClick}>
        <div
          className={`envelope-container ${stage >= 1 ? 'flipped' : ''}`}
        >
          {/* 봉투 앞면 (받는 사람) */}
          <div
            className="envelope-front"
            style={{ opacity: isHidden ? 0 : 1, transition: 'opacity 0.6s ease' }}
          >
            <div className="h-px w-[60px] my-4" style={{ backgroundColor: '#C9A962' }} />
            <p className="text-[22px]" style={{ color: '#2C2C2C', fontFamily: "'Noto Serif KR', Georgia, serif" }}>
              {recipientName} {recipientTitle}
            </p>
            <div className="h-px w-[60px] my-4" style={{ backgroundColor: '#C9A962' }} />
          </div>

          {/* 봉투 뒷면 (열리는 면) */}
          <div
            className={`envelope-back ${stage >= 2 && !isExtracted ? 'open' : ''} ${isExtracted ? 'extracted' : ''}`}
          >
            {/* 실링왁스 */}
            <div className="sealing-wax" style={{ opacity: isHidden ? 0 : 1, transition: 'opacity 0.6s ease' }}>
              <img src="/images/shilling2.png" alt="seal" />
            </div>

            {/* 뚜껑 */}
            <div className="front flap" style={{ opacity: isHidden ? 0 : 1, transition: 'opacity 0.6s ease' }}></div>

            {/* 봉투 주머니 */}
            <div className="front pocket" style={{ opacity: isHidden ? 0 : 1, transition: 'opacity 0.6s ease' }}></div>

            {/* 카드 (편지) */}
            <div className="letter">
              <div className="relative z-10">
                <p
                  className="text-[10px] tracking-[2px] mb-4"
                  style={{ color: '#C9A962' }}
                >
                  WEDDING INVITATION
                </p>
                <div className="h-px w-[40px] mx-auto mb-4" style={{ backgroundColor: '#C9A962' }} />
                <p
                  className="text-[16px] mb-4"
                  style={{ color: '#2C2C2C', fontFamily: "'Noto Serif KR', Georgia, serif" }}
                >
                  {greetingTo}
                </p>
                <div className="text-[12px] leading-[1.5] mb-4" style={{ color: '#555' }}>
                  {message.map((line, i) => (
                    <p key={i} style={{ marginTop: line === '' ? '6px' : '0' }}>
                      {line || '\u00A0'}
                    </p>
                  ))}
                </div>
                <div className="h-px w-[40px] mx-auto mb-3" style={{ backgroundColor: '#C9A962' }} />
                <p className="text-[11px]" style={{ color: '#888' }}>
                  {signature}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 안내 텍스트 */}
      <div className="hint text-center mt-8">
        <p className="text-[18px] mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>↑</p>
        <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {stage === 0 ? '터치하여 뒤집기' : stage === 1 ? '터치하여 열기' : stage === 3 ? '터치하여 청첩장 보기' : ''}
        </p>
      </div>
    </div>
  );
}

// ============================================
// 섹션 하이라이트 컨텍스트
// ============================================
const SectionHighlightContext = createContext<{
  activeSection: string;
  registerSection: (id: string, ratio: number) => void;
}>({
  activeSection: '',
  registerSection: () => {},
});

function useSectionHighlight(sectionId: string) {
  const ref = useRef<HTMLElement>(null);
  const { activeSection, registerSection } = useContext(SectionHighlightContext);
  const [hasAppeared, setHasAppeared] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAppeared) {
          setHasAppeared(true);
        }
        registerSection(sectionId, entry.intersectionRatio);
      },
      {
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
        rootMargin: '-10% 0px -10% 0px'
      }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [sectionId, registerSection, hasAppeared]);

  const isActive = activeSection === sectionId;

  return { ref, isActive, hasAppeared };
}

// ============================================
// 섹션 구분선
// ============================================
function SectionDivider() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="flex flex-col items-center justify-center py-12"
      style={{ backgroundColor: '#FFFEF8' }}
    >
      <div
        className="w-px transition-all duration-700 ease-out"
        style={{
          backgroundColor: '#C9A962',
          height: isVisible ? '48px' : '0px',
          opacity: isVisible ? 1 : 0,
        }}
      />
    </div>
  );
}

// ============================================
// 섹션 컴포넌트들
// ============================================

// 인사말 섹션
function GreetingSection() {
  const { ref, isActive, hasAppeared } = useSectionHighlight('greeting');

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      className="min-h-screen flex flex-col items-center justify-center px-8 py-20 transition-all duration-500"
      style={{
        backgroundColor: '#FFFEF8',
        opacity: hasAppeared ? (isActive ? 1 : 0.3) : 0,
        transform: hasAppeared ? 'translateY(0)' : 'translateY(20px)',
        filter: isActive ? 'none' : 'grayscale(30%)',
      }}
    >
      {/* 회전하는 장식 */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinning-symbol {
          animation: spin 8s linear infinite;
          display: inline-block;
        }
      `}</style>
      <span
        className="spinning-symbol text-2xl mb-8"
        style={{ color: '#C9A962' }}
      >
        ✦
      </span>

      {/* 제목 */}
      <h2
        className="font-serif text-xl tracking-wider mb-10 transition-colors duration-500"
        style={{ color: isActive ? '#1A1A1A' : '#999' }}
      >
        저희 딸 <span style={{ color: '#C9A962' }}>서연</span> 결혼합니다
      </h2>

      {/* 인사말 */}
      <div className="text-center mb-12 max-w-[300px]">
        <p
          className="font-serif text-sm leading-[2.2] transition-colors duration-500"
          style={{ color: isActive ? '#555' : '#999' }}
        >
          서연이는 저희 부부에게<br />
          늘 선물 같은 아이였습니다.<br />
          <br />
          어릴 적에는 소문날 만큼 많이 울던 아이였지만,<br />
          자라면서는 무엇이든 스스로 해내고<br />
          가족을 먼저 챙길 줄 아는,<br />
          마음이 참 단단한 딸로 컸습니다.<br />
          <br />
          그런 서연이가 어느덧 서른둘이 되어<br />
          좋은 사람을 만나 새로운 가정을 꾸린다 하니<br />
          기쁨과 함께 여러 마음이 교차합니다.<br />
          <br />
          이제는 저희 품을 떠나<br />
          남편과 함께 새로운 삶을 시작하는<br />
          서연이의 앞날에<br />
          따뜻한 축복과 응원을 보내주시길<br />
          부탁드립니다.
        </p>
      </div>

      {/* 부모님 이름 */}
      <p
        className="mt-8 text-sm tracking-wide transition-colors duration-500"
        style={{ color: isActive ? '#C9A962' : '#D4C9A0' }}
      >
        아버지 이○○ · 어머니 김○○
      </p>
    </section>
  );
}

// 타임라인 섹션 (하이라이트 래퍼)
function TimelineSection() {
  const { ref, isActive, hasAppeared } = useSectionHighlight('timeline');

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      className="transition-all duration-500"
      style={{
        opacity: hasAppeared ? (isActive ? 1 : 0.3) : 0,
        transform: hasAppeared ? 'translateY(0)' : 'translateY(20px)',
        filter: isActive ? 'none' : 'grayscale(30%)',
      }}
    >
      <FamilyTimeline
        items={[
          { year: '1992', description: '저희가 결혼하던 날', imageUrl: '/samples/parents/timeline/story1.jpg' },
          { year: '1998', description: '서연이 5살 생일에 강원도 여행간 날', imageUrl: '/samples/parents/timeline/story2.jpeg' },
          { year: '2018', description: '대학 졸업하던 날', imageUrl: '/samples/parents/timeline/story3.jpeg' },
          { year: '2025', description: '평생의 반쪽을 만나다', imageUrl: '/samples/parents/timeline/story4.jpg' },
        ]}
      />
    </section>
  );
}

// 메인 사진 섹션
function MainPhotoSection() {
  const { ref, isActive, hasAppeared } = useSectionHighlight('main-photo');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const photos = [
    { id: 1, url: '/samples/parents/1.png' },
    { id: 2, url: '/samples/parents/2.png' },
    { id: 3, url: '/samples/parents/3.png' },
    { id: 4, url: '/samples/parents/4.png' },
    { id: 5, url: '/samples/parents/5.png' },
  ];

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 50) {
      // 왼쪽으로 스와이프 (다음) - 무한루프
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }
    if (touchStart - touchEnd < -50) {
      // 오른쪽으로 스와이프 (이전) - 무한루프
      setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
    }
  };

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      className="py-20 transition-all duration-500 min-h-screen flex flex-col items-center justify-center"
      style={{
        backgroundColor: '#FFFEF8',
        opacity: hasAppeared ? (isActive ? 1 : 0.3) : 0,
        transform: hasAppeared ? 'translateY(0)' : 'translateY(20px)',
        filter: isActive ? 'none' : 'grayscale(30%)',
      }}
    >
      {/* 사진 갤러리 */}
      <div
        className="w-full overflow-hidden mb-10 relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex justify-center">
          {photos.map((photo, index) => {
            // 현재 인덱스와의 차이 계산 (무한루프 고려)
            let diff = index - currentIndex;
            if (diff > photos.length / 2) diff -= photos.length;
            if (diff < -photos.length / 2) diff += photos.length;

            // 보이는 범위 (-1, 0, 1)만 렌더링
            if (Math.abs(diff) > 1) return null;

            return (
              <div
                key={photo.id}
                className="absolute transition-all duration-500 ease-out"
                style={{
                  width: '75%',
                  left: '50%',
                  transform: `translateX(calc(-50% + ${diff * 85}%))`,
                  zIndex: diff === 0 ? 10 : 5,
                }}
              >
                <div
                  className="aspect-[3/4] rounded-lg transition-all duration-500"
                  style={{
                    backgroundColor: '#E8E4DC',
                    boxShadow: diff === 0
                      ? '0 8px 30px rgba(0, 0, 0, 0.15)'
                      : '0 2px 8px rgba(0, 0, 0, 0.05)',
                    transform: diff === 0 ? 'scale(1)' : 'scale(0.9)',
                    opacity: diff === 0 ? 1 : 0.5,
                  }}
                >
                  {photo.url ? (
                    <img
                      src={photo.url}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs" style={{ color: '#C9A962' }}>
                        Photo {index + 1}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {/* 갤러리 높이 유지용 */}
        <div className="w-[75%] mx-auto aspect-[3/4] pointer-events-none" />
      </div>

      {/* 인디케이터 */}
      <div className="flex gap-2 mb-10">
        {photos.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className="w-2 h-2 rounded-full transition-all duration-300"
            style={{
              backgroundColor: index === currentIndex ? '#C9A962' : '#E8E4DC',
            }}
          />
        ))}
      </div>

      {/* 신랑 신부 이름 */}
      <div className="text-center px-8">
        <h2
          className="font-serif text-2xl tracking-wider mb-6 transition-colors duration-500"
          style={{ color: isActive ? '#1A1A1A' : '#999' }}
        >
          김도윤 <span style={{ color: isActive ? '#C9A962' : '#D4C9A0' }}>✦</span> 이서연
        </h2>

        <div className="space-y-1">
          <p className="text-sm transition-colors duration-500" style={{ color: isActive ? '#666' : '#aaa' }}>
            김○○ · 박○○의 장남
          </p>
          <p className="text-sm transition-colors duration-500" style={{ color: isActive ? '#666' : '#aaa' }}>
            이○○ · 김○○의 장녀
          </p>
        </div>
      </div>
    </section>
  );
}

// 날짜 섹션
function DateSection() {
  const { ref, isActive, hasAppeared } = useSectionHighlight('date');

  // 2027년 1월 달력 데이터 (1월 1일 = 금요일)
  const calendarDays = [
    ['', '', '', '', '', '1', '2'],
    ['3', '4', '5', '6', '7', '8', '9'],
    ['10', '11', '12', '13', '14', '15', '16'],
    ['17', '18', '19', '20', '21', '22', '23'],
    ['24', '25', '26', '27', '28', '29', '30'],
    ['31', '', '', '', '', '', ''],
  ];
  const weddingDay = '9';

  // D-day 계산
  const weddingDate = new Date('2027-01-09');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = weddingDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      className="px-8 py-20 transition-all duration-500 min-h-screen flex flex-col items-center justify-center"
      style={{
        backgroundColor: '#FFFEF8',
        opacity: hasAppeared ? (isActive ? 1 : 0.3) : 0,
        transform: hasAppeared ? 'translateY(0)' : 'translateY(20px)',
        filter: isActive ? 'none' : 'grayscale(30%)',
      }}
    >
      {/* 날짜 */}
      <p
        className="font-serif text-2xl tracking-wider mb-2 transition-colors duration-500"
        style={{ color: isActive ? '#1A1A1A' : '#999' }}
      >
        2027. 1. 9
      </p>
      <p
        className="font-serif text-base italic tracking-wider mb-10 transition-colors duration-500"
        style={{ color: isActive ? '#C9A962' : '#D4C9A0' }}
      >
        Saturday, 4pm
      </p>

      {/* 달력 */}
      <div className="w-full max-w-[280px]">
        {/* 월 표시 */}
        <p
          className="text-center font-serif text-sm tracking-wider mb-4 transition-colors duration-500"
          style={{ color: isActive ? '#C9A962' : '#D4C9A0' }}
        >
          JANUARY 2027
        </p>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
            <div
              key={day}
              className="text-center text-xs py-2 transition-colors duration-500"
              style={{ color: i === 0 ? '#E57373' : i === 6 ? '#64B5F6' : (isActive ? '#999' : '#bbb') }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.flat().map((day, index) => {
            const isWeddingDay = day === weddingDay;
            const dayOfWeek = index % 7;
            const isSunday = dayOfWeek === 0;
            const isSaturday = dayOfWeek === 6;

            return (
              <div
                key={index}
                className={`text-center text-sm py-2 transition-all duration-500 ${
                  isWeddingDay ? 'rounded-full' : ''
                }`}
                style={{
                  backgroundColor: isWeddingDay ? '#C9A962' : 'transparent',
                  color: isWeddingDay
                    ? '#FFFFFF'
                    : isSunday
                    ? '#E57373'
                    : isSaturday
                    ? '#64B5F6'
                    : (isActive ? '#1A1A1A' : '#999'),
                  fontWeight: isWeddingDay ? '600' : '400',
                }}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      {/* D-day 카운트다운 */}
      <div className="mt-10 text-center">
        <p
          className="font-serif text-sm tracking-wide transition-colors duration-500"
          style={{ color: isActive ? '#888' : '#aaa' }}
        >
          {diffDays > 0
            ? <>결혼식까지 <span style={{ color: isActive ? '#C9A962' : '#D4C9A0' }}>{diffDays}일</span> 남았습니다</>
            : diffDays === 0
            ? '오늘 결혼식입니다'
            : <>결혼식으로부터 <span style={{ color: isActive ? '#C9A962' : '#D4C9A0' }}>{Math.abs(diffDays)}일</span> 지났습니다</>
          }
        </p>
      </div>
    </section>
  );
}

// 장소 섹션
function VenueSection() {
  const { ref, isActive, hasAppeared } = useSectionHighlight('venue');
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInitialized = useRef(false);

  // 장소 정보
  const venue = {
    name: '더채플앳청담',
    hall: '5층 루체홀',
    address: '서울특별시 강남구 청담동 123-45',
    lat: 37.5200,
    lng: 127.0460,
  };

  // 카카오맵 로드 및 초기화
  useEffect(() => {
    if (mapInitialized.current) return;

    const initMap = () => {
      if (!mapContainerRef.current || !window.kakao?.maps) return;

      mapInitialized.current = true;

      const options = {
        center: new window.kakao.maps.LatLng(venue.lat, venue.lng),
        level: 3,
      };

      const map = new window.kakao.maps.Map(mapContainerRef.current, options);

      // 마커 생성
      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(venue.lat, venue.lng),
      });
      marker.setMap(map);

      // 인포윈도우
      const infowindow = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:5px;font-size:12px;white-space:nowrap;">${venue.name}</div>`,
      });
      infowindow.open(map, marker);
    };

    // 카카오맵 SDK가 이미 로드되어 있는지 확인
    if (window.kakao?.maps) {
      initMap();
      return;
    }

    // 카카오맵 스크립트 로드
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID}&autoload=false`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(initMap);
    };
    document.head.appendChild(script);
  }, []);

  // 네비게이션 앱 열기
  const openNaverMap = () => {
    window.open(`https://map.naver.com/v5/search/${encodeURIComponent(venue.address)}`, '_blank');
  };

  const openKakaoNavi = () => {
    window.open(`https://map.kakao.com/link/to/${venue.name},${venue.lat},${venue.lng}`, '_blank');
  };

  const openTmap = () => {
    // T맵 앱 스킴 (모바일)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      // T맵 앱으로 길안내
      window.location.href = `tmap://route?goalname=${encodeURIComponent(venue.name)}&goalx=${venue.lng}&goaly=${venue.lat}`;
    } else {
      // PC에서는 T맵 웹사이트로 이동
      window.open(`https://tmap.life/search?keyword=${encodeURIComponent(venue.address)}`, '_blank');
    }
  };

  return (
    <>
      <section
        ref={ref as React.RefObject<HTMLDivElement>}
        className="px-8 py-20 transition-all duration-500 min-h-screen flex flex-col items-center justify-center"
        style={{
          backgroundColor: '#FFFEF8',
          opacity: hasAppeared ? (isActive ? 1 : 0.3) : 0,
          transform: hasAppeared ? 'translateY(0)' : 'translateY(20px)',
          filter: isActive ? 'none' : 'grayscale(30%)',
        }}
      >
        <div className="text-center mb-10 w-full">
          {/* 장소 */}
          <p
            className="font-serif text-xl mb-2 transition-colors duration-500"
            style={{ color: isActive ? '#1A1A1A' : '#999' }}
          >
            서울 {venue.name}
          </p>
          <p className="text-sm transition-colors duration-500" style={{ color: '#C9A962' }}>
            {venue.hall}
          </p>
          <p className="text-xs mt-2 transition-colors duration-500" style={{ color: isActive ? '#999' : '#bbb' }}>
            {venue.address}
          </p>
        </div>

        {/* 카카오맵 */}
        <div
          ref={mapContainerRef}
          className="w-full aspect-[16/9] rounded-sm mb-4 overflow-hidden transition-all duration-500"
          style={{
            backgroundColor: '#E8E4DC',
            boxShadow: isActive ? '0 4px 20px rgba(0, 0, 0, 0.08)' : '0 2px 8px rgba(0, 0, 0, 0.02)',
          }}
        />

        {/* 네비게이션 버튼 */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <button
            onClick={openNaverMap}
            className="px-4 py-2 text-xs tracking-wide rounded-full transition-all hover:bg-[#C9A962] hover:text-white"
            style={{ backgroundColor: '#F5F0EB', color: '#666' }}
          >
            네이버지도
          </button>
          <button
            onClick={openKakaoNavi}
            className="px-4 py-2 text-xs tracking-wide rounded-full transition-all hover:bg-[#C9A962] hover:text-white"
            style={{ backgroundColor: '#F5F0EB', color: '#666' }}
          >
            카카오맵
          </button>
          <button
            onClick={openTmap}
            className="px-4 py-2 text-xs tracking-wide rounded-full transition-all hover:bg-[#C9A962] hover:text-white"
            style={{ backgroundColor: '#F5F0EB', color: '#666' }}
          >
            T맵
          </button>
        </div>

        {/* 오시는 길 안내 버튼 + 인라인 펼침 */}
        <div className="w-full max-w-[340px]">
          <button
            onClick={() => setShowDirectionsModal(!showDirectionsModal)}
            className="w-full py-3 border rounded-lg text-sm tracking-wide transition-all hover:border-[#C9A962] hover:text-[#C9A962]"
            style={{
              borderColor: showDirectionsModal ? '#C9A962' : '#E8E4DC',
              color: showDirectionsModal ? '#C9A962' : (isActive ? '#666' : '#aaa'),
              borderBottomLeftRadius: showDirectionsModal ? 0 : undefined,
              borderBottomRightRadius: showDirectionsModal ? 0 : undefined,
            }}
          >
            오시는 길 안내
          </button>

          {/* 펼쳐지는 안내 패널 */}
          <div
            className="overflow-hidden transition-all duration-300 border border-t-0 rounded-b-lg"
            style={{
              maxHeight: showDirectionsModal ? '500px' : '0px',
              borderColor: showDirectionsModal ? '#C9A962' : 'transparent',
              opacity: showDirectionsModal ? 1 : 0,
            }}
          >
            <div className="p-4" style={{ backgroundColor: '#FEFDFB' }}>
              {/* 버스 */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">🚌</span>
                  <h4 className="font-medium text-xs" style={{ color: '#1A1A1A' }}>버스</h4>
                </div>
                <div className="text-xs leading-relaxed pl-6" style={{ color: '#666' }}>
                  <p className="mb-0.5"><span style={{ color: '#C9A962' }}>간선</span> 143, 240, 463</p>
                  <p className="mb-0.5"><span style={{ color: '#64B5F6' }}>지선</span> 3412, 4412</p>
                  <p className="text-[10px] mt-1" style={{ color: '#999' }}>청담사거리 정류장 하차 후 도보 5분</p>
                </div>
              </div>

              {/* 지하철 */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">🚇</span>
                  <h4 className="font-medium text-xs" style={{ color: '#1A1A1A' }}>지하철</h4>
                </div>
                <div className="text-xs leading-relaxed pl-6" style={{ color: '#666' }}>
                  <p className="mb-0.5">7호선 <span style={{ color: '#C9A962' }}>청담역</span> 9번 출구</p>
                  <p className="text-[10px] mt-1" style={{ color: '#999' }}>도보 약 7분 / 택시 약 3분</p>
                </div>
              </div>

              {/* 주차 안내 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">🅿️</span>
                  <h4 className="font-medium text-xs" style={{ color: '#1A1A1A' }}>주차 안내</h4>
                </div>
                <div className="text-xs leading-relaxed pl-6" style={{ color: '#666' }}>
                  <p className="mb-0.5">지하 2~4층 주차 가능 (200대)</p>
                  <p className="mb-0.5">주차권 2시간 무료 (안내데스크 수령)</p>
                  <p className="text-[10px] mt-1" style={{ color: '#999' }}>주말 혼잡하오니 대중교통 이용을 권장드립니다.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// 결혼식 안내 섹션
function WeddingInfoSection() {
  const { ref, isActive, hasAppeared } = useSectionHighlight('wedding-info');
  const [activeTab, setActiveTab] = useState<'flower' | 'wreath' | 'shuttle'>('flower');

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      className="px-8 py-20 transition-all duration-500 min-h-screen flex flex-col items-center justify-center"
      style={{
        backgroundColor: '#FFFEF8',
        opacity: hasAppeared ? (isActive ? 1 : 0.3) : 0,
        transform: hasAppeared ? 'translateY(0)' : 'translateY(20px)',
        filter: isActive ? 'none' : 'grayscale(30%)',
      }}
    >
      <h2
        className="font-serif text-lg text-center mb-8 tracking-wider transition-colors duration-500"
        style={{ color: isActive ? '#1A1A1A' : '#999' }}
      >
        결혼식 안내
      </h2>

      {/* 탭 버튼 */}
      <div className="flex items-center justify-center gap-2 mb-10">
        <button
          onClick={() => setActiveTab('flower')}
          className="px-4 py-2 text-xs tracking-wide rounded-full transition-all"
          style={{
            backgroundColor: activeTab === 'flower' ? '#C9A962' : '#F5F0EB',
            color: activeTab === 'flower' ? '#fff' : '#666',
          }}
        >
          꽃 답례품
        </button>
        <button
          onClick={() => setActiveTab('wreath')}
          className="px-4 py-2 text-xs tracking-wide rounded-full transition-all"
          style={{
            backgroundColor: activeTab === 'wreath' ? '#C9A962' : '#F5F0EB',
            color: activeTab === 'wreath' ? '#fff' : '#666',
          }}
        >
          화환 안내
        </button>
        <button
          onClick={() => setActiveTab('shuttle')}
          className="px-4 py-2 text-xs tracking-wide rounded-full transition-all"
          style={{
            backgroundColor: activeTab === 'shuttle' ? '#C9A962' : '#F5F0EB',
            color: activeTab === 'shuttle' ? '#fff' : '#666',
          }}
        >
          셔틀버스
        </button>
      </div>

      {/* 탭 내용 */}
      <div className="w-full max-w-[320px] text-center">
        {activeTab === 'flower' && (
          <div className="animate-fade-in">
            <div className="text-3xl mb-6">💐</div>
            <h3
              className="font-serif text-base mb-4 tracking-wide"
              style={{ color: '#1A1A1A' }}
            >
              꽃 답례품 안내
            </h3>
            <p
              className="text-xs leading-[2] whitespace-pre-line"
              style={{ color: '#666' }}
            >
              {`예식 후 하객분들께 감사의 마음을 전하기 위해
계절의 꽃으로 만든 작은 꽃다발을 준비했습니다.
소중한 발걸음에 대한 감사의 선물로 받아주세요.`}
            </p>
          </div>
        )}

        {activeTab === 'wreath' && (
          <div className="animate-fade-in">
            <div className="text-3xl mb-6">🌸</div>
            <h3
              className="font-serif text-base mb-4 tracking-wide"
              style={{ color: '#1A1A1A' }}
            >
              화환 안내
            </h3>
            <p
              className="text-xs leading-[2] whitespace-pre-line"
              style={{ color: '#666' }}
            >
              {`마음만 감사히 받겠습니다.
화환은 정중히 사양하오니
너른 양해 부탁드립니다.`}
            </p>
          </div>
        )}

        {activeTab === 'shuttle' && (
          <div className="animate-fade-in">
            <div className="text-3xl mb-6">🚌</div>
            <h3
              className="font-serif text-base mb-4 tracking-wide"
              style={{ color: '#1A1A1A' }}
            >
              셔틀버스 안내
            </h3>
            <p
              className="text-xs leading-[2] mb-6"
              style={{ color: '#666' }}
            >
              {`예식 당일 셔틀버스가 운행될 예정입니다.
탑승 장소와 시간은 아래 내용을 참고해 주세요.
편안한 이동이 되시길 바랍니다.`}
            </p>

            {/* 셔틀 상세 정보 */}
            <div
              className="text-left p-4 rounded-lg space-y-4"
              style={{ backgroundColor: '#F5F0EB' }}
            >
              <div>
                <p className="text-[10px] mb-1" style={{ color: '#C9A962' }}>[출발 일시]</p>
                <p className="text-xs" style={{ color: '#666' }}>
                  2027년 1월 9일 (토요일)<br />
                  오전 10시 00분 출발
                </p>
              </div>
              <div>
                <p className="text-[10px] mb-1" style={{ color: '#C9A962' }}>[탑승 장소]</p>
                <p className="text-xs" style={{ color: '#666' }}>
                  서울시 강남구 청담역 9번 출구 앞
                </p>
              </div>
              <div>
                <p className="text-[10px] mb-1" style={{ color: '#C9A962' }}>[복귀 일시]</p>
                <p className="text-xs" style={{ color: '#666' }}>
                  예식 종료 후<br />
                  오후 5시 00분 출발 예정
                </p>
              </div>
              <div>
                <p className="text-[10px] mb-1" style={{ color: '#C9A962' }}>[차량 번호]</p>
                <p className="text-xs" style={{ color: '#666' }}>
                  전세버스 1234호
                </p>
              </div>
            </div>

            {/* 안내 사항 */}
            <div
              className="mt-4 p-3 rounded-lg text-left"
              style={{ backgroundColor: '#FDF8F0', border: '1px solid #E8E4DC' }}
            >
              <p className="text-[10px] mb-2 font-medium" style={{ color: '#C9A962' }}>
                안내 사항
              </p>
              <ul className="text-[10px] leading-[1.8] space-y-1" style={{ color: '#888' }}>
                <li>• 원활한 출발을 위해 출발 10분 전까지 도착 부탁드립니다.</li>
                <li>• 정시 출발로, 지각 시 탑승이 어려울 수 있습니다.</li>
                <li>• 복귀 시간은 현장 상황에 따라 변동될 수 있습니다.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// 마음 전하실 곳 섹션
function AccountSection() {
  const { ref, isActive, hasAppeared } = useSectionHighlight('account');

  const accounts = [
    { name: '아버지 이○○', bank: '국민은행', account: '123-45-6789012' },
    { name: '어머니 김○○', bank: '신한은행', account: '110-456-789012' },
    { name: '신부 이서연', bank: '토스뱅크', account: '1000-1234-5678' },
  ];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      className="px-8 py-20 transition-all duration-500 min-h-screen flex flex-col items-center justify-center"
      style={{
        backgroundColor: '#FFFEF8',
        opacity: hasAppeared ? (isActive ? 1 : 0.3) : 0,
        transform: hasAppeared ? 'translateY(0)' : 'translateY(20px)',
        filter: isActive ? 'none' : 'grayscale(30%)',
      }}
    >
      <h2
        className="font-serif text-lg text-center mb-12 tracking-wider transition-colors duration-500"
        style={{ color: isActive ? '#1A1A1A' : '#999' }}
      >
        마음 전하실 곳
      </h2>

      <div className="space-y-3 w-full max-w-[320px]">
        {accounts.map((item) => (
          <button
            key={item.name}
            onClick={() => handleCopy(item.account)}
            className="w-full p-4 rounded-lg border text-left transition-all duration-500 hover:border-[#C9A962]"
            style={{
              borderColor: '#E8E4DC',
              boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
            }}
          >
            <div className="flex justify-between items-center">
              <div>
                <p
                  className="font-serif text-sm mb-1 transition-colors duration-500"
                  style={{ color: isActive ? '#1A1A1A' : '#999' }}
                >
                  {item.name}
                </p>
                <p className="text-xs transition-colors duration-500" style={{ color: isActive ? '#999' : '#bbb' }}>
                  {item.bank} {item.account}
                </p>
              </div>
              <span className="text-xs transition-colors duration-500" style={{ color: isActive ? '#C9A962' : '#D4C9A0' }}>
                복사
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

// 공유하기 섹션
function ShareSection() {
  const { ref, isActive, hasAppeared } = useSectionHighlight('share');

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      className="px-8 py-20 transition-all duration-500 min-h-screen"
      style={{
        backgroundColor: '#FFFEF8',
        opacity: hasAppeared ? (isActive ? 1 : 0.3) : 0,
        transform: hasAppeared ? 'translateY(0)' : 'translateY(20px)',
        filter: isActive ? 'none' : 'grayscale(30%)',
      }}
    >
      <p
        className="text-center text-sm mb-8 tracking-wide transition-colors duration-500"
        style={{ color: isActive ? '#666' : '#aaa' }}
      >
        소중한 분들께 알려주세요
      </p>

      <div className="flex items-center justify-center gap-2">
        <button
          className="px-4 py-2 text-xs tracking-wide rounded-full transition-all hover:bg-[#C9A962] hover:text-white"
          style={{ backgroundColor: '#F5F0EB', color: '#666' }}
        >
          카카오톡
        </button>
        <button
          className="px-4 py-2 text-xs tracking-wide rounded-full transition-all hover:bg-[#C9A962] hover:text-white"
          style={{ backgroundColor: '#F5F0EB', color: '#666' }}
        >
          문자
        </button>
        <button
          className="px-4 py-2 text-xs tracking-wide rounded-full transition-all hover:bg-[#C9A962] hover:text-white"
          style={{ backgroundColor: '#F5F0EB', color: '#666' }}
        >
          링크복사
        </button>
      </div>

      {/* 푸터 */}
      <p
        className="text-center text-xs mt-16"
        style={{ color: '#CCC' }}
      >
        dear drawer
      </p>
    </section>
  );
}

// RSVP 모달 섹션
function RsvpModal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    attendance: 'yes' as 'yes' | 'no' | 'maybe',
    guestCount: 1,
    message: '',
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('참석 의사가 전달되었습니다. 감사합니다!');
  };

  return (
    <div ref={ref} className="min-h-[50vh]" style={{ backgroundColor: '#FFFEF8' }}>
      {/* RSVP 모달 */}
      <div
        className="fixed left-0 right-0 bottom-0 transition-transform duration-700 ease-out"
        style={{
          transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
          maxWidth: '390px',
          margin: '0 auto',
          zIndex: 100,
        }}
      >
        <div
          className="rounded-t-[32px] px-6 pt-8 pb-12"
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow: '0 -8px 30px rgba(0, 0, 0, 0.15)',
          }}
        >
          {/* 핸들 바 */}
          <div
            className="w-12 h-1 rounded-full mx-auto mb-6"
            style={{ backgroundColor: '#E8E4DC' }}
          />

          {/* 제목 */}
          <h3
            className="font-serif text-lg text-center mb-6 tracking-wider"
            style={{ color: '#1A1A1A' }}
          >
            참석 의사 전달
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 이름 */}
            <div>
              <label className="block text-xs mb-2" style={{ color: '#999' }}>
                성함
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="성함을 입력해주세요"
                className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all focus:border-[#722F37]"
                style={{ borderColor: '#E8E4DC', color: '#1A1A1A' }}
              />
            </div>

            {/* 참석 여부 */}
            <div>
              <label className="block text-xs mb-2" style={{ color: '#999' }}>
                참석 여부
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'yes', label: '참석' },
                  { value: 'no', label: '불참' },
                  { value: 'maybe', label: '미정' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, attendance: option.value as 'yes' | 'no' | 'maybe' })}
                    className="flex-1 py-3 rounded-lg border text-sm transition-all"
                    style={{
                      borderColor: formData.attendance === option.value ? '#722F37' : '#E8E4DC',
                      backgroundColor: formData.attendance === option.value ? '#FDF6F7' : '#FFFFFF',
                      color: formData.attendance === option.value ? '#722F37' : '#666',
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 참석 인원 */}
            {formData.attendance === 'yes' && (
              <div>
                <label className="block text-xs mb-2" style={{ color: '#999' }}>
                  참석 인원
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, guestCount: Math.max(1, formData.guestCount - 1) })}
                    className="w-10 h-10 rounded-full border flex items-center justify-center transition-all hover:border-[#722F37]"
                    style={{ borderColor: '#E8E4DC', color: '#666' }}
                  >
                    -
                  </button>
                  <span className="text-lg font-serif" style={{ color: '#1A1A1A' }}>
                    {formData.guestCount}명
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, guestCount: formData.guestCount + 1 })}
                    className="w-10 h-10 rounded-full border flex items-center justify-center transition-all hover:border-[#722F37]"
                    style={{ borderColor: '#E8E4DC', color: '#666' }}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* 메시지 */}
            <div>
              <label className="block text-xs mb-2" style={{ color: '#999' }}>
                축하 메시지 (선택)
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="신랑신부에게 전할 메시지를 남겨주세요"
                rows={3}
                className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all focus:border-[#722F37] resize-none"
                style={{ borderColor: '#E8E4DC', color: '#1A1A1A' }}
              />
            </div>

            {/* 제출 버튼 */}
            <button
              type="submit"
              className="w-full py-4 rounded-lg text-sm tracking-wider transition-all"
              style={{
                backgroundColor: '#722F37',
                color: '#FFFFFF',
              }}
            >
              전달하기
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 메인 페이지
// ============================================
export default function FamilyInvitationPage() {
  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('greeting');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const visibilityRatios = useRef<Map<string, number>>(new Map());

  // 음악 재생/일시정지 토글
  const toggleMusic = async () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          console.error('Audio play failed:', error);
          // 사용자에게 알림 (선택사항)
        }
      }
    }
  };

  // 섹션 가시성 변경 핸들러
  const registerSection = useCallback((id: string, ratio: number) => {
    visibilityRatios.current.set(id, ratio);

    // 가장 높은 가시성 비율을 가진 섹션 찾기
    let maxRatio = 0;
    let maxId = 'greeting';

    visibilityRatios.current.forEach((r, sectionId) => {
      if (r > maxRatio) {
        maxRatio = r;
        maxId = sectionId;
      }
    });

    if (maxRatio > 0) {
      setActiveSection(maxId);
    }
  }, []);

  return (
    <div
      className="max-w-[390px] mx-auto min-h-screen"
      style={{ backgroundColor: '#FFFEF8' }}
    >
      {/* 봉투 화면 */}
      {!isEnvelopeOpen && (
        <EnvelopeScreen
          recipientName="김영희"
          recipientTitle="님께"
          onOpen={() => setIsEnvelopeOpen(true)}
        />
      )}

      {/* 본문 */}
      {isEnvelopeOpen && (
        <SectionHighlightContext.Provider value={{ activeSection, registerSection }}>
          {/* 버건디 라운드 테두리 프레임 */}
          <div
            style={{
              position: 'fixed',
              inset: '8px',
              border: '2px solid #722F37',
              borderRadius: '32px',
              pointerEvents: 'none',
              zIndex: 9999,
              boxShadow: '0 0 0 100px #722F37',
            }}
          />
          <main className="animate-fade-in">
            <GreetingSection />
            <SectionDivider />
            <TimelineSection />
            <SectionDivider />
            <MainPhotoSection />
            <SectionDivider />
            <DateSection />
            <SectionDivider />
            <VenueSection />
            <SectionDivider />
            <WeddingInfoSection />
            <SectionDivider />
            <AccountSection />
            <SectionDivider />
            <ShareSection />
            <RsvpModal />
          </main>
        </SectionHighlightContext.Provider>
      )}

      {/* 배경 음악 - 컨테이너 외부에 배치 */}
      {isEnvelopeOpen && (
        <>
          <audio
            ref={audioRef}
            loop
            preload="auto"
          >
            <source src="/samples/parents/wedding-bgm.mp3" type="audio/mpeg" />
          </audio>

          {/* 음악 재생 버튼 - 뷰포트 기준 고정 */}
          <button
            onClick={toggleMusic}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              zIndex: 99999,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            }}
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="#722F37" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="#722F37" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </>
      )}
    </div>
  );
}
