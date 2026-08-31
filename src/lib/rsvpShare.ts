import { getDB } from './db'

/**
 * RSVP 통합관리 — 사용자당 하나의 공유 설정(rsvp_shares) + 전체 청첩장 RSVP 집계.
 * 공유 링크(/rsvp/s/[slug])는 비밀번호 선택. 인증 쿠키 = sha256(slug:password_hash).
 */

export interface RsvpShareRow {
  user_id: string
  share_slug: string | null
  password_hash: string | null
  created_at: string
  updated_at: string
}

const nowIso = () => new Date().toISOString()

export async function getRsvpShareByUser(userId: string): Promise<RsvpShareRow | null> {
  const db = await getDB()
  return db.prepare('SELECT * FROM rsvp_shares WHERE user_id = ? LIMIT 1').bind(userId).first<RsvpShareRow>()
}

export async function getRsvpShareBySlug(slug: string): Promise<RsvpShareRow | null> {
  const db = await getDB()
  return db.prepare('SELECT * FROM rsvp_shares WHERE share_slug = ? LIMIT 1').bind(slug).first<RsvpShareRow>()
}

/** 공유 슬러그 확보(없으면 생성). 반환: slug */
export async function ensureRsvpShareSlug(userId: string): Promise<string> {
  const existing = await getRsvpShareByUser(userId)
  if (existing?.share_slug) return existing.share_slug
  const db = await getDB()
  const slug = crypto.randomUUID().replace(/-/g, '')
  const ts = nowIso()
  if (existing) {
    await db.prepare('UPDATE rsvp_shares SET share_slug = ?, updated_at = ? WHERE user_id = ?').bind(slug, ts, userId).run()
  } else {
    await db.prepare('INSERT INTO rsvp_shares (user_id, share_slug, password_hash, created_at, updated_at) VALUES (?, ?, NULL, ?, ?)').bind(userId, slug, ts, ts).run()
  }
  return slug
}

/** 비밀번호 설정/변경/해제(null). 슬러그가 없으면 먼저 생성. */
export async function setRsvpSharePassword(userId: string, passwordHash: string | null): Promise<void> {
  await ensureRsvpShareSlug(userId)
  const db = await getDB()
  await db.prepare('UPDATE rsvp_shares SET password_hash = ?, updated_at = ? WHERE user_id = ?').bind(passwordHash, nowIso(), userId).run()
}

