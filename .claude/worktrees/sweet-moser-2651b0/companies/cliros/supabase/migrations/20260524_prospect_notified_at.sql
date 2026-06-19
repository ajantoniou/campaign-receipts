-- ─── Track when a prospect signup notification was sent ───
-- The notify_prospect_signups cron job stamps this column when it has
-- emailed Alex about a new signup. Prevents re-notifying every tick.
-- Idempotent: NULL → "we haven't emailed yet"; non-NULL → "already
-- emailed at this timestamp, skip."

ALTER TABLE cliros.prospects
  ADD COLUMN IF NOT EXISTS signup_notified_at timestamptz;

COMMENT ON COLUMN cliros.prospects.signup_notified_at IS
  'Stamped by scripts/notify_prospect_signups.ts when a user with this prospect''s email signs up at cliros.ai and we email Alex about it. NULL = no signup yet (or signup but Alex not notified yet).';

-- GRANTs (per portfolio rule — every migration restates them)
GRANT USAGE ON SCHEMA cliros TO authenticated;
GRANT SELECT, UPDATE ON cliros.prospects TO authenticated;
