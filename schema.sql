-- AI 생성 텍스트 저장 테이블
CREATE TABLE IF NOT EXISTS ai_generated_texts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,

  -- 원본 입력값 (JSON)
  form_data TEXT NOT NULL,

  -- 생성된 텍스트들
  greeting TEXT,
  thanks TEXT,
  groom_profile TEXT,
  bride_profile TEXT,
  story_first TEXT,
  story_together TEXT,
  story_preparation TEXT,
  interview TEXT, -- JSON array

  -- 메타 정보
  greeting_version TEXT, -- 'short' or 'rich'
  profile_version TEXT,
  story_version TEXT,
  interview_version TEXT,
  tone TEXT,

  -- 재생성 히스토리
  regen_counts TEXT, -- JSON object

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_id ON ai_generated_texts(user_id);
CREATE INDEX IF NOT EXISTS idx_created_at ON ai_generated_texts(created_at);

-- 사용자별 최근 생성 조회용 뷰
CREATE VIEW IF NOT EXISTS recent_generations AS
SELECT
  id,
  user_id,
  created_at,
  updated_at,
  greeting,
  tone
FROM ai_generated_texts
ORDER BY created_at DESC;
