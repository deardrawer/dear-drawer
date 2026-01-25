import { NextRequest, NextResponse } from "next/server";
import {
  getGuestById,
  getGreetingTemplateById,
  recordGuestView,
  getInvitationById,
} from "@/lib/db";

// GET: 게스트 정보 조회 (공개 API - 청첩장 개인화용)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string; guestId: string }> }
) {
  try {
    const { inviteId, guestId } = await params;

    // 청첩장 존재 확인
    const invitation = await getInvitationById(inviteId);
    if (!invitation) {
      return NextResponse.json(
        { error: "청첩장을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 게스트 조회
    const guest = await getGuestById(guestId);
    if (!guest || guest.invitation_id !== inviteId) {
      return NextResponse.json(
        { error: "게스트를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 열람 기록
    await recordGuestView(guestId);

    // 인사말 결정 (템플릿 또는 커스텀 메시지)
    let greeting = guest.custom_message || null;

    if (guest.greeting_template_id && !guest.custom_message) {
      const template = await getGreetingTemplateById(guest.greeting_template_id);
      if (template) {
        // 템플릿 변수 치환: {이름}, {관계}
        greeting = template.content
          .replace(/\{이름\}/g, guest.name)
          .replace(/\{관계\}/g, guest.relation || "");
      }
    }

    // 봉투 표시명 생성: "홍길동 이모님께" 또는 "홍길동 님께"
    const displayName = guest.relation
      ? `${guest.name} ${guest.relation}${guest.honorific}`
      : `${guest.name} ${guest.honorific}`;

    return NextResponse.json({
      name: guest.name,
      relation: guest.relation,
      honorific: guest.honorific,
      displayName,
      introGreeting: guest.intro_greeting,
      greeting,
    });
  } catch (error) {
    console.error("Get guest error:", error);
    return NextResponse.json(
      { error: "게스트 정보 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
