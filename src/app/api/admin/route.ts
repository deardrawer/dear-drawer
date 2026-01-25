import { NextRequest, NextResponse } from "next/server";
import {
  getAllInvitationsForAdmin,
  getAdminStats,
  forceDeleteInvitation,
  deleteExpiredInvitations,
} from "@/lib/db";

// 간단한 관리자 비밀번호 (환경변수로 관리)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin1234";

// 관리자 인증 확인
function verifyAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get("x-admin-password");
  return authHeader === ADMIN_PASSWORD;
}

// GET: 청첩장 목록 및 통계 조회
export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type === "stats") {
      const stats = await getAdminStats();
      return NextResponse.json({ stats });
    }

    const invitations = await getAllInvitationsForAdmin();
    const stats = await getAdminStats();

    return NextResponse.json({ invitations, stats });
  } catch (error) {
    console.error("Admin GET error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

// DELETE: 청첩장 삭제
export async function DELETE(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get("id");
    const deleteExpired = searchParams.get("expired") === "true";

    if (deleteExpired) {
      // 만료된 청첩장 일괄 삭제
      const result = await deleteExpiredInvitations();
      return NextResponse.json({
        success: true,
        deleted: result.deleted,
        errors: result.errors,
      });
    }

    if (!invitationId) {
      return NextResponse.json({ error: "Invitation ID required" }, { status: 400 });
    }

    const success = await forceDeleteInvitation(invitationId);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
  } catch (error) {
    console.error("Admin DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
