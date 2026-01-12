'use client'

import { useState, useEffect, useRef } from 'react'
import { IntroSettings } from '@/lib/introPresets'
import { X } from 'lucide-react'

interface IntroPreviewProps {
  settings: IntroSettings
  coverImage?: string
  onSkip?: () => void
  autoPlay?: boolean
}

export default function IntroPreview({ settings, coverImage, onSkip, autoPlay = true }: IntroPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [key, setKey] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // 자동 재생
  useEffect(() => {
    if (autoPlay) {
      setIsPlaying(true)
      setKey(k => k + 1)
    }
  }, [settings.presetId, autoPlay])

  // backgroundScale을 cover 기반 줌으로 계산 (100 = cover, 150 = 줌인)
  const scale = settings.backgroundScale || 100
  // 세로 위치: 50(이전 기본값)이면 0(상단)으로 처리
  const posY = settings.backgroundPositionY === 50 ? 0 : (settings.backgroundPositionY ?? 0)
  const backgroundStyle = {
    backgroundImage: coverImage ? `url(${coverImage})` : 'linear-gradient(135deg, #333 0%, #111 100%)',
    backgroundSize: scale > 100 ? `${scale}%` : 'cover',
    backgroundPosition: `${settings.backgroundPositionX ?? 50}% ${posY}%`,
    backgroundRepeat: 'no-repeat',
    filter: `brightness(${settings.backgroundBrightness / 100})`,
  }

  const overlayStyle = {
    backgroundColor: `rgba(0, 0, 0, ${settings.overlayOpacity / 100})`,
  }

  const titleStyle = {
    fontSize: `${settings.titleFontSize}px`,
    letterSpacing: `${settings.titleLetterSpacing}px`,
    color: settings.titleColor,
  }

  const subTitleStyle = {
    color: settings.subTitleColor,
  }

  // 프리셋별 렌더링
  const renderIntro = () => {
    switch (settings.presetId) {
      case 'cinematic':
        return <CinematicIntro key={key} settings={settings} backgroundStyle={backgroundStyle} overlayStyle={overlayStyle} titleStyle={titleStyle} subTitleStyle={subTitleStyle} />
      case 'typing':
        return <TypingIntro key={key} settings={settings} backgroundStyle={backgroundStyle} overlayStyle={overlayStyle} titleStyle={titleStyle} subTitleStyle={subTitleStyle} />
      case 'blur':
        return <BlurIntro key={key} settings={settings} backgroundStyle={backgroundStyle} overlayStyle={overlayStyle} titleStyle={titleStyle} subTitleStyle={subTitleStyle} />
      case 'zoom':
        return <ZoomIntro key={key} settings={settings} backgroundStyle={backgroundStyle} overlayStyle={overlayStyle} titleStyle={titleStyle} subTitleStyle={subTitleStyle} />
      case 'bokeh':
        return <BokehIntro key={key} settings={settings} backgroundStyle={backgroundStyle} overlayStyle={overlayStyle} titleStyle={titleStyle} subTitleStyle={subTitleStyle} />
      case 'letter':
        return <LetterIntro key={key} settings={settings} backgroundStyle={backgroundStyle} titleStyle={titleStyle} />
      case 'petal':
        return <PetalIntro key={key} settings={settings} backgroundStyle={backgroundStyle} overlayStyle={overlayStyle} titleStyle={titleStyle} subTitleStyle={subTitleStyle} />
      case 'watercolor':
        return <WatercolorIntro key={key} settings={settings} backgroundStyle={backgroundStyle} titleStyle={titleStyle} subTitleStyle={subTitleStyle} />
      case 'lightray':
        return <LightrayIntro key={key} settings={settings} backgroundStyle={backgroundStyle} overlayStyle={overlayStyle} titleStyle={titleStyle} subTitleStyle={subTitleStyle} />
      case 'film':
        return <FilmIntro key={key} settings={settings} backgroundStyle={backgroundStyle} titleStyle={titleStyle} subTitleStyle={subTitleStyle} />
      case 'ripple':
        return <RippleIntro key={key} settings={settings} backgroundStyle={backgroundStyle} titleStyle={titleStyle} subTitleStyle={subTitleStyle} />
      case 'gold':
        return <GoldIntro key={key} settings={settings} backgroundStyle={backgroundStyle} overlayStyle={overlayStyle} titleStyle={titleStyle} subTitleStyle={subTitleStyle} />
      case 'focus':
        return <FocusIntro key={key} settings={settings} backgroundStyle={backgroundStyle} overlayStyle={overlayStyle} titleStyle={titleStyle} subTitleStyle={subTitleStyle} />
      default:
        return <CinematicIntro key={key} settings={settings} backgroundStyle={backgroundStyle} overlayStyle={overlayStyle} titleStyle={titleStyle} subTitleStyle={subTitleStyle} />
    }
  }

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-black">
      <style jsx global>{`
        @keyframes introFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes introSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes introZoomOut {
          from { transform: scale(1.1); }
          to { transform: scale(1); }
        }
        @keyframes introBlurToSharp {
          from { filter: blur(10px); opacity: 0; }
          to { filter: blur(0); opacity: 1; }
        }
        @keyframes introLetterSpread {
          from { opacity: 0; letter-spacing: 6px; }
          to { opacity: 1; letter-spacing: 3px; }
        }
        @keyframes introLineExpand {
          from { width: 0; }
          to { width: 50px; }
        }
        @keyframes introTyping {
          from { width: 0; }
          to { width: 100%; }
        }
        @keyframes introBlink {
          50% { opacity: 0; }
        }
        @keyframes introFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes introParticle {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        @keyframes introGlow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        .intro-fade-in { animation: introFadeIn 1s ease-out forwards; }
        .intro-fade-in-delay { animation: introFadeIn 1s ease-out 0.5s forwards; opacity: 0; }
        .intro-slide-up { animation: introSlideUp 0.8s ease-out forwards; }
        .intro-slide-up-delay { animation: introSlideUp 0.8s ease-out 0.3s forwards; opacity: 0; }
        .intro-zoom-out { animation: introZoomOut 2.5s ease-out forwards; }
        .intro-blur-to-sharp { animation: introBlurToSharp 2s ease-out forwards; }
        .intro-letter-spread { animation: introLetterSpread 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.15s forwards; opacity: 0; }
        .intro-line-expand { animation: introLineExpand 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
        .intro-float { animation: introFloat 2s ease-in-out infinite; }
      `}</style>

      {renderIntro()}

      {/* 스킵 버튼 */}
      {onSkip && (
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 z-50 flex items-center gap-1 px-3 py-1.5 bg-black/30 hover:bg-black/50 text-white/80 text-xs rounded-full backdrop-blur-sm transition-colors"
        >
          <X className="w-3 h-3" />
          건너뛰기
        </button>
      )}
    </div>
  )
}

