-- 커플 하객 사진 공유: 사진을 받을 '대표 청첩장'을 명시 지정(선택).
-- 미지정이면 자동(Drive 폴더 매핑 있는 것 우선 → 예식일이 오늘과 가장 가까운 것)으로 폴백.
-- 실행: npx wrangler d1 execute dear-drawer-db --remote --file=./migrations/0028_couple_guest_share_invitation.sql

ALTER TABLE drawer_profiles ADD COLUMN guest_share_invitation_id TEXT;
