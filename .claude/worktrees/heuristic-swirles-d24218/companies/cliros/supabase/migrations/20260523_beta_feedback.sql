-- Beta feedback widget: one row per "How was this report?" submission.
-- Wired into POST /api/reports/[id]/feedback. Sends an email to alex@cliros.ai
-- (forwards to antonioualfred-cliros@gmail.com) via Resend at insert time;
-- column email_sent_at records that side-effect for idempotency / audit.

-- Attribution: every beta cold-email contains ?ref=BETA-{first_name} so we can
-- track which lead converted. Captured on signup.
ALTER TABLE cliros.users
  ADD COLUMN IF NOT EXISTS signup_ref text;

CREATE TABLE IF NOT EXISTS cliros.beta_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES cliros.search_reports(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rating text CHECK (rating IN ('up','down','neutral')),
  comment text,
  user_agent text,
  email_sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS beta_feedback_report_idx
  ON cliros.beta_feedback (report_id, created_at DESC);
CREATE INDEX IF NOT EXISTS beta_feedback_user_idx
  ON cliros.beta_feedback (user_id, created_at DESC);

GRANT INSERT, SELECT ON cliros.beta_feedback TO authenticated;

ALTER TABLE cliros.beta_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users insert own feedback" ON cliros.beta_feedback;
CREATE POLICY "Users insert own feedback"
  ON cliros.beta_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users see own feedback" ON cliros.beta_feedback;
CREATE POLICY "Users see own feedback"
  ON cliros.beta_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
