# YouTube b-roll audit — SEALED shorts 002–007

**Lock:** 2026-05-23 · **Pipeline:** [`scripts/shorts/produce-short-generic.mjs`](../scripts/shorts/produce-short-generic.mjs) (`youtubeBroll` vendor lane) · **Fetcher:** [`companies/NTO/scripts/youtube-broll-clip.py`](../../NTO/scripts/youtube-broll-clip.py) (now supports `--width 1080 --height 1920 --fit crop` for CR vertical shorts)

---

## Why this exists

Founder feedback (2026-05-23): "news clips are a hit" — real fair-use news footage out-performs generic AI-stills + Remotion cards on hook/payoff beats. All 5 SEALED shorts (002, 003, 004, 005, 007) currently use **100% Remotion compositions** (Timeline / SourceCard / VerdictStamp) — zero real footage. This is the highest-leverage upgrade after packaging.

The plumbing is ready; this doc lists per-beat candidates so the next session can source clips, fill in `youtubeBroll` blocks, rebuild, and re-upload.

---

## Vendor priority (codified in `produce-short-generic.mjs`)

When a segment declares both `youtubeBroll` and other vendors:

1. **`youtubeBroll`** wins on visual budget (≤55%, max 8s) — real footage
2. **`broll`** (fal-video Kling) — generic motion (skipped if youtubeBroll claimed budget)
3. **`illustration`** (fal-still + ken-burns) — still imagery
4. **`composition`** (Remotion) — fills remaining budget with explainer cards
5. **`vendor: motion-card`** — CTA-only fallback

Fair-use envelope (enforced by the canonical fetcher):
- ≤30s per clip
- ≤90s total per source per episode
- Audio always stripped — VO carries the scene

---

## Per-short candidates

### 002 — Embassy (`scripts/shorts/episodes/sealed-002-aipac-embassy.json`)

