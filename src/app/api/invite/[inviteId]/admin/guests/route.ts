import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";
import {
  getGuestsByInvitationId,
  getGuestStats,
  createGuest,
  getGreetingTemplateById,
} from "@/lib/db";

// GET: 게스트 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  try {
    const { inviteId } = await params;

    // 인증 확인
    const auth = await verifyAdminRequest(request, inviteId);
    if (!auth.valid) {
      return auth.response;
    }

    const guests = await getGuestsByInvitationId(inviteId);
    const stats = await getGuestStats(inviteId);

    // 각 게스트에 대해 템플릿 정보 포함
    const guestsWithTemplates = await Promise.all(
      guests.map(async (guest) => {
        let templateName = null;
        if (guest.greeting_template_id) {
          const template = await getGreetingTemplateById(guest.greeting_template_id);
          templateName = template?.name || null;
        }
        return {
          ...guest,
          templateName,
          // 개인화 링크 생성
          personalLink: `/i/${inviteId}?guest=${guest.id}`,
        };
      })
    );

    return NextResponse.json({
      guests: guestsWithTemplates,
      stats,
    });
  } catch (error) {
    console.error("Get guests error:", error);
    return NextResponse.json(
      { error: "게스트 목록 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST: 게스트 추가
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  try {
    const { inviteId } = await params;

    // 인증 확인
    const auth = await verifyAdminRequest(request, inviteId);
    if (!auth.valid) {
      return auth.response;
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
      name: string;
      relation?: string;
      honorific?: string;
      intro_greeting?: string;
      greeting_template_id?: string;
      custom_message?: string;
    };

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "이름은 필수입니다" },
        { status: 400 }
      );
    }

    const guest = await createGuest({
      invitation_id: inviteId,
      name: name.trim(),
      relation: relation?.trim() || undefined,
      honorific: honorific || "님께",
      intro_greeting: intro_greeting?.trim() || undefined,
      greeting_template_id: greeting_template_id || undefined,
      custom_message: custom_message?.trim() || undefined,
    });

    return NextResponse.json(
      {
        guest: {
          ...guest,
          personalLink: `/i/${inviteId}?guest=${guest.id}`,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create guest error:", error);
    return NextResponse.json(
      { error: "게스트 추가 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
