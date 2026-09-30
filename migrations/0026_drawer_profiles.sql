-- 통합 내 서랍: 커플(user) 단위 서랍 프로필. 우표(타임머신) 타임라인을 청첩장이 아닌 커플 단위로 보관.
-- 최초 1회 커플의 가장 최근 결제 청첩장 우표/날짜/캡슐에서 시드(seeded=1). 이후 서랍에서 커플 단위로 편집.
-- 청첩장별 '우표 사진/한 조각' 설정(content.meta)은 공개 컬렉션·카카오 썸네일용으로 그대로 유지된다.
-- user_id FK는 걸지 않는다(rsvp_shares와 동일) — 소셜/게스트 계정이 users 테이블에 없을 수 있음.
CREATE TABLE IF NOT EXISTS drawer_profiles (
  user_id TEXT PRIMARY KEY,
  wedding_date TEXT,               -- 커플 우표 타임라인 기준 예식일(비면 청첩장에서 도출/시드)
  stamp_photo TEXT,                -- 결혼식 우표 사진(user-level)
  stamp_message TEXT,              -- 결혼식 한 조각(user-level)
  time_capsules TEXT,              -- 마일스톤 기록 JSON: {"d100":{"photo","message","createdAt"}, ...}
  capsule_years INTEGER DEFAULT 3, -- 연 단위 우표 개수 [3,30]
  seeded INTEGER DEFAULT 0,        -- 최초 시드 완료 여부
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
