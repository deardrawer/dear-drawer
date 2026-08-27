import { getCloudflareContext } from '@opennextjs/cloudflare'

/**
 * DRIVE_QUEUE producer — R2 검증 완료 파일을 guest-drive-transfer 큐로 보낸다.
 * 메시지는 { fileId }만 (조작 표면 최소화, consumer가 D1 재조회).
 */

interface DriveQueue {
  send(body: unknown): Promise<void>
}
interface EnvWithQueue {
  DRIVE_QUEUE?: DriveQueue
}

/**
 * enqueue 성공 시 true. 바인딩 미설정(로컬/미배포)이거나 send 실패면 false.
 * false면 호출부는 status를 'uploaded'로 유지해 이후 재-enqueue가 가능하게 한다.
 */
export async function enqueueDriveTransfer(fileId: string): Promise<boolean> {
  try {
    const { env } = (await getCloudflareContext()) as unknown as { env: EnvWithQueue }
    if (!env.DRIVE_QUEUE) return false
    await env.DRIVE_QUEUE.send({ fileId })
    return true
  } catch (e) {
    console.error('DRIVE_QUEUE enqueue 실패:', e instanceof Error ? e.message : e)
    return false
  }
}
