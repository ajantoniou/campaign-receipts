# Votes Leaderboard — Scope & Recommendation

**Date:** 2026-05-30
**Authors:** Expert 1 (veteran accountability journalist, ProPublica/OpenSecrets lineage) + Expert 2 (campaign-finance YouTube/TikTok creator)
**Founder ask:** "scope the votes leaderboard … build what is content worthy not lame stats."
**Status:** SCOPE ONLY — no code changes. Numbers below are pulled live from Supabase `jivahkfdkduxasnzpzgx` on 2026-05-30.

---

## TL;DR (read this if nothing else)

1. **The % alignment table is not shippable as a leaderboard today, and arguably never should be the headline.** Only **11 of 43** scored politicians clear the ≥3-vote bar; only **8** clear ≥5. Worse — and this is the part that would get us a libel letter — **most of the "votes" being scored are procedural rule resolutions** ("Providing for consideration of…"), not the substantive policy votes a viewer assumes. Turner's headline "7/7 with Defense" includes `hres 873` and `hres 722`, which are continuing-resolution *rule* votes, not defense-bill votes. Shipping "Turner votes with defense 100% of the time" off that data is **overclaiming and partly false.**
2. **The strongest, most viral, most defensible data we already own is NOT in the alignment table at all — it's `cr_races.top_pacs`:** named PACs, named targets, dollar amounts, support/oppose direction, and FEC IDs. That is the "stop the scroll" asset. The leaderboard's content engine should be built on PAC-vs-candidate receipts first, and on vote-alignment second, only after the procedural-vote contamination is cleaned and the sample deepens.
3. **First shippable (true + content-worthy with today's data):** a **"Who Paid to Beat Them" PAC receipts feed** — individual cards built from `top_pacs` (e.g. *UDP spent $8.5M to beat Cori Bush*; *MAGA KY + RJC spent $9.6M against Massie*). Plus a **tiny, brutally honest "Most Independent vs Most On-Brand" vote board** limited to the ~3 politicians whose alignment survives a procedural-vote scrub — labeled as a *sample*, not a ranking.
4. **The vote-alignment leaderboard the founder is imagining (deep, rankable, damning) requires a backfill** — strip procedural votes, tag substantive bill-industry positions, add 100+ real roll-calls and ideally Senate votes. Prioritized plan in §C.

---

## A. The content formats — what the influencer would actually post

Lame: "Most bought politician (ranked by % aligned)." A 11-row %-table dies in the feed. Here is what actually gets posted, each tied to **real rows we pulled today.**

### Format 1 — "Who Paid to Beat Them" (PAC receipt cards) — THE HEADLINER
One card = one PAC → one target → one dollar number → one direction. From `cr_races.top_pacs`, verified live:

- **"$8.5 MILLION to end one career."** United Democracy Project (AIPAC-affiliated, FEC **C00761668**) spent **$8.5M against Cori Bush** in MO-01 2024. Face, number, the word *against*.
- **"They spent $9.6M to stop ONE congressman."** In KY-04, **MAGA KY ($5.6M)** + **Republican Jewish Coalition ($4.0M)** vs Thomas Massie — while **Kentucky 4th PAC ($4.6M)** + **Kentucky First PAC ($0.92M)** spent to save him. A head-to-head "who's paying for this seat" card.
- **"AIPAC's super PAC is in your primary too."** UDP (FEC **C00799031**) **$2.6M for Ed Gallrein** vs Massie. Same playbook, two states — that repetition IS the story.
- **"$22M from one side, $13.9M from the other."** TX runoff: House Majority PAC (Pelosi-aligned) $22M vs Congressional Leadership Fund (Johnson-aligned) $13.9M. The "both parties do it" card that defuses the "you're partisan" reply.

Why it wins: every element a Short needs is already in one row — **name + affiliation + dollar + target + support/oppose + FEC ID.** No causation claim required; "spent $X against Y" is a *fact*, not an inference. This is the brand's proven lane (the AIPAC/UDP races are already the channel's best-performing content).

