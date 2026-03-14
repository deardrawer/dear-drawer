import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getPageById, updatePage, updatePageLogin } from "@/lib/geunnalDb";
import { generateGeunnalToken } from "@/lib/geunnalAuth";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await context.params;
    const body = await request.json();
    const { action, password } = body;

    if (!action || !password) {
      return NextResponse.json(
        { error: "action과 password가 필요합니다" },
        { status: 400 }
      );
    }

    const page = await getPageById(pageId);
    if (!page) {
      return NextResponse.json(
        { error: "페이지를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (action === "setup") {
      // 비밀번호 설정 모드
      if (page.password_hash) {
        return NextResponse.json(
          { error: "이미 비밀번호가 설정되어 있습니다" },
          { status: 400 }
        );
      }

      // 4자리 숫자 검증
      if (!/^\d{4}$/.test(password)) {
        return NextResponse.json(
          { error: "비밀번호는 4자리 숫자여야 합니다" },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await updatePage(pageId, { password_hash: hashedPassword });

      const token = await generateGeunnalToken(pageId);

      return NextResponse.json({
        success: true,
        message: "비밀번호가 설정되었습니다",
        token,
      });
    } else if (action === "login") {
      // 로그인 모드
      if (!page.password_hash) {
        return NextResponse.json(
          { error: "비밀번호가 설정되지 않았습니다" },
          { status: 400 }
        );
      }

      const isValid = await bcrypt.compare(password, page.password_hash);
      if (!isValid) {
        return NextResponse.json(
          { error: "비밀번호가 일치하지 않습니다" },
          { status: 401 }
        );
      }

      // 로그인 카운트 및 시간 업데이트
      await updatePageLogin(pageId);

      const token = await generateGeunnalToken(pageId);

      return NextResponse.json({
        success: true,
        message: "로그인되었습니다",
        token,
      });
    } else {
      return NextResponse.json(
        { error: "유효하지 않은 action입니다 (setup 또는 login)" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Auth API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await context.params;

    const page = await getPageById(pageId);
    if (!page) {
      return NextResponse.json(
        { error: "페이지를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      hasPassword: !!page.password_hash,
    });
  } catch (error) {
    console.error("Auth check API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
