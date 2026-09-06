import { NextRequest, NextResponse } from 'next/server'
import { listCollectionStamps, createCollectionStamp, updateCollectionStamp, deleteCollectionStamp } from '@/lib/postDrawer'

/**
 * [관리자 전용] 공개 컬렉션에 직접 추가하는 우표 CRUD (실제 청첩장과 무관한 독립 우표).
 * 인증: x-admin-password 헤더 == ADMIN_PASSWORD.
 */
function verifyAdmin(request: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return false
  return request.headers.get('x-admin-password') === adminPassword
}
function isAllowedUrl(url: string): boolean {
  return /^\/api\/r2\//.test(url) || /^\/uploads\//.test(url)
}

export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    return NextResponse.json({ items: await listCollectionStamps() })
  } catch (e) {
    console.error('collection-stamp GET error:', e)
    return NextResponse.json({ error: '조회 실패' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = (await request.json()) as { photo?: string; message?: string; weddingDate?: string }
    if (body.photo && !isAllowedUrl(body.photo.trim())) {
      return NextResponse.json({ error: '허용되지 않은 이미지 주소입니다.' }, { status: 400 })
    }
    const item = await createCollectionStamp({
      photo: body.photo?.trim() || null,
      message: body.message ?? null,
      weddingDate: body.weddingDate?.trim() || null,
    })
    return NextResponse.json({ item })
  } catch (e) {
    console.error('collection-stamp POST error:', e)
    return NextResponse.json({ error: '추가 실패' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = (await request.json()) as { id?: string; photo?: string; message?: string | null; weddingDate?: string; hidden?: boolean }
    if (!body.id) return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 })
    if (typeof body.photo === 'string' && body.photo.trim() && !isAllowedUrl(body.photo.trim())) {
      return NextResponse.json({ error: '허용되지 않은 이미지 주소입니다.' }, { status: 400 })
    }
    const fields: { photo?: string | null; message?: string | null; weddingDate?: string | null; hidden?: boolean } = {}
    if (body.photo !== undefined) fields.photo = body.photo ? body.photo.trim() : null
    if (body.message !== undefined) fields.message = body.message
    if (body.weddingDate !== undefined) fields.weddingDate = body.weddingDate ? body.weddingDate.trim() : null
    if (typeof body.hidden === 'boolean') fields.hidden = body.hidden
    const item = await updateCollectionStamp(body.id, fields)
    if (!item) return NextResponse.json({ error: '변경할 내용이 없습니다.' }, { status: 400 })
    return NextResponse.json({ item })
  } catch (e) {
    console.error('collection-stamp PATCH error:', e)
    return NextResponse.json({ error: '저장 실패' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const id = new URL(request.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 })
    await deleteCollectionStamp(id)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('collection-stamp DELETE error:', e)
    return NextResponse.json({ error: '삭제 실패' }, { status: 500 })
  }
}
