"use client";

import { useRef, useState, useEffect, type RefObject } from "react";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useMotionValue,
  animate,
} from "framer-motion";
import type { ThankYouData, CropData, BackgroundImageSettings } from "./types";
import { SAMPLE_DATA } from "./types";

/* ───────── font mapping ───────── */

export type ThankYouFontStyle = "classic" | "modern" | "romantic" | "contemporary" | "luxury" | "gulim" | "adulthand" | "neathand" | "roundhand" | "roundgothic" | "suit" | "myungjo";

const FONT_MAP: Record<ThankYouFontStyle, { korean: string; english: string }> = {
  classic: {
    korean: "'Ridibatang', var(--font-noto-serif-kr), serif",
    english: "var(--font-montserrat), sans-serif",
  },
  modern: {
    korean: "'Pretendard', var(--font-noto-sans-kr), sans-serif",
    english: "var(--font-montserrat), sans-serif",
  },
  romantic: {
    korean: "'Okticon', var(--font-gowun-batang), serif",
    english: "var(--font-lora), serif",
  },
  contemporary: {
    korean: "'JeonnamEducationBarun', var(--font-noto-sans-kr), sans-serif",
    english: "var(--font-montserrat), sans-serif",
  },
  luxury: {
    korean: "'ELandChoice', var(--font-noto-serif-kr), serif",
    english: "var(--font-montserrat), sans-serif",
  },
  gulim: {
    korean: "'JoseonGulim', var(--font-noto-serif-kr), serif",
    english: "var(--font-montserrat), sans-serif",
  },
  adulthand: {
    korean: "'GangwonEducationModuche', sans-serif",
    english: "var(--font-montserrat), sans-serif",
  },
  neathand: {
    korean: "'OmuDaye', sans-serif",
    english: "var(--font-montserrat), sans-serif",
  },
  roundhand: {
    korean: "'OngleipKonkon', sans-serif",
    english: "var(--font-montserrat), sans-serif",
  },
  roundgothic: {
    korean: "'NanumSquareRound', sans-serif",
    english: "var(--font-montserrat), sans-serif",
  },
  suit: {
    korean: "'Suit', sans-serif",
    english: "var(--font-montserrat), sans-serif",
  },
  myungjo: {
    korean: "'ChosunIlboMyungjo', serif",
    english: "var(--font-montserrat), sans-serif",
  },
};

/* ───────── accent → light bg tint ───────── */

function accentToBg(hex: string, opacity = 0.07): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

function accentGradient(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // soft warm wash: light cream top → richer peach bottom (like watercolor paper)
  return `linear-gradient(170deg, rgba(${r},${g},${b},0.12) 0%, rgba(${r},${g},${b},0.18) 40%, rgba(${r},${g},${b},0.28) 100%)`;
}

/* ───────── cropped image ───────── */

function CroppedImage({
  src, alt, crop, fill, priority, sizes, className,
}: {
  src: string; alt: string; crop?: CropData;
  fill?: boolean; priority?: boolean; sizes?: string; className?: string;
}) {
  const cx = crop?.cropX ?? 0;
  const cy = crop?.cropY ?? 0;
  const cw = crop?.cropWidth ?? 1;
  const ch = crop?.cropHeight ?? 1;
  const hasCrop = cw > 0 && cw < 1;

  if (!hasCrop) {
    return <Image src={src} alt={alt} fill={fill} priority={priority} sizes={sizes} className={className} />;
  }

  const centerX = cx + cw / 2;
  const centerY = cy + ch / 2;
  const scaleX = 1 / cw;
  const scaleY = 1 / ch;
  const scale = Math.max(scaleX, scaleY);

  return (
    <img
      src={src}
      alt={alt}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: `${centerX * 100}% ${centerY * 100}%`,
        transform: `scale(${scale})`,
        transformOrigin: `${centerX * 100}% ${centerY * 100}%`,
      }}
    />
  );
}

/* ───────── seal filter ───────── */

function hexToSealFilter(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }
  if (s < 0.05) {
    const grayBright = Math.max(0.3, Math.min(2.5, l * 2.5));
    return `grayscale(1) brightness(${grayBright.toFixed(2)})`;
  }
  const hueRotate = h - 30;
  if (l > 0.6) {
    const sepiaAmount = Math.max(0.15, 1 - (l - 0.6) * 2);
    const saturate = Math.max(1, Math.min(4, s * 6));
    const brightness = Math.max(1.0, Math.min(2.0, 0.6 + l * 1.4));
    return `sepia(${sepiaAmount.toFixed(2)}) saturate(${saturate.toFixed(1)}) hue-rotate(${Math.round(hueRotate)}deg) brightness(${brightness.toFixed(2)})`;
  }
  const saturate = Math.max(0.8, Math.min(5, s * 5));
  const brightness = Math.max(0.5, Math.min(1.1, 0.4 + l * 0.7));
  return `sepia(1) saturate(${saturate.toFixed(1)}) hue-rotate(${Math.round(hueRotate)}deg) brightness(${brightness.toFixed(2)})`;
}

