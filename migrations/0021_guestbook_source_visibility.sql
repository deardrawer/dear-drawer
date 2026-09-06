-- Guest Share 메시지 = 기존 guestbook_messages 재사용(C2).
-- source(출처)와 is_public(공개여부)을 분리. 기존 행은 NULL 유지 → 공개로 폴백.
-- guest_upload_sessions에는 guestbook_message_id 링크만 추가. Worker/Queue/R2/Drive 무관.
-- create-only. DEFAULT 없이 추가(백필 없음). 공개 쿼리는 반드시 (is_public IS NULL OR is_public = 1)로 폴백.

ALTER TABLE guestbook_messages ADD COLUMN source TEXT;        -- NULL/'guestbook'=기존, 'photo_share'=사진공유
ALTER TABLE guestbook_messages ADD COLUMN is_public INTEGER;  -- NULL=공개(기존 유지), 1=공개, 0=비공개
ALTER TABLE guest_upload_sessions ADD COLUMN guestbook_message_id TEXT;  -- 메시지 있는 세션만 연결(NULL 허용)
