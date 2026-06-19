# Council Ship-Gate — cr-rabb-pa3-aipac-defeat (script v4)
Date: 2026-05-24
Gate-mode: Stage 11

## VERDICT: HOLD-PENDING-FOUNDER

One binding member (fact-check-qc) flagged a numeric inconsistency between the script and the receipts file that must be reconciled before TTS spend. Two other binding members PASS, one PASS-with-condition. No FAILs. Founder decision required on one factual framing question.

---

## Binding votes

### 05 fact-check-qc — VERDICT: HOLD

Three-way reconciliation pass against receipts file
`eng/research/2026-05-24-cr-rabb-pa3-aipac-defeat-receipts.md`:

| # | Figure in script | Receipts source | Match? |
|---|------------------|-----------------|--------|
| 1 | "lost by twenty points" (Scene 1) | Rabb 44 - Stanford 24 = 20pt | PASS |
| 2 | Rabb 44% / Street 30% / Stanford 24% (Scene 2) | Receipts: 44.2 / 29.5 / 24.1 | PASS (rounding acceptable for VO) |
| 3 | Kimbark Delaware incorp **Dec 19, 2025** (Scene 3) | Receipts confirm 2025-12-19 — but **flagged in receipts "Gaps" section as Drop Site reporting only, not independently verified against Delaware Division of Corporations** | PASS with caveat — script asserts it as documented; receipts say "low risk but flag if asserted as documented." Recommend adding "per Drop Site reporting" hedge or accept founder-level risk. |
| 4 | "ninety-one days old when it cut its first check" (Scene 1) / "Three months later, in March 2026" (Scene 3) | Receipts: incorp 2025-12-19, first FEC-reported contribution gap = **65 days, NOT 91 days** ("65 days before its first FEC-reported contribution") | **FAIL — numeric mismatch.** Dec 19 → March 2026 wire is ~70-90 days depending on exact March date; receipts explicitly state "65 days." Script says "ninety-one days." Either the script's 91 or the receipts' 65 is wrong. This is the headline narrative beat ("ninety-one-day-old foundation"). MUST RECONCILE. |
| 5 | $500K Kimbark → 314 Action Fund, March 2026 (Scene 3) | Receipts confirm | PASS |
| 6 | $500K Kimbark → EDW Action Fund "a few weeks earlier" (Scene 3) | Receipts: 2026-02-23, so ~2-3 weeks before March wire | PASS |
| 7 | "Two gifts. One million dollars. Then nothing." (Scene 3) | Receipts confirm two known gifts only | PASS |
| 8 | FEC committee C00633248 (Scenes 3, 7) | Receipts confirm | PASS |
| 9 | $3.5M IE supporting Stanford (Scene 4) | Receipts: $3,495,085.68 across 33 filings | PASS |
| 10 | "$2.75M advertising, $656K direct mail" (Scene 4) | Receipts: $2,753,955 advertising, $655,875.66 direct mail | PASS |
| 11 | "plus media production and text messages" (Scene 4) | Receipts: $76K media production, $8.5K text | PASS |
| 12 | Cori Bush $8.5M UDP spend (Scene 5) | Receipts: "nearly $9M" — receipts explicitly recommend $8.5M as conservative on-screen figure | PASS |
| 13 | Massie $15.8M from pro-Israel groups (Scene 5) | Receipts confirm Al Jazeera | PASS |
| 14 | Massie "95% of opponent's money came from the Israeli lobby" (Scene 5) | Receipts cite Massie on camera | PASS (paraphrase faithful) |
| 15 | "Rabb won by fifteen points" (Scene 5) | 44 - 30 (Street, 2nd place) = 14pt; vs Stanford 20pt. Script says "won by fifteen points." | **MINOR FAIL** — margin over runner-up (Street) is 14pt, not 15. Hook says "lost by twenty points" (Stanford margin), Scene 5 says "won by fifteen" (Street margin). Round 14.7 → 15 may be acceptable, but inconsistent with Scene 1's 20pt frame. Recommend "fifteen" → "fourteen" or "by double digits." |
| 16 | AOC endorsement April 24 (Scene 6) | Not in receipts file — needs source confirmation | **GAP** — not verified in receipts pull. Add to verification before VO. |
| 17 | Hasan Piker Malcolm X Park April 30 Twitch (Scene 6) | Not in receipts file | **GAP** — not verified. Add to verification before VO. |

Concerns:
- **Headline beat off by ~26 days.** "Ninety-one-day-old" is the most repeated motif in the script (3 mentions). Receipts say 65 days from incorp to first reported FEC contribution. If the 91 is meant to count to the *March 2026 wire to 314 Action Fund specifically*, Dec 19 + 91 = ~March 20. Plausible, but receipts state "65 days before its first FEC-reported contribution" (= the Feb 23 EDW gift). Script needs to clearly anchor which date 91 is measured to, OR change to "about three months" / "ninety-some days."
- 14 vs 15 point margin inconsistency.
- AOC/Hasan dates (Scene 6) absent from receipts file — need fact-check before TTS.

