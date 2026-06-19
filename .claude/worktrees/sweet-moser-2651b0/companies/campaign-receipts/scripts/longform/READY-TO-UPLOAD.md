# READY-TO-UPLOAD — Iran deal long-form (Stage 1, pre-Sarah)

**State as of overnight Stage 1:** long-form rendered and ffprobe+RMS verified.
**Sarah verdict:** NOT YET RUN (binding gate held — see STAGE-1-REPORT.md).
**Shorts (Stage 3):** NOT BUILT — gated on Sarah's long-form verdict.

## Long-form

- **File:** `companies/campaign-receipts/public/longform/sealed-aipac-iran-deal.mp4`
  (27 MB, 1920×1080 @ 30fps, 4:01, gitignored — regenerate via producer)
- **Thumbnail:** `companies/campaign-receipts/public/longform/sealed-aipac-iran-deal.jpg`
- **Title (proposed):** Who Paid To Kill The Iran Deal — $82 Million And Three Promises
- **Description (proposed):**

  > In 2015, seven countries signed the JCPOA — the deal that capped Iran's
  > uranium enrichment at 3.67%. In 2018, one American president walked out
  > alone. This is the receipt for who paid for it.
  >
  > Sources are pulled from the SEALED 2016 book, which grades all 145
  > Trump 2016 campaign promises against the public record. Same standard,
  > same receipts, on every promise.
  >
  > SEALED2016.COM — new receipts drop daily.
  >
  > 0:00 The deal
  > 0:30 Promise #73
  > 0:55 May 8, 2018 — withdrawal
  > 1:20 AIPAC's three priorities
  > 1:50 Three for three
  > 2:20 The buyer — Sheldon Adelson
  > 3:00 A fairness note
  > 3:25 What the withdrawal actually did
  > 3:55 Verdict

- **Tags (proposed):** iran deal, jcpoa, sheldon adelson, aipac,
  campaign receipts, sealed 2016, trump promises, foreign policy,
  political accountability, civic explainer
- **Upload command (manual, OAuth bootstrap still needed — see below):**
  ```bash
  cd companies/campaign-receipts
  node scripts/shorts/upload-to-youtube.mjs \
    --file public/longform/sealed-aipac-iran-deal.mp4 \
    --thumb public/longform/sealed-aipac-iran-deal.jpg \
    --title "Who Paid To Kill The Iran Deal — \$82 Million And Three Promises" \
    --description-file scripts/longform/_descriptions/sealed-aipac-iran-deal.txt \
    --visibility public \
    --tags-file scripts/longform/_descriptions/sealed-aipac-iran-deal-tags.txt
  ```
  (Description + tags files not yet written — block on Sarah verdict.)

## Shorts — NOT BUILT

Short A and Short B (per spec):

- Short A — buyer reveal (Adelson $82M, splice from scene 7 of long-form)
- Short B — enrichment slam (3.67% → 60% post-withdrawal, splice from scene 9)

These require:

1. Sarah's pass on the long-form (binding gate — STAGE-1-REPORT.md).
2. A new `scripts/shorts/splice-from-longform.mjs` (not built this stage).

## OAuth bootstrap reminder

YouTube upload requires the founder to run the OAuth-token-refresh flow
once. Existing flow in `scripts/shorts/upload-to-youtube.mjs` — token cache
location and refresh-token re-mint TBD per the founder's standing setup.
**This is the only step that cannot be automated** without a stored,
non-expired refresh token in the repo-root `.env`.

## Morning hand-off

When you wake up:

1. **Watch the long-form.** `open companies/campaign-receipts/public/longform/sealed-aipac-iran-deal.mp4`
2. **If Cincinnati Sarah passes** — kick off Stage 2 (persona pass against
   the rendered cut, not the script) + Stage 3 (build the splicer + 2
   shorts).
3. **If Sarah fails** — note the timestamps where she'd swipe away. The
   producer is fully deterministic on re-run; surgical edits live in the
   SVG generator functions (one per scene) at the top of
   `scripts/longform/produce-explainer.mjs`. Re-render with
   `--skip-tts` is free.
