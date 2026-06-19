# Fact-Check Gate (Step 2.95) — cr-rabb-pa3-aipac-defeat — 2026-05-25

## VERDICT: FAIL (blocking issues below — all small, all fixable in ~5 min)

Three blocking issues:
1. **PA-3 vote percentages (44 / 30 / 24) are not in the receipts file.** Script cites them as fact; receipts have no Tier covering certified election results. Either add a receipt or remove the precise numbers.
2. **"Ninety-one-day-old Delaware shell" arithmetic doesn't match receipts.** Receipts say first 314 Action Fund IE landed 2026-03-10. Dec 19 2025 → Mar 10 2026 = 81 days, not 91. The "91-day" framing only works if the Kimbark→314 wire was 2026-03-20, which receipts do NOT pin to a specific date (receipts say only "March 2026"). Needs either a receipt for the exact wire date or a softer phrasing.
3. **"Sixty-five days in" (Kimbark → EDW)** — receipts assert 65 days, but Dec 19 2025 → Feb 23 2026 = 66 calendar days (12 + 31 + 23). Script matches receipts; receipts are off-by-one against the calendar. Low-risk but a hostile fact-checker will flag it on X.

Everything else PASSES. Full audit below.

## Per-claim audit

### Names + spellings

| # | Claim (script) | Receipt source | Verdict | Notes |
|---|---|---|---|---|
| 1 | "Pennsylvania state rep Chris Rabb" | Tier 1/2/4 throughout | ✅ EXACT | |
| 2 | "Dr. Ala Stanford" | Tier 2, candidate H6PA03245 "STANFORD, ALA DR." | ✅ EXACT | Spelled correctly (not "Sarah Stanford") |
| 3 | "State Senator Sharif Street" | Not in receipts file | ⚠️ APPROXIMATE | Name spelling correct per public record; receipts don't carry Street's title/result. Add to receipts. |
| 4 | "Longtime Congressman Dwight Evans is retiring" | Not in receipts | ⚠️ APPROXIMATE | True per public record; not in receipts file. |
| 5 | "Kimbark Foundation" | Tier 1.1, 1.2, 1.3 | ✅ EXACT | |
| 6 | "EDW Action Fund" | Tier 1.2, FEC C00863472 | ✅ EXACT | |
| 7 | "314 Action Fund" | Tier 1.1, FEC C00633248 | ✅ EXACT | |
| 8 | "A.O.C." | Tier 4.11 | ✅ EXACT | Properly used as acronym in spoken form |
| 9 | "Hasan Piker" | Tier 4.12 | ✅ EXACT | |
| 10 | "Cori Bush — the St. Louis nurse and pastor" | Tier 3.8 | ✅ EXACT | |
| 11 | "Kentucky Congressman Thomas Massie" | Tier 3.9 | ✅ EXACT | Massie WAS incumbent KY-4 Congressman |
| 12 | "U.D.P." | Tier 3.8, 3.9 | ✅ EXACT | |
| 13 | "R.J.C. Victory Fund" | Tier 3.9 | ✅ EXACT | |
| 14 | "A.I.P.A.C." | Tier 1.1, throughout | ✅ EXACT | |
| 15 | "F.E.C." / "Federal Election Commission" | Tier 1 references C00633248 | ✅ EXACT | Acronym expanded correctly first use |
| 16 | "Drop Site News and Common Dreams" | Tier 1.1 citation lines | ✅ EXACT | |

### Outcomes + incumbent status

| # | Claim | Receipt source | Verdict | Notes |
|---|---|---|---|---|
| 17 | Rabb "won by fifteen points" | Receipts confirm Rabb won; margin not numerically pinned | ⚠️ APPROXIMATE | Math (44.2 − 29.5 = 14.7 → 15) is sound IF percentages hold. See #19 — those percentages aren't in receipts. |
| 18 | Stanford "came in third" | Receipts confirm Stanford was the 314-backed candidate; finishing order not explicitly stated | ⚠️ APPROXIMATE | Consistent with the 44/30/24 the script asserts; not in receipts. |
| 19 | "forty-four percent" / "thirty" / "twenty-four" (Rabb / Street / Stanford) | **NOT IN RECEIPTS** | ❌ MISMATCH | **BLOCKING.** Script states three precise certified-vote percentages; receipts file has no PA-3 result section. Either add a Tier (PA Dept of State certification URL) or change to "won decisively / came in third" without numbers. |
| 20 | Cori Bush "lost her Missouri primary" | Tier 3.8 (Bell beat Bush) | ✅ EXACT | Bush WAS incumbent; matches |
| 21 | Massie "lost his primary" | Tier 3.9 (Intercept URL "massie-loses-election-results") | ✅ EXACT | Massie WAS incumbent KY-4; **directly contradicts the council historian's earlier claim that Massie won.** Script is correct, historian was wrong. |
| 22 | Rabb "won by fifteen points" framed against Bush/Massie losses | Tier 3 comparison frame | ✅ EXACT | Logic of "same playbook, three outcomes, one variable" holds |

