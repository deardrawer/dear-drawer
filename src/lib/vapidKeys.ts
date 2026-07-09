import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface VapidKeyDiag {
  publicKeySource: "env" | "fallback";
  privateKeySource: "env" | "fallback";
  publicKeyPresent: boolean;
  privateKeyPresent: boolean;
  publicKeyBytes: number;
  privateKeyBytes: number;
  privateKeyLen: number;
  pairConsistent: boolean;
  warning?: string;
}

export interface VapidKeyResult {
  publicKey: string;
  privateKey: string;
  subject: string;
  diag: VapidKeyDiag;
}

// dev/test 전용 fallback (프로덕션에서는 env가 반드시 설정되어야 함)
const DEV_PUB =
  "BAL5L0r_CPM_Sgb6FqMLDtB86misgzGxHxpq1oVxe7lsTImoLvi8utGcG2wJyYz7VPP9YWiVcDfkA6T35X3L8Ug";
const DEV_PRIV =
  "MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgEb2a5ZMbVuvS6Zgh5AVcEktxJgEByEFzst0IDoHA8-qhRANCAAQC-S9K_wjzP0oG-hajCw7QfOporIMxsR8aataFcXu5bEyJqC74vLrRnBtsCcmM-1Tz_WFolXA35AOk9-V9y_FI";

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

  let publicKey: string;
  let privateKey: string;
  let pubSource: "env" | "fallback";
  let privSource: "env" | "fallback";

  if (hasEnvPub && hasEnvPriv) {
    publicKey = envPub!;
    privateKey = envPriv!;
    pubSource = "env";
    privSource = "env";
  } else {
    publicKey = DEV_PUB;
    privateKey = DEV_PRIV;
    pubSource = "fallback";
    privSource = "fallback";
  }

  const publicKeyBytes = decodeByteLength(publicKey);
  const privateKeyBytes = decodeByteLength(privateKey);

  const diag: VapidKeyDiag = {
    publicKeySource: pubSource,
    privateKeySource: privSource,
    publicKeyPresent: !!publicKey,
    privateKeyPresent: !!privateKey,
    publicKeyBytes,
    privateKeyBytes,
    privateKeyLen: privateKey.length,
    pairConsistent: pubSource === privSource,
    ...(pubSource === "fallback" && {
      warning: "Using dev/test fallback keys. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in env for production.",
    }),
  };

  return {
    publicKey,
    privateKey,
    subject: envSubject || "mailto:hello@deardrawer.com",
    diag,
  };
}
