 # Cross-company Chart of Accounts reference

 **Status:** Draft canonical definition for Chief Accountant Task-089  
 **Linked research:** `companies/portfolio-hq/research/2026-05-06-2200-cross-company-chart-of-accounts-alignment.md`

 ## Purpose
 This reference document records the canonical Chart of Accounts that every company’s `pnl/` ledger should adopt before we roll up a weekly `shared/monitoring/portfolio-pnl-YYYY-MM-DD.md` brief. Aligning buckets removes guesswork from HQ summaries and ensures the yellow/orange/red alerts fire consistently.

 ## Canonical accounts
 | Account | Definition | Notes / tagging guidance |
 | --- | --- | --- |
 | `Hosting` | Infrastructure services that keep the product alive (Render web/workers, Supabase schemas, CDN, storage, webhooks, cron jobs). | Tag every Render or Supabase charge as `HOSTING`. Include amplifying services like Cloudflare Workers or Redis if used. |
 | `LLM API` | Model usage charges (DeepSeek V4-Pro/Haiku, Claude Opus/Haiku, Grok, Anthropic, etc.). | Track the May 75% discount baseline vs actual. Include any Groove/Ops tokens used by marketing or brand agents. |
 | `Tools & Subscriptions` | Non-model SaaS (Notion, Airtable, Zapier, Calendly, Midjourney, Resend free-to-paid upgrades, analytics, etc.). | Reassign to `Marketing & Growth` if the spend clearly advances an acquisition push. |
 | `Domains & DNS` | Registrar renewals (Cloudflare), privacy add-ons, DNS services. | Always record domain purchases/renewals here regardless of the paying bucket. |
 | `Payments fees` | Stripe + Lemon Squeezy transaction cuts, Connect payouts, bank transfers for payouts. | Pair every revenue line with its payment fee (net revenue = gross revenue − payments fees). |
 | `Marketing & Growth` | Paid acquisition (Reddit/TikTok ads), email sends above the free quota, influencer payments, creative assets tied to a growth push. | Avoid stuffing infrastructure under this bucket; prefer `Hosting` or `Tools` unless the spend clearly fuels acquisition lessons. |
 | `Buffer / Reserve` | Micro-spends awaiting classification or emergency, one-off ad hoc buys that don’t neatly fit elsewhere. | Use sparingly; include context in the memo so it can be reallocated later. |
 | `Revenue` | Company-specific inflows. Each company should define its sub-lines (Amazon royalties, direct sales, bundles, services) but always roll up under the `Revenue` parent bucket. | Keep Amazon vs direct tracking for `concise`. For new revenue streams, add a column in the ledger and explain the source in the weekly P&L.

 ## Revenue lines per company
 - `concise`: continue the existing `amazon_monthly_revenue`, `direct_sales`, and `bundle_sales` tables. When HQ rolls up, treat each as a row under `Revenue` (e.g., “Revenue — Amazon royalties”, “Revenue — direct sales”). Record Stripe session IDs for audit/error handling.
 - `carstack`, `nt-ministry`, `healthbrew`: create `direct_sales` or service revenue rows once income appears (doc each row in the ledger plus the weekly P&L). Use the same `Payments fees` pairing.
 - `Hyperlocal Matrix` & `Plutus Street`: hibernating. Any rare spend stays in `Buffer / Reserve` until they wake, at which point they adopt the same structure and the ledger entries migrate to the standard chart.
 - `portfolio-hq`: governance-only ledger (if/when needed) should mirror this chart so shared tooling costs are visible to the founder.

 ## Ledger best practices
 1. **Every entry** must include `company`, `date`, `amount`, `currency`, `account`, and a short `description`.
 2. **Tag with metadata** when helpful (e.g., `account=LLM_API`, `role=Brand`, `model=DeepSeek V4-Pro`). This lets HQ slice by company or spend type even if future dashboards arrive.
 3. **Weekly Friday P&L** (per `shared/personas/chief-accountant.md`) must cite the `Total spend` row and `Revenue` subtotal using these buckets.
 4. **Send cross-company summary** to `shared/monitoring/portfolio-pnl-YYYY-MM-DD.md` and link to this document for context.
 5. **Update this doc** when a new bucket is needed (founder approval required for new cost categories). Record any changes both here and in the `companies/.../pnl/ledger.md` so everyone can trace the derivation.

 ## Next steps (per Task-089)
 - Catalog the buckets each company currently uses and add a short note under this document or in the research stub to preserve the mapping work.
 - Update any ledger templates (e.g., `pnl/template.md` if present) so they default to these account names.
 - Once every company is aligned, refresh the weekly HQ `portfolio-pnl` summary to refer to these labels explicitly so stakeholders can trust that “Hosting,” “LLM API,” etc. mean the same thing across the portfolio.
