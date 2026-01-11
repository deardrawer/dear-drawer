-- 청첩장 전체 콘텐츠를 저장하기 위한 content 필드 추가
ALTER TABLE invitations ADD COLUMN content TEXT;

-- RSVP 응답 테이블 (아직 없다면)
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

CREATE INDEX IF NOT EXISTS idx_rsvp_responses_invitation_id ON rsvp_responses(invitation_id);
