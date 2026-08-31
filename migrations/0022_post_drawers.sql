-- POST DRAWER: 청첩장 1:1 아카이브 메타. invitation 데이터(이름/날짜/카카오썸네일)는 중복 저장하지 않고
-- 필요할 때 invitations에서 읽는다. 행은 archive_slug/공유/한조각이 필요할 때만 lazy 생성(백필 없음).
-- Worker/Queue/R2/Drive/기존 청첩장/방명록과 무관.

-- P2 범위: 우표/아카이브 메타만. sharing_enabled/share_password_hash는 P3(외부 공유)에서 별도 migration으로 추가.
CREATE TABLE IF NOT EXISTS post_drawers (
  invitation_id TEXT PRIMARY KEY REFERENCES invitations(id) ON DELETE CASCADE,
  archive_slug TEXT UNIQUE,        -- 추측 불가 랜덤(공개 slug와 분리). 개인 POST DRAWER URL용. lazy 생성
  stamp_display_name TEXT,         -- 우표 표시명 override(선택) → 없으면 invitation 신랑·신부 이름
  stamp_message TEXT,              -- 결혼식 한 조각(선택)
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_post_drawers_archive_slug ON post_drawers(archive_slug);
