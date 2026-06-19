# Channel Data Interface — Campaign Receipts

> Map of the web product's Supabase schema → episode/segment source
> material. Any sibling content surface (YouTube channel, podcast,
> newsletter, Twitter) should query these tables for citation-grade
> claims instead of doing redundant research from scratch.

## TL;DR — the source-of-truth rule

The Campaign Receipts website's Supabase database **is** the
production-grade primary-source citation layer. If a content
script makes a claim that the website can't back, the script is
making a claim we can't defend. Query the database before
researching; only research what the database lacks.

Database: Supabase project `jivahkfdkduxasnzpzgx` (organization
`agentcompanies`). Tables prefixed `cr_`. Service-role and anon
GRANTs in place per portfolio rule.

## Table map by use case

### Use case 1 — "Politician X said Y, actually delivered Z" segments

This is the core episode format. Schema chain:

```
cr_politicians
  ↓ id
cr_promises (verdict, verdict_reasoning, case_study_narrative)
  ↓ id
cr_receipts (quote, source_url, source_publication, source_date)
```

Episode query template (in Supabase SQL):

```sql
SELECT
  pol.name, pol.slug, pol.party, pol.state, pol.branch,
  pol.current_term_start, pol.current_term_end,
  pol.scorecard_percentage_kept, pol.scorecard_graded_total,
  p.promise_number, p.promise_text, p.verdict, p.category,
  p.verdict_reasoning, p.case_study_narrative,
  r.quote, r.source_url, r.source_publication, r.source_date,
  r.paper_trail_notes
FROM cr_politicians pol
JOIN cr_promises p ON p.politician_id = pol.id
LEFT JOIN cr_receipts r ON r.promise_id = p.id
WHERE pol.slug = 'donald-trump-2016'
  AND p.is_featured = true
ORDER BY p.promise_number, r.source_date;
```

Returns: all 4 chapter-defining promises for Trump 2016 (Trade /
Drain the Swamp / Jobs / Healthcare), each with full case-study
narrative + every receipt (verbatim quote + primary-source URL +
publication + date). 12 receipt rows total. Every URL is
federalregister.gov / congress.gov / debates.org / cbsnews.com /
cnn.com.

**Script protocol:** voice-over reads from `case_study_narrative`
field; on-screen citations come from `cr_receipts.source_url` +
`source_publication` + `source_date`. Description's sources.md
gets the URL list straight from `r.source_url` results.

### Use case 2 — "Follow the money" donor segments

Schema chain:

```
cr_politicians
  ↓ id
cr_top_donors (rank, donor_name, donor_employer, total_contributed,
                is_pac, cycle)
cr_industry_breakdown (rank, industry_label, total_contributions, cycle)
cr_campaign_finance (cycle-level totals)
```

Episode query template:

```sql
SELECT pol.name, pol.slug, pol.party, pol.state,
       d.rank, d.donor_name, d.donor_employer, d.total_contributed,
       d.is_pac, d.industry_label, d.cycle
FROM cr_politicians pol
JOIN cr_top_donors d ON d.politician_id = pol.id
WHERE pol.slug = '<slug>'
ORDER BY d.cycle DESC, d.rank ASC
LIMIT 20;
```

Returns the top-20 named donors per cycle. For the "industry behind
this politician" angle, swap to `cr_industry_breakdown`.

**Caveat:** donor data is FEC-derived for federal-cycle candidates
only. Cabinet appointees, governors, mayors, and pre-FEC-era figures
have no rows here. Episode scripts on such figures must NOT imply
"this politician has no donors" — they have no FEC federal-cycle
donors. Use different framing.

### Use case 3 — "Donor-to-vote alignment" segments

The single most valuable Pro-tier feature. Schema:

```
cr_politicians
  ↓ id
cr_donor_vote_alignment (industry_label, alignment_score,
                          bill_id, vote_position, vote_date)
  ↓ bill_id
cr_bills (congress, bill_number, title, status, sponsor_bioguide)
cr_roll_calls (vote_date, vote_position)
cr_bill_industry_positions (bill_id, industry, position, source)
```

