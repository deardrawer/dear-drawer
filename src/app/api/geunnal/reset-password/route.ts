import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { verifyToken, getAuthCookieName } from "@/lib/auth";
import { getInvitationById } from "@/lib/db";
import { getPageByInvitationId, getPageBySlug, updatePage } from "@/lib/geunnalDb";

export async function POST(request: NextRequest) {
  try {
    // 카카오 로그인 인증 확인
    const cookieName = getAuthCookieName();
    const token = request.cookies.get(cookieName)?.value;

    if (!token) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "유효하지 않은 인증입니다" }, { status: 401 });
    }

    const body = (await request.json()) as {
      invitationId?: string;
      newPassword?: string;
    };

    const { invitationId, newPassword } = body;

    if (!invitationId || !newPassword) {
      return NextResponse.json(
        { error: "invitationId와 newPassword가 필요합니다" },
        { status: 400 }
      );
    }

    // 4자리 숫자 검증
    if (!/^\d{4}$/.test(newPassword)) {
      return NextResponse.json(
        { error: "비밀번호는 4자리 숫자여야 합니다" },
        { status: 400 }
      );
    }

    // 청첩장 소유권 확인
    const invitation = await getInvitationById(invitationId);
    if (!invitation) {
      return NextResponse.json({ error: "청첩장을 찾을 수 없습니다" }, { status: 404 });
    }

    if (invitation.user_id !== payload.user.id) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    // 연결된 데이드로어 페이지 찾기
    let page = await getPageByInvitationId(invitationId);

    // invitation_id로 못 찾으면 slug 패턴으로 시도
    if (!page) {
      const slug = `${invitation.slug || invitationId}-g`;
      page = await getPageBySlug(slug);
    }

    if (!page) {
      return NextResponse.json(
        { error: "연결된 데이드로어 페이지를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 비밀번호 해싱 및 업데이트 (데이터는 그대로 유지)
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await updatePage(page.id, { password_hash: hashedPassword });

    return NextResponse.json({
      success: true,
      message: "비밀번호가 재설정되었습니다",
    });
  } catch (error) {
    console.error("Geunnal reset password error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// 데이드로어 페이지 연결 상태 확인
export async function GET(request: NextRequest) {
  try {
    const cookieName = getAuthCookieName();
    const token = request.cookies.get(cookieName)?.value;

    if (!token) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "유효하지 않은 인증입니다" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get("invitationId");

    if (!invitationId) {
      return NextResponse.json({ error: "invitationId가 필요합니다" }, { status: 400 });
    }

    // 청첩장 소유권 확인
    const invitation = await getInvitationById(invitationId);
    if (!invitation) {
      return NextResponse.json({ error: "청첩장을 찾을 수 없습니다" }, { status: 404 });
    }

    if (invitation.user_id !== payload.user.id) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    // 연결된 데이드로어 페이지 찾기
    let page = await getPageByInvitationId(invitationId);
    if (!page) {
      const slug = `${invitation.slug || invitationId}-g`;
      page = await getPageBySlug(slug);
    }

    return NextResponse.json({
      hasPage: !!page,
      hasPassword: !!(page?.password_hash),
    });
  } catch (error) {
    console.error("Geunnal check error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
