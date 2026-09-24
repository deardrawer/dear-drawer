import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

/**
 * /links — Instagram · Threads 프로필용 브랜드 링크 허브(작은 브랜드 홈).
 * (main) 레이아웃 밖 독립 라우트 → 헤더·배너·푸터 없이 단독 렌더.
 * 기존 디자인 시스템만 사용: 로고 /logo.png, 블랙/화이트 + 그레이, Noto Sans KR(font-sans),
 * rounded pill/블록 CTA, 헤더/푸터의 실제 SNS SVG. 새 스타일·그라데이션·과한 그림자 배제.
 */

// ─────────────────────────────────────────────────────────────
// 링크 설정 — 변경은 여기서만.
//  · create   : 청첩장 제작(내부, 헤더 '무료로 시작하기'와 동일 목적지)
//  · smartstore: 스마트스토어(네이버쇼핑) 구매 링크
//  · instagram : 인스타그램 프로필
//  · threads   : 스레드 프로필
//  · inquiry   : 카카오 채널 문의(헤더/푸터와 동일)
// ─────────────────────────────────────────────────────────────
const LINKS = {
  create: '/templates',
  smartstore: 'https://mkt.shopping.naver.com/link/6ab51c57eeb8b60d4188f0e7',
  instagram: 'https://www.instagram.com/dear.drawer/',
  threads: 'https://www.threads.net/@dear.drawer',
  inquiry: 'https://pf.kakao.com/_bEpxen/chat',
}

// Threads '읽을거리' 느낌을 주기 위한 콘텐츠 주제 예시(포스트 미리보기 연상).
const THREADS_TOPICS = [
  '청첩장에 우리 이야기를 담는 법',
  '결혼 준비, 놓치기 쉬운 체크리스트',
  'Dear Drawer의 새로운 템플릿 소식',
]

export const metadata: Metadata = {
  title: 'dear drawer | 링크',
  description: '사람의 만남을 기록하고, 행복을 서랍에 담습니다. 디어드로어 모바일 청첩장 · 스마트스토어 · Instagram · Threads · 문의.',
  icons: { icon: '/favicon.png', apple: '/favicon.png' },
  openGraph: {
    title: 'dear drawer',
    description: '사람의 만남을 기록하고, 행복을 서랍에 담습니다.',
    images: ['/logo.png'],
  },
}

