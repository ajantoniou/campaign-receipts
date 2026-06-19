# SEALED + CR Upload Playbook — 2026-05-23

**Status:** All masters + packaging + thumbs + b-roll built and staged. Nothing auto-fires. Founder picks the night.

---

## Strategy lock (founder, 2026-05-23 evening)

> Push the long-forms first. Let them accumulate views + subscribers for 3–14 days. Then drop all 5 shorts as a batch cohort with descriptions cross-linking back to their parent LFs.

**Why split:**
- Mixing LF + shorts in one burst makes the LF compete with its own shorts for first-48h impressions (worst case for LF average view duration)
- LF needs a clean "anchor piece" signal before shorts amplify
- 5 shorts dropped together get treated as a series → shorts shelf often pins them together

---

## Pre-staged scripts (ready to fire)

All scripts skip production-qc and ship-checklist gates (QC already passed). All use `--replace-id` where there's an old YouTube ID to swap.

### Phase 1 — SEALED Long-forms (3 uploads, fits one night's quota)

```bash
cd "/Applications/DrAntoniou Projects/AgentCompanies/companies/campaign-receipts"
bash scripts/pipeline/sealed-upload-phased.sh --phase 1
```

What it does:
- Waits until 03:05 ET (skip with `--no-wait` if your quota is fresh)
- Uploads embassy LF → replaces `SSuO2KOXr0Y`
- Uploads drain LF → replaces `mnt2Svi9ntI`
- Uploads iran v7 LF → replaces `w9YX_8mnOf8`
- Backfills Sealed2016 playlist
- Auto-updates `eng/PUBLISHED-YOUTUBE.md` Live table from the cost log

Logs: `/tmp/sealed-upload-phased.log`

### Phase 2 — SEALED Shorts batch (5 uploads, fits one night's quota)

**Run after letting Phase 1 LFs accumulate ~3-14 days of view data.**

```bash
cd "/Applications/DrAntoniou Projects/AgentCompanies/companies/campaign-receipts"
bash scripts/pipeline/sealed-upload-phased.sh --phase 2
```

What it does:
- Same quota wait logic
- Uploads 5 SEALED shorts (002, 003, 004, 005, 007) — all rebuilt 2026-05-23 with real fair-use b-roll baked in
- Backfills playlist + updates Live table

### CR new-news Bush+Massie LF chart-fix replace (separate)

```bash
bash scripts/pipeline/cr-bush-massie-replace.sh
```

What it does: re-uploads Bush (`QpvoAqBqGuQ`) + Massie (`lXqpaaHZsJE`) LFs with the fixed election-chart masters.

---

## Quota math

Default GCP project cap: **~6 Video Uploads/day**.

| Action | Uploads consumed |
|--------|------------------|
| Phase 1 (LFs)              | 3 |
| Phase 2 (shorts batch)     | 5 |
| Bush+Massie LF replace     | 2 |
| **Total**                  | **10** uploads → needs 2 separate quota nights minimum |

**If you set up the 2nd GCP project** (see `eng/QUOTA-WORKAROUND-SECOND-GCP-PROJECT.md`), capacity doubles to ~12/day → all 10 fit in one night.

---

## What's pre-built and verified

### 3 SEALED Long-form masters

| Slug | Master | Thumb | Title locked |
|------|--------|-------|--------------|
| sealed-aipac-embassy-v1 | `public/longform/sealed-aipac-embassy-v1.mp4` | `_build/sealed-aipac-embassy-v1/thumbnail.jpg` (60 / KEPT) | `60 KILLED THE SAME DAY — JERUSALEM EMBASSY RECEIPT` |
| sealed-drain-the-swamp-v1 | `public/longform/sealed-drain-the-swamp-v1.mp4` | `_build/sealed-drain-the-swamp-v1/thumbnail.jpg` ($3.53B / BROKEN) | `LOBBYING ROSE $400M WHILE TRUMP DRAINED THE SWAMP` |
| sealed-aipac-iran-deal-v7 | `public/longform/sealed-aipac-iran-deal-v7.mp4` | `_build/sealed-aipac-iran-deal-v7/thumbnail.jpg` ($82M / BROKEN) | `$82M Donor. 3 Promises Kept. Who Paid for the Iran Exit?` |

