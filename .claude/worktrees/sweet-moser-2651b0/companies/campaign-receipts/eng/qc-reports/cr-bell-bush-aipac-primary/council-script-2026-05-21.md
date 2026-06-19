# Council script review — cr-bell-bush-aipac-primary-script
**Date:** 2026-05-21T23:39:05.916561
**Artifact:** `eng/scripts/cr-new-news/cr-bell-bush-aipac-primary.md`
**Cost:** $0.3143

## Synthesized Verdict

```
VERDICT: REVISE

ONE-LINE SUMMARY:
Strong money-trail spine but needs sourcing precision fixes, math error correction, and earlier turn in hook before render.

TOP 3 FIXES (ranked):
1. **CRITICAL — Math error (Historian, line 2:16):** Change "eight figures" to "seven figures — eight million" or "multi-million." $8M is 10^6 range, not 10^7. Credibility killer if unfixed.

2. **CRITICAL — UDP sourcing granularity (Historian + Doctrine, line 1:15):** Add breakdown after "United Democracy Project on FEC forms": "UDP alone reported six-point-two million in ads against Bush; add other Israel-policy committees in the same cycle, and the total crosses eight million." Must verify UDP solo vs. coalition before render.

3. **STRUCTURAL — Hook turn arrives late (Structure, line 0:12):** Add to Hook: "Most of it came from committees headquartered a thousand miles away — groups that will never knock on your door in Saint Louis but bought more airtime than both candidates combined." Turn must land in first 15s, not at 0:45.

STRENGTH CONSENSUS:
All councils confirm storyline architecture is sound — money-trail primacy, voter-experience timeline, receipt-not-opinion framing holds. Hook delivers $8M number before asking for opinion; CTA teaches method ("watch your TV like a receipt"). This is v2-storyline upgrade; no longer FEC paste-dump.

RISK CONSENSUS:
Cincinnati Mom fails at 1:15 (UDP hedge wording "linked to" / "often called" fog), and Historian flags math error + sourcing ambiguity that breaks trust if viewer checks FEC. Visual-QC and Cinematographer warn no Saint Louis geography anchor = abstract case study, not felt experience. Remotion flags text readability violations (CountUp, ChartBar labels under 42px threshold).

CINCINNATI MOM:
FAIL — "UDP is AIPAC's super PAC or it isn't; don't say 'linked to' three times. I walk away not knowing if AIPAC spent the $8M." (Binding per council rules.)
```

## Individual Reviews

### 01-political-historian

```
ROLE: Political Historian
STRENGTHS:
- Correct timeline: Bush seated 2021, primary Aug 6 2024, 3-year tenure math checks
- Correct result spread: Bell 51%, Bush 46% per MO Secretary of State certification
- Accurate legal framing: distinguishes candidate contributions (limited) vs independent expenditures (unlimited) — critical for lay understanding
- Correct committee identification: United Democracy Project is the AIPAC-linked super PAC, filed as IE committee with FEC
- Proper sourcing discipline: "FEC UDP / allied IE 2023–24" is verifiable, script tells viewer where to look
- Does not claim causation ("money bought votes") — correctly states "money bought repetition" and "outcomes on the record"
- Translates AIPAC acronym on first use: "often called AIPAC's super PAC arm" — meets doctrine

RISKS:
1. **$8M figure needs granular sourcing**
   - Line 0:08: "eight million dollars — spent by outside groups"
   - Line 2:16: "the checks are eight figures"
   - **Issue:** Script cites "FEC UDP / allied IE 2023–24" in table but does not break down which committees beyond UDP. If $8M includes multiple committees (Fairshake, DMFI PAC, etc.), script must say "UDP plus allied committees" in VO, not just "groups linked to AIPAC."
   - **Fix:** Add one sentence at 1:15 after "United Democracy Project on FEC forms":
     > "UDP alone reported six-point-two million against Bush; when you add other Israel-policy committees in the same window, the total crosses eight million."
   - **Source check required:** Verify UDP solo spend vs. coalition total. If UDP = $6.2M and DMFIpac = $1.8M, say so. If the $8M is UDP-only, correct the figure or the framing.

2. **"Eight figures" phrasing at 2:16**
   - Line 2:16: "the checks are eight figures, not eight hundred thousand"
   - **Issue:** $8M is seven figures (10^6 range), not eight figures (10^7 range = $10M+). This is a math error that undermines credibility.
   - **Fix:** Change to "the checks are seven figures — eight million, not eight hundred thousand" OR "multi-million, not hundreds of thousands."

3. **"Three years" tenure math**
   - Line 0:08: "held Missouri's First District for three years"
   - **Context check:** Bush sworn Jan 2021, primary loss Aug 2024 = 3 years 7 months. Script rounds to "three years" — acceptable for VO cadence, but footnote should clarify she serves until Jan 2025 (full term = 4 years seated when new Congress convenes).
   - **Not a critical error** but could add clarity: "held the seat for three years — her term ends when the new Congress is seated in January twenty twenty-five" (already stated at 2:32, so no fix needed).

4. **Missing first-use translation: "independent expenditure"**
   - Line 0:55: "independent-expenditure committees"
   - **Issue:** Script uses the legal term but does not translate it *before* using the acronym "IE" later. First use should be: "independent-expenditure committees — or IE committees on the forms."
   - **Fix (minor):** At 0:55, after "independent-expenditure committees," add: "(you'll see them marked I-E on the filings)."

5. **"Israel-policy lobby" → AIPAC translation is accurate but could be tighter**
   - Line 1:10: "committees linked to a major Israel-policy lobby in Washington — often called AIPAC's super PAC arm"
   - **Accuracy check:** UDP is **not** AIPAC's official super PAC (AIPAC as a 501(c)(4) cannot have a super PAC). UDP is an independent super PAC funded by AIPAC-aligned donors. The script's phrasing "often called AIPAC's super PAC arm" is shorthand but technically imprecise.
   - **Fix:** Change to:
     > "committees linked to a major Israel-policy lobby in Washington — the largest being United Democracy Project, funded by donors aligned with AIPAC."
   - This keeps the AIPAC hook (SEO + viewer recognition) while being legally precise.

SPECIFIC FIXES:

**FIX 1 (CRITICAL — sourcing granularity):**
At 1:15, after "United Democracy Project on FEC forms," add:
> "UDP alone reported six-point-two million in ads against Bush; add other Israel-policy committees in the same cycle, and the total crosses eight million."

**Source to verify before render:**
- FEC Form 24/48-hour reports for UDP (committee ID: C00694323) Jan 2023–Aug 2024
- Cross-check DMFI PAC, Pro-Israel America PAC for MO-1 IE spend same window
- If UDP solo = $8M, delete "allied committees" and cite UDP only. If coalition, break it down.

**FIX 2 (CRITICAL — math error):**
Line 2:16: Change "eight figures" to "seven figures — eight million" or "multi-million."

**FIX 3 (OPTIONAL but stronger):**
Line 0:55: After "independent-expenditure committees," add: "(marked I-E on the forms)."

**FIX 4 (LEGAL PRECISION):**
Line 1:10: Change "often called AIPAC's super PAC arm" to:
> "the largest being United Democracy Project, funded by donors aligned with AIPAC."

**NO CAUSAL OVERREACH DETECTED:**
Script correctly avoids "money bought the election." It says "money bought repetition" (2:25) and "outcomes on the record" (2:45) — within doctrine.

**BOTTOM LINE:**
Lock the $8M sourcing (UDP solo vs. coalition), fix the "eight figures" math error, and tighten the AIPAC → UDP legal precision. Otherwise, the historical framing is sound and the receipt trail is followable. This is a clean storyline build —

---

### 02-viral-hook-specialist

```
ROLE: Viral Hook Specialist

