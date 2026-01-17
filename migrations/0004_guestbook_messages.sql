-- Guestbook messages table for dear-drawer

CREATE TABLE IF NOT EXISTS guestbook_messages (
  id TEXT PRIMARY KEY,
  invitation_id TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  message TEXT NOT NULL,
  question TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (invitation_id) REFERENCES invitations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_guestbook_invitation ON guestbook_messages(invitation_id);
CREATE INDEX IF NOT EXISTS idx_guestbook_created ON guestbook_messages(created_at DESC);
