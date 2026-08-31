import { getDB, getGuestbookMessages } from './db'
import { milestoneStatuses, daysSinceWeddingKST } from './weddingLifecycle'
import type { Invitation } from '@/types/invitation'

/**
 * POST DRAWER 데이터 레이어 (UI 비의존 기반).
 * - invitation 데이터(이름/날짜/카카오썸네일)는 중복 저장하지 않고 여기서 읽어 계산.
 * - post_drawers 행은 archive_slug/공유/한조각이 필요할 때만 lazy 생성.
 * - 우표 사진 = 카카오톡 공유 썸네일(content.meta.kakaoThumbnail) 단일 source. 없으면 null(다른 이미지 fallback 없음).
 */

export interface PostDrawerRow {
  invitation_id: string
  archive_slug: string | null
  stamp_display_name: string | null
  stamp_message: string | null
  created_at: string
  updated_at: string
  // Mode 2(결혼 후 비밀번호 청첩장 = P3). archive_slug와 별개의 공개용 식별자 share_slug 사용.
  share_enabled?: number | null
  share_password_hash?: string | null
  share_slug?: string | null
}

/** 우표(공개 collection에서 노출 가능한 최소 정보만) */
export interface Stamp {
  photo: string | null // 카카오톡 공유 썸네일만
  name: string
  weddingDate: string | null
  message: string | null // 결혼식 한 조각(선택)
}

const nowIso = () => new Date().toISOString()

// 상수는 서버 무의존 파일로 분리(클라이언트 재사용). 여기서 import해서 쓰고 재노출도 유지.
import { STAMP_MESSAGE_MAX } from './postDrawerConstants'
export { STAMP_MESSAGE_MAX }

/** content JSON에서 카카오톡 공유 썸네일만 추출. 없거나 파싱 실패 시 null. */
export function kakaoThumbnailOf(contentJson: string | null): string | null {
  if (!contentJson) return null
  try {
    const c = JSON.parse(contentJson) as { meta?: { kakaoThumbnail?: unknown } }
    const t = c?.meta?.kakaoThumbnail
    return typeof t === 'string' && t.trim() ? t : null
  } catch {
    return null
  }
}

/**
 * 서랍 우표 전용 사진(content.meta.drawerStampPhoto). 카카오 공유 썸네일과 독립.
 * 지정 시 우표 사진으로 우선 사용, 없으면 카카오 썸네일로 fallback. (신규 DB 컬럼 없이 content.meta 재사용)
 */
export function drawerStampPhotoOf(contentJson: string | null): string | null {
  if (!contentJson) return null
  try {
    const c = JSON.parse(contentJson) as { meta?: { drawerStampPhoto?: unknown } }
    const t = c?.meta?.drawerStampPhoto
    return typeof t === 'string' && t.trim() ? t : null
  } catch {
    return null
  }
}

/** invitation(+선택 post_drawers override)로 우표 데이터 계산. 사진 = 서랍 전용값 || 카카오 썸네일. */
export function resolveStamp(inv: Pick<Invitation, 'groom_name' | 'bride_name' | 'wedding_date' | 'content'>, row?: PostDrawerRow | null): Stamp {
  const names = [inv.groom_name, inv.bride_name].filter(Boolean).join(' · ')
  return {
    photo: drawerStampPhotoOf(inv.content) || kakaoThumbnailOf(inv.content),
    name: (row?.stamp_display_name && row.stamp_display_name.trim()) || names || '',
    weddingDate: inv.wedding_date ?? null,
    message: (row?.stamp_message && row.stamp_message.trim()) || null,
  }
}

/** 공개 컬렉션에서 이 우표를 숨길지(content.meta.stampHidden). admin 모더레이션용. */
export function stampHiddenOf(contentJson: string | null): boolean {
  if (!contentJson) return false
  try {
    const c = JSON.parse(contentJson) as { meta?: { stampHidden?: unknown } }
    return c?.meta?.stampHidden === true || c?.meta?.stampHidden === 1
  } catch {
    return false
  }
}

