-- 하객 사진 공유 (Google Drive 연동) — 클라우드 연결/저장위치/업로드세션 + 공유 설정 컬럼
-- 실행: npx wrangler d1 execute dear-drawer-db --local  --file=./migrations/0017_guest_share_cloud.sql
--       npx wrangler d1 execute dear-drawer-db --remote --file=./migrations/0017_guest_share_cloud.sql

-- 1) 클라우드 계정 연결 (토큰은 AES-GCM 암호화 저장, 토큰별 독립 IV)
CREATE TABLE IF NOT EXISTS cloud_connections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'google',
  account_email TEXT,
  access_token_enc TEXT,
  access_token_iv TEXT,
  refresh_token_enc TEXT,
  refresh_token_iv TEXT,
  scope TEXT,
  expires_at TEXT,                 -- access_token 만료 (ISO)
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cloud_connections_user_provider ON cloud_connections(user_id, provider);

-- 2) 프로젝트(청첩장) ↔ 저장 위치 (계정 정보와 분리)
CREATE TABLE IF NOT EXISTS project_cloud_storage (
  invitation_id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  root_folder_id TEXT,             -- Dear Drawer/{신랑}&{신부}
  guest_folder_id TEXT,            -- .../하객 사진
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 3) 하객 업로드 세션 (rate limit·폴더 연결·상태 추적). raw IP 대신 ip_hash 저장
CREATE TABLE IF NOT EXISTS guest_upload_sessions (
  id TEXT PRIMARY KEY,
  invitation_id TEXT NOT NULL,
  guest_name TEXT,
  folder_id TEXT,                  -- 이 세션의 하객 폴더 ({name}_{shortId})
  file_count INTEGER DEFAULT 0,
  total_bytes INTEGER DEFAULT 0,
  ip_hash TEXT,
  status TEXT DEFAULT 'pending',   -- pending | completed | failed
  expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_guest_upload_sessions_inv_created ON guest_upload_sessions(invitation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_guest_upload_sessions_iphash_created ON guest_upload_sessions(ip_hash, created_at);

-- 4) 공유 페이지 설정 (교차관심사 → invitations 컬럼. 템플릿 content JSON 미사용)
ALTER TABLE invitations ADD COLUMN guest_share_enabled INTEGER DEFAULT 0;
ALTER TABLE invitations ADD COLUMN guest_share_title TEXT;
ALTER TABLE invitations ADD COLUMN guest_share_description TEXT;
