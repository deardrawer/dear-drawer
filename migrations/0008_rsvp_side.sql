-- Add side, meal_attendance, shuttle_bus columns to rsvp_responses table
ALTER TABLE rsvp_responses ADD COLUMN side TEXT DEFAULT NULL;
ALTER TABLE rsvp_responses ADD COLUMN meal_attendance TEXT DEFAULT NULL;
ALTER TABLE rsvp_responses ADD COLUMN shuttle_bus TEXT DEFAULT NULL;