/** 공개 우표 숨김 설정/해제(admin). true → 공개 컬렉션에서 제외(데이터는 보존). */
export async function setStampHidden(invitationId: string, hidden: boolean): Promise<void> {
  const db = await getDB()
  const row = await db.prepare('SELECT content FROM invitations WHERE id = ? LIMIT 1').bind(invitationId).first<{ content: string | null }>()
  let content: Record<string, unknown> = {}
  try {
    content = row?.content ? (JSON.parse(row.content) as Record<string, unknown>) : {}
  } catch {
    content = {}
  }
  const meta = content.meta && typeof content.meta === 'object' ? (content.meta as Record<string, unknown>) : {}
  if (hidden) meta.stampHidden = true
  else delete meta.stampHidden
  content.meta = meta
  await db.prepare('UPDATE invitations SET content = ?, updated_at = ? WHERE id = ?').bind(JSON.stringify(content), nowIso(), invitationId).run()
}

/** 우표 전용 사진 오버라이드 설정/해제. url=null → 해제(카카오 썸네일로 fallback). */
export async function setDrawerStampPhoto(invitationId: string, url: string | null): Promise<void> {
  const db = await getDB()
  const row = await db.prepare('SELECT content FROM invitations WHERE id = ? LIMIT 1').bind(invitationId).first<{ content: string | null }>()
  let content: Record<string, unknown> = {}
  try {
    content = row?.content ? (JSON.parse(row.content) as Record<string, unknown>) : {}
  } catch {
    content = {}
  }
  const meta = content.meta && typeof content.meta === 'object' ? (content.meta as Record<string, unknown>) : {}
  if (url) meta.drawerStampPhoto = url
  else delete meta.drawerStampPhoto
  content.meta = meta
  await db.prepare('UPDATE invitations SET content = ?, updated_at = ? WHERE id = ?').bind(JSON.stringify(content), nowIso(), invitationId).run()
}

/** 결혼식 한 조각(한마디, post_drawers.stamp_message) 설정. 빈 값 → NULL. 최대 길이 절삭. */
export async function setStampMessage(invitationId: string, message: string | null): Promise<string | null> {
  await ensurePostDrawer(invitationId)
  const trimmed = (message ?? '').toString().trim()
  const final = trimmed ? trimmed.slice(0, STAMP_MESSAGE_MAX) : null
  const db = await getDB()
  await db.prepare('UPDATE post_drawers SET stamp_message = ?, updated_at = ? WHERE invitation_id = ?').bind(final, nowIso(), invitationId).run()
  return final
}

// ── 타임머신 우표(마일스톤 기록) — content.meta.timeCapsules에 저장(migration 없음) ──
export interface TimeCapsuleEntry {
  photo: string | null
  message: string
  createdAt: string
}
/** 서랍 타임라인 카드(결혼식 + 마일스톤). 서랍 전용(공개 컬렉션엔 노출 안 함). */
export interface CapsuleStamp {
  key: string // 'wedding' | 'd100' | 'y1' | 'y2' | 'y3'
  label: string
  dateIso: string | null
  dday: number // 남은 일수(양수=미래, 0/음수=열림)
  unlocked: boolean
  recorded: boolean
  photo: string | null
  message: string | null
}

export function getTimeCapsules(contentJson: string | null): Record<string, TimeCapsuleEntry> {
  if (!contentJson) return {}
  try {
    const c = JSON.parse(contentJson) as { meta?: { timeCapsules?: unknown } }
    const t = c?.meta?.timeCapsules
    return t && typeof t === 'object' ? (t as Record<string, TimeCapsuleEntry>) : {}
  } catch {
    return {}
  }
}

