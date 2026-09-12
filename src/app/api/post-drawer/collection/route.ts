import { NextResponse } from 'next/server'
import { getStampCollection } from '@/lib/postDrawer'

/**
 * [공개] POST DRAWER 우표 컬렉션 — 발행 청첩장의 우표 최소 필드만.
 * 절대 포함 금지: archive_slug, POST DRAWER URL, 비밀번호/인증, 방명록/메시지, 하객 사진·영상, Google Drive, invitation id.
 */
export async function GET() {
  try {
    const stamps = await getStampCollection()
    return NextResponse.json({ data: stamps })
  } catch (e) {
    console.error('post-drawer collection error:', e)
    return NextResponse.json({ error: '컬렉션 조회에 실패했습니다.' }, { status: 500 })
  }
}
