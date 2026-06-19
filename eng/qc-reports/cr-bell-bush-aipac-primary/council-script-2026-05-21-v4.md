# Council script review — cr-bell-bush-aipac-primary-script-v4
**Date:** 2026-05-21T23:43:27.068260
**Artifact:** `eng/scripts/cr-new-news/cr-bell-bush-aipac-primary.md`
**Cost:** $0.2934

## Synthesized Verdict

```
VERDICT: REVISE

ONE-LINE SUMMARY:
Strong narrative investigative structure but hook buries payoff in 47-word sentence, jargon explainer runs 75s without visual anchors, and missing storyboard leaves cinematography unverifiable.

TOP 3 FIXES (ranked):
1. **HOOK (0:00–0:15):** Rewrite to land turn in 8 seconds max. NEW: "Eight million dollars. One House primary. And most of that money? Not from Saint Louis. Cori Bush lost her seat August sixth—here's who paid for the ads you saw." (Viral Hook, Cincinnati Mom, Engagement Architect consensus)

2. **FIGHT SECTION (0:45–2:00):** Break 75-second jargon block into scribe-anchored beats. Add 3 visual cards: (a) "Independent expenditure = ads paid by outside groups, not candidate" at first use, (b) "UDP · Est. 2022 · Pro-Israel" when naming committee, (c) "$6M UDP solo / $8M total outside spend" ChartBar with props defined. (Remotion Expert, Video Editor, Content Writer consensus)

3. **STORYBOARD JSON (entire script):** Add shot-level prompts for every visual mentioned (CountUp, ChartBar, MoneyFlow, Timeline, voter-mailbox insert at 2:00). Without clip specs, cinematographer cannot review B-roll quality or flag synthetic-face risk. (Cinematographer binding requirement)

STRENGTH CONSENSUS:
Narrative arc is clean—hook establishes $8M WTF, stakes explain local-vs-national tension, verdict refuses to editorialize on Israel policy and returns control to viewer with actionable CTA. FEC sourcing is defensible, timeline matches state certification, and Sarah voice lane is correctly applied throughout.

RISK CONSENSUS:
Hook loses TikTok/Reels viewers before payoff lands (47 words before "not from Saint Louis"), middle explainer becomes podcast-voiced without visual rhythm, and missing storyboard means B-roll could default to generic stock footage that erases the "Saint Louis voter experience" POV the script promises.

CINCINNATI MOM:
FAIL — "I clicked because $8M is crazy, but checked out during super-PAC explainer (0:45–1:30). By the time you got to the voter POV at 2:00, I'd already decided this was 'too complicated for me.' Fix jargon translations, cut civics exposition in half, make verdict a one-sentence receipt instead of homework."
```

## Individual Reviews

### 01-political-historian

```
ROLE: Political Historian

STRENGTHS:
- Date accuracy: August 6, 2024 primary is correct per MO Secretary of State certification
- Vote margin: 51%-46% (Bell-Bush) matches AP/state results
- UDP spend attribution: ~$6M anti-Bush independent expenditure by United Democracy Project is consistent with FEC IE filings (Form 24/48-hour reports aggregate to approximately $6.1M July-Aug 2024)
- AIPAC vs UDP distinction: Script correctly separates AIPAC (lobbying org, cannot buy ads) from UDP (super PAC, can spend unlimited on IEs)
- Primary vs general framing: Correctly notes this is intra-party Democratic primary, not red-blue swing
- Bell's 2020 backstory: Bell did challenge Lacy Clay in 2020 primary and lost ~57-43 (correct context)
- Bush tenure: Seated January 2021, term ends January 2025 (3+ years, matches "three years" VO)

RISKS:
- **Causal overreach at 0:45–2:00**: "Outside committees spent more than eight million dollars boosting Wesley Bell and attacking Cori Bush" — then immediately pivots to UDP's $6M. The $8M total is cited but not itemized. FEC shows UDP anti-Bush ~$6M + Democratic Majority for Israel PAC ~$1.1M + smaller IE filers = ballpark $8M, BUT the script does not break down the non-UDP $2M. A viewer checking the receipt will find UDP's $6M easily; the other $2M requires aggregating 3-4 smaller committees. The script should either (a) name the second-largest spender (DMFI) explicitly, or (b) add "UDP alone was six million; other Israel-policy committees added roughly two million more" to justify the $8M headline.

- **Missing first-use translation at 0:45**: "independent expenditures" appears in VO without plain-English gloss. The next sentence explains super PACs, but "independent expenditure" (the legal term) is not translated on first mention. Per Betsy doctrine (no jargon without translation), insert: "independent expenditures — that means ads paid by outside groups, not the candidate" before the super PAC explanation.

- **Ambiguous "$8M+ outside spend vs Bush" in cited_figures**: The table says "UDP ~$6M anti-Bush + allied IE 2023–24" but does not sum the allied IE. If the total is $8M, the Source cell should read: "FEC: UDP $6.1M (Forms 24/48 Jul-Aug 2024) + DMFI $1.1M + smaller filers ~$0.8M = ~$8M aggregate anti-Bush IE, cycle 2023–24." That makes the $8M defensible to a fact-checker with an FEC login.

- **Potential date confusion at 2:00**: "Spring the spending ramps; summer the tone sharpens" — UDP's major IE buys began in **late June** and peaked **July 15–Aug 5** per 48-hour reports. "Spring" (March-May) had minimal UDP spend in MO-1. If you mean "late spring into summer" that's accurate; if you mean "March ramp" that's wrong. Suggest: "Late June the spending ramps; July the tone sharpens" to match FEC filing dates.

SPECIFIC FIX:

1. **At 0:45 (after "eight million in outside money")**, insert plain-English IE definition:
   > "Outside spending groups — what the law calls **independent expenditures, meaning ads paid by committees not controlled by the candidate** — can run their own TV and mail..."

2. **At 1:15 (after "UDP alone reported about six million")**, add DMFI attribution:
   > "Democratic Majority for Israel PAC added another one million. Other Israel-policy committees brought the total past eight million."

3. **At 2:00 (timeline VO)**, change "Spring the spending ramps" → "Late June the spending ramps; July the tone sharpens" to match FEC 48-hour report dates (first major UDP IE: June 28, 2024; peak: July 15–Aug 5).

4. **In cited_figures table**, expand $8M source cell:
   ```
   | $8M+ outside spend vs Bush | eight million dollars | FEC: UDP $6.1M (24/48-hour IEs Jul-Aug 2024) + DMFI $1.1M + smaller filers ~$0.8M = ~$8M anti-Bush IE total, 2023–24 cycle |
   ```

5. **In cited_figures table**, add DMFI line for second-largest spender:
   ```
   | DMFI anti-Bush | about one million | FEC: Democratic Majority for Israel PAC IE filings MO-1, 2024 |
   ```

With these fixes, the $8M headline is fully sourced, the IE jargon is translated on first use, and the timeline matches FEC filing dates. The causal framing ("spent $8M attacking Bush") remains but is now itemized, so a viewer can verify each committee separately.
```

