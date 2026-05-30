-- Migration: Add side_detail column to rsvp_responses
-- Purpose: 부모님 하객 구분 (신랑/신부 지인, 아버님 지인, 어머님 지인)

ALTER TABLE rsvp_responses
ADD COLUMN side_detail TEXT;
