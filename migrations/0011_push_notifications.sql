-- Push notification subscriptions and settings for Geunnal

CREATE TABLE IF NOT EXISTS geunnal_push_subscriptions (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL REFERENCES geunnal_pages(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX idx_push_subs_endpoint ON geunnal_push_subscriptions(endpoint);
CREATE INDEX idx_push_subs_page ON geunnal_push_subscriptions(page_id);

CREATE TABLE IF NOT EXISTS geunnal_notification_settings (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL UNIQUE REFERENCES geunnal_pages(id) ON DELETE CASCADE,
  day_before TEXT NOT NULL DEFAULT 'none',
  notify_time TEXT NOT NULL DEFAULT '09:00',
  last_sent_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
