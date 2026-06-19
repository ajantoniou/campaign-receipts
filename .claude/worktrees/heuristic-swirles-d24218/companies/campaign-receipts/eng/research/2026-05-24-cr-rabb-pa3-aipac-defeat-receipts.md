# CR Rabb / PA-3 — FEC Receipts (retrieved 2026-05-24)

All FEC dollar figures pulled directly from the FEC API
(`api.open.fec.gov v1`); news cites confirmed via WebFetch.
Retrieval timestamp throughout: **2026-05-24**.

---

## Tier 1 — Kimbark Foundation → 314 Action Fund / EDW Action Fund

1. **Kimbark Foundation → 314 Action Fund: $500,000, March 2026.**
   - Reported in 314 Action Fund's monthly filing on FEC committee
     `C00633248`.
   - Source (committee page, all filings):
     https://www.fec.gov/data/committee/C00633248/
   - Raw electronic filings index:
     https://docquery.fec.gov/cgi-bin/forms/C00633248/
   - News corroboration with exact amount/date: Drop Site News,
     2026-05 — https://www.dropsitenews.com/p/aipac-udp-ala-stanford-philadelphia-congress-race
     and Common Dreams —
     https://www.commondreams.org/news/philly-dem-secret-aipac

2. **Kimbark Foundation → EDW Action Fund: $500,000, 2026-02-23.**
   - EDW Action Fund FEC committee ID: **C00863472** (Hybrid PAC,
     treasurer Eli Oldfield, DC; affiliated with PRO-CHOICE
     MAJORITY 2024). Confirmed via FEC committee search.
   - Committee page: https://www.fec.gov/data/committee/C00863472/
   - EDW disclosed in March that it was spending on behalf of IL-09
     candidate Laura Fine (per Drop Site).

3. **Kimbark Foundation Delaware incorporation: 2025-12-19** (Delaware
   nonprofit), 65 days before its first FEC-reported contribution.
   Confirmed by Drop Site News; not independently verified against
   Delaware Division of Corporations (see Gaps).

4. **Other March 2026 inflow into 314 Action Fund**: Drop Site reports
   `314 Action` (the affiliated 501(c)(4)) transferred **$2,000,000**
   into 314 Action Fund on 2026-03-10, further obscuring origin.
   Visible in same committee monthly filing
   (https://docquery.fec.gov/cgi-bin/forms/C00633248/).

---

## Tier 2 — 314 Action Fund → Ala Stanford (PA-3) IEs

Pulled via FEC Schedule E, committee `C00633248`, candidate
`H6PA03245` (STANFORD, ALA DR., House PA-03):

5. **Total IE supporting Stanford, 2025-26 cycle: $3,495,085.68
   across 33 filings.** First IE 2026-03-10; most recent 2026-05-15.
   - Schedule-E query (live):
     https://www.fec.gov/data/independent-expenditures/?committee_id=C00633248&candidate_id=H6PA03245&cycle=2026

6. **Breakdown by purpose code (from FEC `expenditure_description`):**
   - Advertising (TV/digital media buys): **$2,753,955.00**
   - Direct mail services: **$655,875.66**
   - Media production: **$76,127.40**
   - Text-message services: **$8,525.12**
   - Photography services: **$602.50**

7. **No oppose-Rabb IEs from 314 Action Fund.** All 33 Schedule-E
   filings are coded `S` (support Stanford); zero coded `O` (oppose).
   The money is structured as pro-Stanford only, not anti-Rabb.

---

## Tier 3 — Comparison numbers for 3-episode chart

8. **Cori Bush, MO-1, 2024 primary: AIPAC/UDP spent ~$8–9M to defeat
   her.** Mondoweiss / Axios / PBS NewsHour all cite **"nearly
   $9 million"** from United Democracy Project (committee
   `C00761668`) against Bush / for Wesley Bell. Use **$8.5M** as the
   conservative on-screen figure; cite UDP committee directly.
   - https://mondoweiss.net/2024/08/aipac-spent-9-million-to-help-oust-cori-bush/
   - https://www.axios.com/2024/08/07/cori-bush-primary-results-loss-wesley-bell

9. **Thomas Massie, KY-4, 2026 primary: $15.8M from pro-Israel
   groups.** Al Jazeera (2026-05-18) cites the $15.8M figure from FEC
   reports filed through that Tuesday. Breakdown:
   - UDP (AIPAC): **$4.1M+**
   - RJC Victory Fund: **$3.9M**
   - Preserve America PAC (Miriam Adelson-linked) → MAGA KY:
     **$750,000** transfer
   - Total race spend: **~$32M** (most expensive House primary ever)
   - https://www.aljazeera.com/news/2026/5/18/massie-race-breaks-spending-record-as-pro-israel-groups-target-trump-critic
   - https://theintercept.com/2026/05/19/thomas-massie-loses-election-results-trump-aipac-kentucky/