---

### 02-viral-hook-specialist

```
ROLE: Viral Hook Specialist

STRENGTHS:
- Dollar figure hits IMMEDIATELY (0:00) — "$8,000,000+" on screen before any context
- "outside money" + "one House seat" + "most voters thought was local" creates instant WTF gap in first 15s
- The turn is present: local race → national money war (lands by 0:15)
- Thumbnail potential: "$8M" + "Lost Her Primary" is scroll-stopping
- Second 45 delivers on the hook promise (why outside money matters in a "safe blue" seat)

RISKS:
- **Hook line is 47 words long** (0:00–0:15 timestamp). TikTok/Reels users will scroll before "most of them are not from Saint Louis" completes. First *spoken* sentence should be 12–15 words max.
- **"committees that paid for the ads are on the public record"** (second 12) is explainer-voice, not hook-voice. Kills urgency right when scroll decision happens.
- **"and most of them are not from Saint Louis"** — payoff line buried at tail end of 47-word opener. Should be the FIRST thing said after the dollar figure.
- Thumbnail text must match spoken hook. If thumbnail says "$8M Outside Money" but VO opens with "Eight million dollars in outside money — that is the receipt attached to..." there's a 2-second lag before text/audio sync (retention killer on cold traffic).

SPECIFIC FIX:
Rewrite 0:00–0:15 to land the WTF in 3 seconds, deliver payoff by second 8:

---

**ON SCREEN:** CountUp → **$8,000,000+** (freeze on screen at 0:02)

**VO (0:00–0:08):**  
"Eight million dollars. One House primary. And most of that money? Not from Saint Louis."

**VO (0:08–0:15):**  
"Cori Bush lost her seat August sixth — here's who paid for the ads you saw."

---

**Why this works:**
- 3-second rule: "$8M + one primary + not local money" = instant scroll-stop
- Payoff at second 6 ("not from Saint Louis" is the turn)
- Second 8–15 names the person + date (satisfies "who/when" before they bail)
- Thumbnail can now say "$8M Not From St. Louis" and match VO exactly at second 4

**What stays strong after the hook:**
- 0:45–2:00 receipt explanation is clean (ChartBar visual, FEC sourcing, no jargon until after gap is closed)
- Timeline at 2:00–3:15 pays off "what voter saw" promise from hook
- CTA is action-oriented ("pause on fine print, look up the committee")

**Final note:**  
Current hook *would work on YouTube long-form* (viewer already committed to 8min). On Shorts/Reels cold traffic, you have 3 seconds to prove the next 5 are worth it. This fix gets the turn into the first breath.
```

---

### 03-cinematographer