/** 마일스톤 기록 저장(사진/한마디). 주어진 필드만 갱신. */
export async function setTimeCapsule(
  invitationId: string,
  key: string,
  fields: { photo?: string | null; message?: string | null },
): Promise<void> {
  const db = await getDB()
  const row = await db.prepare('SELECT content FROM invitations WHERE id = ? LIMIT 1').bind(invitationId).first<{ content: string | null }>()
  let content: Record<string, unknown> = {}
  try {
    content = row?.content ? (JSON.parse(row.content) as Record<string, unknown>) : {}
  } catch {
    content = {}
  }
  const meta = content.meta && typeof content.meta === 'object' ? (content.meta as Record<string, unknown>) : {}
  const caps = meta.timeCapsules && typeof meta.timeCapsules === 'object' ? (meta.timeCapsules as Record<string, TimeCapsuleEntry>) : {}
  const prev = caps[key] || { photo: null, message: '', createdAt: nowIso() }
  caps[key] = {
    photo: fields.photo !== undefined ? fields.photo : prev.photo,
    message: fields.message !== undefined ? (fields.message ?? '').toString().trim().slice(0, STAMP_MESSAGE_MAX) : prev.message,
    createdAt: prev.createdAt || nowIso(),
  }
  meta.timeCapsules = caps
  content.meta = meta
  await db.prepare('UPDATE invitations SET content = ?, updated_at = ? WHERE id = ?').bind(JSON.stringify(content), nowIso(), invitationId).run()
}

/** 서랍 타임라인 = 결혼식 우표 + 마일스톤 우표(잠금/D-day/기록 상태 포함). */
export function buildCapsules(
  weddingDate: string | null,
  contentJson: string | null,
  weddingStamp: { photo: string | null; message: string | null },
): CapsuleStamp[] {
  const caps = getTimeCapsules(contentJson)
  const wedding: CapsuleStamp = {
    key: 'wedding',
    label: '결혼식',
    dateIso: weddingDate ?? null,
    dday: 0,
    unlocked: true,
    recorded: !!(weddingStamp.photo || weddingStamp.message),
    photo: weddingStamp.photo,
    message: weddingStamp.message,
  }
  const rest = milestoneStatuses(weddingDate, getCapsuleYears(contentJson)).map<CapsuleStamp>((m) => {
    const e = caps[m.key]
    const photo = e?.photo || null
    const message = e?.message && e.message.trim() ? e.message : null
    return { key: m.key, label: m.label, dateIso: m.dateIso, dday: m.dday, unlocked: m.unlocked, recorded: !!(photo || message), photo, message }
  })
  return [wedding, ...rest]
}

/** 타임머신 연 단위 개수(content.meta.capsuleYears). 기본 3, 범위 [3,30]. */
const CAPSULE_YEARS_MAX = 30
export function getCapsuleYears(contentJson: string | null): number {
  if (!contentJson) return 3
  try {
    const c = JSON.parse(contentJson) as { meta?: { capsuleYears?: unknown } }
    const v = c?.meta?.capsuleYears
    const n = typeof v === 'number' ? v : parseInt(String(v ?? ''), 10)
    if (!Number.isFinite(n)) return 3
    return Math.max(3, Math.min(CAPSULE_YEARS_MAX, Math.floor(n)))
  } catch {
    return 3
  }
}

/** 우표 한 칸(1년) 추가 → content.meta.capsuleYears 증가. 새 값 반환. */
export async function incrementCapsuleYears(invitationId: string): Promise<number> {
  const db = await getDB()
  const row = await db.prepare('SELECT content FROM invitations WHERE id = ? LIMIT 1').bind(invitationId).first<{ content: string | null }>()
  let content: Record<string, unknown> = {}
  try {
    content = row?.content ? (JSON.parse(row.content) as Record<string, unknown>) : {}
  } catch {
    content = {}
  }
  const meta = content.meta && typeof content.meta === 'object' ? (content.meta as Record<string, unknown>) : {}
  const next = Math.min(CAPSULE_YEARS_MAX, getCapsuleYears(row?.content ?? null) + 1)
  meta.capsuleYears = next
  content.meta = meta
  await db.prepare('UPDATE invitations SET content = ?, updated_at = ? WHERE id = ?').bind(JSON.stringify(content), nowIso(), invitationId).run()
  return next
}

// ── post_drawers 행 ────────────────────────────────────────────────
export async function getPostDrawerByInvitationId(invitationId: string): Promise<PostDrawerRow | null> {
  const db = await getDB()
  return db.prepare('SELECT * FROM post_drawers WHERE invitation_id = ? LIMIT 1').bind(invitationId).first<PostDrawerRow>()
}

