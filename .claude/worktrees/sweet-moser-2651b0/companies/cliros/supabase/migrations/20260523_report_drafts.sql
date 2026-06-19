-- Editable draft text before PDF render (open-source editing workflow).
ALTER TABLE cliros.search_reports
  ADD COLUMN IF NOT EXISTS client_report_draft text;

COMMENT ON COLUMN cliros.search_reports.client_report_draft IS
  'Optional attorney-edited plain text for client report body; rendered before auto sections when set.';

COMMENT ON COLUMN cliros.search_reports.aol_draft IS
  'Persona + attorney-edited AOL text; finalized with signature + SOURCE SCHEDULE at PDF render.';
