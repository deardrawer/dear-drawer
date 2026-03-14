import { NextRequest, NextResponse } from "next/server";
import { createVenue, getVenuesByPageId } from "@/lib/geunnalDb";
import { verifyGeunnalToken } from "@/lib/geunnalAuth";

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

    const venues = await getVenuesByPageId(pageId);

    return NextResponse.json({
      success: true,
      venues,
    });
  } catch (error) {
    console.error("Get venues API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authenticatedPageId = await getAuthenticatedPageId(request);
    if (!authenticatedPageId) {
      return NextResponse.json(
        { error: "인증 토큰이 필요합니다" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      page_id?: string;
      name?: string;
      address?: string;
      lat?: number;
      lng?: number;
      [key: string]: unknown;
    };
    const { page_id, name, address, lat, lng, ...rest } = body;

    if (!page_id || !name || !address || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: "page_id, name, address, lat, lng는 필수입니다" },
        { status: 400 }
      );
    }

    if (page_id !== authenticatedPageId) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const venue = await createVenue(page_id, {
      name,
      address,
      lat,
      lng,
      ...rest,
    });

    return NextResponse.json({
      success: true,
      venue,
    });
  } catch (error) {
    console.error("Create venue API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