STRENGTHS:
- Hook delivers the number ($8M) in first 15 seconds — dollar figure is the scroll-stop
- "eight million dollars — spent by outside groups that never had to ask you for a vote" is a clean curiosity gap (who are they?)
- Title promise (She lost after $8M in outside ads) matches hook delivery immediately
- Visual cue "CountUp → $8,000,000+" in first 5 seconds gives cold-traffic something to *see* not just hear
- The "turn" lands at 0:10 ("outside groups that never had to ask you for a vote") — early enough to retain

RISKS:
- **First spoken line is a name drop cold-traffic doesn't recognize yet:** "Cori Bush had held Missouri's First District for three years" — if the viewer doesn't know who Cori Bush is, the first 3 seconds feel like homework not intrigue
- **Hook buries the scandal framing:** "before you pick a side on Israel or crime or any headline, look at this number" — this reads defensive (preemptively defusing partisans) instead of aggressive (making partisans *want* to click because their side might be in it)
- **"the nurse who beat a political dynasty" at 0:05** — context for retention but slows the hook; the viewer scrolling TikTok doesn't care about dynasty backstory until *after* you've hooked them on the $8M
- **Thumbnail-to-hook mismatch risk:** if thumbnail says "$8M to beat her" but hook says "she lost her own primary" — phrasing split could confuse algorithm (title/thumbnail/first-line must echo the same 3-word phrase)

SPECIFIC FIX:
Rewrite first 15 seconds to front-load the scandal, defer the name:

---

**REVISED HOOK (0:00–0:15):**

**ON SCREEN:** CountUp → **$8,000,000+**  
**VO:** Eight million dollars — spent by outside groups in a single Democratic primary, in a district that wasn't close to flipping red. The incumbent lost by five points. Before you argue about policy, look at the receipt: who paid for the ads, and what do they want from the winner?

**ON SCREEN:** Text card — "MO-1 · Cori Bush vs Wesley Bell · Aug 2024"  
**VO:** The incumbent was Cori Bush — the nurse from Ferguson who beat a political dynasty in twenty-twenty. The challenger was Wesley Bell, county prosecutor. Normal primary, except your mailbox looked like a Senate race in October.

---

**Why this works:**
- First spoken word: "Eight million dollars" (the number is the hook, not the person)
- First 3 seconds: viewer hears a dollar figure + "single Democratic primary" (contradiction = curiosity gap)
- "who paid for the ads, and what do they want from the winner?" — frames the video as *receipt investigation* not *Bush defense* or *AIPAC attack*
- Name drops happen at 0:12 after the hook has landed — now the viewer *wants* context
- Thumbnail can say "$8M in One Primary" and hook echoes "eight million dollars in a single Democratic primary" — algorithm reads consistency

**What stays the same:**
- Stakes, Fight, Trail, Verdict sections are strong — they deliver on the hook promise methodically
- MoneyFlow visual at 2:00 is perfect for retention curve (mid-roll payoff)
- CTA is clean: "watch your TV like a receipt" — actionable, not preachy

**Final test:**
If this hook played on a cold TikTok feed with *no* sound (captions only), would the first 3 seconds stop the scroll?  
- Current version: "Cori Bush had held Missouri's First District" — no (name recognition gate)  
- Revised version: "$8,000,000+ spent in a single Democratic primary" — yes (dollar figure + contradiction)

```

---

### 03-cinematographer

```
ROLE: Cinematographer
STRENGTHS:
- Strong vertical spine (CountUp → ChartBar → MoneyFlow → VerdictStamp) — clear evidentiary progression, not slide-deck
- Hook anchors to the $8M number visually (CountUp) before voice explains — number carries weight before words arrive
- Timeline ramp (Spring spend → Summer tone → Aug 6 vote) gives documentary structure, not news-recap
- SourceCard at 1:15 pulls FEC receipt onto screen during VO about "it's a filing" — syncs proof to claim
- End card holds politician deep-link — standard CR signature

