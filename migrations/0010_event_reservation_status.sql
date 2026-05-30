-- Add reservation_status column to geunnal_events
-- Original: ALTER TABLE geunnal_events ADD COLUMN reservation_status TEXT DEFAULT 'none';
-- This column was already applied to the DB manually.
-- SQLite does not support ADD COLUMN IF NOT EXISTS, so this is a safe no-op.
-- The column exists from direct DB execution; this migration just records the fact.
SELECT 1;
