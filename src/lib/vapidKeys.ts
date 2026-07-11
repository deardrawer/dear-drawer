import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface VapidKeyResult {
  publicKey: string;
  privateKey: string;
  subject: string;
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

  return {
    publicKey: envPub!,
    privateKey: envPriv!,
    subject: envSubject || "mailto:hello@deardrawer.com",
  };
}
