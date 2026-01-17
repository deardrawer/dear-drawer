import { NextRequest, NextResponse } from "next/server";
import {
  createGuestbookMessage,
  getGuestbookMessages,
  deleteGuestbookMessage,
  getInvitationById,
} from "@/lib/db";

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

    // 청첩장 존재 여부 확인
    const invitation = await getInvitationById(invitationId);
    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
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

// DELETE: 방명록 메시지 삭제
export async function DELETE(request: NextRequest) {
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
