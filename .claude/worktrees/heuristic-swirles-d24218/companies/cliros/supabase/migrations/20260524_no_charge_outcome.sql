-- ─── "No charge" outcome for unverifiable reports ───
-- When the pipeline blocks (parcel not found, panel kill, max-attempts retry
-- exhaustion), we waive the credit instead of consuming the user's package
-- balance. Tracks billed state on the report and keeps an idempotent audit
-- row per refund so retries don't double-credit.

-- 1. search_reports — billing state
ALTER TABLE cliros.search_reports
  ADD COLUMN IF NOT EXISTS billed boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS refund_reason text;

COMMENT ON COLUMN cliros.search_reports.billed IS
  'False when the report ended in an unverifiable state and the user credit was waived. Set by refundReport() in src/lib/billing/refund.ts.';

COMMENT ON COLUMN cliros.search_reports.refund_reason IS
  'Short slug describing why the report was un-billed: PARCEL_NOT_FOUND, PANEL_KILL, MAX_ATTEMPTS, BILLING_FAILED.';

-- 2. report_refunds — audit + idempotency
CREATE TABLE IF NOT EXISTS cliros.report_refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES cliros.search_reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  refunded_at timestamptz NOT NULL DEFAULT now(),
  reason text NOT NULL,
  credit_kind text NOT NULL,            -- 'package' | 'metered' | 'free_trial' | 'beta_mode' | 'none'
  package_id uuid,                       -- which report_packages row, if any
  ls_usage_record_id text,               -- which LS usage record was decremented, if metered
  notes text,
  CONSTRAINT report_refunds_unique_per_report UNIQUE (report_id)
);

COMMENT ON TABLE cliros.report_refunds IS
  'One row per report that had its credit waived. UNIQUE(report_id) gives idempotency — a re-run that fails again is a no-op refund.';

CREATE INDEX IF NOT EXISTS report_refunds_user_idx ON cliros.report_refunds(user_id, refunded_at DESC);

-- 3. GRANTs (per portfolio rule — every migration restates them)
GRANT USAGE ON SCHEMA cliros TO authenticated;
GRANT SELECT ON cliros.report_refunds TO authenticated;

-- 4. RLS — users see their own refund audit rows
ALTER TABLE cliros.report_refunds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_see_own_refunds" ON cliros.report_refunds;
CREATE POLICY "users_see_own_refunds"
  ON cliros.report_refunds FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 5. Backfill: existing blocked reports get billed=false retroactively only
--    when the block was for a known unverifiable cause (PARCEL_NOT_FOUND or
--    panel kill). Don't touch billed=true on rows that completed normally.
UPDATE cliros.search_reports
SET billed = false,
    refund_reason = CASE
      WHEN last_error ILIKE '%Parcel not found%' OR last_error = 'PARCEL_NOT_FOUND' THEN 'PARCEL_NOT_FOUND'
      WHEN last_error ILIKE 'Panel verdict: kill%' THEN 'PANEL_KILL'
      ELSE 'MAX_ATTEMPTS'
    END
WHERE pipeline_stage = 'blocked'
  AND billed = true;
