'use client'

import { useState, useEffect, useRef } from 'react'

// 타이핑 텍스트 컴포넌트
function TypingText({ text, delay = 0, speed = 100, hideCursorOnComplete = true }: { text: string; delay?: number; speed?: number; hideCursorOnComplete?: boolean }) {
  const [displayText, setDisplayText] = useState('')
  const [started, setStarted] = useState(false)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    const startTimer = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(startTimer)
  }, [delay])

  useEffect(() => {
    if (!started) return
    let index = 0
    setDisplayText(text.slice(0, 1)) // 첫 글자 바로 표시
    index = 1

    const timer = setInterval(() => {
      if (index < text.length) {
        index++
        setDisplayText(text.slice(0, index))
      } else {
        clearInterval(timer)
        if (hideCursorOnComplete) {
          setTimeout(() => setCompleted(true), 300)
        }
      }
    }, speed)
    return () => clearInterval(timer)
  }, [started, text, speed, hideCursorOnComplete])

  return (
    <span className="typing-text">
      {displayText}
      {started && !completed && <span className="typing-cursor">|</span>}
    </span>
  )
}

// 보케(빛 입자) 컴포넌트
function BokehParticles({ count = 20, color = 'warm' }: { count?: number; color?: 'warm' | 'gold' | 'white' }) {
  const colors = {
    warm: 'rgba(255, 215, 180, 0.4)',
    gold: 'rgba(255, 215, 0, 0.5)',
    white: 'rgba(255, 255, 255, 0.4)',
  }
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.random() * 30 + 10,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 5,
    duration: Math.random() * 10 + 10,
    opacity: Math.random() * 0.5 + 0.1,
  }))

  return (
    <div className="bokeh-container">
      {particles.map((p) => (
        <div
          key={p.id}
          className="bokeh-particle"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            top: `${p.top}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            opacity: p.opacity,
            background: `radial-gradient(circle at 30% 30%, rgba(255, 250, 240, 0.9), ${colors[color]})`,
          }}
        />
      ))}
    </div>
  )
}

// 꽃잎 컴포넌트
function FallingPetals({ count = 20 }: { count?: number }) {
  const petals = Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 5,
    duration: Math.random() * 5 + 8,
    size: Math.random() * 15 + 10,
    rotation: Math.random() * 360,
  }))

  return (
    <div className="petals-container">
      {petals.map((p) => (
        <div
          key={p.id}
          className="petal"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            width: p.size,
            height: p.size,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  )
}

// 골드 파티클 컴포넌트
function GoldParticles({ count = 50 }: { count?: number }) {
  // 골드 색상 팔레트 (미세한 차이)
  const goldColors = ['#C9A24D', '#E6C87A', '#B08D3A']

  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,           // 2~6px
    left: 5 + Math.random() * 90,
    top: 5 + Math.random() * 90,
    delay: Math.random() * 2,
    targetX: (Math.random() - 0.5) * 50,
    targetY: (Math.random() - 0.5) * 50,
    opacity: 0.2 + Math.random() * 0.6,    // 0.2~0.8
    color: goldColors[Math.floor(Math.random() * 3)],  // 랜덤 색상
  }))

  return (
    <div className="gold-particles-container">
      {particles.map((p) => (
        <div
          key={p.id}
          className="gold-particle"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            top: `${p.top}%`,
            animationDelay: `${p.delay}s`,
            '--target-x': `${p.targetX}px`,
            '--target-y': `${p.targetY}px`,
            '--particle-opacity': p.opacity,
            background: `radial-gradient(circle at 30% 30%, ${p.color}, ${p.color}88)`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

// 스크롤 인디케이터 컴포넌트
function ScrollIndicator({ color = 'white' }: { color?: 'white' | 'amber' | 'pink' | 'sky' | 'gray' }) {
  const colors = {
    white: { text: 'text-white/50', line: 'from-white/50', dot: 'bg-white/60', bar: 'bg-white/30' },
    amber: { text: 'text-amber-200/50', line: 'from-amber-200/50', dot: 'bg-amber-200/60', bar: 'bg-amber-200/30' },
    pink: { text: 'text-pink-300/50', line: 'from-pink-300/50', dot: 'bg-pink-300/60', bar: 'bg-pink-300/30' },
    sky: { text: 'text-sky-200/50', line: 'from-sky-200/50', dot: 'bg-sky-200/60', bar: 'bg-sky-200/30' },
    gray: { text: 'text-gray-400/50', line: 'from-gray-400/50', dot: 'bg-gray-400/60', bar: 'bg-gray-400/30' },
  }
  const c = colors[color]

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center fade-in-up-delay-3">
      <span className={`text-[10px] ${c.text} mb-2`}>Scroll</span>
      <div className={`w-px h-6 bg-gradient-to-b ${c.line} to-transparent`} />
      <div className={`w-1.5 h-1.5 ${c.dot} rounded-full mt-1 float-up`} />
      <div className={`w-8 h-px ${c.bar} mt-3`} />
    </div>
  )
}

// 빛 광선 컴포넌트
function LightRays({ count = 8 }: { count?: number }) {
  const rays = Array.from({ length: count }, (_, i) => ({
    id: i,
    rotation: (360 / count) * i,
    delay: i * 0.1,
    width: 2 + Math.random() * 3,
  }))

  return (
    <div className="light-rays-container">
      {rays.map((r) => (
        <div
          key={r.id}
          className="light-ray"
          style={{
            transform: `rotate(${r.rotation}deg)`,
            animationDelay: `${r.delay}s`,
            width: `${r.width}px`,
          }}
        />
      ))}
    </div>
  )
}

type DemoType = 'typing' | 'blur' | 'zoom' | 'bokeh' | 'letter' | 'petal' | 'watercolor' | 'lightray' | 'film' | 'ripple' | 'gold' | 'focus' | 'cinematic' | null

export default function AnimationTestPage() {
  const [activeDemo, setActiveDemo] = useState<DemoType>(null)
  const [key, setKey] = useState(0) // 애니메이션 리셋용

  const runDemo = (demo: DemoType) => {
    setActiveDemo(null)
    setKey(k => k + 1)
    setTimeout(() => setActiveDemo(demo), 50)
  }

  const demos: { id: DemoType; label: string; color: string }[] = [
    { id: 'cinematic', label: '영화처럼', color: 'bg-emerald-600' },
    { id: 'typing', label: '첫 설렘', color: 'bg-blue-600' },
    { id: 'blur', label: '꿈에서 현실로', color: 'bg-blue-600' },
    { id: 'zoom', label: '다가오는 순간', color: 'bg-blue-600' },
    { id: 'bokeh', label: '빛나는 약속', color: 'bg-blue-600' },
    { id: 'letter', label: '사랑의 편지', color: 'bg-purple-600' },
    { id: 'petal', label: '봄날의 축복', color: 'bg-pink-600' },
    { id: 'watercolor', label: '물드는 사랑', color: 'bg-cyan-600' },
    { id: 'lightray', label: '영원한 빛', color: 'bg-amber-600' },
    { id: 'film', label: '추억의 순간', color: 'bg-orange-600' },
    { id: 'ripple', label: '잔잔한 물결', color: 'bg-sky-600' },
    { id: 'gold', label: '황금빛 축복', color: 'bg-yellow-600' },
    { id: 'focus', label: '오직 우리 둘', color: 'bg-indigo-600' },
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <style jsx global>{`
        /* ========== 기본 애니메이션 ========== */

        /* 타이핑 커서 */
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .typing-cursor {
          animation: blink 1s infinite;
          margin-left: 2px;
        }

        /* 페이드 인 업 */
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up { animation: fadeInUp 1s ease-out forwards; }
        .fade-in-up-delay-1 { animation: fadeInUp 1s ease-out 0.5s forwards; opacity: 0; }
        .fade-in-up-delay-2 { animation: fadeInUp 1s ease-out 1s forwards; opacity: 0; }
        .fade-in-up-delay-3 { animation: fadeInUp 1s ease-out 1.5s forwards; opacity: 0; }

        /* 스케일 업 */
        @keyframes scaleUp {
          0% { opacity: 0; transform: scale(0.5); }
          100% { opacity: 1; transform: scale(1); }
        }
        .scale-up { animation: scaleUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .scale-up-delay-1 { animation: scaleUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s forwards; opacity: 0; }
        .scale-up-delay-2 { animation: scaleUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.6s forwards; opacity: 0; }

        /* 슬라이드 인 (좌우) */
        @keyframes slideInLeft {
          0% { opacity: 0; transform: translateX(-30px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          0% { opacity: 0; transform: translateX(30px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .slide-in-left { animation: slideInLeft 0.8s ease-out forwards; }
        .slide-in-right { animation: slideInRight 0.8s ease-out forwards; }
        .slide-in-left-delay { animation: slideInLeft 0.8s ease-out 0.5s forwards; opacity: 0; }
        .slide-in-right-delay { animation: slideInRight 0.8s ease-out 0.5s forwards; opacity: 0; }

        /* 바운스 */
        @keyframes bounceIn {
          0% { opacity: 0; transform: scale(0.3); }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        .bounce-in { animation: bounceIn 0.8s ease-out forwards; }
        .bounce-in-delay-1 { animation: bounceIn 0.8s ease-out 0.4s forwards; opacity: 0; }
        .bounce-in-delay-2 { animation: bounceIn 0.8s ease-out 0.8s forwards; opacity: 0; }

        /* 글자 펼치기 (tracking) */
        @keyframes letterSpread {
          0% { opacity: 0; letter-spacing: -0.5em; }
          100% { opacity: 1; letter-spacing: 0.3em; }
        }
        .letter-spread { animation: letterSpread 1.2s ease-out forwards; }
        .letter-spread-delay { animation: letterSpread 1.2s ease-out 0.5s forwards; opacity: 0; }

        /* 시네마틱 인트로 전용 - 글자 좁아지기 (기존 템플릿과 동일) */
        @keyframes cinematicTextReveal {
          0% { opacity: 0; letter-spacing: 6px; }
          100% { opacity: 1; letter-spacing: 3px; }
        }
        .cinematic-text-reveal {
          animation: cinematicTextReveal 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.15s forwards;
          opacity: 0;
        }

        /* 시네마틱 배경 이미지 - 흑백 + 줌아웃 (기존 템플릿과 동일) */
        @keyframes cinematicBgReveal {
          0% { opacity: 0; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
        .cinematic-bg-reveal {
          animation: cinematicBgReveal 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          will-change: transform, opacity;
          backface-visibility: hidden;
        }

        /* 시네마틱 가로바 - width 변화 (기존 템플릿과 동일) */
        @keyframes cinematicLineReveal {
          0% { width: 0; }
          100% { width: 50px; }
        }
        .cinematic-line-reveal {
          animation: cinematicLineReveal 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          height: 1px;
          background: rgba(255, 255, 255, 0.5);
        }

        /* 시네마틱 날짜 텍스트 */
        .cinematic-subtext-reveal {
          animation: fadeInUp 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.4s forwards;
          opacity: 0;
        }

        /* 회전하며 나타남 */
        @keyframes rotateIn {
          0% { opacity: 0; transform: rotate(-10deg) scale(0.9); }
          100% { opacity: 1; transform: rotate(0) scale(1); }
        }
        .rotate-in { animation: rotateIn 0.8s ease-out forwards; }
        .rotate-in-delay { animation: rotateIn 0.8s ease-out 0.5s forwards; opacity: 0; }

        /* 클립 reveal (위에서 아래로) */
        @keyframes clipReveal {
          0% { clip-path: inset(0 0 100% 0); }
          100% { clip-path: inset(0 0 0 0); }
        }
        .clip-reveal { animation: clipReveal 1s ease-out forwards; }
        .clip-reveal-delay { animation: clipReveal 1s ease-out 0.5s forwards; }

        /* 물결 효과 텍스트 */
        @keyframes waveText {
          0% { opacity: 0; transform: translateY(20px) rotate(3deg); }
          50% { transform: translateY(-5px) rotate(-1deg); }
          100% { opacity: 1; transform: translateY(0) rotate(0); }
        }
        .wave-text { animation: waveText 1s ease-out forwards; }
        .wave-text-delay { animation: waveText 1s ease-out 0.5s forwards; opacity: 0; }

        /* 글로우 효과 */
        @keyframes glowIn {
          0% { opacity: 0; text-shadow: 0 0 0 transparent; }
          50% { text-shadow: 0 0 30px currentColor; }
          100% { opacity: 1; text-shadow: 0 0 10px currentColor; }
        }
        .glow-in { animation: glowIn 1.5s ease-out forwards; }
        .glow-in-delay { animation: glowIn 1.5s ease-out 0.5s forwards; opacity: 0; }

        /* 스플릿 애니메이션 */
        @keyframes splitReveal {
          0% { opacity: 0; transform: scaleX(0); }
          100% { opacity: 1; transform: scaleX(1); }
        }
        .split-reveal { animation: splitReveal 0.8s ease-out forwards; transform-origin: center; opacity: 0; }

        /* 3D 플립 */
        @keyframes flipIn {
          0% { opacity: 0; transform: perspective(400px) rotateY(90deg); }
          100% { opacity: 1; transform: perspective(400px) rotateY(0); }
        }
        .flip-in { animation: flipIn 0.8s ease-out forwards; }
        .flip-in-delay { animation: flipIn 0.8s ease-out 0.5s forwards; opacity: 0; }

        /* 블러 → 선명 */
        @keyframes blurToSharp {
          0% { filter: blur(20px); opacity: 0; transform: scale(1.1); }
          100% { filter: blur(0); opacity: 1; transform: scale(1); }
        }
        .blur-to-sharp { animation: blurToSharp 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }

        /* 슬로우 줌 */
        @keyframes slowZoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.15); }
        }
        .slow-zoom { animation: slowZoom 20s ease-out forwards; }

        /* 어두웠다가 밝아지기 */
        @keyframes darkToLight {
          0% { opacity: 0.9; }
          100% { opacity: 0; }
        }
        .dark-to-light { animation: darkToLight 3s ease-out forwards; }

        /* 보케 파티클 */
        @keyframes bokehFloat {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 0.6; }
          50% { transform: translateY(-30px) translateX(20px); opacity: 0.8; }
          90% { opacity: 0.4; }
        }
        @keyframes bokehPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(255, 215, 180, 0.3); }
          50% { transform: scale(1.2); box-shadow: 0 0 40px rgba(255, 215, 180, 0.5); }
        }
        .bokeh-container { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
        .bokeh-particle {
          position: absolute;
          border-radius: 50%;
          filter: blur(2px);
          animation: bokehFloat 15s ease-in-out infinite, bokehPulse 4s ease-in-out infinite;
          will-change: transform, opacity;
          backface-visibility: hidden;
        }

        /* ========== 새로운 애니메이션 ========== */

        /* 1. 편지 봉투 오픈 */
        @keyframes flapOpen {
          0% { transform: perspective(500px) rotateX(0deg); z-index: 4; }
          99% { z-index: 4; }
          100% { transform: perspective(500px) rotateX(-180deg); z-index: 1; }
        }
        @keyframes cardSlideOut {
          0% { transform: translateY(0px); }
          100% { transform: translateY(-160px); }
        }
        @keyframes cardExpand {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes sealBreak {
          0% { opacity: 1; transform: scale(1) rotate(0deg); }
          100% { opacity: 0; transform: scale(0.5) rotate(45deg); }
        }
        @keyframes envelopeDown {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(100px); }
        }

        /* 2. 꽃잎 날림 */
        @keyframes petalFall {
          0% {
            transform: translateY(-100px) rotate(0deg) translateX(0);
            opacity: 0;
          }
          10% { opacity: 1; }
          100% {
            transform: translateY(100vh) rotate(720deg) translateX(100px);
            opacity: 0.3;
          }
        }
        .petals-container { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
        .petal {
          position: absolute;
          top: -20px;
          background: linear-gradient(135deg, #ffe4e9 0%, #ffc0cb 50%, #ffe4e9 100%);
          border-radius: 50% 0 50% 50%;
          animation: petalFall linear infinite;
          opacity: 0.7;
          will-change: transform;
          backface-visibility: hidden;
        }

        /* 텍스트 퍼짐 효과 - GPU 가속 */
        @keyframes textSpread {
          0% {
            opacity: 0;
            filter: blur(10px);
            transform: scale(1.1) translateZ(0);
          }
          100% {
            opacity: 1;
            filter: blur(0);
            transform: scale(1) translateZ(0);
          }
        }

        /* 3. 수채화 번짐 - GPU 가속 */
        @keyframes watercolorSpread {
          0% {
            clip-path: circle(0% at 50% 50%);
            opacity: 0;
          }
          100% {
            clip-path: circle(100% at 50% 50%);
            opacity: 1;
          }
        }
        @keyframes watercolorBlob {
          0%, 100% { transform: scale(1) translateZ(0); }
          50% { transform: scale(1.02) translateZ(0); }
        }
        .watercolor-spread {
          animation: watercolorSpread 2s ease-out forwards;
          will-change: clip-path, opacity;
        }
        .watercolor-blob {
          animation: watercolorBlob 10s ease-in-out infinite;
          will-change: transform;
        }

        /* 4. 빛의 커튼 */
        @keyframes rayExpand {
          0% {
            opacity: 0;
            transform: rotate(var(--rotation)) scaleY(0);
          }
          30% { opacity: 0.3; }
          70% { opacity: 0.6; }
          100% {
            opacity: 0.4;
            transform: rotate(var(--rotation)) scaleY(1);
          }
        }
        @keyframes rayPulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.6; }
        }
        .light-rays-container {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
        .light-ray {
          position: absolute;
          height: 150%;
          background: linear-gradient(to bottom, transparent, rgba(255, 248, 220, 0.6), transparent);
          transform-origin: center center;
          animation: rayExpand 10s ease-out forwards, rayPulse 8s ease-in-out infinite 10s;
          will-change: transform, opacity;
          backface-visibility: hidden;
        }

        /* 5. 필름 빈티지 */
        @keyframes filmGrain {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(0.1%, 0.1%); }
        }
        @keyframes filmFlicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.97; }
        }
        @keyframes filmVignette {
          0% { box-shadow: inset 0 0 150px 60px rgba(0,0,0,0.9); }
          100% { box-shadow: inset 0 0 100px 40px rgba(0,0,0,0.5); }
        }
        .film-grain {
          animation: filmGrain 2s ease-in-out infinite;
        }
        .film-flicker {
          animation: filmFlicker 3s ease-in-out infinite;
        }
        .film-vignette {
          animation: filmVignette 2s ease-out forwards;
        }
        .film-overlay {
          background: repeating-linear-gradient(
            0deg,
            rgba(0,0,0,0.1) 0px,
            rgba(0,0,0,0.1) 1px,
            transparent 1px,
            transparent 2px
          );
        }

        /* 6. 물결 반사 */
        @keyframes waterDistort {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        @keyframes waterDistort2 {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(8px);
          }
        }
        @keyframes rippleShine {
          0% {
            opacity: 0;
            transform: translateX(-100%) skewX(-15deg);
          }
          50% {
            opacity: 0.5;
          }
          100% {
            opacity: 0;
            transform: translateX(100%) skewX(-15deg);
          }
        }
        @keyframes rippleGlow {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }
        .water-ripple-overlay {
          pointer-events: none;
        }
        .water-ripple-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.4) 20%,
            rgba(200, 230, 255, 0.5) 50%,
            rgba(255, 255, 255, 0.4) 80%,
            transparent 100%
          );
          filter: blur(1px);
          will-change: transform;
        }
        .water-shine {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg,
            transparent 0%,
            transparent 40%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 60%,
            transparent 100%
          );
          animation: rippleShine 4s ease-in-out infinite;
        }
        .water-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse 100% 40% at 50% 100%,
            rgba(100, 180, 255, 0.35) 0%,
            rgba(150, 200, 255, 0.2) 30%,
            transparent 70%
          );
          animation: rippleGlow 3s ease-in-out infinite;
        }

        /* 7. 골드 파티클 */
        @keyframes goldGather {
          0% {
            transform: translate(var(--target-x), var(--target-y)) scale(0);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
        }
        @keyframes goldShimmer {
          0%, 100% {
            box-shadow: 0 0 5px rgba(255, 215, 0, 0.8);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 15px rgba(255, 215, 0, 1);
            transform: scale(1.2);
          }
        }
        .gold-particles-container {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .gold-particle {
          position: absolute;
          border-radius: 50%;
          opacity: var(--particle-opacity, 0.6);
          animation: goldGather 2s ease-out forwards, goldShimmer 3s ease-in-out infinite 2s;
          will-change: transform, opacity;
          backface-visibility: hidden;
          box-shadow: 0 0 4px currentColor;
        }

        /* 8. 포커스 전환 */
        @keyframes focusPull {
          0% {
            filter: blur(15px);
            transform: scale(1.05);
            opacity: 0.5;
          }
          30% {
            filter: blur(20px);
            opacity: 0.7;
          }
          100% {
            filter: blur(0px);
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes depthShift {
          0% { filter: blur(8px); opacity: 0.3; }
          50% { filter: blur(15px); opacity: 0.5; }
          100% { filter: blur(0px); opacity: 1; }
        }
        .focus-pull {
          animation: focusPull 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        .depth-shift {
          animation: depthShift 3s ease-out forwards;
        }

        /* ========== 추가 효과 ========== */

        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .shimmer-text {
          background: linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.1) 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }

        @keyframes floatUp {
          0% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0); }
        }
        .float-up {
          animation: floatUp 3s ease-in-out infinite;
        }

        /* 세피아 필터 */
        .sepia-filter {
          filter: sepia(0.4) contrast(1.1) brightness(0.95);
        }

      `}</style>

      {/* 헤더 */}
      <div className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-700 p-4">
        <h1 className="text-xl font-bold mb-4">Animation Test Page</h1>
        <div className="flex flex-wrap gap-2">
          {demos.map((demo) => (
            <button
              key={demo.id}
              onClick={() => runDemo(demo.id)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                activeDemo === demo.id ? demo.color : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {demo.label}
            </button>
          ))}
          <button
            onClick={() => setActiveDemo(null)}
            className="px-3 py-1.5 rounded-lg text-xs bg-red-600/50 hover:bg-red-600"
          >
            Reset
          </button>
        </div>
      </div>

      {/* 데모 영역 - 모바일 프리뷰 */}
      <div className="p-4 flex justify-center">
        <div key={key} className="relative w-[375px] mx-auto">
          {/* 모바일 프레임 */}
          <div className="relative bg-gray-800 rounded-[40px] p-3 shadow-2xl">
            {/* 노치 */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-50" />

            {/* 화면 영역 */}
            <div className="relative bg-black rounded-[32px] overflow-hidden">

          {/* 1. Typing + Fade - 타이핑 + 페이드업 */}
          {activeDemo === 'typing' && (
            <div className="relative h-[680px] overflow-hidden">
              {/* 배경 이미지 */}
              <div
                className="absolute inset-0 bg-cover bg-center fade-in"
                style={{
                  backgroundImage: 'url(https://images.unsplash.com/photo-1519741497674-611481863552?w=800)',
                  animationDuration: '2s',
                }}
              />
              {/* 어두운 오버레이 */}
              <div className="absolute inset-0 bg-black/50" />
              {/* 콘텐츠 */}
              <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
                <p className="text-xs text-white/70 tracking-[6px] mb-6 letter-spread">WELCOME TO OUR WEDDING</p>
                <p className="text-xl text-white mb-2">
                  <TypingText text="소중한 분들을 초대합니다" delay={800} speed={100} />
                </p>
                <div className="w-20 h-px bg-white/50 my-6 split-reveal" style={{ animationDelay: '2.8s' }} />
                <p className="text-sm text-white/70 fade-in-up" style={{ animationDelay: '3.2s', opacity: 0 }}>2025. 05. 24 토요일 오후 2시</p>
                <p className="text-xs text-white/50 mt-2 fade-in-up" style={{ animationDelay: '3.5s', opacity: 0 }}>더채플앳청담</p>
                <ScrollIndicator />
              </div>
            </div>
          )}

          {/* 2. Blur → Sharp - 배경과 함께 부드럽게 */}
          {activeDemo === 'blur' && (
            <div className="relative h-[680px] overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center blur-to-sharp"
                style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1519741497674-611481863552?w=1200)' }}
              />
              <div className="absolute inset-0 bg-black/40" />
              <div className="relative z-10 h-full flex flex-col items-center justify-center text-white">
                <p className="text-xs tracking-[8px] mb-4 fade-in-up" style={{ animationDelay: '1.5s', animationDuration: '1.5s', opacity: 0 }}>SAVE THE DATE</p>
                <p className="text-2xl font-serif mt-2 fade-in-up" style={{ animationDelay: '2s', animationDuration: '1.5s', opacity: 0 }}>우리 결혼합니다</p>
                <div className="w-16 h-px bg-white/50 my-6 split-reveal" style={{ animationDelay: '2.5s' }} />
                <p className="text-sm text-white/70 fade-in-up" style={{ animationDelay: '2.8s', animationDuration: '1.5s', opacity: 0 }}>2025년 5월 24일 토요일</p>
                <ScrollIndicator />
              </div>
            </div>
          )}

          {/* 3. Slow Zoom - 어두웠다가 밝아지며 */}
          {activeDemo === 'zoom' && (
            <div className="relative h-[680px] overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center slow-zoom"
                style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200)' }}
              />
              {/* 어두웠다가 밝아지는 오버레이 */}
              <div className="absolute inset-0 bg-black dark-to-light" />
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="relative z-10 h-full flex flex-col items-center justify-end pb-20 text-white px-4">
                <p className="text-xs tracking-[4px] mb-4 fade-in-up" style={{ animationDelay: '2s', animationDuration: '1.5s', opacity: 0 }}>OUR WEDDING DAY</p>
                <p className="text-xl font-serif fade-in-up" style={{ animationDelay: '2.4s', animationDuration: '1.5s', opacity: 0 }}>새로운 시작을 함께해주세요</p>
                <div className="w-16 h-px bg-white/50 my-6 split-reveal" style={{ animationDelay: '2.8s' }} />
                <p className="text-sm text-white/70 fade-in-up" style={{ animationDelay: '3.2s', animationDuration: '1.5s', opacity: 0 }}>2025년 5월 24일 토요일</p>
                <ScrollIndicator />
              </div>
            </div>
          )}

          {/* 4. Bokeh Particles - 글로우 효과 */}
          {activeDemo === 'bokeh' && (
            <div className="relative h-[680px] overflow-hidden flex flex-col items-center justify-center px-4">
              {/* 배경 웨딩 사진 */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1519741497674-611481863552?w=1200)' }}
              />
              {/* 어두운 오버레이 */}
              <div className="absolute inset-0 bg-black/60" />
              <BokehParticles count={35} color="warm" />
              <div className="relative z-10 text-center">
                <p className="text-xs text-amber-200/60 tracking-[6px] mb-4 letter-spread" style={{ animationDuration: '2s' }}>THE WEDDING OF</p>
                <p className="text-xl font-serif text-amber-100 mb-2 glow-in" style={{ animationDelay: '1s', animationDuration: '2s', opacity: 0 }}>행복한 날에 초대합니다</p>
                <div className="w-16 h-px bg-amber-400/50 mx-auto my-6 split-reveal" style={{ animationDelay: '1.8s' }} />
                <p className="text-gray-300 text-sm glow-in" style={{ animationDelay: '2.2s', animationDuration: '2s', opacity: 0 }}>2025. 05. 24 Saturday</p>
              </div>
              <ScrollIndicator color="amber" />
            </div>
          )}

          {/* 5. 편지 봉투 오픈 */}
          {activeDemo === 'letter' && (
            <div className="relative h-[680px] flex items-center justify-center overflow-hidden">
              {/* 흑백 웨딩사진 배경 */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: 'url(https://images.unsplash.com/photo-1519741497674-611481863552?w=800)',
                  filter: 'grayscale(100%) brightness(0.4)'
                }}
              />

              {/* 화이트 꽃잎 날림 효과 */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[8, 18, 28, 38, 48, 58, 68, 78, 88, 13, 33, 53, 73, 93, 23, 43, 63, 83, 3].map((left, i) => (
                  <div
                    key={i}
                    className="absolute"
                    style={{
                      left: `${left}%`,
                      top: '-20px',
                      width: `${10 + (i % 4) * 5}px`,
                      height: `${10 + (i % 4) * 5}px`,
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.5) 100%)',
                      borderRadius: '50% 0 50% 50%',
                      boxShadow: '0 2px 8px rgba(255,255,255,0.3)',
                      animation: `petalFall ${8 + (i % 5) * 2}s linear ${i * 0.4}s infinite`,
                      transform: `rotate(${i * 30}deg)`
                    }}
                  />
                ))}
              </div>

              {/* envelopeWrap: 봉투가 내려가는 애니메이션만 담당 */}
              {/* 플랩(104px) 열릴 때 중심 맞추기 위해 아래로 50px 이동 */}
              <div
                className="relative mt-[50px]"
                style={{ animation: 'envelopeDown 0.8s ease-in 3.5s forwards' }}
              >
                {/* envelope: 봉투 본체 - 카드(180px) 수용 가능하도록 높이 증가 */}
                <div className="relative w-[280px] h-[260px]">

                  {/* z-1: 봉투 뒷면 (Back) - 아이보리 */}
                  <div
                    className="absolute inset-0 bg-[#f5f0e8] shadow-lg"
                    style={{ zIndex: 1 }}
                  />

                  {/* z-2: 카드 - 가로 250px 유지, 세로 180px로 증가 (7:9 비율 근사) */}
                  {/* 초기 top:80px → translateY(-160px) → 최종 top:-80px */}
                  <div
                    className="absolute left-[15px] right-[15px] h-[180px] bg-white rounded-md shadow-xl flex flex-col items-center justify-center p-4 text-center"
                    style={{
                      zIndex: 2,
                      top: '80px',
                      animation: 'cardSlideOut 1.2s ease-out 1.5s forwards'
                    }}
                  >
                    <p className="text-[8px] text-gray-400 tracking-[2px] mb-0.5">WEDDING INVITATION</p>
                    <p className="text-base text-gray-600 mb-3">우리 결혼합니다</p>
                    <div className="w-8 h-px bg-[#d4a574] mb-3" />
                    <p className="text-sm text-gray-600">2025. 05. 24</p>
                    <p className="text-xs text-gray-500 mt-1">토요일 오후 2시</p>
                  </div>

                  {/* z-3: 봉투 앞면 (Front) - V컷, 아이보리 */}
                  <div
                    className="absolute inset-x-0 top-0 bottom-0 bg-[#f5f0e8] shadow-sm"
                    style={{
                      zIndex: 3,
                      clipPath: 'polygon(0 0, 50% 40%, 100% 0, 100% 100%, 0 100%)'
                    }}
                  />


                  {/* z-4: 봉투 뚜껑 (Flap) - V컷과 동일한 크기 (40% = 104px) */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[104px] bg-[#f5f0e8] shadow-sm origin-top"
                    style={{
                      zIndex: 4,
                      clipPath: 'polygon(0 0, 50% 100%, 100% 0)',
                      transformStyle: 'preserve-3d',
                      animation: 'flapOpen 1s ease-in-out 0.6s forwards'
                    }}
                  >
                    {/* 뚜껑 안쪽 면 - 살짝 어두운 아이보리 */}
                    <div
                      className="absolute inset-0 bg-[#ebe6de]"
                      style={{ clipPath: 'polygon(5% 5%, 50% 90%, 95% 5%)' }}
                    />
                  </div>

                  {/* z-5: 스티커 (Seal) - 플랩 하단 */}
                  <div
                    className="absolute top-[60px] left-1/2 -translate-x-1/2 w-11 h-11 bg-black rounded-full flex items-center justify-center shadow-md"
                    style={{
                      zIndex: 5,
                      animation: 'sealBreak 0.5s ease-out 0.2s forwards'
                    }}
                  >
                    <span className="text-white text-lg">♥</span>
                  </div>

                </div>
              </div>

              {/* 최종 카드 (봉투 사라진 후 나타남) */}
              <div
                className="absolute w-[280px] h-[360px] bg-white rounded-lg shadow-2xl flex flex-col items-center justify-center p-6 text-center"
                style={{
                  opacity: 0,
                  zIndex: 10,
                  animation: 'cardExpand 1s ease-out 4s forwards'
                }}
              >
                <p className="text-[11px] text-gray-400 tracking-[4px] mb-1">WEDDING INVITATION</p>
                <p className="text-2xl text-gray-600 mb-4">우리 결혼합니다</p>
                <div className="w-12 h-px bg-[#d4a574] mb-4" />
                <p className="text-lg text-gray-600">2025. 05. 24</p>
                <p className="text-sm text-gray-500 mt-1">토요일 오후 2시</p>
                <p className="text-xs text-gray-400 mt-4">더채플앳청담</p>
              </div>
              <ScrollIndicator color="gray" />
            </div>
          )}

          {/* 6. 꽃잎 날림 - 물결 + 회전 */}
          {activeDemo === 'petal' && (
            <div className="relative h-[680px] overflow-hidden flex flex-col items-center justify-center px-4">
              {/* 웨딩사진 배경 */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: 'url(https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800)',
                }}
              />
              {/* 핑크 오버레이 */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#fff5f5]/70 to-[#ffe4e6]/80" />
              <FallingPetals count={25} />
              <div className="relative z-10 text-center">
                <p className="text-xs text-pink-400 tracking-[6px] mb-4 wave-text">SPRING WEDDING</p>
                <p className="text-xl font-serif text-gray-700 mb-2 rotate-in">꽃잎처럼 아름다운 날</p>
                <div className="w-20 h-px bg-pink-300 mx-auto my-6 split-reveal" style={{ animationDelay: '0.8s' }} />
                <p className="text-gray-500 text-sm wave-text-delay">봄날의 아름다운 약속</p>
                <p className="text-xs text-gray-400 mt-4 rotate-in-delay" style={{ animationDelay: '1.2s' }}>2025. 05. 24</p>
              </div>
              <ScrollIndicator color="pink" />
            </div>
          )}

          {/* 7. 수채화 번짐 */}
          {activeDemo === 'watercolor' && (
            <div className="relative h-[680px] overflow-hidden">
              {/* 웨딩사진 배경 */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: 'url(https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800)',
                }}
              />
              {/* 흰색 오버레이 */}
              <div className="absolute inset-0 bg-white/60" />
              {/* 수채화 배경 */}
              <div className="watercolor-spread absolute inset-0">
                <div
                  className="watercolor-blob absolute inset-[-20%] opacity-30"
                  style={{ background: 'radial-gradient(ellipse at 30% 30%, #e0f2fe, #bae6fd, #7dd3fc, transparent 70%)' }}
                />
                <div
                  className="watercolor-blob absolute inset-[-10%] opacity-40"
                  style={{ background: 'radial-gradient(ellipse at 70% 60%, #fce7f3, #fbcfe8, #f9a8d4, transparent 60%)', animationDelay: '1s' }}
                />
                <div
                  className="watercolor-blob absolute inset-[-15%] opacity-30"
                  style={{ background: 'radial-gradient(ellipse at 50% 80%, #fef3c7, #fde68a, transparent 50%)', animationDelay: '2s' }}
                />
              </div>

              <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 gap-3">
                <p
                  className="text-xs text-cyan-600/70 tracking-[6px]"
                  style={{
                    opacity: 0,
                    animation: 'textSpread 1.5s ease-out 1.5s forwards'
                  }}
                >WELCOME TO OUR WEDDING</p>
                <div
                  className="font-serif text-gray-700"
                  style={{
                    opacity: 0,
                    animation: 'textSpread 1.5s ease-out 2s forwards'
                  }}
                >
                  <p className="text-2xl">A New Chapter Begins</p>
                  <p className="text-base mt-1">우리의 새로운 이야기가 시작됩니다.</p>
                </div>
                <div
                  className="w-16 h-px bg-cyan-400/50"
                  style={{
                    opacity: 0,
                    animation: 'textSpread 1.5s ease-out 2.4s forwards'
                  }}
                />
                <p
                  className="text-gray-500 text-sm"
                  style={{
                    opacity: 0,
                    animation: 'textSpread 1.5s ease-out 2.7s forwards'
                  }}
                >You are warmly invited to share our special day.</p>
              </div>
              <ScrollIndicator color="sky" />
            </div>
          )}

          {/* 8. 빛의 커튼 */}
          {activeDemo === 'lightray' && (
            <div className="relative h-[680px] overflow-hidden flex items-center justify-center px-4">
              {/* 웨딩사진 배경 (종합데모와 동일) */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: 'url(https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200)',
                }}
              />
              {/* 골드 보케 (종합데모와 동일) */}
              <BokehParticles count={20} color="gold" />
              {/* 빛 광선 */}
              <LightRays count={12} />
              {/* 그라데이션 오버레이 (종합데모와 동일) */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
              <div className="relative z-10 text-center">
                <p
                  className="text-xs text-amber-200/60 tracking-[6px] mb-4"
                  style={{ opacity: 0, animation: 'slideInLeft 1s ease-out 0.5s forwards' }}
                >BLESSED UNION</p>
                <p
                  className="text-2xl font-serif text-white mb-2"
                  style={{ opacity: 0, animation: 'glowIn 1.5s ease-out 1s forwards' }}
                >영원을 약속하는 날</p>
                <div
                  className="w-20 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent mx-auto my-6"
                  style={{ opacity: 0, animation: 'splitReveal 0.6s ease-out 1.8s forwards' }}
                />
                <p
                  className="text-white/60 text-sm"
                  style={{ opacity: 0, animation: 'slideInRight 1s ease-out 2.2s forwards' }}
                >소중한 분들을 초대합니다</p>
              </div>
              <ScrollIndicator color="amber" />
            </div>
          )}

          {/* 9. 필름 빈티지 */}
          {activeDemo === 'film' && (
            <div className="relative h-[680px] overflow-hidden">
              {/* 배경 이미지 - 웨딩사진 */}
              <div
                className="absolute inset-0 bg-cover bg-center sepia-filter film-grain"
                style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1519741497674-611481863552?w=1200)' }}
              />

              {/* 필름 효과 오버레이 */}
              <div className="absolute inset-0 film-overlay opacity-50" />
              <div className="absolute inset-0 film-vignette" />
              <div className="absolute inset-0 film-flicker bg-black/10" />

              {/* 필름 스크래치 */}
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cline x1='0' y1='0' x2='200' y2='200' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E")`,
                backgroundSize: '100px 100px'
              }} />

              <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
                <p
                  className="text-xs text-amber-100/80 tracking-[6px] mb-4"
                  style={{ fontFamily: 'serif', opacity: 0, animation: 'blurToSharp 2s ease-out forwards' }}
                >TIMELESS LOVE</p>
                <p
                  className="text-2xl font-serif text-amber-50 mb-2"
                  style={{ opacity: 0, animation: 'blurToSharp 2s ease-out 1s forwards' }}
                >우리의 순간에 초대합니다</p>
                <div className="w-16 h-px bg-amber-200/50 mx-auto my-6 split-reveal" style={{ animationDelay: '2s' }} />
                <p
                  className="text-amber-100/60 text-sm"
                  style={{ opacity: 0, animation: 'blurToSharp 1.5s ease-out 2.5s forwards' }}
                >An invitation to our moment</p>
              </div>
              <ScrollIndicator color="amber" />
            </div>
          )}

          {/* 10. 물결 반사 */}
          {activeDemo === 'ripple' && (
            <div className="relative h-[680px] overflow-hidden flex flex-col">
              {/* 상단: 원본 이미지 */}
              <div className="relative h-1/2">
                <div
                  className="absolute inset-0 bg-cover bg-bottom ripple-calm"
                  style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1519741497674-611481863552?w=1200)' }}
                />
              </div>

              {/* 하단: 반사 이미지 (뒤집힘 + 물결) */}
              <div className="relative h-1/2 overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-top water-ripple"
                  style={{
                    backgroundImage: 'url(https://images.unsplash.com/photo-1519741497674-611481863552?w=1200)',
                    transform: 'scaleY(-1)',
                    opacity: 0.6,
                  }}
                />
                {/* 물결 오버레이 */}
                <div className="absolute inset-0 bg-gradient-to-b from-sky-900/30 to-sky-950/50" />
              </div>

              {/* 중앙 텍스트 */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-10">
                <div className="bg-black/30 backdrop-blur-sm px-8 py-6 rounded-lg">
                  <p className="text-[10px] text-sky-200/80 tracking-[4px] mb-3 wave-text">ETERNAL PROMISE</p>
                  <p className="text-lg font-serif text-white mb-2 wave-text-delay">두 사람이 하나가 되는 순간</p>
                  <div className="w-12 h-px bg-sky-200/50 mx-auto my-3 split-reveal" style={{ animationDelay: '1s' }} />
                  <p className="text-sky-100/70 text-xs wave-text" style={{ animationDelay: '1.4s', opacity: 0 }}>소중한 분들을 초대합니다</p>
                </div>
                <ScrollIndicator color="sky" />
              </div>
            </div>
          )}

          {/* 11. 골드 파티클 - 글로우 + 스케일 */}
          {activeDemo === 'gold' && (
            <div className="relative h-[680px] overflow-hidden flex items-center justify-center px-4">
              {/* 웨딩사진 배경 */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1519741497674-611481863552?w=1200)' }}
              />
              {/* 어두운 오버레이 */}
              <div className="absolute inset-0 bg-black/60" />
              <GoldParticles count={60} />
              <div className="relative z-10 text-center">
                <p className="text-xs text-amber-400/60 tracking-[6px] mb-4 scale-up" style={{ animationDelay: '1.5s', opacity: 0 }}>WEDDING INVITATION</p>
                <p className="text-2xl font-serif text-amber-100 mb-2 glow-in" style={{ animationDelay: '2s', opacity: 0 }}>소중한 날에 초대합니다</p>
                <div className="w-20 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto my-6 split-reveal" style={{ animationDelay: '2.5s' }} />
                <p className="text-amber-200/60 text-sm scale-up" style={{ animationDelay: '2.9s', opacity: 0 }}>2025.05.24 (Sat)</p>
                <p className="text-amber-200/40 text-xs mt-2 scale-up" style={{ animationDelay: '3.2s', opacity: 0 }}>더채플앳청담</p>
              </div>
              <ScrollIndicator color="amber" />
            </div>
          )}

          {/* 12. 포커스 전환 */}
          {activeDemo === 'focus' && (
            <div className="relative h-[680px] overflow-hidden">
              {/* 배경 (아웃포커스) */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: 'url(https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200)',
                  filter: 'blur(15px)'
                }}
              />

              {/* 전경 (인포커스) */}
              <div
                className="focus-pull absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200)' }}
              />

              <div className="absolute inset-0 bg-black/30" />

              <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
                <p className="text-xs text-white/60 tracking-[6px] mb-4 letter-spread-delay">FOCUS ON US</p>
                <p className="text-2xl font-serif text-white mb-2 depth-shift" style={{ animationDelay: '0.8s', opacity: 0 }}>두 사람의 이야기</p>
                <div className="w-16 h-px bg-white/50 mx-auto my-6 split-reveal" style={{ animationDelay: '1.4s' }} />
                <p className="text-white/60 text-sm slide-in-right-delay" style={{ animationDelay: '1.8s' }}>저희의 시작에 함께해 주세요</p>
                <ScrollIndicator />
              </div>
            </div>
          )}

          {/* 13. 시네마틱 인트로 (현재 템플릿) */}
          {activeDemo === 'cinematic' && (
            <div className="relative h-[680px] overflow-hidden bg-black">
              {/* 배경 이미지 - 흑백 + 줌아웃 */}
              <div
                className="absolute inset-0 cinematic-bg-reveal"
                style={{
                  backgroundImage: 'url(https://images.unsplash.com/photo-1519741497674-611481863552?w=800)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'grayscale(100%)',
                  transformOrigin: 'center center',
                }}
              />
              {/* 어두운 오버레이 */}
              <div className="absolute inset-0 bg-black/50" />
              {/* 콘텐츠 */}
              <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
                {/* 가로 바 */}
                <div className="cinematic-line-reveal mb-5" />
                {/* WELCOME TO OUR WEDDING */}
                <p
                  className="text-[16px] text-white uppercase cinematic-text-reveal whitespace-nowrap"
                  style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif" }}
                >
                  Welcome to our wedding
                </p>
                {/* 날짜 */}
                <p
                  className="text-[12px] mt-3.5 cinematic-subtext-reveal"
                  style={{
                    fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                    color: 'rgba(255, 255, 255, 0.6)',
                    letterSpacing: '2px',
                  }}
                >
                  May 24, 2025
                </p>
              </div>
              <ScrollIndicator />
            </div>
          )}

          {/* 기본 안내 */}
          {!activeDemo && (
            <div className="h-[680px] flex flex-col items-center justify-center text-gray-500 bg-gray-800">
              <p className="text-base mb-2">상단 버튼을 클릭하여</p>
              <p className="text-base">애니메이션을 테스트하세요</p>
            </div>
          )}

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
