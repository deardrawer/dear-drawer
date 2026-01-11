-- Base schema for dear-drawer

CREATE TABLE IF NOT EXISTS invitations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  template_id TEXT DEFAULT 'classic',
  groom_name TEXT,
  bride_name TEXT,
  wedding_date TEXT,
  wedding_time TEXT,
  venue_name TEXT,
  venue_address TEXT,
  venue_detail TEXT,
  venue_map_url TEXT,
  main_image TEXT,
  gallery_images TEXT DEFAULT '[]',
  greeting_message TEXT,
  contact_groom TEXT,
  contact_bride TEXT,
  account_info TEXT DEFAULT '[]',
  content TEXT,
  is_paid INTEGER DEFAULT 0,
  is_published INTEGER DEFAULT 0,
  slug TEXT UNIQUE,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invitation_id TEXT NOT NULL,
  visitor_ip TEXT,
  user_agent TEXT,
  viewed_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (invitation_id) REFERENCES invitations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rsvp_responses (
  id TEXT PRIMARY KEY,
  invitation_id TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  guest_phone TEXT,
  attendance TEXT DEFAULT 'pending',
  guest_count INTEGER DEFAULT 1,
  message TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (invitation_id) REFERENCES invitations(id) ON DELETE CASCADE
);