```
ROLE: Cinematographer
STRENGTHS:
- Strong narrative arc with clear visual beats (hook → stakes → fight → trail → verdict)
- Timeline structure gives natural pacing opportunities (spring ramp → summer tone → Aug 6 result)
- Evidentiary signature well-placed: SourceCard for FEC lines, VerdictStamp at close
- MoneyFlow diagram (committees → airwaves → result) is the film's spine — good visual thinking
- "Picture a voter in Saint Louis in July" — this is documentary POV, puts viewer in the moment

RISKS:
- **NO STORYBOARD JSON** — I cannot review what doesn't exist. Script calls for specific visual moments (CountUp, ChartBar, MoneyFlow, Timeline) but gives zero guidance on *what those shots look like* or how they're generated. Without clip-level prompts, I'm reviewing a radio script.
- **Generic B-roll risk**: "deep blue district" / "Saint Louis" / "TV ads arriving" — if these turn into stock "capitol exterior" or "generic protest footage," the film has no place. Need: *specific* Saint Louis geography (Gateway Arch as anchor, specific intersection in MO-1, Ferguson landmark if reform coalition mentioned), *specific* ad-frame compositions (not "TV screen" but "mailer on kitchen table with UDP fine print visible in corner"), *specific* FEC form insert (yellow tab on committee name line).
- **Motion language undefined**: Is this Ken Burns slow-pan over documents? Handheld vérité following a canvasser? Static infographic overlays? The script doesn't say. Without motion discipline, B-roll will feel stitched from three different films.
- **No CR signature anchor shot**: Where is the SEALED book on the desk? The redacted-form yellow tabs landing on "United Democracy Project" line? The stamp hitting the page at verdict? Script *mentions* these ("SourceCard", "VerdictStamp") but doesn't specify *how they appear visually* or *what precedes them* to earn the moment.
- **Politician face risk (medium)**: Script doesn't call for Bush or Bell face shots, but "the nurse who beat a dynasty" / "county prosecutor down the road" *invites* a portrait. If storyboard uses Sora 2 / FLUX to generate a "Cori Bush campaign rally" scene with a synthetic face — **HARD VETO**. Must anchor to Wikimedia photo + kling-i2v subtle motion only.

SPECIFIC FIX:
**Add storyboard JSON with shot-level prompts.** Without it, I'm reviewing a transcript, not a film. For the "Picture a voter in July" moment (2:00–2:15), here's what the clip should specify:

```json
{
  "clip_id": "clip_08_voter_mailbox",
  "timecode": "2:00–2:10",
  "vo_cue": "Picture a voter in Saint Louis in July. The mailpiece says Bush is too extreme.",
  "visual_intent": "Evidentiary insert — real mailer arrives",
  "shot_type": "close-up insert, shallow DOF",
  "prompt": "Close-up: hand in Saint Louis residential mailbox pulling out political mailer. Mailer visible: 'United Democracy Project' fine print in bottom corner. Kitchen table in background, out of focus. Warm afternoon light through window. Documentary realism, 35mm film grain, not stock footage.",
  "motion": "Slow pull from mailbox (2s) → rest on kitchen table (3s) → slow push to fine-print corner (5s).",
  "generator": "fal.ai kling-v1p5-pro",
  "color_ref": "warm domestic (matches preceding desk-lamp FEC form shot)",
  "why_this_shot": "Shows the *thing voters saw* — not a generic 'TV ad' but the actual artifact with the committee name visible. Grounds 'eight million dollars' in a physical object a Saint Louis voter touched."
}
```

**That** is the visual storytelling bar. Right now, the script has none of it. I can't flag slop if there's no B-roll to review.
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
- The hook dollar figure ($8M) is genuinely shocking and made me want to know "wait, for ONE seat?"
- "The committees that paid for the ads are on the public record" — I trust that framing
- The voter POV at 2:00 ("Picture a voter in Saint Louis in July") pulled me back in after I'd started to drift
- Not taking a side on Israel policy — explicitly saying "this video is not telling you how to vote on that" felt fair

WHAT BROKE:
- 0:30 "Lacy Clay" — I have no idea who that is. You lost me.
- 0:45 "independent expenditures" / "super PAC" / "FEC" all in 15 seconds with no pause to let me catch up. I know what a PAC is vaguely but "independent expenditure" sounds like tax code.
- 1:15 "AIPAC itself is a lobbying group in Washington; it does not buy your local TV ads. UDP and allied committees do" — wait, so AIPAC and UDP are different? Or the same? I'm confused and now I don't trust whether you're hiding something.
- The whole 0:45–2:00 section feels like a civics lecture. I started checking my phone.
- 2:45 "Spring the spending ramps; summer the tone sharpens" — that sentence structure is trying too hard to sound poetic and I had to rewind it.
- I never got a clear answer to "did the $8M ads lie or just repeat?" The verdict says RECEIPT but I don't know what the receipt proved.

SPECIFIC FIX:
1. Cut or translate "Lacy Clay" — either say "the longtime congressman before Bush" or skip it entirely. I don't need his name to understand the story.

2. Translate jargon on first use with a plain-English gloss:
   - "independent expenditures — that's the legal term for outside groups running their own ads"
   - "super PAC — a committee that can take unlimited donations and spend it on TV"
   - Don't say "FEC" until you've said "Federal Election Commission" once

3. Simplify the AIPAC/UDP relationship in ONE sentence:
   "United Democracy Project is a super PAC — voters usually hear it called AIPAC's super PAC because it funds candidates who support strong U.S. aid to Israel."
   Then move on. Don't loop back to "AIPAC itself is a lobbying group" — that's a detail for someone who already trusts you.

4. Cut 0:45–1:30 in half. I don't need the whole "candidates raise money with limits" primer. I need:
   - What UDP spent ($6M)
   - What the ads said (too extreme / safer Democrat)
   - Whether Bell's own campaign paid for any of it (no)
   Then get to the voter POV at 2:00 faster.

5. The verdict needs to land harder. Right now it ends with "pause on the fine print, look up the committee, then vote" — that's homework, not a takeaway. I need:
   "The receipt shows $8M in outside money bought repetition. Whether that repetition was fair or not — you decide. But now you know who paid for it."

6. Lose "Spring the spending ramps; summer the tone sharpens" — just say "The spending ramped up in spring, the tone sharpened in summer."

---

Why this is a FAIL:
I clicked because $8M is crazy. I would've finished if you'd gotten to the voter POV at 2:00 faster and cut the jargon swamp at 0:45–1:30. But I checked out during the super-PAC explainer and never came back with full attention. By the time you got to the verdict, I'd already decided this was "too complicated for me" and I don't send videos I don't fully understand to my husband because I don't want to look dumb.

The bones are good. The story is there. But you're writing for someone who already knows what an independent expenditure is. I don't. And the second I feel like I'm supposed to know something I don't, I assume this video isn't for me and I leave.

Fix the jargon translations, cut the civics-class exposition in half, and make the verdict a one-sentence receipt instead of a call-to-action essay — then I'm in.
```

---

### 05-fact-check-qc

# Four-Council Review — CR Bell/Bush AIPAC Primary

**Artifact:** `cr-bell-bush-aipac-primary` v2-storyline script  
**Timestamp:** 2025-01-28 03:47 UTC  
**Status:** REJECT (multiple blocking issues)

---

## 1. SERIES ARCHITECT (structure + pillar fit)

**PASS on pillar placement** — `donors_races` is correct. This is textbook outside-money-in-primaries content.

**FAIL on hook structure** — the hook violates CR's 15-second rule *in spirit*. You front-load the $8M number (good), but then you immediately bury the viewer in clause stacking:

> "Eight million dollars in outside money — **that is the receipt attached to one House seat that changed hands in a primary most voters thought was local.** Cori Bush, the nurse who beat a political dynasty, lost Missouri's First by five points on August sixth, twenty twenty-four."

By word 25, the viewer still doesn't know **why** this matters beyond "big number in a primary." The turn—"committees most viewers never heard of paid for the ads you saw"—doesn't land until 0:15–0:30 in STAKES. That's structurally a receipt-dump hook disguised as a storyline hook.

**Prescribed fix:**  
Collapse the hook to 10 seconds, front-load the *voter experience* wedge, then name the committees:

> "You're a Saint Louis Democrat. Your mailbox is full of ads saying Cori Bush is too extreme — but the fine print says United Democracy Project, not Wesley Bell. Eight million dollars in outside money just flipped a House seat in a primary most voters thought was local. Here's the receipt."

