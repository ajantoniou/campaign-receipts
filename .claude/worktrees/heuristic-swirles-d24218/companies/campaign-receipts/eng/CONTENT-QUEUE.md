# SEALED content queue — shorts & long-forms

**Viral panel backlog (canonical order):** `eng/VIRAL-PANEL-BACKLOG.md`  
**Published inventory:** `eng/PUBLISHED-YOUTUBE.md`

Source: `companies/Sealed/public/share-cards/v1/manifest.json` (145-promise book receipts).  
Shorts: `scripts/shorts/produce-short-generic.mjs` · Long-form: `produce-video.py` / `produce-from-storyboard.py`.

---

## On YouTube today

See `eng/PUBLISHED-YOUTUBE.md` (7 videos live).

---

## Long-form (next)

| Priority | Slug | Topic | Script | Storyboard | Master |
|----------|------|--------|--------|------------|--------|
| — | `sealed-aipac-iran-deal-v7` | Iran / AIPAC | ✅ | ✅ | **Published** |
| — | `sealed-drain-the-swamp-v1` | Ch. 2 ethics pledge | ✅ | ✅ | **Published** |
| **1** | `sealed-aipac-embassy` | Jerusalem embassy deep dive | not written | — | — |
| **2** | `sealed-aipac-campus-eo` | EO 13899 / campus | not written | — | — |
| 5 | `sealed-china-tariffs` | China tariffs promise (Ch. 7) | not written | — | — |
| 6 | `sealed-mexico-wall` | Mexico pays for the wall (Ch. 9) | not written | — | — |
| 7 | `sealed-repeal-obamacare` | Repeal Obamacare (Ch. 4) | not written | — | — |

**Also in repo (not daily Shorts queue):** `sealed-hook-v6` — 30s book hook film (`eng/storyboards/sealed-hook-v6.json`), top-of-funnel for sealed2016.com.

**Retired storyboards (do not publish):** v2–v6 Iran builds except **v7** as the canonical long-form master.

---

## Shorts (next)

Daily queue today only lists one ID in code (`run-daily.mjs`); below is the **recommended order** from share-card manifest + AIPAC trilogy.

| Priority | Share # | Slug | Verdict | Angle (one line) | In `PROMISES` table? |
|----------|---------|------|---------|------------------|----------------------|
| — | 1–3 | AIPAC trilogy shorts | — | **Published** |
| — | 4 | `drain-the-swamp` | BROKEN | **Published** `oms8bFVEQOU` |
| — | 5 | `china-tariffs` | KEPT | **Published** `9GsUe5LycQY` |
| **1** | 6 | `repeal-obamacare` | BROKEN | Skinny repeal failed 49–51 |
| 5 | 6 | `repeal-obamacare` | BROKEN | Healthcare repeal | ❌ add |
| 6 | 7 | `mexico-pays-for-wall` | BROKEN | Wall funding | ❌ add |
| 7 | 8 | `syria-end-wars` | PARTIAL | End wars / Syria | ❌ add |
| 8 | 9 | `nato-pay-up` | PARTIAL | NATO “pay up” | ❌ add |
| 9 | 10 | `chicago-guns` | READER | Chicago / guns | ❌ add |
| 10 | 11 | `platform-deportation` | KEPT | 2024 platform deportation | ❌ add |
| 11 | 12 | `platform-who-withdraw` | KEPT | WHO withdraw | ❌ add |

**Shorts production path:** `eng/shorts-scripts/<slug>.md` (fresh copy, Jessica) → `produce-viral-001.mjs` or extend `run-daily.mjs` per slug.

---

## Suggested release rhythm (founder-adjustable)

1. **Upload long-form v7** (Iran) — unlisted QC → public when happy.  
2. **Short 2 + 3** — complete AIPAC trilogy on Shorts.  
3. **Long-form 2** (embassy) + **Short 2** cross-promote.  
4. **Long-form 3** (campus EO) + **Short 3**.  
5. Widen to Ch. 4–10 share cards as scripts are authored.

---

## New Pending Lane (Required)

### YouTube Viral Researcher — political scandal + donor influence

Before each next-video lock, run a dedicated researcher pass:

1. Pull current viral political stories from YouTube Inspiration/Trending and major political channels.
2. Filter for stories with provable donor-influence or outside-spending hooks.
3. Score each candidate on:
   - comment propensity (rage/disbelief argument potential)
   - source strength (FEC/OpenSecrets/public filing quality)
   - speed to publish (can we ship in <24h)
4. Output top 3 in `eng/briefs/<date>-topic-radar.md` with:
   - recommended next video title
   - 1-paragraph angle
   - source pack links
   - short-form hook line
