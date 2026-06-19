# SEALED — artifacts

> **Canonical manuscript pipeline.** The single source of truth for the SEALED
> book content is **`../scripts/build-retail-pdf.mjs`**, which embeds all prose
> inline (in JavaScript template literals) and produces
> **[`SEALED-v1-retail.pdf`](SEALED-v1-retail.pdf)**. Nothing else in this folder
> is the manuscript. Do not read other files to determine current manuscript
> state — they are historical and may contradict the live source.
>
> The retail PDF contains the full 145-promise corpus with real graded verdicts
> (36 KEPT / 42 PARTIAL / 48 BROKEN / 19 READER-DECIDES) — not "Reader-led
> illustrative" placeholders from earlier drafts.

## Live artifacts

| Artifact | Purpose | Regenerate |
|----------|---------|------------|
| [`SEALED-v1-retail.pdf`](SEALED-v1-retail.pdf) | **Canonical retail manuscript.** Uploaded to Supabase `sealed-masters` for fulfillment via the watermark webhook. | `npm run generate:retail-pdf` |
| [`SEALED-CHAPTER-OUTLINE-V1.md`](SEALED-CHAPTER-OUTLINE-V1.md) | Chapter-level structural outline (descriptive, not the manuscript). | hand-edited |
| [`../public/sample/sealed-sample-preview.pdf`](../public/sample/sealed-sample-preview.pdf) | Public 5-page sample at `/sample`. Hand-curated Ch.3 §A sample, kept substantively consistent with the canonical retail manuscript. | `npm run generate:sample-pdf` |
| [`../public/sample/sealed-one-pager-share.pdf`](../public/sample/sealed-one-pager-share.pdf) | Press one-pager (single page, cover embedded). | `npm run generate:one-pager-share` |

**Literary agent** owns manuscript fidelity inside the retail PDF.
**CTO** owns generation scripts and bytes in-repo.

## Archive

[`archive/`](archive/) holds **deprecated** artifacts from earlier pipelines —
including a stale Markdown manuscript draft (`sealed-v1-content.md`) and
predecessor PDFs. **Do not read those files for current manuscript state.** See
[`archive/README.md`](archive/README.md) for what each archived file is and why
it was retired.
