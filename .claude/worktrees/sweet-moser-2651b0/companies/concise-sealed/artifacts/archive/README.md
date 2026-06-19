# Archived artifacts — do not read for current state

These files are **deprecated**. They predate the canonical retail manuscript
pipeline (`../../scripts/build-retail-pdf.mjs` → `../SEALED-v1-retail.pdf`)
and are kept only for git-history-style reference.

If you are a Claude agent / new contributor / cold reader trying to understand
what SEALED says today, **read `../SEALED-v1-retail.pdf` instead**, and read
`../../scripts/build-retail-pdf.mjs` for the source.

| File | What it was | Why retired |
|------|-------------|-------------|
| `sealed-v1-content.md` | Markdown manuscript draft (May 10). Had a starter scorecard with entries 1–5 graded "Reader-led illustrative" and a grade key including `BLOCKED` and `MOOT`. | Superseded by inline prose in `build-retail-pdf.mjs`. The retail PDF carries the full 145-promise corpus with real graded verdicts (36 KEPT / 42 PARTIAL / 48 BROKEN / 19 READER-DECIDES). Reading this file will produce false conclusions about the current manuscript. |
| `SEALED-v1-before-the-deals.pdf` | Editorial sample (`COPY_FROZEN_v1`), May 9. Used to be served at `/sample`. | Replaced by `public/sample/sealed-sample-preview.pdf` (current hand-curated Ch.3 §A sample) and by the canonical retail PDF for full-manuscript use. |
| `SEALED-ch1-proof.pdf` | Chapter 1 proof slice (M5 milestone), May 9. Built by the now-archived `generate-ch1-proof-pdf.mjs` from `sealed-v1-content.md`. | M5 milestone retired; canonical retail PDF is the source of truth for Ch.1 content. |
| `SEALED-v1-retail.html` | Intermediate HTML render of the retail PDF (May 11). | Built artifact of `build-retail-pdf.mjs`; not a primary source. Regenerated on every retail PDF build. |

Don't delete these — they're useful for tracing how the book evolved. Just don't
treat them as the manuscript.
