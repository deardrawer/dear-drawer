-- 관리자가 직접 추가하는 공개 컬렉션 우표(실제 청첩장과 무관한 독립 우표).
-- getStampCollection에서 발행 청첩장 우표와 함께 합쳐 노출한다.
CREATE TABLE IF NOT EXISTS collection_stamps (
  id TEXT PRIMARY KEY,
  photo TEXT,               -- 우표 사진 URL (/api/r2/... 또는 /uploads/...)
  message TEXT,             -- 결혼식 한 조각
  wedding_date TEXT,        -- 표시용 날짜 (YYYY-MM-DD)
  hidden INTEGER DEFAULT 0, -- 1이면 공개 컬렉션에서 제외(데이터는 보존)
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_collection_stamps_date ON collection_stamps(wedding_date);
