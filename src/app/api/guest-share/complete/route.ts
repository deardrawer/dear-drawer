import { NextRequest, NextResponse } from 'next/server'
import { getGuestUploadFile, markGuestFileUploaded, setGuestFileStatus } from '@/lib/guestUploadFiles'
import { headR2Object } from '@/lib/r2Presign'
import { enqueueDriveTransfer } from '@/lib/driveQueue'

/**
 * [공개] 업로드 완료 검증 + Drive 이전 enqueue.
 * 클라이언트는 fileId만 보내고, 서버가 DB에서 r2_key/size를 조회해 R2 HEAD로 실제 존재 + 크기(+타입)를 확인한다.
 *
 * 정합성(§Producer): R2 검증 → uploaded → DRIVE_QUEUE.send 성공 시에만 → queued.
 *  - send 실패/바인딩 없음 → uploaded로 유지(게스트엔 성공 응답). 재호출 시 uploaded면 enqueue만 재시도.
 *  - "queued인데 메시지 없음" 상태가 생기지 않도록 send 성공 이후에만 queued로 전환.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { fileId?: string }
    const fileId = body.fileId
    if (!fileId) return NextResponse.json({ error: 'fileId가 필요합니다.' }, { status: 400 })

    const file = await getGuestUploadFile(fileId)
    if (!file) return NextResponse.json({ error: '파일 정보를 찾을 수 없습니다.' }, { status: 404 })

    // 이미 파이프라인에 진입/완료된 경우 그대로 반환
    if (file.status === 'completed' || file.status === 'queued' || file.status === 'transferring') {
      return NextResponse.json({ status: file.status, queued: true })
    }

    // uploaded가 아니면 R2 HEAD로 검증 후 uploaded 처리
    if (file.status !== 'uploaded') {
      const head = await headR2Object(file.r2_key)
      if (!head) {
        await setGuestFileStatus(fileId, 'failed', 'R2 object 없음')
        return NextResponse.json({ error: '업로드가 확인되지 않았습니다.' }, { status: 409 })
      }
      if (file.size != null && head.size !== file.size) {
        await setGuestFileStatus(fileId, 'failed', `size 불일치 (expected ${file.size}, got ${head.size})`)
        return NextResponse.json({ error: '파일 크기가 일치하지 않습니다.' }, { status: 409 })
      }
      if (file.mime_type && head.contentType && head.contentType !== file.mime_type) {
        await setGuestFileStatus(fileId, 'failed', `content-type 불일치 (${head.contentType})`)
        return NextResponse.json({ error: '파일 형식이 일치하지 않습니다.' }, { status: 409 })
      }
      await markGuestFileUploaded(fileId)
    }

    // Drive 이전 enqueue (uploaded 상태에서 재시도 가능). send 성공 후에만 queued 전환.
    const enqueued = await enqueueDriveTransfer(fileId)
    if (enqueued) await setGuestFileStatus(fileId, 'queued')

    return NextResponse.json({ status: enqueued ? 'queued' : 'uploaded', queued: enqueued })
  } catch (e) {
    console.error('guest-share complete error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : '검증에 실패했습니다.' }, { status: 500 })
  }
}