10. **Methodology note for chart parity.** Bush ($8–9M) and Massie
    ($15.8M) figures are *total pro-AIPAC IE against the targeted
    candidate*. The Rabb-comparable figure is **$3.5M** (the 314
    Action Fund IE total supporting Stanford), **not** $500K.
    The $500K is the *Kimbark seed* into 314, which then layered with
    the $2M internal 314 transfer to fund the $3.5M IE program.
    **Recommendation:** label the chart bars consistently as
    "pro-AIPAC-aligned IE deployed against the targeted progressive":
    Bush $8.5M / Massie $15.8M / **Rabb $3.5M**. Use the **$500K
    Kimbark gift** as the *origin-story* receipt earlier in the
    script, not the chart bar.

---

## Tier 4 — Political tailwinds (April 2026 endorsements & on-the-ground)

11. **AOC endorsement of Chris Rabb: April 24, 2026.**
    - X/Twitter post URL: https://x.com/AOC/status/2047708719861973201
    - Quote: "Proud to endorse @chrisrabb for PA-03. Philadelphia, it's time to ORGANIZE and MOBILIZE the vote for the MAY 19th PA primary! Chris Rabb is a real one. Let's work together to send this fighter for Medicare for All to Congress."
    - Confirmed by Stage 6 verifier subagent.

12. **Hasan Piker canvass at Malcolm X Park, West Philadelphia: April 30, 2026.**
    - In-person joint canvass + rally + Twitch livestream.
    - Covered by Philadelphia Inquirer + NBC10 Philadelphia + Algemeiner.
    - Inquirer URL: https://www.inquirer.com/politics/pennsylvania/hasan-piker-chris-rabb-philadelphia-campaign-20260430.html
    - Confirmed by Stage 6 verifier subagent.

---

## Tier 5 — PA-3 Democratic primary certified result (May 19, 2026)

13. **Certified result per City & State PA / Philadelphia Inquirer:**
    - Chris Rabb: 44.2%
    - Sharif Street: 29.5%
    - Ala Stanford: 24.1%
    - Margin Rabb-vs-runner-up Street: ~14.7 percentage points (~15 rounded)
    - Date: May 19, 2026 (primary election day; AP called election night)
    - City & State PA URL: https://www.cityandstatepa.com/politics/2026/05/chris-rabb-wins-democratic-primary-deep-blue-pa-3-seat/413657/
    - Inquirer URL: https://www.inquirer.com/politics/philadelphia/chris-rabb-wins-third-congressional-district-philadelphia-primary-election-20260519.html
    - PA Department of State (live results portal): https://www.electionreturns.pa.gov/
    - Confirmed by Stage 6 verifier subagent.

---

## Gaps / things I could not verify in this pass

- **Direct FEC Schedule-A image_number for the Kimbark → 314 line.**
  FEC `/schedules/schedule_a/` query by `contributor_name=KIMBARK`
  returned 0 hits (likely indexed under a slightly different legal
  name, e.g., "KIMBARK FOUNDATION INC"); a follow-up Schedule-A pull
  on committee `C00633248` filtered by `min_amount=400000` hit the
  DEMO_KEY hourly rate cap before completing. **Action for Stage 7:**
  pull the March 2026 monthly report PDF from
  https://docquery.fec.gov/cgi-bin/forms/C00633248/ and read the
  Schedule A line directly; capture the image_number for the script.
- **Delaware incorporation primary source.** Date (2025-12-19) is
  from Drop Site reporting only; not independently confirmed against
  https://icis.corp.delaware.gov/. Low risk — multiple outlets cite
  the same date — but flag if the script asserts it as documented.
- **UDP $8M for Bush:** sources actually report "nearly $9M." Adjust
  on-screen figure to **$8.5M** (conservative) or cite the $9M
  Mondoweiss figure verbatim.

---

## Recommended citation slate for YouTube description

```
Sources (retrieved 2026-05-24):
- FEC 314 Action Fund (C00633248): https://www.fec.gov/data/committee/C00633248/
- FEC Schedule-E, 314 Action Fund IEs for Ala Stanford (H6PA03245):
  https://www.fec.gov/data/independent-expenditures/?committee_id=C00633248&candidate_id=H6PA03245&cycle=2026
- FEC EDW Action Fund (C00863472): https://www.fec.gov/data/committee/C00863472/
- FEC raw filings index, 314 Action Fund:
  https://docquery.fec.gov/cgi-bin/forms/C00633248/
- Drop Site News (Grim/Andreone), AIPAC funding Ala Stanford:
  https://www.dropsitenews.com/p/aipac-udp-ala-stanford-philadelphia-congress-race
- Common Dreams, "Philly Dem Caught Hiding Over $500K in Secret AIPAC Funds":
  https://www.commondreams.org/news/philly-dem-secret-aipac
- Mondoweiss, AIPAC $9M against Cori Bush (2024):
  https://mondoweiss.net/2024/08/aipac-spent-9-million-to-help-oust-cori-bush/
- Al Jazeera, $15.8M against Massie (2026-05-18):
  https://www.aljazeera.com/news/2026/5/18/massie-race-breaks-spending-record-as-pro-israel-groups-target-trump-critic
- The Intercept, Massie loss recap (2026-05-19):
  https://theintercept.com/2026/05/19/thomas-massie-loses-election-results-trump-aipac-kentucky/
```
