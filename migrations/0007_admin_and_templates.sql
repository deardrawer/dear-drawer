-- 혼주용 관리자 페이지 기능 추가
-- 부모님이 비밀번호로 접속해서 게스트를 관리하고, 개인화된 링크를 복사할 수 있음

-- 1. 청첩장 관리자 테이블 (부모님용 비밀번호 접속)
CREATE TABLE IF NOT EXISTS invitation_admins (
  id TEXT PRIMARY KEY,
  invitation_id TEXT NOT NULL UNIQUE,  -- 청첩장당 하나의 관리자

  -- 인증 정보
  password_hash TEXT NOT NULL,         -- 4자리 비밀번호 해시 (bcrypt)

  -- 접속 추적
  last_login_at TEXT,                  -- 마지막 로그인 시간
  login_count INTEGER DEFAULT 0,       -- 로그인 횟수

  -- 메타
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (invitation_id) REFERENCES invitations(id) ON DELETE CASCADE
);

-- 2. 인사말 템플릿 테이블 (관계별 기본 인사말)
CREATE TABLE IF NOT EXISTS greeting_templates (
  id TEXT PRIMARY KEY,
  invitation_id TEXT NOT NULL,

  -- 템플릿 정보
  name TEXT NOT NULL,                  -- 템플릿 이름 (기본형, 친척용, 직장동료용 등)
  content TEXT NOT NULL,               -- 인사말 내용
  is_default INTEGER DEFAULT 0,        -- 기본 템플릿 여부 (1=기본)
  sort_order INTEGER DEFAULT 0,        -- 정렬 순서

  -- 메타
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (invitation_id) REFERENCES invitations(id) ON DELETE CASCADE
);

-- 3. guests 테이블에 템플릿 연결 컬럼 추가
-- (custom_message는 이미 존재하므로 custom_greeting 대신 사용)
ALTER TABLE guests ADD COLUMN greeting_template_id TEXT REFERENCES greeting_templates(id) ON DELETE SET NULL;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_invitation_admins_invitation ON invitation_admins(invitation_id);
CREATE INDEX IF NOT EXISTS idx_greeting_templates_invitation ON greeting_templates(invitation_id);
CREATE INDEX IF NOT EXISTS idx_guests_template ON guests(greeting_template_id);
