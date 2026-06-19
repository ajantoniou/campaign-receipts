# Cliros Claude Code Handoff — 2026-05-28

## Current production state

- App: `https://cliros.ai`, Render service `cliros`.
- Production now uses a dedicated Supabase project:
  - Name: `cliros`
  - Ref: `nksdhvhzsmeidbeafern`
  - URL: `https://nksdhvhzsmeidbeafern.supabase.co`
  - Region: `us-east-2`
- Old shared Supabase project remains intact for rollback.
- Render env has been repointed to the new Supabase URL, anon key, service key, project id, and database URL.
- Local `companies/cliros/app/.env.local` was updated to the new Supabase project.
- Root `.env` still contains shared/generic Supabase values for the old `agentcompanies` project; do not blindly source root `.env` for Cliros work unless app `.env.local` overrides are loaded.

## Shipped code

- `9dbc0f9a3 Fix Cliros password recovery flow`
  - Added real `/reset-password` page.
  - Fixed Supabase recovery token handling.
  - Fixed callback handling for code/token recovery.
  - Raised reset-email rate limit on the old project while it was still live.
- Dedicated Supabase project migration
  - Created new project `cliros`.
  - Configured Auth site URL and redirects for `cliros.ai`.
  - Enabled Supabase Auth SMTP through Resend.
  - Migrated founder Auth user.
  - Migrated full `cliros` schema/data.
  - Migrated storage objects:
    - `report-documents`: 28 objects
    - `cliros-marketing`: 1 object
  - Exposed `cliros` in PostgREST/Data API config and granted Supabase roles.
  - Verified production login uses only the new Supabase host.
- `e8fa4455f Clarify blocked report labels`
  - Fixed dashboard/report-list labels so raw noisy lien-index rows no longer display as huge curative counts.
  - Blocked/no-bill reports now show `No charge`, not `Pending`.

## Verified after migration

- Render deploy reached `live`.
- Live browser login reaches `/dashboard`.
- Browser network calls only `nksdhvhzsmeidbeafern.supabase.co`, not the old Supabase project.
- Founder profile row present:
  - `reports_remaining`: 1
  - `free_reports_total`: 365
  - `free_reports_used`: 19
- Live private report PDF download works:
  - `Title_Search_Report.pdf`
  - Report `c53fc39b-ab26-49f6-b501-58c63ecdf40c`
  - Size verified around 622 KB.
- Password reset email sent successfully from the new Supabase project.
- Dashboard labels live-verified:
  - `1394 Peachtree Battle...` -> `3 curative / No charge`
  - `1396 Peachtree Street...` -> `Needs review / No charge`
  - `100 Peachtree St...` -> `Needs review / No charge`
  - `3425 Cascade...` -> `Needs review / No charge`
  - `1045 Rebel Forest...` -> `7 curative / No charge`
  - `100 Main St, Alma...` -> `1 curative / No charge`

## What the dashboard issue meant

- The screenshot showing `260 curative`, `286 curative`, and `518 curative` was misleading.
- Those were raw GSCCCA lien-index row matches before attorney-action clustering.
- They were not 260/286/518 legal curative tasks.
- The affected reports have:
  - `pipeline_stage = blocked`
  - `billed = false`
  - `refund_reason = MAX_ATTEMPTS` or `PANEL_KILL`
- Customer-facing implication: these are no-charge blocked reports that need review/rerun, not pending deliverables.

## Recent outbound / first-trial state

- Resend webhook is registered and live:
  - URL: `https://cliros.ai/api/resend/webhook`
  - Events intended: delivered/opened/clicked/bounced/complained
  - Unsigned webhook test returned 401 as expected.
- Strict tracked cold batch of 3 was sent:
  - Meyer Closings
  - Kevin Salisbury
  - Ted Smith ATL
- CTA strategy was changed to concierge-style:
  - No codes.
  - Prospect replies with the email they want to use and one Georgia property.
  - We create/fill their account and add 10 free title-closing dossiers.
- `grant_founding_attorney.ts` grants 10 dossiers, not 20.
- Signup no longer requires beta codes.

## Pending business items

- Get first trial/sale:
  - Monitor Resend opens/clicks/replies.
  - If a firm replies, create account, fill firm info, grant 10 dossiers, generate one property package, and follow up manually.
  - Do not overbuild self-serve codes right now.
- Continue prospecting:
  - Scrape more Georgia closing/title firms.
  - Keep strict ICP if quality is enough; otherwise relax only enough to send a small batch of 10.
- Product proof:
  - Need a truly clean, delivered sample report/dossier that does not land in blocked/no-charge.
  - Current visible founder reports are mostly blocked/no-charge demos, useful for QA but not ideal for sales confidence.
- Dashboard/account polish:
  - Firm letterhead onboarding banner is live.
  - Settings page exists; attorneys still need a clear path to upload logo/address before first real dossier.
- Follow-up workflow:
  - Revisit the phone-follow tier only after tracking shows repeated opens/clicks.

## Pending technical items

- Cliros-specific env hygiene:
  - Long term: app should use `CLIROS_SUPABASE_URL`, `CLIROS_SUPABASE_ANON_KEY`, `CLIROS_SUPABASE_SERVICE_ROLE_KEY`.
  - Current code still uses generic `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
  - Render service-specific env is correct; root `.env` is still shared.
- Supabase project cleanup:
  - Keep old project as rollback until new project is stable.
  - Later, remove Cliros dependency from old shared project only after another production cycle.
- Data semantics:
  - `search_reports.status` still says `pending` for old blocked rows.
  - UI now correctly keys off `pipeline_stage` and `billed`, but a database cleanup migration could normalize old statuses later.
- Report pipeline:
  - The high-noise reports need a real pipeline fix, not just UI labeling.
  - Root pattern: GSCCCA lien overmatch / no coherent deed chain / panel kill.
  - Need rerun/fix path that produces `pipeline_stage=ready` for at least one sales-quality Georgia address.

## Important caution

- Do not treat huge raw lien counts as curative counts.
- Do not show blocked/no-charge reports as pending.
- Do not repoint or modify shared root Supabase env without checking other AgentCompanies products.
- Do not delete old Supabase Cliros data yet; it is rollback safety.
