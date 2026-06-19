# Campaign Receipts — Manual Rank Checks

On-demand rank snapshots for campaignreceipts.com on target queries. This is the
no-credential alternative to GSC automation (which is blocked by a confirmed
Google bug that rejects new service accounts with "email not found" — see
SEO-MEASUREMENT-RUNBOOK.md). The GSC reporting cron was deleted; rank checks are
run manually by the agent via web search on request ("check how we rank").

**Method:** the agent runs each target query through web search and records
whether campaignreceipts.com appears in the top results, and roughly where.
**Caveats (be honest about these):** results aren't personalized/geo-matched to a
real user, web search may differ slightly from a live Google SERP, and
brand-new pages often don't rank at all yet. Treat as a *directional* snapshot —
"are we showing up, roughly where" — not GSC-grade exact position. For queries
where we surface, it's reliable enough to track movement over time.

How to use: ask the agent to "run the rank checks." It appends a dated row set
below. Watch the entity queries (politician/bill) start to surface as the
just-indexed pages mature.

---

## Baseline — 2026-06-03 (deploy day; pages indexed ~hours earlier)

| Query | CR rank | Who owns the SERP today |
|---|---|---|
| `campaignreceipts` (brand) | **not ranking** | FEC.gov, receipt-maker tools, state finance portals |
| `campaign receipts politician promise tracker` | **not ranking** | PolitiFact, Polimeter, OpenSecrets, FEC, WaPo |
| `who funds josh hawley` | **not ranking** | OpenSecrets, Wikipedia, Congress.gov, Britannica |

**Read:** as expected for a site whose pages were indexed only hours ago — nothing
ranks yet, including the brand term. This is the floor. The thesis (own
"[politician] donors" / "who funds [name]") is contested by OpenSecrets +
Wikipedia, so entity pages will need the structured-data + internal-linking work
(now live) to mature and earn position. Re-check weekly; first expected movement
is the **brand term** ("campaignreceipts"), then long-tail politician/bill pages.

## Target query set (run these each check)

Brand / head:
- `campaignreceipts`
- `campaign receipts` / `campaign receipts promise tracker`
- `who funds congress` / `congressional campaign finance tracker`

Politician entity (rotate high-traffic names with rich pages):
- `who funds <name>` · `<name> donors` · `<name> campaign finance` · `<name> promises kept`

Bill entity (the un-owned wedge):
- `who funded <bill>` · `<bill> donors`

Race entity:
- `<state> <office> race funding` · `who's funding <race>`
