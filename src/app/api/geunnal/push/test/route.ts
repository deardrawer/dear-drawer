import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSubscriptionsByPageId, deletePushSubscriptionById } from "@/lib/geunnalDb";
import { sendPushNotification } from "@/lib/webPush";
import { verifyGeunnalToken } from "@/lib/geunnalAuth";
import { loadVapidKeys } from "@/lib/vapidKeys";

function base64UrlDecodeFn(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '')
  while (str.length % 4) str += '='
  const binary = atob(str)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

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

  const { publicKey, privateKey, subject, diag } = vapidKeys;

  // 키 쌍 self-test: sign → verify (민감정보 미출력)
  const selfTest: Record<string, unknown> = {};
  try {
    const privKeyBytes = base64UrlDecodeFn(privateKey);
    const pubKeyBytes = base64UrlDecodeFn(publicKey);
    selfTest.privKeyBytes = privKeyBytes.length;
    selfTest.pubKeyBytes = pubKeyBytes.length;

    const privBuf = privKeyBytes.buffer.slice(privKeyBytes.byteOffset, privKeyBytes.byteOffset + privKeyBytes.byteLength) as ArrayBuffer;
    const pubBuf = pubKeyBytes.buffer.slice(pubKeyBytes.byteOffset, pubKeyBytes.byteOffset + pubKeyBytes.byteLength) as ArrayBuffer;

    const ecPriv = await crypto.subtle.importKey(
      'pkcs8', privBuf, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']
    );
    selfTest.privKeyImported = true;

    const ecPub = await crypto.subtle.importKey(
      'raw', pubBuf, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']
    );
    selfTest.pubKeyImported = true;

    const testData = new TextEncoder().encode('vapid-self-test');
    const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, ecPriv, testData);
    const sigBytes = new Uint8Array(sig);
    selfTest.signatureLen = sigBytes.length;
    selfTest.signatureFirstByte = `0x${sigBytes[0]?.toString(16).padStart(2, '0')}`;
    selfTest.signatureFormat = sigBytes.length === 64 ? 'raw' : (sigBytes[0] === 0x30 ? 'DER' : 'unknown');

    const verified = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, ecPub, sig, testData);
    selfTest.verified = verified;
  } catch (err) {
    selfTest.error = String(err);
  }

  const subscriptions = await getSubscriptionsByPageId(pageId);

  if (subscriptions.length === 0) {
    return NextResponse.json({
      success: false,
      message: "등록된 푸시 구독이 없습니다. 알림을 먼저 활성화해주세요.",
      subscriptionCount: 0,
      keyDiag: diag,
      selfTest,
      serverPublicKeyPrefix: publicKey.slice(0, 20),
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
        results.push({ id: sub.id, ...result, endpoint: sub.endpoint.slice(0, 60), cleaned: true });
      } else {
        results.push({ id: sub.id, ...result, endpoint: sub.endpoint.slice(0, 60) });
      }
    } catch (err) {
      results.push({ id: sub.id, success: false, error: String(err) });
    }
  }

  return NextResponse.json({
    success: true,
    subscriptionCount: subscriptions.length,
    results,
    keyDiag: diag,
    selfTest,
    serverPublicKeyPrefix: publicKey.slice(0, 20),
  });
}