Episode query template ("Manchin voted with pharma 78.6% of the time"):

```sql
SELECT
  pol.name,
  a.industry_label,
  COUNT(*) FILTER (WHERE a.alignment_score = 1) AS aligned,
  COUNT(*) AS total,
  100.0 * COUNT(*) FILTER (WHERE a.alignment_score = 1) / COUNT(*) AS pct
FROM cr_donor_vote_alignment a
JOIN cr_politicians pol ON pol.id = a.politician_id
WHERE pol.slug = 'joe-manchin'
GROUP BY pol.name, a.industry_label
HAVING COUNT(*) >= 5
ORDER BY total DESC, pct DESC;
```

Each alignment row links back to a specific bill (`cr_bills`) +
roll-call (`cr_roll_calls`). On-screen citation: Congress.gov bill
URL + OpenSecrets industry donor link.

### Use case 4 — "Dual citizenship" investigation segments

Schema:

```
cr_politicians
  ↓ id
cr_citizenships (country_code, country_name, source_type, source_url,
                 source_publication, source_date, source_quote,
                 disputed, dispute_url)
```

Source-discipline taxonomy:
- `self_disclosed` — politician's own public statement (highest trust)
- `official_record` — court filing, government retention permit
- `court_filing` — naturalization or denaturalization record
- `reputable_journalism` — top-tier outlet reporting

Episode query template:

```sql
SELECT pol.name, pol.slug, pol.party, c.country_code, c.country_name,
       c.source_type, c.source_publication, c.source_date,
       c.source_quote, c.source_url, c.disputed
FROM cr_citizenships c
JOIN cr_politicians pol ON pol.id = c.politician_id
ORDER BY c.country_name, pol.name;
```

**Episode framing rule:** the topic is *the journalism we're doing*,
not *flagging individual politicians*. The Snopes 2024 framing
("most circulating dual-citizenship lists are unreliable") is the
editorial premise. Lead with the genre's failure, then show what
survives the rigor.

### Use case 5 — "Foreign-tied funding" investigation segments

Schema:

```
cr_foreign_donor_records (category, recipient_name, donor_name,
                          donor_employer, donor_origin_country,
                          amount_usd, cycle, source_url,
                          source_publication, source_date, source_type,
                          short_summary, long_explanation, outcome)
  ↓ politician_id (nullable — committee-level records have no FK)
cr_politicians
```

Four distinct categories — **never collapse them in script**:

1. `illegal_contribution` — 52 U.S.C. § 30121 enforcement
   (FEC MUR / DOJ). Source: justice.gov / fec.gov.
2. `fara_registrant` — registered foreign-agent contributions
   (legal). Source: efile.fara.gov.
3. `foreign_soe_employee` — donors employed by foreign state-owned
   enterprises. CURRENTLY EMPTY — research did not surface verified
   FEC records meeting the bar.
4. `foreign_policy_pac` — DOMESTIC U.S. PACs advocating a foreign
   country's policy positions. **Explicit "domestic, not foreign
   agents" framing required.** UDP/AIPAC, JStreetPAC, ANCA PAC are
   the seeded examples.

Episode query template:

```sql
SELECT category, donor_name, donor_origin_country, amount_usd, cycle,
       source_publication, source_url, source_type, short_summary,
       long_explanation, outcome
FROM cr_foreign_donor_records
WHERE category = 'illegal_contribution'
ORDER BY amount_usd DESC NULLS LAST;
```

**Hard rule:** FEC MUR deadlock outcomes must be voice-over'd as
*"the FEC commission deadlocked 2-2 — a procedural dismissal, not
a finding of innocence"* — not as a clean dismissal.

### Use case 6 — "What's the comparison" segments

Schema:

```
cr_compare_pairs (slug_a, slug_b, narrative)
```

