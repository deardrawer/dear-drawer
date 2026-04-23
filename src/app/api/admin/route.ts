import { NextRequest, NextResponse } from "next/server";
import {
  getAllInvitationsForAdmin,
  getAdminStats,
  forceDeleteInvitation,
  deleteExpiredInvitations,
} from "@/lib/db";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// 관리자 인증 확인 (Cloudflare에서는 요청 핸들러 내부에서 env 읽어야 함)
function verifyAdmin(request: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  const authHeader = request.headers.get("x-admin-password");
  return authHeader === adminPassword;
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

// PATCH: 워터마크(is_paid) 토글
export async function PATCH(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, is_paid } = (await request.json()) as {
      id: string;
      is_paid: 0 | 1;
    };

    if (!id || (is_paid !== 0 && is_paid !== 1)) {
      return NextResponse.json(
        { error: "id and is_paid (0 or 1) required" },
        { status: 400 }
      );
    }

    const { env } = (await getCloudflareContext()) as {
      env: { DB?: import("@cloudflare/workers-types").D1Database };
    };
    if (!env.DB) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 500 }
      );
    }

    await env.DB.prepare("UPDATE invitations SET is_paid = ? WHERE id = ?")
      .bind(is_paid, id)
      .run();

    return NextResponse.json({ success: true, is_paid });
  } catch (error) {
    console.error("Admin PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update" },
      { status: 500 }
    );
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
