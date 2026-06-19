-- ─── RLS on cliros.report_documents ───
-- Vault rows currently have no row-level policy. Add owner-keyed access via
-- the report → user_id join so an authenticated user can only see vault
-- entries (deed snapshots, federal-court pulls, generated PDFs) for THEIR
-- reports. Service role retains full access (used by the pipeline cron and
-- the signed-URL download routes). No INSERT/UPDATE/DELETE policies for
-- authenticated — those operations are always performed via the API with
-- the service-role key. See HANDOFF_2026-05-21.md launch-blocker list.

ALTER TABLE cliros.report_documents ENABLE ROW LEVEL SECURITY;

-- GRANTs (per portfolio rule — every migration must restate them so a
-- fresh schema rebuild lands in the same state).
GRANT USAGE ON SCHEMA cliros TO authenticated;
GRANT SELECT ON cliros.report_documents TO authenticated;

-- Prod already has a policy named `users_see_own_report_docs` with the
-- correct expression (verified 2026-05-23). This migration restates it so
-- a fresh schema rebuild ends up in the same state. Idempotent: drops the
-- existing policy by either of the two historical names before recreating.
DROP POLICY IF EXISTS "users_see_own_report_docs" ON cliros.report_documents;
DROP POLICY IF EXISTS "Users can view own report documents" ON cliros.report_documents;
CREATE POLICY "users_see_own_report_docs"
  ON cliros.report_documents FOR SELECT
  TO authenticated
  USING (
    report_id IN (
      SELECT id FROM cliros.search_reports WHERE user_id = auth.uid()
    )
  );

-- Service role bypasses RLS by default (Supabase grants BYPASSRLS), so the
-- pipeline cron, founder scripts, and signed-URL routes that use the
-- service key are unaffected by the policy above.