// 시네마틱 인트로
function CinematicIntro({ settings, backgroundStyle, overlayStyle, titleStyle }: {
  settings: IntroSettings
  backgroundStyle: React.CSSProperties
  overlayStyle: React.CSSProperties
  titleStyle: React.CSSProperties
  subTitleStyle: React.CSSProperties
}) {
  return (
    <div className="relative h-full">
      <div className="absolute inset-0 intro-fade-in intro-zoom-out" style={{ ...backgroundStyle, filter: `${backgroundStyle.filter} grayscale(100%)` }} />
      <div className="absolute inset-0" style={overlayStyle} />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        <div className="intro-line-expand h-px bg-white/50 mb-5" />
        <p className="intro-letter-spread uppercase whitespace-nowrap" style={{ ...titleStyle, fontFamily: "'Cormorant Garamond', serif" }}>
          {settings.mainTitle || 'Welcome to our wedding'}
        </p>
        {settings.dateText && (
          <p className="text-xs mt-3.5 intro-fade-in-delay" style={{ color: 'rgba(255,255,255,0.6)', letterSpacing: '2px', fontFamily: "'Cormorant Garamond', serif" }}>
            {settings.dateText}
          </p>
        )}
      </div>
    </div>
  )
}

// 타이핑 인트로
function TypingIntro({ settings, backgroundStyle, overlayStyle, titleStyle, subTitleStyle }: {
  settings: IntroSettings
  backgroundStyle: React.CSSProperties
  overlayStyle: React.CSSProperties
  titleStyle: React.CSSProperties
  subTitleStyle: React.CSSProperties
}) {
  const [displayText, setDisplayText] = useState('')
  const fullText = settings.mainTitle || '소중한 분들을 초대합니다'

  useEffect(() => {
    let index = 0
    const timer = setInterval(() => {
      if (index <= fullText.length) {
        setDisplayText(fullText.slice(0, index))
        index++
      } else {
        clearInterval(timer)
      }
    }, 100)
    return () => clearInterval(timer)
  }, [fullText])

  return (
    <div className="relative h-full">
      <div className="absolute inset-0 intro-fade-in" style={backgroundStyle} />
      <div className="absolute inset-0" style={overlayStyle} />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        {settings.subTitle && (
          <p className="text-xs tracking-[6px] mb-6 intro-slide-up" style={subTitleStyle}>
            {settings.subTitle}
          </p>
        )}
        <p className="text-xl mb-2" style={titleStyle}>
          {displayText}
          <span className="animate-pulse">|</span>
        </p>
        <div className="w-20 h-px bg-white/50 my-6 intro-line-expand" style={{ animationDelay: '2.8s' }} />
        {settings.dateText && (
          <p className="text-sm intro-slide-up-delay" style={{ ...subTitleStyle, animationDelay: '3.2s' }}>
            {settings.dateText}
          </p>
        )}
        {settings.venueText && (
          <p className="text-xs mt-2 intro-slide-up-delay" style={{ ...subTitleStyle, opacity: 0.7, animationDelay: '3.5s' }}>
            {settings.venueText}
          </p>
        )}
      </div>
    </div>
  )
}

