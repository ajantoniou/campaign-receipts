# Designer Tasklist — Week 1 Visual Execution

**Issue:** CON-3 Brand name proposals

**Status:** READY FOR DESIGNER ASSIGNMENT

**Due:** End of Week 1 (2026-05-10)

**Assigned to:** [Design/Visual agent — TBD]

---

## Reference Documents

Before starting, read these in order:
1. `/brand/brand-guidelines-v1.md` — Master brand direction + mood boards + messaging
2. `/brand/logo-wordmark-spec.md` — Logo design specification + file deliverables
3. `/brand/book-cover-template.md` — Cover system, color palette by category, 3 example briefs

---

## Task Breakdown

### TASK 1: Logo & Wordmark Files

**Specification:** See `/brand/logo-wordmark-spec.md`

**Deliverables:**
- [ ] Figma file: `concise-brand-system.figma` (editable, master components)
- [ ] SVG file: `logo-concise-primary-navy.svg` (web-ready, clean code)
- [ ] PNG files: `logo-concise-primary-navy.png` (1x: 1000px) + `@2x.png` (2000px)
- [ ] PNG files: `logo-concise-white.png` (1x + 2x, for dark backgrounds)
- [ ] PNG files: `logo-concise-monochrome.png` (1x + 2x, grayscale)
- [ ] PDF file: `logo-concise.pdf` (for print vendors)
- [ ] Favicon: `logo-concise-favicon.svg` + `.png` (32px, 16px versions)

