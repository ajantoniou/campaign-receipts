# Archived scripts — do not run

These scripts are **deprecated**. They predate the canonical retail manuscript
pipeline (`../build-retail-pdf.mjs`) and are kept for history only. None are
referenced from `package.json`.

| Script | What it did | Why retired |
|--------|-------------|-------------|
| `build_sealed_v1_pdf.py` | Original v0 retail PDF build (Python + ReportLab), May 5. | Superseded by `../build-retail-pdf.mjs` (Puppeteer/HTML, much richer typography). |
| `build-retail-pdf.py` | Intermediate Python retail build, May 10. | Same — `.mjs` version is the canonical retail pipeline. |
| `generate-ch1-proof-pdf.mjs` | Chapter 1 proof slicer. Read prose from `../../artifacts/sealed-v1-content.md` and emitted `SEALED-ch1-proof.pdf`. | Source Markdown is archived (stale draft). Canonical retail PDF covers Ch.1 directly. |
| `publish-editorial-sample.mjs` | Copied `SEALED-v1-before-the-deals.pdf` over `public/sample/sealed-sample-preview.pdf`. | Sample preview is now produced by `generate-sealed-sample-pdf.mjs` (hand-curated Ch.3 §A) and `SEALED-v1-before-the-deals.pdf` is archived. |

If you need the current sample PDF, run `npm run generate:sample-pdf` from the
project root. For the full retail manuscript, `npm run generate:retail-pdf`.