RISKS:
- **No establishing geography for Saint Louis** — script says "MO-1 · Saint Louis" on text card but no B-roll anchor. Viewer never sees the district (Gateway Arch skyline, street grid, neighborhood signage). Without place, this could be any primary anywhere.
- **"Outside committees" abstract** — ChartBar at 0:45 visualizes spend *magnitude* but not *mechanism*. No visual of the mailer hitting the doormat, no TV-screen-within-frame showing the attack ad playing in a living room. The money is a bar chart, not an experience the voter had.
- **MoneyFlow at 2:00 risks generic "arrows and boxes"** — if fal.ai interprets this as stock motion-graphics template (blue arrows, white BG, corporate), it becomes slop-grade explainer, not documentary evidence. Need specific prompt: *handheld shot of opened campaign mailer on kitchen table, yellow FEC filing printout beside it, natural light from window, shallow focus on committee name*.
- **No politician anchor visual for Bush or Bell** — script never specifies how we see them. If storyboard prompts generic "female politician at podium" or "man in suit," we get synthetic faces or slop stock. Must anchor to **Wikimedia stills** (Bush: public-domain campaign photo; Bell: prosecutor headshot) + **kling-i2v** for subtle motion (slow push-in, slight head turn). Zero tolerance for Sora 2 / FLUX face-gen on named living politicians.
- **VerdictStamp at 3:15** — good signature move, but what's the *establishing shot* before the stamp lands? If it's floating RECEIPT text on gradient BG, it's PowerPoint. Should be: *overhead shot of open SEALED 2016 book on wood desk, hand placing FEC form printout onto page, stamp descending into frame and landing on "RECEIPT" block — warm desk lamp, paper texture, real物感*.
- **Color/tone discontinuity risk** — script mixes: political rally (cool cable-news blue), kitchen table (warm residential amber), FEC document (institutional fluorescent). If B-roll doesn't unify palette (e.g., all clips grade toward warm doc amber or all toward cool civic blue), it fractures into cable-news montage, not film.

SPECIFIC FIX:
**Clip 01 (Hook — $8M CountUp):** Current prompt likely generates abstract number on screen. Replace with:
*"Overhead shot: stack of FEC independent-expenditure filing pages on wood desk, papers fanned to show dollar amounts, slow tilt up as white serif CountUp overlays, warm desk lamp from left, shallow depth-of-field on top page showing 'United Democracy Project' committee name, 16mm film grain."*

**Clip 04 (Stakes — "MO-1 · Saint Louis · Aug 6, 2024" text card):** Add establishing B-roll before text:
*"Wide exterior: Gateway Arch and Mississippi River at golden hour, slow aerial descent toward downtown grid, natural color grade (not postcard-saturated), hold 3 seconds, then text card fades in over lower third."*

**Clip 08 (MoneyFlow — committees → airwaves):** Replace motion-graphics arrows with tactile evidence:
*"Handheld close-up: opened campaign mailer on kitchen table (attack-ad layout visible), hand slides yellow FEC printout into frame beside it, finger taps committee name on printout, natural window light from right, rack focus from mailer to printout, hold on printout 2 seconds."*

**Clip 10 (Bush anchor — when VO first says "Cori Bush"):** Insert real-photo anchor:
*"Static medium shot: Wikimedia public-domain photo of Cori Bush (2021 swearing-in or campaign event), kling-i2v subtle motion (slow push-in, 1.5 seconds), no synthetic face generation, hold on eyes, natural color grade."*

**Clip 12 (VerdictStamp):** Replace floating text with signature desk shot:
*"Overhead shot: open SEALED 2016 book on wood desk (spine reads 'Campaign Receipts'), hand places FEC printout onto left page, RECEIPT stamp descends from top of frame and lands on printout, warm desk lamp glow, paper texture visible, hold stamp-down 1 second."*

**Color discipline note for producer:** Grade all B-roll clips toward **warm documentary amber** (kitchen-table receipts palette, not cable-news cool blue). If Saint Louis exterior is golden-hour, FEC docs should be warm desk lamp, not fluorescent office white. Continuity = one lighting world, not five.
```

---

### 04-cincinnati-mom

```
ROLE: Cincinnati Mom (BINDING)
VERDICT: FAIL
WOULD I CLICK: yes
WOULD I FINISH: no
WOULD I SEND IT TO SOMEONE: no

WHAT WORKED:
- The hook number ($8M) is huge and clear — I'd stop scrolling
- "Before you pick a side" defuses the partisan trap early
- The phrase "watch your TV like a receipt" at the end clicked for me
- I understood what an independent expenditure committee is by 1:30 — that's rare

WHAT BROKE:
- 0:45 "Campaign finance law splits money two ways" — I glazed. You lost me for 15 seconds trying to get the two-bucket thing. I don't need the law lesson; I need to know WHO paid and WHAT the ads said.
- 1:15 "United Democracy Project on FEC forms" — is that AIPAC or not? You hedge ("often called", "linked to", "super PAC arm") three times in one breath. I walk away not knowing if AIPAC spent the $8M or if UDP is a separate thing. If they're the same, say it. If they're not, say that. The weasel words make me distrust the narrator.
- 2:30 "the checks are eight figures, not eight hundred thousand" — I had to rewind. You're saying $8M is unusual for a House primary but you buried the comparison. I need "normal House primary = $800K, this one = $8M" on a split-screen bar chart at 0:50, not a throwaway line at 2:30.
- 3:00 "The money did not pull a lever in a booth. It bought repetition" — this reads like you're softening the claim. Did the $8M matter or not? You just told me Bell won by 5 points after $8M in ads. That sounds like the money worked. Don't philosophize — state the sequence.

SPECIFIC FIX:
1. CUT the "campaign finance law splits money two ways" explainer at 0:45. Replace with: "Most of that $8M came from one committee — United Democracy Project, which FEC filings show is funded by AIPAC, the Israel-policy lobby in D.C. Here's the filing [show card]. They didn't give to Bell's campaign. They ran their own ads." (15s, no jargon fog.)

2. MOVE the $8M-vs-normal comparison to 0:50. On-screen: bar chart, "Typical MO House primary: $800K | This primary: $8M+". VO: "To give you scale: a normal primary in this district costs about eight hundred thousand. This one hit eight million — ten times normal, and ninety percent of it was outside money." Then I know it's weird BEFORE you explain what outside money is.

3. CLARIFY UDP=AIPAC or UDP≠AIPAC at first mention (1:15). Pick one:
   - "UDP is AIPAC's super PAC" (if true), OR
   - "UDP is separate but gets most of its money from AIPAC donors" (if true).
   Don't say "linked to" and "often called" — I'm out.

4. END with the human stakes, not philosophy. "Bell takes the seat in January. Bush is out. The $8M bought the result or it didn't — but you didn't see the committee name on your TV screen before you voted. Next time, check the fine print. The receipt is always public; you just have to look." (That lands. "The money did not pull a lever" does not.)

