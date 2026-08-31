-- P1 Mode 분리: 기존 공개 링크 수동 비공개(Mode 1) + 결혼 후 비밀번호 청첩장(Mode 2 = P3)
-- Mode 1: /i/[slug] 공개 링크의 수동 비공개 토글(owner, Day 1~30). 데이터 삭제 아님, 화면 노출만 제어.
ALTER TABLE invitations ADD COLUMN public_hidden INTEGER DEFAULT 0; -- 0=공개, 1=수동 비공개

-- Mode 2: 결혼 후 비밀번호 청첩장(/s/[shareSlug]). archive_slug와 별개의 공개용 식별자 share_slug 사용.
ALTER TABLE post_drawers ADD COLUMN share_enabled INTEGER DEFAULT 0;   -- 0=비공유, 1=비밀번호 공유 활성
ALTER TABLE post_drawers ADD COLUMN share_password_hash TEXT;          -- bcrypt 해시(비밀번호 변경 시 기존 인증 쿠키 자동 무효화의 기준값)
ALTER TABLE post_drawers ADD COLUMN share_slug TEXT;                   -- /s/[shareSlug] 공개용 식별자(공유 활성화 시 생성)

CREATE UNIQUE INDEX IF NOT EXISTS idx_post_drawers_share_slug ON post_drawers(share_slug);
