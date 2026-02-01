import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Invitation, InvitationInput } from "@/types/invitation";

// D1 Database 타입
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
}

interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  meta: {
    changes: number;
  };
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface CloudflareEnvWithDB {
  DB?: D1Database;
}

// Cloudflare D1 데이터베이스 접근
async function getDB(): Promise<D1Database> {
  const { env } = await getCloudflareContext() as { env: CloudflareEnvWithDB };
  if (!env.DB) {
    throw new Error("D1 Database not configured");
  }
  return env.DB;
}

// 짧은 ID 생성 (8자리)
function generateShortId(): string {
  return crypto.randomUUID().split('-')[0];
}

// 기존 UUID 생성 (하위 호환용)
function generateId(): string {
  return generateShortId();
}

// 청첩장 생성
export async function createInvitation(
  userId: string,
  input: InvitationInput = {}
): Promise<Invitation> {
  const db = await getDB();
  const id = generateId();
  const now = new Date().toISOString();

  const result = await db
    .prepare(
      `INSERT INTO invitations (
        id, user_id, template_id, groom_name, bride_name,
        wedding_date, wedding_time, venue_name, venue_address,
        venue_detail, venue_map_url, main_image, gallery_images,
        greeting_message, contact_groom, contact_bride, account_info,
        content, is_paid, is_published, slug, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *`
    )
    .bind(
      id,
      userId,
      input.template_id || "classic",
      input.groom_name || null,
      input.bride_name || null,
      input.wedding_date || null,
      input.wedding_time || null,
      input.venue_name || null,
      input.venue_address || null,
      input.venue_detail || null,
      input.venue_map_url || null,
      input.main_image || null,
      JSON.stringify(input.gallery_images || []),
      input.greeting_message || null,
      input.contact_groom || null,
      input.contact_bride || null,
      JSON.stringify(input.account_info || []),
      input.content || null,
      0,
      input.is_published ? 1 : 0,
      input.slug || null,
      now,
      now
    )
    .first<Invitation>();

  if (!result) {
    throw new Error("Failed to create invitation");
  }

  return result;
}

// 청첩장 조회 (ID)
export async function getInvitationById(id: string): Promise<Invitation | null> {
  const db = await getDB();
  return db
    .prepare("SELECT * FROM invitations WHERE id = ?")
    .bind(id)
    .first<Invitation>();
}

// 청첩장 조회 (슬러그)
export async function getInvitationBySlug(slug: string): Promise<Invitation | null> {
  const db = await getDB();
  return db
    .prepare("SELECT * FROM invitations WHERE slug = ?")
    .bind(slug)
    .first<Invitation>();
}

// 사용자의 청첩장 목록
export async function getInvitationsByUserId(userId: string): Promise<Invitation[]> {
  const db = await getDB();
  const result = await db
    .prepare("SELECT * FROM invitations WHERE user_id = ? ORDER BY updated_at DESC")
    .bind(userId)
    .all<Invitation>();

  return result.results || [];
}