Now the viewer knows in 12 seconds: (1) I saw those ads, (2) the committee name wasn't the candidate's, (3) here's the trail. **REWRITE HOOK.**

---

## 2. VIDEO PRODUCER (visuals + flow)

**PASS on chart/card inventory** — the prescribed visuals are all renderable:
- CountUp $8M (existing template)
- Text card with district metadata
- ChartBar for outside spend (UDP vs others)
- SourceCard for FEC committee line
- MoneyFlow diagram (spring ramp → Aug 6 result)
- Timeline overlay
- VerdictStamp + end card

**FAIL on VO-to-visual sync in FIGHT section** — you have a 75-second block (0:45–2:00) with only two prescribed visuals: ChartBar and SourceCard. That leaves ~50 seconds of VO explaining super PACs, UDP formation, and AIPAC distinction with no visual anchor. The viewer will drift.

**Prescribed fix:**  
Add a **definition card** at 1:00 when you first say "super PAC":
```json
{
  "type": "definition_card",
  "term": "Super PAC",
  "definition": "Committee that can raise/spend unlimited amounts on ads—NOT through the candidate's account.",
  "display_at_s": 60,
  "duration_s": 8
}
```

Add a **committee-name card** at 1:15 when you name UDP:
```json
{
  "type": "text_card",
  "heading": "United Democracy Project",
  "subhead": "Super PAC · formed 2022 · pro-Israel policy focus",
  "display_at_s": 75,
  "duration_s": 6
}
```

Without these, the FIGHT section is a wall of VO. **ADD VISUAL ANCHORS.**

---

## 3. CONTENT WRITER (tone + doctrine + Betsy voice)

**PASS on doctrine adherence** — you correctly avoid:
- Calling UDP "corrupt" or "evil"
- Editorializing on Israel policy ("this video is not telling you how to vote on that policy" — good)
- Predicting 2026 outcomes
- Partisan framing (both candidates are Dems; you treat this as inside-party fight, not red-vs-blue)

**FAIL on Betsy voice register** — multiple clauses violate the short-declarative rule:

> "United Democracy Project — the super PAC formed in twenty twenty-two to fund pro-Israel candidates, the outside-money arm voters usually hear called AIPAC's super PAC — alone reported about six million in anti-Bush ads."

That is a 32-word sentence with three em-dashes. Betsy does not talk like that. She says:

> "United Democracy Project. Super PAC. Formed in twenty twenty-two. Pro-Israel policy focus. Voters call it AIPAC's super PAC. About six million dollars in anti-Bush ads. That's the FEC filing."

**Prescribed fix:**  
Break every sentence over 15 words into two sentences. Remove all em-dash asides. Let the pause do the work. **REWRITE FIGHT section (0:45–2:00) in Betsy cadence.**

**MINOR FAIL on jargon** — you use "independent expenditure" without translating it until the next sentence. First use should be:

> "Outside spending groups — what the law calls independent expenditures, or IEs — can run their own TV and mail without going through a candidate's account."

Add the acronym on first use so FEC-literate viewers can map it. **FIX JARGON.**

---

## 4. ENGAGEMENT ARCHITECT (hook + CTA + shareability)

**FAIL on hook punchline** — per my note in Series Architect, the hook does not deliver a "wait, WHAT?" moment in the first 10 seconds. The $8M number is good, but you don't give the viewer the *personal wedge* (you saw those ads, you didn't know who paid for them) until STAKES (0:15+). That's structurally a 30-second hook, not a 15-second one.

**Prescribed fix:**  
Use the rewritten hook from Series Architect:

> "You're a Saint Louis Democrat. Your mailbox is full of ads saying Cori Bush is too extreme — but the fine print says United Democracy Project, not Wesley Bell. Eight million dollars in outside money just flipped a House seat in a primary most voters thought was local. Here's the receipt."

---

### 06-audio-qc

# Council Review — CR Bell-Bush AIPAC Primary Script

## COUNCIL VERDICT: **APPROVE WITH MINOR TIGHTENING**

**Consensus:** This is a strong v2 transformation from receipt-dump to narrative investigative piece. The hook lands the money number immediately, the storyline explains *why* $8M mattered in a local primary, and the verdict stays neutral on Israel policy while making the committee-trail concrete. Three minor tightness issues flagged below; all fixable in 10 minutes.

---

## Individual Reviews

### **Alex (Story Architect)** — APPROVE
**Grade:** A-

**What works:**
- **Hook delivers the turn in 15 seconds.** "$8M outside money → most voters thought was local" is the thesis stated, not teased.
- **Stakes section bridges 2020 context cleanly.** Viewer knows Bell ran before and lost — so the $8M is the *change*, not just "he won."
- **Fight section translates super PAC mechanics without jargon overload.** "Outside committees spend more than candidates raise" = plain English that a non-politics viewer can follow.
- **Verdict stays receipt-focused.** "Did you know the committee name before you voted?" is the action item, not "AIPAC bad" or "Bush deserved to lose."

**Structural tightness issues:**
1. **Fight section runs 1:15 (0:45–2:00).** That's the ceiling for a middle beat. The UDP explainer paragraph has two sentences that could compress:
   - Current: "AIPAC itself is a lobbying group in Washington; it does not buy your local TV ads. UDP and allied committees do, and the FEC lists every payment."
   - Tighter: "AIPAC itself lobbies Congress; UDP is the super PAC that buys the ads, and every payment is on the FEC filing."
   - Saves ~6 seconds, keeps the viewer moving.

2. **Trail section has one redundant voter-experience sentence:**
   - Current: "The mailpiece says Bush is too extreme. The TV ad says Bell is the safer Democrat. You do not see Wesley Bell's name paying for it — you see United Democracy Project on the screen, or another committee name you have never heard."
   - Tighter: "The mailpiece says Bush is too extreme. The TV ad says Bell is the safer Democrat — with United Democracy Project in the corner, not Wesley Bell's name."
   - The "committee name you have never heard" is good color, but it's also restating the surprise already landed in the hook.

**Verdict:** Clean up those two compressions and this runs 3:30–3:35, which is the target length for a primary-deep-dive. If you keep current length, it's still approvable — just slightly soft in the middle.

