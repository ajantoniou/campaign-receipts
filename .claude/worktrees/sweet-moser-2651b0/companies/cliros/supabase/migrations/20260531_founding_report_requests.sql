-- "Do-it-for-them" founding offer queue: Caroline captures firm email + address;
-- we validate (Google), run ONE report free, and the report lives in the
-- attorney's dashboard (we email a "ready, sign in" notice). Capped at 10 runs.
CREATE TABLE IF NOT EXISTS cliros.founding_report_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid REFERENCES cliros.prospects(id) ON DELETE SET NULL,
  firm_email text NOT NULL,
  raw_address text NOT NULL,
  validated_address text, google_place_id text, formatted_address text,
  report_id uuid REFERENCES cliros.search_reports(id) ON DELETE SET NULL,
  user_id uuid REFERENCES cliros.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'received'
    CHECK (status IN ('received','address_invalid','address_valid','running','ready','qc_held','failed','emailed','capped')),
  status_detail text, ai_spend_cents int NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'caroline_call',
  created_at timestamptz NOT NULL DEFAULT now(),
  validated_at timestamptz, ran_at timestamptz, emailed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS frr_status_idx ON cliros.founding_report_requests (status, created_at);
CREATE INDEX IF NOT EXISTS frr_firm_email_idx ON cliros.founding_report_requests (lower(firm_email));
CREATE UNIQUE INDEX IF NOT EXISTS frr_dedup_idx
  ON cliros.founding_report_requests (lower(firm_email), lower(raw_address))
  WHERE status NOT IN ('failed','address_invalid');
GRANT SELECT, INSERT, UPDATE ON cliros.founding_report_requests TO service_role;
