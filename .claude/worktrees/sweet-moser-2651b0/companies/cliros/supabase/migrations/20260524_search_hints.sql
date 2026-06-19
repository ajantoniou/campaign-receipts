-- ─── Optional search hints from the attorney ───
-- At $200/report the attorney will gladly spend 30s on optional inputs IF
-- they sharpen the result. This column holds whatever they offered:
--   { priorOwnerName?, saleDate?, loanAmount?, closingDate?,
--     listingUrl?, knownLenders? }
-- Search-orchestrator.ts reads it to bias PT-61 + name search; the AOL
-- draft pulls loanAmount + closingDate so the persona doesn't have to
-- placeholder them.

ALTER TABLE cliros.search_reports
  ADD COLUMN IF NOT EXISTS search_hints jsonb;

COMMENT ON COLUMN cliros.search_reports.search_hints IS
  'Optional attorney-supplied hints captured at search time: prior owner surname, recent sale date, loan amount, closing date, listing URL, known lender names. Used by the orchestrator to bias GSCCCA name search and narrow the search window.';

-- GRANTs (per portfolio rule — every migration restates them)
GRANT USAGE ON SCHEMA cliros TO authenticated;
GRANT SELECT, INSERT, UPDATE ON cliros.search_reports TO authenticated;
