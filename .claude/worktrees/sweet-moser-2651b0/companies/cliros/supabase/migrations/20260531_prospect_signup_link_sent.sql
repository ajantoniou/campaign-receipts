-- Idempotency stamp for Caroline's post-call follow-up.
ALTER TABLE cliros.prospects ADD COLUMN IF NOT EXISTS signup_link_sent_at timestamptz;
CREATE INDEX IF NOT EXISTS prospects_signup_link_sent_idx
  ON cliros.prospects (signup_link_sent_at) WHERE signup_link_sent_at IS NOT NULL;
