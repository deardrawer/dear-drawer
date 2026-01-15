-- 결제 요청 테이블
CREATE TABLE IF NOT EXISTS payment_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  invitation_id TEXT,
  order_number TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- invitations 테이블에 imweb_order_no 컬럼 추가
-- ALTER TABLE invitations ADD COLUMN imweb_order_no TEXT;
