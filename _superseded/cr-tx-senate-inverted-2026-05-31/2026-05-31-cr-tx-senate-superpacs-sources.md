# Research Pack / Sources — TX Senate 2026 super-PACs (CORRECTED, FEC-verified 2026-05-31)

This pack SUPERSEDES the prior inverted version. Every dollar below was re-pinned to FEC
Schedule A (receipts) / Schedule E (independent expenditures) line-items on 2026-05-31 via the
OpenFEC API, cycle 2026. Downstream stages read THIS file — do not use the old $90M/$15.6M/Nau,
Truth-and-Courage, WinSenate, or Allred-as-candidate figures.

## Candidates & outcomes (RESOLVED — past tense)
| Candidate | Party | Outcome | FEC cand ID |
|---|---|---|---|
| **Ken Paxton** | R | **WON** GOP runoff May 26 2026 (63.8%) over incumbent Cornyn → GOP nominee | S6TX00388 |
| **James Talarico** | D | **WON** Dem primary (52.4%) over Crockett → Dem nominee | S6TX00479 |
| John Cornyn | R (incumbent) | LOST runoff to Paxton despite $12.8M pro-Cornyn outside money | S2TX00106 |
| Jasmine Crockett | D | LOST primary to Talarico after $9M ran against her | S6TX00552 |
| Wesley Hunt | R | Eliminated in GOP primary; $26M ran against him | S6TX00511 |

**Colin Allred** — dropped out Dec 8 2025 to run for U.S. House (TX-33). NOT a 2026 Senate
candidate. NEVER mention as one.
General election: **Paxton (R) vs Talarico (D)**, November 2026.

Source: cr_races slug=tx-senate-2026-general result_summary; FEC candidate search
https://www.fec.gov/data/candidates/senate/?state=TX&cycle=2026

## Total outside money
**$110,213,236** verified FEC independent expenditures, cycle 2026 (cr_races.total_ie_usd).
Headline: "over $110M."

## PAC → target table (every figure FEC Schedule-E verified 2026-05-31)
### Texans for a Conservative Majority — FEC **C00542217** (pro-Cornyn)
- **AGAINST Ken Paxton: $39,302,055** (FEC Sched-E, 82 line-items, sum of OPPOSE) → "$39.3M / $39M"
- **FOR John Cornyn: $10,614,658** → "$10.6M"
- **AGAINST Wesley Hunt: $10,288,425** → "$10.3M"
- Top itemized donor (FEC Sched-A): **John L. Nau III — $7,905,000** (5 receipts: $2M 2025-03-24,
  $5K 2025-03-24, $2M 2025-06-27, $2.9M 2026-01-29, $1M 2026-03-17). Beer-distribution billionaire
  (Silver Eagle Distributors, Houston). **NOT $15.6M.**
- Pass-through: "Ohio Works Inc." ~$5.55M — original donors NOT itemized → do not name.
- **Backfire: spent $39M to STOP Paxton; Paxton WON the runoff.**
- Source: FEC C00542217 Schedules A & E. https://www.fec.gov/data/committee/C00542217/

### Lone Star Rising PAC — FEC **C00918268** (pro-Talarico)
- **AGAINST Jasmine Crockett: $8,951,988** (FEC Sched-E, OPPOSE) → "$8.95M / ~$9M"
- **FOR James Talarico: $7,960,524** → "$7.96M / ~$8M"
- Backers (FEC Sched-A): "Government That Works PAC" $3.75M (pass-through); **Reid Hoffman
  (LinkedIn co-founder) $1,500,000** (2 receipts: $500K 2026-01-27, $1M 2026-02-23); Stephen Mandel
  $500K; Simone Coxe $500K.
- **Irony: Talarico campaigns against super-PAC money; $9M of billionaire super-PAC help ran
  for him / against his rival. Talarico WON.**
- Source: FEC C00918268 Schedules A & E. https://www.fec.gov/data/committee/C00918268/

### Conservative Texans PAC — FEC **C00932707**
- **AGAINST Wesley Hunt: $9,682,547** (FEC Sched-E, OPPOSE) → "$9.68M / ~$9.7M"
- ~100% of itemized receipts came from one out-of-state pass-through, "Conservative Americans PAC."
  Original donors one filing removed — NOT itemized. Honest-gap beat: "we won't name what the
  filing won't show."
- Source: FEC C00932707 Schedules A & E. https://www.fec.gov/data/committee/C00932707/

## VOID for this race — DO NOT MENTION
Truth and Courage PAC, WinSenate, Win It Back PAC (2024/Kentucky); Allred as Senate candidate;
old Yass/Schwarzman/Rees-Jones figures.

## Soundbite source-hunt (Stage 18 owns final selection)
- Talarico: anti-super-PAC / "I don't take corporate PAC money" / independence — must be a
  correctly-dated 2025–2026 clip. Juxtapose vs Lone Star Rising $9M.
- Paxton: a real 2025–2026 clip. Juxtapose vs the $39M spent to stop him (money that lost).
- Bounds: ≤6s/beat, ≤30s/clip, ≤90s/source. OMIT honestly if no clean dated clip. No 2024
  Allred-Cruz debate, no Trump-endorsement clip. Never AI-face.

## Retrieval
FEC OpenFEC API, cycle 2026, retrieved 2026-05-31. Sched-E summed across all line-item pages
(not the by_candidate aggregate, which under-reports). Sched-A contributor_name search,
two_year_transaction_period=2026.