**Design Requirements:**
- Typeface: Inter Bold (free from Google Fonts)
- Case: ALL CAPS
- Letter spacing: -0.02em (tight, modern)
- Color: Navy (#1a2a4d)
- Accent underline: Electric cyan (#00d9ff), 3px, below final "E"
- Minimum sizing: 40px (web), 1" (print)

**Folder location:** `/brand/assets/`

**Time estimate:** 2-4 hours (design + file prep + QA)

---

### TASK 2: Book Cover System & Figma Template

**Specification:** See `/brand/book-cover-template.md`

**Deliverables:**
- [ ] Figma file: `concise-cover-template-6x9.figma` (paperback master)
- [ ] Figma file: `concise-cover-template-5x8.figma` (hardcover master)
- [ ] Figma file: `concise-cover-template-digital.figma` (e-book 1:1.5 ratio)
- [ ] Master component: Top band (with CONCISE wordmark + category color)
- [ ] Master component: Main content area (title + image placement guides)
- [ ] Master component: Bottom band (author + category metadata)
- [ ] Color palette component library (swatches for each category)

**Design Requirements:**
- Grid: 15% top / 70% main / 15% bottom
- Dimensions: Paperback 6"×9", Hardcover 5"×8", Digital 1000×1500px
- Bleed: 0.125" on print files
- Safe margin: 0.25" (paperback), 0.5" (hardcover)
- Typography: Inter Bold (CONCISE), Brandon Grotesque Bold (titles), Inter Regular (body)

**Folder location:** `/brand/assets/book-covers/template/`

**Time estimate:** 3-5 hours (template setup + components + testing)

---

### TASK 3: Three Example Book Covers (High-Fidelity)

**Specification:** See `/brand/book-cover-template.md`, "Three Example Designs" section

#### 3a. MCAT Essentials Cover

**Design brief:**
- Category: MCAT/Education
- Color scheme: Navy (#1a2a4d) + electric cyan (#00d9ff)
- Title: "MCAT ESSENTIALS"
- Subtitle: "Proven Strategies for Test Day Success"
- Imagery: Medical/science theme (stethoscope, molecules, brain scan, or abstract medical icon)
- Format: 6"×9" paperback + digital 1000×1500px
- Style: Clean, trustworthy, professional

**Deliverables:**
- [ ] `mcat-essentials-cover.figma` (editable source)
- [ ] `mcat-essentials-cover.png` (1000×1500px, web)
- [ ] `mcat-essentials-cover.pdf` (CMYK, print-ready with bleeds)
- [ ] Back cover & spine (if applicable)

**Time estimate:** 2-3 hours (design + image sourcing + exports)

#### 3b. Trump Book Cover

**Design brief:**
- Category: Politics/Analysis
- Color scheme: Navy (#1a2a4d) + gold (#d4af37) accent *per CN-009 founder direction*
- Title: "TRUMP BEFORE AIPAC MONEY" (or founder-approved alternative from CN-009)
- Subtitle: "A Candidate's First Year and the Capture That Followed"
- Imagery: Abstract/geometric treatment (bold typography, geometric shapes, NO photos to avoid sensitivity)
- Format: 6"×9" paperback + digital 1000×1500px
- Style: Bold, contrarian, confident positioning

**Deliverables:**
- [ ] `trump-book-cover.figma` (editable source)
- [ ] `trump-book-cover.png` (1000×1500px, web)
- [ ] `trump-book-cover.pdf` (CMYK, print-ready with bleeds)
- [ ] Back cover & spine

**Time estimate:** 2-3 hours (design + abstract treatment + exports)

#### 3c. Practical Advice Book Cover

**Design brief:**
- Category: Advice/Self-Help/Practical
- Color scheme: Navy (#1a2a4d) + coral (#ff6b6b) accent
- Title: "HOW TO STUDY BETTER" (example; adapt to actual title)
- Subtitle: "Science-Backed Tactics for Retention and Achievement"
- Imagery: Approachable (open book, coffee cup, workspace, study environment)
- Format: 6"×9" paperback + digital 1000×1500px
- Style: Friendly, accessible, actionable

**Deliverables:**
- [ ] `advice-cover.figma` (editable source)
- [ ] `advice-cover.png` (1000×1500px, web)
- [ ] `advice-cover.pdf` (CMYK, print-ready with bleeds)
- [ ] Back cover & spine

**Time estimate:** 2-3 hours (design + image sourcing + exports)

**Subtotal for Task 3:** 6-9 hours

---

### TASK 4: Website Mockup & Components

**Specification:** See `/brand/brand-guidelines-v1.md`, "Marketing Collateral" section

**Deliverables:**
- [ ] Figma file: `concise-website-components.figma`
- [ ] Component: Website header (Concise wordmark + nav + hero)
- [ ] Component: Product card (book cover + title + price + CTA)
- [ ] Component: CTA button (navy bg, white text, cyan border)
- [ ] PNG export: Header layout mockup
- [ ] PNG export: Product grid (3-4 cards layout)

**Design Requirements:**
- Header: Concise wordmark (48px) + navigation
- Product card: Cover image + title + subtitle + price + "Add to Cart" button
- CTA button: Navy background (#1a2a4d), white text, cyan border (2px)
- Typography: Inter (body), Brandon Grotesque (titles)
- Spacing: 20px padding on cards, 40px gutters

**Folder location:** `/brand/assets/website/`

**Time estimate:** 3-4 hours (mockup + component setup + exports)

---

### TASK 5: Email Template v1

**Specification:** See `/brand/brand-guidelines-v1.md`, "Email Templates" section

**Deliverables:**
- [ ] HTML file: `concise-email-template.html` (responsive, dark mode support)
- [ ] Figma mockup: `concise-email-template.figma`
- [ ] PNG export: Email template preview

**Design Requirements:**
- Header: Concise wordmark (white on navy background)
- Body: Clean typography, 600px width
- CTA button: Navy background, white text, cyan border (2px)
- Footer: Gray background, white text, Concise wordmark (smaller)
- Font stack: Inter (Helvetica fallback), Arial system fonts

**Layout:**
```
┌─────────────────┐
│ CONCISE header  │  Navy background
├─────────────────┤
│ Email content   │  White background
│                 │
│ [CTA Button]    │  Cyan accent
├─────────────────┤
│ Footer          │  Gray background
└─────────────────┘
```

**Folder location:** `/brand/assets/email/`

**Time estimate:** 2-3 hours (design + HTML coding + testing)

---

### TASK 6: Color Palette & Swatch Library

**Specification:** See `/brand/brand-guidelines-v1.md`, "Color Palette" section

**Deliverables:**
- [ ] Figma library: `concise-color-palette.figma` (all colors + swatches)
- [ ] PDF: `concise-color-palette.pdf` (Pantone + hex reference)
- [ ] PNG: `color-swatches.png` (visual reference)
- [ ] JSON/CSS: `color-variables.json` (dev integration)

**Color specifications:**
```
Primary Navy: #1a2a4d (RGB 26, 42, 77)
Electric Cyan: #00d9ff (RGB 0, 217, 255)
White: #ffffff
Light Gray: #f5f5f5
Charcoal: #2c3e50

Category Accents:
- MCAT: Cyan #00d9ff
- Politics: Gold #d4af37
- Advice: Coral #ff6b6b
- Science: Purple #6c5ce7
```

**Folder location:** `/brand/assets/colors/`

**Time estimate:** 1-2 hours (library setup + exports)

---

## Total Time Estimate

- Task 1 (Logo): 2-4 hours
- Task 2 (Cover template): 3-5 hours
- Task 3 (3 example covers): 6-9 hours
- Task 4 (Website mockup): 3-4 hours
- Task 5 (Email template): 2-3 hours
- Task 6 (Color palette): 1-2 hours

**Total: 17-27 hours** (assume 20 hours for planning purposes)

**Weekly capacity:** If 1 designer works 40 hours/week, this is ~50% of Week 1 capacity.

---

## Dependencies & Tools

### Required Software
- Figma (free tier sufficient, or Figma Professional for team sharing)
- Design tool: Adobe Creative Suite, Sketch, or Figma
- Image library: Unsplash, Pexels (free stock images)
- Font: Inter (Google Fonts, free open-source)
- Font: Brandon Grotesque (purchase or substitute with Futura/Montserrat)

### Assets Needed
- MCAT imagery: medical/science theme (stock photos or icons)
- Trump book: abstract/geometric patterns (designer-created or AI-generated)
- Advice book: workspace/study environment (stock photos)

### File Storage
- All files should save to `/brand/assets/` folder structure (per `/brand/book-cover-template.md`)
- Figma files should be linked in a shared team folder (TBD by company)

---

## Approval Process

1. **Designer completes files** → posts in Paperclip comment with file links
2. **Brand/Design lead reviews** → approves or requests revisions
3. **Founder final approval** → wordmark, cover examples, palette locked
4. **Archive to assets folder** → ready for development team integration

---

## Blockers & Support

**If designer is blocked on:**
- **Brand direction:** Refer to SESSION_DECISIONS.md + `/brand/brand-guidelines-v1.md`
- **Font availability:** Inter is free; Brandon Grotesque can be substituted with Futura or Montserrat
- **Image sourcing:** Use Unsplash/Pexels for stock; AI generator (DALL-E, Midjourney) for Trump book abstract
- **Figma setup:** Use master components library for consistency
- **Print specifications:** CMYK color space, 0.125" bleed, 300 DPI minimum

---

## Success Criteria

- [x] Brand direction locked (Option 2)
- [ ] Logo files in all required formats (SVG, PNG, PDF, Figma)
- [ ] Cover template with working master components
- [ ] 3 high-fidelity example covers (web + print-ready)
- [ ] Website mockup + component library
- [ ] Email template (HTML + mockup)
- [ ] Color palette with Pantone reference
- [ ] All files archived to `/brand/assets/`
- [ ] Founder approval on logo, colors, cover examples

---

**Created:** 2026-05-03 — Brand & Design (CON-3 execution)

**Issue ready for:** Designer assignment and Week 1 execution

**Next steps:** Assign designer agent to execute tasks 1-6 in order of priority (Logo → Covers → Website/Email → Colors).