// 청첩장 업데이트
export async function updateInvitation(
  id: string,
  userId: string,
  input: InvitationInput
): Promise<Invitation | null> {
  const db = await getDB();
  const now = new Date().toISOString();

  // 동적으로 업데이트할 필드 구성
  const updates: string[] = [];
  const values: unknown[] = [];

  if (input.template_id !== undefined) {
    updates.push("template_id = ?");
    values.push(input.template_id);
  }
  if (input.groom_name !== undefined) {
    updates.push("groom_name = ?");
    values.push(input.groom_name);
  }
  if (input.bride_name !== undefined) {
    updates.push("bride_name = ?");
    values.push(input.bride_name);
  }
  if (input.wedding_date !== undefined) {
    updates.push("wedding_date = ?");
    values.push(input.wedding_date);
  }
  if (input.wedding_time !== undefined) {
    updates.push("wedding_time = ?");
    values.push(input.wedding_time);
  }
  if (input.venue_name !== undefined) {
    updates.push("venue_name = ?");
    values.push(input.venue_name);
  }
  if (input.venue_address !== undefined) {
    updates.push("venue_address = ?");
    values.push(input.venue_address);
  }
  if (input.venue_detail !== undefined) {
    updates.push("venue_detail = ?");
    values.push(input.venue_detail);
  }
  if (input.venue_map_url !== undefined) {
    updates.push("venue_map_url = ?");
    values.push(input.venue_map_url);
  }
  if (input.main_image !== undefined) {
    updates.push("main_image = ?");
    values.push(input.main_image);
  }
  if (input.gallery_images !== undefined) {
    updates.push("gallery_images = ?");
    values.push(JSON.stringify(input.gallery_images));
  }
  if (input.greeting_message !== undefined) {
    updates.push("greeting_message = ?");
    values.push(input.greeting_message);
  }
  if (input.contact_groom !== undefined) {
    updates.push("contact_groom = ?");
    values.push(input.contact_groom);
  }
  if (input.contact_bride !== undefined) {
    updates.push("contact_bride = ?");
    values.push(input.contact_bride);
  }
  if (input.account_info !== undefined) {
    updates.push("account_info = ?");
    values.push(JSON.stringify(input.account_info));
  }
  if (input.content !== undefined) {
    updates.push("content = ?");
    values.push(input.content);
  }
  if (input.is_published !== undefined) {
    updates.push("is_published = ?");
    values.push(input.is_published ? 1 : 0);
  }
  if (input.slug !== undefined) {
    updates.push("slug = ?");
    values.push(input.slug);
  }

  if (updates.length === 0) {
    return getInvitationById(id);
  }

  updates.push("updated_at = ?");
  values.push(now);
  values.push(id);
  values.push(userId);

  const result = await db
    .prepare(
      `UPDATE invitations SET ${updates.join(", ")} WHERE id = ? AND user_id = ? RETURNING *`
    )
    .bind(...values)
    .first<Invitation>();

  return result;
}

// 청첩장 삭제
export async function deleteInvitation(id: string, userId: string): Promise<boolean> {
  const db = await getDB();
  const result = await db
    .prepare("DELETE FROM invitations WHERE id = ? AND user_id = ?")
    .bind(id, userId)
    .run();

  return result.meta.changes > 0;
}

// 슬러그 중복 확인 (invitations 테이블 + slug_aliases 테이블 모두 체크)
export async function isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
  const db = await getDB();

  // 1. invitations 테이블에서 확인
  let query = "SELECT id FROM invitations WHERE slug = ?";
  const params: unknown[] = [slug];

  if (excludeId) {
    query += " AND id != ?";
    params.push(excludeId);
  }

  const invitationResult = await db.prepare(query).bind(...params).first();
  if (invitationResult) {
    return false;
  }

  // 2. slug_aliases 테이블에서 확인
  const aliasResult = await db
    .prepare("SELECT id, invitation_id FROM slug_aliases WHERE alias_slug = ?")
    .bind(slug)
    .first<{ id: string; invitation_id: string }>();

  if (aliasResult) {
    // 자신의 이전 slug를 재사용하려는 경우는 허용
    if (excludeId && aliasResult.invitation_id === excludeId) {
      return true;
    }
    return false;
  }

  return true;
}

// 페이지 조회 기록
export async function recordPageView(
  invitationId: string,
  visitorIp?: string,
  userAgent?: string
): Promise<void> {
  const db = await getDB();
  await db
    .prepare(
      "INSERT INTO page_views (invitation_id, visitor_ip, user_agent) VALUES (?, ?, ?)"
    )
    .bind(invitationId, visitorIp || null, userAgent || null)
    .run();
}

// 페이지 조회수 통계
export async function getPageViewStats(invitationId: string): Promise<{
  total: number;
  today: number;
  thisWeek: number;
}> {
  const db = await getDB();

  const total = await db
    .prepare("SELECT COUNT(*) as count FROM page_views WHERE invitation_id = ?")
    .bind(invitationId)
    .first<{ count: number }>();

  const today = await db
    .prepare(
      "SELECT COUNT(*) as count FROM page_views WHERE invitation_id = ? AND date(viewed_at) = date('now')"
    )
    .bind(invitationId)
    .first<{ count: number }>();

  const thisWeek = await db
    .prepare(
      "SELECT COUNT(*) as count FROM page_views WHERE invitation_id = ? AND viewed_at >= datetime('now', '-7 days')"
    )
    .bind(invitationId)
    .first<{ count: number }>();

  return {
    total: total?.count || 0,
    today: today?.count || 0,
    thisWeek: thisWeek?.count || 0,
  };
}

