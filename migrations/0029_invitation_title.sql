-- 내 청첩장 목록에 보이는 청첩장 이름 (사용자가 직접 바꿀 수 있음)
-- 비어 있으면 기존처럼 "신랑 & 신부" 이름을 보여준다
ALTER TABLE invitations ADD COLUMN title TEXT;
