'use client'

import { useState, useCallback, useEffect } from 'react'

interface EnvelopeScreenProps {
  recipientName: string
  recipientTitle?: string
  recipientRelation?: string  // 관계 (예: 이모, 삼촌)
  greetingTo?: string
  message?: string[]
  signature?: string
  onOpen: () => void
  isPreview?: boolean
  themeColor?: string  // 메인 테마 컬러
  accentColor?: string // 포인트 컬러
  fontClassName?: string // 폰트 클래스
  fontFamily?: string // 폰트 패밀리 CSS 값
}

export default function EnvelopeScreen({
  recipientName,
  recipientTitle = '님께',
  recipientRelation,
  greetingTo,
  message = ['항상 저희 가족', '챙겨주셔서 감사합니다', '', '서연이가 좋은 사람 만나', '결혼하게 되었습니다', '', '꼭 오셔서', '축복해 주세요'],
  signature = '아버지 이○○ · 어머니 김○○ 드림',
  onOpen,
  isPreview = false,
  themeColor = '#722F37',
  accentColor = '#C9A962',
  fontClassName = '',
  fontFamily = '',
}: EnvelopeScreenProps) {
  const [stage, setStage] = useState(0)
  const [isExtracted, setIsExtracted] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // 마운트 후 컴포넌트 표시 (CSS 로딩 전 깜빡임 방지)
  useEffect(() => {
    // 두 프레임 대기 후 표시 (CSS 완전 적용 보장)
    const timer = setTimeout(() => {
      setIsMounted(true)
    }, 50)
    return () => clearTimeout(timer)
  }, [])

  // 에디터에서 게스트가 변경되면 애니메이션 리셋
  useEffect(() => {
    if (isPreview) {
      setStage(0)
      setIsExtracted(false)
      setIsHidden(false)
    }
  }, [recipientName, recipientRelation, isPreview])

  // 관계가 있으면 "이름 관계 호칭" 형식, 없으면 "이름 호칭" 형식
  const displayGreetingTo = greetingTo || (recipientRelation
    ? `${recipientName} ${recipientRelation} ${recipientTitle}`
    : `${recipientName} ${recipientTitle}`)

  const handleClick = useCallback(() => {
    if (stage === 0) {
      // 1단계: 뒤집기
      setStage(1)

      // 뒤집은 후 자동으로 열기 시작
      setTimeout(() => {
        setStage(2)

        // 편지지 꺼내기
        setTimeout(() => {
          setIsExtracted(true)
          setStage(3)
          // 자동 전환 제거 - 클릭해야만 본문으로 이동
        }, 1000)
      }, 800)
    } else if (stage === 3 && isExtracted) {
      // 편지가 나온 상태에서 클릭하면 바로 본문으로 전환
      onOpen()
    }
  }, [stage, isExtracted, onOpen, isPreview])

  return (
    <div
      className={`${isPreview ? 'absolute' : 'fixed'} inset-0 z-50 flex flex-col items-center justify-center ${fontClassName}`}
      style={{
        backgroundColor: themeColor,
        '--accent-color': accentColor,
        '--envelope-font': fontFamily,
        fontFamily: fontFamily || 'inherit',
        opacity: isMounted ? 1 : 0,
        transition: 'opacity 0.15s ease-in',
        cursor: 'pointer',
      } as React.CSSProperties}
      onClick={handleClick}
    >
      <style jsx>{`
        .envelope-wrapper {
          perspective: 1500px;
          height: auto;
          display: flex;
          justify-content: center;
          align-items: center;
          padding-top: 40px;
          padding-bottom: 20px;
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
          font-family: var(--envelope-font), serif;
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
          font-family: var(--envelope-font), serif;
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
          border: 1.5px solid var(--accent-color);
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

      <div className="envelope-wrapper" onClick={handleClick} style={{ perspective: '1500px' }}>
        <div
          className={`envelope-container ${stage >= 1 ? 'flipped' : ''}`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* 봉투 앞면 - 인라인 스타일로 backface-visibility 즉시 적용 */}
          <div
            className="envelope-front"
            style={{
              opacity: isHidden ? 0 : 1,
              transition: 'opacity 0.6s ease',
              backfaceVisibility: 'hidden',
            }}
          >
            <div className="h-px w-[60px] my-4" style={{ backgroundColor: accentColor }} />
            {recipientRelation && (
              <p className="text-[14px] mb-1" style={{ color: '#666' }}>
                {recipientRelation}
              </p>
            )}
            <p className="text-[22px]" style={{ color: '#2C2C2C' }}>
              {recipientName} {recipientTitle}
            </p>
            <div className="h-px w-[60px] my-4" style={{ backgroundColor: accentColor }} />
          </div>

          {/* 봉투 뒷면 - 인라인 스타일로 backface-visibility 즉시 적용 */}
          <div
            className={`envelope-back ${stage >= 2 && !isExtracted ? 'open' : ''} ${isExtracted ? 'extracted' : ''}`}
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="sealing-wax" style={{ opacity: isHidden ? 0 : 1, transition: 'opacity 0.6s ease' }}>
              <img src="/images/shilling2.png" alt="seal" />
            </div>

            <div className="front flap" style={{ opacity: isHidden ? 0 : 1, transition: 'opacity 0.6s ease' }}></div>
            <div className="front pocket" style={{ opacity: isHidden ? 0 : 1, transition: 'opacity 0.6s ease' }}></div>

            <div
              className="letter"
              onClick={(e) => {
                if (stage === 3 && isExtracted) {
                  e.stopPropagation()
                  onOpen()
                }
              }}
              style={{ cursor: stage === 3 ? 'pointer' : 'default' }}
            >
              <div className="relative z-10">
                <p className="text-[10px] tracking-[2px] mb-4" style={{ color: accentColor }}>
                  WEDDING INVITATION
                </p>
                <div className="h-px w-[40px] mx-auto mb-4" style={{ backgroundColor: accentColor }} />
                <p
                  className="text-[16px] mb-4"
                  style={{ color: '#2C2C2C' }}
                >
                  {displayGreetingTo}
                </p>
                <div className="text-[12px] leading-[1.5] mb-4" style={{ color: '#555' }}>
                  {message.map((line, i) => (
                    <p key={i} style={{ marginTop: line === '' ? '6px' : '0' }}>
                      {line || '\u00A0'}
                    </p>
                  ))}
                </div>
                <div className="h-px w-[40px] mx-auto mb-3" style={{ backgroundColor: accentColor }} />
                <p className="text-[11px]" style={{ color: '#888' }}>
                  {signature}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 안내 문구 - 봉투 바로 아래, 시각적으로 연결 */}
      <div
        className="hint text-center"
        style={{
          cursor: 'pointer',
          marginTop: '24px',
          marginBottom: '60px',
        }}
      >
        <p
          className="text-[14px] leading-relaxed px-4"
          style={{
            color: 'rgba(255,255,255,0.95)',
            textShadow: '0 1px 3px rgba(0,0,0,0.3)',
            fontWeight: 300,
            letterSpacing: '0.5px',
          }}
        >
          {stage === 0 ? (
            <>
              편지가 도착했어요.<br />
              클릭하여 편지를 열어주세요.
            </>
          ) : stage === 3 ? (
            '클릭하여 청첩장 보기'
          ) : ''}
        </p>
      </div>
    </div>
  )
}