// RSVP 타입
export interface RSVPResponse {
  id: string;
  invitation_id: string;
  guest_name: string;
  guest_phone: string | null;
  attendance: "attending" | "not_attending" | "pending";
  guest_count: number;
  message: string | null;
  created_at: string;
}

export interface RSVPInput {
  invitation_id: string;
  guest_name: string;
  guest_phone?: string;
  attendance: "attending" | "not_attending" | "pending";
  guest_count: number;
  message?: string;
}

// RSVP 생성
export async function createRSVP(input: RSVPInput): Promise<RSVPResponse> {
  const db = await getDB();
  const id = generateId();
  const now = new Date().toISOString();

  const result = await db
    .prepare(
      `INSERT INTO rsvp_responses (
        id, invitation_id, guest_name, guest_phone, attendance, guest_count, message, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *`
    )
    .bind(
      id,
      input.invitation_id,
      input.guest_name,
      input.guest_phone || null,
      input.attendance,
      input.guest_count,
      input.message || null,
      now
    )
    .first<RSVPResponse>();

  if (!result) {
    throw new Error("Failed to create RSVP");
  }

  return result;
}

// RSVP 목록 조회
export async function getRSVPsByInvitationId(invitationId: string): Promise<RSVPResponse[]> {
  const db = await getDB();
  const result = await db
    .prepare("SELECT * FROM rsvp_responses WHERE invitation_id = ? ORDER BY created_at DESC")
    .bind(invitationId)
    .all<RSVPResponse>();

  return result.results || [];
}

// RSVP 요약 통계
export async function getRSVPSummary(invitationId: string): Promise<{
  total: number;
  attending: number;
  notAttending: number;
  pending: number;
  totalGuests: number;
}> {
  const responses = await getRSVPsByInvitationId(invitationId);

  return {
    total: responses.length,
    attending: responses.filter((r) => r.attendance === "attending").length,
    notAttending: responses.filter((r) => r.attendance === "not_attending").length,
    pending: responses.filter((r) => r.attendance === "pending").length,
    totalGuests: responses
      .filter((r) => r.attendance === "attending")
      .reduce((sum, r) => sum + (r.guest_count || 1), 0),
  };
}

// ==================== Slug Alias Functions ====================

export interface SlugAlias {
  id: string;
  invitation_id: string;
  alias_slug: string;
  created_at: string;
}

// Alias로 청첩장 조회
export async function getInvitationByAlias(alias: string): Promise<Invitation | null> {
  const db = await getDB();
  const aliasRecord = await db
    .prepare("SELECT invitation_id FROM slug_aliases WHERE alias_slug = ?")
    .bind(alias)
    .first<{ invitation_id: string }>();

  if (!aliasRecord) {
    return null;
  }

  return getInvitationById(aliasRecord.invitation_id);
}

// Slug alias 생성
export async function createSlugAlias(
  invitationId: string,
  aliasSlug: string
): Promise<SlugAlias> {
  const db = await getDB();
  const id = generateId();

  const result = await db
    .prepare(
      `INSERT INTO slug_aliases (id, invitation_id, alias_slug)
       VALUES (?, ?, ?)
       RETURNING *`
    )
    .bind(id, invitationId, aliasSlug)
    .first<SlugAlias>();

  if (!result) {
    throw new Error("Failed to create slug alias");
  }

  return result;
}

// 청첩장의 alias 목록 조회
export async function getAliasesByInvitationId(invitationId: string): Promise<SlugAlias[]> {
  const db = await getDB();
  const result = await db
    .prepare("SELECT * FROM slug_aliases WHERE invitation_id = ? ORDER BY created_at DESC")
    .bind(invitationId)
    .all<SlugAlias>();

  return result.results || [];
}

