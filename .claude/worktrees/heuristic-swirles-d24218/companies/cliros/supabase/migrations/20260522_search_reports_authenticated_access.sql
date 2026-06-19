-- Dashboard showed 0 reports: cliros.search_reports had RLS + service_role only (no authenticated GRANT/policy).
GRANT USAGE ON SCHEMA cliros TO authenticated;

GRANT SELECT, INSERT ON cliros.search_reports TO authenticated;
GRANT SELECT ON cliros.properties TO authenticated, anon;
GRANT SELECT ON cliros.report_documents TO authenticated;

DROP POLICY IF EXISTS "Users can view own reports" ON cliros.search_reports;
CREATE POLICY "Users can view own reports"
  ON cliros.search_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own reports" ON cliros.search_reports;
CREATE POLICY "Users can insert own reports"
  ON cliros.search_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
