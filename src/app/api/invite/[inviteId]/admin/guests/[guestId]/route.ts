import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";
import { getGuestById, updateGuest, deleteGuest } from "@/lib/db";

// GET: 게스트 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string; guestId: string }> }
) {
  try {
    const { inviteId, guestId } = await params;

    // 인증 확인
    const auth = await verifyAdminRequest(request, inviteId);
    if (!auth.valid) {
      return auth.response;
    }

    const guest = await getGuestById(guestId);
    if (!guest) {
      return NextResponse.json(
        { error: "게스트를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 청첩장 소속 확인
    if (guest.invitation_id !== inviteId) {
      return NextResponse.json(
        { error: "권한이 없습니다" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      guest: {
        ...guest,
        personalLink: `/i/${inviteId}?guest=${guest.id}`,
      },
    });
  } catch (error) {
    console.error("Get guest error:", error);
    return NextResponse.json(
      { error: "게스트 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// PUT: 게스트 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string; guestId: string }> }
) {
  try {
    const { inviteId, guestId } = await params;

    // 인증 확인
    const auth = await verifyAdminRequest(request, inviteId);
    if (!auth.valid) {
      return auth.response;
    }

    // 게스트 존재 및 소속 확인
    const existingGuest = await getGuestById(guestId);
    if (!existingGuest) {
      return NextResponse.json(
        { error: "게스트를 찾을 수 없습니다" },
        { status: 404 }
      );
    }
    if (existingGuest.invitation_id !== inviteId) {
      return NextResponse.json(
        { error: "권한이 없습니다" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      relation,
      honorific,
      intro_greeting,
      greeting_template_id,
      custom_message,
    } = body as {
      name?: string;
      relation?: string;
      honorific?: string;
      intro_greeting?: string;
      greeting_template_id?: string | null;
      custom_message?: string;
    };

    const guest = await updateGuest(guestId, inviteId, {
      name: name?.trim(),
      relation: relation?.trim(),
      honorific,
      intro_greeting: intro_greeting?.trim(),
      greeting_template_id: greeting_template_id ?? undefined,
      custom_message: custom_message?.trim(),
    });

    if (!guest) {
      return NextResponse.json(
        { error: "게스트 수정에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      guest: {
        ...guest,
        personalLink: `/i/${inviteId}?guest=${guest.id}`,
      },
    });
  } catch (error) {
    console.error("Update guest error:", error);
    return NextResponse.json(
      { error: "게스트 수정 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// DELETE: 게스트 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string; guestId: string }> }
) {
  try {
    const { inviteId, guestId } = await params;

    // 인증 확인
    const auth = await verifyAdminRequest(request, inviteId);
    if (!auth.valid) {
      return auth.response;
    }

    // 게스트 존재 및 소속 확인
    const existingGuest = await getGuestById(guestId);
    if (!existingGuest) {
      return NextResponse.json(
        { error: "게스트를 찾을 수 없습니다" },
        { status: 404 }
      );
    }
    if (existingGuest.invitation_id !== inviteId) {
      return NextResponse.json(
        { error: "권한이 없습니다" },
        { status: 403 }
      );
    }

    const success = await deleteGuest(guestId, inviteId);
    if (!success) {
      return NextResponse.json(
        { error: "게스트 삭제에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete guest error:", error);
    return NextResponse.json(
      { error: "게스트 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
