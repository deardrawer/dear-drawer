-- 카카오 로그인 사용자 저장 (신규 가입 추적)
-- 최초 로그인 시 INSERT(가입), 재로그인 시 last_login_at/login_count 갱신
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,              -- kakao_{kakaoId}
  kakao_id TEXT,
  nickname TEXT,
  email TEXT,
  profile_image TEXT,
  login_count INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,         -- 최초 가입 시각 (ISO)
  last_login_at TEXT NOT NULL       -- 최근 로그인 시각 (ISO)
);

CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