---

### 04 cincinnati-mom — VERDICT: PASS

WOULD I CLICK: yes (the surgeon-loses + Delaware-shell tease is concrete)
WOULD I FINISH: yes
WOULD I SEND IT TO SOMEONE: yes — my brother-in-law who thinks all PACs are sketchy

Neighbor's-test by scene:
- Scene 1 — Hook: I get it. A doctor lost. The interesting thing is a foundation, not the people. Good.
- Scene 2 — The race: "Mount Airy", "open seat" explained. I know what an open seat is now. The Stanford COVID-tents line made me feel for her — important, because otherwise I'd think "well why are we sad she lost."
- Scene 3 — The shell: "P.O. box in Wilmington" is a picture I can see. "An outside political group that can raise and spend unlimited money to influence a race" — that's the PAC translation I needed. Good.
- Scene 4 — Lab coat: "ad buys and mailers paid for directly by the P.A.C., never touching Stanford's campaign account" — I get the structure now. The fairness move ("good pitch on paper") keeps me from feeling lectured.
- Scene 5 — Pattern: Three races, three numbers, one variable. The Bush "nurse and pastor who fed protesters during Ferguson" tag — I know who she is now. Same with Massie quote. The reversal lands. **My only wobble:** "this is the third time this channel has shown you the same playbook" — if this is my first Campaign Receipts video, I feel left out. Not a blocker. Just a note.
- Scene 6 — What changed: AOC and Hasan Piker. I've heard of AOC. Hasan Piker I have not — but "live Twitch stream at a park" is a picture, so I roll with it.
- Scene 7 — Verdict: "AIPAC didn't lose. The shell lost." That's a real verdict. I know what they're saying.
- Scene 8 — CTA: The reframed closer ("here's what this race taught us") works. Doesn't feel scolding.

Concerns:
- None trust-breaking. Narrator doesn't sound partisan — she's tracking money, not picking a side.
- Minor: "third time this channel has shown" assumes I've watched before. One sentence acknowledging "if you're new here" would expand the funnel. Not blocking.

Specific fix: optional — none required to pass.

---

### 06 audio-qc (forward-looking) — VERDICT: PASS

Lines Jessica TTS will likely choke on — flagged for Stage 12 readability lint:

