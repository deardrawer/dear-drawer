import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { verifyAdminRequest, generateAdminToken } from "@/lib/adminAuth";
import { updateInvitationAdminPassword } from "@/lib/db";

// PUT: 관리자 비밀번호 변경 (로그인된 상태에서)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  try {
    const { inviteId } = await params;

    // 인증 확인
    const auth = await verifyAdminRequest(request, inviteId);
    if (!auth.valid) {
      return auth.response;
    }

    const body = await request.json();
    const { newPassword, confirmPassword } = body as {
      newPassword: string;
      confirmPassword: string;
    };

    // 비밀번호 검증
    if (!newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: "새 비밀번호를 입력해주세요" },
        { status: 400 }
      );
    }

    // 4자리 숫자 비밀번호 검증
    if (!/^\d{4}$/.test(newPassword)) {
      return NextResponse.json(
        { success: false, error: "비밀번호는 4자리 숫자여야 합니다" },
        { status: 400 }
      );
    }

    // 비밀번호 일치 확인
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "비밀번호가 일치하지 않습니다" },
        { status: 400 }
      );
    }

    // 비밀번호 해시 및 업데이트
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const updated = await updateInvitationAdminPassword(inviteId, passwordHash);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "비밀번호 변경에 실패했습니다" },
        { status: 500 }
      );
    }

    // 새 토큰 생성 (기존 세션 유지)
    const token = await generateAdminToken(inviteId);

    return NextResponse.json({
      success: true,
      token,
      message: "비밀번호가 변경되었습니다",
    });
  } catch (error) {
    console.error("Password change error:", error);
    return NextResponse.json(
      { success: false, error: "비밀번호 변경 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
