import { NextRequest, NextResponse } from "next/server";
import { createRSVP, getRSVPsByInvitationId, getRSVPSummary } from "@/lib/db";

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

    // Validate guest count
    const guestCount = body.attendance === "attending" ? (body.guestCount || 1) : 0;

    // Validate side value if provided
    if (body.side && !["groom", "bride"].includes(body.side)) {
      return NextResponse.json(
        { error: "유효하지 않은 소속 값입니다." },
        { status: 400 }
      );
    }

    // Insert RSVP response
    const data = await createRSVP({
      invitation_id: body.invitationId,
      guest_name: body.guestName,
      guest_phone: body.guestPhone,
      attendance: body.attendance,
      guest_count: guestCount,
      message: body.message,
      side: body.side,
    });

    return NextResponse.json({
      success: true,
      message: "참석 여부가 저장되었습니다.",
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
    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get("invitationId");

    if (!invitationId) {
      return NextResponse.json(
        { error: "청첩장 ID가 필요합니다." },
        { status: 400 }
      );
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
