import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getAuthCookieName } from "@/lib/auth";
import {
  getInvitationById,
  updateInvitation,
  deleteInvitation,
} from "@/lib/db";
import type { InvitationInput } from "@/types/invitation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 청첩장 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const invitation = await getInvitationById(id);

    if (!invitation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // 본인 청첩장만 조회 가능
    if (invitation.user_id !== payload.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ invitation });
  } catch (error) {
    console.error("Get invitation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// 청첩장 업데이트
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const rawBody = await request.text();

    // Content 크기 제한 (5MB)
    if (rawBody.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "요청 데이터가 너무 큽니다." },
        { status: 413 }
      );
    }

    let body: InvitationInput;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "잘못된 요청 형식입니다." },
        { status: 400 }
      );
    }

    // 기본 필드 검증
    if (body.groom_name && body.groom_name.length > 50) {
      return NextResponse.json({ error: "신랑 이름이 너무 깁니다." }, { status: 400 });
    }
    if (body.bride_name && body.bride_name.length > 50) {
      return NextResponse.json({ error: "신부 이름이 너무 깁니다." }, { status: 400 });
    }
    if (body.slug && body.slug.length > 100) {
      return NextResponse.json({ error: "슬러그가 너무 깁니다." }, { status: 400 });
    }

    const invitation = await updateInvitation(id, payload.user.id, body);

    if (!invitation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ invitation });
  } catch (error) {
    console.error("Update invitation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// 청첩장 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const deleted = await deleteInvitation(id, payload.user.id);

    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete invitation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
