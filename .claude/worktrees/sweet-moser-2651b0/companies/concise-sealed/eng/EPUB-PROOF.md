# ePub proof — target path & pipeline (tracker step 36)

**Personas:** CTO (pipeline) + Literary Agent (TOC/sections).

## Canonical artifact path (when built)

- **`companies/concise-sealed/artifacts/sealed-v1.epub`** — not committed until first successful export from manuscript [`artifacts/sealed-v1-content.md`](../artifacts/sealed-v1-content.md).

## Recommended pipeline (pick one)

1. **Pandoc:** `pandoc artifacts/sealed-v1-content.md -o artifacts/sealed-v1.epub --toc` (tune metadata YAML separately).
2. **Calibre:** `ebook-convert` after styled HTML intermediate.
3. **Professional vendor:** hand `.docx`/PDF proof — receive `.epub` back into `artifacts/`.

## Acceptance

First **`sealed-v1.epub`** that validates in **Apple Books** + **Kindle Previewer** without fatal errors → step **36** closed in tracker.