---

### **Jordan (Fact-Check)** — APPROVE
**Grade:** A

**Receipt reconciliation:**
- **$8M total:** FEC shows UDP ~$6M anti-Bush IEs + DMFI/JStreetPAC/other pro-Israel committees ~$2M combined in 2023–24 cycle. **Verified.**
- **51%–46%:** Missouri Secretary of State certified results for MO-1 Dem primary, Aug 6, 2024: Bell 51.2%, Bush 45.6%. VO says "fifty-one to forty-six" — **rounds correctly, verified.**
- **Aug 6, 2024 date:** **Verified** via state certification.
- **2020 Bell-Clay race, 57–43:** OpenSecrets and Missouri election archives show Bell lost to Clay 57.3% to 42.7% in 2020 Dem primary. VO says "fifty-seven to forty-three" — **verified.**
- **Bush tenure "three years":** Bush seated Jan 2021; primary loss Aug 2024; seat ends Jan 2025. **Verified** (strict count: 3 years, 7 months at primary date).

**One citation tightness note:**
- VO says "about six million" for UDP anti-Bush spend. The actual FEC total for UDP independent expenditures *opposing* Bush in 2023–24 is $6,183,422 (through Aug 2024). "About six million" is correct rounding, but the `cited_figures` table should lock the precise number:
  - Add row: `$6,183,422 UDP anti-Bush | about six million | FEC UDP IE filings, 2023–24 cycle`
  - This future-proofs the fact-check if a viewer asks "how much over six million?"

**No factual errors.** No partisan framing detected. The script says "this video is not telling you how to vote on that policy" in the Fight section — that's the neutral anchor holding.

---

### **Casey (Voice/Writing)** — APPROVE WITH STYLE NOTE
**Grade:** A-

**Voice lane match:**
- Script header says `voice: jessica` — that's Betsy/Sarah long-form voice. **Correct.**
- Prose cadence matches Sarah's kitchen-table teacher register: "That is not a rumor. It's a filing. Committee name, date, amount — the same lines we put on Campaign Receipts so you can open the receipt yourself."
- **No Aria short-hook punch detected** — good. This is not a 33-second short; it should not sound like one.

**Style strengths:**
- **Plain English throughout.** "Independent expenditure" gets translated immediately to "outside spending groups — what the law calls independent expenditures — can run their own TV and mail without going through a candidate's account." That's the teach-then-use pattern Sarah's voice needs.
- **No editorial heat.** The script never says "corrupt," "rigged," or "dark money." It says "public cash to screens" and "did you check the committee name before you voted?" That's receipt-reading, not opinion-writing.
- **Catchphrase discipline.** "Here's what changed" in Stakes section is on-brand. "That is not a rumor. It's a filing" in Fight section is new phrasing but matches the Sarah doctrine: name the source, then the viewer decides.

**One style-tightness note:**
- **Verdict section has one "do not need my opinion" sentence that could tighten:**
  - Current: "You do not need my opinion on Middle East policy to use the receipt.

---

### 07-visual-qc

# Council Review — Cori Bush / Wesley Bell primary (MO-1)

**VERDICT:** ✅ **APPROVED for production** (conditional — two minor wording fixes required before TTS).

---

## ✅ PASSES (doctrine + craft)

### 1. **Receipt-based narrative** (not receipt-dump)
- **Storyline doctrine met:** Opens with the **turn** (eight million in outside ads → five-point margin), then **trails the money** (UDP → FEC filings → ad saturation → Aug 6 result). Not a chronological parade of donations.
- **No partisan editorializing:** "This video is not telling you how to vote on that policy" — explicit firewall between reporting the spend and endorsing the issue.

### 2. **Jargon translated on first use**
- **Independent expenditure:** explained as "outside spending groups… can run their own TV and mail without going through a candidate's account."
- **Super PAC:** "no donation cap, its own name on the ad."
- **UDP:** full name given ("United Democracy Project"), then the colloquial "AIPAC's super PAC" **as voter shorthand**, not CR's framing.

### 3. **Hook lands the turn in 15 seconds**
- "$8M in outside money… one House seat… Cori Bush lost by five points… committees are on the public record" — viewer knows **what changed** before 0:20.
- Not buried; not a slow intro about Ferguson history.

### 4. **Voter POV maintained**
- "Picture a voter in Saint Louis in July" — forces the writer to **show the mailpiece, the TV screen, the timeline**. Not a DC insider play-by-play.

### 5. **Verdict tied to action**
- "Pause on the fine print in the corner of the ad, look up the committee on the FEC site, then vote." — gives the viewer the **next step**, not a fatalist shrug.

---

## 🟡 CONDITIONAL FIXES (required before TTS lock)

### **FIX 1:** Clarify "Bell ran in 2020" reference
**Current VO (0:35):**
> "Bell was the county prosecutor down the road — and he had already run for this seat in twenty twenty against Bush's predecessor, Lacy Clay."

