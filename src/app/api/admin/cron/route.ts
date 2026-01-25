import { NextRequest, NextResponse } from "next/server";
import { deleteExpiredInvitations } from "@/lib/db";

// Cloudflare Workers Cron 또는 외부 스케줄러에서 호출
// 매일 자정에 실행 권장

// CRON_SECRET 환경변수로 보안
const CRON_SECRET = process.env.CRON_SECRET || "cron-secret-key";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  // 보안 검증
  if (secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await deleteExpiredInvitations();

    console.log(`[CRON] Deleted ${result.deleted} expired invitations`);
    if (result.errors.length > 0) {
      console.error(`[CRON] Errors:`, result.errors);
    }

    return NextResponse.json({
      success: true,
      deleted: result.deleted,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[CRON] Error:", error);
    return NextResponse.json({ error: "Failed to run cleanup" }, { status: 500 });
  }
}

// POST도 지원 (Cloudflare Workers Cron에서 사용)
export async function POST(request: NextRequest) {
  return GET(request);
}
