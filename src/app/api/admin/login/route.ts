import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, adminCookieToken } from "@/lib/adminCookie";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json() as { password: string };

    if (!password) {
      return NextResponse.json(
        { success: false, error: "비밀번호가 필요합니다." },
        { status: 400 }
      );
    }

    // Cloudflare에서는 요청 핸들러 내부에서 env 읽어야 함
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword || password !== adminPassword) {
      return NextResponse.json(
        { success: false, error: "비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    // 관리자 열람 쿠키 심기(게스트 청첩장 공개 종료 우회용). httpOnly.
    const res = NextResponse.json({ success: true });
    const token = await adminCookieToken();
    if (token) {
      res.cookies.set(ADMIN_COOKIE, token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30일
      });
    }
    return res;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { success: false, error: "로그인에 실패했습니다." },
      { status: 500 }
    );
  }
}

// 로그아웃: 관리자 열람 쿠키 제거.
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
