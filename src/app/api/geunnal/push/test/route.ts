import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSubscriptionsByPageId, deletePushSubscriptionById } from "@/lib/geunnalDb";
import { sendPushNotification } from "@/lib/webPush";
import { verifyGeunnalToken } from "@/lib/geunnalAuth";
import { loadVapidKeys } from "@/lib/vapidKeys";

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const tokenOrSecret = auth?.replace("Bearer ", "");

  if (!tokenOrSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { pageId: bodyPageId } = body as { pageId?: string };

  let pageId: string | undefined;

  const geunnalPayload = await verifyGeunnalToken(tokenOrSecret);
  if (geunnalPayload) {
    pageId = geunnalPayload.pageId;
  } else {
    let envSecret: string | undefined;
    try {
      const { env } = (await getCloudflareContext()) as unknown as { env: Record<string, string> };
      envSecret = env.CRON_SECRET;
    } catch {
      envSecret = process.env.CRON_SECRET;
    }

    if (tokenOrSecret === envSecret && bodyPageId) {
      pageId = bodyPageId;
    }
  }

  if (!pageId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let vapidKeys;
  try {
    vapidKeys = await loadVapidKeys();
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }

  const { publicKey, privateKey, subject } = vapidKeys;

  const subscriptions = await getSubscriptionsByPageId(pageId);

  if (subscriptions.length === 0) {
    return NextResponse.json({
      success: false,
      message: "등록된 푸시 구독이 없습니다. 알림을 먼저 활성화해주세요.",
      subscriptionCount: 0,
    });
  }

  const payload = {
    title: "💌 디어드로어",
    body: "푸시 알림이 정상 작동합니다!",
    url: `/g/test`,
    tag: `test-${Date.now()}`,
  };

  const results = [];
  for (const sub of subscriptions) {
    try {
      const result = await sendPushNotification(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payload,
        publicKey,
        privateKey,
        subject
      );
      if (result.expired || result.statusCode === 403) {
        await deletePushSubscriptionById(sub.id);
        results.push({ id: sub.id, success: false, statusCode: result.statusCode, cleaned: true });
      } else {
        results.push({ id: sub.id, success: result.success, statusCode: result.statusCode });
      }
    } catch (err) {
      results.push({ id: sub.id, success: false, error: String(err) });
    }
  }

  return NextResponse.json({
    success: true,
    subscriptionCount: subscriptions.length,
    results,
  });
}
