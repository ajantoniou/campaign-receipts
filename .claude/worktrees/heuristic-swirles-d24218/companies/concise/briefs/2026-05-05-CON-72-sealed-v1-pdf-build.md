# CON-72: SEALED v1 PDF Build (Artifact + Repeatable Generator)
**Owner:** CTO
**Date:** 2026-05-05
**Status:** TODO

## Objective

Create a repeatable build that outputs:

- `SEALED-v1-before-the-deals.pdf` (the file uploaded to Lemon Squeezy)

## Constraints

- Must be buildable on the founder machine (Cursor environment)
- Minimal dependencies; prefer Python-only build

## Implementation plan (recommended)

- Use Python + `reportlab` to generate a clean, professional PDF:
  - cover page image
  - table of contents image
  - sample spread image
  - social proof image
  - timeline image
  - text pages with consistent typography

## Files

- Source text: `companies/concise-sealed/artifacts/sealed-v1-content.md`
- Build script: `companies/concise-sealed/scripts/build_sealed_v1_pdf.py`
- Output: `companies/concise-sealed/artifacts/SEALED-v1-before-the-deals.pdf`

## Acceptance criteria

- PDF renders correctly (no missing images, readable typography)
- Output path stable; file size reasonable; opens on Mac Preview and iOS
- No secrets embedded

