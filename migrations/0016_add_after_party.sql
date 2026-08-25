-- Add after_party column to rsvp_responses (애프터파티 참석 여부: 'yes' | 'no' | NULL)
-- SQLite does not support ADD COLUMN IF NOT EXISTS.
-- Apply manually to both remote(prod) and local D1 BEFORE deploying the code that writes this column:
--   wrangler d1 execute dear-drawer-db --remote --command "ALTER TABLE rsvp_responses ADD COLUMN after_party TEXT DEFAULT NULL;"
--   wrangler d1 execute dear-drawer-db --local  --command "ALTER TABLE rsvp_responses ADD COLUMN after_party TEXT DEFAULT NULL;"
ALTER TABLE rsvp_responses ADD COLUMN after_party TEXT DEFAULT NULL;
