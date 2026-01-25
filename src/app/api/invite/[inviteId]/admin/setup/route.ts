import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { generateAdminToken } from "@/lib/adminAuth";
import {
  getInvitationById,
  getInvitationAdminByInvitationId,
  createInvitationAdmin,
  createDefaultGreetingTemplates,
} from "@/lib/db";

// POST: 관리자 비밀번호 최초 설정 (에디터 완료 페이지에서 호출)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  try {
    const { inviteId } = await params;
    const body = await request.json();
    const { password } = body as { password: string };

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

    // 이미 관리자가 설정되어 있는지 확인
    const existingAdmin = await getInvitationAdminByInvitationId(inviteId);
    if (existingAdmin) {
      return NextResponse.json(
        { success: false, error: "이미 비밀번호가 설정되어 있습니다", alreadySet: true },
        { status: 400 }
      );
    }

    // 비밀번호 해시 및 관리자 생성
    const passwordHash = await bcrypt.hash(password, 10);
    await createInvitationAdmin({
      invitation_id: inviteId,
      password_hash: passwordHash,
    });

    // 기본 인사말 템플릿 생성
    await createDefaultGreetingTemplates(inviteId);

    // 토큰 생성
    const token = await generateAdminToken(inviteId);

    return NextResponse.json({
      success: true,
      token,
      message: "비밀번호가 설정되었습니다",
    });
  } catch (error) {
    console.error("Admin setup error:", error);
    return NextResponse.json(
      { success: false, error: "설정 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// GET: 관리자 설정 상태 확인
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  try {
    const { inviteId } = await params;

    // 청첩장 확인
    const invitation = await getInvitationById(inviteId);
    if (!invitation) {
      return NextResponse.json(
        { error: "청첩장을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 관리자 존재 여부 확인
    const admin = await getInvitationAdminByInvitationId(inviteId);

    return NextResponse.json({
      hasAdmin: !!admin,
      lastLogin: admin?.last_login_at || null,
    });
  } catch (error) {
    console.error("Admin status check error:", error);
    return NextResponse.json(
      { error: "상태 확인 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
