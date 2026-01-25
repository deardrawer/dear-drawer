-- 게스트 테이블 (혼주용 개인화 링크)
-- 하나의 청첩장에 여러 게스트를 등록하고, 각 게스트별 개인화 URL 제공

CREATE TABLE IF NOT EXISTS guests (
  id TEXT PRIMARY KEY,
  invitation_id TEXT NOT NULL,

  -- 게스트 정보
  name TEXT NOT NULL,
  relation TEXT,              -- 이모, 삼촌, 고모, 직장상사 등
  honorific TEXT DEFAULT '님께', -- 호칭: 님께, 께, 님 등
  custom_message TEXT,        -- 관계별 맞춤 메시지 (선택)

  -- 열람 추적
  opened_at TEXT,             -- 최초 열람 시간
  opened_count INTEGER DEFAULT 0,  -- 열람 횟수
  last_opened_at TEXT,        -- 마지막 열람 시간

  -- RSVP 연동 (게스트가 참석 응답 시 연결)
  rsvp_response_id TEXT,

  -- 메타
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (invitation_id) REFERENCES invitations(id) ON DELETE CASCADE,
  FOREIGN KEY (rsvp_response_id) REFERENCES rsvp_responses(id) ON DELETE SET NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_guests_invitation ON guests(invitation_id);
CREATE INDEX IF NOT EXISTS idx_guests_name ON guests(name);
