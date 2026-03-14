import { getCloudflareContext } from "@opennextjs/cloudflare";
import type {
  GeunnalPage, GeunnalPageInput,
  GeunnalEvent, GeunnalEventInput,
  EventGuest,
  GeunnalSubmission,
  GeunnalVenue, GeunnalVenueInput,
} from "@/types/geunnal";

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
  meta: { changes: number };
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface CloudflareEnvWithDB {
  DB?: D1Database;
}

async function getDB(): Promise<D1Database> {
  const { env } = await getCloudflareContext() as { env: CloudflareEnvWithDB };
  if (!env.DB) {
    throw new Error("D1 Database not configured");
  }
  return env.DB;
}

function generateId(): string {
  return crypto.randomUUID().split('-')[0];
}

// ── Pages ──

export async function createPage(input: GeunnalPageInput & { groom_name: string; bride_name: string; slug: string }): Promise<GeunnalPage> {
  const db = await getDB();
  const id = generateId();
  const now = new Date().toISOString();

  const result = await db
    .prepare(
      `INSERT INTO geunnal_pages (
        id, invitation_id, slug, groom_name, bride_name,
        wedding_date, wedding_time, venue_name, venue_address,
        password_hash, login_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
      RETURNING *`
    )
    .bind(
      id,
      input.invitation_id || null,
      input.slug,
      input.groom_name,
      input.bride_name,
      input.wedding_date || null,
      input.wedding_time || null,
      input.venue_name || null,
      input.venue_address || null,
      input.password_hash || null,
      now,
      now
    )
    .first<GeunnalPage>();

  if (!result) throw new Error("Failed to create geunnal page");
  return result;
}

export async function getPageById(id: string): Promise<GeunnalPage | null> {
  const db = await getDB();
  return db.prepare("SELECT * FROM geunnal_pages WHERE id = ?").bind(id).first<GeunnalPage>();
}

export async function getPageBySlug(slug: string): Promise<GeunnalPage | null> {
  const db = await getDB();
  return db.prepare("SELECT * FROM geunnal_pages WHERE slug = ?").bind(slug).first<GeunnalPage>();
}

export async function getPageByInvitationId(invitationId: string): Promise<GeunnalPage | null> {
  const db = await getDB();
  return db.prepare("SELECT * FROM geunnal_pages WHERE invitation_id = ?").bind(invitationId).first<GeunnalPage>();
}

export async function getAllPages(): Promise<GeunnalPage[]> {
  const db = await getDB();
  const result = await db.prepare("SELECT * FROM geunnal_pages ORDER BY created_at DESC").all<GeunnalPage>();
  return result.results || [];
}

export async function updatePage(id: string, input: GeunnalPageInput): Promise<GeunnalPage | null> {
  const db = await getDB();
  const updates: string[] = [];
  const values: unknown[] = [];

  if (input.invitation_id !== undefined) { updates.push("invitation_id = ?"); values.push(input.invitation_id); }
  if (input.slug !== undefined) { updates.push("slug = ?"); values.push(input.slug); }
  if (input.groom_name !== undefined) { updates.push("groom_name = ?"); values.push(input.groom_name); }
  if (input.bride_name !== undefined) { updates.push("bride_name = ?"); values.push(input.bride_name); }
  if (input.wedding_date !== undefined) { updates.push("wedding_date = ?"); values.push(input.wedding_date); }
  if (input.wedding_time !== undefined) { updates.push("wedding_time = ?"); values.push(input.wedding_time); }
  if (input.venue_name !== undefined) { updates.push("venue_name = ?"); values.push(input.venue_name); }
  if (input.venue_address !== undefined) { updates.push("venue_address = ?"); values.push(input.venue_address); }
  if (input.password_hash !== undefined) { updates.push("password_hash = ?"); values.push(input.password_hash); }

  if (updates.length === 0) return getPageById(id);

  updates.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);

  return db
    .prepare(`UPDATE geunnal_pages SET ${updates.join(", ")} WHERE id = ? RETURNING *`)
    .bind(...values)
    .first<GeunnalPage>();
}

export async function updatePageLogin(id: string): Promise<void> {
  const db = await getDB();
  await db
    .prepare("UPDATE geunnal_pages SET last_login_at = ?, login_count = login_count + 1 WHERE id = ?")
    .bind(new Date().toISOString(), id)
    .run();
}

export async function deletePage(id: string): Promise<boolean> {
  const db = await getDB();
  const result = await db.prepare("DELETE FROM geunnal_pages WHERE id = ?").bind(id).run();
  return result.meta.changes > 0;
}

// ── Events ──