// 블러 인트로
function BlurIntro({ settings, backgroundStyle, overlayStyle, titleStyle, subTitleStyle }: {
  settings: IntroSettings
  backgroundStyle: React.CSSProperties
  overlayStyle: React.CSSProperties
  titleStyle: React.CSSProperties
  subTitleStyle: React.CSSProperties
}) {
  return (
    <div className="relative h-full">
      <div className="absolute inset-0 intro-blur-to-sharp" style={backgroundStyle} />
      <div className="absolute inset-0" style={overlayStyle} />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        {settings.subTitle && (
          <p className="text-xs tracking-[8px] mb-4 intro-fade-in-delay" style={{ ...subTitleStyle, animationDelay: '1.5s' }}>
            {settings.subTitle}
          </p>
        )}
        <p className="text-2xl font-serif intro-fade-in-delay" style={{ ...titleStyle, animationDelay: '2s' }}>
          {settings.mainTitle || '우리 결혼합니다'}
        </p>
        <div className="w-16 h-px bg-white/50 my-6 intro-line-expand" style={{ animationDelay: '2.5s' }} />
        {settings.dateText && (
          <p className="text-sm intro-fade-in-delay" style={{ ...subTitleStyle, animationDelay: '2.8s' }}>
            {settings.dateText}
          </p>
        )}
      </div>
    </div>
  )
}

// 줌 인트로
function ZoomIntro({ settings, backgroundStyle, overlayStyle, titleStyle, subTitleStyle }: {
  settings: IntroSettings
  backgroundStyle: React.CSSProperties
  overlayStyle: React.CSSProperties
  titleStyle: React.CSSProperties
  subTitleStyle: React.CSSProperties
}) {
  return (
    <div className="relative h-full overflow-hidden">
      <div className="absolute inset-0 intro-zoom-out" style={{ ...backgroundStyle, animationDuration: '8s' }} />
      <div className="absolute inset-0" style={overlayStyle} />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        {settings.subTitle && (
          <p className="text-xs tracking-[6px] mb-4 intro-slide-up" style={subTitleStyle}>
            {settings.subTitle}
          </p>
        )}
        <p className="text-2xl font-serif intro-slide-up-delay" style={titleStyle}>
          {settings.mainTitle || '평생을 약속합니다'}
        </p>
        <div className="w-20 h-px bg-white/50 my-6 intro-line-expand" style={{ animationDelay: '1s' }} />
        {settings.dateText && (
          <p className="text-sm intro-slide-up-delay" style={{ ...subTitleStyle, animationDelay: '1.5s' }}>
            {settings.dateText}
          </p>
        )}
      </div>
    </div>
  )
}

