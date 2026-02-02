import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getAuthCookieName } from "@/lib/auth";
import {
  getInvitationById,
  deleteInvitationAdmin,
  getInvitationAdminByInvitationId,
} from "@/lib/db";

// DELETE: 청첩장 소유자가 관리자 비밀번호 리셋 (기존 관리자 설정 삭제)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  try {
    const { inviteId } = await params;

    // 사용자 인증 확인 (청첩장 소유자)
    const cookieName = getAuthCookieName();
    const token = request.cookies.get(cookieName)?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // 청첩장 소유권 확인
    const invitation = await getInvitationById(inviteId);
    if (!invitation || invitation.user_id !== payload.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 관리자 존재 확인
    const admin = await getInvitationAdminByInvitationId(inviteId);
    if (!admin) {
      return NextResponse.json(
        { success: true, message: "비밀번호가 설정되지 않았습니다" },
        { status: 200 }
      );
    }

    // 관리자 삭제 (비밀번호 리셋)
    const deleted = await deleteInvitationAdmin(inviteId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "비밀번호 리셋에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "비밀번호가 리셋되었습니다. 게스트 관리 페이지에서 새 비밀번호를 설정해주세요.",
    });
  } catch (error) {
    console.error("Owner reset error:", error);
    return NextResponse.json(
      { success: false, error: "비밀번호 리셋 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// GET: 관리자 비밀번호 설정 상태 확인
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  try {
    const { inviteId } = await params;

    // 사용자 인증 확인
    const cookieName = getAuthCookieName();
    const token = request.cookies.get(cookieName)?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // 청첩장 소유권 확인
    const invitation = await getInvitationById(inviteId);
    if (!invitation || invitation.user_id !== payload.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 관리자 존재 확인
    const admin = await getInvitationAdminByInvitationId(inviteId);

    return NextResponse.json({
      hasPassword: !!admin,
      lastLogin: admin?.last_login_at,
      loginCount: admin?.login_count || 0,
    });
  } catch (error) {
    console.error("Admin status check error:", error);
    return NextResponse.json(
      { error: "상태 확인 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