- `A.I.P.A.C.` with periods — **correct per brief**; will read as "A-I-P-A-C." Confirmed convention.
- `F.E.C.` / `P.A.C.` / `U.D.P.` / `R.J.C.` — all with periods, **correct**.
- `C00633248` — alphanumeric committee ID. Jessica may read as "C zero zero six three three two four eight" or stumble. **Recommend phonemic guidance** in Stage 12: write as "C-zero-zero-six-three-three-two-four-eight" in the TTS source, OR confirm the script's current "F.E.C. committee C00633248" gets read cleanly. Pre-emptive flag, not a block.
- "Ala Stanford" — Jessica may pronounce "Ala" as "Alabama-Ala" / "Allah" / "AY-luh." Correct is "AH-luh." **Recommend pronunciation tag** in TTS source.
- "Sharif Street" — "shuh-REEF" — Jessica usually nails this, but flag.
- "Kimbark" — non-standard word, Jessica should handle phonetically (KIM-bark).
- "Hasan Piker" — "huh-SAHN PIE-ker" — Jessica often mispronounces "Piker" as "PICK-er." Flag.
- "Mount Airy" / "Malcolm X Park" — fine.
- "JCPOA-na" tag in CONCEPTS comment — not VO, ignored.
- Numbers spelled out where needed (forty-four, thirty, twenty-four, ninety-one, five hundred thousand, three and a half million, eight and a half million, fifteen-point-eight, fifteen) — **good practice**, will TTS cleanly.
- "two-point-seven-five million" / "six hundred fifty-six thousand" — clean.
- "Drop Site News" / "Common Dreams" — fine.
- "twenty-four" the percentage (Stanford's vote) followed immediately by "Longtime Congressman Dwight Evans is retiring" — Jessica may slur the transition. Add a beat / period (script does this already with a period — confirmed PASS).

No hard blockers. All flags are Stage 12 / Stage 14 pronunciation-tag candidates, not script rewrites.

---

### storyteller-score-rubric — VERDICT: HOLD with score 9/10

| Dim | Score | Pass |
|-----|-------|------|
| story_vs_list | 10 | ✓ — cause/effect scenes, "but" / "so" turns present |
| protagonist | 10 | ✓ — Stanford humanized Scene 2, Bush humanized Scene 5 |
| turn | 10 | ✓ — Scene 5 reversal ("Bush lost. Massie lost. But Rabb won.") is the clear "wait—what" |
| hook_mrbeast | 10 | ✓ — Scene 1 opens with outcome + gap ("the most interesting thing isn't either of them — it's a foundation that was ninety-one days old") |
| rehooks | 10 | ✓ — re-hooks marked in storyline comment at 0:25 / 1:10 / 1:55 / 2:40 / 3:30 |
| clarity_jk | 10 | ✓ — "in other words" bridges present (PAC, IE both translated) |
| aha_moment | 10 | ✓ — "Same playbook. Three outcomes. One variable." + "The shell lost. AIPAC didn't." |
| sarah_voice | 10 | ✓ — Betsy cadence, no prosecutor dunk |
| **tts_facts** | **8** | **✗ — 91 vs 65 day discrepancy with receipts; 14 vs 15 point margin; AOC/Hasan dates not in receipts file** |
| cinematic_pacing | n/a (storyboard not yet built) | deferred to Stage 17 |
| visual_story_match | n/a (storyboard not yet built) | deferred to Stage 17 |

Composite (copy phase, dims 1-8): **78/80 = 97.5/100**.

Per founder rule (2026-05-22): nothing renders until composite = 100 and every dimension = 10. **`tts_facts` at 8 blocks copy lock.**

Fix before VO: resolve the three fact-check-qc HOLDs (item 4, item 15, items 16-17). Once `tts_facts` flips to 10, the rubric clears.

---

## Advisory votes (logged, non-blocking)

### 01 political-historian — PASS with one note
The donor → vote → outcome chain is framed as correlation with attribution hedges in the right places ("Drop Site / Common Dreams traces"; "AIPAC denies any connection"). No causal overreach. EDW Action Fund framing as "AIPAC-aligned conduit" leans on Drop Site reporting — acceptable given attribution. **Minor:** the 91-day count needs to match the receipts pull (see fact-check-qc).

### 02 viral-hook-specialist — PASS
Hook line 1 = "A pediatric surgeon who ran the Black Doctors COVID Consortium just lost a Philadelphia primary by twenty points." Outcome + gap structure. Curiosity payoff arrives by 0:18 ("a foundation in Delaware that was ninety-one days old when it cut its first check"). Strong. **Note:** "ninety-one-day-old foundation" is the thumb-text / title hook — if fact-check forces a change to "about three months old", the visual hook weakens. Resolve in favor of keeping a specific number on screen.

### 11 mrbeast-viral-producer — SHIP_SCORE: 9/10
RATIONALE: The three-race reversal in Scene 5 is the highest-leverage payoff and it lands; hook-to-payoff arc is tight, but the "ninety-one-day-old" motif is the entire packaging spine and it's currently in factual dispute with the receipts file.
BLOCKER: Y (per founder lock — 9/10 = HOLD)
SUGGESTED_FIX: Lock the 91-day claim against the receipts file (incorp Dec 19 → first FEC-reported wire is 65 days, not 91; the March 314 wire is ~91 days but that's not what "first check" usually means). Either change script motif to "ninety-some days" / "about three months" or change receipts methodology to match the March wire. Once locked, this is a 10.

---

## Required fixes before Stage 13 (TTS spend)

1. **Reconcile the 91 vs 65 day count** (Scene 1 + Scene 3 + Scene 8). Pick one of:
   - (a) Keep "ninety-one days" and clarify in script and receipts that the count is incorp → March 2026 wire to 314 Action Fund (the headline transaction), not incorp → first-ever FEC contribution. Update receipts file note.
   - (b) Change script to "sixty-five days old when it cut its first check" — matches receipts as written. Weaker hook but factually airtight.
   - (c) Change script to "about three months old" / "ninety-some days" — hedged but un-flaggable.
2. **Margin language consistency** (Scene 5): "won by fifteen points" should either be "fourteen" (margin over Street, the runner-up) or "by double digits." Currently inconsistent with Scene 1's 20-point Stanford margin frame.
3. **Add AOC April 24 endorsement + Hasan Piker April 30 Malcolm X Park dates** to the receipts file with primary sources before TTS render. These are in the script but not in the receipts pull.
4. **Optional (cincinnati-mom note):** add one sentence acknowledging new viewers ("If you're new here…") before "third time this channel has shown you." Not blocking.
5. **Stage 12 pronunciation tags** (audio-qc): pre-flag `Ala`, `Piker`, and committee ID `C00633248` for Stage 14 pronunciation QC.

## Founder decision required?

**YES — one question:**

> The "ninety-one-day-old foundation" line is the script's headline motif AND the packaging hook. Receipts file currently says 65 days from incorp to first FEC-reported contribution (the Feb 23 EDW gift). Do you want to (a) keep 91 and re-anchor it to the March 2026 314 Action Fund wire (the headline transaction) — and update the receipts file's methodology note to match — or (b) move to "sixty-five days" / "about three months" and lose the specific-number hook?

Recommended: **(a)** — the 91-day frame is what makes the hook land, the March wire IS the headline transaction, and the receipts file's "65 days" is just a different (earlier) measurement point. One-line edit to receipts file + tighten Scene 3 language to make clear that "ninety-one days" = incorp-to-the-314-wire.

Once founder picks (a) / (b) / (c), the three binding HOLDs collapse and the gate flips to PASS.