// 보케 인트로
function BokehIntro({ settings, backgroundStyle, overlayStyle, titleStyle, subTitleStyle }: {
  settings: IntroSettings
  backgroundStyle: React.CSSProperties
  overlayStyle: React.CSSProperties
  titleStyle: React.CSSProperties
  subTitleStyle: React.CSSProperties
}) {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 30 + 10,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.5 + 0.1,
  }))

  return (
    <div className="relative h-full overflow-hidden">
      <div className="absolute inset-0 intro-fade-in" style={backgroundStyle} />
      <div className="absolute inset-0" style={overlayStyle} />
      {/* 보케 파티클 */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full intro-float"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.left}%`,
              top: `${p.top}%`,
              animationDelay: `${p.delay}s`,
              opacity: p.opacity,
              background: 'radial-gradient(circle at 30% 30%, rgba(255,250,240,0.9), rgba(255,215,180,0.4))',
            }}
          />
        ))}
      </div>
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        {settings.subTitle && (
          <p className="text-xs tracking-[6px] mb-4 intro-slide-up" style={subTitleStyle}>
            {settings.subTitle}
          </p>
        )}
        <p className="text-xl font-serif intro-slide-up-delay" style={titleStyle}>
          {settings.mainTitle || '두 사람이 하나 되는 날'}
        </p>
        <div className="w-20 h-px bg-white/50 my-6 intro-line-expand" />
        {settings.dateText && (
          <p className="text-sm intro-fade-in-delay" style={subTitleStyle}>
            {settings.dateText}
          </p>
        )}
      </div>
    </div>
  )
}

// 편지 인트로
function LetterIntro({ settings, backgroundStyle, titleStyle }: {
  settings: IntroSettings
  backgroundStyle: React.CSSProperties
  titleStyle: React.CSSProperties
}) {
  return (
    <div className="relative h-full flex items-center justify-center">
      <div className="absolute inset-0" style={{ ...backgroundStyle, filter: 'grayscale(100%) brightness(0.4)' }} />
      <div className="relative w-[280px] h-[360px] bg-white rounded-lg shadow-2xl flex flex-col items-center justify-center p-6 text-center intro-slide-up">
        <p className="text-[11px] text-gray-400 tracking-[4px] mb-2">
          {settings.subTitle || 'WEDDING INVITATION'}
        </p>
        <p className="text-2xl mb-4" style={{ ...titleStyle, color: titleStyle.color === '#ffffff' ? '#4a4a4a' : titleStyle.color }}>
          {settings.mainTitle || '우리 결혼합니다'}
        </p>
        <div className="w-12 h-px bg-[#d4a574] mb-4" />
        {settings.dateText && (
          <p className="text-lg text-gray-600">{settings.dateText}</p>
        )}
        {settings.venueText && (
          <p className="text-xs text-gray-400 mt-4">{settings.venueText}</p>
        )}
      </div>
    </div>
  )
}

// 꽃잎 인트로
function PetalIntro({ settings, backgroundStyle, overlayStyle, titleStyle, subTitleStyle }: {
  settings: IntroSettings
  backgroundStyle: React.CSSProperties
  overlayStyle: React.CSSProperties
  titleStyle: React.CSSProperties
  subTitleStyle: React.CSSProperties
}) {
  const petals = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 5,
    size: Math.random() * 15 + 10,
  }))

  return (
    <div className="relative h-full overflow-hidden">
      <div className="absolute inset-0 intro-fade-in" style={backgroundStyle} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#fff5f5]/70 to-[#ffe4e6]/80" />
      {/* 꽃잎 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {petals.map((p) => (
          <div
            key={p.id}
            className="absolute"
            style={{
              left: `${p.left}%`,
              top: '-20px',
              width: p.size,
              height: p.size,
              background: 'linear-gradient(135deg, rgba(255,182,193,0.9), rgba(255,192,203,0.5))',
              borderRadius: '50% 0 50% 50%',
              animation: `introParticle ${8 + Math.random() * 5}s linear ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        {settings.subTitle && (
          <p className="text-xs tracking-[6px] mb-4 intro-slide-up" style={{ color: '#f472b6' }}>
            {settings.subTitle}
          </p>
        )}
        <p className="text-xl font-serif intro-slide-up-delay" style={{ ...titleStyle, color: '#374151' }}>
          {settings.mainTitle || '꽃잎처럼 아름다운 날'}
        </p>
        <div className="w-20 h-px bg-pink-300 my-6 intro-line-expand" />
        {settings.dateText && (
          <p className="text-xs text-gray-400 intro-fade-in-delay">{settings.dateText}</p>
        )}
      </div>
    </div>
  )
}

// 수채화 인트로
function WatercolorIntro({ settings, backgroundStyle, titleStyle, subTitleStyle }: {
  settings: IntroSettings
  backgroundStyle: React.CSSProperties
  titleStyle: React.CSSProperties
  subTitleStyle: React.CSSProperties
}) {
  return (
    <div className="relative h-full overflow-hidden">
      <div className="absolute inset-0 intro-fade-in" style={backgroundStyle} />
      <div className="absolute inset-0 bg-white/60" />
      {/* 수채화 효과 */}
      <div className="absolute inset-0">
        <div className="absolute inset-[-20%] opacity-30 intro-fade-in" style={{ background: 'radial-gradient(ellipse at 30% 30%, #e0f2fe, #bae6fd, #7dd3fc, transparent 70%)', animationDelay: '0.5s' }} />
        <div className="absolute inset-[-10%] opacity-40 intro-fade-in" style={{ background: 'radial-gradient(ellipse at 70% 60%, #fce7f3, #fbcfe8, #f9a8d4, transparent 60%)', animationDelay: '1s' }} />
      </div>
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        {settings.subTitle && (
          <p className="text-2xl font-serif intro-slide-up" style={{ ...titleStyle, color: '#374151' }}>
            {settings.subTitle}
          </p>
        )}
        <p className="text-base mt-1 intro-slide-up-delay" style={{ color: '#374151' }}>
          {settings.mainTitle || '우리의 새로운 이야기가 시작됩니다'}
        </p>
        <div className="w-16 h-px bg-cyan-400/50 my-6 intro-line-expand" />
      </div>
    </div>
  )
}