All 3 have `mrbeast-packaging.md` + `youtube-monetization.md` in `eng/qc-reports/<slug>/`.

### 5 SEALED Shorts masters (with real fair-use b-roll, parchment 9:16 thumbs)

| Slug | Hook b-roll source | License | Master |
|------|--------------------|---------|--------|
| sealed-002-aipac-embassy | Toronto Star — Ivanka plaque unveil | fair-use | `public/shorts/sealed-002-aipac-embassy.mp4` |
| sealed-003-aipac-campus  | AP Archive — Trump signs EO 13899 Hanukkah | fair-use | `public/shorts/sealed-003-aipac-campus.mp4` |
| sealed-004-drain-the-swamp | CBS News — Trump Johnstown PA 2016 rally | fair-use | `public/shorts/sealed-004-drain-the-swamp.mp4` |
| sealed-005-china-tariffs | CBS News — same 2016 rally (different slice) | fair-use | `public/shorts/sealed-005-china-tariffs.mp4` |
| sealed-007-repeal-obamacare | C-SPAN — McCain Senate floor thumb-down | **public-domain** | `public/shorts/sealed-007-repeal-obamacare.mp4` |

All 5 have `mrbeast-packaging.md` in `eng/qc-reports/<slug>/`, locked titles in `eng/youtube-meta/<slug>.json`, and new parchment 9:16 thumbnails (number-first headlines).

### Already live + thumb-swapped (no re-upload needed)

| Video | New thumb |
|-------|-----------|
| `nu9IlCeGSYc` (short — Iran $82M) | parchment 9:16, `$82M / BROKEN` |
| `VFBvhuGTKjA` (short — Mexico wall) | parchment 9:16, `$0 / BROKEN` |

Swap script: `scripts/pipeline/swap-live-thumb.py --batch eng/youtube-meta/live-thumb-swaps.json`

---

## Important: PID 9345 killed

The legacy `sealed-youtube-resume.sh` (sleeping until 03:05 ET to fire an interleaved 3-LF-then-5-shorts cascade) was **killed at 20:30 ET** to honor the founder's new phased strategy. Nothing will auto-upload tonight without you running `sealed-upload-phased.sh --phase 1` explicitly.

---

## Outstanding risks / known caveats

- `youtubeBroll` for SEALED shorts uses fair-use commentary clips (≤6s each, audio stripped). YPP risk assessed per-short in the `mrbeast-packaging.md` files. Most are green-expected; 002 yellow-expected (Israel/Gaza topic).
- Description-pack does not yet append fair-use attribution to YouTube descriptions automatically. Each `_build/<short>/_yt-broll-<seg>.attribution.json` sidecar has the credit line; either copy it into the description manually before upload, or port NTO's `write-description.py` to CR in a follow-up session.
- The `_needs_scrub` flag on some `youtubeBroll` blocks (002, 003) means agent-estimated timestamps may need ±2-3s adjustment for the gesture peak. Spot-check the rebuilt masters before upload; refine `start`/`end` if visual sync is off.

---

## What "do all the work upfront" looks like by morning

Once the v3 rebuild finishes (~22:00 ET tonight) and frames verify clean:

- 5 short masters with correct b-roll content
- All packaging artifacts written
- All thumbnails generated (parchment 9:16, number-first)
- All `youtube-meta/*.json` files locked with titles + descriptions
- Both phased upload scripts ready to invoke
- Live table auto-update wired
- Quota workaround documented
- This playbook in `eng/` as the operations handbook

**You decide when to fire phase 1 + phase 2. No surprises overnight.**
