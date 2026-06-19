# Delivery failure panel — dashboard invisible reports (2026-05-22)

**Incident:** Founder `alex@antoniou.net` saw **0 reports** on cliros.ai, **Report not found** on `87648f5f-c691-4198-8b4a-fe5f6859ae74`, billing **BALANCE 1** but **TOTAL REPORTS 0**. Pipeline scripts reported `ready` + 3 PDFs in vault.

**Root cause (confirmed):** `cliros.search_reports` had **RLS enabled** with only `Service role full access` policy. No `GRANT SELECT` and no `authenticated` SELECT policy. Browser dashboard uses **anon key + user JWT** → every query returned empty / permission denied. Service-role scripts lied: data existed, UI could not read it.

**Fix applied (live Supabase migration `cliros_search_reports_authenticated_access`):**

- `GRANT SELECT, INSERT ON cliros.search_reports TO authenticated`
- `GRANT SELECT ON cliros.properties`, `report_documents`
- Policies: `Users can view own reports`, `Users can insert own reports`

**Verified:** JWT for alex@antoniou.net now returns **19 reports** including Peachtree EIKHOFF id.

**Secondary failures:**

| Issue | Status |
|-------|--------|
| Headless walkthrough MP4 blank | **Parked** — removed from Help page + dashboard modal until reports visible in UI |
| Panel kill on EIKHOFF accuracy | Engine still `fix`/`kill`; founder override used for PDFs |
| `status` field `pending` vs `complete` | Bulk-updated `ready` → `complete` for display |

---

## Panel consensus (engineering postmortem)

| Persona | Verdict | Core point |
|---------|---------|------------|
| **attorney** | kill | You cannot sell a product where the customer pays and sees an empty dashboard. This is worse than a wrong lien — it looks like fraud or vaporware. |
| **compliance** | kill | Tenant isolation was half-done: documents got RLS policies; **reports table did not**. Any QA that only used service_role would miss this. |
| **design** | fix | Empty states were truthful (zero rows returned) but misleading — user had 19 reports in DB. Add dev-only “RLS health” or staging smoke that logs in as real user. |
| **growth** | kill | Activation metric is “see first report.” We optimized pipeline scripts, not logged-in dashboard. No outbound until alex@ can open one address end-to-end in production UI. |
| **title_co** | fix | PDFs in vault are meaningless if counsel cannot open them from the matter list. |
| **vc** | kill | Classic infra gap: backend “works,” frontend “empty.” One authenticated E2E test per release would have caught this in minutes. |

**Orchestrator:** `fix` @ **15% ship** until:

1. Authenticated dashboard E2E in CI (login → list reports → open report → download AOL/PDF).
2. No founder script claims “delivered” without same checks via **user JWT**.
3. Walkthrough video remains parked.

---

## What alex@ should do now

1. **Hard refresh** https://cliros.ai/dashboard (Cmd+Shift+R).
2. Open **Reports** — expect **19** rows; Peachtree: `87648f5f-c691-4198-8b4a-fe5f6859ae74`.
3. From report detail: download AOL + title PDF + sources.

Help-page video removal requires next **Render deploy** of app code; data fix is already live.
