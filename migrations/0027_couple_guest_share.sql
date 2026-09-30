-- 커플(user) 단위 하객 사진 공유: 서랍당 링크 하나. 청첩장별 공유(invitations.guest_share_*)와 별개.
-- 업로드는 커플의 대표(가장 최근 결제) 청첩장 폴더로 저장(기존 Queue/Drive 파이프라인 재사용).
ALTER TABLE drawer_profiles ADD COLUMN guest_share_slug TEXT;
ALTER TABLE drawer_profiles ADD COLUMN guest_share_enabled INTEGER DEFAULT 0;
ALTER TABLE drawer_profiles ADD COLUMN guest_share_title TEXT;
ALTER TABLE drawer_profiles ADD COLUMN guest_share_description TEXT;
