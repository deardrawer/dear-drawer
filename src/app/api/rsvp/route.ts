import { NextRequest, NextResponse } from "next/server";
import { createRSVP, findExistingRSVP, updateRSVP, getRSVPsByInvitationId, getRSVPSummary, deleteRSVP, getInvitationById } from "@/lib/db";
import { verifyToken, getAuthCookieName } from "@/lib/auth";

export type RSVPSubmission = {
  invitationId: string;
  guestName: string;
  guestPhone?: string;
  attendance: "attending" | "not_attending" | "pending";
  guestCount: number;
  message?: string;
  side?: "groom" | "bride";
};

export async function POST(request: NextRequest) {
  try {
    const body: RSVPSubmission = await request.json();

    // Validate required fields
    if (!body.invitationId || !body.guestName || !body.attendance) {
      return NextResponse.json(
        { error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    // Validate attendance value
    if (!["attending", "not_attending", "pending"].includes(body.attendance)) {
      return NextResponse.json(
        { error: "유효하지 않은 참석 여부입니다." },
        { status: 400 }
      );
    }

    // Validate input lengths
    if (body.guestName.length > 50) {
      return NextResponse.json(
        { error: "이름은 50자 이내로 입력해주세요." },
        { status: 400 }
      );
    }
    if (body.message && body.message.length > 500) {
      return NextResponse.json(
        { error: "메시지는 500자 이내로 입력해주세요." },
        { status: 400 }
      );
    }

    // Validate guest count
    const guestCount = body.attendance === "attending" ? Math.min(Math.max(body.guestCount || 1, 1), 100) : 0;

    // Validate side value if provided
    if (body.side && !["groom", "bride"].includes(body.side)) {
      return NextResponse.json(
        { error: "유효하지 않은 소속 값입니다." },
        { status: 400 }
      );
    }

    // 기존 RSVP 확인 (같은 이름+전화번호 → 업데이트)
    const existing = await findExistingRSVP(body.invitationId, body.guestName);

    let data;
    if (existing) {
      data = await updateRSVP(existing.id, {
        guest_phone: body.guestPhone,
        attendance: body.attendance,
        guest_count: guestCount,
        message: body.message,
        side: body.side,
      });
    } else {
      data = await createRSVP({
        invitation_id: body.invitationId,
        guest_name: body.guestName,
        guest_phone: body.guestPhone,
        attendance: body.attendance,
        guest_count: guestCount,
        message: body.message,
        side: body.side,
      });
    }

    return NextResponse.json({
      success: true,
      message: existing ? "참석 여부가 수정되었습니다." : "참석 여부가 저장되었습니다.",
      data,
    });
  } catch (error) {
    console.error("RSVP API 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
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
    const invitationId = searchParams.get("invitationId");

    if (!invitationId) {
      return NextResponse.json(
        { error: "청첩장 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const invitation = await getInvitationById(invitationId);
    if (!invitation || invitation.user_id !== payload.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await getRSVPsByInvitationId(invitationId);
    const summary = await getRSVPSummary(invitationId);

    return NextResponse.json({ data, summary });
  } catch (error) {
    console.error("RSVP GET API 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
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
    const id = searchParams.get("id");
    const invitationId = searchParams.get("invitationId");

    if (!id || !invitationId) {
      return NextResponse.json(
        { error: "ID와 청첩장 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const invitation = await getInvitationById(invitationId);
    if (!invitation || invitation.user_id !== payload.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const deleted = await deleteRSVP(id, invitationId);

    if (!deleted) {
      return NextResponse.json(
        { error: "해당 응답을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "RSVP 응답이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("RSVP DELETE API 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
