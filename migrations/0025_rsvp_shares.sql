-- RSVP 통합관리 공유(사용자당 1개). 링크로 다른 사람이 읽기 전용 조회, 비밀번호 선택.
CREATE TABLE IF NOT EXISTS rsvp_shares (
  user_id TEXT PRIMARY KEY,
  share_slug TEXT,
  password_hash TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rsvp_shares_slug ON rsvp_shares(share_slug);
