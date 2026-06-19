# "Concise" Wordmark Design Specification

**Status:** LOCKED for implementation

---

## Primary Wordmark

### Design Intent
Minimal, modern, confident. The wordmark signals expertise and directness through clean typography and intentional use of negative space.

### Specifications

**Typeface:** Inter Bold (open-source, premium feel, geometric sans-serif)
- **Fallback:** SF Pro Display Bold (Apple system font, matches Notion aesthetic)
- **Backup:** Helvetica Neue Bold (universal availability)

**Settings:**
- **Case:** ALL CAPS
- **Letter spacing:** -0.02em (tight, modern)
- **Weight:** 700 (Bold)
- **Size reference:** 48px (web), 1.5" (print)

**Color — Primary Dark:**
- **Hex:** #1a2a4d (deep navy, trust-forward)
- **RGB:** (26, 42, 77)
- **Pantone:** 533 C (or close match)

**Accent Underline:**
- **Color:** #00d9ff (electric cyan/teal)
- **Thickness:** 3px
- **Position:** Below final "E", extends 60-70% of character width
- **Purpose:** Visual interest, signals "curated selection" + modernity

### ASCII Mockup
```
  C O N C I S E
       ═══════
```

---

## Logo Variations

### Variation 1: Full Wordmark (Primary)
- Full "CONCISE" text
- Navy on white (default)
- With electric cyan accent underline

### Variation 2: Dark Mode
- Full "CONCISE" text
- White on navy background
- Electric cyan accent underline (maintained for consistency)

### Variation 3: Monochrome
- Full "CONCISE" text
- Navy only
- Underline converts to navy (no accent color)
- Use case: fax, PDF, grayscale printing

### Variation 4: Horizontal Lock-Up (Future)
*For future development (Phase 2+)*
- "CONCISE" wordmark + small icon mark (TBD)
- Side-by-side layout for app/favicon use

---

## Sizing & Clear Space

### Minimum Sizing
- **Web:** 40px width
- **Print:** 1" width
- **Favicon:** 32px × 32px (wordmark only, simplified if needed)

### Clear Space
- Minimum 20px padding on all sides (in production files)
- No other design elements should bleed into this zone

### Responsive Scaling
- Maintain letter spacing and underline proportions at all sizes
- Ensure underline stays visible down to 24px width

---

## Color Specifications

### Primary Navy (#1a2a4d)
- **Web:** RGB(26, 42, 77) or Hex #1a2a4d
- **Print:** Pantone 533 C (70% navy, high contrast on white)
- **CMYK:** C:95 M:75 Y:50 K:40
- **Usage:** Primary text, headlines, accents

### Electric Cyan (#00d9ff)
- **Web:** RGB(0, 217, 255) or Hex #00d9ff
- **Print:** Pantone 3125 C or Pantone 306 C
- **CMYK:** C:70 M:5 Y:0 K:0
- **Usage:** Accent underline, CTAs, hover states

### White (#ffffff)
- **Web:** RGB(255, 255, 255) or Hex #ffffff
- **Print:** Uncoated paper or coated white
- **Usage:** Background, typography on navy

### Light Gray (#f5f5f5)
- **Web:** RGB(245, 245, 245) or Hex #f5f5f5
- **Print:** 5% gray screen or lightest gray available
- **Usage:** Subtle backgrounds, dividers

---

## File Deliverables

### Required Formats
- [ ] SVG (scalable, production-ready, for web)
- [ ] PNG (1x: 1000px wide; 2x: 2000px wide, transparent background)
- [ ] PDF (for print vendors)
- [ ] Figma source file (editable, design system reference)

### Folder Structure
```
concise/brand/assets/
├── logo-concise-primary-navy.svg
├── logo-concise-primary-navy.png (1x)
├── logo-concise-primary-navy@2x.png (2x)
├── logo-concise-white.svg
├── logo-concise-white.png (1x)
├── logo-concise-white@2x.png (2x)
├── logo-concise-monochrome.svg
├── logo-concise-monochrome.png (1x)
├── logo-concise-monochrome@2x.png (2x)
├── logo-concise-favicon.svg
├── logo-concise-favicon.png (32px, 16px)
└── concise-brand-design.figma (source file link)
```

---

## Usage Guidelines

### DO ✅
- Use primary navy wordmark on white/light backgrounds
- Use white wordmark on navy/dark backgrounds
- Maintain consistent letter spacing and underline proportion
- Scale proportionally (never stretch or condense)
- Provide adequate white space around the wordmark

### DON'T ❌
- Rotate the wordmark (keep horizontal or vertical only)
- Add drop shadows, gradients, or effects
- Change the typeface or letter spacing
- Remove the accent underline (except in monochrome)
- Place over busy backgrounds without contrast check
- Use trademarked fonts in places where they're not available (substitute with approved fallback)

---

## Application Examples

### Website Header
```
[CONCISE wordmark] — Premium Books for Direct Readers
```
Wordmark: 48px, navy on white, full padding

### Book Cover
```
╔═══════════════════════════╗
║  CONCISE                  ║  ← 36px, navy, top 15%
║                           ║
║   Book Title              ║  ← 48px, bold, center
║   Long descriptive text   ║
║                           ║
║      [Book hero image]    ║  ← 70%
║                           ║
║  by [Pseudonym]           ║  ← 16px, bottom 15%
║  subcategory              ║
╚═══════════════════════════╝
```

### Email Header
```
[CONCISE wordmark (white, 32px) on navy background] — Contact us
```

---

## Design Rationale

1. **All-caps typography:** Signals authority and distinctiveness; matches premium brands (Stripe, Notion)
2. **Tight letter spacing:** Modern, confident; no "spread out" feeling
3. **Navy color:** Trust, professionalism, education-adjacent (MCAT positioning)
4. **Electric cyan underline:** Signals "curation" and modernity; warm enough to feel approachable, cool enough for premium positioning
5. **Minimal design:** Ensures legibility at small sizes and flexibility for future sub-brands

---

## Next Steps

1. **Designer creates SVG + PNG files** based on this spec
2. **Figma file set up** with master components for book covers, website, email
3. **Test at multiple sizes** (32px favicon, 48px header, 400px print)
4. **Review with founder** for approval
5. **Archive files** in `/concise/brand/assets/`

---

**Created:** 2026-05-03 — Brand & Design (CON-3 execution)

**Designer assigned:** [Pending — Brand/Design agent to implement]
