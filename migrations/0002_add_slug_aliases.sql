-- Add slug_aliases table for maintaining redirect when slugs change
-- This ensures old links continue to work after slug updates

CREATE TABLE IF NOT EXISTS slug_aliases (
  id TEXT PRIMARY KEY,
  invitation_id TEXT NOT NULL,
  alias_slug TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (invitation_id) REFERENCES invitations(id) ON DELETE CASCADE
);

-- Index for fast alias lookups (most common operation)
CREATE INDEX IF NOT EXISTS idx_slug_aliases_alias_slug ON slug_aliases(alias_slug);

-- Index for listing aliases by invitation
CREATE INDEX IF NOT EXISTS idx_slug_aliases_invitation_id ON slug_aliases(invitation_id);
