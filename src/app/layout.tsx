import type { Metadata, Viewport } from "next";
import Script from "next/script";
import {
  Noto_Sans_KR,
  Cormorant_Garamond,
  Playfair_Display,
  Montserrat,
  Great_Vibes,
  Lora,
  Cinzel,
  EB_Garamond,
  Nanum_Myeongjo,
  Nanum_Gothic,
  Gowun_Batang,
  Gowun_Dodum,
  Song_Myung,
  Hahmlet,
} from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ErrorBoundaryProvider } from "@/components/providers/ErrorBoundaryProvider";

// 기본 폰트
const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Classic 스타일
const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const nanumMyeongjo = Nanum_Myeongjo({
  variable: "--font-nanum-myeongjo",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

// Modern 스타일
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Romantic 스타일
const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const gowunBatang = Gowun_Batang({
  variable: "--font-gowun-batang",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

// Contemporary 스타일
const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const gowunDodum = Gowun_Dodum({
  variable: "--font-gowun-dodum",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

// Luxury 스타일
const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// 추가 한글 폰트 (Parents 템플릿용)
const nanumGothic = Nanum_Gothic({
  variable: "--font-nanum-gothic",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const songMyung = Song_Myung({
  variable: "--font-song-myung",
  weight: ["400"],
  display: "swap",
});

const hahmlet = Hahmlet({
  variable: "--font-hahmlet",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "dear drawer - 나만의 모바일 청첩장",
  description: "AI가 만들어주는 특별한 모바일 청첩장. 간단한 질문에 답하면 나만의 청첩장이 완성됩니다.",
  keywords: ["청첩장", "모바일청첩장", "웨딩", "결혼식", "AI청첩장", "dear drawer"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: "overlays-content", // 키보드가 콘텐츠를 resize하지 않고 overlay
};

const fontVariables = [
  notoSansKR.variable,
  cormorantGaramond.variable,
  playfairDisplay.variable,
  nanumMyeongjo.variable,
  montserrat.variable,
  greatVibes.variable,
  lora.variable,
  gowunBatang.variable,
  cinzel.variable,
  gowunDodum.variable,
  ebGaramond.variable,
  // Parents 템플릿용 추가 폰트
  nanumGothic.variable,
  songMyung.variable,
  hahmlet.variable,
].join(' ');

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${fontVariables} font-sans antialiased`}>
        <ErrorBoundaryProvider>
          <AuthProvider>{children}</AuthProvider>
        </ErrorBoundaryProvider>
        {/* Portal root for modals */}
        <div id="modal-root" />
        <Script
          id="kakao-sdk"
          src="https://developers.kakao.com/sdk/js/kakao.min.js"
          strategy="afterInteractive"
        />
        <Script id="kakao-init" strategy="lazyOnload">
          {`
            (function() {
              var kakaoKey = '${process.env.NEXT_PUBLIC_KAKAO_JS_KEY || ''}';
              function initKakao() {
                if (window.Kakao && !window.Kakao.isInitialized() && kakaoKey) {
                  window.Kakao.init(kakaoKey);
                  console.log('Kakao SDK initialized:', window.Kakao.isInitialized());
                }
              }
              var checkKakao = setInterval(function() {
                if (window.Kakao) {
                  clearInterval(checkKakao);
                  initKakao();
                }
              }, 100);
              setTimeout(function() { clearInterval(checkKakao); }, 10000);
            })();
          `}
        </Script>
      </body>
    </html>
  );
}
