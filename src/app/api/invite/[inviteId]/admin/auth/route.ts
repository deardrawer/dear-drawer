import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { generateAdminToken, verifyAdminToken } from "@/lib/adminAuth";
import {
  getInvitationById,
  getInvitationAdminByInvitationId,
  createInvitationAdmin,
  updateInvitationAdminPassword,
  recordAdminLogin,
  createDefaultGreetingTemplates,
} from "@/lib/db";

// POST: 비밀번호 확인/설정
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  try {
    const { inviteId } = await params;
    const body = await request.json();
    const { password, action } = body as {
      password: string;
      action?: "login" | "setup" | "reset";
    };

    if (!password) {
      return NextResponse.json(
        { success: false, error: "비밀번호가 필요합니다" },
        { status: 400 }
      );
    }

    // 4자리 숫자 비밀번호 검증
    if (!/^\d{4}$/.test(password)) {
      return NextResponse.json(
        { success: false, error: "비밀번호는 4자리 숫자여야 합니다" },
        { status: 400 }
      );
    }

    // 청첩장 확인
    const invitation = await getInvitationById(inviteId);
    if (!invitation) {
      return NextResponse.json(
        { success: false, error: "청첩장을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 관리자 정보 조회
    let admin = await getInvitationAdminByInvitationId(inviteId);

    // 최초 설정
    if (!admin) {
      const passwordHash = await bcrypt.hash(password, 10);
      admin = await createInvitationAdmin({
        invitation_id: inviteId,
        password_hash: passwordHash,
      });

      // 기본 인사말 템플릿 생성
      await createDefaultGreetingTemplates(inviteId);

      const token = await generateAdminToken(inviteId);
      return NextResponse.json({
        success: true,
        token,
        isFirstSetup: true,
        message: "비밀번호가 설정되었습니다",
      });
    }

    // 비밀번호 재설정 (기존 토큰 필요)
    if (action === "reset") {
      const authHeader = request.headers.get("authorization");
      const existingToken = authHeader?.replace("Bearer ", "");

      if (!existingToken) {
        return NextResponse.json(
          { success: false, error: "기존 인증이 필요합니다" },
          { status: 401 }
        );
      }

      const payload = await verifyAdminToken(existingToken);
      if (!payload || payload.invitationId !== inviteId) {
        return NextResponse.json(
          { success: false, error: "권한이 없습니다" },
          { status: 403 }
        );
      }

      const passwordHash = await bcrypt.hash(password, 10);
      await updateInvitationAdminPassword(inviteId, passwordHash);

      const token = await generateAdminToken(inviteId);
      return NextResponse.json({
        success: true,
        token,
        message: "비밀번호가 변경되었습니다",
      });
    }

    // 로그인
    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "비밀번호가 일치하지 않습니다" },
        { status: 401 }
      );
    }

    await recordAdminLogin(inviteId);
    const token = await generateAdminToken(inviteId);

    return NextResponse.json({
      success: true,
      token,
    });
  } catch (error) {
    console.error("Admin auth error:", error);
    return NextResponse.json(
      { success: false, error: "인증 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// GET: 토큰 검증 및 관리자 상태 확인
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  try {
    const { inviteId } = await params;

    // 관리자 존재 여부 확인
    const admin = await getInvitationAdminByInvitationId(inviteId);

    // 토큰 검증 (있는 경우)
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token) {
      const payload = await verifyAdminToken(token);
      if (payload && payload.invitationId === inviteId) {
        return NextResponse.json({
          hasAdmin: true,
          isAuthenticated: true,
          lastLogin: admin?.last_login_at,
        });
      }
    }

    return NextResponse.json({
      hasAdmin: !!admin,
      isAuthenticated: false,
    });
  } catch (error) {
    console.error("Admin status error:", error);
    return NextResponse.json(
      { error: "상태 확인 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
