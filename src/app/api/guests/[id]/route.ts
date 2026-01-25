import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getAuthCookieName } from "@/lib/auth";
import {
  getGuestById,
  updateGuest,
  deleteGuest,
  getInvitationById,
} from "@/lib/db";

// 게스트 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const guest = await getGuestById(id);
    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    // 인증 확인 (선택적 - 공개 조회 허용 시 제거)
    const cookieName = getAuthCookieName();
    const token = request.cookies.get(cookieName)?.value;

    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        const invitation = await getInvitationById(guest.invitation_id);
        if (invitation && invitation.user_id === payload.user.id) {
          // 소유자는 전체 정보 반환
          return NextResponse.json({ guest });
        }
      }
    }

    // 비소유자/비인증은 기본 정보만 반환
    return NextResponse.json({
      guest: {
        id: guest.id,
        name: guest.name,
        relation: guest.relation,
        honorific: guest.honorific,
        intro_greeting: guest.intro_greeting,
        custom_message: guest.custom_message,
      },
    });
  } catch (error) {
    console.error("Get guest error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// 게스트 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const cookieName = getAuthCookieName();
    const token = request.cookies.get(cookieName)?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const guest = await getGuestById(id);
    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    // 청첩장 소유권 확인
    const invitation = await getInvitationById(guest.invitation_id);
    if (!invitation || invitation.user_id !== payload.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json() as {
      name?: string;
      relation?: string;
      honorific?: string;
      intro_greeting?: string;
      custom_message?: string;
    };
    const updatedGuest = await updateGuest(id, guest.invitation_id, {
      name: body.name,
      relation: body.relation,
      honorific: body.honorific,
      intro_greeting: body.intro_greeting,
      custom_message: body.custom_message,
    });

    return NextResponse.json({ guest: updatedGuest });
  } catch (error) {
    console.error("Update guest error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// 게스트 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const cookieName = getAuthCookieName();
    const token = request.cookies.get(cookieName)?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const guest = await getGuestById(id);
    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    // 청첩장 소유권 확인
    const invitation = await getInvitationById(guest.invitation_id);
    if (!invitation || invitation.user_id !== payload.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const deleted = await deleteGuest(id, guest.invitation_id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Failed to delete guest" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete guest error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
