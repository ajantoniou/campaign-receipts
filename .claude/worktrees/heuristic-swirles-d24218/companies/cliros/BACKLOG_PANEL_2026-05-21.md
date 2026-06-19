# Cliros backlog panel — 2026-05-21

**Orchestrator verdict:** `fix` · ship confidence **15%**

## Orchestrator blocking issues
- Billing loop unverified end-to-end — no proof that webhook → entitlement → report delivery works with idempotency/refund handling; risk of charging attorneys without delivering, or delivering without charging.
- RLS off on report_documents — multi-tenant data exposure risk on privileged attorney work product; single incident is company-ending and is sufficient alone to block onboarding.
- GSCCCA parser merges grantor=grantee on self-deeds — produces incorrect chain of title on common Georgia matters (estate, LLC retitling, divorce); this is a correctness bug hitting the product's core accuracy promise, not polish.
- EIKHOFF orchestrator at 15% ship confidence with known parser/lien-pairing defects — demo/reference report not reliably reproducible and reports not defensible as attorney-reviewable output; needs stabilization plus an internal 5-closing regression passing >85% before outbound resumes.
- Missing legal/E&O posture before first paid attorney: bound E&O / tech professional liability policy ($1–2M min), signed ToS with limitation of liability and 'attorney-of-record is responsible' language, per-PDF disclaimer ('informational only, not a title opinion, scope/county coverage explicit'), and a published human support phone/SLA for closing-table escalation.

## Per persona
| Persona | Verdict | Severity | Top 3 backlog |
|---------|---------|----------|---------------|
| attorney | fix | 75 | Verify first paying customer E2E: LS checkout → webhook → reports_remaining increment → queue report → decrement on delivery. Run with real card, real webhook, real report. Until this is proven on a clean account, you cannot take money — a silent webhook failure means a customer paid and got nothing.; Enable RLS on cliros.report_documents (and audit every other tenant table). Harrington's bias literally says he will leave if data leaks. One cross-tenant read of another firm's closing = existential. This is a 1-hour fix and a launch blocker.; Fix GSCCCA parseDeedResults grantor/grantee merge before the EIKHOFF panel ships at 15% confidence. Harrington's stated kill condition is 'missed second mortgage / unreleased lien.' A parser that mis-pairs index rows is exactly the failure mode that ends the relationship on closing #1. Do not ship reports to a paying attorney while orchestrator confidence is 15%. |

### attorney blocking
- Billing loop unverified end-to-end — risk of charging an attorney and not delivering a report
- RLS off on report_documents — multi-tenant data exposure risk, fatal for a legal SaaS
- EIKHOFF orchestrator at 15% ship confidence with known parser/lien-pairing defect — directly hits Harrington's malpractice trip-wire ('missed lien = never comes back')
- No human escalation path advertised — Harrington explicitly requires 'a human he can call' at the closing table; no on-call/phone support listed in backlog

| title_co | fix | 75 | Verify first paying customer E2E: Lemon Squeezy checkout → webhook → reports_remaining increment → queue report → decrement on delivery. Run it with a real card, twice, before any attorney signs up. Webhook failures = angry customer + chargeback.; Enable RLS on cliros.report_documents. You are selling to attorneys. One cross-tenant leak of a title report and you have an E&O/malpractice problem, not just a bug. This is table stakes before taking money.; Fix GSCCCA parseDeedResults grantor/grantee row merging (self-deeds collapsing). This is a correctness bug in the actual title-search output. Shipping wrong chain-of-title to a paying attorney is the one thing you cannot do — that's exactly the '1987 deed indexed wrong' scenario the industry will crucify you for. |

### title_co blocking
- No verified end-to-end payment → provisioning → delivery path. You don't actually know if a paying customer can receive a report.
- RLS off on report_documents = multi-tenant data leakage risk on a product where the data is privileged/confidential real estate work product.
- Known parser defect (grantor=grantee merge) produces incorrect chain of title — directly hits the attorney's E&O exposure when they rely on your output.
- EIKHOFF orchestrator at 15% ship confidence means your demo/reference report isn't reliably reproducible. Sales without a repeatable golden report is hype, not product.

| compliance | fix | 75 | Verify first paying customer E2E (LS checkout → webhook → reports_remaining → queue → decrement) with a real card on a real attorney account — including refund path and webhook replay/idempotency. You cannot take attorney money until this is provably reliable; a billing failure on a bar-licensed customer is both a refund problem and a reputational/ethics complaint risk.; Enable RLS on cliros.report_documents before any second tenant touches the system. Title reports contain PII (names, addresses, lien data, potentially SSN fragments from judgment indices). Cross-tenant leakage of an attorney's client file is a state privacy law incident and an E&O-triggering event. This is non-negotiable pre-revenue.; GSCCCA parseDeedResults merge fix for grantor=grantee self-deeds. This is a correctness defect in the core GA data pipeline. Attorneys will rely on chain-of-title accuracy; a missed or duplicated self-deed is exactly the kind of error that produces a malpractice claim and an E&O subrogation against Cliros. |