| Beat | Currently | Real-footage candidate | License lane | Notes |
|------|-----------|------------------------|--------------|-------|
| `hook` (Timeline) | Remotion timeline | **U.S. Embassy Jerusalem ribbon-cut (May 14, 2018)** — C-SPAN / White House YouTube has the official feed | public-domain (US govt) | Open on Kushner/Ivanka at podium. 4–6s. |
| `ribbonDate` (SourceCard) | parchment card | Same ribbon clip continues, or shot of opened embassy plaque | public-domain | Or skip — SourceCard is fine here |
| `aipacPriority` (Timeline) | Remotion | **AIPAC conference floor** (CSPAN AIPAC Policy Conference uploads) | public-domain (C-SPAN cong'l) | 3s establishing shot |
| `gazaSameDay` (SourceCard) | parchment card | **UN OHCHR briefing footage** OR Reuters/AP same-day border footage | fair-use commentary, ≤6s | **Sensitive — use wide shot, no graphic injury**. Stay inside YPP guardrails per `youtube-monetization.md` |
| `kept` (VerdictStamp) | Remotion stamp | Keep Remotion — verdict beat is brand identity | n/a | |
| `cta` (motion-card) | parchment card | Keep | n/a | |

### 003 — Campus EO 13899 (`scripts/shorts/episodes/sealed-003-aipac-campus.json`)

| Beat | Currently | Real-footage candidate | License lane | Notes |
|------|-----------|------------------------|--------------|-------|
| Hook | Remotion | **Trump EO 13899 signing ceremony (Dec 11, 2019)** — White House YouTube channel | public-domain (US govt) | 3–5s, signing pen / executive order folder |
| Body | Remotion | **University campus b-roll** (any CC-tagged campus walking footage on YouTube) | cc-by | Generic but real beats Remotion box |
| Verdict | Remotion stamp | Keep | n/a | |

### 004 — Drain the Swamp (`scripts/shorts/episodes/sealed-004-drain-the-swamp.json`)

| Beat | Currently | Real-footage candidate | License lane | Notes |
|------|-----------|------------------------|--------------|-------|
| Hook ("drain the swamp") | Remotion | **2016 rally with the chant** — C-SPAN campaign rally feeds | public-domain (C-SPAN) | 4–6s of crowd / chant (audio stripped — VO over) |
| EO 13770 signing | Remotion | **Trump signing EO 13770 (Jan 28, 2017)** — White House YouTube | public-domain | 3s, the pen-up moment |
| EO 13983 revocation | Remotion | **Jan 19/20, 2021 final-day signings montage** — C-SPAN | public-domain | Establishes "on the way out" framing |
| Lobbying delta | Remotion chart | Keep Remotion — chart is the receipt | n/a | Real footage doesn't substitute for the $3.15B → $3.53B delta |
| Verdict | Remotion stamp | Keep | n/a | |

### 005 — China tariffs $350B (`scripts/shorts/episodes/sealed-005-china-tariffs.json`)

| Beat | Currently | Real-footage candidate | License lane | Notes |
|------|-----------|------------------------|--------------|-------|
| Hook ("piggy bank") | Remotion | **Trump 2016 stump on China** — C-SPAN | public-domain | 4–6s, audio stripped |
| Section 301 rounds | Remotion | **Port of Long Beach container footage** (CC-tagged) | cc-by | Generic but realer than AI |
| Phase One signing | Remotion | **Phase One trade deal signing (Jan 15, 2020)** — White House YouTube | public-domain | 4s |
| Biden-kept beat | Remotion | **Biden trade policy press briefing** — White House YouTube | public-domain | 3s, establishes "next admin kept it" |
| Verdict | Remotion stamp | Keep | n/a | |

### 007 — Skinny repeal 49–51 (`scripts/shorts/episodes/sealed-007-repeal-obamacare.json`)

| Beat | Currently | Real-footage candidate | License lane | Notes |
|------|-----------|------------------------|--------------|-------|
| Hook | Remotion | **2016/17 rally — "repeal and replace"** chants — C-SPAN | public-domain | 4–6s |
| **McCain thumbs-down moment** | Remotion | **THE iconic McCain thumb-down vote (July 28, 2017, ~01:30 AM)** — C-SPAN floor cam | public-domain (C-SPAN cong'l) | THIS IS THE HOOK BEAT — 6–8s, the most recognizable visual in the whole short. Get this clip and the short levels up. |
| Vote tally | Remotion | C-SPAN tally board reveal `49–51` | public-domain | 3s |
| Verdict | Remotion stamp | Keep | n/a | |

---

## How to add to an episode JSON

Example for short 007 McCain beat:

```json
"mccainThumb": {
  "youtubeBroll": {
    "url":     "https://www.youtube.com/watch?v=<C-SPAN-clip-id>",
    "start":   "00:14",
    "end":     "00:22",
    "license": "public-domain",
    "title":   "U.S. Senate floor — Health Care Freedom Act vote (July 28, 2017)",
    "year":    2017,
    "notes":   "McCain no-vote thumb-down moment; audio stripped, VO overlay",
    "duration": 6
  },
  "composition": "VerdictStamp",
  "props": { "brand": "sealed", "verdict": "BROKEN", "promise": "Repeal Obamacare", "citation": "Senate 49–51 · July 28 2017" }
}
```

The dispatcher in `produce-short-generic.mjs` will:
1. Download the source via `yt-dlp` (cached under `companies/NTO/content/videos/_youtube-broll-cache/`)
2. Cut `[start, end]`, strip audio, crop-fit to 1080×1920
3. Apply the 6s `duration` cap
4. Drop `_yt-broll-mccainThumb.mp4` + `_yt-broll-mccainThumb.attribution.json` in `_build/007/`
5. Use it as the first ~55% of the beat's visual budget; Remotion VerdictStamp fills the rest

---

## After a swap: required follow-ups

1. **Re-run** `node scripts/shorts/produce-short-generic.mjs --episode sealed-007-repeal-obamacare`
2. **Re-QC** via existing gates (production-qc, ship-checklist)
3. **Append attribution** to `description.md` — the sidecar `attribution.json` files are already there; the `write-description.py` integration (NTO has it; CR doesn't yet) is the only missing piece. Until that's wired, add a one-line credit manually to the description's bottom.
4. **Re-upload** — counts as another Video Uploads quota unit. Plan for separate quota night.
5. **Monetization re-review** — `youtube-monetization.md` for the slug; flag if a sensitive clip was added (e.g. 002 gazaSameDay).

---

## C-SPAN burn-in handling (LOCKED 2026-05-23)

C-SPAN YouTube uploads have a permanent lower-third graphic ("AMENDMENT TO REPEAL OF THE HEALTH CARE LAW", etc.) burned into the bottom ~25%. On a 1080×1920 vertical crop this collides with SEALED captions/stamps.

**Solution wired:** `youtubeBroll.cropTopPct: 0.75` (or similar) → fetcher pre-crops the source to the top 75% of its height before scaling. The C-SPAN graphic is in the discarded 25%. Verified on McCain clip (`hT2pp_KrJGg`) — clean output, full gesture preserved.

CLI:

```bash
python3 companies/NTO/scripts/youtube-broll-clip.py \
  --url ... --start ... --end ... \
  --width 1080 --height 1920 --fit crop \
  --crop-top-pct 0.75
```

Episode JSON:

```json
"youtubeBroll": { ..., "cropTopPct": 0.75 }
```

Default is 1.0 (no pre-crop). Use 0.72–0.78 on any source with a known burned-in lower-third (C-SPAN, news network chyrons). Clean White House feeds don't need it.

## Verified candidates (sourced this session)

All verified via `yt-dlp --no-download --print` probe (real URL + channel + duration) and added to episode JSONs as `youtubeBroll` blocks. Hook-only scope per founder decision 2026-05-23.

| Short | Beat (segment id) | Source | URL | License | Timestamps | Crop | Notes |
|-------|-------------------|--------|-----|---------|------------|------|-------|
| 002 | ribbonDate | Toronto Star | `BKqoao7HjxQ` | fair-use | 00:14 → 00:23 (~6s) | 0.85 | Ivanka plaque unveiling. `_needs_scrub` for exact peak frame. |
| 003 | eoSign | AP Archive | `q6b2GJkbUE0` | fair-use | 01:28 → 01:55 (~5s) | 0.82 | EO 13899 signing pen-up. `_needs_scrub` for exact peak frame. |
| 004 | hook | CBS News | `PxWu69vrdhA` | fair-use | 00:08 → 00:16 (~6s) | 0.85 | 2016 Johnstown PA rally, Trump podium. Verified via frame inspection. |
| 005 | hook | CBS News | `PxWu69vrdhA` | fair-use | 00:16 → 00:24 (~6s) | 0.85 | Same source as 004, different slice. VO paraphrases piggy-bank. |
| 007 | mccainBeat | C-SPAN | `hT2pp_KrJGg` | **public-domain** | 00:08 → 00:14 (~6s, peak ~00:10) | 0.75 | THE iconic gesture. Verified end-to-end with `/tmp/mccain-cropped.mp4`. |

**Fair-use envelope:** All 5 clips ≤6s, well under the 30s/clip cap. Two clips from CBS `PxWu69vrdhA` total 12s — well under the 90s/source/episode cap (and each clip lands in a different episode).

**YPP risk by short:**
- 002 — yellow-expected (Israel/Gaza topic; same as LF embassy)
- 003 — green-expected (campus EO; no inflammatory content in clip)
- 004 — green-expected (rally, audio stripped)
- 005 — green-expected (same rally, audio stripped; visual carries trade-policy story)
- 007 — green-expected (Senate procedural moment)

**Rejected candidates:**
- `ODw5mO_r6wY` ("rape our country" line for 005) — would trigger YPP red ads
- `B5BgSJ0q-YY` (2024 rally for 004) — wrong year for SEALED 2016 audit
- All C-SPAN.org direct URLs — bot-gated by tollbit, can't fetch from pipeline
- White House Trump-era YouTube channel — deleted Jan 2021; only `Trump White House Archived` remains for select clips

## Rebuild + re-upload plan

1. **Local rebuild** (no quota cost) — `node scripts/shorts/produce-short-generic.mjs --episode sealed-007-repeal-obamacare` (then 002, 003, 004, 005). Each fetches its source on first run, cached after.
2. **Manual `/watch` verification** — confirm the b-roll clip lands cleanly, no chyron artifacts, VO sync intact
3. **Re-upload** — separate quota night (5 uploads against ~6/day cap). Add to a new `sealed-shorts-broll-replace.sh` runner OR re-run sealed-youtube-resume.sh after deleting the just-uploaded versions
4. **Description update** — append attribution line per sidecar `_yt-broll-<seg>.attribution.json` to each short's description (until `write-description.py` is ported from NTO)

## Open work for next session

- [ ] Source actual YouTube URLs + timestamps for each candidate above (currently named only, not linked)
- [ ] Confirm each clip's license tier (most White House / C-SPAN footage is public-domain; news network footage is fair-use commentary with the ≤30s envelope)
- [ ] Add `youtubeBroll` blocks to the 5 episode JSONs
- [ ] Port NTO's `write-description.py` attribution-block writer into CR's `pre-upload-pack.py`
- [ ] Re-build affected shorts; re-QC; re-upload (separate quota night)
- [ ] Add an `audit/` cell to the resume script's run report that lists which beats used real vs AI footage per piece

---

## Pipeline anchors

- Canonical fetcher: [`companies/NTO/scripts/youtube-broll-clip.py`](../../NTO/scripts/youtube-broll-clip.py) (2026-05-23: added `--width/--height/--fit` for CR vertical)
- Vendor dispatch: [`scripts/shorts/produce-short-generic.mjs`](../scripts/shorts/produce-short-generic.mjs) `renderYoutubeBroll()` + dispatcher priority block
- Playbook (NTO): [`companies/NTO/content-pipeline/YOUTUBE-BROLL-PLAYBOOK.md`](../../NTO/content-pipeline/YOUTUBE-BROLL-PLAYBOOK.md) — fair-use envelope, theology/news guardrails
- Cache: `companies/NTO/content/videos/_youtube-broll-cache/` — shared across CR + NTO, deduped by yt-dlp video id