/** 인증 쿠키 값 = sha256(slug:password_hash). 비번 변경/해제 시 자동 무효화. */
export async function rsvpShareCookieToken(slug: string, passwordHash: string): Promise<string> {
  const data = new TextEncoder().encode(`${slug}:${passwordHash}`)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

// ── 집계 ────────────────────────────────────────────────────────────
export interface RsvpBreakdown {
  mealYes: number; mealNo: number
  shuttleYes: number; shuttleNo: number
  afterYes: number; afterNo: number
  groomSide: number; brideSide: number
}
export interface RsvpInvSummary extends RsvpBreakdown {
  id: string
  name: string
  weddingDate: string | null
  slug: string | null
  attending: number
  notAttending: number
  pending: number
  guests: number // 참석자 인원 합(guest_count)
  total: number
}
export interface RsvpOverview {
  invitations: RsvpInvSummary[]
  totals: { attending: number; notAttending: number; pending: number; guests: number; total: number; invitations: number } & RsvpBreakdown
}

export async function getRsvpOverview(userId: string): Promise<RsvpOverview> {
  const db = await getDB()
  const rows = (
    await db
      .prepare(
        `SELECT i.id AS id, i.groom_name AS groom_name, i.bride_name AS bride_name, i.wedding_date AS wedding_date, i.slug AS slug,
                COALESCE(SUM(CASE WHEN r.attendance='attending' THEN 1 ELSE 0 END), 0) AS attending,
                COALESCE(SUM(CASE WHEN r.attendance='not_attending' THEN 1 ELSE 0 END), 0) AS notAttending,
                COALESCE(SUM(CASE WHEN r.attendance='pending' THEN 1 ELSE 0 END), 0) AS pending,
                COALESCE(SUM(CASE WHEN r.attendance='attending' THEN r.guest_count ELSE 0 END), 0) AS guests,
                COALESCE(COUNT(r.id), 0) AS total,
                COALESCE(SUM(CASE WHEN r.meal_attendance='yes' THEN 1 ELSE 0 END), 0) AS mealYes,
                COALESCE(SUM(CASE WHEN r.meal_attendance='no' THEN 1 ELSE 0 END), 0) AS mealNo,
                COALESCE(SUM(CASE WHEN r.shuttle_bus='yes' THEN 1 ELSE 0 END), 0) AS shuttleYes,
                COALESCE(SUM(CASE WHEN r.shuttle_bus='no' THEN 1 ELSE 0 END), 0) AS shuttleNo,
                COALESCE(SUM(CASE WHEN r.after_party='yes' THEN 1 ELSE 0 END), 0) AS afterYes,
                COALESCE(SUM(CASE WHEN r.after_party='no' THEN 1 ELSE 0 END), 0) AS afterNo,
                COALESCE(SUM(CASE WHEN r.side='groom' THEN 1 ELSE 0 END), 0) AS groomSide,
                COALESCE(SUM(CASE WHEN r.side='bride' THEN 1 ELSE 0 END), 0) AS brideSide
         FROM invitations i
         LEFT JOIN rsvp_responses r ON r.invitation_id = i.id
         WHERE i.user_id = ?
         GROUP BY i.id
         ORDER BY i.wedding_date DESC`,
      )
      .bind(userId)
      .all<{ id: string; groom_name: string | null; bride_name: string | null; wedding_date: string | null; slug: string | null; attending: number; notAttending: number; pending: number; guests: number; total: number; mealYes: number; mealNo: number; shuttleYes: number; shuttleNo: number; afterYes: number; afterNo: number; groomSide: number; brideSide: number }>()
  ).results || []
  const invitations: RsvpInvSummary[] = rows.map((r) => ({
    id: r.id,
    name: [r.groom_name, r.bride_name].filter(Boolean).join(' · ') || '청첩장',
    weddingDate: r.wedding_date,
    slug: r.slug,
    attending: r.attending,
    notAttending: r.notAttending,
    pending: r.pending,
    guests: r.guests,
    total: r.total,
    mealYes: r.mealYes, mealNo: r.mealNo,
    shuttleYes: r.shuttleYes, shuttleNo: r.shuttleNo,
    afterYes: r.afterYes, afterNo: r.afterNo,
    groomSide: r.groomSide, brideSide: r.brideSide,
  }))
  const totals = invitations.reduce(
    (a, v) => ({
      attending: a.attending + v.attending,
      notAttending: a.notAttending + v.notAttending,
      pending: a.pending + v.pending,
      guests: a.guests + v.guests,
      total: a.total + v.total,
      invitations: a.invitations,
      mealYes: a.mealYes + v.mealYes, mealNo: a.mealNo + v.mealNo,
      shuttleYes: a.shuttleYes + v.shuttleYes, shuttleNo: a.shuttleNo + v.shuttleNo,
      afterYes: a.afterYes + v.afterYes, afterNo: a.afterNo + v.afterNo,
      groomSide: a.groomSide + v.groomSide, brideSide: a.brideSide + v.brideSide,
    }),
    { attending: 0, notAttending: 0, pending: 0, guests: 0, total: 0, invitations: invitations.length, mealYes: 0, mealNo: 0, shuttleYes: 0, shuttleNo: 0, afterYes: 0, afterNo: 0, groomSide: 0, brideSide: 0 },
  )
  return { invitations, totals }
}

export interface RsvpResponseItem {
  id: string
  invitationId: string
  invitationName: string
  guestName: string
  guestPhone: string | null
  attendance: 'attending' | 'not_attending' | 'pending'
  guestCount: number
  message: string | null
  createdAt: string
  side: 'groom' | 'bride' | null
  sideDetail: 'self' | 'father' | 'mother' | null
  meal: 'yes' | 'no' | null
  shuttle: 'yes' | 'no' | null
  afterParty: 'yes' | 'no' | null
}
export interface RsvpResponsesResult {
  items: RsvpResponseItem[]
  total: number
  page: number
  pageSize: number
}

export async function getRsvpResponses(
  userId: string,
  opts: { invitationId?: string; status?: string; side?: string; q?: string; sort?: string; page?: number; pageSize?: number },
): Promise<RsvpResponsesResult> {
  const db = await getDB()
  const conds: string[] = ['i.user_id = ?']
  const binds: (string | number)[] = [userId]
  if (opts.invitationId && opts.invitationId !== 'all') {
    conds.push('r.invitation_id = ?')
    binds.push(opts.invitationId)
  }
  if (opts.status && ['attending', 'not_attending', 'pending'].includes(opts.status)) {
    conds.push('r.attendance = ?')
    binds.push(opts.status)
  }
  if (opts.side && ['groom', 'bride'].includes(opts.side)) {
    conds.push('r.side = ?')
    binds.push(opts.side)
  }
  if (opts.q && opts.q.trim()) {
    conds.push('(r.guest_name LIKE ? OR r.message LIKE ?)')
    const like = `%${opts.q.trim()}%`
    binds.push(like, like)
  }
  const where = conds.join(' AND ')
  const orderBy =
    opts.sort === 'name'
      ? 'r.guest_name COLLATE NOCASE ASC'
      : opts.sort === 'invitation'
        ? 'i.wedding_date DESC, r.created_at DESC'
        : 'r.created_at DESC'

  const page = Math.max(1, opts.page || 1)
  const pageSize = Math.min(100, Math.max(10, opts.pageSize || 30))
  const offset = (page - 1) * pageSize

  const totalRow = await db.prepare(`SELECT COUNT(*) AS c FROM rsvp_responses r JOIN invitations i ON r.invitation_id = i.id WHERE ${where}`).bind(...binds).first<{ c: number }>()
  const total = totalRow?.c ?? 0

  const rows = (
    await db
      .prepare(
        `SELECT r.id AS id, r.invitation_id AS invitation_id, r.guest_name AS guest_name, r.guest_phone AS guest_phone,
                r.attendance AS attendance, r.guest_count AS guest_count, r.message AS message, r.created_at AS created_at,
                r.side AS side, r.side_detail AS side_detail, r.meal_attendance AS meal_attendance, r.shuttle_bus AS shuttle_bus, r.after_party AS after_party,
                i.groom_name AS groom_name, i.bride_name AS bride_name
         FROM rsvp_responses r JOIN invitations i ON r.invitation_id = i.id
         WHERE ${where}
         ORDER BY ${orderBy}
         LIMIT ? OFFSET ?`,
      )
      .bind(...binds, pageSize, offset)
      .all<{ id: string; invitation_id: string; guest_name: string; guest_phone: string | null; attendance: 'attending' | 'not_attending' | 'pending'; guest_count: number; message: string | null; created_at: string; side: 'groom' | 'bride' | null; side_detail: 'self' | 'father' | 'mother' | null; meal_attendance: 'yes' | 'no' | null; shuttle_bus: 'yes' | 'no' | null; after_party: 'yes' | 'no' | null; groom_name: string | null; bride_name: string | null }>()
  ).results || []

  const items: RsvpResponseItem[] = rows.map((r) => ({
    id: r.id,
    invitationId: r.invitation_id,
    invitationName: [r.groom_name, r.bride_name].filter(Boolean).join(' · ') || '청첩장',
    guestName: r.guest_name,
    guestPhone: r.guest_phone,
    attendance: r.attendance,
    guestCount: r.guest_count,
    message: r.message,
    createdAt: r.created_at,
    side: r.side,
    sideDetail: r.side_detail,
    meal: r.meal_attendance,
    shuttle: r.shuttle_bus,
    afterParty: r.after_party,
  }))
  return { items, total, page, pageSize }
}
