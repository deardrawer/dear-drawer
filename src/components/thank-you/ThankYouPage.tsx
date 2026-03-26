"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import type { ThankYouData } from "./types";
import { SAMPLE_DATA } from "./types";

/* ───────── helpers ───────── */

/** Clamped linear interpolation — safe from framer-motion extrapolation */
function lerp(start: number, end: number, from: number, to: number) {
  return (v: number) => {
    if (v <= start) return from;
    if (v >= end) return to;
    return from + ((v - start) / (end - start)) * (to - from);
  };
}

/** clip-path reveal from left to right (handwriting feel) */
function clipReveal(start: number, end: number) {
  return (v: number) => {
    const t = Math.max(0, Math.min(1, (v - start) / (end - start)));
    return `inset(0 ${(1 - t) * 100}% 0 0)`;
  };
}

/* ───────── component ───────── */

interface ThankYouPageProps {
  data?: ThankYouData;
}

export default function ThankYouPage({
  data = SAMPLE_DATA,
}: ThankYouPageProps) {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress: p } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  /* ═══════════════════════════════════════════════
   * TIMELINE — 650vh scroll (6.5 viewport heights)
   *
   * 0.00–0.25  Phase 1  Intro text (handwriting reveal)
   * 0.25–0.38  Phase 2  Text fade-out (fully gone)
   * 0.38–0.55  Phase 3  Photo shrinks → polaroid (card 1)
   * 0.55–0.68  Phase 4  Card 2 enters
   * 0.68–0.80  Phase 5  Card 3 enters
   * 0.80–0.90  Phase 6  Curtain closes (top ↓ / bottom ↑)
   * 0.90–1.00  Phase 7  Thank-you text
   * ═══════════════════════════════════════════════ */

  // ── Phase 1: Auto-animated text reveal (no scroll needed) ──
  const autoFadeIn = (delay: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay, ease: "easeOut" as const },
  });
  const scrollHintOpacity = useTransform(p, lerp(0.02, 0.08, 1, 0));

  // ── Phase 2: Text fade-out ──
  const introOpacity = useTransform(p, lerp(0.25, 0.35, 1, 0));
  const introVisibility = useTransform(p, (v) =>
    v >= 0.36 ? "hidden" as const : "visible" as const
  );

  // ── Phase 3: Photo shrinks → polaroid ──
  // scale 1.65 fills viewport (390×520 × 1.65 ≈ 858px tall)
  // Shrinks to 0.78 → card ≈ 304px wide (78% of viewport) for strong presence
  const heroScale = useTransform(p, lerp(0.38, 0.55, 1.65, 0.78));
  const overlayOpacity = useTransform(p, lerp(0.38, 0.48, 1, 0));
  const bgOpacity = useTransform(p, lerp(0.38, 0.48, 0, 1));
  const heroPadding = useTransform(p, lerp(0.42, 0.53, 0, 10));
  const heroShadow = useTransform(p, (v) => {
    const t = Math.max(0, Math.min(1, (v - 0.44) / (0.55 - 0.44)));
    return `0 ${t * 8}px ${t * 32}px rgba(0,0,0,${t * 0.15})`;
  });
  const heroRotation = useTransform(p, lerp(0.48, 0.55, 0, -3));
  const captionHeight = useTransform(p, lerp(0.50, 0.55, 0, 40));
  const captionOpacity = useTransform(p, lerp(0.52, 0.57, 0, 1));
  // Push card 1 up further to make room for bigger stacking cards
  const heroY = useTransform(p, lerp(0.55, 0.68, 0, -150));

  // ── Phase 4: Card 2 enters (0.60–0.72) ──
  // 280px wide (72% viewport), offset right + lower — delayed after card 1
  const card2Opacity = useTransform(p, lerp(0.60, 0.65, 0, 1));
  const card2Y = useTransform(p, lerp(0.60, 0.72, 400, 50));
  const card2Rotate = useTransform(p, lerp(0.62, 0.72, 10, 3));
  const card2X = useTransform(p, lerp(0.62, 0.72, 50, 24));

  // ── Phase 5: Card 3 enters (0.73–0.84) ──
  // 280px wide, offset down-right — "last card tossed" feel, delayed after card 2
  const card3Opacity = useTransform(p, lerp(0.73, 0.78, 0, 1));
  const card3Y = useTransform(p, lerp(0.73, 0.84, 400, 170));
  const card3Rotate = useTransform(p, lerp(0.75, 0.84, -10, -5));
  const card3X = useTransform(p, lerp(0.75, 0.84, -40, 15));

  // ── Phase 6: Curtain — top ↓ / bottom ↑ (0.86–0.94) ──
  // Panels slide from off-screen (±50% of viewport) to center meeting point
  const curtainTopY = useTransform(p, (v) => {
    const t = Math.max(0, Math.min(1, (v - 0.86) / (0.94 - 0.86)));
    return `${-(1 - t) * 100}%`;
  });
  const curtainBottomY = useTransform(p, (v) => {
    const t = Math.max(0, Math.min(1, (v - 0.86) / (0.94 - 0.86)));
    return `${(1 - t) * 100}%`;
  });
  const curtainOpacity = useTransform(p, lerp(0.86, 0.90, 0, 1));

  // ── Phase 7: Ending text (0.96–1.0) — 5 lines, after curtain(0.94) + pause ──
  const endLine1Opacity = useTransform(p, lerp(0.96, 0.97, 0, 1));
  const endLine1Y = useTransform(p, lerp(0.96, 0.97, 24, 0));
  const endLine2Opacity = useTransform(p, lerp(0.97, 0.98, 0, 1));
  const endLine2Y = useTransform(p, lerp(0.97, 0.98, 24, 0));
  const endLine3Opacity = useTransform(p, lerp(0.98, 0.985, 0, 1));
  const endLine3Y = useTransform(p, lerp(0.98, 0.985, 24, 0));
  const endLine4Opacity = useTransform(p, lerp(0.985, 0.993, 0, 1));
  const endLine4Y = useTransform(p, lerp(0.985, 0.993, 24, 0));
  const endLine5Opacity = useTransform(p, lerp(0.993, 1.0, 0, 1));
  const endLine5Y = useTransform(p, lerp(0.993, 1.0, 24, 0));

  if (prefersReducedMotion) {
    return <ReducedMotionView data={data} />;
  }

  return (
    <div
      ref={containerRef}
      className="relative mx-auto"
      style={{ height: "800vh", maxWidth: 430 }}
    >
      {/* ═══ Single Sticky Stage ═══ */}
      <div className="sticky top-0 h-dvh w-full overflow-hidden">

        {/* ── BG: off-white behind shrinking photo ── */}
        <motion.div
          className="absolute inset-0"
          style={{ opacity: bgOpacity, backgroundColor: "#F5F3EF" }}
        />

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
              <Image
                src={data.heroImage}
                alt="Wedding"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 430px) 100vw, 430px"
              />
              <motion.div
                className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/10 to-black/45"
                style={{ opacity: overlayOpacity }}
              />
            </div>
            <motion.div
              className="flex items-center justify-center overflow-hidden"
              style={{ height: captionHeight }}
            >
              <motion.p
                className="text-sm tracking-wide whitespace-nowrap"
                style={{
                  opacity: captionOpacity,
                  color: "#7A7570",
                  fontFamily: "var(--font-noto-sans-kr), sans-serif",
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
              fontFamily: "var(--font-montserrat), sans-serif",
            }}
            {...autoFadeIn(0.5)}
          >
            Thank You
          </motion.p>

          {/* Line 2: Couple names */}
          <motion.h1
            className="mb-4 text-2xl font-medium tracking-wide text-white"
            style={{
              fontFamily: "var(--font-noto-sans-kr), sans-serif",
            }}
            {...autoFadeIn(1.0)}
          >
            {data.coupleNames}
          </motion.h1>

          {/* Line 3: Date */}
          <motion.p
            className="mb-2 text-sm tracking-wider text-white/70"
            style={{
              fontFamily: "var(--font-montserrat), sans-serif",
            }}
            {...autoFadeIn(1.5)}
          >
            {data.date}
          </motion.p>

          {/* Line 4: Short message */}
          <motion.p
            className="mt-6 text-base font-light leading-relaxed text-white/90"
            style={{
              fontFamily: "var(--font-noto-sans-kr), sans-serif",
            }}
            {...autoFadeIn(2.5)}
          >
            {data.heroMessage}
          </motion.p>
        </motion.div>

        {/* ═══ LAYER C — Card 2 ═══ z-20 */}
        <motion.div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <motion.div
            className="bg-white p-2.5"
            style={{
              y: card2Y,
              x: card2X,
              opacity: card2Opacity,
              rotate: card2Rotate,
              width: 280,
              boxShadow: "0 8px 28px rgba(0,0,0,0.12)",
              borderRadius: 2,
            }}
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden">
              <Image
                src={data.polaroids[1].image}
                alt={data.polaroids[1].caption}
                fill
                className="object-cover"
                sizes="280px"
              />
            </div>
            <div className="h-9 flex items-center justify-center">
              <p
                className="text-xs tracking-wide"
                style={{
                  color: "#7A7570",
                  fontFamily: "var(--font-noto-sans-kr), sans-serif",
                }}
              >
                {data.polaroids[1].caption}
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* ═══ LAYER D — Card 3 ═══ z-25
            Offset further down-left for fan-out with bigger cards.
        */}
        <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 25 }}>
          <motion.div
            className="bg-white p-2.5"
            style={{
              y: card3Y,
              x: card3X,
              opacity: card3Opacity,
              rotate: card3Rotate,
              width: 280,
              boxShadow: "0 8px 28px rgba(0,0,0,0.12)",
              borderRadius: 2,
            }}
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden">
              <Image
                src={data.polaroids[2].image}
                alt={data.polaroids[2].caption}
                fill
                className="object-cover"
                sizes="280px"
              />
            </div>
            <div className="h-9 flex items-center justify-center">
              <p
                className="text-xs tracking-wide"
                style={{
                  color: "#7A7570",
                  fontFamily: "var(--font-noto-sans-kr), sans-serif",
                }}
              >
                {data.polaroids[2].caption}
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* ═══ LAYER E — Curtain (top ↓ / bottom ↑) ═══ z-40 */}
        <motion.div
          className="absolute left-0 w-full z-40"
          style={{
            top: 0,
            height: "50%",
            y: curtainTopY,
            opacity: curtainOpacity,
            backgroundColor: "#2C2C2C",
            transformOrigin: "center top",
          }}
        />
        <motion.div
          className="absolute left-0 w-full z-40"
          style={{
            bottom: 0,
            height: "50%",
            y: curtainBottomY,
            opacity: curtainOpacity,
            backgroundColor: "#2C2C2C",
            transformOrigin: "center bottom",
          }}
        />

        {/* ═══ LAYER F — Ending text ═══ z-50
            Only visible after curtain closes. No overlap with earlier phases.
        */}
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center px-8 pointer-events-none">
          {/* 감사합니다. */}
          <motion.p
            className="mb-8 text-lg font-medium tracking-wider text-center"
            style={{
              opacity: endLine1Opacity,
              y: endLine1Y,
              color: "rgba(255,255,255,0.95)",
              fontFamily: "var(--font-noto-sans-kr), sans-serif",
            }}
          >
            {data.closingLines[0]}
          </motion.p>
          {/* 본문 1 */}
          <motion.p
            className="mb-5 text-sm font-light leading-relaxed tracking-wide text-center whitespace-pre-line"
            style={{
              opacity: endLine2Opacity,
              y: endLine2Y,
              color: "rgba(255,255,255,0.8)",
              fontFamily: "var(--font-noto-sans-kr), sans-serif",
            }}
          >
            {data.closingLines[1]}
          </motion.p>
          {/* 본문 2 */}
          <motion.p
            className="mb-5 text-sm font-light leading-relaxed tracking-wide text-center whitespace-pre-line"
            style={{
              opacity: endLine3Opacity,
              y: endLine3Y,
              color: "rgba(255,255,255,0.7)",
              fontFamily: "var(--font-noto-sans-kr), sans-serif",
            }}
          >
            {data.closingLines[2]}
          </motion.p>
          {/* 본문 3 */}
          <motion.p
            className="mb-8 text-sm font-light leading-relaxed tracking-wide text-center whitespace-pre-line"
            style={{
              opacity: endLine4Opacity,
              y: endLine4Y,
              color: "rgba(255,255,255,0.6)",
              fontFamily: "var(--font-noto-sans-kr), sans-serif",
            }}
          >
            {data.closingLines[3]}
          </motion.p>
          {/* 민준 & 서연 올림 */}
          <motion.p
            className="text-xs tracking-[0.2em] text-center"
            style={{
              opacity: endLine5Opacity,
              y: endLine5Y,
              color: "rgba(255,255,255,0.5)",
              fontFamily: "var(--font-noto-sans-kr), sans-serif",
            }}
          >
            {data.closingLines[4]}
          </motion.p>
        </div>

        {/* ═══ Scroll Hint ═══ z-35 */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
          style={{ opacity: scrollHintOpacity, zIndex: 35 }}
        >
          <span
            className="text-xs tracking-widest uppercase"
            style={{
              color: "rgba(255,255,255,0.7)",
              fontFamily: "var(--font-montserrat), sans-serif",
            }}
          >
            Scroll
          </span>
          <motion.svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            animate={{ y: [0, 6, 0] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <path
              d="M4 7L10 13L16 7"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        </motion.div>
      </div>
    </div>
  );
}

function ReducedMotionView({ data }: { data: ThankYouData }) {
  return (
    <div
      className="mx-auto flex min-h-dvh flex-col items-center justify-center px-8 py-16"
      style={{ maxWidth: 430, backgroundColor: "#2C2C2C" }}
    >
      <p
        className="mb-4 text-xl font-medium tracking-wider"
        style={{
          color: "rgba(255,255,255,0.95)",
          fontFamily: "var(--font-noto-sans-kr), sans-serif",
        }}
      >
        {data.closingLines[0]}
      </p>
      <p
        className="mb-6 text-sm font-light leading-relaxed tracking-wide"
        style={{
          color: "rgba(255,255,255,0.7)",
          fontFamily: "var(--font-noto-sans-kr), sans-serif",
        }}
      >
        {data.closingLines[1]}
      </p>
      <p
        className="text-xs tracking-[0.25em] uppercase"
        style={{
          color: "rgba(255,255,255,0.5)",
          fontFamily: "var(--font-montserrat), sans-serif",
        }}
      >
        {data.closingLines[2]}
      </p>
    </div>
  );
}