// 청첩장의 alias 개수 확인
export async function countAliasesByInvitationId(invitationId: string): Promise<number> {
  const db = await getDB();
  const result = await db
    .prepare("SELECT COUNT(*) as count FROM slug_aliases WHERE invitation_id = ?")
    .bind(invitationId)
    .first<{ count: number }>();

  return result?.count || 0;
}

// 특정 slug가 alias인지 확인
export async function getAliasBySlug(slug: string): Promise<SlugAlias | null> {
  const db = await getDB();
  return db
    .prepare("SELECT * FROM slug_aliases WHERE alias_slug = ?")
    .bind(slug)
    .first<SlugAlias>();
}

// Alias 삭제
export async function deleteSlugAlias(aliasId: string, invitationId: string): Promise<boolean> {
  const db = await getDB();
  const result = await db
    .prepare("DELETE FROM slug_aliases WHERE id = ? AND invitation_id = ?")
    .bind(aliasId, invitationId)
    .run();

  return result.meta.changes > 0;
}

// ==================== Guestbook Functions ====================

export interface GuestbookMessage {
  id: string;
  invitation_id: string;
  guest_name: string;
  message: string;
  question: string | null;
  created_at: string;
}

export interface GuestbookInput {
  invitation_id: string;
  guest_name: string;
  message: string;
  question?: string;
}

// 방명록 메시지 생성
export async function createGuestbookMessage(input: GuestbookInput): Promise<GuestbookMessage> {
  const db = await getDB();
  const id = generateId();
  const now = new Date().toISOString();

  const result = await db
    .prepare(
      `INSERT INTO guestbook_messages (id, invitation_id, guest_name, message, question, created_at)
       VALUES (?, ?, ?, ?, ?, ?)
       RETURNING *`
    )
    .bind(id, input.invitation_id, input.guest_name, input.message, input.question || null, now)
    .first<GuestbookMessage>();

  if (!result) {
    throw new Error("Failed to create guestbook message");
  }

  return result;
}

// 방명록 메시지 목록 조회
export async function getGuestbookMessages(invitationId: string): Promise<GuestbookMessage[]> {
  const db = await getDB();
  const result = await db
    .prepare("SELECT * FROM guestbook_messages WHERE invitation_id = ? ORDER BY created_at DESC")
    .bind(invitationId)
    .all<GuestbookMessage>();

  return result.results || [];
}

// 방명록 메시지 삭제
export async function deleteGuestbookMessage(messageId: string, invitationId: string): Promise<boolean> {
  const db = await getDB();
  const result = await db
    .prepare("DELETE FROM guestbook_messages WHERE id = ? AND invitation_id = ?")
    .bind(messageId, invitationId)
    .run();

  return result.meta.changes > 0;
}

// 방명록 메시지 개수
export async function getGuestbookCount(invitationId: string): Promise<number> {
  const db = await getDB();
  const result = await db
    .prepare("SELECT COUNT(*) as count FROM guestbook_messages WHERE invitation_id = ?")
    .bind(invitationId)
    .first<{ count: number }>();

  return result?.count || 0;
}

// ==================== Guest Functions (혼주용 개인화 링크) ====================

