# Rebuild BLOCKED — flagged for founder review
**v3 URL:** https://youtu.be/dWTVFcuyAo0 (LEFT UP — not deleted)
**Date:** 2026-05-21
**Decision:** QC failed (see `qc-report.md`), but rebuild as v4 is out-of-scope under this task's $5 budget cap.

## Why rebuild is blocked

The brief authorizes a rebuild that requires:
1. A 4th Sarah Kling-i2v clip (mid-1) — ~$0.50
2. Re-rendering s6-01 (and possibly other text cards) — free (Puppeteer HTML)
3. Full-frame presenter compositing at all four Sarah beats — non-trivial ffmpeg work
4. Re-assembly of all 28 source clips
5. Re-upload as v4 and delete v3

**Blocker:** The 28 source clips (s1-01 … s10-03) referenced by `companies/campaign-receipts/_build/sealed-aipac-iran-deal-v2/state.json` are **no longer on disk**. The `clips/` subdirectory does not exist. `state.json` itself reports `"assembled": false, "published": null` — it was never updated after the v3 publish, and the working tree was evidently cleaned between v3 upload and now.

Regenerating the missing clips would cost approximately:
- 5 Sora 2 clips (47s @ $0.10/s) = $4.70
- 6 kling-i2v clips (30s @ $0.07/s) = $2.10
- 1 kling3-pro clip (10s @ $0.17/s) = $1.70
- 17 stills @ $0.04 = $0.68
- 1 new Sarah mid-1 kling-i2v = $0.50

= **~$9.68 just to regenerate the source material**, before any composition or upload work. That is roughly double this task's $5 budget cap and overlaps the original episode's $12.54 budget. The CEO budget gate (Hard Rule #1, $500/company cap) is not blown, but the per-task cap declared in this brief is.

## Recommendation to founder

Two paths:

**Path A — Surgical patch (cheap, partial fix):**
Just re-render and swap the single broken text card (s6-01) via the existing Puppeteer renderer, then re-mux it into the v3 master and re-upload as v4. No new clip generation. Cost: $0 (Puppeteer + ffmpeg only) plus $0.10 re-Scribe.
- Pros: Fixes the factual error (which is the more serious of the two failures).
- Cons: Sarah remains corner-box. Hard Rule #4 violation persists until next episode.
- Caveat: The v3 master mp4 itself is not on disk locally either; would need to download the YouTube re-encode (lossy) or accept a quality round-trip.

**Path B — Full v4 rebuild ($10–13 spend, founder pre-approval needed):**
Regenerate all clips, add 4th Sarah beat, recompose with full-frame presenter, re-upload, delete v3. This is the runbook-compliant outcome.

**Path C — Leave v3 up, fix in next episode:**
Document both failures in the runbook backlog. The factual error on s6-01 is real but the spoken VO (which YouTube viewers will hear) correctly enumerates all three AIPAC priorities — a viewer who watches the whole video gets the right story. The corner-box Sarah is a stylistic violation, not a factual one. Founder accepts the risk in exchange for $0 additional spend and 24h saved.

This QC role has no decision authority on rebuild scope — escalating per `.claude/CLAUDE.md` Decision Authority section ("Any agent can flag: unsafe action, ethical concern, legal risk — must escalate to CEO + founder before proceeding").

## Spend log for this QC task
- $0.10 — ElevenLabs Scribe (one 263s file)
- $0.00 — yt-dlp, ffmpeg, tesseract, Puppeteer (all local/free)
- **Total: $0.10**
