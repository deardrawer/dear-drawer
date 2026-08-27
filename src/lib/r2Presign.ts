import { AwsClient } from 'aws4fetch'
import { getServerEnv } from './serverEnv'
import { PRESIGN_EXPIRES_SECONDS } from './guestShareLimits'

/**
 * R2 presigned PUT URL 생성(aws4fetch, 서버 전용) + 서버측 HEAD 검증(R2 바인딩).
 * - R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY는 서버에서만 사용 (클라이언트 번들 미포함).
 * - presigned URL은 특정 key + PUT + Content-Type 에만 유효, 10분 만료.
 */

async function getR2S3Config() {
  const accountId = await getServerEnv('R2_ACCOUNT_ID')
  const accessKeyId = await getServerEnv('R2_ACCESS_KEY_ID')
  const secretAccessKey = await getServerEnv('R2_SECRET_ACCESS_KEY')
  const bucket = (await getServerEnv('R2_S3_BUCKET')) || 'dear-drawer-images'
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY 환경변수가 필요합니다.')
  }
  return { accountId, accessKeyId, secretAccessKey, bucket }
}

/**
 * 지정 key에 대한 PUT presigned URL. Content-Type을 서명에 포함 → 브라우저가 다른 타입으로 올리면 실패.
 */
export async function createPresignedPutUrl(key: string, contentType: string): Promise<string> {
  const { accountId, accessKeyId, secretAccessKey, bucket } = await getR2S3Config()
  const client = new AwsClient({ accessKeyId, secretAccessKey, service: 's3', region: 'auto' })

  const url = new URL(`https://${accountId}.r2.cloudflarestorage.com/${bucket}/${encodeURI(key)}`)
  url.searchParams.set('X-Amz-Expires', String(PRESIGN_EXPIRES_SECONDS))

  const signed = await client.sign(
    new Request(url.toString(), { method: 'PUT', headers: { 'Content-Type': contentType } }),
    { aws: { signQuery: true, allHeaders: true } },
  )
  return signed.url
}

/**
 * 서버측 HEAD (S3 API) — presigned PUT과 동일한 실제 R2 버킷을 조회.
 * (env.R2 바인딩은 next dev에서 로컬 miniflare를 가리켜 실제 업로드와 미스나므로 S3 HEAD 사용)
 */
export async function headR2Object(key: string): Promise<{ size: number; contentType?: string } | null> {
  const { accountId, accessKeyId, secretAccessKey, bucket } = await getR2S3Config()
  const client = new AwsClient({ accessKeyId, secretAccessKey, service: 's3', region: 'auto' })
  const url = `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${encodeURI(key)}`
  const res = await client.fetch(url, { method: 'HEAD' })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`R2 HEAD 실패: ${res.status}`)
  const len = res.headers.get('content-length')
  return { size: len ? parseInt(len, 10) : 0, contentType: res.headers.get('content-type') || undefined }
}
