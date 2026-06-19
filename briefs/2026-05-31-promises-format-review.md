# Decision memo: "Did they keep their promise?" — format & placement review

**Date:** 2026-05-31
**For:** Founder approval before any rip-out
**Author:** Product/UX + accountability-journalism review (task #39)
**Scope:** No code changes in this pass. This is a recommend-then-build memo.

---

## TL;DR recommendation

**Endorse the founder's instinct — with one sharpening.**

1. **Kill the A-Z global `/promises` dump.** It is the weakest surface CR has: 7,443 cards of mostly-noise, almost none with a real "receipt."
2. **Do NOT throw away the URL or the SEO.** Replace the dump with a single curated cut: **"Broken Promises" tracker** — broken + half-kept only, newest first, grouped by politician. That keeps the indexed surface, drops the noise, and matches "broken is the signal."
3. **Make the politician page the real home** (founder's preference) — but fix the module: lead with broken, collapse the 53%-kept long tail, and stop pretending `verdict_reasoning` is "the receipt."
4. **Refresh: neither pure-monthly nor a per-vote cron.** Use a **monthly backfill as the floor + an event nudge** that only re-touches a politician when a *tracked* bill of theirs gets a floor vote. Detail in §5.
5. Old-bills search under `/bills` already shipped (task #36, `BillsSearch` component) — so the "swap promises for bill search" half of the founder's plan is already done. This memo only has to settle the promises half.

---

## The data that drives all of this

Live counts from `cr_promises` (2026-05-31, Trump excluded is roughly the same shape):

| Metric | Count | Share |
|---|---|---|
| Graded promises | 7,443 | 100% |
| KEPT | 3,920 | **53%** |
| PARTIAL (half-kept) | 2,787 | 37% |
| BROKEN | 687 | **9%** |
| YOU DECIDE | 49 | <1% |
| **Has a real `case_study_narrative`** | **48** | **0.6%** |
| Politicians covered | 529 | — |

**Two facts decide this memo:**

- **Only 48 of 7,443 promises (0.6%) have an actual written case study.** Everything else falls back to `verdict_reasoning` (`app/promises/page.tsx:285`, `brief = fullCase || verdict_reasoning`). So when a card says **"The receipt"** it is lying 99.4% of the time — the label only flips to "Why this verdict" when the long narrative exists (`page.tsx:321`). The product's headline promise ("each with the receipt," metadata line 24) is unbacked at scale.
- **Broken is genuinely rare (9%).** The founder's "broken is the signal, kept is noise" is not just instinct — it's the only way to make 7,443 rows interesting. A reader scanning the A-Z index hits a wall of "KEPT … KEPT … PARTIAL" with thin one-liners. The 687 broken promises are the entire reason anyone clicks.

---

## 1. Is the current promise CARD format helpful, or noisy?

The card itself (`PromiseCard`, `page.tsx:282-352`) is **well-built but pointed at the wrong content.**

**What works (keep):**
- The receipt visual frame (`.receipt` / `Stamp`) is on-brand — it's the paper-audit aesthetic the whole site sells.
- Header line **politician · party · state** linking to the politician page (`page.tsx:298-307`) is correct IA — it always routes traffic toward the page the founder wants to be the home.
- The verdict **Stamp** is the right primitive and the strongest scan signal on the card.
- `details/summary` expand at 240 chars (`page.tsx:287-334`) is a sensible teaser pattern.

**What's broken (the noise):**
- **The "receipt" rationale is mostly `verdict_reasoning`, not a case study.** `verdict_reasoning` is terse internal grading logic, not reader-facing narrative. Across 7,395 cards it reads dry and same-y. The label "The receipt" oversells it. **Fix: only show "The receipt" when `case_study_narrative` exists; for the rest, label it "Why this verdict" (the code already supports this, line 321) and accept it's a one-liner — don't dress it up.**
- **KEPT cards are dead weight in a scan.** A green KEPT stamp with a dry reasoning line gives the reader nothing to do. 53% of the index is this. The founder is right.
- **No date, no recency.** Cards sort by `case_study_narrative` presence then `promise_number` (`page.tsx:91-92`) — i.e. effectively arbitrary. There is no "what changed recently" signal anywhere, which is exactly what an accountability tracker lives on.
- **The verdict badge does not carry a "this got worse" or "newly broken" state.** Accountability journalism is about *movement* (a kept promise that just broke). The current static stamp can't express that.

**Verdict on the card:** good chassis, wrong cargo, no time axis. Don't rebuild the card — re-aim it at broken/changed promises where the format earns its weight.

---

## 2. Should the global `/promises` index stay, change, or go?

**Change it — don't keep it as-is, don't delete the URL.**

The founder's two options were "keep on politician pages only + remove the global surface" vs. status quo. I recommend a **third, narrower thing in between**, because deleting `/promises` outright throws away real SEO with no upside:

- **SEO reality check:** the value is NOT 7,443 indexed promise rows — the index page is `force-dynamic, revalidate=0` (`page.tsx:18-19`), so it's not even a static SEO asset today, and individual promises don't have their own URLs (they live on politician pages via Receipt IDs). So the "7,334 indexed pages" SEO is largely **already on the politician pages**, not on `/promises`. Killing the A-Z dump costs almost no SEO.
- **What the dump costs us:** it's the site's least compelling surface and it dilutes the brand claim ("each with the receipt") against 99.4% thin cards.

**Recommended end state for the URL:** repoint `/promises` to a **"Broken Promises" tracker**:
- Default filter = **broken + half-kept only** (`verdict in (BROKEN, PARTIAL)`), broken first.
- **Group by politician**, most-recently-changed politician on top.
- Keep the search box and the verdict filter chips (let a curious reader still pull up "kept" if they want — but it is not the default view).
- Rename masthead from "Did they keep their promise?" to a sharper accountability frame: **"What they promised — and broke."** Keep "Every promise, free to read" as the secondary line so the free-credibility positioning survives.

This is strictly more compelling than the A-Z dump, keeps the free-traffic surface, and is a faithful expression of "broken is the signal."

> If the founder still wants it gone entirely: 301 `/promises` → `/leaderboard` and put the broken-promises cut as a section on the leaderboard. But I recommend keeping the dedicated URL — "broken promises tracker" is a better SEO landing phrase than anything on the leaderboard.

---

## 3. Best format if it stays (the Broken Promises tracker)

Concrete spec:

- **Lead with a one-line stat bar:** "687 broken · 2,787 half-kept · across 529 politicians" — gives the page a Bloomberg-ish factual anchor without a chart.
- **Group by politician, not A-Z by promise.** One politician = one mini-block: name · party · state, then their broken/half-kept promises as tight rows. This is far more scannable and routes hard to the politician page.
- **Tighten each row to promise → verdict → one-line why → source.** Drop the "The receipt" label unless a real case study exists. Cap the why at ~140 chars (these are reasoning lines, not narratives — don't give them 240).
- **Recency:** sort politician blocks by most-recently-refreshed (`last_refreshed_at` exists on the politician row, used at `page.tsx:410`). Add a small "updated 2026-05-—" stamp per block. That single change turns a static dump into a tracker worth a return visit.
- **Keep KEPT out of the default.** Reachable via the "Kept" filter chip for anyone who wants the full record, but never the landing view.
- The paid CTA block at the bottom (`page.tsx:261-277`, "the money behind the vote is the paid part") is good — keep it verbatim.

---

## 4. The per-politician promise module (the founder's preferred home)

The politician page already has the right bones (`app/politician/[slug]/page.tsx`):
- **Tenure receipt** (`:378-398`) — AI narration, already framed "Who funds them · what they voted · **broken promises**." Good. This is the human-readable summary and should stay the top promise-context block.
- **Scorecard Receipt** (`:403-459`) — kept/partial/broken counts + headline % kept. This is the share asset reporters screenshot. Keep exactly.
- **Featured promises** (`:580+`) — full Receipt each.
- **Remaining promises** (`:614+`) — "every other promise on file."

**Recommended changes to the per-politician promise module:**

1. **Reorder the "remaining" list to lead with BROKEN, then PARTIAL, then collapse KEPT.** Right now featured-then-the-rest buries the broken ones among kept. On a politician page the broken promises are the story; surface them first under a "Broken / unkept" subhead, then "Half-kept," then a collapsed `<details>` "Kept promises (N)" so the 53% green tail is one click away, not a scroll wall.
2. **Promote the scorecard's Broken count into a clickable anchor** that jumps to the broken sub-list. Reporters want "show me the 4 he broke," not the full 38.
3. **Stop labeling thin reasoning as "the receipt"** here too — same fix as the global card.
4. Everything else (tenure narration, scorecard Receipt, share strip, citation block, newsletter capture) stays — that stack is good and conversion-wired.

This makes the politician page a complete answer on its own, which is the prerequisite for retiring the A-Z global view.

---

## 5. Refresh cadence: monthly backfill vs. on-bill-vote cron

**Current state:** there is **no promise re-grading cron at all.** The only crons in `render.yaml` are `cr-content-daily` (archive races, content), monthly `spot-audit`, and outreach. Promises are seed/backfill-driven; the tenure summary has a one-shot backfill script (`scripts/backfill-politician-tenure-summary.mjs`) computed once and stored. So today the answer is effectively "never re-graded unless a human runs a script."

**Recommendation: monthly backfill floor + targeted event nudge. Not a generic per-vote cron.**

- **Why not a pure per-bill-vote cron:** most floor votes don't map to a tracked promise. Firing a re-grade on every vote burns Haiku budget re-narrating politicians whose promise status didn't move — exactly the "burning API budget" failure mode in the portfolio rules, and the kind of env-flag/forget-to-flip trap the founder has flagged before.
- **Why not pure monthly:** a senator who flips on a flagship promise this week shouldn't wait up to 30 days to show as broken. Accountability journalism's whole value is timeliness.

**The cadence to build:**
1. **Monthly full backfill** (1st of month, mirror the existing `spot-audit` schedule `0 9 1 * *`) — re-grade all promises against current primary sources, refresh `last_refreshed_at`, regenerate tenure narration. This is the floor; guarantees no promise goes stale > 30 days.
2. **Event nudge inside the existing `cr-content-daily` cron** — no new service. When the daily run sees that a bill **already linked to a tracked promise** got a floor vote in the last 24h, re-grade *only that politician's affected promise(s)* and re-stamp the card with a "Changed 2026-05-—" badge. Cheap, targeted, and it's what feeds the "newly broken this week" recency signal the tracker needs.

This gives timeliness where it matters and spends zero extra budget on the 91% of promises that didn't move.

---

## Build order (after founder approval)

1. Repoint `/promises` → Broken Promises tracker (broken+half-kept default, grouped by politician, recency sort, honest "Why this verdict" label). *(½ day)*
2. Reorder per-politician promise list: broken → half-kept → collapsed kept; clickable Broken anchor from scorecard. *(½ day)*
3. Add `last_refreshed_at` "updated" stamps + a "Changed this week" badge primitive. *(small)*
4. Wire the monthly backfill cron + the daily event-nudge re-grade. *(1 day, no new service)*

Old-bills search under `/bills` is **already shipped** (task #36) — nothing to build there.

---

## What I did NOT touch / open questions for founder

- **Trump carve-out** (`TRUMP_IDS`, `page.tsx:32-35`) stays paid/excluded — unchanged in every recommendation above.
- **Do you want `/promises` to keep a dedicated URL** (my rec) **or fully fold into `/leaderboard`** with a 301? I recommend keeping the URL for the "broken promises tracker" search phrase.
- **Should we invest in writing more real `case_study_narrative`s?** Only 48 exist. If the answer is "the one-liner reasoning is fine," then we should stop using the word "receipt" for promises and reserve "the receipt" for the donor/bill product where the paper trail is real.
