import { NextRequest, NextResponse } from "next/server";
import {
  createSubmission,
  getSubmissionsByEventId,
  getEventById,
} from "@/lib/geunnalDb";
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
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId가 필요합니다" },
        { status: 400 }
      );
    }

    // Verify that the event belongs to the authenticated page
    const event = await getEventById(eventId);
    if (!event) {
      return NextResponse.json(
        { error: "이벤트를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (event.page_id !== authenticatedPageId) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const submissions = await getSubmissionsByEventId(eventId);

    return NextResponse.json({
      success: true,
      submissions,
    });
  } catch (error) {
    console.error("Get submissions API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // PUBLIC endpoint - no auth required
  try {
    const body = await request.json();
    const {
      event_id,
      guest_name,
      is_anonymous,
      avatar_id,
      message,
      photo_url,
    } = body;

    if (!event_id || !guest_name) {
      return NextResponse.json(
        { error: "event_id와 guest_name은 필수입니다" },
        { status: 400 }
      );
    }

    // Verify event exists
    const event = await getEventById(event_id);
    if (!event) {
      return NextResponse.json(
        { error: "이벤트를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    const submission = await createSubmission({
      event_id,
      guest_name,
      is_anonymous,
      avatar_id,
      message,
      photo_url,
    });

    return NextResponse.json({
      success: true,
      submission,
    });
  } catch (error) {
    console.error("Create submission API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
