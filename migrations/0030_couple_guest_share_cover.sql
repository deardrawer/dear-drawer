-- 커플 하객 사진 공유: 공유 페이지 첫 화면 대표 사진(선택). 비우면 대표 청첩장 사진.
-- 실행: npx wrangler d1 execute dear-drawer-db --remote --file=./migrations/0030_couple_guest_share_cover.sql

ALTER TABLE drawer_profiles ADD COLUMN guest_share_cover TEXT;
