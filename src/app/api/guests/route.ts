import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getAuthCookieName } from "@/lib/auth";
import {
  createGuest,
  createGuestsBulk,
  getGuestsByInvitationId,
  getGuestStats,
  getInvitationById,
} from "@/lib/db";
import type { GuestInput } from "@/lib/db";

// 게스트 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get("invitationId");

    if (!invitationId) {
      return NextResponse.json(
        { error: "invitationId is required" },
        { status: 400 }
      );
    }

    // 인증 확인
    const cookieName = getAuthCookieName();
    const token = request.cookies.get(cookieName)?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // 청첩장 소유권 확인
    const invitation = await getInvitationById(invitationId);
    if (!invitation || invitation.user_id !== payload.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const guests = await getGuestsByInvitationId(invitationId);
    const stats = await getGuestStats(invitationId);

    return NextResponse.json({ guests, stats });
  } catch (error) {
    console.error("Get guests error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// 게스트 생성 (단일 또는 일괄)
export async function POST(request: NextRequest) {
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

    interface GuestRequestBody {
      invitationId?: string;
      guests?: Array<{
        name: string;
        relation?: string;
        honorific?: string;
        intro_greeting?: string;
        custom_message?: string;
      }>;
      name?: string;
      relation?: string;
      honorific?: string;
      intro_greeting?: string;
      custom_message?: string;
    }
    const body = await request.json() as GuestRequestBody;
    const { invitationId, guests: guestInputs, ...singleGuest } = body;

    if (!invitationId) {
      return NextResponse.json(
        { error: "invitationId is required" },
        { status: 400 }
      );
    }

    // 청첩장 소유권 확인
    const invitation = await getInvitationById(invitationId);
    if (!invitation || invitation.user_id !== payload.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 일괄 생성
    if (Array.isArray(guestInputs) && guestInputs.length > 0) {
      const guests = await createGuestsBulk(invitationId, guestInputs);
      return NextResponse.json({ guests }, { status: 201 });
    }

    // 단일 생성
    if (!singleGuest.name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    const guestInput: GuestInput = {
      invitation_id: invitationId,
      name: singleGuest.name,
      relation: singleGuest.relation,
      honorific: singleGuest.honorific,
      intro_greeting: singleGuest.intro_greeting,
      custom_message: singleGuest.custom_message,
    };

    const guest = await createGuest(guestInput);
    return NextResponse.json({ guest }, { status: 201 });
  } catch (error) {
    console.error("Create guest error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
