import { NextRequest, NextResponse } from "next/server";
import { deleteExpiredInvitations } from "@/lib/db";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Cloudflare Workers Cron 또는 외부 스케줄러에서 호출
// 매일 자정에 실행 권장
// 호출 방법: POST /api/admin/cron (Authorization: Bearer <CRON_SECRET>)

interface CloudflareEnv {
  CRON_SECRET?: string;
}

async function getCronSecret(): Promise<string> {
  try {
    const { env } = await getCloudflareContext() as { env: CloudflareEnv };
    return env.CRON_SECRET || process.env.CRON_SECRET || "";
  } catch {
    return process.env.CRON_SECRET || "";
  }
}

export async function POST(request: NextRequest) {
  // Authorization 헤더에서 Bearer token 추출
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const cronSecret = await getCronSecret();

  if (!cronSecret || token !== cronSecret) {
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
