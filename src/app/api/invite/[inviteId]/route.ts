import { NextRequest, NextResponse } from "next/server";
import { getInvitationById, recordPageView } from "@/lib/db";

// GET: 청첩장 정보 조회 (공개 API)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  try {
    const { inviteId } = await params;

    // 청첩장 조회
    const invitation = await getInvitationById(inviteId);
    if (!invitation) {
      return NextResponse.json(
        { error: "청첩장을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 페이지 조회 기록 (IP는 선택적)
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || undefined;
    const userAgent = request.headers.get("user-agent") || undefined;

    await recordPageView(inviteId, ip, userAgent);

    // 공개 정보만 반환 (민감 정보 제외)
    return NextResponse.json({
      invitation: {
        id: invitation.id,
        template_id: invitation.template_id,
        groom_name: invitation.groom_name,
        bride_name: invitation.bride_name,
        wedding_date: invitation.wedding_date,
        wedding_time: invitation.wedding_time,
        venue_name: invitation.venue_name,
        venue_address: invitation.venue_address,
        venue_detail: invitation.venue_detail,
        venue_map_url: invitation.venue_map_url,
        main_image: invitation.main_image,
        gallery_images: invitation.gallery_images,
        greeting_message: invitation.greeting_message,
        content: invitation.content,
      },
    });
  } catch (error) {
    console.error("Get invitation error:", error);
    return NextResponse.json(
      { error: "청첩장 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