### Dollar amounts

| # | Claim | Receipt source | Verdict | Notes |
|---|---|---|---|---|
| 23 | "Three and a half million dollars" (314 Action Fund IE for Stanford) | Tier 2.5: $3,495,085.68 | ✅ EXACT | Rounds cleanly |
| 24 | "five hundred thousand dollars" Kimbark → EDW Action Fund | Tier 1.2 | ✅ EXACT | |
| 25 | "five hundred thousand to … 314 Action Fund" | Tier 1.1 | ✅ EXACT | |
| 26 | "two-point-seven-five million on advertising" | Tier 2.6: $2,753,955.00 | ✅ EXACT | |
| 27 | "six hundred fifty-six thousand on direct mail" | Tier 2.6: $655,875.66 | ✅ EXACT | "656K" rounding from 655,875.66 is fine; hostile fact-checker would call this 656K, matches script |
| 28 | "eight and a half million" (Bush / UDP) | Tier 3.8: "$8.5M conservative" | ✅ EXACT | Note: Mondoweiss/Axios actually say "nearly $9M"; receipts pre-approved $8.5M as the conservative on-screen figure. PASS. |
| 29 | "fifteen-point-eight million" (Massie / pro-Israel groups) | Tier 3.9: $15.8M | ✅ EXACT | |
| 30 | "U.D.P., the R.J.C. Victory Fund, and an Adelson-linked transfer" | Tier 3.9: UDP $4.1M+, RJC $3.9M, Preserve America (Miriam Adelson-linked) $750K transfer | ✅ EXACT | Three components match; "Adelson-linked transfer" correctly describes Preserve America → MAGA KY. |
| 31 | "three-point-five million spent against him [Rabb]" | Tier 2.5 + Tier 3.10 | ⚠️ APPROXIMATE | Tier 3.10 explicitly recommends labeling Rabb-comparable figure as **$3.5M pro-AIPAC-aligned IE deployed against the targeted progressive.** Script's "spent against him" matches that framing. BUT receipts also note: "No oppose-Rabb IEs from 314 Action Fund. All 33 Schedule-E filings are coded `S` (support Stanford); zero coded `O` (oppose)." So strictly the $3.5M was pro-Stanford, not anti-Rabb. The methodology note in Tier 3.10 sanctions the "against the progressive" framing. PASS with note. |

### Dates + day-counts

| # | Claim | Receipt source | Verdict | Notes |
|---|---|---|---|---|
| 32 | "May 19th, Pennsylvania certified the Third Congressional District primary" | Not in receipts (date is referenced in AOC tweet: "MAY 19th PA primary") | ⚠️ APPROXIMATE | Primary date confirmed via Tier 4.11 AOC quote. "Certified May 19" is asserted by script — certification date not in receipts. Soft: "On May 19th, Pennsylvania held / decided the Third Congressional District primary" would be safer than "certified." |
| 33 | "December 19th, 2025" Kimbark incorp | Tier 1.3 | ✅ EXACT | Receipts also flag this is from Drop Site only, not independently verified against Delaware Division of Corporations. Acceptable per receipts. |
| 34 | "Sixty-five days in" (Kimbark → EDW Feb 23 2026) | Tier 1.3 asserts 65 days | ❌ MISMATCH (vs calendar) | Dec 19 2025 → Feb 23 2026 = **66 days** (12 + 31 + 23). Receipts say 65. Script faithfully copied receipts. **BLOCKING-LITE:** either fix to "sixty-six days in" or change to "about two months in." Receipts file should also be corrected. |
| 35 | "day ninety-one, the second gift … 314 Action Fund" | Receipts: first IE 2026-03-10 (Tier 2.5); Kimbark→314 wire date not pinned | ❌ MISMATCH | **BLOCKING.** Dec 19 + 91 days = March 20 2026. Receipts say only "March 2026" for the Kimbark→314 wire, and the first 314 IE went out 2026-03-10 (day 81). For Kimbark→314 to be on day 91, the wire would have to land AFTER 314 had already begun spending — unlikely. Either (a) pull the FEC Schedule-A image_number per receipts "Gaps" recommendation to pin the actual date, or (b) soften to "less than three months in" and drop the precise day count. The "ninety-one-day-old Delaware shell" hook line at the top of the script is built on this number — if the date moves, the hook needs rewording. |
| 36 | "April 24th, A.O.C. endorsed Rabb" | Tier 4.11: 2026-04-24 | ✅ EXACT | |
| 37 | "April 30th, Hasan Piker … Malcolm X Park" | Tier 4.12: 2026-04-30, Malcolm X Park, West Philly, Twitch livestream | ✅ EXACT | All four details (date, location, neighborhood, Twitch) match |

