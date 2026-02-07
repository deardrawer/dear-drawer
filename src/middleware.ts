import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // ===== 1. Security Headers (CSP 등) =====
  // XSS 방지
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Content-Security-Policy
  const csp = [
    "default-src 'self'",
    // Next.js 및 인라인 스크립트/스타일 허용
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://t1.kakaocdn.net https://developers.kakao.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    // 이미지: 자체 + Supabase + R2 + Kakao + data URI
    "img-src 'self' data: blob: https://*.supabase.co https://*.r2.cloudflarestorage.com https://invite.deardrawer.com https://k.kakaocdn.net https://t1.kakaocdn.net",
    // API 연결
    "connect-src 'self' https://*.supabase.co https://api.anthropic.com https://openrouter.ai https://kapi.kakao.com",
    // 프레임 (카카오 SDK 등)
    "frame-src 'self' https://accounts.kakao.com",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);

  // ===== 2. CSRF Protection (API 변경 요청) =====
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const method = request.method;

    // 읽기 전용 메서드는 CSRF 체크 스킵
    if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
      return response;
    }

    // Origin/Referer 헤더로 CSRF 검증
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const host = request.headers.get("host");

    // 허용 도메인 목록
    const allowedOrigins = [
      `https://${host}`,
      `http://${host}`, // 로컬 개발용
      "https://invite.deardrawer.com",
      "http://localhost:3000",
    ];

    const isValidOrigin = origin
      ? allowedOrigins.some((allowed) => origin === allowed)
      : false;
    const isValidReferer = referer
      ? allowedOrigins.some((allowed) => referer.startsWith(allowed))
      : false;

    // Origin도 Referer도 없으면 서버 간 호출일 수 있으므로 허용
    // (브라우저는 항상 Origin 또는 Referer를 보냄)
    if (!origin && !referer) {
      return response;
    }

    if (!isValidOrigin && !isValidReferer) {
      return NextResponse.json(
        { error: "CSRF validation failed" },
        { status: 403 }
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    // 정적 파일, _next, 파비콘 제외
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