### Format 2 — "Vote of the Week + Who Paid for It"
A weekly card: one real, *substantive* roll-call + the donor industry on the winning side. Built from `cr_donor_vote_alignment` JOIN `cr_bills` **filtered to substantive bills only** (HR 4216 Made-in-America Defense, S.1071 NDAA, HR 21 Born-Alive, HR 498 Do No Harm in Medicaid, HR 3633 Digital Asset Market Clarity). Format: *"This week the House passed [bill]. Industry [X] wanted it. Here's who voted yes and what [X] gave them."* Cadence keeps the feed alive without needing a deep leaderboard.

### Format 3 — "Hall of Fame / Hall of Shame" (NOT a % ranking)
Two short, curated lists — **not** an auto-ranked table:
- **Hall of Fame (broke from their top donor):** AOC voted *against* the Big Tech/Defense position **8 of 9** times; DeLauro broke from Defense **5 of 7**; Pelosi broke from Pharma **3 of 4**. "Broke from the money" is the rare, surprising, *positive* reveal that earns trust and shareability ("wait, AOC is the LEAST bought here?").
- **Hall of Shame (voted the donor line every time):** only after procedural scrub. Today the honest version is small and we say so.

The curation (human/editor pick from a candidate pool) is the journalist guardrail — it stops a 3-vote fluke from topping a "most bought" list.

### Format 4 — Head-to-head "Who's Bought-er?" (engagement bait, fact-bounded)
Two faces, two real numbers, "you decide." Pull two politicians on the *same* substantive bill + same industry, show both votes. Argument-starter, but only ever shows the *fact* (vote + donor industry), never the verdict word "bought."

---

## B. The journalist's guardrails (non-negotiable; these survive a libel read)

1. **PROCEDURAL VOTE SCRUB IS MANDATORY.** Any `cr_bills` row of type `hres` whose title begins "Providing for consideration of…" is a *rule* vote, not a policy vote. Today these contaminate the alignment table (hres 354, 426, 580, 722, 873). **They must be excluded from any alignment card or stat.** Turner's "7/7" collapses once they're removed — verify the real substantive count before any Turner card ships.
2. **NEVER the word "bought," "bribed," or "for sale."** Defensible language only:
   - ✅ "Voted the way their top-donor industry wanted."
   - ✅ "Took $X from [industry/PAC]. Voted [yes/no] on [bill]. You decide."
   - ✅ "[PAC] spent $X against [candidate]." (pure fact)
   - ❌ "[X] was bought by Pharma." ❌ "[X] sold their vote."
   This is correlation, framed as correlation. The viewer draws the inference; we never assert causation.
3. **Minimum sample = ≥5 substantive (post-scrub) scored votes** to appear on any *ranked or %-bearing* surface. Single damning *receipt* cards (Format 1/2) can show n=1 because they show the specific vote, not a rate. A rate needs a sample; a receipt does not.
4. **Every card MUST cite, on the card or one tap away:** FEC committee ID (for PAC cards — e.g. C00761668), roll-call number + chamber + date (for vote cards), and bill type+number+title. No uncited card ships. The `cr_roll_calls` table has `roll_number`, `chamber`, `voted_at` — wire these into the citation line.
5. **"Individual / Retired" is banned as a headline industry.** It is an OpenSecrets catch-all, not an industry. Today it is `rank=1` on the money trail for 15+ bills (ROTOR Act $26.8M, etc.) — meaningless. Money-trail cards must filter it out and lead with the top *real* industry (Big Tech, Finance, Defense, Pharma, Crypto).
6. **Sponsorship money ≠ vote money — label them differently.** `cr_bill_money_trail` measures money to a bill's *sponsors*, and the real-industry amounts are modest ($46k–$238k: Epstein Files Act/Big Tech $238k, several Finance bills $109k–$157k). That is a "who sponsored this and who funds them" fact, NOT "this industry paid for this vote." Don't conflate the two in copy.

---

## C. Data gap + backfill plan (from ~11 rankable → a real feed)

