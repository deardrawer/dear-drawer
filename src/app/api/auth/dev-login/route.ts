import { NextResponse } from "next/server";
import { createToken, getAuthCookieOptions } from "@/lib/auth";

// 개발 환경 전용 테스트 로그인
export async function POST() {
  // 프로덕션에서는 사용 불가 (NODE_ENV 또는 도메인 기반 이중 체크)
  const isProduction = process.env.NODE_ENV === "production" || !!process.env.CF_PAGES || !!process.env.CLOUDFLARE;
  if (isProduction) {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  const testUser = {
    id: "test-user-123",
    kakaoId: 12345678,
    nickname: "테스트",
    email: "test@example.com",
    profileImage: undefined,
  };

  const token = await createToken(testUser);
  const { name, options } = getAuthCookieOptions();

  const response = NextResponse.json({ user: testUser });
  response.cookies.set(name, token, options);

  return response;
}
