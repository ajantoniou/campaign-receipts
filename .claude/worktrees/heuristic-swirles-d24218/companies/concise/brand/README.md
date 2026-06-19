# Concise Brand — Documentation Index

**Issue:** CON-3 Brand name proposals

**Status:** ✅ STRATEGIC PHASE COMPLETE → 🔄 DESIGN EXECUTION PHASE (Week 1)

**Decision:** Option 2 — "Concise" Parent Brand + Pseudonym Author (locked)

---

## File Guide

### 1. Strategic Decision & Analysis
**`brand-name-proposals.md`**
- 3 strategic options analyzed (Continue Pseudonym / Concise + Pseudonym / New Brand)
- Pro/con matrix for each
- Strong recommendation for Option 2
- 3 visual mood boards defined
- **STATUS:** ✅ Complete (delivered earlier, still valid)

---

### 2. Brand Guidelines
**`brand-guidelines-v1.md`**
- Brand architecture (Concise parent + pseudonym author)
- Visual identity system (mood board: Premium, Clean, Direct)
- Color palette (Navy, Electric cyan, supporting colors)
- Typography hierarchy (Inter Bold, Brandon Grotesque, etc.)
- Marketing collateral templates (website, email, social)
- Brand voice and messaging framework
- Phase 1 & Phase 2 deliverables roadmap
- **STATUS:** ✅ Complete & locked for design execution

---

