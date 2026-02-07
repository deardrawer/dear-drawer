import { NextRequest, NextResponse } from "next/server";

// CSRF 보호 대상: 관리자용 API (인증 필요한 엔드포인트)
const CSRF_PROTECTED_ROUTES: { path: string; methods: string[] }[] = [
  // RSVP 관리 (GET=목록조회, DELETE=삭제)
  { path: "/api/rsvp", methods: ["GET", "DELETE"] },
  // RSVP CSV 내보내기
  { path: "/api/rsvp/export", methods: ["GET"] },
  // 방명록 관리 (DELETE=삭제)
  { path: "/api/guestbook", methods: ["DELETE"] },
  // 방명록 CSV 내보내기
  { path: "/api/guestbook/export", methods: ["GET"] },
  // 청첩장 CRUD (PUT=수정, DELETE=삭제)
  { path: "/api/invitations", methods: ["PUT", "DELETE"] },
  // 이미지 삭제
  { path: "/api/upload", methods: ["DELETE"] },
];

function isCsrfProtected(pathname: string, method: string): boolean {
  return CSRF_PROTECTED_ROUTES.some(
    (route) =>
      pathname.startsWith(route.path) && route.methods.includes(method)
  );
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // ===== 1. Security Headers =====
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Content-Security-Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://t1.kakaocdn.net https://developers.kakao.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://*.supabase.co https://*.r2.cloudflarestorage.com https://invite.deardrawer.com https://*.kakaocdn.net",
    "connect-src 'self' https://*.supabase.co https://kapi.kakao.com",
    "frame-src 'self' https://accounts.kakao.com",
    "frame-ancestors 'none'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);

  // ===== 2. CSRF Protection (관리자용 API만) =====
  const pathname = request.nextUrl.pathname;
  const method = request.method;

  if (isCsrfProtected(pathname, method)) {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const host = request.headers.get("host");

    const allowedOrigins = [
      `https://${host}`,
      `http://${host}`,
      "https://invite.deardrawer.com",
      "http://localhost:3000",
    ];

    const isValidOrigin = origin
      ? allowedOrigins.some((allowed) => origin === allowed)
      : false;
    const isValidReferer = referer
      ? allowedOrigins.some((allowed) => referer.startsWith(allowed))
      : false;

    // Origin도 Referer도 없으면 서버 간 호출 가능성 → 허용
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