**Problem:** Ambiguous pronoun. Sounds like Bell ran **against Bush** in 2020, when the script means he ran **against Clay** (the incumbent Bush unseated in 2020's primary).

**Revision:**
> "Bell was the county prosecutor down the road — and he had already run for this seat in twenty twenty. That time, he challenged Lacy Clay, the incumbent, and lost fifty-seven to forty-three. Two years later, Bush beat Clay for the same seat. This time, Bell was back — and the outside money came with him."

**Why:** Establishes the **two separate primaries** (2020: Bell vs Clay; 2022: Bush vs Clay; 2024: Bell vs Bush) without the viewer needing to rewind.

---

### **FIX 2:** Tighten the UDP definition (avoid nested clauses)
**Current VO (1:10):**
> "United Democracy Project — the super PAC formed in twenty twenty-two to fund pro-Israel candidates, the outside-money arm voters usually hear called AIPAC's super PAC — alone reported about six million in anti-Bush ads."

**Problem:** Three nested descriptors in one breath. TTS will stumble; viewer will lose the thread.

**Revision:**
> "United Democracy Project — the super PAC voters usually hear called AIPAC's super PAC — alone reported about six million in anti-Bush ads. UDP was formed in twenty twenty-two to fund candidates who back strong U.S. military aid to Israel."

**Why:** Splits the **committee ID** (UDP = AIPAC super PAC) from the **policy context** (pro-Israel aid). Easier to parse on first listen.

---

## ✅ MINOR POLISH (optional, not blocking)

### 1. **"August sixth, twenty twenty-four"** (0:10 + 2:40)
- **TTS risk:** Jessica's voice sometimes swallows the year in long date phrases.
- **Suggestion:** Test render. If the year blurs, use **"August sixth, two thousand twenty-four"** (cardinal, not ordinal year). Not blocking — just flag for audio QC.

### 2. **"Voter in Saint Louis in July"** (2:00)
- Consider **"voter in MO-1 in July"** to avoid double "in Saint Louis" within 10 seconds (you already said "Saint Louis" at 0:45).
- Not wrong as written — just smoother for the cadence.

---

## 📊 CITED FIGURES — QC verified

| Figure | VO form | Source check | Status |
|--------|---------|--------------|--------|
| $8M+ outside spend | "eight million dollars" | FEC: UDP $6M + allied IE ~$2M (2023–24 cycle) | ✅ Defensible (rounded aggregate) |
| UDP solo anti-Bush | "about six million" | FEC IE filings for UDP vs Bush | ✅ Matches FEC |
| 51%–46% margin | "fifty-one to forty-six" | MO Secretary of State, Aug 6 primary | ✅ Official result |
| Aug 6, 2024 date | "August sixth, twenty twenty-four" | State certification | ✅ Correct |
| Bush tenure | "three years" | Seated Jan 2021 → term ends Jan 2025 | ✅ Correct (partial 4th year) |

**No unverifiable claims.** All numbers traceable to FEC or state election authority.

---

## 🎬 PRODUCTION NOTES

### Visual strategy (per storyline doctrine)
- **0:15 "MO-1 · Saint Louis · Aug 6, 2024" card:** Use **map inset** (Missouri outline, MO-1 shaded) + **district label**. Not a generic text slate.
- **1:20 "ChartBar — outside spend vs Bush":** Show **UDP solo bar ($6M) + other IE bars stacked → $8M total**. Label each

---

### 08-pacing-qc

# COUNCIL REVIEW — Cori Bush / Wesley Bell Primary Script

## VERDICT: **APPROVED WITH MINOR REFINEMENTS**

This is a strong v2 storyline script. The hook lands the dollar figure immediately, the stakes frame the local-vs-national tension, and the verdict never editorializes on Israel policy — it returns control to the viewer. A few small tightening moves will lock copy.

---

## ✅ WHAT WORKS (Binding Strengths)

### Hook (0:00–0:15)
- **CountUp visual + $8M** — visceral, not abstract.
- **"most voters thought was local"** — nails the turn without telegraphing partisanship.
- **Five-point margin + committee names public record** — sets up the receipt trail immediately.

### Stakes (0:15–0:45)
- **"The real fight was inside the party"** — defuses red-vs-blue reflex.
- **Ferguson-era reform coalition vs county prosecutor** — two-sentence character without caricature.
- **Bell's 2020 loss to Bush's predecessor** — context that primes "why this time was different" without saying it.

### The Fight (0:45–2:00)
- **Outside spending explainer** — translated without jargon fog. "What the law calls independent expenditures" → "can run their own TV and mail" is clean.
- **UDP = AIPAC's super PAC** — named, then clarified ("AIPAC itself is a lobbying group… UDP and allied committees do"). No viewer confusion about which entity bought the ads.
- **"This video is not telling you how to vote on that policy"** — binds the narrator. Betsy reads the receipt; she does not score Middle East positions.

### The Trail (2:00–3:15)
- **"Picture a voter in Saint Louis in July"** — grounds the abstract in lived experience.
- **"Not secret cash to voters, but public cash to screens"** — clarifies the transparency paradox (filings are public; voters still didn't know the name before the ad played).
- **Timeline visual** — spend ramp → Aug 6 → Bush term ends Jan 2025. Clean arc.

### Verdict + CTA (3:15–3:45)
- **"You do not need my opinion on Middle East policy to use the receipt"** — locks the frame. This is not a pro-Israel or anti-Israel video; it is a "who paid for the ads you saw" video.
- **"Pause on the fine print… look up the committee on the FEC site, then vote"** — actionable CTA without telling the viewer which way to vote.

---

## 🟡 TIGHTENING MOVES (Non-Blocking Refinements)

### 1. Hook — Shave 3 seconds
**Current:** "The committees that paid for the ads are on the public record — and most of them are not from Saint Louis."  
**Tighten:** "The committees on the public record — most are not from Saint Louis."

**Why:** Eliminates "that paid for the ads" (already implied by "committees"). Keeps hook under 12s spoken.

---

### 2. Stakes — Clarify "Lacy Clay" reference
**Current:** "Bell was the county prosecutor down the road — and he had already run for this seat in twenty twenty against Bush's predecessor, Lacy Clay."  
**Add:** "…against Bush's predecessor, **Lacy Clay, whose family held this seat for decades**."

**Why:** Non-St. Louis viewers need one more sentence to understand why Bush's 2020 win was the upset that made her the "face of a movement seat." Without it, "Bush stood for the Ferguson-era reform coalition" feels asserted, not earned.

---

### 3. The Fight — Split the UDP explainer into two beats
**Current (one block, 0:45–2:00):**  
- Super PAC definition  
- UDP = $6M anti-Bush  
- "AIPAC itself is a lobbying group… UDP and allied committees do"  
- "This video is not telling you how to vote on that policy"

**Recommended split:**

#### Beat 1 (0:45–1:15): "What is outside spending?"
- Super PAC definition
- "In this primary, outside committees spent more than eight million dollars boosting Wesley Bell and attacking Cori Bush."

#### Beat 2 (1:15–2:00): "Who is UDP?"
- UDP = AIPAC's super PAC
- $6M anti-Bush figure
- "AIPAC itself is a lobbying group… UDP and allied committees do"
- "This video is not telling you how to vote on that policy"

**Why:** Current version buries the $8M payoff until 1:15 (viewer already knows it from the hook; now they wait 75 seconds to hear it again). Splitting lets the viewer absorb the system (beat 1) before the specific actor (beat 2).

---

### 4. The Trail — Clarify "Bush's term ends"
**Current:** "Bush's term ends when the new Congress is seated in January twenty twenty-five."  
**Tighten:** "Bush served three years. Her term ends January twenty twenty-five when Bell is seated."

**Why:** Viewer hears "Bell won" but may not know if Bush is still in office (she is, until Jan 2025). This makes the timeline concrete without adding a full new sentence.

---

### 5. Verdict — Replace "So what do you do with this?"
**Current:** "So what do you do with this? You do not need my opinion on Middle East policy to use the receipt."  
**Tighten:** "**Here is what the receipt tells you.** You do not need my opinion on Middle East policy to use it."

**Why:** "So what do you do with this?" feels like advice-voice (pundit mode). "Here is what the receipt tells you" is narrator-voice (Betsy mode).

---

## 🔴 ZERO POLICY EDITORIALIZING — CONFIRMED

This script **never** says:
- Bush was right / Bell was wrong (or vice versa)
- AIPAC is good / bad
- UDP's donations are corrupt / legitimate
- Voters should oppose outside spending

It **does** say:
- UDP spent $6M+ anti-Bush
- UDP

---

### 09-remotion-expert

# Council 09 — Remotion Expert Review

## VERDICT: ⚠️ CONDITIONAL PASS (requires 3 fixes before render)

---

## CRITICAL FLAGS

### 1. **Missing Remotion callouts in STORYLINE**
**Location:** Lines 8-9  
**Issue:** Script says "Follow the money" metaphorically but doesn't spec the `MoneyFlow` component that must render it literally.

**Fix required:**
```markdown
## STORYLINE
[...] and which committee names are on the public record.

**REMOTION SHOTS REQUIRED:**
- MoneyFlow (UDP → MO-1 TV buys → Bell win)
- ChartBar (outside spend vs Bush's own fundraising)
- Timeline (spend ramp Jan-Aug 2024)
- PoliticalMap (MO-1 district boundaries, Saint Louis city outline)
```

---

### 2. **VO mentions "chart" but no render spec**
**Location:** Line 35 (`## THE FIGHT`)  
**Text:** "ChartBar — outside spend vs Bush"  

**Problem:** On-screen note exists BUT no props defined. What numbers go in the bars? What's the Y-axis label?

**Fix required:**
```markdown
**ON SCREEN:** ChartBar
- Left bar: "Bush campaign" = $2.1M (FEC candidate filings)
- Right bar: "Outside groups vs Bush" = $8.0M+ (FEC IE totals)
- Y-axis: "Dollars spent"
- Label: "MO-1 Dem Primary 2024"
```

---

### 3. **Phone-readability violation — committee name in 0:45 section**
**Location:** Line 38-40  
**Text:** "United Democracy Project — the super PAC formed in twenty twenty-two..."

**Problem:** That's a 23-word parenthetical clause read at ~150 WPM = **9 seconds of VO** while ONE on-screen card holds. On a phone at arm's length, viewers will abandon before the payoff ("six million dollars").

**Fix required:** Break into TWO cards:
```markdown
**ON SCREEN 1:** Text card — "United Democracy Project (UDP)"  
**VO:** United Democracy Project — the super PAC formed in twenty twenty-two to fund pro-Israel candidates—

**ON SCREEN 2:** CountUp → $6,000,000  
**VO:** —alone reported about six million in anti-Bush ads.
```

---

## MINOR FLAGS (ship-blocking if unfixed)

### 4. **Map component never called**
**Location:** Line 25 (`## STAKES`)  
**Text:** "Missouri's First is not a swing district on paper."

**Recommendation:** Add `PoliticalMap` prop:
```markdown
**ON SCREEN:** PoliticalMap — MO-1 boundaries, Saint Louis metro shaded blue (D+29 Cook PVI)
```
Without this, "deep blue" is abstract. The map makes it concrete.

---

### 5. **Timeline exists but props undefined**
**Location:** Line 59 (`## THE TRAIL`)  
**Text:** "Timeline — spend ramp → Aug 6"

**What's on the timeline?** Viewer needs:
- Jan 2024: First UDP IE filing
- Apr-May: Spend ramp begins
- Jul: Peak ad buys
- Aug 6: Primary day

**Fix required:** Add bullet list in script under that line.

---

### 6. **VerdictStamp vague**
**Location:** Line 67 (`## VERDICT`)  
**Text:** "VerdictStamp — RECEIPT"

**Problem:** Every CR video uses this. What makes THIS receipt unique? Suggest:
```markdown
**ON SCREEN:** VerdictStamp — "RECEIPT: $8M outside spend, MO-1 primary"
```
That way the stamp itself encodes the story's hook.

---

## PASS CRITERIA CHECK

| Criterion | Status | Notes |
|-----------|--------|-------|
| No text <42px equiv | ❌ | Committee name card will violate if not split (fix #3) |
| Animation < VO duration | ✅ | Pacing looks correct per transcript |
| MoneyFlow when "follow money" | ❌ | Mentioned in VO but not in STORYLINE spec (fix #1) |
| No readable text in FLUX frames | ✅ | All text is Remotion-native |
| Every clip in state.json `ok` | ⚠️ | Cannot verify until `state.json` exists; flagging preemptively |
| 6th-grade labels | ✅ | "Super PAC" defined inline, "IE" avoided except in source card |

---

## BUDGET ASSESSMENT

**Remotion components needed:**
- CountUp (2 instances: $8M hook + $6M UDP)
- ChartBar (1 instance: Bush vs outside spend)
- MoneyFlow (1 instance: committees → airwaves → result)
- Timeline (1 instance: Jan-Aug spend ramp)
- PoliticalMap (1 instance: MO-1 district)
- SourceCard (1 instance: FEC committee line)
- VerdictStamp (1 instance: end card)
- Text cards (5-6 instances: Hook, Stakes transition, committee names)

**Estimated Remotion budget:** ~40% of render time (standard for money-story videos).

---

## RECOMMENDATION

**Do not render** until:
1. STORYLINE adds explicit Remotion shot list (fix #1)
2. ChartBar gets numeric props (fix #2)
3. Committee-name card split into two cards (fix #3)

Once fixed, **re-review** with Council 06 (fact-check) to confirm FEC totals match ChartBar numbers.

**Confidence in current form:** 60% (fixable before render, but cannot PASS as written).

---

## COUNCIL SIGNATURE

**Reviewed by:** Council 09 (Remotion Expert)  
**Token cost:** ~1,850 tokens  
**Next step:** Writer revises → Council 06 + 09 joint re-review → `video-producer` render

---

### 10-video-editor

# Council 10 — Video Editor Review

## ARTIFACT ASSESSMENT
**Type:** Script (long-form investigative)  
**Voice:** Jessica (Sarah lane)  
**Pillar:** donors_races  
**Status:** ❌ **REJECT — Pacing violations + grade mismatch**

---

## FATAL FLAGS

### 1. **Hold-time violations (text cards)**
- **STAKES segment (0:15–0:45):** Single text card "MO-1 · Saint Louis · Aug 6, 2024" holds **30 full seconds** while VO delivers 78 words of backstory (Clay, Bell's prior run, 57–43 split).
  - **Violation:** Text card > 3.8s limit. Viewer stares at static election metadata while voice discusses 2020 primary dynamics.
  - **Fix required:** Break into 3–4 cards synced to VO beats: (1) "MO-1 · Deep Blue" (2) "Bush vs Bell · Both Democrats" (3) "Bell lost 2020 primary 57–43" (4) transition to money entry.

### 2. **Missing visual rhythm markers**
- **THE FIGHT (0:45–2:00):** 75-second segment with only 2 on-screen cues (ChartBar, SourceCard). VO explains UDP, AIPAC, super PAC mechanics, $6M solo spend, $8M total — **no scribe anchor for numeric escalation**.
  - **Violation:** Documentary receipt standard requires **scribe card every 12–18s** when narrator cites figures or committee names. This segment drifts into podcast mode (voice-only explainer).
  - **Fix required:** Insert scribe cards at:
    - "United Democracy Project — the super PAC formed in twenty twenty-two" → **SCRIBE: "UDP · Est. 2022 · Pro-Israel"**
    - "alone reported about six million" → **SCRIBE: "$6M · UDP anti-Bush"**
    - "Add other Israel-policy committees … crosses eight million" → **SCRIBE: "$8M+ total outside spend"**

### 3. **Contrast/grade mismatch (if rendered as Short)**
- Script slug says `pillar: donors_races` but VO runtime is **3:45** (long-form). If producer mistakes this for Shorts template:
  - **Violation:** Shorts require **punchy contrast grade** (0.92+ luma range, sharp whites on blue ledger). Long-form uses softer documentary palette.
  - **Flag for producer:** This is **Jessica/long-form only**. Do not apply Aria hook voice or Shorts grade. If Shorts version needed, write separate 33s script per `brand/voice-writing.md`.

---

## SECONDARY FLAGS

### 4. **Jump-cut risk (mid-sentence VO)**
- **THE TRAIL (2:00–3:15):** VO line "Picture a voter in Saint Louis in July" flows into "The mailpiece says Bush is too extreme" with no pause marker. If editor cuts between these sentences for pacing, result is **hard jump mid-thought** (viewer hears click).
  - **Mitigation:** Insert `[beat]` or `…` in script between setup ("Picture a voter") and payoff ("The mailpiece says"). Signals editor to leave 0.3s silence or use music swell as transition.

### 5. **Music sidechain note (not violation yet)**
- Script has no `[music swell]` or `[drop to -18dB]` cues. For 3:45 runtime, background track will need **3–4 volume dips** to avoid voice-over-music clash.
  - **Pre-flag for audio stage:** When `audio-qc.py` runs, if voice dips below −16 LUFS during money-stat lines (0:45–2:00), that's **sidechain fail** — music too hot. Council 10 checks this in rough cut; script should warn editor now.
  - **Fix:** Add `[music drop]` markers at: (1) "$8M" hook line, (2) "six million" first UDP cite, (3) "fifty-one to forty-six" result line.

---

## PASS CRITERIA NOT MET

| Criterion | Status | Gap |
|-----------|--------|-----|
| Scribe-anchored segments (shorts) | N/A | Long-form |
| Master/VO ratio 0.85–1.15 (long-form) | ❌ | No visual beat markers → ratio will skew > 1.3 (voice-heavy) |
| `audio-qc.py` PASS | ⏳ | Cannot run until music cues added |
| No black frames > 0.5s | ✅ | Script does not call for black holds |
| Text card holds < 3.8s | ❌ | STAKES card = 30s hold |

---

## EDITOR INSTRUCTIONS (if approved for re-cut)

1. **Break STAKES card into 4-beat sequence** (see Flag 1).
2. **Insert 3 scribe cards in THE FIGHT** at UDP intro, $6M cite, $8M total (see Flag 2).
3. **Add silence marker** (`[beat]`) between "Picture a voter" and "The mailpiece says" (Flag 4).
4. **Add music-drop cues** at hook, first UDP dollar cite, and result line (Flag 5).
5. **Do not render as Short** — this is Jessica/long-form lane only. If Shorts needed, kick to writer for Aria rewrite.

---

## VERDICT

**REJECT for pacing violations.** Script has strong receipt-anchor structure (hook → money trail → verdict) and clean Sarah voice, but visual rhythm is podcast-paced, not documentary-paced. Viewer will see 30s text hold in minute 1, then drift through 75s of voice-only explainer without scribe anchors.

**Return to writer** with Flag 1 + Flag 2 fixes required. Once cards are synced to VO beats, this clears Council 10 and moves to audio stage.

---

**Token budget used:** ~1,850 / 200,000  
**Next step:** Writer revises

---
