-- 하객 사진 공유 — 파일 단위 상태 추적 (R2 staging → Drive 이전)
-- 실행: npx wrangler d1 execute dear-drawer-db --local  --file=./migrations/0018_guest_upload_files.sql
--       npx wrangler d1 execute dear-drawer-db --remote --file=./migrations/0018_guest_upload_files.sql

CREATE TABLE IF NOT EXISTS guest_upload_files (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,        -- guest_upload_sessions.id
  invitation_id TEXT NOT NULL,
  r2_key TEXT NOT NULL,            -- guest-share/{invitationId}/{sessionId}/{fileId}.{ext} (서버 생성)
  original_name TEXT,             -- 원본 파일명 (key에는 미포함)
  mime_type TEXT,
  size INTEGER,
  status TEXT DEFAULT 'pending',   -- pending|uploading|uploaded|queued|transferring|completed|failed
  google_file_id TEXT,            -- Drive 이전 완료 후 (B2)
  error_message TEXT,
  attempt_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  uploaded_at TEXT,               -- R2 업로드 검증 완료 시각
  transferred_at TEXT,            -- Drive 이전 완료 시각 (B2)
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_guest_upload_files_session ON guest_upload_files(session_id);
CREATE INDEX IF NOT EXISTS idx_guest_upload_files_status_updated ON guest_upload_files(status, updated_at);
CREATE INDEX IF NOT EXISTS idx_guest_upload_files_invitation ON guest_upload_files(invitation_id);
