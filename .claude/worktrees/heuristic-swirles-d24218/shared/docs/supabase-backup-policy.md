# Supabase Backup Policy
_Tracks CON-92 (TASK-094): shared Supabase backup policy one-pager for the AgentCompanies portfolio._

## Purpose

- Explain how we keep every Supabase schema (Concise, CarStack, NT Ministry, Campaign Receipts, HealthBrew, Portfolio HQ, etc.) recoverable even when the managed service hiccups or we ship a schema change that needs a rollback.
- Give operators a single reference for the cadence, storage, and restore steps so we do not invent new backup practices per company.

## Scope

- Applies to the shared Supabase project that hosts the `concise`, `carstack`, `nt_ministry`, and other per-company schemas plus any Supabase Storage buckets we control (PDFs, backups, exports).
- Covers automated backups Supabase already takes, the manual exports we run, the retention targets, and the recovery checklist used by every CTO/engineer in the portfolio.

## Policy

### 1. Supabase-managed baseline

- Supabase automatically snapshots each database once per day (typically shortly after 03:00 UTC) and retains those snapshots for the plan’s default window (7 days on free/pro, up to 30 days with upgrades). This automatic snapshot + WAL log retention is our baseline guarantee; we do not disable it.
- Each week (or on the day of a release), the on-duty CTO goes to the Supabase Console → Database → Backups, confirms the latest entry includes the expected schema, and notes the timestamp in `SESSION_DECISIONS.md` (or the next briefing) so we have a dated trail. If the console shows “No backups” or the entry is older than 36 hours, raise an issue under `issues-backlog.md` and follow up with Supabase support (via the dashboard chat) before shipping more work.
- If we ever move to a paid tier that offers longer PITR (point-in-time recovery), document the new retention window here and adjust the manual coverage requirement accordingly.

### 2. Manual exports for extended retention

- We generate an additional manual dump before any schema migration, major import/export, or release that touches data. At minimum, run this export once per week so we maintain 30+ days of coverage even though Supabase retains only 7 days automatically.
  - Command template (run from the repo root with `.env` variables already loaded):

  ```
  NAME="agentcompanies-supabase-$(date +%Y%m%d-%H%M)"
  SUPABASE_URL=$SUPABASE_URL \
    SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
    supabase db dump \
    --file "/tmp/$NAME.sql"
  gzip "/tmp/$NAME.sql"
  supabase storage upload backups "/tmp/$NAME.sql.gz" "<project>/$NAME.sql.gz"
  ```
  - Alternately use `python infrastructure/scripts/manual_supabase_dump.py --project <schema>` to run the dump, gzip, and upload pipeline in one step while logging the destination path and optionally keeping the compressed file for inspection.

- Store the compressed dump in the `backups/<project>/` folder of our Supabase Storage bucket (same project we use for book PDFs). Keep the files private; only the service role key and Render instance should be able to read or delete them.
- Maintain at least 30 manual dumps per schema (30 days if we run weekly exports). Delete the oldest file once the count exceeds 30 so storage costs stay predictable.
- Document each manual export in `SESSION_DECISIONS.md` or a shared `briefing` note with the filename, date, and trigger (e.g., “pre-deployment export for schema migration”). That way someone can quickly see our manual coverage without sifting through storage UI.

### 3. Recovery playbook

1. Prefer Supabase Console restores when recovering from an recent automated snapshot: go to Database → Backups, choose the desired timestamp, and follow the “Restore to a new branch” flow. Confirm the restore job finishes before routing traffic back.
2. When we rely on a manual dump (e.g., to seed a staging replica), download and decompress the `.sql.gz` file, then run:
   ```
   psql $SUPABASE_URL -f export.sql
   ```
   Optionally re-seed any lookup tables after the import if the dump is several weeks old.
3. Always validate the restored dataset by running the smoke tests that touched the failing area (e.g., `/api/health`, the `email_subscribers` insert path, or the `orders` read path) before declaring the restore done.
4. After the restore, document what snapshot/dump was used, who approved it, and any follow-up manual migrations in `SESSION_DECISIONS.md`.

### 4. Monitoring, alerts, and reviews

- Weekly: the CTO on duty reviews the backups list, manual exports log, and the storage folder to confirm the count ≥30. Mark “backup check” as done in the next briefing and call out any anomalies.
- Quarterly: revisit this policy (update this file if cadence, storage, or tooling changes). If we extend Supabase’s retention, note the new window here plus the consequence for manual exports.
- If Supabase automation stops working (e.g., snapshots fail, PITR logs show errors), escalate immediately by filing an issue tagged `infra` and mention Supabase support ticket IDs. Continue running manual dumps until automation is healthy again.

## Roles & Responsibilities

- **CTOs (Concise + shared projects):** Run manual exports, verify Supabase backups weekly, update `SESSION_DECISIONS.md`, and lead restore drills when needed. Keep the `backups/<project>/` folder tidy.
- **Chief of Staff or Acting CEO:** Ensure this policy is referenced in onboarding docs and that new engineers know where the manual backups live. Push for evidence (timestamps, filenames) in quarterly reviews.
- **Paperclip Feedback / Platform monitors:** Spot check the policy’s presence in `shared/docs/` and question it if we drift (e.g., weekly exports stop happening).

## References

- `BIBLE.md` §3.13 explains shared infra cost discipline (Supabase Pro capped at $10/mo).  
- `SESSION_DECISIONS.md` chronologies backup checks and any restore events.  
- `infrastructure/paperclip/doc/RELEASE-AUTOMATION-SETUP.md` for release gates that trigger manual exports.  
- This policy is the evidence artifact for CON-92 (TASK-094); point future reviewers here when verifying backup hygiene.