export async function createEvent(pageId: string, input: GeunnalEventInput & { name: string }): Promise<GeunnalEvent> {
  const db = await getDB();
  const id = generateId();
  const now = new Date().toISOString();

  const result = await db
    .prepare(
      `INSERT INTO geunnal_events (
        id, page_id, name, date, time, location, map_url,
        expected_guests, total_cost, side, area, restaurant,
        meal_type, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *`
    )
    .bind(
      id, pageId, input.name,
      input.date || '', input.time || '',
      input.location || null, input.map_url || null,
      input.expected_guests || 0, input.total_cost || null,
      input.side || 'both', input.area || '',
      input.restaurant || '', input.meal_type || 'lunch',
      input.sort_order || 0, now, now
    )
    .first<GeunnalEvent>();

  if (!result) throw new Error("Failed to create event");
  return result;
}

export async function getEventsByPageId(pageId: string): Promise<GeunnalEvent[]> {
  const db = await getDB();
  const result = await db
    .prepare("SELECT * FROM geunnal_events WHERE page_id = ? ORDER BY sort_order, date, time")
    .bind(pageId)
    .all<GeunnalEvent>();
  return result.results || [];
}

export async function getEventById(id: string): Promise<GeunnalEvent | null> {
  const db = await getDB();
  return db.prepare("SELECT * FROM geunnal_events WHERE id = ?").bind(id).first<GeunnalEvent>();
}

export async function updateEvent(id: string, input: GeunnalEventInput): Promise<GeunnalEvent | null> {
  const db = await getDB();
  const updates: string[] = [];
  const values: unknown[] = [];

  if (input.name !== undefined) { updates.push("name = ?"); values.push(input.name); }
  if (input.date !== undefined) { updates.push("date = ?"); values.push(input.date); }
  if (input.time !== undefined) { updates.push("time = ?"); values.push(input.time); }
  if (input.location !== undefined) { updates.push("location = ?"); values.push(input.location); }
  if (input.map_url !== undefined) { updates.push("map_url = ?"); values.push(input.map_url); }
  if (input.expected_guests !== undefined) { updates.push("expected_guests = ?"); values.push(input.expected_guests); }
  if (input.total_cost !== undefined) { updates.push("total_cost = ?"); values.push(input.total_cost); }
  if (input.side !== undefined) { updates.push("side = ?"); values.push(input.side); }
  if (input.area !== undefined) { updates.push("area = ?"); values.push(input.area); }
  if (input.restaurant !== undefined) { updates.push("restaurant = ?"); values.push(input.restaurant); }
  if (input.meal_type !== undefined) { updates.push("meal_type = ?"); values.push(input.meal_type); }
  if (input.sort_order !== undefined) { updates.push("sort_order = ?"); values.push(input.sort_order); }

  if (updates.length === 0) return getEventById(id);

  updates.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);

  return db
    .prepare(`UPDATE geunnal_events SET ${updates.join(", ")} WHERE id = ? RETURNING *`)
    .bind(...values)
    .first<GeunnalEvent>();
}

export async function deleteEvent(id: string): Promise<boolean> {
  const db = await getDB();
  const result = await db.prepare("DELETE FROM geunnal_events WHERE id = ?").bind(id).run();
  return result.meta.changes > 0;
}

// ── Event Guests ──

export async function addGuest(eventId: string, name: string): Promise<EventGuest> {
  const db = await getDB();
  const id = generateId();
  const now = new Date().toISOString();

  const result = await db
    .prepare("INSERT INTO geunnal_event_guests (id, event_id, name, contacted, created_at) VALUES (?, ?, ?, 0, ?) RETURNING *")
    .bind(id, eventId, name, now)
    .first<EventGuest>();

  if (!result) throw new Error("Failed to add guest");
  return result;
}

export async function getGuestsByEventId(eventId: string): Promise<EventGuest[]> {
  const db = await getDB();
  const result = await db
    .prepare("SELECT * FROM geunnal_event_guests WHERE event_id = ? ORDER BY created_at")
    .bind(eventId)
    .all<EventGuest>();
  return result.results || [];
}

export async function updateGuest(id: string, updates: { name?: string; contacted?: number }): Promise<EventGuest | null> {
  const db = await getDB();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.name !== undefined) { fields.push("name = ?"); values.push(updates.name); }
  if (updates.contacted !== undefined) { fields.push("contacted = ?"); values.push(updates.contacted); }

  if (fields.length === 0) return null;
  values.push(id);

  return db
    .prepare(`UPDATE geunnal_event_guests SET ${fields.join(", ")} WHERE id = ? RETURNING *`)
    .bind(...values)
    .first<EventGuest>();
}

export async function deleteGuest(id: string): Promise<boolean> {
  const db = await getDB();
  const result = await db.prepare("DELETE FROM geunnal_event_guests WHERE id = ?").bind(id).run();
  return result.meta.changes > 0;
}

