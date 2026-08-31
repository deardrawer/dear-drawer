-- Guest Share: 하객 메시지(두 사람에게 한마디). 세션 단위 저장.
-- create-only. 기존 행은 NULL 유지(백필 없음). 최대 200자는 앱 레이어에서 clamp.
-- Google Drive 전송 파이프라인(R2/Queue/Worker/resumable)과 무관 — 표시/보관용 컬럼.

ALTER TABLE guest_upload_sessions ADD COLUMN message TEXT;