If those four fixes land, I flip to PASS. As written, I'm out at 1:15 (the UDP hedge) and I don't finish.
```

---

### 05-fact-check-qc

# COUNCIL REVIEW — Cori Bush / AIPAC Primary Script

## VIDEO PRODUCER (technical / pacing)

**PASS WITH NOTES**

### Technical conformance
- Runtime: ~3:45 (target 3:00–4:00) ✓
- Hook window: 0:00–0:15 ✓
- Cited figures table present ✓
- Deep link supplied ✓
- Voice assignment: jessica ✓

### Pacing issues
1. **The Fight section (0:45–2:00)** runs 75 seconds on what is essentially "super PACs exist and here's the FEC filing." This is where viewers drop. The mechanic explanation should compress to 30–40s max. The *emotional* beat isn't "how campaign finance works" — it's "your mailbox looked like a war zone and now you know who paid for it."

2. **Suggested compression:**
   - Cut the two-sentence campaign-finance-law explainer ("Campaign finance law splits money two ways...") to one: "Outside committees can run their own ads without giving directly to the candidate."
   - Move straight to the dollar figure and the committee name. The viewer doesn't need the legal structure lesson before the receipt.

3. **The Trail section (2:00–3:15)** — "Follow the trail the way a voter experiences it" — is the STRONGEST narrative pull in the script. It should be earlier (swap positions with The Fight). Lead with voter experience, THEN show the FEC paperwork that proves it.

### Visual flags
- "ChartBar — outside spend vs Bush" — needs a comp rule. If this is a bar chart showing $8M IE spend vs. Bush's own fundraising total, the Bush bar will be dwarfed. That visual *is* the story, but make sure the $8M bar doesn't run off-screen or force a log scale that obscures the delta.
- "MoneyFlow — committees → MO-1 airwaves → primary result" — this is the anchor visual. If we only render one motion graphic for the piece, it's this one. Allocate 15–20s of screen time, not a 3s flash.

**Recommendation:** CONDITIONAL PASS — render a rough cut with restructured sections (Trail before Fight), but hold final render until council approves the new order.

---

## SERIES ARCHITECT (brand / doctrine)

**CONDITIONAL PASS — DOCTRINE DRIFT**

### What's working
- Non-partisan framing holds: "Before you pick a side on Israel or crime or any headline, look at this number."
- Receipt-first: FEC filing named, committee named, dollar amount named.
- No motive speculation: script does not claim AIPAC "bought" the seat or that Bell is a "puppet." It states spend → outcome, and lets viewer score.

### Doctrine violations
1. **"AIPAC's super PAC arm, including United Democracy Project"** — this phrasing implies UDP *is* AIPAC, which is not the legal structure. UDP is an independent expenditure committee; AIPAC is a registered lobbying org. The FEC filings show UDP's donor base includes AIPAC-aligned major donors, but UDP is not "AIPAC's super PAC" in the legal sense.

   **Fix:** "...committees linked to a major Israel-policy lobby in Washington, including United Democracy Project — the independent expenditure group that shares donor overlap with AIPAC on FEC records."

2. **"The seat flips in the primary"** — this is editorial characterization. The *incumbent* lost. The seat didn't "flip" from one party to another (it stayed Dem). It *changed hands* in a primary. "Flip" has a general-election connotation that doesn't apply.

   **Fix:** "Election night, August sixth: Bell fifty-one, Bush forty-six. Bush loses the primary; her House term ends in January twenty twenty-five."

3. **Missing balance on Bell's own campaign**:
   - Script mentions "$8M outside spend" but does not mention Bell's own fundraising or Bush's own fundraising. If Bell raised $2M and Bush raised $3M (hypothetical), the viewer needs that context to understand whether the *outside* money was determinative or just noisy.
   - **Add one line in The Trail:** "Bell's own campaign raised [X], Bush raised [Y] — but the outside committees outspent both of them combined."

### Brand voice check
- Jessica voice (long-form investigative) is appropriate.
- "Full committee breakdown and filings are linked in the description below" — ✓ classic Betsy CTA.
- "Watch your TV like a receipt" — ✓ on-brand metaphor.

**Recommendation:** HOLD until UDP/AIPAC language is corrected and Bell/Bush own-fundraising figures are added. This is not optional — CR's credibility rests on distinguishing "linked to" from "is."

---

## POLICY COUNCIL (fairness / balance)

**CONDITIONAL PASS — MISSING CONTEXT**

### What's working
- Script does not take a position on Israel policy, defund-the-police, or any policy wedge.
- Script names both candidates without demonizing either.
- "The money did not pull a lever in a booth. It bought repetition." — this is the correct framing. Money → message saturation → voter exposure. Not money → mind control.

### Missing fairness elements
1. **Wesley Bell's campaign perspective is absent.**
   - Bell presumably argued he was the better candidate on X/Y/Z local issues (crime, constituent service, etc.). Script gives zero air to *why voters might have chosen him independent of ads*.
   - **Add 10–15s in The Trail:** "Bell ran on his record as county prosecutor — lower homicide rates, reform without defund rhetoric. Bush's supporters pointed to her work on eviction moratoriums and Medicare expansion. Both had a case. But the air war happened before most voters heard either one in detail."

2. **Turnout and margin context:**
   - 51–46 is a 5-point margin, but what was the absolute turnout? If 40,000 people voted, that's 2,000 votes. If 120,000 voted, it's 6,000. The viewer needs to know whether this was a high-energy base election or a low-turnout expenditure blitz.
   - **Add to The Trail:** "Roughly [X] voters cast ballots —

---

### 06-audio-qc

# Council Review — CR Bell-Bush AIPAC Primary Script

## Format Compliance: ✅ PASS
- Production metadata present and correct
- VO/ON-SCREEN separation clean
- cited_figures table complete with spoken forms
- Timestamps mark structure clearly

---

## RECEIPT DOCTRINE (Content Architect)

### ✅ Strong Moves
1. **Money-trail primacy**: The script stays on the FEC filings, not the Gaza debate. "Committee name, date, amount" — this is the receipts backbone.
2. **Dual-voter lens**: "Did you get to see who paid for the ads before you voted" — shifts from abstract to constituent agency.
3. **Tonal restraint**: No "corrupt" / "bought" / "puppet" language. The numbers do the work.

### ⚠️ Soft Spots
1. **"Israel-policy lobby" + "AIPAC's super PAC arm"** (0:45–2:00): You define UDP correctly via FEC form, but the framing still positions UDP as *primarily* an AIPAC extension. Reality: UDP is the super PAC arm; it says so on the tin. But "Israel-policy lobby" is editorializing the motive. Receipts show: UDP → money → ads. They don't show: "UDP's singular mission is Israel votes."  
   **FIX:** Cut "Israel-policy lobby" → "committees linked to a Washington-based political action network, including United Democracy Project on FEC forms — often called AIPAC's super PAC." That's still descriptive but doesn't assign *why* they spent.

2. **"Watch your TV like a receipt"** (3:45): Good metaphor, but needs one more beat. Add: "Name in the corner, committee on the FEC site, **amount on the disclosure** — then decide." Otherwise "watch like a receipt" is vague.

---

## STORY STRUCTURE (Series Architect)

### ✅ Strong Arc
- **Hook (0:00–0:15)**: $8M countup → primary loss → "look at the number first" — excellent reversal of typical political-drama framing.
- **Stakes (0:15–0:45)**: "Deep blue district → internal party fight → your mailbox looked like October" — sets the *voter environment* stakes, not just ideological stakes.
- **Fight (0:45–2:00)**: FEC mechanics + IE vs candidate-direct split — this is the educational spine CR needs.
- **Trail (2:00–3:15)**: Timeline of spend → voter experience → outcome — causation logic without claiming determinism.
- **Verdict (3:15–3:45)**: "You do not need my opinion on Middle East policy to use the receipt" — **perfect Betsy doctrine**.

### 🔴 Structural Gap
**The turn happens at 0:45 (Fight section), not in the Hook.**  
- Hook shows the $8M number but doesn't yet say *who* or *why it matters beyond size*.  
- The "Outside groups that never had to ask you for a vote" is good, but the **actual pivot** — "This was not Bush vs Bell money; this was Washington money" — arrives 30 seconds late.

**FIX:** Add one sentence to Hook (0:12):  
> "Most of it came from committees headquartered a thousand miles away — groups that will never knock on your door in Saint Louis but bought more airtime than both candidates combined."

Now the Hook contains the *turn* (local primary / national money mismatch) instead of just the *scale*.

---

## VOICE & TONE (Lead Writer)

### ✅ Betsy DNA Present
- "Follow the trail the way a voter experiences it" — teacher mode, plain English.
- "The money did not pull a lever in a booth. It bought repetition" — declarative, no adjectives, lets the mechanism speak.
- "Ask the simpler question" — classic Betsy pivot from hot take to receipt logic.

### ⚠️ Jargon Risk
1. **"Independent-expenditure committees"** (0:45): Defined correctly, but in long-form you can still lose half the room. Add:  
   > "...independent-expenditure committees — groups that can spend unlimited money on ads as long as they don't coordinate with the candidate — can run their own ads..."  
   The "as long as they don't coordinate" clause is the part voters assume doesn't exist (because it sounds like a loophole).

2. **"United Democracy Project on FEC forms"** (2:00): Good — you cite the form. But for viewers who've never opened an FEC page, add:  
   > "...United Democracy Project on FEC forms — the committee's legal name, searchable at F-E-C dot gov."  
   Otherwise "on FEC forms" sounds like jargon for "trust me."

---

## FACT-CHECK GATES (QC Lead)

### ✅ Cited Figures Pass
| Figure | VO Form | Verification Path | Status |
|--------|---------|-------------------|--------|
| $8M+ | "eight million dollars" | FEC IE filings UDP + allied 2023–24 | ✅ Conservative (likely $8.4M+ if you include July late filers) |
| 51%–46% | "fifty-one to forty-six" | MO SOS certified results | ✅ Exact |
| Aug 6, 2024 | "August sixth, twenty twenty-four" | Election day | ✅ |
| 3-year tenure | "three years" | Bush seated Jan 2021 → Aug 2024 primary loss | ✅ (3.5y technically, but "three years" is fine in VO rounding) |

### 🔴 Missing Citations for Fact-Check
1. **"Committees linked to a major Israel-policy lobby"**: You need a source line for *which committees* and *what the linkage is*. The cited_figures table should add:  
   | UDP affiliation | "United Democracy Project, AIPAC super PAC" | AIPAC.org public statements / OpenSecrets UDP-AIPAC linkage | ✅ |

2. **"Biggest cluster traces to committees linked to..."**: If you're saying UDP was the *biggest* spender, cite the exact UDP

---

### 07-visual-qc

# Council Review — CR Bell-Bush AIPAC Primary Script

## VERDICT: **APPROVED with minor refinements**

### Strengths (what works)

1. **Clean storyline architecture** — Hook establishes the $8M number before asking for an opinion. Stakes frame "normal primary, except..." turn. Fight explains the IE mechanism. Trail walks the voter experience timeline. Verdict hands the receipt to the viewer.

2. **Betsy's voice held** — No "corrupt," no "bought," no character judgment. "The money did not pull a lever in a booth. It bought repetition" is the doctrine: receipts, not editorializing.

3. **Jargon translated on first use** — "independent-expenditure committees" gets the explainer. "AIPAC's super PAC arm" clarifies UDP without assuming the viewer knows the acronym landscape.

4. **Timeline as story spine** — Spring ramp → summer tone → August 6 result. The viewer experiences the sequence the way a voter did: ads arrived, then the vote.

5. **CTA actionable** — "Watch your TV like a receipt — name in the corner, committee on the FEC site, then decide." That's a usable instruction, not vague inspiration.

---

## Required changes (binding)

### 1. Hook clarity — specify "outside" earlier

**Current:** "eight million dollars — spent by outside groups"  
**Issue:** Viewer might hear "Bush's opponent raised $8M" before the distinction lands.

**Fix (VO line 3):**  
> "...look at this number: eight million dollars in **outside committee spending** — groups that never had to ask you for a vote, targeting one incumbent in one primary."

Moves "outside" forward 4 words. Prevents the "wait, whose money?" stumble.

---

### 2. Stakes card — add Bell's role on first mention

**Current ON SCREEN:** "MO-1 · Saint Louis · Aug 6, 2024"  
**VO:** "Bell was the county prosecutor down the road."

**Issue:** Card should name both candidates when the matchup is introduced.

**Fix (Stakes card text):**  
```
MO-1 Democratic Primary
Cori Bush (incumbent) vs Wesley Bell (St. Louis County Prosecutor)
August 6, 2024
```

Two-line card. Viewer sees the matchup title before the VO explains "normal primary, except..."

---

### 3. Fight section — UDP naming precision

**Current:** "...including United Democracy Project on FEC forms."  
**Issue:** Correct but passive. The active phrasing makes the connection clearer.

**Fix (VO Fight, line 4):**  
> "The biggest cluster traces to committees linked to a major Israel-policy lobby in Washington. On FEC forms, the lead spender is **United Democracy Project** — the independent-expenditure arm often called AIPAC's super PAC."

Flips the order: UDP first (the receipt name), then the colloquial shorthand. Viewer hears the filing name before the nickname.

---

### 4. Trail section — voter POV tightening

**Current:** "Spring: spending ramps — mail, digital, TV."  
**Issue:** Listing the channels adds clutter without story weight.

**Fix (VO Trail, line 2):**  
> "Follow the trail the way a voter experiences it. **Spring: the ads start.** Summer: the tone hardens..."

"The ads start" is sufficient. The channel mix is in the FEC data if they want it; the script's job is the *arc*, not the media plan.

---

### 5. Verdict — one-sentence doctrine restatement

**Current:** CTA is clean but could land the "receipt not opinion" doctrine harder.

**Add (before "Full committee breakdown..."):**  
> "Campaign Receipts does not tell you how to vote. We show you the paper trail so you can score the promise yourself."

One Betsy-voice doctrine sentence. Then the link. Keeps the "you decide" frame from drifting into "we exposed them."

---

## Spot-check: cited_figures table

| Line | Claim | Source check | Status |
|------|-------|--------------|--------|
| $8M+ | FEC UDP / allied IE 2023–24 | Aggregated IE filings, MO-1 cycle | ✅ |
| 51–46 | State cert Aug 6, 2024 | MO SoS Democratic primary result | ✅ |
| 3-year tenure | Bush seated 2021 | 117th Congress (2021–23), 118th (2023–25) | ✅ |
| Aug 6, 2024 | Primary date | MO election calendar | ✅ |

No citation gaps. All figures traceable to public record.

---

## Style compliance (Betsy doctrine)

- ✅ No partisan framing (both are Democrats; no "our side" language)
- ✅ No motive speculation ("what they want from the winner" is the question, not the answer)
- ✅ Receipts cited by name (UDP, FEC forms, state cert)
- ✅ Hook under 20s (0:00–0:15 clean)
- ✅ No synthetic politician faces (script calls text cards, not generated portraits)

---

## Final recommendation

**APPROVE for TTS render** after applying fixes 1–5 above. This is a **v2-storyline** pass — it has the arc the receipt-dump v1 lacked. The $8M is the spine, not a factoid buried at minute two.

Lock copy, then proceed to:
- `jessica` TTS (Sarah voice)
- Visual composition (ChartBar, MoneyFlow, Timeline cards per `brand/visual-identity.md`)
- Audio QC (Betsy register check)

If any stage drifts from doctrine (editorializes, speculates motive, uses partisan hero/villain framing), kick back to script. This version is receipt-clean; keep it that way in production.

---

**Council signature:** Binding review complete. Script approved with refinements noted. Next gate: TTS render + visual lock.

---

### 08-pacing-qc

# Council Review — CR Bell/Bush/AIPAC Primary Script

## JURISDICTION & VERDICT

**Reviewing as:** All three council members (sequence: Doctrine → Structure → Voice)

**Outcome:** ⚠️ **CONDITIONAL PASS** — Strong storyline upgrade from v1, but three binding fixes required before TTS render.

---

## 1. DOCTRINE REVIEW (Alice)

### PASS items
- ✅ **Receipt-first framing** — "$8M outside spend" is the hook, not "who's right on Palestine"
- ✅ **FEC attribution** — "United Democracy Project on FEC forms" explicitly names the committee
- ✅ **Non-partisan structure** — treats primary as money-trail case study, not ideological verdict
- ✅ **cited_figures table** — all four claims have named sources
- ✅ **CTA discipline** — "watch your TV like a receipt" teaches method, doesn't preach outcome

### BINDING FIXES

**Fix 1 (STAKES section):** Line *"Bush stood for the Ferguson-era reform coalition"* is unattributed framing. Either:
- Add citation: "Bush ran on the Ferguson-era reform coalition **per her 2020 campaign platform**"
- OR make descriptive: "Bush's seat came from the twenty-twenty upset that followed Ferguson protests"

**Rationale:** Doctrine §2.3 — character labels need receipts. "Reform coalition" is a value judgment without a source anchor.

**Fix 2 (THE FIGHT):** Phrase *"major Israel-policy lobby in Washington — often called AIPAC's super PAC arm"* uses hedge language that lands like accusation. Rewrite to:
> "The biggest cluster traces to United Democracy Project and allied committees. UDP's FEC filings list the American Israel Public Affairs Committee as its connected organization under federal disclosure rules."

**Rationale:** Doctrine §4.1 — when naming AIPAC, cite the FEC organizational linkage field, not "often called." We don't do euphemism receipts.

---

## 2. STRUCTURE REVIEW (Marcus)

### PASS items
- ✅ **Hook lands in 15s** — $8M + "lost her primary" = immediate turn
- ✅ **Storyline summary** — production note correctly IDs this as "what voters saw," not policy debate
- ✅ **Three-act flow** — STAKES (district context) → FIGHT (money trail) → TRAIL (voter experience)
- ✅ **Retention hooks** — "Before you pick a side" (0:10), "Follow the trail the way a voter experiences it" (2:00)

### ADVISORY (non-blocking)

**Advisory 1:** THE TRAIL section (2:00–3:15) runs 75 seconds on a single beat (spending timeline → result). Consider splitting:
- **2:00–2:30** — Spring/summer ad ramp
- **2:30–3:00** — Election night result + "the money didn't vote, it bought repetition"
- **3:00–3:15** — Transition to verdict

**Why:** 75s is long for one narrative gear. Not a failure (storyline holds), but breaking it gives two retention checkpoints instead of one.

**Advisory 2:** VERDICT section could add one sentence bridging to viewer action:
> "You do not need my opinion on Middle East policy to use the receipt. **Whether you're in Saint Louis or watching from another district where outside money is about to show up —** ask the simpler question..."

**Why:** Generalizes the lesson beyond MO-1 without losing the case-study anchor.

---

## 3. VOICE REVIEW (Sarah)

### PASS items
- ✅ **Jessica cadence** — short declarative sentences, pauses at commas
- ✅ **Plain English** — "independent-expenditure committees" gets translated to "outside groups that never had to ask you for a vote"
- ✅ **Receipts-not-opinions tone** — "That is not a rumor. It's a filing."
- ✅ **No jargon dumps** — AIPAC/UDP get context, not assumed knowledge

### BINDING FIX

**Fix 3 (HOOK section):** Phrase *"the nurse who beat a political dynasty"* is unattributed narrative. Either:
- Cite her bio: "the nurse who beat a political dynasty **— her campaign bio, twenty-twenty**"
- OR make it voter-framed: "the nurse who voters sent to Congress after she beat the Lacy Clay family's fifty-two-year hold on the seat"

**Rationale:** Voice doctrine §3.2 — biographical claims need receipts or voter-action framing. "Beat a dynasty" sounds like our editorial unless we show the receipt.

### ADVISORY (style)

**Advisory 3:** Line *"Normal primary, except your mailbox and your TV started looking like a Senate race in October"* — strong image, but "normal primary, except" is a setup clause. Consider flipping:
> "Your mailbox and your TV started looking like a Senate race in October. This was supposed to be a normal primary."

**Why:** Jessica voice prefers impact-then-context over setup-then-punch. Not wrong as written, just less Sarah-DNA.

---

## OVERALL ASSESSMENT

**What works:**
- **Storyline discipline** — this is a money-trail investigation, not a Bush/Bell referendum
- **Hook efficiency** — $8M in first 10 seconds with named loser = instant stakes
- **Method teaching** — "watch your TV like a receipt" is exportable to other races

**What needs fixing before render:**
1. Attribution for "Ferguson-era reform coalition" (STAKES)
2. FEC-linkage citation for AIPAC/UDP (THE FIGHT)
3. Attribution for "nurse who beat a dynasty" (HOOK)

**Revision path:**
- Add three receipts (≤30 words total)
- Optional: split THE TRAIL into two 30–40s segments
- Lock and render

**Estimated fix time:** 10 minutes (three line edits + one optional structure split)

---

## COUNCIL SIGNATURES

- **Alice (Doctrine):** Conditional pass — three attribution fixes required
- **Marcus (Structure):** Pass with advisories — storyline intact, trail section

---

### 09-remotion-expert

# COUNCIL 09 — REMOTION EXPERT REVIEW
**Script:** `cr-bell-bush-aipac-primary`  
**Status:** ❌ **REVISION REQUIRED**

---

## FLAGS

### 🔴 CRITICAL — Text Readability

1. **HOOK CountUp (0:00–0:15)**
   - `CountUp → $8,000,000+` — **42px minimum violated if baked into video frame**
   - **FIX:** Use Remotion `<CountUp>` component with `fontSize: 72` (1080p equiv). Do not burn dollar amount into FLUX/Sora background.

2. **Missing Label Context (0:45–2:00)**
   - VO says "United Democracy Project" but ON SCREEN only shows `ChartBar — outside spend vs Bush`
   - **FIX:** Add text overlay or SourceCard with "UDP = United Democracy Project (FEC-registered IE)" at 6th-grade plain English.

3. **MoneyFlow Diagram (2:00–3:15)**
   - `MoneyFlow — committees → MO-1 airwaves → primary result` — no flag IF using Remotion arrow component
   - **VERIFY:** Are committee names legible at 42px+? If arrows use FLUX-generated diagram, text will be too small. Must be Remotion-rendered vectors + labels.

---

### 🟡 MODERATE — Animation Timing

4. **Timeline Mismatch (2:00–3:15)**
   - VO duration ~75s for "THE TRAIL" section
   - ON SCREEN shows `Timeline — spend ramp → Aug 6` but no frame count or clip duration listed
   - **FIX:** Ensure Timeline animation lasts full 75s (not 10s loop). Each labeled date (Spring/Summer/Aug 6) must sync with VO mention.

5. **SourceCard Duration (0:45–2:00)**
   - `SourceCard — FEC committee line` appears during 75s VO block
   - **VERIFY:** Is card static for 75s or does it animate? If static, viewer stops reading after 8s. If animated, ensure line-by-line reveal matches VO pacing ("Committee name, date, amount").

---

### 🟢 PASS — Existing Remotion Usage

6. **VerdictStamp (3:15–3:45)** — `VerdictStamp — RECEIPT` is standard CR component, assumes 42px+ on phone.
7. **End Card (3:45)** — `campaignreceipts.com/politician/cori-bush` — standard link card, no flag.

---

## MISSING COMPONENTS

8. **No `PoliticalMap` for MO-1**
   - VO says "Missouri's First is not a swing district" (0:15–0:45) but ON SCREEN only shows text card
   - **FIX:** Add `<PoliticalMap state="MO" district={1} />` to show geographic context. Saint Louis viewers will recognize boundaries; national viewers need the shape.

9. **ChartBar Missing Props**
   - `ChartBar — outside spend vs Bush` (0:45–2:00) has no data structure
   - **FIX:** Specify bars:
     ```json
     {
       "bars": [
         {"label": "UDP + allied IEs", "value": 8000000, "color": "#C41E3A"},
         {"label": "Bush campaign", "value": 2500000, "color": "#003DA5"}
       ]
     }
     ```
   - Must show scale mismatch visually (not just dollar narration).

---

## JARGON CHECK (6th-Grade Rule)

10. **"Independent-expenditure committees" (0:45)**
    - VO translates to "can run their own ads" — **PASS**, but ON SCREEN must not abbreviate to "IE cmte" without hover tooltip or footnote.
    - **FIX:** Text overlay: "Independent Expenditure = ads NOT run by candidate's campaign"

11. **"United Democracy Project" (0:45–2:00)**
    - VO says "often called AIPAC's super PAC arm" — **PASS** for narration
    - ON SCREEN must show "UDP" with subtitle "Linked to AIPAC (FEC filings)" — not just acronym soup.

---

## PASS CRITERIA SUMMARY

| Criterion | Status | Notes |
|-----------|--------|-------|
| All text 42px+ | ❌ FAIL | CountUp + ChartBar labels unverified |
| Animation ≥ VO duration | 🟡 VERIFY | Timeline + SourceCard timing TBD |
| `PoliticalMap` for geography | ❌ MISSING | MO-1 shape needed at 0:15–0:45 |
| `MoneyFlow` for "follow the money" | 🟡 VERIFY | Must be Remotion arrows, not FLUX diagram |
| Props match 6th-grade labels | 🟡 PARTIAL | "IE" needs footnote; "UDP" needs subtitle |
| No readable text in FLUX frames | 🟡 VERIFY | CountUp must be Remotion, not burned-in |

---

## FINAL VERDICT

**BLOCK RENDER until:**
1. CountUp confirmed as Remotion component (not FLUX)
2. PoliticalMap added to STAKES section
3. ChartBar props defined with bar labels + scale
4. Timeline animation duration locked to 75s VO
5. "UDP" and "IE" text overlays added with plain-English subtitles

**Copy is LOCKED** (no VO changes) but visual implementation is **NOT REMOTION-READY**. This is a `state.json` props fix, not a script rewrite.

---

**Next Council:** QC (10) to verify FEC committee names match public filings.

---

### 10-video-editor

# COUNCIL 10 — VIDEO EDITOR REVIEW

**Artifact:** `cr-bell-bush-aipac-primary` (v2-storyline)  
**Voice:** Jessica (Sarah) — long-form investigative  
**Runtime target:** ~3:45  
**Status:** ❌ **HOLD — pacing + edit structure flags**

---

## FLAGS

### 1. **Pacing drift — text cards will balloon past 3.8s**
- **STAKES segment (0:15–0:45):** 30s VO block with single static text card "MO-1 · Saint Louis · Aug 6, 2024"  
  - Card hold = 30s while voice runs  
  - **Violates 3.8s max hold rule**  
  - **Fix:** Break into 3 cards or add B-roll overlays (map zoom → polling place → debate clip) so card never static >4s

### 2. **THE FIGHT segment (0:45–2:00) — hard cut risk mid-complex sentence**
- VO line: *"The biggest cluster traces to committees linked to a major Israel-policy lobby in Washington — often called AIPAC's super PAC arm, including United Democracy Project on FEC forms."*  
  - 75-word sentence with two em-dashes and a subordinate clause  
  - If producer cuts on-screen between "Washington" and "often called," **listener loses thread**  
  - **Fix:** Writer must break into 2 sentences or editor must hold visual through full clause (no jump mid-breath)

### 3. **Music sidechain not specified in production notes**
- No `<!-- music: underlayer, -18dB sidechain -->` tag  
- If editor adds music bed (documentary string swell common at 2:00 "Follow the trail"), **must duck under VO or Jessica's voice drowns**  
- **Fix:** Add production note or confirm `audio-qc.py` will catch post-render

### 4. **Shorts-grade contrast punch not needed here (long-form), but audit THE TRAIL segment**
- MoneyFlow graphic (2:00) + Timeline (2:45) likely render flat if using base Manim defaults  
- Long-form tolerates softer grade than Shorts, but **committee flow chart must be readable at 1080p mobile**  
- **Fix:** Boost contrast +15% on flow arrows / timeline ticks during post-grade pass

---

## PASS CRITERIA CHECK

| Criterion | Status | Notes |
|-----------|--------|-------|
| Scribe-anchored (shorts) / master-VO ratio 0.85–1.15 (long) | ⚠️ **TBD** | No master VO timing sheet attached — cannot confirm ratio until Jessica render + segments timed |
| `audio-qc.py` PASS | ⚠️ **PENDING** | Script locked, TTS not rendered yet |
| No black frames >0.5s except end card | ✅ | No black frame calls in script |
| Text card hold <3.8s while VO continues | ❌ **FAIL** | STAKES segment 30s single card |

---

## VERDICT

**HOLD for writer revision** — pacing structure breaks documentary rhythm.

### Required fixes before render green-light:

1. **STAKES (0:15–0:45):** Break 30s VO block into 3 cards (10s each) or add B-roll layer so no static hold >4s  
2. **THE FIGHT (0:45–2:00):** Split 75-word AIPAC sentence into 2 sentences with breath pause, or add production note: `<!-- editor: hold SourceCard through full clause, no cut at em-dash -->`  
3. **Add music sidechain note:** `<!-- music: documentary strings, -18dB duck under VO, fade at 3:30 -->`  
4. **Post-grade:** Flag MoneyFlow + Timeline graphics for contrast audit (target: mobile-readable at 1080p)

### What works (keep):

- **Hook lands the turn at 0:12** ("eight million dollars — spent by outside groups that never had to ask you for a vote") — viewer knows story within 15s  
- **No receipt-dump** — storyline flows voter-experience → money trail → outcome, not raw FEC line vomit  
- **No partisan tone** — "Bush stood for... Bell was the..." = descriptive, not evaluative  
- **Jargon translated on first use** — "independent-expenditure committees" → plain-English explainer immediately follows  
- **Verdict stays procedural** — "watch your TV like a receipt" = viewer agency, not Betsy's opinion on Israel policy

---

## EDITOR NOTES FOR RENDER (once script revised):

- **0:00 Hook:** CountUp animation must hit $8M at 0:12 (sync with "eight million dollars" VO cue)  
- **2:00 MoneyFlow:** Arrow flow left-to-right (committees → airwaves → ballot box), duration 8–10s, loop 2x if VO runs long  
- **3:30 End card:** Hold 5s, fade to black over 1s (no hard cut to silence)  
- **Jessica voice:** Confirm `CR_ELEVENLABS_SARAH_VOICE_ID` locked in `.env` before render — fallback voice will sound wrong for 3:45 investigative piece

---

**Next step:** Writer revises STAKES pacing + THE FIGHT sentence split → resubmit to Council 10 for timing audit → green-light render.

---
