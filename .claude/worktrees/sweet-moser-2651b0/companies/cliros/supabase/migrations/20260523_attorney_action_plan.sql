-- Attorney closing checklist persisted after persona defect review.
ALTER TABLE cliros.search_reports
  ADD COLUMN IF NOT EXISTS attorney_action_plan jsonb;

COMMENT ON COLUMN cliros.search_reports.attorney_action_plan IS
  'Deterministic curative checklist: vault refs, book-page, mailto/GSCCCA links for attorney workbench.';
