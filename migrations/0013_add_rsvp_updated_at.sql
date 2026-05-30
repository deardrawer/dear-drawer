-- Add updated_at column to rsvp_responses for admin edit tracking
ALTER TABLE rsvp_responses ADD COLUMN updated_at TEXT;
