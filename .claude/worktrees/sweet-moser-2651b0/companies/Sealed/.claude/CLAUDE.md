# SEALED — project notes for Claude

## Canonical manuscript pipeline (read this first)

**Single source of truth for SEALED book content:**

- **Source:** `scripts/build-retail-pdf.mjs` — Puppeteer-based PDF generator
  with all prose embedded inline as JavaScript template literals.
- **Output:** `artifacts/SEALED-v1-retail.pdf` — the canonical retail PDF.
  Was historically served via the watermark-webhook fulfillment service;
  that service is **RETIRED as of 2026-05-25** (the $15 PDF SKU was repurposed
  as the $5 "2024 Deleted Promises" companion, which is uploaded directly to
  LS as a file-delivery product — no watermarking needed). The retail PDF is
  still the canonical 145-promise manuscript and used for paperback printing
  (Lulu drop-ship, separate flow).
- **Regenerate:** `npm run generate:retail-pdf`

The retail PDF contains the **full 145-promise corpus with real graded
verdicts**: **46 KEPT / 51 PARTIAL / 40 BROKEN / 8 READER-DECIDES**. Per-chapter
TOC verdicts use a 5-state key (`KEPT / PARTIAL / BROKEN / BLOCKED / READER`).

## Do NOT read for manuscript state

These files are archived and **predate the verdict-fill / canonical pipeline**.
Reading them will produce false conclusions:

- `artifacts/archive/sealed-v1-content.md` — old Markdown manuscript draft with
  starter scorecard graded "Reader-led illustrative."
- `artifacts/archive/SEALED-v1-before-the-deals.pdf` — predecessor proof.
- `artifacts/archive/SEALED-ch1-proof.pdf` — Ch.1 proof milestone artifact.
- `scripts/archive/*` — superseded Python builds + Ch.1 proof slicer.

See `artifacts/archive/README.md` and `scripts/archive/README.md` for full
provenance.

## Other live scripts (in `scripts/`)

| Script | npm | Purpose |
|--------|-----|---------|
| `build-retail-pdf.mjs` | `generate:retail-pdf` | **Canonical** retail PDF. |
| `generate-sealed-sample-pdf.mjs` | `generate:sample-pdf` | Public 5-page sample (Ch.3 §A trade), hand-curated, kept substantively consistent with retail. |
| `generate-one-pager-share-pdf.mjs` | `generate:one-pager-share` | Press one-pager. |
| `generate-press-kit-pdf.mjs` | `press-kit-pdf` | Press kit. |
| `watermark-share-images.mjs` | `watermark:share-images` | Builds the 9 free-share PNGs in `public/free-shares/`. |
| `verify-ls-webhook-fixture.mjs` | `verify:ls-webhook` | Lemon Squeezy webhook integration test. |

## Retired services (do NOT redeploy without founder approval)

- `services/watermark-webhook/server.mjs` — **RETIRED 2026-05-25.** Was a
  Render service that watermarked the canonical PDF and emailed via Resend
  for SEALED 2016 $15 PDF buyers. SKU retired; service suspended in Render
  dashboard; LS webhook URL pointing to it removed. Code intact for future
  resurrection (see `services/watermark-webhook/README.md` for restore steps).
  Founder lock 2026-05-25: any agent that wants to revive this must ASK
  before re-deploying.

## Verdict-math invariant

If you ever cite the verdict math, it must match the published retail PDF.
Currently: **145 promises · 46 KEPT / 51 PARTIAL / 40 BROKEN / 8 READER-DECIDES**.
If the manuscript changes, update this file in the same commit.
