import { NextRequest, NextResponse } from "next/server";
import { createRSVP, findExistingRSVP, updateRSVP, updateRSVPAdmin, getRSVPsByInvitationId, getRSVPSummary, deleteRSVP, getInvitationById } from "@/lib/db";
import { verifyToken, getAuthCookieName } from "@/lib/auth";
import { getPageByInvitationId, getRsvpNotifySubscriptions } from "@/lib/geunnalDb";
import { sendPushNotification } from "@/lib/webPush";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// RSVP POST Rate Limiter (IP별 분당 10회)
const rsvpRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RSVP_RATE_LIMIT = 10;
const RSVP_RATE_WINDOW_MS = 60_000;

function checkRsvpRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rsvpRateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rsvpRateLimitMap.set(ip, { count: 1, resetAt: now + RSVP_RATE_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RSVP_RATE_LIMIT;
}

export type RSVPSubmission = {
  invitationId: string;
  guestName: string;
  guestPhone?: string;
  attendance: "attending" | "not_attending" | "pending";
  guestCount: number;
  message?: string;
  side?: "groom" | "bride";
  sideDetail?: "self" | "father" | "mother";
  mealAttendance?: "yes" | "no";
  shuttleBus?: "yes" | "no";
};

export async function POST(request: NextRequest) {
  try {
    // Rate Limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRsvpRateLimit(ip)) {
      return NextResponse.json(
        { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

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
    if (body.guestPhone && body.guestPhone.length > 20) {
      return NextResponse.json(
        { error: "전화번호 형식이 올바르지 않습니다." },
        { status: 400 }
      );
    }
    // 4자리 뒷자리 형식 검증 (값이 있을 때만)
    if (body.guestPhone && body.guestPhone.length <= 4 && !/^\d{4}$/.test(body.guestPhone)) {
      return NextResponse.json(
        { error: "연락처 뒷자리는 숫자 4자리여야 합니다." },
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

    // Validate sideDetail value if provided
    if (body.sideDetail && !["self", "father", "mother"].includes(body.sideDetail)) {
      return NextResponse.json(
        { error: "유효하지 않은 초대 경로 값입니다." },
        { status: 400 }
      );
    }

    // 참석이 아닌 경우 식사/대절버스 여부는 null
    const mealAttendance = body.attendance === "attending" ? body.mealAttendance : undefined;
    const shuttleBus = body.attendance === "attending" ? body.shuttleBus : undefined;

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
        side_detail: body.sideDetail,
        meal_attendance: mealAttendance,
        shuttle_bus: shuttleBus,
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
        side_detail: body.sideDetail,
        meal_attendance: mealAttendance,
        shuttle_bus: shuttleBus,
      });
    }

    const response = NextResponse.json({
      success: true,
      message: existing ? "참석 여부가 수정되었습니다." : "참석 여부가 저장되었습니다.",
      data,
    });

    // Send push notification to Geunnal PWA
    const sendRsvpPushNotification = async () => {
      try {
        const page = await getPageByInvitationId(body.invitationId);
        if (!page) return;

        const subscriptions = await getRsvpNotifySubscriptions(page.id);
        if (subscriptions.length === 0) return;

        const attendLabel = body.attendance === 'attending' ? '참석' : body.attendance === 'not_attending' ? '불참' : '미정';
        const guestInfo = body.attendance === 'attending' && guestCount > 1 ? ` (${guestCount}명)` : '';
        const payload = {
          title: '새 참석 응답',
          body: `${body.guestName}님이 ${attendLabel}으로 응답했습니다.${guestInfo}`,
          url: `/g/${page.slug}#dashboard`,
        };

        // Cloudflare env에서 먼저, 없으면 process.env fallback
        let vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
        let vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
        let vapidSubject = process.env.VAPID_SUBJECT || 'mailto:hello@deardrawer.com';

        try {
          const { env } = (await getCloudflareContext()) as unknown as { env: Record<string, string> };
          vapidPublicKey = env.VAPID_PUBLIC_KEY || vapidPublicKey;
          vapidPrivateKey = env.VAPID_PRIVATE_KEY || vapidPrivateKey;
          vapidSubject = env.VAPID_SUBJECT || vapidSubject;
        } catch {
          // Non-CF environment, use process.env values
        }

        for (const sub of subscriptions) {
          try {
            await sendPushNotification(sub, payload, vapidPublicKey, vapidPrivateKey, vapidSubject);
          } catch (e) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('Push notification failed for subscription:', sub.endpoint, e);
            }
          }
        }
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('RSVP push notification failed:', e);
        }
      }
    };

    // Cloudflare: ctx.waitUntil()로 백그라운드 실행, 로컬: await 직접 실행
    try {
      const { ctx } = (await getCloudflareContext()) as unknown as { ctx: { waitUntil: (p: Promise<void>) => void } };
      ctx.waitUntil(sendRsvpPushNotification());
    } catch {
      // Non-CF environment (local dev) — run directly
      await sendRsvpPushNotification();
    }

    return response;
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

// 관리자 RSVP 수정 (대시보드에서 직접 수정)
export async function PUT(request: NextRequest) {
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

    const body: RSVPSubmission & { id?: string } = await request.json();
    const { id, invitationId, guestName, guestPhone, attendance, guestCount, message, side, sideDetail, mealAttendance, shuttleBus } = body;

    if (!id || !invitationId || !guestName || !attendance) {
      return NextResponse.json(
        { error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 소유권 검증
    const invitation = await getInvitationById(invitationId);
    if (!invitation || invitation.user_id !== payload.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 유효성 검증
    if (!["attending", "not_attending", "pending"].includes(attendance)) {
      return NextResponse.json({ error: "유효하지 않은 참석 여부입니다." }, { status: 400 });
    }
    if (guestName.length > 50) {
      return NextResponse.json({ error: "이름은 50자 이내로 입력해주세요." }, { status: 400 });
    }
    if (guestPhone && guestPhone.length <= 4 && !/^\d{4}$/.test(guestPhone)) {
      return NextResponse.json({ error: "연락처 뒷자리는 숫자 4자리여야 합니다." }, { status: 400 });
    }
    if (side && !["groom", "bride"].includes(side)) {
      return NextResponse.json({ error: "유효하지 않은 소속 값입니다." }, { status: 400 });
    }
    if (sideDetail && !["self", "father", "mother"].includes(sideDetail)) {
      return NextResponse.json({ error: "유효하지 않은 초대 경로 값입니다." }, { status: 400 });
    }
    if (message && message.length > 500) {
      return NextResponse.json({ error: "메시지는 500자 이내로 입력해주세요." }, { status: 400 });
    }

    // 참석이 아닌 경우 관련 필드 정리
    const finalGuestCount = attendance === "attending" ? Math.min(Math.max(guestCount || 1, 1), 100) : 0;
    const finalMealAttendance = attendance === "attending" ? mealAttendance : undefined;
    const finalShuttleBus = attendance === "attending" ? shuttleBus : undefined;

    const data = await updateRSVPAdmin(id, {
      guest_name: guestName.trim(),
      guest_phone: guestPhone || undefined,
      attendance,
      guest_count: finalGuestCount,
      message: message || undefined,
      side: side || undefined,
      side_detail: sideDetail || undefined,
      meal_attendance: finalMealAttendance,
      shuttle_bus: finalShuttleBus,
    });

    if (!data) {
      return NextResponse.json({ error: "해당 응답을 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "응답이 수정되었습니다.",
      data,
    });
  } catch (error) {
    console.error("RSVP PUT API 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
