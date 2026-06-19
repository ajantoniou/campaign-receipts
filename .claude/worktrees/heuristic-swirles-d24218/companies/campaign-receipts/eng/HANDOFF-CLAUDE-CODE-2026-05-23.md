# Handoff — Claude Code (Campaign Receipts + SEALED + NTO)

**Written:** 2026-05-23 ~15:10 ET · **Updated:** 2026-05-23 evening (CR URANIUM fix + Remotion isolation)  
**Channel:** [@CampaignReceiptsYoutube](https://www.youtube.com/@CampaignReceiptsYoutube) (`UC4NINNbjaoy2PTKxbY5an-g`)  
**Cold start:** `README.md` → Regain context · `shared/portfolio-hub/README.md` · this file.

---

## Executive summary

| Track | Status |
|-------|--------|
| **SEALED rebuild (masters + QC)** | **Done locally** — 3 LFs + 5 shorts fixed; `/watch` + production-qc passed |
| **YouTube publish** | **Blocked** — daily *Video Uploads* quota (~6/day); resume script scheduled |
| **Channel Shorts shelf (founder screenshot)** | **Weak SEALED packaging** — generic `145 PROMISES` cards vs strong CR Massie/Bush thumbs |
| **NTO QC Engineer (pre-video VO)** | **Done** — `vo-audio-qc.py` wired; see `companies/NTO/personas/qc-engineer.md` |

**Founder priority for next agent:** (1) finish quota-blocked uploads, (2) **10/10 MrBeast + JK Rowling** on every SEALED short **title + description + thumbnail** before upload, (3) **more licensed YouTube b-roll clips** in shorts (founder: “big hit”), (4) storytelling that hooks like JK Rowling, not lecture.

---

## What’s done (do not redo)

### Production / QC fixes (2026-05-22 → 05-23)

- **Embassy LF** — wrong date card (MAY 8 → DEC 6); zoompan shake → static hold; MrBeast title locked: `60 KILLED THE SAME DAY — JERUSALEM EMBASSY RECEIPT`
- **Drain LF** — JCPOA p.1519 card removed from verdict beat; lobbying chart re-timed; local master `public/longform/sealed-drain-the-swamp-v1.mp4`
- **Iran LF v7** — Remotion duration fix; AY-pack VO; local master `public/longform/sealed-aipac-iran-deal-v7.mp4`
- **Shorts pipeline** — `produce-short-generic.mjs`: `findAnchor` per-phrase fix, CTA clamp 2.8–5s, `motionFromPng` fix; validate + ship-checklist gates
- **5 broken shorts rebuilt** — `public/shorts/sealed-002` … `005`, `007` — ship-checklist PASS, manual `/watch` verified
- **Text-card sync** — `text-card-sync-qc.py` widened; production-qc gate **7b**
- **Viral panel** — `personas/viral-panel/07-youtube-monetization.md` added; embassy has `mrbeast-packaging.md` + monetization report

### YouTube ops (2026-05-23)

- **Deleted** broken public shorts: `eqtTTfrbjO0`, `8jmmjtwKbWs`, `8U6x1hm_0Ec`, `hXVdS2La1mE`, `7-LbTbzu8yQ`
- **Created playlist** **Sealed2016** → `PL9xPOHXdYWw81KrNrNr7QBCIy6lBIYXM3tm` (in root `.env` as `CR_YOUTUBE_PLAYLIST_SEALED2016`)
- **Backfilled** 9 live SEALED/LF IDs into playlist (deleted IDs correctly 404’d)
- **pre-upload-pack** done for all pending LFs + shorts (`_build/…`, `scripts/shorts/_build/00X/`)

### NTO (separate company folder)

- **QC Engineer gate** — `companies/NTO/scripts/vo-audio-qc.py` + `personas/qc-engineer.md`; blocks `render-batch.py` / `splice-v8.py` until Scribe vs script PASS (rules 26+27)

---

## What’s pending (priority order)

### P0 — YouTube upload (quota)

**Blocker:** `HTTP 429` — `Quota exceeded for quota metric 'Video Uploads per day'` (not generic API units). ~6 uploads used 2026-05-23 ~03:04 ET (Massie/Bush CR push).

**Auto-resume (check first):**

```bash
tail -50 /tmp/sealed-youtube-resume.log
pgrep -fl sealed-youtube-resume    # may still be sleeping until ~03:05 ET
```

**Canonical runner:** `companies/campaign-receipts/scripts/pipeline/sealed-youtube-resume.sh`  
- Uploads 3 LFs with `--replace-id`, then 5 shorts, then `sealed-publish-sync.py`  
- Uses `--skip-production-qc --skip-ship-checklist` (QC already passed)  
- **Budget ~6 uploads/day** — may need **2 nights** (3 LFs night 1, 5 shorts night 2)

**Still live with OLD masters until replace succeeds:**

| Piece | YouTube ID | Replace with local |
|-------|------------|-------------------|
| Embassy LF | `SSuO2KOXr0Y` | `public/longform/sealed-aipac-embassy-v1.mp4` |
| Drain LF | `mnt2Svi9ntI` | `public/longform/sealed-drain-the-swamp-v1.mp4` |
| Iran LF | `w9YX_8mnOf8` | `public/longform/sealed-aipac-iran-deal-v7.mp4` |

**Off channel until upload (deleted, masters ready):**

| Short | Local master | Build dir |
|-------|--------------|-----------|
| 002 Embassy | `public/shorts/sealed-002-aipac-embassy.mp4` | `scripts/shorts/_build/002/` |
| 003 Campus | `public/shorts/sealed-003-aipac-campus.mp4` | `scripts/shorts/_build/003/` |
| 004 Drain | `public/shorts/sealed-004-drain-the-swamp.mp4` | `scripts/shorts/_build/004/` |
| 005 China | `public/shorts/sealed-005-china-tariffs.mp4` | `scripts/shorts/_build/005/` |
| 007 Skinny repeal | `public/shorts/sealed-007-repeal-obamacare.mp4` | `scripts/shorts/_build/007/` |

**Keep as-is:** Short 001 `nu9IlCeGSYc` · Short 006 wall `VFBvhuGTKjA` (v2 body rebuild deferred)

**After each upload night:** update `eng/PUBLISHED-YOUTUBE.md` Live table from `scripts/.external-costs.jsonl`.

**Also pending (CR new-news, same quota):**

Run **in order** after midnight Pacific (probe still returns `HTTP 429` as of evening):

```bash
cd companies/campaign-receipts
python3 scripts/pipeline/upload-queue-runner.py --replace-fixed-lf   # 2 LF replaces
python3 scripts/pipeline/upload-queue-runner.py --pending-only       # 3 Bush shorts (incl. verdict replace)
```

| Piece | YouTube ID | Action | Local master |
|-------|------------|--------|--------------|
| Bush LF | `QpvoAqBqGuQ` | `--replace-id` | `public/longform/cr-bell-bush-aipac-primary.mp4` (fixed 03:35 ET) |
| Massie LF | `lXqpaaHZsJE` | `--replace-id` | `public/longform/cr-massie-gallrein-primary.mp4` |
| Bush short hook | *(none)* | first upload | `public/shorts/cr-bush-short-01-hook.mp4` |
| Bush short money-flow | *(none)* | first upload | `public/shorts/cr-bush-short-02-money-flow.mp4` |
| Bush short verdict | `wKHoHfv4DaY` | replace (pre-fix cut) | re-cut from fixed LF |

**CR new-news already live (6/8 uploaded ~03:04 ET):** Massie LF + 3 Massie shorts + Bush LF v2 + Bush verdict short. MrBeast packaging written for all 8 (`eng/qc-reports/cr-*/mrbeast-packaging.md`).

**Post-upload verify:** `/watch` Bush LF ~200s — header must read **MO-1 PRIMARY · CERTIFIED RESULT**, not `URANIUM ENRICHMENT %`. Log: `scripts/.upload-queue.log`.

---

### CR incident — URANIUM chart (fixed locally, NOT on YouTube yet)

**Root cause:** `render-text-cards.mjs` `bar2` template inherited Iran eyebrow + inverted bar heights. Worse: **`public/longform/` was stale** — upload used May 22 file while fixed `_build/master.mp4` was May 23.

**Fixes shipped in repo:**

- `bar2` → data-driven eyebrow + proportional heights; CR uses new type guard in `text-card-sync-qc.py` (forbids `URANIUM`/`ENRICHMENT` on `cr-*` slugs)
- `upload-queue-runner.py` → `sync_public_master()` copies newer `_build` → `public/` before every LF upload
- Remotion **per-episode isolation:** `remotion/src/episodes/<slug>/` — **`render-remotion.mjs --slug` required**; never reuse compositions across episodes
- Re-muxed both LFs, re-cut all 6 shorts, `/watch` PASS — see `eng/qc-reports/_qc-rebuild-2026-05-23.md`

**Look out for:** Never upload from `public/` without confirming mtime ≥ `_build/<slug>/master.mp4`. Never reuse `bar2` or Remotion comps across slugs without reading the template.

---

### Storytelling pipeline (next script pass — not blocking upload)

Docs + gate updated for full-runtime retention + mandatory **“In other words, …”** jargon bridges:

- `personas/storyline-editor.md`, `brand/storytelling-pipeline.md`, `script-storyteller-gate.py`
- Current Massie VO **fails** new gate — expected; apply on next script revision

---

### P1 — SEALED Shorts: MrBeast 10/10 packaging (FOUNDER LOCK)

**Problem (founder screenshot 2026-05-23):** Shorts shelf mixes **strong CR new-news** thumbs (navy, giant `$35M`, RECEIPT stamp, Massie face) with **weak SEALED** thumbs (beige `145 PROMISES / SEALED2016.COM` end-card, tiny doc screenshots, low contrast). Titles/descriptions not unified with cold-open VO.

**Required for every SEALED short before upload:**

| Asset | Gate | Persona / tool |
|-------|------|----------------|
| **Title** | MrBeast curiosity gap + number + verdict word | `personas/viral-panel/06-mrbeast-packaging.md` · root `MRBEAST-HOW-TO-GO-VIRAL.md` |
| **Thumbnail** | One idea, one giant number, mobile legible @ 246×138 | `scripts/pipeline/generate-thumbnail.mjs` — consider **`--template sealed`** refresh to match CR new-news energy (navy + stamp), not parchment CTA card |
| **Description** | First line = verbatim cold-open VO; chapters | `pre-upload-pack` → `_build/.../description.md` |
| **Story / cold open** | JK Rowling hooks — picture, stakes, “what happens next” | `companies/NTO/personas/jk-rowling-storyteller.md` (shared with CR) · `brand/storytelling-pipeline.md` steps 2.7–2.9 |

**Write artifacts per slug (embassy is the template):**

```
eng/qc-reports/<slug>/mrbeast-packaging.md      # 3 title options + picked + thumb spec
eng/qc-reports/<slug>/youtube-monetization.md    # yellow/red expectations
eng/youtube-meta/<slug>.json                     # binding title + tags
```

**Current gap:** Only `sealed-aipac-embassy-v1` has full MrBeast report. Shorts `002`–`007` upload-metadata still say **“MrBeast packaging: ⚠️ missing”**.

**Acceptance (“10/10”):** Founder-style checklist — title + thumb + first VO line are **one unit**; council or viral panel doc explicitly says **SHIP** for packaging; no beige-only CTA frame as the YouTube thumb.

---

### P2 — JK Rowling storytelling (audience capture)

**Not just packaging — script beats inside each short:**

- Cold open = **story question**, not receipt label (`BROKEN:` alone is weak on feed)
- One **picture per beat** (screenwriter + JK passes) — see `eng/PRODUCTION-PIPELINE-STEPS.md` steps 2.7–2.8
- Run before re-render if VO is flat:

```bash
python3 shared/scripts/step_qc.py --lint-script \
  --curr companies/campaign-receipts/content/scripts/<short-script>.md \
  --slug sealed-002-aipac-embassy
```

**Score target:** Copy **100/100** per `personas/storyteller-score-rubric.md` (dims 1–8 automated; 9–10 after `/watch`).

---

### P3 — More YouTube b-roll clips (founder: “big hit”)

**NTO already has the playbook** — port pattern to CR SEALED shorts/LFs:

| Resource | Path |
|----------|------|
| Playbook | `companies/NTO/content-pipeline/YOUTUBE-BROLL-PLAYBOOK.md` |
| Clip fetcher | `companies/NTO/scripts/youtube-broll-clip.py` → 1920×1080 mp4 + `.attribution.json` |

**Pending work:**

1. **Audit** which SEALED beats still use AI-only b-roll vs real news footage (Gaza, embassy move, Capitol, etc.)
2. **Add `vendor: youtube-broll`** (or equivalent) to short storyboards / `produce-short-generic.mjs` vendor list where fair-use applies — theology/news guardrails in playbook
3. **Do not** duplicate into `*-v2.py` — extend `produce-short-generic.mjs` + storyboard JSON with comment *what/why*
4. Rebuild affected shorts **after** b-roll swap + packaging pass

**Founder note:** Fair-use news clips performed well; prioritize over generic fal stills for hook + payoff beats.

---

### P4 — Live Shorts already on channel (swap metadata/thumb without full re-upload if possible)

These still show **weak packaging** on the shelf (may be old uploads or 001/006):

| Live ID | Title (truncated) | Issue |
|---------|-------------------|--------|
| `nu9IlCeGSYc` | $82M bought 3 Trump promises | Doc-style thumb; consider **YouTube Studio** thumb swap + title A/B after MrBeast pass |
| `VFBvhuGTKjA` | Mexico $0 wall | `145 PROMISES` card thumb — replace thumb; body v2 later |
| `8U6x1hm_0Ec` | Drain EO (if still indexed) | May be stale cache — verify deleted; shelf can lag |

After P0 uploads, **re-audit Shorts tab** — goal: every tile looks like Massie/Bush tier (navy, number, face/stamp).

---

### P5 — Long-forms (after upload)

| LF | MrBeast title (locked?) | Thumb | Notes |
|----|-------------------------|-------|--------|
| Embassy | **Yes** — `60 KILLED THE SAME DAY…` | `_build/sealed-aipac-embassy-v1/thumbnail.jpg` | Accept limited-ads tax per monetization report |
| Drain | Default meta | Generated | Add `mrbeast-packaging.md` |
| Iran v7 | `$82M Donor. 3 Promises…` | Generated | Add `mrbeast-packaging.md` |

---

### P6 — Hold / later

- **Short 006** Mexico wall — keep `$0` hook; rebuild body (separate session)
- **Remotion embassy charts** — optional parity re-render (not blocking upload)
- **Typesense / Plausible** — milestone-gated skills, not tonight

---

## Channel snapshot (founder screenshot ≈ 15:06 ET)

**Looking good (CR new-news):** Massie/Bush shorts — navy thumbs, big numbers, RECEIPT stamps, hundreds of views.

**Looking weak (SEALED):** Beige `145 PROMISES` placeholders, small document thumbs, low view counts — **packaging failure**, not necessarily master failure.

**Missing from shelf:** 002, 003, 004, 005, 007 — **deleted**, waiting P0 upload.

---

## Key commands (copy-paste)

```bash
cd "/Applications/DrAntoniou Projects/AgentCompanies/companies/campaign-receipts"

# Quota probe (upload blocked = exit 1)
python3 -c "import importlib.util; ..."   # or retry one upload with skip flags

# Manual resume (if background script died)
bash scripts/pipeline/sealed-youtube-resume.sh

# Single LF upload example
python3 scripts/pipeline/youtube-upload.py \
  --video public/longform/sealed-aipac-embassy-v1.mp4 \
  --title "60 KILLED THE SAME DAY — JERUSALEM EMBASSY RECEIPT" \
  --description-file _build/sealed-aipac-embassy-v1/description.md \
  --thumbnail _build/sealed-aipac-embassy-v1/thumbnail.jpg \
  --tags "politics,jerusalem,embassy,trump,gaza,fact check,sealed 2016" \
  --privacy public --piece sealed-aipac-embassy-v1 \
  --replace-id SSuO2KOXr0Y --skip-production-qc --skip-ship-checklist

# Playlist backfill after new IDs
python3 scripts/pipeline/sealed-publish-sync.py

# MrBeast packaging pass (per slug)
# Read personas/viral-panel/06-mrbeast-packaging.md → write eng/qc-reports/<slug>/mrbeast-packaging.md

# Thumbnail regen
node scripts/pipeline/generate-thumbnail.mjs --template sealed \
  --headline "..." --subline "..." --verdict KEPT --out _build/<slug>/thumbnail.jpg

# Short rebuild (after script/packaging/b-roll fixes)
node scripts/shorts/produce-short-generic.mjs --episode eng/episodes/sealed-002-aipac-embassy.json
```

---

## Files to read first

| File | Why |
|------|-----|
| `eng/PUBLISHED-YOUTUBE.md` | Live IDs + push status |
| `eng/HANDOFF-CLAUDE-CODE-2026-05-23.md` | This doc |
| `eng/PRODUCTION-PIPELINE-STEPS.md` | Steps 2.7–2.9 storytelling |
| `personas/viral-panel/06-mrbeast-packaging.md` | CR packaging law |
| `MRBEAST-HOW-TO-GO-VIRAL.md` (repo root) | CTR/AVD/AVP |
| `companies/NTO/personas/jk-rowling-storyteller.md` | Story intrigue |
| `companies/NTO/content-pipeline/YOUTUBE-BROLL-PLAYBOOK.md` | News clip sourcing |
| `eng/PUBLISHED-YOUTUBE.md` § Shorts regression | 2026-05-23 bug class |

---

## Spend tracker (`scripts/.external-costs.jsonl`)

**Portfolio log totals (all time):** ElevenLabs ~$35 · fal.ai (Sora/Kling/Flux) ~$12 · Anthropic council ~$3 · YouTube API $0.

**Per-piece (logged production):**

| Slug | ~USD | Main vendors |
|------|------|--------------|
| `cr-bell-bush-aipac-primary` | ~$6 | ElevenLabs VO + Scribe QC |
| `cr-massie-gallrein-primary` | ~$1 | ElevenLabs VO (single chunk) |
| `sealed-aipac-iran-deal-v7` | ~$6.50 | ElevenLabs VO |
| `sealed-aipac-embassy-v1` | ~$3 | ElevenLabs VO |
| `sealed-drain-the-swamp-v1` | ~$2 | ElevenLabs VO |

**Marginal cost on pending work:** $0 — masters/thumbs/QC done; only YouTube upload quota. **Do not re-render or re-TTS** unless `/watch` fails post-replace.

**Budget guardrails:** ~6 YouTube **video uploads/day** per GCP project (`HTTP 429`). API units ~10k/day (`HTTP 403`). Batch across nights; `sealed-youtube-resume.sh` sleeps until 03:05 ET then probes.

---

## Credentials / safety

- Secrets: **repo root `.env` only** — never commit; never print values
- YouTube playlist: `CR_YOUTUBE_PLAYLIST_SEALED2016=PL9xPOHXdYWw81KrNrNr7QBCIy6lBIYXM3tm`
- **No script bloat** — extend canonical scripts; comment *what/why*
- **No founder “do X in Studio” docs** unless truly blocked — use `youtube-upload.py` + API

---

## Definition of done (this project phase)

- [ ] All 3 SEALED LFs replaced on YouTube with fixed masters + MrBeast titles/thumbs where locked
- [ ] 5 rebuilt SEALED shorts live with **10/10** title + description + thumbnail (MrBeast + JK storytelling)
- [ ] Shorts shelf visually matches CR new-news quality (no `145 PROMISES` as primary thumb)
- [ ] YouTube b-roll integrated on hook/payoff beats per playbook
- [ ] `eng/PUBLISHED-YOUTUBE.md` updated; `sealed-publish-sync.py` run
- [ ] Bush/Massie LF chart fixes uploaded when quota allows

**NTO track (parallel):** QC Engineer gate is done; Ep2 video production continues under `companies/NTO/content-pipeline/SCRIPT-PRODUCTION-PIPELINE.md`.
