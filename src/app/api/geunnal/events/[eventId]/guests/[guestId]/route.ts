import { NextRequest, NextResponse } from "next/server";
import { getEventById, updateGuest, deleteGuest } from "@/lib/geunnalDb";
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

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ eventId: string; guestId: string }> }
) {
  try {
    const { eventId, guestId } = await context.params;

    if (!(await verifyEventAccess(request, eventId))) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const body = (await request.json()) as { name?: string; contacted?: number };
    const { name, contacted } = body;

    const updates: { name?: string; contacted?: number } = {};
    if (name !== undefined) updates.name = name;
    if (contacted !== undefined) updates.contacted = contacted;

    const guest = await updateGuest(guestId, updates);
    if (!guest) {
      return NextResponse.json(
        { error: "게스트를 업데이트할 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      guest,
    });
  } catch (error) {
    console.error("Update guest API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ eventId: string; guestId: string }> }
) {
  try {
    const { eventId, guestId } = await context.params;

    if (!(await verifyEventAccess(request, eventId))) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const success = await deleteGuest(guestId);
    if (!success) {
      return NextResponse.json(
        { error: "게스트를 삭제할 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "게스트가 삭제되었습니다",
    });
  } catch (error) {
    console.error("Delete guest API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
