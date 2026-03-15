-- Add reservation_status column to geunnal_events
-- Values: 'none' (default), 'reserved', 'unavailable'
ALTER TABLE geunnal_events ADD COLUMN reservation_status TEXT DEFAULT 'none';