### Attribution / framing claims

| # | Claim | Receipt source | Verdict | Notes |
|---|---|---|---|---|
| 38 | "Reporting from Drop Site News and Common Dreams traces the Kimbark shell back to donors aligned with A.I.P.A.C." | Tier 1.1 cites both outlets | ✅ EXACT | |
| 39 | "A.I.P.A.C. denies any connection" | **Not explicitly in receipts file** | ⚠️ APPROXIMATE | Receipts cite Drop Site + Common Dreams but don't quote/cite an AIPAC denial. Industry-standard hedge for unconfirmed shell-funding stories, but a fact-checker on X will ask for the receipt. **Recommend:** add the AIPAC statement URL to the receipts file, or soften to "A.I.P.A.C. has not publicly claimed the spend." |
| 40 | "Black Doctors COVID Consortium" Stanford bio | Not in receipts | ⚠️ APPROXIMATE | True per public record; not in receipts file. Low risk. |

## Summary

- **Total claims audited:** 40
- ✅ **Exact matches:** 25
- ⚠️ **Approximate (acceptable / soft):** 12
- ❌ **Mismatches:** 3 (BLOCKING — must fix before Step 3c)

## Mismatches needing fix (blocking)

### FIX 1 — PA-3 vote percentages (claim #19)
**Problem:** Script asserts Rabb 44%, Street 30%, Stanford 24%. No receipt covers this.
**Options:**
- **(A)** Add a Tier 5 to receipts file with PA Dept of State certified results URL, then re-pass.
- **(B)** Rewrite line to drop precise percentages: "Chris Rabb, a state rep from Mount Airy, won the plurality. State Senator Sharif Street came second. Dr. Stanford came in third."
- Recommend (A). The numbers are public and the on-screen card likely shows them — better to anchor them.

### FIX 2 — "Sixty-five days in" off-by-one (claim #34)
**Problem:** Dec 19 → Feb 23 = 66 calendar days, not 65. Script + receipts both say 65.
**Fix:** Change script to "sixty-six days in" AND correct the receipts file Tier 1.3 from "65 days" to "66 days."

### FIX 3 — "Day ninety-one" / "ninety-one-day-old Delaware shell" (claim #35, hook line)
**Problem:** Receipts pin the first 314 Action Fund IE to 2026-03-10 (day 81). Receipts do NOT pin the Kimbark→314 wire to a specific day in March. For the "ninety-one-day-old shell" framing to be accurate, the wire would have to be 2026-03-20 — after 314 had already begun IE spending, which is awkward.
**Fix options:**
- **(A) Pull the FEC Schedule-A image_number** for the Kimbark → 314 line (per receipts' own "Gaps" recommendation) and use the actual wire date. Recompute the day count. Update script and re-render the hook line.
- **(B) Soften** to "a brand-new Delaware shell … less than three months old" in both the storyline comment and the spoken hook ("A brand-new Delaware shell spent it trying to beat…"). Drop "ninety-one-day-old" and "day ninety-one" throughout.
- Recommend (A) — the precise number is the whole hook. Worth 15 minutes of FEC pull to land it.

## Non-blocking recommendations (do later, not gating)

- Add AIPAC-denial source URL to receipts (claim #39).
- Add Sharif Street title and PA-3 finish order to receipts (claims #3, #18).
- Soften "May 19th, Pennsylvania certified" → "Pennsylvania held the primary" (claim #32) — primary day vs certification day is a real distinction a hostile reader will catch.
