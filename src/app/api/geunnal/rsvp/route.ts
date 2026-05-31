import { NextRequest, NextResponse } from "next/server";
import { verifyGeunnalToken } from "@/lib/geunnalAuth";
import { getPageById } from "@/lib/geunnalDb";
import { getRSVPsByInvitationId, getRSVPSummary } from "@/lib/db";

async function getAuthenticatedPageId(
  request: NextRequest
): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return null;
  }

  const payload = await verifyGeunnalToken(token);
  return payload?.pageId || null;
}

export async function GET(request: NextRequest) {
  try {
    const authenticatedPageId = await getAuthenticatedPageId(request);
    if (!authenticatedPageId) {
      return NextResponse.json(
        { error: "인증 토큰이 필요합니다" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get("pageId");

    if (!pageId) {
      return NextResponse.json(
        { error: "pageId가 필요합니다" },
        { status: 400 }
      );
    }

    if (pageId !== authenticatedPageId) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const page = await getPageById(pageId);
    if (!page) {
      return NextResponse.json(
        { error: "페이지를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // invitation_id가 없으면 빈 응답 반환
    if (!page.invitation_id) {
      return NextResponse.json({
        success: true,
        data: [],
        summary: null,
      });
    }

    const data = await getRSVPsByInvitationId(page.invitation_id);
    const summary = await getRSVPSummary(page.invitation_id);

    return NextResponse.json({
      success: true,
      data,
      summary,
    });
  } catch (error) {
    console.error("Geunnal RSVP API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