### compliance blocking
- No verified end-to-end paid transaction — billing, entitlement, and report decrement have not been confirmed against a live Lemon Squeezy webhook with idempotency and refund handling.
- RLS not enabled on report_documents — multi-tenant PII exposure risk; this alone is sufficient to delay onboarding a second paying firm.
- EIKHOFF panel parser/lien pairing at 15% ship confidence — if this is representative of orchestrator output quality on real GA matters, reports are not yet defensible as 'attorney-reviewable informational output.' Disclaimers do not cure systematically wrong lien pairing.
- Unverified: required disclaimer language ('informational only, not a title opinion, attorney is solely responsible') present on every generated PDF and in ToS. Not listed in backlog — confirm it ships before first dollar.
- Unverified: Cliros E&O / tech professional liability policy bound ($1–2M min) before first paying attorney. Not in backlog — must be confirmed, not deferred.

| design | fix | 75 | Verify first paying customer E2E with a real Lemon Squeezy purchase: checkout → webhook signature verify → reports_remaining increment → queue report → atomic decrement. Test refund/chargeback path and idempotency on webhook replays. No money moves until this is green.; Enable RLS on cliros.report_documents (and audit every other cliros.* table for RLS). Attorneys put bar licenses behind this — a cross-tenant document leak is an E&O and reputational extinction event. Non-negotiable before first paid seat.; Fix GSCCCA parseDeedResults grantor/grantee row merge so self-deeds and index pairs render correctly. This is the core data correctness bug in the search pipeline — if the deed chain is wrong, the report is wrong, and the attorney signs off on bad work. |

### design blocking
- Billing loop unverified end-to-end — risk of taking money and failing to deliver reports, or double-decrementing, or webhook replay fraud.
- RLS off on report_documents — cross-tenant data exposure risk. Single worst-case incident kills the company with attorneys.
- GSCCCA parser merges grantor/grantee incorrectly on self-deeds — produces wrong chain of title, which is the product's core promise.
- EIKHOFF orchestrator at 15% ship confidence on parser/lien pairing — demo report not reliably reproducible, meaning sales demos and onboarding will misfire.

| growth | fix | 75 | Verify first paying customer E2E: Lemon Squeezy checkout → webhook → reports_remaining increment → queue report → decrement on delivery. This is the activation metric path. If this breaks for paying customer #1, you've torched the trust premium that justifies $100/report pricing. Instrument it, run a $5 test pack against a real card, and verify idempotency on webhook retries.; Enable RLS on cliros.report_documents. You are selling to attorneys — fiduciaries with E&O exposure and bar-association data-handling obligations. A single cross-tenant leak (Attorney A sees Attorney B's client property search) is an existential E&O event and a referenceable-customer killer. Non-negotiable before any outbound.; Fix GSCCCA parseDeedResults grantor/grantee merge (self-deed bug) AND lock down the EIKHOFF orchestrator/parser-lien pairing to >80% ship confidence before charging. 15% confidence on the flagship demo report means your activation moment — 'search a property you already closed and compare' — fails. That's the entire PLG funnel. |

### growth blocking
- Billing loop unverified end-to-end — you literally do not know if money in produces a report out. Cannot take a paying customer until this is proven with a real card and a real webhook replay test.
- RLS off on report_documents = multi-tenant data leak risk. For an attorney-facing product touching client property data, this is an E&O / malpractice-grade liability. One incident ends the company.
- EIKHOFF report at 15% ship confidence — the parser/lien pairing is the core accuracy claim. Charging $100/report when the deed parser conflates grantor=grantee on self-deeds means you will deliver wrong title chains. That's not a bug, that's malpractice-by-proxy.

| vc | fix | 75 | Verify first paying customer E2E: Lemon Squeezy checkout → webhook → reports_remaining increment → queue report → decrement on completion. Until you've watched this happen with a real card on a real account, you do not have a product — you have a demo. Add idempotency on the webhook and a reconciliation job so a missed webhook doesn't silently eat a paid pack.; Enable RLS on cliros.report_documents (and audit every other tenant-scoped table in cliros schema). A cross-tenant data leak on an attorney work-product table is an existential E&O and reputational event — one screenshot of Firm A seeing Firm B's title report ends the company. This is a 2-hour fix that cannot ship after the first paying customer, only before.; Fix GSCCCA parseDeedResults grantor/grantee merge so self-deeds (grantor=grantee) don't corrupt the chain of title, AND finish the EIKHOFF orchestrator/parser-lien pairing to get panel ship confidence above ~80%. Accuracy defects on the first 10 paid reports define your reputation in a referral-driven attorney market — you will not get a second chance with Georgia attorneys if the first report misses a lien. |

### vc blocking
- Billing loop unverified end-to-end — taking money before you've proven webhook → entitlement → consumption works means you will have customers who paid and got nothing, or got reports without paying. Either way you're manually reconciling in SQL at 11pm.
- RLS off on report_documents = tenant isolation depends entirely on application-layer query correctness. One bad WHERE clause and you've leaked privileged attorney work product. This is the single highest-severity item in the brief and it's labeled P0 for a reason.
- EIKHOFF panel only at 15% ship confidence with known parser/lien-pairing bugs. Shipping a title-search product with known accuracy defects to paying attorneys is the exact failure mode that gets you sued — the attorney signs, but they point at you, and your E&O posture (which I don't see evidence of yet) determines whether you survive it.
- No E&O insurance or disclaimer/ToS posture mentioned in the backlog. Before the first paying attorney, you need: (a) signed ToS with limitation of liability and 'attorney-of-record is responsible for final determination' language, (b) E&O quote in hand even if not bound yet, (c) a written accuracy disclaimer in every report PDF.


*Estimated API cost: ~$0.87*