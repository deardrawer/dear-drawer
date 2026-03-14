import { NextRequest, NextResponse } from "next/server";
import { getEventById, updateEvent, deleteEvent } from "@/lib/geunnalDb";
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

    const event = await getEventById(eventId);
    if (!event) {
      return NextResponse.json(
        { error: "이벤트를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      event,
    });
  } catch (error) {
    console.error("Get event API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await context.params;

    if (!(await verifyEventAccess(request, eventId))) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;

    const event = await updateEvent(eventId, body);
    if (!event) {
      return NextResponse.json(
        { error: "이벤트를 업데이트할 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      event,
    });
  } catch (error) {
    console.error("Update event API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await context.params;

    if (!(await verifyEventAccess(request, eventId))) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const success = await deleteEvent(eventId);
    if (!success) {
      return NextResponse.json(
        { error: "이벤트를 삭제할 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "이벤트가 삭제되었습니다",
    });
  } catch (error) {
    console.error("Delete event API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
