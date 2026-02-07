import { NextRequest, NextResponse } from "next/server";
import {
  createGuestbookMessage,
  getGuestbookMessages,
  deleteGuestbookMessage,
  getInvitationById,
  getRecentGuestbookMessage,
} from "@/lib/db";
import { verifyToken, getAuthCookieName } from "@/lib/auth";

// GET: 방명록 메시지 목록 조회
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const invitationId = searchParams.get("invitationId");

  if (!invitationId) {
    return NextResponse.json(
      { error: "invitationId is required" },
      { status: 400 }
    );
  }

  try {
    const messages = await getGuestbookMessages(invitationId);
    return NextResponse.json({ data: messages });
  } catch (error) {
    console.error("Failed to get guestbook messages:", error);
    return NextResponse.json(
      { error: "Failed to get guestbook messages" },
      { status: 500 }
    );
  }
}

// POST: 방명록 메시지 등록
export async function POST(request: NextRequest) {
  try {
    const body: { invitationId?: string; guestName?: string; message?: string; question?: string } = await request.json();
    const { invitationId, guestName, message, question } = body;

    if (!invitationId || !guestName || !message) {
      return NextResponse.json(
        { error: "invitationId, guestName, and message are required" },
        { status: 400 }
      );
    }

    // Validate input lengths
    if (guestName.length > 50) {
      return NextResponse.json(
        { error: "이름은 50자 이내로 입력해주세요." },
        { status: 400 }
      );
    }
    if (message.length > 500) {
      return NextResponse.json(
        { error: "메시지는 500자 이내로 입력해주세요." },
        { status: 400 }
      );
    }

    // 청첩장 존재 여부 확인
    const invitation = await getInvitationById(invitationId);
    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    // 스팸 방지: 같은 이름으로 30초 이내 중복 등록 차단
    const recent = await getRecentGuestbookMessage(invitationId, guestName, 30);
    if (recent) {
      return NextResponse.json(
        { error: "잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    const guestbookMessage = await createGuestbookMessage({
      invitation_id: invitationId,
      guest_name: guestName,
      message: message,
      question: question,
    });

    return NextResponse.json({ data: guestbookMessage }, { status: 201 });
  } catch (error) {
    console.error("Failed to create guestbook message:", error);
    return NextResponse.json(
      { error: "Failed to create guestbook message" },
      { status: 500 }
    );
  }
}

// DELETE: 방명록 메시지 삭제 (소유자만 가능)
export async function DELETE(request: NextRequest) {
  const cookieName = getAuthCookieName();
  const token = request.cookies.get(cookieName)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const messageId = searchParams.get("messageId");
  const invitationId = searchParams.get("invitationId");

  if (!messageId || !invitationId) {
    return NextResponse.json(
      { error: "messageId and invitationId are required" },
      { status: 400 }
    );
  }

  try {
    const invitation = await getInvitationById(invitationId);
    if (!invitation || invitation.user_id !== payload.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const deleted = await deleteGuestbookMessage(messageId, invitationId);
    if (!deleted) {
      return NextResponse.json(
        { error: "Message not found or already deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete guestbook message:", error);
    return NextResponse.json(
      { error: "Failed to delete guestbook message" },
      { status: 500 }
    );
  }
}