Pre-computed politician-pair comparison pages. Use for episode
formats like "Schumer vs Gillibrand — same state, same office,
different records." 200 pairs pre-generated for SEO + cross-link
discovery; reuse the same pairs as episode topic generators.

### Use case 7 — "Worst broken promise this week" segments

Schema:

```
cr_weekly (week_year, week_number, politician_id, promise_id, narrative)
```

Auto-cron picks one BROKEN verdict per week. Use this as a weekly-
recurring episode format. The narrative is pre-written, sources
already linked.

### Use case 8 — "Outreach + community" intelligence

Schema (don't quote in scripts, but useful for content planning):

```
cr_outreach_targets, cr_outreach_log — who we cold-emailed + replies
cr_disputes — reader-filed verdict disputes (corrections-log source)
cr_audit_findings — internal-review notes per politician
cr_waitlist — reader sign-ups + interests
```

Useful for: "the reader who flagged this got us thinking..." segments
that ground the episode in real audience interaction.

## Schema-to-script citation pattern

Every voice-over claim should have this 4-tuple traceable:

1. **The verbatim claim** ("Trump promised to repeal and replace the
   ACA")
2. **The CR table row** that backs it (`cr_promises.id =
   '0ed23462-0322-4578-ac09-73383ffed5aa'`)
3. **The primary source URL** that the row links to
   (`debates.org/...october-9-2016-debate-transcript`)
4. **The on-screen citation** matching the URL

If any of those four can't be filled, the claim doesn't ship.

## Anti-patterns (data uses we don't ship)

- **Cherry-picking the worst donor**: don't pull rank=1 if rank=2 is
  a more representative industry. Use `cr_industry_breakdown` ordered
  by `total_contributions DESC` to show the actual top — even if it's
  less spicy.
- **Implying "no donors" for non-FEC politicians**: missing rows ≠
  zero donors. Frame as "no federal-cycle FEC record" not "no donor
  data."
- **Quoting `verdict_reasoning` as fact when it's stub text**: some
  early rows have placeholder reasoning ("Aggregated chapter verdict
  from the SEALED book…"). Check the chars-length before quoting —
  rev-5 onwards full reasoning is 480-615 chars; anything shorter is
  stub.
- **Using `cr_citizenships` rows without rendering "U.S. + [country]
  (dual)" framing**: don't drop a flag emoji without the explicit dual
  status disclaimer.
- **Pulling foreign-policy PAC rows without the "DOMESTIC" framing**:
  every foreign_policy_pac row in script must come with the
  "domestic U.S. PAC, not a foreign agent" disclaimer.

## Connection details

For the channel build:

- **Connection string**: stored in `.env` as `SUPABASE_URL` +
  `SUPABASE_SERVICE_KEY` (project root `.env`, not committed). The
  channel build should use a read-only role, NOT the service key.
  Ask the founder to provision an `anon` read role or a dedicated
  channel-content role with SELECT-only on the `cr_*` tables.
- **MCP**: the agentcompanies project is available via the Supabase
  MCP server. Use `mcp__6250dcd8-7ae0-43d6-8f82-e9ff0189d568__execute_sql`
  with `project_id: jivahkfdkduxasnzpzgx`.
- **Schema docs**: this file IS the schema doc. Don't reverse-engineer
  from the codebase — read here first.

## When to add a new table vs reuse existing

New tables for the channel build should:
- Be prefixed `cr_channel_*` (e.g. `cr_channel_episodes`,
  `cr_channel_scripts`)
- Include explicit GRANT statements (per portfolio Oct 30 2026
  breaking change rule)
- Reference existing `cr_*` rows by ID, never duplicate primary
  data (e.g. `cr_channel_episodes.featured_promise_id REFERENCES
  cr_promises(id)`)
- Have a `created_at` + `updated_at` timestamptz with `DEFAULT now()`

When the channel team thinks they need a new piece of citation data
that already exists in `cr_*`, they should query it instead of
inserting a denormalized copy. Drift between channel content and
website verdicts kills the brand faster than missing content.