export interface Guest {
  id: string;
  invitation_id: string;
  name: string;
  relation: string | null;
  honorific: string;
  intro_greeting: string | null;
  greeting_template_id: string | null;
  custom_message: string | null;
  opened_at: string | null;
  opened_count: number;
  last_opened_at: string | null;
  rsvp_response_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface GuestInput {
  invitation_id: string;
  name: string;
  relation?: string;
  honorific?: string;
  intro_greeting?: string;
  greeting_template_id?: string;
  custom_message?: string;
}

// 게스트 생성
export async function createGuest(input: GuestInput): Promise<Guest> {
  const db = await getDB();
  const id = generateId();
  const now = new Date().toISOString();

  const result = await db
    .prepare(
      `INSERT INTO guests (
        id, invitation_id, name, relation, honorific, intro_greeting, greeting_template_id, custom_message,
        opened_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
      RETURNING *`
    )
    .bind(
      id,
      input.invitation_id,
      input.name,
      input.relation || null,
      input.honorific || '님께',
      input.intro_greeting || null,
      input.greeting_template_id || null,
      input.custom_message || null,
      now,
      now
    )
    .first<Guest>();

  if (!result) {
    throw new Error("Failed to create guest");
  }

  return result;
}

// 게스트 조회 (ID)
export async function getGuestById(id: string): Promise<Guest | null> {
  const db = await getDB();
  return db
    .prepare("SELECT * FROM guests WHERE id = ?")
    .bind(id)
    .first<Guest>();
}

// 청첩장의 게스트 목록 조회
export async function getGuestsByInvitationId(invitationId: string): Promise<Guest[]> {
  const db = await getDB();
  const result = await db
    .prepare("SELECT * FROM guests WHERE invitation_id = ? ORDER BY created_at ASC")
    .bind(invitationId)
    .all<Guest>();

  return result.results || [];
}

// 게스트 업데이트
export async function updateGuest(
  id: string,
  invitationId: string,
  input: Partial<GuestInput>
): Promise<Guest | null> {
  const db = await getDB();
  const now = new Date().toISOString();

  const updates: string[] = [];
  const values: unknown[] = [];

  if (input.name !== undefined) {
    updates.push("name = ?");
    values.push(input.name);
  }
  if (input.relation !== undefined) {
    updates.push("relation = ?");
    values.push(input.relation);
  }
  if (input.honorific !== undefined) {
    updates.push("honorific = ?");
    values.push(input.honorific);
  }
  if (input.intro_greeting !== undefined) {
    updates.push("intro_greeting = ?");
    values.push(input.intro_greeting);
  }
  if (input.greeting_template_id !== undefined) {
    updates.push("greeting_template_id = ?");
    values.push(input.greeting_template_id);
  }
  if (input.custom_message !== undefined) {
    updates.push("custom_message = ?");
    values.push(input.custom_message);
  }

  if (updates.length === 0) {
    return getGuestById(id);
  }

  updates.push("updated_at = ?");
  values.push(now);
  values.push(id);
  values.push(invitationId);

  const result = await db
    .prepare(
      `UPDATE guests SET ${updates.join(", ")} WHERE id = ? AND invitation_id = ? RETURNING *`
    )
    .bind(...values)
    .first<Guest>();

  return result;
}

// 게스트 삭제
export async function deleteGuest(id: string, invitationId: string): Promise<boolean> {
  const db = await getDB();
  const result = await db
    .prepare("DELETE FROM guests WHERE id = ? AND invitation_id = ?")
    .bind(id, invitationId)
    .run();

  return result.meta.changes > 0;
}

// 게스트 열람 기록
export async function recordGuestView(guestId: string): Promise<void> {
  const db = await getDB();
  const now = new Date().toISOString();

  await db
    .prepare(
      `UPDATE guests SET
        opened_at = COALESCE(opened_at, ?),
        opened_count = opened_count + 1,
        last_opened_at = ?
      WHERE id = ?`
    )
    .bind(now, now, guestId)
    .run();
}

// 게스트에 RSVP 연결
export async function linkGuestToRSVP(guestId: string, rsvpId: string): Promise<void> {
  const db = await getDB();
  const now = new Date().toISOString();

  await db
    .prepare("UPDATE guests SET rsvp_response_id = ?, updated_at = ? WHERE id = ?")
    .bind(rsvpId, now, guestId)
    .run();
}

// 게스트 통계
export async function getGuestStats(invitationId: string): Promise<{
  total: number;
  opened: number;
  notOpened: number;
  withRsvp: number;
}> {
  const guests = await getGuestsByInvitationId(invitationId);

  return {
    total: guests.length,
    opened: guests.filter((g) => g.opened_count > 0).length,
    notOpened: guests.filter((g) => g.opened_count === 0).length,
    withRsvp: guests.filter((g) => g.rsvp_response_id).length,
  };
}

// 다수 게스트 일괄 생성
export async function createGuestsBulk(
  invitationId: string,
  guestInputs: Omit<GuestInput, 'invitation_id'>[]
): Promise<Guest[]> {
  const results: Guest[] = [];

  for (const input of guestInputs) {
    const guest = await createGuest({
      ...input,
      invitation_id: invitationId,
    });
    results.push(guest);
  }

  return results;
}

// ==================== Invitation Admin Functions (혼주용 관리자) ====================

export interface InvitationAdmin {
  id: string;
  invitation_id: string;
  password_hash: string;
  last_login_at: string | null;
  login_count: number;
  created_at: string;
  updated_at: string;
}

export interface InvitationAdminInput {
  invitation_id: string;
  password_hash: string;
}

// 관리자 생성
export async function createInvitationAdmin(input: InvitationAdminInput): Promise<InvitationAdmin> {
  const db = await getDB();
  const id = generateId();
  const now = new Date().toISOString();

  const result = await db
    .prepare(
      `INSERT INTO invitation_admins (
        id, invitation_id, password_hash, login_count, created_at, updated_at
      ) VALUES (?, ?, ?, 0, ?, ?)
      RETURNING *`
    )
    .bind(id, input.invitation_id, input.password_hash, now, now)
    .first<InvitationAdmin>();

  if (!result) {
    throw new Error("Failed to create invitation admin");
  }

  return result;
}

// 관리자 조회 (청첩장 ID로)
export async function getInvitationAdminByInvitationId(invitationId: string): Promise<InvitationAdmin | null> {
  const db = await getDB();
  return db
    .prepare("SELECT * FROM invitation_admins WHERE invitation_id = ?")
    .bind(invitationId)
    .first<InvitationAdmin>();
}

// 관리자 비밀번호 업데이트
export async function updateInvitationAdminPassword(
  invitationId: string,
  passwordHash: string
): Promise<InvitationAdmin | null> {
  const db = await getDB();
  const now = new Date().toISOString();

  return db
    .prepare(
      `UPDATE invitation_admins SET password_hash = ?, updated_at = ?
       WHERE invitation_id = ? RETURNING *`
    )
    .bind(passwordHash, now, invitationId)
    .first<InvitationAdmin>();
}

// 관리자 로그인 기록 업데이트
export async function recordAdminLogin(invitationId: string): Promise<void> {
  const db = await getDB();
  const now = new Date().toISOString();

  await db
    .prepare(
      `UPDATE invitation_admins
       SET last_login_at = ?, login_count = login_count + 1, updated_at = ?
       WHERE invitation_id = ?`
    )
    .bind(now, now, invitationId)
    .run();
}

// ==================== Greeting Template Functions (인사말 템플릿) ====================

export interface GreetingTemplate {
  id: string;
  invitation_id: string;
  name: string;
  content: string;
  is_default: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface GreetingTemplateInput {
  invitation_id: string;
  name: string;
  content: string;
  is_default?: boolean;
  sort_order?: number;
}

// 템플릿 생성
export async function createGreetingTemplate(input: GreetingTemplateInput): Promise<GreetingTemplate> {
  const db = await getDB();
  const id = generateId();
  const now = new Date().toISOString();

  const result = await db
    .prepare(
      `INSERT INTO greeting_templates (
        id, invitation_id, name, content, is_default, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *`
    )
    .bind(
      id,
      input.invitation_id,
      input.name,
      input.content,
      input.is_default ? 1 : 0,
      input.sort_order || 0,
      now,
      now
    )
    .first<GreetingTemplate>();

  if (!result) {
    throw new Error("Failed to create greeting template");
  }

  return result;
}

// 템플릿 조회 (ID로)
export async function getGreetingTemplateById(id: string): Promise<GreetingTemplate | null> {
  const db = await getDB();
  return db
    .prepare("SELECT * FROM greeting_templates WHERE id = ?")
    .bind(id)
    .first<GreetingTemplate>();
}

// 청첩장의 템플릿 목록 조회
export async function getGreetingTemplatesByInvitationId(invitationId: string): Promise<GreetingTemplate[]> {
  const db = await getDB();
  const result = await db
    .prepare("SELECT * FROM greeting_templates WHERE invitation_id = ? ORDER BY sort_order ASC, created_at ASC")
    .bind(invitationId)
    .all<GreetingTemplate>();

  return result.results || [];
}

// 템플릿 업데이트
export async function updateGreetingTemplate(
  id: string,
  input: Partial<Omit<GreetingTemplateInput, 'invitation_id'>>
): Promise<GreetingTemplate | null> {
  const db = await getDB();
  const now = new Date().toISOString();

  const updates: string[] = [];
  const values: unknown[] = [];

  if (input.name !== undefined) {
    updates.push("name = ?");
    values.push(input.name);
  }
  if (input.content !== undefined) {
    updates.push("content = ?");
    values.push(input.content);
  }
  if (input.is_default !== undefined) {
    updates.push("is_default = ?");
    values.push(input.is_default ? 1 : 0);
  }
  if (input.sort_order !== undefined) {
    updates.push("sort_order = ?");
    values.push(input.sort_order);
  }

  if (updates.length === 0) {
    return getGreetingTemplateById(id);
  }

  updates.push("updated_at = ?");
  values.push(now);
  values.push(id);

  const result = await db
    .prepare(`UPDATE greeting_templates SET ${updates.join(", ")} WHERE id = ? RETURNING *`)
    .bind(...values)
    .first<GreetingTemplate>();

  return result;
}

// 템플릿 삭제
export async function deleteGreetingTemplate(id: string): Promise<boolean> {
  const db = await getDB();
  const result = await db
    .prepare("DELETE FROM greeting_templates WHERE id = ?")
    .bind(id)
    .run();

  return result.success;
}

// 기본 템플릿 설정 (다른 템플릿의 is_default를 0으로)
export async function setDefaultGreetingTemplate(id: string, invitationId: string): Promise<void> {
  const db = await getDB();
  const now = new Date().toISOString();

  // 모든 템플릿의 기본 설정 해제
  await db
    .prepare("UPDATE greeting_templates SET is_default = 0, updated_at = ? WHERE invitation_id = ?")
    .bind(now, invitationId)
    .run();

  // 선택한 템플릿을 기본으로 설정
  await db
    .prepare("UPDATE greeting_templates SET is_default = 1, updated_at = ? WHERE id = ?")
    .bind(now, id)
    .run();
}

// 기본 인사말 템플릿 초기 생성 (청첩장 생성 시 호출)
export async function createDefaultGreetingTemplates(invitationId: string): Promise<GreetingTemplate[]> {
  const defaultTemplates = [
    {
      name: '기본형',
      content: '항상 저희 가족을 챙겨주셔서 감사합니다.\n저희 아이가 좋은 사람을 만나 결혼하게 되었습니다.\n꼭 오셔서 축복해 주세요.',
      is_default: true,
      sort_order: 0,
    },
    {
      name: '친척용',
      content: '늘 따뜻하게 보살펴 주셔서 감사합니다.\n저희 집안의 경사를 함께 나누고 싶어 이렇게 초대합니다.\n바쁘시더라도 꼭 참석해 주시면 감사하겠습니다.',
      is_default: false,
      sort_order: 1,
    },
    {
      name: '직장용',
      content: '항상 좋은 인연으로 함께해 주셔서 감사합니다.\n저희 자녀의 결혼식에 초대합니다.\n귀한 시간 내어 자리를 빛내 주시면 감사하겠습니다.',
      is_default: false,
      sort_order: 2,
    },
  ];

  const results: GreetingTemplate[] = [];

  for (const template of defaultTemplates) {
    const created = await createGreetingTemplate({
      invitation_id: invitationId,
      ...template,
    });
    results.push(created);
  }

  return results;
}

// ==================== Admin Functions (운영자 관리) ====================

export interface InvitationWithDeletionInfo extends Invitation {
  user_email?: string;
  deletion_date: string;
  deletion_reason: 'incomplete' | 'post_wedding';
  days_until_deletion: number;
}

// 모든 청첩장 조회 (삭제 예정일 포함)
export async function getAllInvitationsForAdmin(): Promise<InvitationWithDeletionInfo[]> {
  const db = await getDB();

  const result = await db
    .prepare(`
      SELECT * FROM invitations ORDER BY created_at DESC
    `)
    .all<Invitation>();

  const invitations = result.results || [];
  const now = new Date();

  return invitations.map((inv) => {
    let deletionDate: Date;
    let deletionReason: 'incomplete' | 'post_wedding';

    if (!inv.is_published) {
      // 미완성: 생성 후 7일
      deletionDate = new Date(inv.created_at);
      deletionDate.setDate(deletionDate.getDate() + 7);
      deletionReason = 'incomplete';
    } else if (inv.wedding_date) {
      // 완성된 청첩장: 결혼식 30일 후
      deletionDate = new Date(inv.wedding_date);
      deletionDate.setDate(deletionDate.getDate() + 30);
      deletionReason = 'post_wedding';
    } else {
      // 결혼일 없는 완성 청첩장: 생성 후 90일
      deletionDate = new Date(inv.created_at);
      deletionDate.setDate(deletionDate.getDate() + 90);
      deletionReason = 'post_wedding';
    }

    const daysUntilDeletion = Math.ceil((deletionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      ...inv,
      deletion_date: deletionDate.toISOString(),
      deletion_reason: deletionReason,
      days_until_deletion: daysUntilDeletion,
    };
  });
}

// 삭제 예정인 청첩장 조회
export async function getInvitationsScheduledForDeletion(): Promise<InvitationWithDeletionInfo[]> {
  const all = await getAllInvitationsForAdmin();
  return all.filter((inv) => inv.days_until_deletion <= 0);
}

// 청첩장 강제 삭제 (관련 데이터 포함)
export async function forceDeleteInvitation(invitationId: string): Promise<boolean> {
  const db = await getDB();

  try {
    // 관련 데이터 삭제
    await db.prepare("DELETE FROM guests WHERE invitation_id = ?").bind(invitationId).run();
    await db.prepare("DELETE FROM greeting_templates WHERE invitation_id = ?").bind(invitationId).run();
    await db.prepare("DELETE FROM invitation_admins WHERE invitation_id = ?").bind(invitationId).run();
    await db.prepare("DELETE FROM page_views WHERE invitation_id = ?").bind(invitationId).run();
    await db.prepare("DELETE FROM slug_aliases WHERE invitation_id = ?").bind(invitationId).run();
    await db.prepare("DELETE FROM rsvp_responses WHERE invitation_id = ?").bind(invitationId).run();
    await db.prepare("DELETE FROM guestbook_messages WHERE invitation_id = ?").bind(invitationId).run();

    // 청첩장 삭제
    const result = await db.prepare("DELETE FROM invitations WHERE id = ?").bind(invitationId).run();

    return result.success;
  } catch (error) {
    console.error("Force delete invitation error:", error);
    return false;
  }
}

// 만료된 청첩장 일괄 삭제
export async function deleteExpiredInvitations(): Promise<{ deleted: number; errors: string[] }> {
  const expiredInvitations = await getInvitationsScheduledForDeletion();
  let deleted = 0;
  const errors: string[] = [];

  for (const inv of expiredInvitations) {
    const success = await forceDeleteInvitation(inv.id);
    if (success) {
      deleted++;
    } else {
      errors.push(`Failed to delete invitation ${inv.id}`);
    }
  }

  return { deleted, errors };
}

// 관리자 통계
export interface AdminStats {
  total_invitations: number;
  published_invitations: number;
  unpublished_invitations: number;
  expiring_soon: number;
  total_users: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const db = await getDB();

  const [totalResult, publishedResult] = await Promise.all([
    db.prepare("SELECT COUNT(*) as count FROM invitations").first<{ count: number }>(),
    db.prepare("SELECT COUNT(*) as count FROM invitations WHERE is_published = 1").first<{ count: number }>(),
  ]);

  // users 테이블이 없을 수 있으므로 별도 처리
  let usersCount = 0;
  try {
    const usersResult = await db.prepare("SELECT COUNT(*) as count FROM users").first<{ count: number }>();
    usersCount = usersResult?.count || 0;
  } catch {
    // users 테이블이 없는 경우 무시
  }

  const allInvitations = await getAllInvitationsForAdmin();
  const expiringSoon = allInvitations.filter((inv) => inv.days_until_deletion <= 7 && inv.days_until_deletion > 0).length;

  return {
    total_invitations: totalResult?.count || 0,
    published_invitations: publishedResult?.count || 0,
    unpublished_invitations: (totalResult?.count || 0) - (publishedResult?.count || 0),
    expiring_soon: expiringSoon,
    total_users: usersCount,
  };
}