### 3. Logo & Wordmark Specification
**`logo-wordmark-spec.md`**
- Design intent: minimal, modern, confident
- Typeface specifications: Inter Bold, all-caps, -0.02em letter spacing
- Color specifications: Navy (#1a2a4d) + electric cyan (#00d9ff) accent
- Clear space and sizing guidelines (40px minimum)
- 4 variations: dark on light, light on dark, monochrome, horizontal lock-up (future)
- File deliverables: SVG, PNG (1x/2x), PDF, Figma
- Usage guidelines (DO's and DON'Ts)
- Design rationale tied to brand strategy
- **STATUS:** ✅ Complete specification, awaiting designer implementation

---

### 4. Book Cover System & Template
**`book-cover-template.md`**
- Cover anatomy: 15% top band + 70% main content + 15% bottom band
- Format specifications: Paperback (6"×9"), Hardcover (5"×8"), Digital (1:1.5)
- Color palette by category:
  - MCAT/Education: Navy + electric cyan
  - Politics: Navy + gold (per CN-009 founder direction)
  - Advice/Self-Help: Navy + coral
  - Science/Reference: Navy + purple
- Typography hierarchy with exact font specs
- 3 example cover designs (ASCII mockups):
  - MCAT Essentials (image-dominant, medical theme)
  - Trump Book (bold typography, abstract treatment)
  - Practical Advice (approachable, friendly imagery)
- File structure and deliverables checklist
- Print (CMYK, 300 DPI) + digital specifications
- Design notes for sensitive content (pseudonym privacy, political messaging)
- **STATUS:** ✅ Complete specification, awaiting designer implementation

---

### 5. Designer Tasklist — Week 1 Execution
**`DESIGNER-TASKLIST-WEEK1.md`**
- Complete breakdown of 6 designer tasks:
  1. Logo & Wordmark Files (SVG, PNG, PDF, Figma)
  2. Book Cover System (Figma templates + master components)
  3. Three Example Book Covers (MCAT, Trump, Advice — high-fidelity)
  4. Website Mockup & Components (header, product card, buttons)
  5. Email Template v1 (HTML responsive + Figma mockup)
  6. Color Palette & Swatch Library (Figma + PDF + JSON)
- Time estimate per task + total (17-27 hours, ~20 hours expected)
- Dependencies (Figma, Adobe Creative Suite or Sketch, fonts, stock images)
- Success criteria
- Approval process
- Blocker resolution guide
- **STATUS:** ✅ Complete roadmap for designer assignment

---

### 6. Trump Book Cover Direction (Reference)
**`trump-book-cover-variants.md`**
- Contains specific book title direction per founder preferences
- Color/messaging guidance for politics category covers
- Linked from task 3b in DESIGNER-TASKLIST-WEEK1.md
- **STATUS:** ✅ Complete, already reviewed by founder (CN-009)

---

## Quick Navigation

### If you are a **Designer** starting Week 1 execution:
1. Read: `/brand/brand-guidelines-v1.md` (5 min) — understand brand direction
2. Read: `/brand/DESIGNER-TASKLIST-WEEK1.md` (10 min) — your full task list
3. Refer to: `/brand/logo-wordmark-spec.md` (during Task 1)
4. Refer to: `/brand/book-cover-template.md` (during Task 2-3)
5. Execute tasks in order: Logo → Templates → Covers → Website → Email → Colors

### If you are a **Founder** reviewing progress:
1. Confirm: Decision is Option 2 (Concise + Pseudonym) ✅
2. Review: `/brand/brand-guidelines-v1.md` — does this feel right?
3. Review: `/brand/DESIGNER-TASKLIST-WEEK1.md` — are tasks clear?
4. Approve or iterate on logo/cover designs when designer posts examples

### If you are a **CEO/Chief of Staff** scheduling next work:
1. CON-3 strategic phase: ✅ COMPLETE
2. CON-3 design execution: 🔄 IN PROGRESS (assign designer, 20 hour estimate)
3. Related issues to schedule:
   - CN-009: Trump book cover execution (uses templates from CON-3)
   - CN-004+: Additional book covers (MCAT variants, other categories)
   - CN-005: Website launch (uses website components from CON-3)

---

## Key Decisions Locked In

### Brand Architecture
> **Concise** (parent brand, direct-sale, premium positioning) + **[Pseudonym]** (author name, maintains 10-year Amazon presence)

### Visual Identity
- **Mood board:** Premium, Clean, Direct (minimalist, high-contrast, strong typography)
- **Color:** Navy (#1a2a4d) primary + Electric cyan (#00d9ff) accent
- **Typography:** Inter (headlines), Brandon Grotesque (titles), Inter Regular (body)
- **Design language:** Stripe/Notion aesthetic — trustworthy, expert, no-nonsense

### Messaging
> "Concise curates and elevates the best educational books — written by experts, designed for direct readers."

### Founder Constraints (Hard Rules)
- ✅ Never reveal real name in any Concise marketing (pseudonym only)
- ✅ Trump book: keep messaging platform-agnostic, avoid inflammatory visuals
- ✅ No AI-flavored design or generic stock photography
- ✅ Every touchpoint must feel intentional and curated (premium positioning)

---

## File Structure (Assets Folder)

Once designer completes tasks, files will be organized as:

```
concise/brand/assets/
├── logo/
│   ├── logo-concise-primary-navy.svg
│   ├── logo-concise-primary-navy.png (1x, 2x)
│   ├── logo-concise-white.png (1x, 2x)
│   ├── logo-concise-monochrome.png (1x, 2x)
│   ├── logo-concise.pdf
│   ├── logo-concise-favicon.svg
│   └── concise-brand-system.figma
├── book-covers/
│   ├── template/
│   │   ├── concise-cover-template-6x9.figma
│   │   ├── concise-cover-template-5x8.figma
│   │   └── concise-cover-template-digital.figma
│   └── examples/
│       ├── mcat-essentials-cover.{png,pdf,figma}
│       ├── trump-book-cover.{png,pdf,figma}
│       └── advice-cover.{png,pdf,figma}
├── website/
│   ├── concise-website-components.figma
│   ├── header-mockup.png
│   └── product-grid.png
├── email/
│   ├── concise-email-template.html
│   ├── concise-email-template.figma
│   └── email-preview.png
└── colors/
    ├── concise-color-palette.figma
    ├── concise-color-palette.pdf
    ├── color-swatches.png
    └── color-variables.json
```

---

## Handoff Checklist

- [x] Brand direction decided (Option 2)
- [x] Brand guidelines written
- [x] Logo specification complete
- [x] Cover system specification complete
- [x] Designer tasklist created
- [ ] Designer assigned to Week 1 tasks
- [ ] Logo files delivered + founder approved
- [ ] Book cover templates + examples delivered + founder approved
- [ ] Website mockup delivered
- [ ] Email template delivered
- [ ] Color palette finalized + Pantone reference verified
- [ ] All files archived to `/brand/assets/`
- [ ] Ready for development team integration

---

## Timeline

**Week 0 (2026-05-02 → 2026-05-03):**
- Strategic decision + brand guidelines: ✅ COMPLETE

**Week 1 (2026-05-03 → 2026-05-10):**
- Designer execution: 🔄 IN PROGRESS
- Expected completion: End of Week 1

**Week 2 (2026-05-10 → 2026-05-17):**
- Founder review + revisions
- Development integration (website templates, email setup)
- Ready for launch

---

## Questions?

Refer to the specific document:
- **"What's the brand positioning?"** → `brand-guidelines-v1.md`
- **"What should the logo look like?"** → `logo-wordmark-spec.md`
- **"How do I design a book cover?"** → `book-cover-template.md`
- **"What are the designer's tasks?"** → `DESIGNER-TASKLIST-WEEK1.md`
- **"What are the color hex codes?"** → `brand-guidelines-v1.md` (Color Palette section)

---

**Created:** 2026-05-03 — Brand & Design (CON-3 execution)

**Last updated:** 2026-05-03 03:20 ET

**Issue:** CON-3 Brand name proposals

**Status:** ✅ Strategic phase complete → 🔄 Design execution in progress