export async function getPostDrawerByArchiveSlug(archiveSlug: string): Promise<PostDrawerRow | null> {
  const db = await getDB()
  return db.prepare('SELECT * FROM post_drawers WHERE archive_slug = ? LIMIT 1').bind(archiveSlug).first<PostDrawerRow>()
}

/** Mode 2: 공개용 share_slug로 조회(/s 라우트 전용). archive_slug와 절대 혼용 금지. */
export async function getPostDrawerByShareSlug(shareSlug: string): Promise<PostDrawerRow | null> {
  const db = await getDB()
  return db.prepare('SELECT * FROM post_drawers WHERE share_slug = ? LIMIT 1').bind(shareSlug).first<PostDrawerRow>()
}

/** Mode 1: /i/[slug] 공개 링크 수동 비공개 토글(invitations.public_hidden). 데이터 삭제 아님. */
export async function setInvitationPublicHidden(invitationId: string, hidden: boolean): Promise<void> {
  const db = await getDB()
  await db.prepare('UPDATE invitations SET public_hidden = ?, updated_at = ? WHERE id = ?').bind(hidden ? 1 : 0, nowIso(), invitationId).run()
}

/** Mode 2: 비밀 청첩장 링크(share_slug) 확보. 활성 시 항상 존재(없으면 생성). post_drawers 행은 ensurePostDrawer로 보장. */
export async function ensureShareSlug(invitationId: string): Promise<string> {
  const row = await getPostDrawerByInvitationId(invitationId)
  if (row?.share_slug) return row.share_slug
  const db = await getDB()
  const slug = crypto.randomUUID().replace(/-/g, '')
  await db.prepare('UPDATE post_drawers SET share_slug = ?, share_enabled = 1, updated_at = ? WHERE invitation_id = ?').bind(slug, nowIso(), invitationId).run()
  return slug
}

/** Mode 2: share_enabled / share_password_hash 갱신(주어진 필드만). */
export async function updateShare(invitationId: string, fields: { share_enabled?: number; share_password_hash?: string | null }): Promise<void> {
  const sets: string[] = []
  const binds: (string | number | null)[] = []
  if (fields.share_enabled !== undefined) { sets.push('share_enabled = ?'); binds.push(fields.share_enabled) }
  if (fields.share_password_hash !== undefined) { sets.push('share_password_hash = ?'); binds.push(fields.share_password_hash) }
  if (sets.length === 0) return
  sets.push('updated_at = ?'); binds.push(nowIso())
  binds.push(invitationId)
  const db = await getDB()
  await db.prepare(`UPDATE post_drawers SET ${sets.join(', ')} WHERE invitation_id = ?`).bind(...binds).run()
}

/**
 * /s 인증 세션 쿠키 값 = sha256(shareSlug + ':' + share_password_hash).
 * 비밀번호가 바뀌면 hash가 바뀌어 기존 쿠키가 자동 무효화됨(별도 DB 컬럼 불필요).
 */
