-- ─── Track when a post-report feedback nudge was sent ───
-- Cron job stamps this when it has emailed the user asking for feedback
-- on a specific report. Prevents re-nudging on every tick.

ALTER TABLE cliros.search_reports
  ADD COLUMN IF NOT EXISTS feedback_email_sent_at timestamptz;

COMMENT ON COLUMN cliros.search_reports.feedback_email_sent_at IS
  'Stamped by scripts/notify_feedback_request.ts when we emailed the user asking for feedback on this report. NULL = no nudge sent yet.';

-- GRANTs (per portfolio rule)
GRANT USAGE ON SCHEMA cliros TO authenticated;
GRANT SELECT, UPDATE ON cliros.search_reports TO authenticated;
