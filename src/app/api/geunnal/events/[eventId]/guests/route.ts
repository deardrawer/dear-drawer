import { NextRequest, NextResponse } from "next/server";
import {
  getEventById,
  getGuestsByEventId,
  addGuest,
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

async function verifyEventAccess(
  request: NextRequest,
  eventId: string
): Promise<boolean> {
  const authenticatedPageId = await getAuthenticatedPageId(request);
  if (!authenticatedPageId) {
    return false;
  }

  const event = await getEventById(eventId);
  if (!event) {
    return false;
  }

  return event.page_id === authenticatedPageId;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await context.params;

    if (!(await verifyEventAccess(request, eventId))) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const guests = await getGuestsByEventId(eventId);

    return NextResponse.json({
      success: true,
      guests,
    });
  } catch (error) {
    console.error("Get guests API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await context.params;

    if (!(await verifyEventAccess(request, eventId))) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: "name이 필요합니다" },
        { status: 400 }
      );
    }

    const guest = await addGuest(eventId, name);

    return NextResponse.json({
      success: true,
      guest,
    });
  } catch (error) {
    console.error("Add guest API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
