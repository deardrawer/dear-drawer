import { NextRequest, NextResponse } from "next/server";
import { verifyGeunnalToken } from "@/lib/geunnalAuth";
import {
  upsertPushSubscription,
  deletePushSubscription,
  getNotificationSettings,
  upsertNotificationSettings,
  deleteNotificationSettings,
} from "@/lib/geunnalDb";
import type { NotificationDayBefore } from "@/types/geunnal";

function getToken(request: NextRequest): string | null {
  const auth = request.headers.get("authorization");
  return auth?.replace("Bearer ", "") || null;
}

// GET: 현재 알림 설정 조회
export async function GET(request: NextRequest) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const payload = await verifyGeunnalToken(token);
  if (!payload) return NextResponse.json({ error: "유효하지 않은 토큰" }, { status: 401 });

  const settings = await getNotificationSettings(payload.pageId);
  return NextResponse.json({
    dayBefore: settings?.day_before || "none",
    notifyTime: settings?.notify_time || "09:00",
  });
}

// POST: 구독 등록 + 설정 저장
export async function POST(request: NextRequest) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const payload = await verifyGeunnalToken(token);
  if (!payload) return NextResponse.json({ error: "유효하지 않은 토큰" }, { status: 401 });

  const body = await request.json();
  const { endpoint, p256dh, auth, dayBefore, notifyTime } = body as {
    endpoint: string;
    p256dh: string;
    auth: string;
    dayBefore: NotificationDayBefore;
    notifyTime: string;
  };

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "구독 정보가 필요합니다" }, { status: 400 });
  }

  const validDays: NotificationDayBefore[] = ["none", "0d", "1d", "2d"];
  if (!validDays.includes(dayBefore)) {
    return NextResponse.json({ error: "잘못된 알림 설정" }, { status: 400 });
  }

  await upsertPushSubscription(payload.pageId, endpoint, p256dh, auth);
  await upsertNotificationSettings(payload.pageId, dayBefore, notifyTime || "09:00");

  return NextResponse.json({ success: true });
}

// DELETE: 구독 해제 + 설정 제거
export async function DELETE(request: NextRequest) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const payload = await verifyGeunnalToken(token);
  if (!payload) return NextResponse.json({ error: "유효하지 않은 토큰" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { endpoint } = body as { endpoint?: string };

  if (endpoint) {
    await deletePushSubscription(endpoint);
  }
  await deleteNotificationSettings(payload.pageId);

  return NextResponse.json({ success: true });
}