| # | Work | Why | Effort |
|---|------|-----|--------|
| 1 | **Add `is_procedural` flag to `cr_bills`** (regex on title "Providing for consideration of…" + type `hres`) and exclude from `compute-alignment.mjs`. | Removes the false-positive contamination that makes today's table unshippable. Highest priority — it's a correctness bug, not a depth gap. | **S** (½ day) |
| 2 | **Ingest 100+ more substantive House roll-calls** for the 119th Congress and re-run alignment. | Today's 118 rows / 43 pols is too thin; we need ≥5 *substantive* votes on enough members to populate Hall of Fame/Shame honestly. | **M** (1–2 days, mostly Congress.gov/Clerk ingest) |
| 3 | **Expand `cr_bill_industry_positions` coverage** so more bills have a tagged industry support/oppose. | Alignment can only score a vote if the bill has an industry position. More tagged bills = more scorable votes per member. Today 79/116 bills have a real industry. | **M** (1–2 days; LLM-assisted tagging w/ human review gate) |
| 4 | **Per-politician × per-industry $ totals** (from FEC, into `donor_profile` or a new col on alignment rows). | This is the missing piece for the Format-2 "took $X, voted Y" card — currently the alignment table carries NO dollar amount (`total_from_industry` joined NULL). Without it the killer card is incomplete. | **M–L** (2–3 days; FEC bulk data) |
| 5 | **Senate votes (if obtainable).** | Doubles the universe, adds NDAA/appropriations Senate roll-calls, lets us cover Senators (zero today). | **L** (3–4 days) — do last. |
| 6 | Expand `cr_races.top_pacs` to more races. | Format 1 is the headliner and we only have 4 populated races. More named-PAC races = more receipt cards = more feed. | **M**, ongoing |

**Sequence:** 1 → (6 in parallel, it's the content engine) → 4 → 3 → 2 → 5.

---

## D. Free vs Pro line (consistent with founder's locked model)

- **FREE — the viral hook (everything in §A):** all PAC receipt cards, vote-of-the-week, Hall of Fame/Shame, head-to-head. The shareable screenshot is always free. This is the top of funnel; gating it kills reach.
- **PRO — the full searchable evidence/database:** every scored vote for every member with the full roll-call + FEC citation, filter/sort by industry/state/party, the underlying money-trail per bill, CSV export, "build your own head-to-head." The card makes the claim; Pro lets you *audit and extend* it. Matches the existing model (rankings/cards free, the database Pro — same line already used for the Big-Donor leaderboard, task #11).

---

## E. First shippable vs what waits

### Ship NOW (true + content-worthy with today's data)
1. **"Who Paid to Beat Them" PAC receipts feed** (Format 1) from `cr_races.top_pacs`. Zero new data needed — 4 races already populated, each card fully cited (FEC IDs present). This is the strongest asset we own and it ships today. **Build this first.**
2. **A small, honestly-labeled vote board** — but ONLY after the §B-1 procedural scrub (backfill item 1, ½ day). Show it as **"Sample: how a few members voted vs their top donor"** with an explicit "n=X votes, not a full ranking" disclaimer. Lead with the *Hall of Fame* framing (AOC 8/9 broke, DeLauro 5/7 broke) — the "least bought" angle is both more surprising and far safer than a "most bought" claim off thin, contaminated data.

### Waits for backfill
- Any ranked "% aligned" leaderboard or "most bought" superlative → waits for items 1+2+3 (procedural scrub + deeper roll-calls + more industry tags).
- The killer **"took $X, then voted Y"** card → waits for item 4 (per-member per-industry dollars). Today we can say *"voted the donor-industry line"* but not *"after taking $X"* — don't fake the dollar.
- Senator coverage → waits for item 5.

---

## F. Honest flags (where the data can't yet support a viral claim)

- ⚠️ **Turner "7/7 with Defense" is not safe to post as-is** — it's inflated by procedural rule votes. Recompute post-scrub before any Turner card.
- ⚠️ **No per-member donor dollars in the alignment pipeline today.** The single most viral vote card ("$X from Pharma → killed the drug bill") is *not buildable yet* with real numbers. Format 1 (PAC vs candidate) is the dollar-bearing card we CAN ship now; Format 2's dollar line waits for backfill #4.
- ⚠️ **Sample is genuinely small.** 11 members at ≥3 votes, several of those polluted by procedural votes. The post-scrub honest universe may be ~3–5 members for a vote board. The PAC feed (Format 1) does not have this problem — build the feed on PACs, not on the thin vote table.
- ⚠️ **`cr_top_donors` is thin** (53 pols, `is_pac` unpopulated) — do not lean on it for cards yet.
