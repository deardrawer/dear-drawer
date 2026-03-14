import { NextRequest, NextResponse } from "next/server";

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { success: false, error: "로그인에 실패했습니다." },
      { status: 500 }
    );
  }
}
