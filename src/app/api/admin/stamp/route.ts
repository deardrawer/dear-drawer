import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/db'
import {
  drawerStampPhotoOf,
  kakaoThumbnailOf,
  stampHiddenOf,
  setDrawerStampPhoto,
  setStampMessage,
  setStampHidden,
} from '@/lib/postDrawer'

/**
 * [관리자 전용] 공개 우표 모더레이션. '혹시 모를 사태' 대비.
 * - 공개되는 결혼식 우표만 대상(사진/멘트/컬렉션 숨김). 타임머신 우표는 서랍 전용이라 제외.
 * - 인증: x-admin-password 헤더 == ADMIN_PASSWORD.
 */
function verifyAdmin(request: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return false
  return request.headers.get('x-admin-password') === adminPassword
}

function isAllowedUrl(url: string): boolean {
  return /^\/api\/r2\//.test(url) || /^\/uploads\//.test(url)
}

interface Row {
  id: string
  groom_name: string | null
  bride_name: string | null
  wedding_date: string | null
  is_published: number
  content: string | null
  stamp_message: string | null
}

function toItem(r: Row) {
  const custom = drawerStampPhotoOf(r.content)
  const kakao = kakaoThumbnailOf(r.content)
  return {
    id: r.id,
    groomName: r.groom_name,
    brideName: r.bride_name,
    weddingDate: r.wedding_date,
    photo: custom || kakao,
    hasCustomPhoto: !!custom,
    kakaoThumbnail: kakao,
    message: r.stamp_message ?? null,
    hidden: stampHiddenOf(r.content),
  }
}

// GET: 공개 우표 목록 (발행된 청첩장)
export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const db = await getDB()
    const rows = (
      await db
        .prepare(
          `SELECT i.id AS id, i.groom_name AS groom_name, i.bride_name AS bride_name,
                  i.wedding_date AS wedding_date, i.is_published AS is_published, i.content AS content,
                  p.stamp_message AS stamp_message
           FROM invitations i
           LEFT JOIN post_drawers p ON p.invitation_id = i.id
           WHERE i.is_published = 1
           ORDER BY i.wedding_date DESC`,
        )
        .all<Row>()
    ).results || []
    return NextResponse.json({ items: rows.map(toItem) })
  } catch (e) {
    console.error('admin stamp GET error:', e)
    return NextResponse.json({ error: '조회 실패' }, { status: 500 })
  }
}

// PATCH: 우표 사진/멘트/숨김 수정
export async function PATCH(request: NextRequest) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = (await request.json()) as {
      invitationId?: string
      stampPhoto?: string
      removeStampPhoto?: boolean
      stampMessage?: string | null
      stampHidden?: boolean
    }
    const id = (body.invitationId || '').toString()
    if (!id) return NextResponse.json({ error: 'invitationId가 필요합니다.' }, { status: 400 })

    const db = await getDB()
    const exists = await db.prepare('SELECT id FROM invitations WHERE id = ? LIMIT 1').bind(id).first<{ id: string }>()
    if (!exists) return NextResponse.json({ error: '청첩장을 찾을 수 없습니다.' }, { status: 404 })

    if (body.removeStampPhoto === true) {
      await setDrawerStampPhoto(id, null)
    } else if (typeof body.stampPhoto === 'string' && body.stampPhoto.trim()) {
      const url = body.stampPhoto.trim()
      if (!isAllowedUrl(url)) return NextResponse.json({ error: '허용되지 않은 이미지 주소입니다.' }, { status: 400 })
      await setDrawerStampPhoto(id, url)
    }
    if (body.stampMessage !== undefined) await setStampMessage(id, body.stampMessage)
    if (typeof body.stampHidden === 'boolean') await setStampHidden(id, body.stampHidden)

    const row = await db
      .prepare(
        `SELECT i.id AS id, i.groom_name AS groom_name, i.bride_name AS bride_name,
                i.wedding_date AS wedding_date, i.is_published AS is_published, i.content AS content,
                p.stamp_message AS stamp_message
         FROM invitations i LEFT JOIN post_drawers p ON p.invitation_id = i.id
         WHERE i.id = ? LIMIT 1`,
      )
      .bind(id)
      .first<Row>()
    return NextResponse.json({ item: row ? toItem(row) : null })
  } catch (e) {
    console.error('admin stamp PATCH error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : '저장 실패' }, { status: 500 })
  }
}
