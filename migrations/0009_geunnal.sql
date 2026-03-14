-- Geunnal (그날) - Wedding event management tables

CREATE TABLE IF NOT EXISTS geunnal_pages (
  id TEXT PRIMARY KEY,
  invitation_id TEXT,
  slug TEXT UNIQUE NOT NULL,
  groom_name TEXT NOT NULL,
  bride_name TEXT NOT NULL,
  wedding_date TEXT,
  wedding_time TEXT,
  venue_name TEXT,
  venue_address TEXT,
  password_hash TEXT,
  last_login_at TEXT,
  login_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_geunnal_pages_slug ON geunnal_pages(slug);
CREATE INDEX idx_geunnal_pages_invitation ON geunnal_pages(invitation_id);

CREATE TABLE IF NOT EXISTS geunnal_events (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL REFERENCES geunnal_pages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date TEXT DEFAULT '',
  time TEXT DEFAULT '',
  location TEXT,
  map_url TEXT,
  expected_guests INTEGER DEFAULT 0,
  total_cost INTEGER,
  side TEXT NOT NULL DEFAULT 'both',
  area TEXT DEFAULT '',
  restaurant TEXT DEFAULT '',
  meal_type TEXT NOT NULL DEFAULT 'lunch',
  sort_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_geunnal_events_page ON geunnal_events(page_id);

CREATE TABLE IF NOT EXISTS geunnal_event_guests (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES geunnal_events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contacted INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_geunnal_event_guests_event ON geunnal_event_guests(event_id);

CREATE TABLE IF NOT EXISTS geunnal_submissions (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES geunnal_events(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  is_anonymous INTEGER DEFAULT 0,
  avatar_id INTEGER DEFAULT 0,
  message TEXT,
  photo_url TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_geunnal_submissions_event ON geunnal_submissions(event_id);

CREATE TABLE IF NOT EXISTS geunnal_venues (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL REFERENCES geunnal_pages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  area TEXT DEFAULT '',
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  rating TEXT DEFAULT 'hold',
  reservation_status TEXT DEFAULT 'unknown',
  price_range TEXT,
  menu_notes TEXT,
  phone TEXT,
  event_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_geunnal_venues_page ON geunnal_venues(page_id);
