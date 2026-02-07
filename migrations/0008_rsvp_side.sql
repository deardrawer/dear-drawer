-- Add side column to rsvp_responses table
-- Indicates whether the guest is from the groom's side or bride's side
ALTER TABLE rsvp_responses ADD COLUMN side TEXT DEFAULT NULL;
