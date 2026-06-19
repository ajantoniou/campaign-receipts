# OSS design + video toolchain — portfolio appendix

**Maintainer:** Portfolio HQ (Chief of Staff). **Last reviewed:** 2026-05-06.  
**Purpose:** Default **open-source** design/video/doc scaffolding — auditable, replaceable; production hardening stays in `companies/*`.

| Tool | License | Role in portfolio |
|------|---------|-------------------|
| [Open Design](https://github.com/nexu-io/open-design) | Apache-2.0 | Local UI/UX exploration + exports → **handoff** into real apps. Cursor: `.cursor/skills/open-design/SKILL.md`; rule: `.cursor/rules/design-toolkit.mdc`. |
| [HyperFrames](https://github.com/heygen-com/hyperframes) | Apache-2.0 | **HTML → deterministic MP4** (shorts/promos). Eval: `companies/nt-ministry/research/hyperframes-eval-v1.md`. Needs Node ≥22, FFmpeg, headless Chrome. |
| **FFmpeg** | LGPL/GPL (build-dependent) | Glue: transcode, concat, captions; default with TTS + stills/slides. |
| **Pandoc** | GPL-2.0+ | Markdown → EPUB/PDF/HTML (publishing). See `companies/concise-sealed/eng/EPUB-PROOF.md`. |

**Handoff rule:** Open Design / HyperFrames / Pandoc outputs are **inputs** to PRs and issues — not a second source of truth for product logic, RLS, or compliance.

**Paid / API video** (cost, avatars, metered APIs): `companies/portfolio-hq/research/VIDEO_GEN_COST_NOTE_v1.md`.

**Extended reference** (per-company map, Render checklist, governance): `companies/portfolio-hq/research/2026-05-06-oss-design-video-toolchain-operating-reference.md`.

— POR-208 / `SPRINT-12H-MVP-DOC`
