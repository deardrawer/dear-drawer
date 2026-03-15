import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  getAllActiveNotificationSettings,
  getSubscriptionsByPageId,
  getEventsByPageId,
  updateLastSentDate,
  deletePushSubscriptionById,
} from "@/lib/geunnalDb";
import { sendPushNotification } from "@/lib/webPush";

// KST 현재 날짜/시간 가져오기
function getKSTNow(): { date: string; time: string } {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const date = kst.toISOString().slice(0, 10); // YYYY-MM-DD
  const time = String(kst.getUTCHours()).padStart(2, "0") + ":" + String(kst.getUTCMinutes()).padStart(2, "0");
  return { date, time };
}

// 날짜 오프셋 계산
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function POST(request: NextRequest) {
  // CRON_SECRET 인증
  const auth = request.headers.get("authorization");
  const cronSecret = auth?.replace("Bearer ", "");

  let envSecret: string | undefined;
  try {
    const { env } = (await getCloudflareContext()) as unknown as { env: Record<string, string> };
    envSecret = env.CRON_SECRET;
  } catch {
    envSecret = process.env.CRON_SECRET;
  }

  if (!cronSecret || !envSecret || cronSecret !== envSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // VAPID 키 가져오기
  let vapidPublicKey: string;
  let vapidPrivateKey: string;
  let vapidSubject: string;
  try {
    const { env } = (await getCloudflareContext()) as unknown as { env: Record<string, string> };
    vapidPublicKey = env.VAPID_PUBLIC_KEY;
    vapidPrivateKey = env.VAPID_PRIVATE_KEY;
    vapidSubject = env.VAPID_SUBJECT || "mailto:hello@deardrawer.com";
  } catch {
    vapidPublicKey = process.env.VAPID_PUBLIC_KEY || "";
    vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
    vapidSubject = process.env.VAPID_SUBJECT || "mailto:hello@deardrawer.com";
  }

  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
  }

  const { date: today, time: currentTime } = getKSTNow();
  const allSettings = await getAllActiveNotificationSettings();

  let sent = 0;
  let skipped = 0;
  let expired = 0;

  for (const setting of allSettings) {
    // 시간 매칭: cron은 5분 간격이므로 ±2분 허용
    const [setH, setM] = setting.notify_time.split(":").map(Number);
    const [curH, curM] = currentTime.split(":").map(Number);
    const setTotal = setH * 60 + setM;
    const curTotal = curH * 60 + curM;
    if (Math.abs(setTotal - curTotal) > 2) {
      skipped++;
      continue;
    }

    // 중복 방지: 오늘 이미 발송했으면 건너뛰기
    if (setting.last_sent_date === today) {
      skipped++;
      continue;
    }

    // 이벤트 조회 → 날짜 매칭
    const events = await getEventsByPageId(setting.page_id);
    const offsetMap: Record<string, number> = { "0d": 0, "1d": 1, "2d": 2 };
    const offset = offsetMap[setting.day_before] ?? 0;

    // 오늘 + offset 일자에 이벤트가 있는지 확인
    const targetDate = addDays(today, offset);
    const matchingEvents = events.filter((e) => e.date === targetDate);

    if (matchingEvents.length === 0) {
      skipped++;
      continue;
    }

    // 구독 목록에 Push 발송
    const subscriptions = await getSubscriptionsByPageId(setting.page_id);
    if (subscriptions.length === 0) {
      skipped++;
      continue;
    }

    const eventNames = matchingEvents.map((e) => e.name).join(", ");
    const dayLabel =
      setting.day_before === "0d" ? "오늘" :
      setting.day_before === "1d" ? "내일" : "모레";

    const payload = {
      title: `${setting.groom_name}♥${setting.bride_name} 근날`,
      body: `${dayLabel} 모임이 있어요: ${eventNames}`,
      url: `/g/${setting.slug}`,
    };

    for (const sub of subscriptions) {
      try {
        const result = await sendPushNotification(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          payload,
          vapidPublicKey,
          vapidPrivateKey,
          vapidSubject
        );

        if (result.expired) {
          await deletePushSubscriptionById(sub.id);
          expired++;
        } else if (result.success) {
          sent++;
        }
      } catch (err) {
        console.error(`Push failed for ${sub.id}:`, err);
      }
    }

    await updateLastSentDate(setting.page_id, today);
  }

  return NextResponse.json({
    success: true,
    date: today,
    time: currentTime,
    stats: { sent, skipped, expired, total: allSettings.length },
  });
}
