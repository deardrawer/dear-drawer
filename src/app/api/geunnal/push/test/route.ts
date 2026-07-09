import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSubscriptionsByPageId } from "@/lib/geunnalDb";
import { sendPushNotification } from "@/lib/webPush";
import { verifyGeunnalToken } from "@/lib/geunnalAuth";

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const tokenOrSecret = auth?.replace("Bearer ", "");

  if (!tokenOrSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { pageId: bodyPageId } = body as { pageId?: string };

  // 인증: geunnal 토큰 또는 CRON_SECRET
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

  // VAPID 키
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
    return NextResponse.json({
      error: "VAPID keys not configured",
      debug: { publicKeySet: !!vapidPublicKey, privateKeySet: !!vapidPrivateKey },
    }, { status: 500 });
  }

  // 키 진단 정보
  function decodeLen(b64: string): number {
    try {
      let s = b64.replace(/-/g, '+').replace(/_/g, '/');
      while (s.length % 4) s += '=';
      return atob(s).length;
    } catch { return -1; }
  }
  const keyDiag = {
    publicKeyLen: vapidPublicKey.length,
    publicKeyBytes: decodeLen(vapidPublicKey),
    privateKeyLen: vapidPrivateKey.length,
    privateKeyBytes: decodeLen(vapidPrivateKey),
    privateKeyPrefix: vapidPrivateKey.slice(0, 12),
  };

  const subscriptions = await getSubscriptionsByPageId(pageId);

  if (subscriptions.length === 0) {
    return NextResponse.json({
      success: false,
      message: "등록된 푸시 구독이 없습니다. 알림을 먼저 활성화해주세요.",
      subscriptionCount: 0,
    });
  }

  const payload = {
    title: "🔔 디어드로어 테스트",
    body: "푸시 알림이 정상 작동합니다!",
    url: `/g/test`,
  };

  const results = [];
  for (const sub of subscriptions) {
    try {
      const result = await sendPushNotification(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payload,
        vapidPublicKey,
        vapidPrivateKey,
        vapidSubject
      );
      results.push({ id: sub.id, ...result });
    } catch (err) {
      results.push({ id: sub.id, success: false, error: String(err) });
    }
  }

  return NextResponse.json({
    success: true,
    subscriptionCount: subscriptions.length,
    results,
    keyDiag,
  });
}