// 빛의 커튼 인트로
function LightrayIntro({ settings, backgroundStyle, overlayStyle, titleStyle, subTitleStyle }: {
  settings: IntroSettings
  backgroundStyle: React.CSSProperties
  overlayStyle: React.CSSProperties
  titleStyle: React.CSSProperties
  subTitleStyle: React.CSSProperties
}) {
  return (
    <div className="relative h-full overflow-hidden">
      <div className="absolute inset-0 intro-fade-in" style={backgroundStyle} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
      {/* 빛 광선 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 left-1/2 h-full intro-fade-in"
            style={{
              width: '2px',
              background: 'linear-gradient(to bottom, rgba(255,215,0,0.3), transparent)',
              transform: `rotate(${i * 15 - 40}deg)`,
              transformOrigin: 'top center',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        {settings.subTitle && (
          <p className="text-xs tracking-[6px] mb-4 intro-slide-up" style={{ color: 'rgba(253,230,138,0.6)' }}>
            {settings.subTitle}
          </p>
        )}
        <p className="text-2xl font-serif intro-slide-up-delay" style={titleStyle}>
          {settings.mainTitle || '영원을 약속하는 날'}
        </p>
        <div className="w-20 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent my-6 intro-line-expand" />
      </div>
    </div>
  )
}

// 필름 인트로
function FilmIntro({ settings, backgroundStyle, titleStyle, subTitleStyle }: {
  settings: IntroSettings
  backgroundStyle: React.CSSProperties
  titleStyle: React.CSSProperties
  subTitleStyle: React.CSSProperties
}) {
  return (
    <div className="relative h-full overflow-hidden">
      <div className="absolute inset-0 intro-fade-in" style={{ ...backgroundStyle, filter: `${backgroundStyle.filter} sepia(50%)` }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.5) 100%)' }} />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        {settings.subTitle && (
          <p className="text-xs tracking-[6px] mb-4 intro-blur-to-sharp" style={{ color: 'rgba(254,243,199,0.8)', fontFamily: 'serif' }}>
            {settings.subTitle}
          </p>
        )}
        <p className="text-2xl font-serif intro-blur-to-sharp" style={{ ...titleStyle, color: '#fef3c7', animationDelay: '1s' }}>
          {settings.mainTitle || '우리의 순간에 초대합니다'}
        </p>
        <div className="w-16 h-px bg-amber-200/50 my-6 intro-line-expand" style={{ animationDelay: '2s' }} />
      </div>
    </div>
  )
}

// 물결 인트로
function RippleIntro({ settings, backgroundStyle, titleStyle, subTitleStyle }: {
  settings: IntroSettings
  backgroundStyle: React.CSSProperties
  titleStyle: React.CSSProperties
  subTitleStyle: React.CSSProperties
}) {
  // 물결 효과를 위해 상단/하단 위치만 조정하되 사용자 설정 반영
  const topBgStyle = { ...backgroundStyle }
  const bottomBgStyle = { ...backgroundStyle, transform: 'scaleY(-1)', opacity: 0.6 }

  return (
    <div className="relative h-full flex flex-col">
      <div className="relative h-1/2">
        <div className="absolute inset-0 intro-fade-in" style={topBgStyle} />
      </div>
      <div className="relative h-1/2 overflow-hidden">
        <div className="absolute inset-0" style={bottomBgStyle} />
        <div className="absolute inset-0 bg-gradient-to-b from-sky-900/30 to-sky-950/50" />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-10">
        <div className="bg-black/30 backdrop-blur-sm px-8 py-6 rounded-lg intro-slide-up">
          {settings.subTitle && (
            <p className="text-[10px] tracking-[4px] mb-3" style={{ color: 'rgba(186,230,253,0.8)' }}>
              {settings.subTitle}
            </p>
          )}
          <p className="text-lg font-serif" style={titleStyle}>
            {settings.mainTitle || '두 사람이 하나가 되는 순간'}
          </p>
          <div className="w-12 h-px bg-sky-200/50 mx-auto my-3 intro-line-expand" />
        </div>
      </div>
    </div>
  )
}

// 골드 인트로
function GoldIntro({ settings, backgroundStyle, overlayStyle, titleStyle, subTitleStyle }: {
  settings: IntroSettings
  backgroundStyle: React.CSSProperties
  overlayStyle: React.CSSProperties
  titleStyle: React.CSSProperties
  subTitleStyle: React.CSSProperties
}) {
  const goldColors = ['#C9A24D', '#E6C87A', '#B08D3A']
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    left: 5 + Math.random() * 90,
    top: 5 + Math.random() * 90,
    delay: Math.random() * 2,
    opacity: 0.2 + Math.random() * 0.6,
    color: goldColors[Math.floor(Math.random() * 3)],
  }))

  return (
    <div className="relative h-full overflow-hidden">
      <div className="absolute inset-0 intro-fade-in" style={backgroundStyle} />
      <div className="absolute inset-0 bg-black/60" />
      {/* 골드 파티클 */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full intro-float"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.left}%`,
              top: `${p.top}%`,
              animationDelay: `${p.delay}s`,
              opacity: p.opacity,
              background: `radial-gradient(circle, ${p.color}, transparent)`,
            }}
          />
        ))}
      </div>
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        {settings.subTitle && (
          <p className="text-xs tracking-[6px] mb-4 intro-slide-up" style={{ color: 'rgba(251,191,36,0.6)' }}>
            {settings.subTitle}
          </p>
        )}
        <p className="text-2xl font-serif intro-slide-up-delay" style={{ ...titleStyle, color: '#fef3c7' }}>
          {settings.mainTitle || '소중한 날에 초대합니다'}
        </p>
        <div className="w-20 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent my-6 intro-line-expand" />
        {settings.dateText && (
          <p className="text-sm intro-fade-in-delay" style={{ color: 'rgba(253,230,138,0.6)' }}>
            {settings.dateText}
          </p>
        )}
        {settings.venueText && (
          <p className="text-xs mt-2 intro-fade-in-delay" style={{ color: 'rgba(253,230,138,0.4)', animationDelay: '0.5s' }}>
            {settings.venueText}
          </p>
        )}
      </div>
    </div>
  )
}

// 포커스 인트로
function FocusIntro({ settings, backgroundStyle, overlayStyle, titleStyle, subTitleStyle }: {
  settings: IntroSettings
  backgroundStyle: React.CSSProperties
  overlayStyle: React.CSSProperties
  titleStyle: React.CSSProperties
  subTitleStyle: React.CSSProperties
}) {
  return (
    <div className="relative h-full overflow-hidden">
      <div className="absolute inset-0" style={{ ...backgroundStyle, filter: 'blur(15px)' }} />
      <div className="absolute inset-0 intro-blur-to-sharp" style={backgroundStyle} />
      <div className="absolute inset-0" style={overlayStyle} />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        {settings.subTitle && (
          <p className="text-xs tracking-[6px] mb-4 intro-letter-spread" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {settings.subTitle}
          </p>
        )}
        <p className="text-2xl font-serif intro-slide-up-delay" style={titleStyle}>
          {settings.mainTitle || '두 사람의 이야기'}
        </p>
        <div className="w-16 h-px bg-white/50 my-6 intro-line-expand" />
      </div>
    </div>
  )
}