export async function shareCookieToken(shareSlug: string, passwordHash: string): Promise<string> {
  const data = new TextEncoder().encode(`${shareSlug}:${passwordHash}`)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** 행이 없으면 archive_slug와 함께 lazy 생성. 항상 archive_slug가 있는 행을 반환. */
export async function ensurePostDrawer(invitationId: string): Promise<PostDrawerRow> {
  const existing = await getPostDrawerByInvitationId(invitationId)
  if (existing && existing.archive_slug) return existing
  const db = await getDB()
  const ts = nowIso()
  if (existing && !existing.archive_slug) {
    const slug = crypto.randomUUID().replace(/-/g, '')
    await db.prepare('UPDATE post_drawers SET archive_slug = ?, updated_at = ? WHERE invitation_id = ?').bind(slug, ts, invitationId).run()
    return (await getPostDrawerByInvitationId(invitationId))!
  }
  const slug = crypto.randomUUID().replace(/-/g, '')
  await db
    .prepare('INSERT INTO post_drawers (invitation_id, archive_slug, created_at, updated_at) VALUES (?, ?, ?, ?)')
    .bind(invitationId, slug, ts, ts)
    .run()
  return (await getPostDrawerByInvitationId(invitationId))!
}

// ── 공개 collection (우표 최소 필드만) ─────────────────────────────
/** 발행된 청첩장들의 우표. 금지 필드(archive_slug/비밀번호/메시지/파일/Drive/id)는 절대 포함하지 않는다. */
export async function getStampCollection(): Promise<Stamp[]> {
  const db = await getDB()
  // 공개 collection은 PII(groom/bride_name)와 전체 content를 아예 SELECT하지 않는다.
  // 썸네일은 SQL json_extract로 meta.kakaoThumbnail 값만 뽑아, D1에서 나오는 데이터 자체를 우표 최소필드로 제한.
  // (dev 프록시가 원시 D1 응답을 흘려도 이름/content가 없으므로 노출 불가. 다른 이미지 fallback 없음.)
  const rows = await db
    .prepare(
      `SELECT i.wedding_date AS wedding_date,
              CASE WHEN json_valid(i.content) THEN COALESCE(json_extract(i.content, '$.meta.drawerStampPhoto'), json_extract(i.content, '$.meta.kakaoThumbnail')) ELSE NULL END AS kthumb,
              p.stamp_message AS stamp_message
       FROM invitations i
       LEFT JOIN post_drawers p ON p.invitation_id = i.id
       WHERE i.is_published = 1
         AND (NOT json_valid(i.content) OR IFNULL(json_extract(i.content, '$.meta.stampHidden'), 0) = 0)
       ORDER BY i.wedding_date DESC`,
    )
    .all<{ wedding_date: string | null; kthumb: string | null; stamp_message: string | null }>()
  const fromInvitations: Stamp[] = (rows.results || []).map((r) => {
    const t = typeof r.kthumb === 'string' ? r.kthumb.trim() : ''
    const photo = t && !t.startsWith('{') && !t.startsWith('[') ? t : null // 문자열 썸네일만(객체형/기타 fallback 없음)
    const message = r.stamp_message && r.stamp_message.trim() ? r.stamp_message.trim() : null
    return { photo, name: '', weddingDate: r.wedding_date ?? null, message }
  })

  // 관리자가 직접 추가한 우표(숨김 제외)도 합친다.
  const admin = (
    await db
      .prepare('SELECT photo, message, wedding_date FROM collection_stamps WHERE IFNULL(hidden,0) = 0')
      .all<{ photo: string | null; message: string | null; wedding_date: string | null }>()
  ).results || []
  const fromAdmin: Stamp[] = admin.map((r) => ({
    photo: r.photo && r.photo.trim() ? r.photo.trim() : null,
    name: '',
    weddingDate: r.wedding_date ?? null,
    message: r.message && r.message.trim() ? r.message.trim() : null,
  }))

  // 날짜 내림차순 통합(날짜 없는 것은 뒤로)
  return [...fromInvitations, ...fromAdmin].sort((a, b) => {
    const av = a.weddingDate || ''
    const bv = b.weddingDate || ''
    return av < bv ? 1 : av > bv ? -1 : 0
  })
}

// ── 관리자 컬렉션 우표 CRUD ─────────────────────────────────────────
export interface CollectionStamp {
  id: string
  photo: string | null
  message: string | null
  weddingDate: string | null
  hidden: boolean
  createdAt: string
}

function mapCollectionRow(r: { id: string; photo: string | null; message: string | null; wedding_date: string | null; hidden: number | null; created_at: string }): CollectionStamp {
  return { id: r.id, photo: r.photo, message: r.message, weddingDate: r.wedding_date, hidden: (r.hidden ?? 0) === 1, createdAt: r.created_at }
}

export async function listCollectionStamps(): Promise<CollectionStamp[]> {
  const db = await getDB()
  const rows = (
    await db
      .prepare('SELECT id, photo, message, wedding_date, hidden, created_at FROM collection_stamps ORDER BY wedding_date DESC, created_at DESC')
      .all<{ id: string; photo: string | null; message: string | null; wedding_date: string | null; hidden: number | null; created_at: string }>()
  ).results || []
  return rows.map(mapCollectionRow)
}

export async function createCollectionStamp(fields: { photo?: string | null; message?: string | null; weddingDate?: string | null }): Promise<CollectionStamp> {
  const db = await getDB()
  const id = `cs_${crypto.randomUUID()}`
  const ts = nowIso()
  const msg = fields.message ? fields.message.toString().trim().slice(0, STAMP_MESSAGE_MAX) : null
  await db
    .prepare('INSERT INTO collection_stamps (id, photo, message, wedding_date, hidden, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)')
    .bind(id, fields.photo ?? null, msg, fields.weddingDate ?? null, ts, ts)
    .run()
  const row = await db.prepare('SELECT id, photo, message, wedding_date, hidden, created_at FROM collection_stamps WHERE id = ?').bind(id).first<{ id: string; photo: string | null; message: string | null; wedding_date: string | null; hidden: number | null; created_at: string }>()
  return mapCollectionRow(row!)
}

export async function updateCollectionStamp(id: string, fields: { photo?: string | null; message?: string | null; weddingDate?: string | null; hidden?: boolean }): Promise<CollectionStamp | null> {
  const db = await getDB()
  const sets: string[] = []
  const binds: (string | number | null)[] = []
  if (fields.photo !== undefined) { sets.push('photo = ?'); binds.push(fields.photo) }
  if (fields.message !== undefined) { sets.push('message = ?'); binds.push(fields.message ? fields.message.toString().trim().slice(0, STAMP_MESSAGE_MAX) : null) }
  if (fields.weddingDate !== undefined) { sets.push('wedding_date = ?'); binds.push(fields.weddingDate) }
  if (fields.hidden !== undefined) { sets.push('hidden = ?'); binds.push(fields.hidden ? 1 : 0) }
  if (sets.length === 0) return null
  sets.push('updated_at = ?'); binds.push(nowIso())
  binds.push(id)
  await db.prepare(`UPDATE collection_stamps SET ${sets.join(', ')} WHERE id = ?`).bind(...binds).run()
  const row = await db.prepare('SELECT id, photo, message, wedding_date, hidden, created_at FROM collection_stamps WHERE id = ?').bind(id).first<{ id: string; photo: string | null; message: string | null; wedding_date: string | null; hidden: number | null; created_at: string }>()
  return row ? mapCollectionRow(row) : null
}

export async function deleteCollectionStamp(id: string): Promise<void> {
  const db = await getDB()
  await db.prepare('DELETE FROM collection_stamps WHERE id = ?').bind(id).run()
}

// ── 개인 POST DRAWER 집계 (owner/공유인증 통과 후에만 반환) ─────────
interface FileKindCount { images: number; videos: number }
export interface PostDrawerMessage {
  id: string
  guestName: string
  message: string
  source: string | null // null/'guestbook' | 'rsvp' | 'photo_share' | 'geunnal'
  isPublic: boolean // is_public NULL → 공개로 해석
  createdAt: string
  images: number
  videos: number
  photoUrl?: string | null // 데이드로어(근날) 모임관리 사진 등 직접 표시 가능한 URL
  group?: string | null // 데이드로어 모임(이벤트) 이름 — 모임별 그룹 표시용
}
/**
 * 함께 남겨준 순간 = Guest Share 묶음(사람 단위). 이름+메시지+개수만 담고,
 * 실제 Drive 미디어는 key로 media API를 눌러야 on-demand 로드(초기 자동 로드 없음).
 * key: 'msg_<guestbookMessageId>'(메시지 묶음) | 'ses_<sessionId>'(메시지 없이 사진만).
 * 내부 세션/파일 접근은 media API가 owner+invitation 소속으로 재검증한다.
 */
export interface MomentBundle {
  key: string
  guestName: string | null
  message: string | null
  createdAt: string
  images: number
  videos: number
}
export interface PostDrawerData {
  archiveSlug: string
  invitation: { id: string; slug: string | null; templateId: string } // 바로가기/공유 URL 구성용
  share: { enabled: boolean; shareSlug: string | null } // owner의 비밀 청첩장(/s) 바로가기용
  stamp: Stamp
  daysMarried: number | null // 예식일로부터 지난 일수(KST). 서랍 D-day 표시용.
  capsules: CapsuleStamp[] // 타임머신 우표(결혼식 + 100일/1년/2년/3년). 서랍 전용.
  messages: PostDrawerMessage[] // 받은 마음: 방명록 + RSVP + 모임(근날). photo_share 제외.
  moments: MomentBundle[] // 함께 남겨준 순간: photo_share 메시지 묶음 + 사진만 세션
  summary: { totalMessages: number; publicMessages: number; privateMessages: number; totalImages: number; totalVideos: number }
}

function isVideo(mime: string | null): boolean {
  return !!mime && mime.toLowerCase().startsWith('video')
}
const RECEIVED = new Set(['uploaded', 'queued', 'transferring', 'completed'])

/**
 * 개인 POST DRAWER 데이터 집계. 방명록(공개+photo_share) + 세션/파일 카운트.
 * R2 cleanup 이후에도 메시지·파일 행(google_file_id 등)이 남으므로 카운트/기록은 계속 유효.
 */
export async function getPostDrawerData(
  invitation: Pick<Invitation, 'id' | 'groom_name' | 'bride_name' | 'wedding_date' | 'content' | 'slug' | 'template_id'>,
  row: PostDrawerRow,
): Promise<PostDrawerData> {
  const db = await getDB()

  // 메시지(공개 방명록 + photo_share 전부)
  const messagesRaw = await getGuestbookMessages(invitation.id, true)

  // 세션 + 파일 (카운트용)
  const sessions = (
    await db
      .prepare('SELECT id, guestbook_message_id, guest_name, created_at FROM guest_upload_sessions WHERE invitation_id = ?')
      .bind(invitation.id)
      .all<{ id: string; guestbook_message_id: string | null; guest_name: string | null; created_at: string }>()
  ).results || []
  const files = (
    await db
      .prepare('SELECT session_id, mime_type, status FROM guest_upload_files WHERE invitation_id = ?')
      .bind(invitation.id)
      .all<{ session_id: string; mime_type: string | null; status: string }>()
  ).results || []

  // sessionId → 파일 카운트
  const bySession = new Map<string, FileKindCount>()
  for (const f of files) {
    if (!RECEIVED.has(f.status)) continue
    const c = bySession.get(f.session_id) || { images: 0, videos: 0 }
    if (isVideo(f.mime_type)) c.videos++
    else c.images++
    bySession.set(f.session_id, c)
  }
  // guestbook_message_id → 카운트(연결된 세션 합산)
  const byMessage = new Map<string, FileKindCount>()
  for (const s of sessions) {
    if (!s.guestbook_message_id) continue
    const sc = bySession.get(s.id) || { images: 0, videos: 0 }
    const c = byMessage.get(s.guestbook_message_id) || { images: 0, videos: 0 }
    c.images += sc.images
    c.videos += sc.videos
    byMessage.set(s.guestbook_message_id, c)
  }

  // 받은 마음 = 청첩장 방명록만(photo_share는 '함께 남겨준 순간'으로 분리)
  const guestbookMessages: PostDrawerMessage[] = messagesRaw
    .filter((m) => (m.source ?? null) !== 'photo_share')
    .map((m) => ({
      id: m.id,
      guestName: m.guest_name,
      message: m.message,
      source: m.source ?? null, // null/'guestbook' = 청첩장 방명록
      isPublic: (m.is_public ?? null) !== 0, // NULL/1 → 공개, 0 → 비공개
      createdAt: m.created_at,
      images: 0,
      videos: 0,
    }))

  // RSVP 메시지(rsvp_responses.message)도 '받은 마음'에 포함 (source='rsvp')
  const rsvpRaw = (
    await db
      .prepare("SELECT id, guest_name, message, created_at FROM rsvp_responses WHERE invitation_id = ? AND message IS NOT NULL AND trim(message) != '' ORDER BY created_at DESC")
      .bind(invitation.id)
      .all<{ id: string; guest_name: string; message: string; created_at: string }>()
  ).results || []
  const rsvpMessages: PostDrawerMessage[] = rsvpRaw.map((r) => ({
    id: `rsvp_${r.id}`,
    guestName: r.guest_name,
    message: r.message,
    source: 'rsvp',
    isPublic: true,
    createdAt: r.created_at,
    images: 0,
    videos: 0,
  }))

  // 데이드로어(근날) 모임관리 submissions(모임별 참석자의 message + photo)도 '받은 마음'에 포함
  let geunnalMessages: PostDrawerMessage[] = []
  try {
    const geunnalRaw = (
      await db
        .prepare(
          `SELECT s.id AS id, s.guest_name AS guest_name, s.is_anonymous AS is_anonymous,
                  s.message AS message, s.photo_url AS photo_url, s.created_at AS created_at,
                  e.name AS event_name
           FROM geunnal_submissions s
           JOIN geunnal_events e ON s.event_id = e.id
           JOIN geunnal_pages p ON e.page_id = p.id
           WHERE p.invitation_id = ?
           ORDER BY s.created_at DESC`,
        )
        .bind(invitation.id)
        .all<{ id: string; guest_name: string; is_anonymous: number | null; message: string | null; photo_url: string | null; created_at: string; event_name: string | null }>()
    ).results || []
    geunnalMessages = geunnalRaw
      .filter((sm) => (sm.message && sm.message.trim()) || sm.photo_url)
      .map((sm) => ({
        id: `geunnal_${sm.id}`,
        guestName: sm.is_anonymous ? '익명' : sm.guest_name,
        message: sm.message || '',
        source: 'geunnal',
        isPublic: true,
        createdAt: sm.created_at,
        photoUrl: sm.photo_url || null,
        group: sm.event_name || '모임',
        images: sm.photo_url ? 1 : 0,
        videos: 0,
      }))
  } catch (e) {
    console.error('geunnal submissions load failed:', e)
  }

  // 청첩장 방명록 + RSVP + share 비공개 + 데이드로어(근날) 통합(최신순)
  const messages: PostDrawerMessage[] = [...guestbookMessages, ...rsvpMessages, ...geunnalMessages].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0,
  )

  // 함께 남겨준 순간 묶음 —
  // (1) photo_share 메시지 묶음: 메시지 + 연결된 세션 파일 합산
  const photoShareRaw = messagesRaw.filter((m) => (m.source ?? null) === 'photo_share')
  const momentsFromMsg: MomentBundle[] = photoShareRaw.map((m) => {
    const c = byMessage.get(m.id) || { images: 0, videos: 0 }
    return { key: `msg_${m.id}`, guestName: m.guest_name, message: m.message || null, createdAt: m.created_at, images: c.images, videos: c.videos }
  })
  // (2) 메시지 없이 사진만 보낸 세션
  const momentsFromSession: MomentBundle[] = sessions
    .filter((s) => !s.guestbook_message_id)
    .map((s) => {
      const c = bySession.get(s.id) || { images: 0, videos: 0 }
      return { key: `ses_${s.id}`, guestName: s.guest_name, message: null as string | null, createdAt: s.created_at, images: c.images, videos: c.videos }
    })
    .filter((b) => b.images > 0 || b.videos > 0)
  const moments: MomentBundle[] = [...momentsFromMsg, ...momentsFromSession].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0,
  )

  let totalImages = 0
  let totalVideos = 0
  for (const c of bySession.values()) {
    totalImages += c.images
    totalVideos += c.videos
  }
  const privateMessages = messages.filter((m) => !m.isPublic).length
  const stamp = resolveStamp(invitation, row)

  return {
    archiveSlug: row.archive_slug || '',
    invitation: { id: invitation.id, slug: invitation.slug ?? null, templateId: invitation.template_id },
    share: { enabled: (row.share_enabled ?? 0) === 1, shareSlug: row.share_slug ?? null },
    stamp,
    daysMarried: daysSinceWeddingKST(invitation.wedding_date),
    capsules: buildCapsules(invitation.wedding_date ?? null, invitation.content ?? null, { photo: stamp.photo, message: stamp.message }),
    messages,
    moments,
    summary: {
      totalMessages: messages.length,
      publicMessages: messages.length - privateMessages,
      privateMessages,
      totalImages,
      totalVideos,
    },
  }
}
