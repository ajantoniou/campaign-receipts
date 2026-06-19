# Concise Brand Assets — Complete Index

**Project:** CON-3 Brand name proposals (strategic phase) + Week 1 design execution

**Status:** ✅ COMPLETE (10 assets delivered, production-ready)

**Date created:** 2026-05-03

**Execution mode:** Continuous-work per founder directive (SESSION_DECISIONS 23:30 ET)

---

## Quick Navigation by Use Case

### "I need to start designing in Figma"
1. Read: `/brand/brand-guidelines-v1.md` (5 min) — brand direction
2. Reference: `/brand/assets/book-cover-template-master.md` — master components
3. Reference: `/brand/assets/BOOK-COVERS-EXAMPLES.md` — example design briefs

### "I'm implementing the website"
1. Reference: `/brand/assets/WEBSITE-MOCKUP-SPEC.md` — full specifications
2. Copy: `/brand/assets/color-variables.json` — CSS variables
3. Reference: `/brand/assets/color-palette.md` — color specs + contrast ratios

### "I'm setting up emails"
1. Copy: Email HTML from `/brand/assets/EMAIL-TEMPLATE-SPEC.md` — production-ready
2. Reference: `/brand/assets/EMAIL-TEMPLATE-SPEC.md` — Figma specs + testing checklist

### "I need print specifications"
1. Reference: `/brand/assets/color-palette.md` — Pantone references, CMYK specs
2. Reference: `/brand/assets/book-cover-template-master.md` — print export settings

---

## File Manifest

### Logo Assets (4 files)

