-- 게스트 테이블에 intro_greeting 컬럼 추가
-- 봉투/인트로 화면에서 표시할 첫 문장 (예: "소중한 분께", "○○님께", "초대합니다")

ALTER TABLE guests ADD COLUMN intro_greeting TEXT;