function Arrow({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

export default function LinksPage() {
  return (
    <main className="min-h-[100dvh] bg-white text-gray-900">
      <div className="animate-fade-in mx-auto w-full max-w-[460px] break-keep px-6 pb-16 pt-14 sm:pt-20">

        {/* ── 01. HERO ── */}
        <header className="text-center">
          <Image src="/logo.png" alt="dear drawer" width={168} height={39} priority className="mx-auto h-9 w-auto" />
          <h1 className="mt-8 text-[19px] font-medium leading-[1.75] tracking-tight text-gray-900">
            사람의 만남을 기록하고,
            <br />
            행복을 서랍에 담습니다.
          </h1>
        </header>

        {/* ── 02. MAIN ACTION (SNS보다 우선순위 높게) ── */}
        <section className="mt-12 space-y-3">
          {/* ① 청첩장 만들기 — 가장 강조(블랙) */}
          <Link
            href={LINKS.create}
            className="group block rounded-2xl bg-black px-6 py-6 text-white transition-colors hover:bg-gray-800"
          >
            <p className="text-base font-semibold tracking-tight">모바일 청첩장 만들기</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-white/70">직접 디자인하고 우리의 이야기를 담아보세요.</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium">
              청첩장 만들기 <Arrow className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>

          {/* ② 스마트스토어 — 보조(아웃라인) */}
          <a
            href={LINKS.smartstore}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-2xl border border-gray-200 px-6 py-6 transition-colors hover:border-gray-400 hover:bg-gray-50"
          >
            <p className="text-base font-semibold tracking-tight text-gray-900">스마트스토어</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-gray-500">디어드로어를 시작하고 싶다면</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-900">
              구매하기 <Arrow className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </a>
        </section>

        {/* ── 03. EXPLORE DEAR DRAWER (채널별 성격을 시각적으로 구분) ── */}
        <section className="mt-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">Explore Dear Drawer</p>

          <div className="mt-5 space-y-4">
            {/* INSTAGRAM — 청첩장 라이브러리 */}
            <a
              href={LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-2xl border border-gray-100 px-5 py-5 transition-colors hover:border-gray-300"
            >
              <div className="flex items-center gap-1.5 text-gray-900">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">Instagram</span>
              </div>
              <p className="mt-2 text-[15px] font-semibold text-gray-900">다양한 청첩장 라이브러리</p>
              <p className="mt-1 text-[13px] leading-relaxed text-gray-500"><span className="whitespace-nowrap">Dear Drawer</span>의 다양한 디자인과 청첩장 레퍼런스를 둘러보세요.</p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-900">
                Instagram에서 둘러보기 <Arrow className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </a>

            {/* THREADS — 읽을거리 & 소식(텍스트 콘텐츠) */}
            <a
              href={LINKS.threads}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-2xl border border-gray-100 px-5 py-5 transition-colors hover:border-gray-300"
            >
              <div className="flex items-center gap-1.5 text-gray-900">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.334-3.082.885-.762 2.128-1.209 3.6-1.291a13.4 13.4 0 0 1 3.28.184c-.168-1.004-.552-1.78-1.14-2.31-.807-.727-2.016-1.09-3.6-1.101h-.045c-1.27 0-2.983.35-4.075 1.973l-1.677-1.127c1.462-2.17 3.84-3.363 6.79-3.363h.062c4.929.03 7.866 3.062 8.12 8.399.145.062.288.129.428.198 1.375.686 2.409 1.757 2.994 3.096.815 1.858.891 4.883-1.673 7.412-1.968 1.93-4.354 2.798-7.702 2.823z" />
                </svg>
                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">Threads</span>
              </div>
              <p className="mt-2 text-[15px] font-semibold text-gray-900">결혼식 정보 &amp; <span className="whitespace-nowrap">Dear Drawer</span> 소식</p>
              <p className="mt-1 text-[13px] leading-relaxed text-gray-500">결혼을 준비하면서 알아두면 좋은 이야기와 <span className="whitespace-nowrap">Dear Drawer</span>의 새로운 소식을 만나보세요.</p>
              <div className="mt-4 space-y-1.5 border-l border-gray-200 pl-3.5">
                {THREADS_TOPICS.map((t) => (
                  <p key={t} className="text-[12.5px] leading-relaxed text-gray-500">{t}</p>
                ))}
              </div>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-900">
                Threads에서 만나기 <Arrow className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </a>

            {/* CHANNEL — 문의(가장 직관적·깔끔) */}
            <a
              href={LINKS.inquiry}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-2xl bg-gray-50 px-5 py-5 transition-colors hover:bg-gray-100"
            >
              <div className="flex items-center gap-1.5 text-gray-900">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M12 3c-5.52 0-10 3.58-10 8 0 2.84 1.86 5.33 4.66 6.73-.15.54-.96 3.48-1 3.64 0 .07.02.14.08.19.06.05.14.06.21.03.28-.04 3.22-2.12 4.55-3 .49.07.99.11 1.5.11 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
                </svg>
                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">Channel</span>
              </div>
              <p className="mt-2 text-[15px] font-semibold text-gray-900">궁금한 점이 있으신가요?</p>
              <p className="mt-1 text-[13px] leading-relaxed text-gray-500">제작 방법부터 결제, 이용 중 궁금한 점까지 편하게 문의해주세요.</p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-900">
                문의하기 <Arrow className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </a>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="mt-14 text-center">
          <a
            href="https://www.deardrawer.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] tracking-wide text-gray-400 transition-colors hover:text-gray-700"
          >
            deardrawer.com
          </a>
          <p className="mt-2 text-[11px] text-gray-300">© dear drawer</p>
        </footer>
      </div>
    </main>
  )
}
