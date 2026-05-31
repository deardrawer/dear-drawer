-- Add rsvp_notify column to notification settings
ALTER TABLE geunnal_notification_settings ADD COLUMN rsvp_notify INTEGER NOT NULL DEFAULT 0;
