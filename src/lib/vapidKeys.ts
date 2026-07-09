import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface VapidKeyDiag {
  publicKeySource: "env";
  privateKeySource: "env";
  publicKeyPresent: boolean;
  privateKeyPresent: boolean;
  publicKeyBytes: number;
  privateKeyBytes: number;
  privateKeyLen: number;
  pairConsistent: true;
}

export interface VapidKeyResult {
  publicKey: string;
  privateKey: string;
  subject: string;
  diag: VapidKeyDiag;
}

// fallback 없음: env에 VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY 필수
// 로컬 개발: .env.local, 프로덕션: wrangler vars + Cloudflare secret

function decodeByteLength(b64: string): number {
  try {
    let s = b64.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    return atob(s).length;
  } catch {
    return -1;
  }
}

export async function loadVapidKeys(): Promise<VapidKeyResult> {
  let envPub: string | undefined;
  let envPriv: string | undefined;
  let envSubject: string | undefined;

  try {
    const { env } = (await getCloudflareContext()) as unknown as {
      env: Record<string, string>;
    };
    envPub = env.VAPID_PUBLIC_KEY || undefined;
    envPriv = env.VAPID_PRIVATE_KEY || undefined;
    envSubject = env.VAPID_SUBJECT;
  } catch {
    envPub = process.env.VAPID_PUBLIC_KEY || undefined;
    envPriv = process.env.VAPID_PRIVATE_KEY || undefined;
    envSubject = process.env.VAPID_SUBJECT;
  }

  const hasEnvPub = !!envPub;
  const hasEnvPriv = !!envPriv;

  // 조건 2: 둘 중 하나만 있으면 에러 (fallback과 섞어 쓰지 않음)
  if (hasEnvPub !== hasEnvPriv) {
    const set = hasEnvPub ? "VAPID_PUBLIC_KEY" : "VAPID_PRIVATE_KEY";
    const missing = hasEnvPub ? "VAPID_PRIVATE_KEY" : "VAPID_PUBLIC_KEY";
    throw new Error(
      `VAPID key mismatch: ${set} is set but ${missing} is missing. Both must be configured as a pair.`
    );
  }

  if (!hasEnvPub || !hasEnvPriv) {
    throw new Error(
      "VAPID keys not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in env."
    );
  }

  const publicKey = envPub!;
  const privateKey = envPriv!;

  const publicKeyBytes = decodeByteLength(publicKey);
  const privateKeyBytes = decodeByteLength(privateKey);

  const diag: VapidKeyDiag = {
    publicKeySource: "env",
    privateKeySource: "env",
    publicKeyPresent: true,
    privateKeyPresent: true,
    publicKeyBytes,
    privateKeyBytes,
    privateKeyLen: privateKey.length,
    pairConsistent: true,
  };

  return {
    publicKey,
    privateKey,
    subject: envSubject || "mailto:hello@deardrawer.com",
    diag,
  };
}
