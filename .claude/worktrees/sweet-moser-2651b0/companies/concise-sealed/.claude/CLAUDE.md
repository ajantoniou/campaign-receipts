# SEALED — project notes for Claude

## Canonical manuscript pipeline (read this first)

**Single source of truth for SEALED book content:**

- **Source:** `scripts/build-retail-pdf.mjs` — Puppeteer-based PDF generator
  with all prose embedded inline as JavaScript template literals.
- **Output:** `artifacts/SEALED-v1-retail.pdf` — the canonical retail PDF
  uploaded to Supabase bucket `sealed-masters` and served via the
  watermark-webhook fulfillment service.
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

## Other live services

- `services/watermark-webhook/server.mjs` — Render service that watermarks the
  canonical PDF with `Licensed to: {name} · {email} · Order #{order}` + legal
  notice on every page, then emails via Resend.

## Verdict-math invariant

If you ever cite the verdict math, it must match the published retail PDF.
Currently: **145 promises · 46 KEPT / 51 PARTIAL / 40 BROKEN / 8 READER-DECIDES**.
If the manuscript changes, update this file in the same commit.
