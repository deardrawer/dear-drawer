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

// UUID 생성
function generateId(): string {
  return crypto.randomUUID();
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
        is_paid, is_published, slug, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

// 슬러그 중복 확인
export async function isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
  const db = await getDB();
  let query = "SELECT id FROM invitations WHERE slug = ?";
  const params: unknown[] = [slug];

  if (excludeId) {
    query += " AND id != ?";
    params.push(excludeId);
  }

  const result = await db.prepare(query).bind(...params).first();
  return !result;
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