// ── Submissions ──

export async function createSubmission(input: {
  event_id: string;
  guest_name: string;
  is_anonymous?: number;
  avatar_id?: number;
  message?: string;
  photo_url?: string;
}): Promise<GeunnalSubmission> {
  const db = await getDB();
  const id = generateId();
  const now = new Date().toISOString();

  const result = await db
    .prepare(
      `INSERT INTO geunnal_submissions (id, event_id, guest_name, is_anonymous, avatar_id, message, photo_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
    )
    .bind(
      id, input.event_id, input.guest_name,
      input.is_anonymous || 0, input.avatar_id || 0,
      input.message || null, input.photo_url || null, now
    )
    .first<GeunnalSubmission>();

  if (!result) throw new Error("Failed to create submission");
  return result;
}

export async function getSubmissionsByEventId(eventId: string): Promise<GeunnalSubmission[]> {
  const db = await getDB();
  const result = await db
    .prepare("SELECT * FROM geunnal_submissions WHERE event_id = ? ORDER BY created_at DESC")
    .bind(eventId)
    .all<GeunnalSubmission>();
  return result.results || [];
}

export async function getSubmissionsByPageId(pageId: string): Promise<GeunnalSubmission[]> {
  const db = await getDB();
  const result = await db
    .prepare(
      `SELECT s.* FROM geunnal_submissions s
       JOIN geunnal_events e ON s.event_id = e.id
       WHERE e.page_id = ?
       ORDER BY s.created_at DESC`
    )
    .bind(pageId)
    .all<GeunnalSubmission>();
  return result.results || [];
}

export async function deleteSubmission(id: string): Promise<boolean> {
  const db = await getDB();
  const result = await db.prepare("DELETE FROM geunnal_submissions WHERE id = ?").bind(id).run();
  return result.meta.changes > 0;
}

// ── Venues ──

export async function createVenue(pageId: string, input: GeunnalVenueInput & { name: string; address: string; lat: number; lng: number }): Promise<GeunnalVenue> {
  const db = await getDB();
  const id = generateId();
  const now = new Date().toISOString();

  const result = await db
    .prepare(
      `INSERT INTO geunnal_venues (
        id, page_id, name, address, area, lat, lng,
        rating, reservation_status, price_range, menu_notes, phone,
        event_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *`
    )
    .bind(
      id, pageId, input.name, input.address,
      input.area || '', input.lat, input.lng,
      input.rating || 'hold', input.reservation_status || 'unknown',
      input.price_range || null, input.menu_notes || null,
      input.phone || null, input.event_id || null, now, now
    )
    .first<GeunnalVenue>();

  if (!result) throw new Error("Failed to create venue");
  return result;
}

export async function getVenuesByPageId(pageId: string): Promise<GeunnalVenue[]> {
  const db = await getDB();
  const result = await db
    .prepare("SELECT * FROM geunnal_venues WHERE page_id = ? ORDER BY created_at DESC")
    .bind(pageId)
    .all<GeunnalVenue>();
  return result.results || [];
}

export async function updateVenue(id: string, input: GeunnalVenueInput): Promise<GeunnalVenue | null> {
  const db = await getDB();
  const updates: string[] = [];
  const values: unknown[] = [];

  if (input.name !== undefined) { updates.push("name = ?"); values.push(input.name); }
  if (input.address !== undefined) { updates.push("address = ?"); values.push(input.address); }
  if (input.area !== undefined) { updates.push("area = ?"); values.push(input.area); }
  if (input.lat !== undefined) { updates.push("lat = ?"); values.push(input.lat); }
  if (input.lng !== undefined) { updates.push("lng = ?"); values.push(input.lng); }
  if (input.rating !== undefined) { updates.push("rating = ?"); values.push(input.rating); }
  if (input.reservation_status !== undefined) { updates.push("reservation_status = ?"); values.push(input.reservation_status); }
  if (input.price_range !== undefined) { updates.push("price_range = ?"); values.push(input.price_range); }
  if (input.menu_notes !== undefined) { updates.push("menu_notes = ?"); values.push(input.menu_notes); }
  if (input.phone !== undefined) { updates.push("phone = ?"); values.push(input.phone); }
  if (input.event_id !== undefined) { updates.push("event_id = ?"); values.push(input.event_id); }

  if (updates.length === 0) return null;

  updates.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);

  return db
    .prepare(`UPDATE geunnal_venues SET ${updates.join(", ")} WHERE id = ? RETURNING *`)
    .bind(...values)
    .first<GeunnalVenue>();
}

export async function deleteVenue(id: string): Promise<boolean> {
  const db = await getDB();
  const result = await db.prepare("DELETE FROM geunnal_venues WHERE id = ?").bind(id).run();
  return result.meta.changes > 0;
}
