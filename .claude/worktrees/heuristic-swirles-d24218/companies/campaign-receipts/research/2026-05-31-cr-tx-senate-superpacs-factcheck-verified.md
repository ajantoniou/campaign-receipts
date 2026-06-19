# Stage 6 Fact-Check — TX Senate 2026 super-PACs — CORRECTED DATA — PASS

Verified 2026-05-31 against FEC OpenFEC API (Schedule A receipts + Schedule E independent
expenditures), cycle 2026, by summing ALL line-item pages (NOT the `by_candidate` rollup, which
under-reports — e.g. it shows only $14.0M of TFCM-vs-Paxton because it counts one notice-period).

## Verified figures (claim → FEC line-item sum → verdict)
| Claim | FEC line-item result | Verdict |
|---|---|---|
| Total outside money "$110M+" | cr_races.total_ie_usd = $110,213,236 | PASS |
| TFCM (C00542217) AGAINST Paxton $39.3M | $39,302,055 (82 Sched-E rows, OPPOSE) | PASS |
| TFCM FOR Cornyn $10.6M | $10,614,658 | PASS |
| TFCM AGAINST Hunt $10.3M | $10,288,425 | PASS |
| Nau → TFCM ~$7.9M (NOT $15.6M) | $7,905,000 (5 Sched-A receipts 2025-03→2026-03) | PASS |
| Lone Star Rising (C00918268) AGAINST Crockett $8.95M | $8,951,988 | PASS |
| Lone Star FOR Talarico $7.96M | $7,960,524 | PASS |
| Reid Hoffman → Lone Star $1.5M | $1,500,000 (2 Sched-A receipts Jan/Feb 2026) | PASS |
| Conservative Texans (C00932707) AGAINST Hunt $9.68M | $9,682,547 | PASS |
| Paxton won GOP runoff (May 26 2026, 63.8%) over Cornyn | cr_races result_summary | PASS (per Supabase; not FEC-derived) |
| Talarico won Dem primary (52.4%) over Crockett | cr_races result_summary | PASS (per Supabase; not FEC-derived) |

## Banned / void confirmed ABSENT from corrected brief, story-extraction, sources
- Truth and Courage PAC, WinSenate, Win It Back PAC — REMOVED (2024/Kentucky vehicles).
- Colin Allred as Senate candidate — REMOVED (dropped out Dec 8 2025 → ran TX-33 House).
- Old Nau $15.6M, $88.6M/$90M total, Yass/Schwarzman/Rees-Jones figures — REMOVED.

## Note on outcomes
Election outcomes (Paxton/Talarico won) are sourced to cr_races.result_summary (founder-corrected),
not independently re-derived from a primary returns source in this pass. They match the founder's
verified story. The DOLLAR figures — the load-bearing receipts — are all FEC line-item verified.

VERDICT: Fact-check PASS on the corrected data. The brief, story-extraction (briefs/), and sources
(research/2026-05-31-cr-tx-senate-2026-superpacs-sources.md) are clean and ready for the script
rebuild (Stage 7+).
