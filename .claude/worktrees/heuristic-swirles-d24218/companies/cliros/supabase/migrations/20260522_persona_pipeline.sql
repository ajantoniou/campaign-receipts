-- Multi-pass persona pipeline (YouTube-style step_qc gates).
--   chain_analysis  → lien_analysis → defect_review → aol_lock → drafting
-- Each persona pass writes one row in cliros.persona_passes with its artifact
-- and the step_qc verdict. pipeline_stage is text (not enum), so the new
-- stage names work without DDL — see run_pipeline_tick.ts.

-- Allow the new stage names in the pipeline_stage check constraint.
ALTER TABLE cliros.search_reports
  DROP CONSTRAINT IF EXISTS search_reports_pipeline_stage_check;
ALTER TABLE cliros.search_reports
  ADD CONSTRAINT search_reports_pipeline_stage_check
    CHECK (pipeline_stage = ANY (ARRAY[
      'queued','searching','permits','panel_review',
      'chain_analysis','lien_analysis','defect_review','aol_lock',
      'drafting','ready','delivered','blocked'
    ]));

ALTER TABLE cliros.properties
  ADD COLUMN IF NOT EXISTS imagery jsonb;

-- Tom Calloway's AOL draft lives here so the PDF stage can wrap it in firm
-- letterhead without re-running the persona.
ALTER TABLE cliros.search_reports
  ADD COLUMN IF NOT EXISTS aol_draft text;

-- Track cumulative AI spend per report for the hard-cap check.
ALTER TABLE cliros.search_reports
  ADD COLUMN IF NOT EXISTS ai_spend_cents int NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS cliros.persona_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES cliros.search_reports(id) ON DELETE CASCADE,
  stage text NOT NULL,
  attempt int NOT NULL DEFAULT 1,
  artifact jsonb NOT NULL,
  step_qc jsonb NOT NULL,
  cost_cents_total int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (report_id, stage, attempt)
);

CREATE INDEX IF NOT EXISTS persona_passes_report_idx
  ON cliros.persona_passes (report_id, created_at DESC);

GRANT SELECT ON cliros.persona_passes TO authenticated;

-- RLS: only the report's owner can read its persona passes.
ALTER TABLE cliros.persona_passes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own persona passes" ON cliros.persona_passes;
CREATE POLICY "Users see own persona passes"
  ON cliros.persona_passes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cliros.search_reports r
      WHERE r.id = persona_passes.report_id AND r.user_id = auth.uid()
    )
  );
