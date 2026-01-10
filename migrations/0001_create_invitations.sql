-- 청첩장 테이블
CREATE TABLE IF NOT EXISTS invitations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  template_id TEXT DEFAULT 'classic',

  -- 신랑신부 정보
  groom_name TEXT,
  bride_name TEXT,

  -- 결혼식 정보
  wedding_date TEXT,
  wedding_time TEXT,
  venue_name TEXT,
  venue_address TEXT,
  venue_detail TEXT,
  venue_map_url TEXT,

  -- 이미지
  main_image TEXT,
  gallery_images TEXT DEFAULT '[]',

  -- 인사말
  greeting_message TEXT,

  -- 추가 정보
  contact_groom TEXT,
  contact_bride TEXT,
  account_info TEXT DEFAULT '[]',

  -- 상태
  is_paid INTEGER DEFAULT 0,
  is_published INTEGER DEFAULT 0,
  slug TEXT UNIQUE,

  -- 타임스탬프
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_invitations_user_id ON invitations(user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_slug ON invitations(slug);

-- 페이지 조회수 테이블
CREATE TABLE IF NOT EXISTS page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invitation_id TEXT NOT NULL,
  visitor_ip TEXT,
  user_agent TEXT,
  viewed_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (invitation_id) REFERENCES invitations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_page_views_invitation_id ON page_views(invitation_id);
