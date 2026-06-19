-- Draft revision history + atomic snapshot-then-apply for attorney-in-the-loop
-- document editing. Before any edit overwrites aol_draft / client_report_draft,
-- the CURRENT value is snapshotted here so the attorney can always revert.
-- Applied to the live Cliros project 2026-05-31 and smoke-tested (non-owner
-- rejected, prior captured, revert restores). Idempotent CREATE ... IF NOT EXISTS
-- / CREATE OR REPLACE, so re-running is safe.

CREATE TABLE IF NOT EXISTS cliros.draft_revisions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id    uuid NOT NULL REFERENCES cliros.search_reports(id) ON DELETE CASCADE,
  field        text NOT NULL CHECK (field IN ('aol_draft', 'client_report_draft')),
  -- The value BEFORE the edit that created this revision (the restore point).
  prior_text   text,
  -- How the change was made + a short attorney-facing note.
  source       text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'assistant_apply', 'revert')),
  note         text,
  created_by   uuid,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS draft_revisions_report_field_idx
  ON cliros.draft_revisions (report_id, field, created_at DESC);

-- Atomic: snapshot the current field value, then write the new one. Ownership
-- enforced via p_user. Returns the revision id + whether a row was written.
CREATE OR REPLACE FUNCTION cliros.snapshot_and_apply_draft(
  p_report   uuid,
  p_user     uuid,
  p_field    text,
  p_new_text text,
  p_source   text DEFAULT 'assistant_apply',
  p_note     text DEFAULT NULL
)
RETURNS TABLE (revision_id uuid, applied boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = cliros, public
AS $$
DECLARE
  v_prior text;
  v_owner uuid;
  v_rev   uuid;
BEGIN
  IF p_field NOT IN ('aol_draft', 'client_report_draft') THEN
    RAISE EXCEPTION 'invalid draft field: %', p_field;
  END IF;

  EXECUTE format('SELECT user_id, %I FROM cliros.search_reports WHERE id = $1 FOR UPDATE', p_field)
    INTO v_owner, v_prior
    USING p_report;

  IF v_owner IS NULL OR v_owner <> p_user THEN
    RETURN QUERY SELECT NULL::uuid, false;
    RETURN;
  END IF;

  INSERT INTO cliros.draft_revisions (report_id, field, prior_text, source, note, created_by)
  VALUES (p_report, p_field, v_prior, p_source, p_note, p_user)
  RETURNING id INTO v_rev;

  EXECUTE format('UPDATE cliros.search_reports SET %I = $1 WHERE id = $2', p_field)
    USING p_new_text, p_report;

  RETURN QUERY SELECT v_rev, true;
END;
$$;

GRANT SELECT, INSERT ON cliros.draft_revisions TO service_role;
GRANT EXECUTE ON FUNCTION cliros.snapshot_and_apply_draft(uuid, uuid, text, text, text, text) TO service_role;
