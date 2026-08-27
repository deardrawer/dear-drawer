import { NextRequest, NextResponse } from 'next/server'
import { getGuestUploadFile, markGuestFileUploaded, setGuestFileStatus } from '@/lib/guestUploadFiles'
import { headR2Object } from '@/lib/r2Presign'

/**
 * [공개] 업로드 완료 검증. 클라이언트는 fileId만 보내고, 서버가 DB에서 r2_key/size를 조회해
 * R2 HEAD로 실제 존재 + 크기(+content-type) 일치를 확인한 뒤에만 uploaded 처리한다.
 * (B2에서 uploaded → Queue enqueue 예정)
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { fileId?: string }
    const fileId = body.fileId
    if (!fileId) return NextResponse.json({ error: 'fileId가 필요합니다.' }, { status: 400 })

    const file = await getGuestUploadFile(fileId)
    if (!file) return NextResponse.json({ error: '파일 정보를 찾을 수 없습니다.' }, { status: 404 })
    if (file.status === 'uploaded' || file.status === 'completed' || file.status === 'queued') {
      return NextResponse.json({ status: file.status })
    }

    // 서버 보유 r2_key로 검증 (클라이언트가 key/size 변경 불가)
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
    return NextResponse.json({ status: 'uploaded' })
  } catch (e) {
    console.error('guest-share complete error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : '검증에 실패했습니다.' }, { status: 500 })
  }
}
