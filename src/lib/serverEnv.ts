import { getCloudflareContext } from '@opennextjs/cloudflare'

/**
 * Cloudflare 런타임 env(secret/binding) 접근 — getCloudflareContext().env 우선, process.env 폴백.
 * (auth.ts의 getEnvVar와 동일 패턴을 공용화)
 */
export async function getServerEnv(key: string): Promise<string | undefined> {
  try {
    const { env } = (await getCloudflareContext()) as unknown as { env: Record<string, string | undefined> }
    return env[key] || process.env[key]
  } catch {
    return process.env[key]
  }
}
