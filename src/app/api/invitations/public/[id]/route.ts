import { NextRequest, NextResponse } from "next/server";
import { getInvitationById, recordPageView } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 공개 청첩장 조회 (인증 불필요)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const invitation = await getInvitationById(id);

    if (!invitation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // 페이지 조회 기록
    const visitorIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || undefined;

    try {
      await recordPageView(id, visitorIp, userAgent);
    } catch (e) {
      console.error("Failed to record page view:", e);
    }

    return NextResponse.json({ invitation });
  } catch (error) {
    console.error("Get public invitation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