#### 1. `logo-concise-primary-navy.svg`
- **Type:** SVG (scalable)
- **Dimensions:** 1000px × 250px viewBox (aspect ratio 4:1)
- **Content:** "CONCISE" wordmark, navy text (#1a2a4d), cyan underline (#00d9ff)
- **Background:** White
- **Use case:** Web headers, primary brand mark, desktop sizes
- **Status:** ✅ Production-ready

#### 2. `logo-concise-white.svg`
- **Type:** SVG (scalable)
- **Dimensions:** 1000px × 250px viewBox
- **Content:** "CONCISE" wordmark, white text (#ffffff), cyan underline (#00d9ff)
- **Background:** Navy (#1a2a4d)
- **Use case:** Dark backgrounds, navy headers, footer, print on navy
- **Status:** ✅ Production-ready

#### 3. `logo-concise-monochrome.svg`
- **Type:** SVG (scalable)
- **Dimensions:** 1000px × 250px viewBox
- **Content:** "CONCISE" wordmark, navy text (#1a2a4d), navy underline (no accent)
- **Background:** White
- **Use case:** Grayscale printing, fax, PDFs, accessibility fallback
- **Status:** ✅ Production-ready

#### 4. `logo-concise-favicon.svg`
- **Type:** SVG (scalable)
- **Dimensions:** 256px × 256px (suitable for 32px, 16px favicon sizes)
- **Content:** "CONCISE" wordmark simplified, navy text, cyan underline
- **Background:** White
- **Use case:** Browser favicon, app icon, small sizes
- **Status:** ✅ Production-ready

### Color Assets (2 files)

#### 5. `color-variables.json`
- **Type:** JSON (developer-ready)
- **Content:**
  - Primary colors (navy, cyan)
  - Neutral colors (white, gray, charcoal)
  - Category accent colors (MCAT cyan, Politics gold, Advice coral, Science purple)
  - CSS variables (--color-navy-primary, etc.)
  - Tailwind config extension
- **Use case:** Web development, CSS integration, design system
- **Status:** ✅ Production-ready

#### 6. `color-palette.md`
- **Type:** Markdown reference document
- **Content:**
  - Hex, RGB, HSL, Pantone, CMYK color specs
  - Primary + accent + neutral + category colors
  - Web-safe fallbacks
  - Print specifications (CMYK color space, Pantone references)
  - WCAG AA contrast ratio table
  - Usage guidelines (DO's and DON'Ts)
  - Digital implementation (CSS variables, Tailwind)
- **Use case:** Print vendor communication, design review, accessibility verification
- **Status:** ✅ Production-ready

### Template & Specification Assets (4 files)

#### 7. `book-cover-template-master.md`
- **Type:** Markdown specification (Figma reference)
- **Content:**
  - Master component hierarchy
  - Format specifications (paperback 6×9, hardcover 5×8, digital)
  - Band components (top, main, bottom)
  - Typography master components
  - Color swatch components
  - Grid & guides settings (8px base, 4px for 300 DPI print)
  - Export settings (PNG, PDF CMYK)
  - Locked elements (never edit)
- **Use case:** Figma designer reference, component setup, constraints
- **Status:** ✅ Production-ready

#### 8. `BOOK-COVERS-EXAMPLES.md`
- **Type:** Markdown specification document
- **Content:**
  - 3 detailed cover design briefs:
    1. MCAT Essentials (education, medical imagery, cyan accent)
    2. Trump Before AIPAC Money (politics, abstract design, NO inflammatory imagery)
    3. How to Study Better (advice, warm approachable imagery, coral accent)
  - For each: top band spec, main content layout, bottom band spec, color palette, design rationale
  - Stock image sourcing guide
  - File naming conventions
  - Approval checklist
- **Use case:** Design brief reference, Figma designer specs, approval workflow
- **Status:** ✅ Production-ready

#### 9. `WEBSITE-MOCKUP-SPEC.md`
- **Type:** Markdown specification document
- **Content:**
  - Site structure
  - Header component (sticky, responsive)
  - Hero section (tagline, CTA button)
  - Featured products grid (3-column, responsive)
  - Category filters (MCAT, Politics, Advice, Science)
  - Footer (links, social, copyright)
  - Component library (buttons, product cards, filters, typography)
  - Design system documentation (font stack, colors, spacing, shadows)
  - Responsive breakpoints (375px, 768px, 1024px, 1440px)
  - Developer handoff notes
- **Use case:** Figma designer mockup reference, developer implementation specs
- **Status:** ✅ Production-ready

#### 10. `EMAIL-TEMPLATE-SPEC.md`
- **Type:** Markdown specification + production HTML
- **Content:**
  - Email structure (header, body, CTA, footer)
  - Header section (navy, logo)
  - Body section (content area, product cards)
  - CTA section (navy button, cyan border)
  - Footer section (links, copyright, unsubscribe)
  - Responsive design (600px desktop, 375px mobile)
  - Complete production-ready HTML code
  - CSS media queries for mobile
  - Dark mode CSS
  - Figma mockup specifications
  - Email marketing integration notes
  - Testing checklist
- **Use case:** Email service setup, Figma mockup reference, developer implementation
- **Status:** ✅ Production-ready

---

## Deliverables Summary

| Asset | Type | Purpose | Status |
|---|---|---|---|
| Logo (navy) | SVG | Primary brand mark | ✅ Ready |
| Logo (white) | SVG | Dark background variant | ✅ Ready |
| Logo (mono) | SVG | Grayscale/print fallback | ✅ Ready |
| Logo (favicon) | SVG | Browser favicon / small icon | ✅ Ready |
| Color variables | JSON | Dev CSS/Tailwind | ✅ Ready |
| Color palette | MD | Print specs + contrast + usage | ✅ Ready |
| Cover template | MD | Figma master components | ✅ Ready |
| Cover examples | MD | 3 design briefs (MCAT, Trump, Advice) | ✅ Ready |
| Website mockup | MD | Full site + components specs | ✅ Ready |
| Email template | MD+HTML | Production HTML + Figma specs | ✅ Ready |

**Total:** 10 files, all production-ready

---

## Integration Checklist

### For Web Developer
- [ ] Copy `color-variables.json` CSS variables into codebase
- [ ] Use `WEBSITE-MOCKUP-SPEC.md` for layout implementation
- [ ] Use `color-palette.md` for color #hex values
- [ ] Download SVG logos and optimize for web
- [ ] Test responsive behavior at breakpoints specified in spec
- [ ] Verify WCAG AA contrast ratios (reference in color-palette.md)
- [ ] Set up email template from `EMAIL-TEMPLATE-SPEC.md`

### For Figma Designer
- [ ] Create Figma file: `concise-brand-system.figma`
- [ ] Set up master components per `book-cover-template-master.md`
- [ ] Create website mockup per `WEBSITE-MOCKUP-SPEC.md`
- [ ] Create email template per `EMAIL-TEMPLATE-SPEC.md`
- [ ] Design 3 book covers per `BOOK-COVERS-EXAMPLES.md`
- [ ] Export high-res PNG files (1000×1500px for covers, 72 DPI web)
- [ ] Export PDF files with CMYK color space, bleeds, embedded fonts (300 DPI print)

### For Print Vendor
- [ ] Reference `color-palette.md` Pantone colors
- [ ] Use PDF exports with CMYK color space + bleeds
- [ ] Request fonts be embedded/outlined in PDF
- [ ] Verify 300 DPI minimum resolution
- [ ] Confirm bleed size (0.125" on all sides)

### For Founder Review
- [ ] Review logo (3 variants) per branding strategy
- [ ] Review book cover examples (MCAT, Trump, Advice)
- [ ] Review website mockup layout
- [ ] Review email template design
- [ ] Approve colors, typography, messaging
- [ ] Confirm pseudonym-only rule is followed (no real name anywhere)
- [ ] Confirm Trump book has no inflammatory imagery

---

## Dependencies & Prerequisites

### Required Software
- Figma (for designer mockups)
- Adobe Creative Suite / Sketch (for PDF export, optional)
- Text editor (to reference .md files)
- Web browser (to test SVG display)

### Font Requirements
- **Inter** (free open-source) — from Google Fonts
- **Brandon Grotesque** (paid) or substitute with **Futura** / **Montserrat Bold**

### Image Assets Needed (Not Included)
- MCAT book cover: Medical/science imagery (source from Unsplash, Pexels)
- Trump book cover: Custom abstract design (create in Figma, no stock photos)
- Advice book cover: Warm approachable imagery (source from Unsplash, Pexels)
- Website hero: Navy gradient or book-themed image

---

## Version Control

| Asset | Version | Last Updated | Status |
|---|---|---|---|
| All logos | 1.0 | 2026-05-03 | Locked |
| Color palette | 1.0 | 2026-05-03 | Locked |
| Book cover spec | 1.0 | 2026-05-03 | Locked |
| Website spec | 1.0 | 2026-05-03 | Locked |
| Email template | 1.0 | 2026-05-03 | Locked |

**Note:** All specifications are locked as of 2026-05-03. Changes require founder approval.

---

## Next Steps

1. **Founder review:** 2026-05-03 → 2026-05-05
   - Review and approve all assets
   - Request changes if needed

2. **Visual implementation:** 2026-05-05 → 2026-05-10
   - Figma designer creates high-res mockups
   - Designer exports PNG + PDF versions
   - Testing on multiple devices

3. **Development:** 2026-05-10 → 2026-05-17
   - Web developer integrates CSS / HTML
   - Email service setup
   - Domain + site launch

4. **Soft launch:** 2026-05-17 → 2026-05-24
   - Beta testing with 5-10 users
   - Gather feedback
   - Final polish

5. **Public launch:** 2026-05-24+
   - Go live with full product catalog
   - Begin marketing campaign

---

## Support & Questions

**For design questions:**
- Reference: `/brand/brand-guidelines-v1.md` (brand strategy + voice)
- Reference: `/brand/logo-wordmark-spec.md` (logo design rules)

**For implementation questions:**
- Reference: `/brand/assets/color-variables.json` (CSS specs)
- Reference: `/brand/assets/WEBSITE-MOCKUP-SPEC.md` (layout specs)
- Reference: `/brand/assets/EMAIL-TEMPLATE-SPEC.md` (email structure)

**For print questions:**
- Reference: `/brand/assets/color-palette.md` (Pantone + CMYK specs)
- Reference: `/brand/assets/book-cover-template-master.md` (export settings)

---

**Created:** 2026-05-03 — Brand & Design (CON-3 execution)

**Project:** Concise (Option 2: "Concise" parent brand + pseudonym author)

**Execution:** Continuous-work mode (per founder directive)

**Status:** ✅ COMPLETE — All strategic + specification work delivered, ready for visual implementation
