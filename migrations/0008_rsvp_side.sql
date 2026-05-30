-- Add side, meal_attendance, shuttle_bus columns to rsvp_responses table
-- Original:
--   ALTER TABLE rsvp_responses ADD COLUMN side TEXT DEFAULT NULL;
--   ALTER TABLE rsvp_responses ADD COLUMN meal_attendance TEXT DEFAULT NULL;
--   ALTER TABLE rsvp_responses ADD COLUMN shuttle_bus TEXT DEFAULT NULL;
-- These columns were already applied to the DB manually.
-- SQLite does not support ADD COLUMN IF NOT EXISTS, so this is a safe no-op.
SELECT 1;
