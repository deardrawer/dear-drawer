-- Guest Share B2: R2 → Google Drive 이전(resumable) 상태 컬럼.
-- create-only. 기존 0018을 수정하지 않고 컬럼만 추가한다.
-- 핵심 업로드 status와 cleanup 상태를 섞지 않기 위해 r2_deleted_at은 별도 컬럼.

-- resumable 세션 URI (민감: 로그 전체 출력 금지, 에러 로그에서 마스킹)
ALTER TABLE guest_upload_files ADD COLUMN google_upload_uri TEXT;

-- Google 308 Range 응답으로 확정된 전송 바이트 오프셋
ALTER TABLE guest_upload_files ADD COLUMN google_upload_offset INTEGER DEFAULT 0;

-- resumable 세션 만료 추정 시각 (ISO). 만료 시 새 세션 생성.
ALTER TABLE guest_upload_files ADD COLUMN google_upload_expires_at TEXT;

-- R2 cleanup 상태 (completed 후 24h 유예 → B2.5 cleanup Worker가 삭제 후 기록). status와 분리.
ALTER TABLE guest_upload_files ADD COLUMN r2_deleted_at TEXT;