/* ───────── helpers ───────── */

/** Clamped linear interpolation — safe from framer-motion extrapolation */
function lerp(start: number, end: number, from: number, to: number) {
  return (v: number) => {
    if (v <= start) return from;
    if (v >= end) return to;
    return from + ((v - start) / (end - start)) * (to - from);
  };
}

/* ───────── component ───────── */

export type IntroMode = "auto" | "compact" | "tap";

interface ThankYouPageProps {
  data?: ThankYouData;
  fontStyle?: ThankYouFontStyle;
  accentColor?: string;
  sealColor?: string;
  scrollContainerRef?: RefObject<HTMLElement | null>;
  introMode?: IntroMode;
}

export default function ThankYouPage({
  data = SAMPLE_DATA,
  fontStyle = "classic",
  accentColor = "#B89878",
  sealColor = "#722F37",
  scrollContainerRef,
  introMode = "auto",
}: ThankYouPageProps) {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const fonts = FONT_MAP[fontStyle];
  const isEmbedded = !!scrollContainerRef;

  // 미리보기(내장) 모드: 스크롤 컨테이너 높이 측정
  const [containerH, setContainerH] = useState(0);
  useEffect(() => {
    if (!scrollContainerRef?.current) return;
    const measure = () => setContainerH(scrollContainerRef.current?.clientHeight || 0);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(scrollContainerRef.current);
    return () => ro.disconnect();
  }, [scrollContainerRef]);

  // ── 인트로 모드별 상태 관리 ──
  const [scrollLocked, setScrollLocked] = useState(true);
  const [introFadedOut, setIntroFadedOut] = useState(false);    // A,C 모드: 텍스트 자동/수동 페이드아웃 완료
  const [tapReady, setTapReady] = useState(false);               // C 모드: "터치하세요" 표시 여부
  const autoIntroOpacity = useMotionValue(1);                     // A,C 모드: JS 애니메이션으로 텍스트 opacity 제어

  // 텍스트 애니메이션 완료 대기 (공통: 3.3초)
  useEffect(() => {
    const textDone = setTimeout(() => {
      if (introMode === "auto") {
        // A: 텍스트 2초 머물다 자동 페이드아웃
        const autoFade = setTimeout(() => {
          animate(autoIntroOpacity, 0, { duration: 0.8, ease: "easeOut" });
          setTimeout(() => {
            setIntroFadedOut(true);
            setScrollLocked(false);
          }, 800);
        }, 1500);
        return () => clearTimeout(autoFade);
      } else if (introMode === "compact") {
        // B: 바로 스크롤 해제 (스크롤로 fade-out)
        setScrollLocked(false);
      } else if (introMode === "tap") {
        // C: "터치하세요" 표시
        setTapReady(true);
      }
    }, 3500);
    return () => clearTimeout(textDone);
  }, [introMode, autoIntroOpacity]);

  // C 모드: 터치 핸들러
  const handleTapToContinue = () => {
    if (introMode !== "tap" || !tapReady) return;
    setTapReady(false);
    animate(autoIntroOpacity, 0, { duration: 0.6, ease: "easeOut" });
    setTimeout(() => {
      setIntroFadedOut(true);
      setScrollLocked(false);
    }, 600);
  };

  // 스크롤 컨테이너 또는 window의 스크롤 차단
  useEffect(() => {
    if (!scrollLocked) return;
    if (isEmbedded && scrollContainerRef?.current) {
      const el = scrollContainerRef.current;
      el.style.overflow = "hidden";
      return () => { el.style.overflow = ""; };
    } else {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [scrollLocked, isEmbedded, scrollContainerRef]);

  const stageHeight = isEmbedded && containerH > 0 ? `${containerH}px` : "100dvh";
  const scrollLength = isEmbedded && containerH > 0 ? `${containerH * 12}px` : "1200vh";

  const { scrollYProgress: p } = useScroll({
    target: containerRef,
    ...(scrollContainerRef ? { container: scrollContainerRef } : {}),
    offset: ["start start", "end end"],
  });

  /* ═══════════════════════════════════════════════
   * TIMELINE (1200vh scroll)
   *
   * 0.00–0.06  Phase 1  Intro text (auto-animated)
   * 0.06–0.12  Phase 2  Text fade-out (빠르게)
   * 0.14–0.30  Phase 3  Photo shrinks → polaroid (card 1)
   * 0.32–0.46  Phase 4  Card 2 enters
   * 0.48–0.58  Phase 5  Card 3 enters
   * 0.62–0.72  Phase 6  Curtain closes
   * 0.76–0.94  Phase 7  Thank-you text (5 lines)
   * ═══════════════════════════════════════════════ */

  // ── Phase 1: Auto-animated text reveal (no scroll needed) ──
  const autoFadeIn = (delay: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay, ease: "easeOut" as const },
  });
  const scrollHintOpacity = useTransform(p, lerp(0.02, 0.05, 1, 0));

  // ── Phase 2: Text fade-out — 모드별 다르게 동작 ──
  // B(compact): 스크롤 0.01~0.04로 빠르게 fade-out
  const scrollIntroOpacity = useTransform(p,
    introMode === "compact" ? lerp(0.01, 0.04, 1, 0) : lerp(0.06, 0.12, 1, 0)
  );
  // A,C: autoIntroOpacity (JS 애니메이션)로 제어, B: scrollIntroOpacity로 제어
  const introOpacity = introMode === "compact" ? scrollIntroOpacity : autoIntroOpacity;
  const introVisibility = useTransform(p, (v) => {
    if (introMode !== "compact" && introFadedOut) return "hidden" as const;
    if (introMode === "compact" && v >= 0.05) return "hidden" as const;
    return "visible" as const;
  });

  /* ── 모드별 타임라인 ──
   * default:  텍스트 0.06-0.12 → 사진 0.14-0.30 → 카드2 0.34-0.46 → ...
   * auto(A):  텍스트 자동fade → 사진 0.04-0.16 → 카드2 0.20-0.32 → ...
   * compact(B): 텍스트 0.01-0.04 → 사진 0.05-0.15 → 카드2 0.17-0.25 → ...
   */
  const A = introMode === "auto";
  const B = introMode === "compact";

  // ── Phase 3: Photo shrinks → polaroid ──
  const heroScale    = useTransform(p, lerp(B ? 0.05 : A ? 0.04 : 0.14, B ? 0.15 : A ? 0.16 : 0.30, 1.65, 0.62));
  const overlayOpacity = useTransform(p, lerp(B ? 0.05 : A ? 0.04 : 0.14, B ? 0.09 : A ? 0.08 : 0.20, 1, 0));
  const bgOpacity    = useTransform(p, lerp(B ? 0.05 : A ? 0.04 : 0.14, B ? 0.09 : A ? 0.08 : 0.20, 0, 1));
  const heroPadding  = useTransform(p, lerp(B ? 0.07 : A ? 0.06 : 0.18, B ? 0.13 : A ? 0.14 : 0.28, 0, 10));
  const heroShadow   = useTransform(p, (v) => {
    const s = B ? 0.09 : A ? 0.08 : 0.20, e = B ? 0.15 : A ? 0.16 : 0.30;
    const t = Math.max(0, Math.min(1, (v - s) / (e - s)));
    return `0 ${t * 8}px ${t * 32}px rgba(0,0,0,${t * 0.15})`;
  });
  const heroRotation   = useTransform(p, lerp(B ? 0.11 : A ? 0.11 : 0.24, B ? 0.15 : A ? 0.16 : 0.30, 0, -3));
  const captionHeight  = useTransform(p, lerp(B ? 0.12 : A ? 0.12 : 0.26, B ? 0.15 : A ? 0.16 : 0.30, 0, 65));
  const captionOpacity = useTransform(p, lerp(B ? 0.13 : A ? 0.14 : 0.28, B ? 0.16 : A ? 0.18 : 0.32, 0, 1));
  const heroY          = useTransform(p, lerp(B ? 0.15 : A ? 0.16 : 0.30, B ? 0.22 : A ? 0.28 : 0.44, 0, -150));

  // ── Phase 4: Card 2 enters (A=카드1 직후 빠르게) ──
  const card2Opacity = useTransform(p, lerp(B ? 0.17 : A ? 0.24 : 0.34, B ? 0.20 : A ? 0.27 : 0.38, 0, 1));
  const card2Y       = useTransform(p, lerp(B ? 0.17 : A ? 0.24 : 0.34, B ? 0.25 : A ? 0.36 : 0.46, 400, 10));
  const card2Rotate  = useTransform(p, lerp(B ? 0.18 : A ? 0.26 : 0.36, B ? 0.25 : A ? 0.36 : 0.46, 10, 3));
  const card2X       = useTransform(p, lerp(B ? 0.18 : A ? 0.26 : 0.36, B ? 0.25 : A ? 0.36 : 0.46, 50, 24));

  // ── Phase 5: Card 3 enters (A=카드2 직후) ──
  const card3Opacity = useTransform(p, lerp(B ? 0.27 : A ? 0.38 : 0.48, B ? 0.30 : A ? 0.41 : 0.52, 0, 1));
  const card3Y       = useTransform(p, lerp(B ? 0.27 : A ? 0.38 : 0.48, B ? 0.35 : A ? 0.46 : 0.58, 400, 110));
  const card3Rotate  = useTransform(p, lerp(B ? 0.28 : A ? 0.39 : 0.50, B ? 0.35 : A ? 0.46 : 0.58, -10, -5));
  const card3X       = useTransform(p, lerp(B ? 0.28 : A ? 0.39 : 0.50, B ? 0.35 : A ? 0.46 : 0.58, -40, 15));

  // ── Phase 6: Tracing paper (A=카드3 직후 바로 시작) ──
  const tracingS = B ? 0.38 : A ? 0.48 : 0.62, tracingE = B ? 0.46 : A ? 0.56 : 0.72;
  const tracingTopY = useTransform(p, (v) => {
    const t = Math.max(0, Math.min(1, (v - tracingS) / (tracingE - tracingS)));
    return `${-(1 - t) * 100}%`;
  });
  const tracingBottomY = useTransform(p, (v) => {
    const t = Math.max(0, Math.min(1, (v - tracingS) / (tracingE - tracingS)));
    return `${(1 - t) * 100}%`;
  });
  const tracingOpacity = useTransform(p, lerp(B ? 0.38 : A ? 0.48 : 0.62, B ? 0.42 : A ? 0.52 : 0.68, 0, 1));

  // ── Phase 6.5: Sealing stamp (A=커튼 직후) ──
  const sealScale  = useTransform(p, lerp(B ? 0.46 : A ? 0.56 : 0.72, B ? 0.49 : A ? 0.59 : 0.75, 0.5, 1));
  const sealOpacity = useTransform(p, lerp(B ? 0.46 : A ? 0.56 : 0.72, B ? 0.49 : A ? 0.59 : 0.75, 0, 1));
  const sealRotate = useTransform(p, lerp(B ? 0.46 : A ? 0.56 : 0.72, B ? 0.49 : A ? 0.59 : 0.75, -30, 0));

  // ── Phase 7: Card + ending text (기존) ──
  const cardScale       = useTransform(p, lerp(B ? 0.50 : 0.76, B ? 0.53 : 0.80, 0.9, 1));
  const cardOpacity     = useTransform(p, lerp(B ? 0.50 : 0.76, B ? 0.53 : 0.80, 0, 1));
  const endLine1Opacity = useTransform(p, lerp(B ? 0.54 : 0.80, B ? 0.57 : 0.83, 0, 1));
  const endLine1Y       = useTransform(p, lerp(B ? 0.54 : 0.80, B ? 0.57 : 0.83, 16, 0));
  const endLine2Opacity = useTransform(p, lerp(B ? 0.57 : 0.83, B ? 0.60 : 0.86, 0, 1));
  const endLine2Y       = useTransform(p, lerp(B ? 0.57 : 0.83, B ? 0.60 : 0.86, 16, 0));
  const endLine3Opacity = useTransform(p, lerp(B ? 0.60 : 0.86, B ? 0.63 : 0.89, 0, 1));
  const endLine3Y       = useTransform(p, lerp(B ? 0.60 : 0.86, B ? 0.63 : 0.89, 16, 0));
  const endLine4Opacity = useTransform(p, lerp(B ? 0.63 : 0.89, B ? 0.66 : 0.92, 0, 1));
  const endLine4Y       = useTransform(p, lerp(B ? 0.63 : 0.89, B ? 0.66 : 0.92, 16, 0));
  const endLine5Opacity = useTransform(p, lerp(B ? 0.66 : 0.92, B ? 0.69 : 0.95, 0, 1));
  const endLine5Y       = useTransform(p, lerp(B ? 0.66 : 0.92, B ? 0.69 : 0.95, 16, 0));

  // ── Photo share popup (글 끝나고 충분한 텀 후) ──
  const photoShareTrigger = B ? 0.76 : 0.99;
  const [showPhotoShare, setShowPhotoShare] = useState(false);
  const [photoShareDismissed, setPhotoShareDismissed] = useState(false);
  useEffect(() => {
    if (!data.photoShare?.enabled || !data.photoShare?.url || photoShareDismissed) return;
    const unsubscribe = p.on("change", (v: number) => {
      if (v >= photoShareTrigger && !showPhotoShare) setShowPhotoShare(true);
    });
    return unsubscribe;
  }, [p, data.photoShare, showPhotoShare, photoShareDismissed, photoShareTrigger]);

  if (prefersReducedMotion) {
    return <ReducedMotionView data={data} fontStyle={fontStyle} accentColor={accentColor} />;
  }

  return (
    <div
      ref={containerRef}
      className="relative mx-auto"
      style={{ height: scrollLength, maxWidth: 430 }}
    >
      {/* ═══ Single Sticky Stage ═══ */}
      <div className="sticky top-0 w-full overflow-hidden" style={{ height: stageHeight }}>

        {/* ── BG: background behind shrinking photo ── */}
        <motion.div
          className="absolute inset-0"
          style={{ opacity: bgOpacity, background: accentGradient(accentColor) }}
        >
          {data.backgroundImage && (
            <BackgroundImage
              src={data.backgroundImage}
              settings={data.backgroundImageSettings}
            />
          )}
        </motion.div>

        {/* ═══ LAYER A — Hero image → Polaroid card ═══
            Separate from text — no shared transform.
            z-10 so cards stack above it.
        */}
        <motion.div
          className="absolute inset-0 z-10 flex items-center justify-center"
          style={{ y: heroY }}
        >
          <motion.div
            className="relative bg-white"
            style={{
              scale: heroScale,
              padding: heroPadding,
              boxShadow: heroShadow,
              rotate: heroRotation,
              borderRadius: 2,
              width: "100%",
              maxWidth: 430,
              transformOrigin: "center center",
            }}
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden">
              <CroppedImage
                src={data.heroImage}
                alt="Wedding"
                crop={data.heroCrop}
                fill
                priority
                sizes="(max-width: 430px) 100vw, 430px"
                className="object-cover"
              />
              <motion.div
                className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/50"
                style={{ opacity: overlayOpacity }}
              />
            </div>
            <motion.div
              className="flex items-center justify-center overflow-hidden"
              style={{ height: captionHeight }}
            >
              <motion.p
                className="text-[23px] tracking-wide whitespace-nowrap"
                style={{
                  opacity: captionOpacity,
                  color: "#7A7570",
                  fontFamily: fonts.korean,
                }}
              >
                {data.polaroids[0].caption}
              </motion.p>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* ═══ LAYER B — Intro text (completely separate from image) ═══
            z-30 above the image. visibility: hidden after fade completes
            so it never leaks into later phases.
        */}
        <motion.div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center px-8"
          style={{
            opacity: introOpacity,
            visibility: introVisibility,
            pointerEvents: "none",
          }}
        >
          {/* Line 1: "Thank You" */}
          <motion.p
            className="mb-4 text-sm tracking-[0.3em] uppercase"
            style={{
              color: "rgba(255,255,255,0.8)",
              fontFamily: fonts.english,
            }}
            {...autoFadeIn(0.5)}
          >
            Thank You
          </motion.p>

          {/* Line 2: Couple names */}
          <motion.h1
            className="mb-4 text-2xl font-medium tracking-wide text-white"
            style={{
              fontFamily: fonts.korean,
            }}
            {...autoFadeIn(1.0)}
          >
            {data.coupleNames}
          </motion.h1>

          {/* Line 3: Date */}
          <motion.p
            className="mb-2 text-sm tracking-wider text-white/70"
            style={{
              fontFamily: fonts.english,
            }}
            {...autoFadeIn(1.5)}
          >
            {data.date}
          </motion.p>

          {/* Line 4: Short message */}
          <motion.p
            className="mt-6 text-base font-light leading-relaxed text-white/90 whitespace-pre-line"
            style={{
              fontFamily: fonts.korean,
            }}
            {...autoFadeIn(2.5)}
          >
            {data.heroMessage}
          </motion.p>

          {/* C 모드: "화면을 터치하세요" */}
          {introMode === "tap" && tapReady && (
            <motion.p
              className="mt-10 text-xs tracking-widest uppercase"
              style={{ color: "rgba(255,255,255,0.6)", fontFamily: fonts.english }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Tap to continue
            </motion.p>
          )}
        </motion.div>

        {/* C 모드: 터치 영역 (텍스트 위에 투명 오버레이) */}
        {introMode === "tap" && tapReady && (
          <div
            className="absolute inset-0 z-50 cursor-pointer"
            onClick={handleTapToContinue}
          />
        )}

        {/* ═══ LAYER C — Card 2 ═══ z-20 */}
        <motion.div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <motion.div
            className="bg-white"
            style={{
              y: card2Y,
              x: card2X,
              opacity: card2Opacity,
              rotate: card2Rotate,
              width: "62%",
              maxWidth: 267,
              padding: 10,
              boxShadow: "0 6px 24px rgba(0,0,0,0.10)",
              borderRadius: 2,
            }}
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden">
              <CroppedImage
                src={data.polaroids[1].image}
                alt={data.polaroids[1].caption}
                crop={data.polaroids[1].crop}
                fill
                sizes="(max-width: 430px) 62vw, 267px"
                className="object-cover"
              />
            </div>
            <div className="h-10 flex items-center justify-center">
              <p
                className="text-sm tracking-wide"
                style={{
                  color: "#7A7570",
                  fontFamily: fonts.korean,
                }}
              >
                {data.polaroids[1].caption}
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* ═══ LAYER D — Card 3 ═══ z-25 */}
        <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 25 }}>
          <motion.div
            className="bg-white"
            style={{
              y: card3Y,
              x: card3X,
              opacity: card3Opacity,
              rotate: card3Rotate,
              width: "62%",
              maxWidth: 267,
              padding: 10,
              boxShadow: "0 6px 24px rgba(0,0,0,0.10)",
              borderRadius: 2,
            }}
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden">
              <CroppedImage
                src={data.polaroids[2].image}
                alt={data.polaroids[2].caption}
                crop={data.polaroids[2].crop}
                fill
                sizes="(max-width: 430px) 62vw, 267px"
                className="object-cover"
              />
            </div>
            <div className="h-10 flex items-center justify-center">
              <p
                className="text-sm tracking-wide"
                style={{
                  color: "#7A7570",
                  fontFamily: fonts.korean,
                }}
              >
                {data.polaroids[2].caption}
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* ═══ LAYER E — Tracing paper (유산지) ═══ z-40
            White translucent panels with blur, overlapping slightly
        */}
        <motion.div
          className="absolute left-0 w-full z-40"
          style={{
            top: 0,
            height: "55%",
            y: tracingTopY,
            opacity: tracingOpacity,
            background: "linear-gradient(to bottom, rgba(255,255,255,0.92) 60%, rgba(255,255,255,0.85))",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            transformOrigin: "center top",
          }}
        />
        <motion.div
          className="absolute left-0 w-full z-40"
          style={{
            bottom: 0,
            height: "55%",
            y: tracingBottomY,
            opacity: tracingOpacity,
            background: "linear-gradient(to top, rgba(255,255,255,0.92) 60%, rgba(255,255,255,0.85))",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            transformOrigin: "center bottom",
          }}
        />
        {/* 겹침 부분 중앙 라인 — 유산지 접힌 자국 */}
        <motion.div
          className="absolute left-[10%] right-[10%] z-40"
          style={{
            top: "50%",
            height: 1,
            opacity: tracingOpacity,
            background: "linear-gradient(to right, transparent, rgba(0,0,0,0.06) 20%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.06) 80%, transparent)",
          }}
        />

        {/* ═══ LAYER F — Card + Sealing wrapper ═══ z-50 */}
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
          <motion.div
            className="relative"
            style={{
              scale: cardScale,
              opacity: cardOpacity,
              width: "85%",
              maxWidth: 360,
            }}
          >
            {/* 실링 — 카드 상단 가장자리에 걸침 */}
            <motion.div
              className="absolute left-1/2 z-10 pointer-events-none"
              style={{
                top: -40,
                marginLeft: -48,
                width: 96,
                height: 96,
                opacity: sealOpacity,
                scale: sealScale,
                rotate: sealRotate,
                filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.3))",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/shilling-gray.png"
                alt="seal"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  filter: hexToSealFilter(sealColor),
                }}
              />
            </motion.div>
            {/* 카드 본체 */}
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 16,
                boxShadow: "0 4px 30px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.03)",
                padding: "40px 28px 36px",
              }}
            >
            {/* 장식 라인 */}
            <div style={{
              width: 40,
              height: 1,
              background: `${accentColor}50`,
              margin: "0 auto 24px",
            }} />

            {/* 감사합니다. */}
            <motion.p
              className="mb-6 text-lg font-medium tracking-wider text-center"
              style={{
                opacity: endLine1Opacity,
                y: endLine1Y,
                color: "#3D3530",
                fontFamily: fonts.korean,
              }}
            >
              {data.closingLines[0]}
            </motion.p>
            {/* 본문 1 */}
            <motion.p
              className="mb-4 text-sm font-light leading-relaxed tracking-wide text-center whitespace-pre-line"
              style={{
                opacity: endLine2Opacity,
                y: endLine2Y,
                color: "#6B5E56",
                fontFamily: fonts.korean,
              }}
            >
              {data.closingLines[1]}
            </motion.p>
            {/* 본문 2 */}
            <motion.p
              className="mb-4 text-sm font-light leading-relaxed tracking-wide text-center whitespace-pre-line"
              style={{
                opacity: endLine3Opacity,
                y: endLine3Y,
                color: "#6B5E56",
                fontFamily: fonts.korean,
              }}
            >
              {data.closingLines[2]}
            </motion.p>
            {/* 본문 3 */}
            <motion.p
              className="mb-6 text-sm font-light leading-relaxed tracking-wide text-center whitespace-pre-line"
              style={{
                opacity: endLine4Opacity,
                y: endLine4Y,
                color: "#6B5E56",
                fontFamily: fonts.korean,
              }}
            >
              {data.closingLines[3]}
            </motion.p>

            {/* 장식 라인 */}
            <div style={{
              width: 40,
              height: 1,
              background: `${accentColor}50`,
              margin: "0 auto 16px",
            }} />

            {/* 올림 */}
            <motion.p
              className="text-xs tracking-[0.2em] text-center"
              style={{
                opacity: endLine5Opacity,
                y: endLine5Y,
                color: accentColor,
                fontFamily: fonts.korean,
              }}
            >
              {data.closingLines[4]}
            </motion.p>
            </div>{/* end card body */}

            {/* 사진공유하러가기 버튼 — 팝업 닫은 후 표시 */}
            {photoShareDismissed && data.photoShare?.enabled && data.photoShare?.url && (
              <motion.div
                className="mt-5 flex justify-center pointer-events-auto"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <a
                  href={data.photoShare.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium text-white transition-opacity hover:opacity-90"
                  style={{ background: accentColor, boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                  사진 공유하러 가기
                </a>
              </motion.div>
            )}
          </motion.div>{/* end card+seal wrapper */}
        </div>

        {/* ═══ Scroll Hint ═══ z-35 — 텍스트 애니메이션 후에만 표시 */}
        {!scrollLocked && (
        <>
        {/* 블랙 오버레이 — 스크롤 시작하면 사라짐 */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          style={{ opacity: scrollHintOpacity, zIndex: 34, background: "rgba(0,0,0,0.35)" }}
        />
        {/* 스크롤 유도 UI */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ opacity: scrollHintOpacity, zIndex: 35 }}
        >
          <span
            className="text-base tracking-wider"
            style={{
              color: "rgba(255,255,255,0.9)",
              fontFamily: fonts.korean,
            }}
          >
            아래로 스크롤 내려보세요
          </span>
          {/* 손가락 스와이프 애니메이션 */}
          <motion.div
            className="mt-5 flex flex-col items-center"
            animate={{ y: [0, -20, 0] }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <svg width="36" height="52" viewBox="0 0 36 52" fill="none">
              {/* 손가락 아이콘 */}
              <ellipse cx="18" cy="10" rx="7" ry="9" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
              <rect x="11" y="10" width="14" height="18" rx="7" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
            </svg>
          </motion.div>
          {/* 아래 방향 쉐브론 3개 페이드 */}
          <div className="mt-2 flex flex-col items-center gap-0">
            <motion.svg width="24" height="12" viewBox="0 0 24 12" fill="none"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: 0 }}
            >
              <path d="M4 2l8 8 8-8" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
            <motion.svg width="24" height="12" viewBox="0 0 24 12" fill="none"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: 0.3 }}
            >
              <path d="M4 2l8 8 8-8" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
            <motion.svg width="24" height="12" viewBox="0 0 24 12" fill="none"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: 0.6 }}
            >
              <path d="M4 2l8 8 8-8" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
          </div>
        </motion.div>
        </>
        )}

        {/* ═══ Photo Share Popup ═══ */}
        {showPhotoShare && data.photoShare?.enabled && data.photoShare?.url && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            style={{ zIndex: 60 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              className="relative mx-6 w-full max-w-[320px] bg-white rounded-2xl shadow-2xl overflow-hidden"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
            >
              {/* Close button */}
              <button
                onClick={() => { setShowPhotoShare(false); setPhotoShareDismissed(true); }}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors z-10"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>

              {/* Icon */}
              <div className="pt-8 pb-4 flex justify-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: `${accentColor}18` }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                </div>
              </div>

              {/* Message */}
              <div className="px-6 pb-6 text-center">
                <p
                  className="text-sm leading-relaxed whitespace-pre-line mb-6"
                  style={{ color: '#4A4A4A', fontFamily: fonts.korean }}
                >
                  {data.photoShare.message}
                </p>

                {/* CTA Button */}
                <a
                  href={data.photoShare.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3.5 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90"
                  style={{ background: accentColor }}
                >
                  {data.photoShare.buttonText || '사진 공유하기'}
                </a>

                <button
                  onClick={() => { setShowPhotoShare(false); setPhotoShareDismissed(true); }}
                  className="mt-3 text-xs text-gray-400 hover:text-gray-500 transition-colors"
                >
                  닫기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function ReducedMotionView({ data, fontStyle = "classic", accentColor = "#B89878" }: { data: ThankYouData; fontStyle?: ThankYouFontStyle; accentColor?: string }) {
  const fonts = FONT_MAP[fontStyle];
  return (
    <div
      className="mx-auto flex min-h-dvh flex-col items-center justify-center px-8 py-16"
      style={{ maxWidth: 430, background: accentGradient(accentColor) }}
    >
      <div style={{
        background: "#FFFFFF",
        borderRadius: 16,
        boxShadow: "0 4px 30px rgba(0,0,0,0.06)",
        padding: "40px 28px 36px",
        width: "100%",
        maxWidth: 360,
      }}>
        <div style={{ width: 40, height: 1, background: `${accentColor}50`, margin: "0 auto 24px" }} />
        <p
          className="mb-6 text-lg font-medium tracking-wider text-center"
          style={{ color: "#3D3530", fontFamily: fonts.korean }}
        >
          {data.closingLines[0]}
        </p>
        <p
          className="mb-6 text-sm font-light leading-relaxed tracking-wide text-center whitespace-pre-line"
          style={{ color: "#6B5E56", fontFamily: fonts.korean }}
        >
          {data.closingLines.slice(1, -1).filter(Boolean).join("\n\n")}
        </p>
        <div style={{ width: 40, height: 1, background: `${accentColor}50`, margin: "0 auto 16px" }} />
        <p
          className="text-xs tracking-[0.2em] text-center"
          style={{ color: accentColor, fontFamily: fonts.korean }}
        >
          {data.closingLines[data.closingLines.length - 1]}
        </p>
      </div>

      {/* Photo share (reduced motion) */}
      {data.photoShare?.enabled && data.photoShare?.url && (
        <div className="mt-8 text-center">
          <p
            className="text-sm leading-relaxed whitespace-pre-line mb-4"
            style={{ color: "#6B5E56", fontFamily: fonts.korean }}
          >
            {data.photoShare.message}
          </p>
          <a
            href={data.photoShare.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-3 rounded-xl text-white text-sm font-medium"
            style={{ background: accentColor }}
          >
            {data.photoShare.buttonText || '사진 공유하기'}
          </a>
        </div>
      )}
    </div>
  );
}

/* ───────── background image helper ───────── */

function BackgroundImage({ src, settings }: { src: string; settings?: BackgroundImageSettings }) {
  const cx = settings?.cropX ?? 0;
  const cy = settings?.cropY ?? 0;
  const cw = settings?.cropWidth ?? 1;
  const ch = settings?.cropHeight ?? 1;
  const hasCrop = cw < 0.99 || ch < 0.99;

  const centerX = cx + cw / 2;
  const centerY = cy + ch / 2;
  const scaleValX = hasCrop ? 1 / cw : 1;
  const scaleValY = hasCrop ? 1 / ch : 1;
  const posX = hasCrop ? centerX * 100 : 50;
  const posY = hasCrop ? centerY * 100 : 50;

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: `${posX}% ${posY}%`,
          transform: hasCrop ? `scale(${Math.max(scaleValX, scaleValY)})` : undefined,
          transformOrigin: `${posX}% ${posY}%`,
        }}
      />
      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.08)" }} />
    </div>
  );
}
