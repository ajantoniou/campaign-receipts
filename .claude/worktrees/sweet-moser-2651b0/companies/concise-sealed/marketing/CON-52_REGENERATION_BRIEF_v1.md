# CON-52 — Product imagery regeneration (copy-first, multi-agent gate)

**Company:** Concise / SEALED Press (`concise-sealed`)  
**Issue:** CON-52 — storefront / LS listing images  
**Visual spec (legibility + historic civic layout):** [`companies/votingcitizen/brand/ILLUSTRATED_CIVIC_PAGE_SPEC_v1.md`](../../votingcitizen/brand/ILLUSTRATED_CIVIC_PAGE_SPEC_v1.md) (cross-brand standard: **real English**, citations, no gibberish micro-text)

---

## Hard rule

**No raster/canvas image generation until editorial copy is frozen** through the approval chain below.

---

## Phase A — Copy blocks (owner: Editorial / Literary Agent + Concise CEO support)

1. Fill **[`CON-52_COPY_BLOCKS_v1.md`](CON-52_COPY_BLOCKS_v1.md)** — each asset maps to one row: headline, body quotes (verbatim where legally required), “delivery” line, primary citation URL or note.
2. **Brand Design (Concise)** — reviews tone + hierarchy fit with SEALED brand (not founder-first).
3. **CEO (Concise)** — signs copy accuracy / positioning vs manuscript.
4. **Portfolio HQ roundtable** — Chief of Staff Hourly + McKinsey Advisor + YC Advisor per [`MULTI_AGENT_REVIEW_GATE`](../../portfolio-hq/process/MULTI_AGENT_REVIEW_GATE.md): approve / revise / reject with bullets.
5. **Second pass** — incorporate revisions; roundtable **conditional approve** on copy only.

**Output of Phase A:** `CON-52_COPY_BLOCKS_v1.md` tagged **`COPY_FROZEN_v1`** in a comment line + date.

---

## Phase B — Layout comps (owner: Brand Design + Book Illustrator)

Only after **`COPY_FROZEN_v1`**:

1. **Brand Design** — Figma / Open Design / HTML proof: typography scales, margins, footnote placement (text remains live vector or web fonts).
2. **Book Illustrator** — sketch plates / spot illustrations **around** the type block; illustrations do not replace body copy.
3. Internal **QA:** legibility check at thumbnail size (LS listing).

---

## Phase C — Export & paths

Replace assets under `companies/concise-sealed/public/product-images/`:

| File | Role |
|------|------|
| `cover-mockup-v1.jpg` | Hero cover treatment |
| `sample-page-spread-v1.jpg` | Said / delivered / drift spread |
| `table-of-contents-v1.jpg` | TOC clarity |
| `social-proof-v1.jpg` | Quote cards — **real quotes only** |

Use filenames `_v2` if retaining v1 for diff; update landing references if paths change.

---

## Evidence for Paperclip / backlog

Link this brief + frozen copy file + PR touching `public/product-images/` when CON-52 closes.
