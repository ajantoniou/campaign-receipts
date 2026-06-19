# Concise Book Cover Template & System

**Status:** LOCKED for implementation

**Design system:** Option 2 "Concise + Pseudonym" brand architecture

---

## Cover Anatomy

All Concise book covers follow this grid system:

```
┌─────────────────────────────────────┐
│ [15%] TOP BAND                      │  Accent color bar + "CONCISE" wordmark
├─────────────────────────────────────┤
│                                     │
│ [70%] MAIN CONTENT AREA             │  Book title, hero image/typography
│                                     │
├─────────────────────────────────────┤
│ [15%] BOTTOM BAND                   │  Author, subtitle, spine info
└─────────────────────────────────────┘
```

---

## Specifications by Format

### Paperback (Standard)
- **Dimensions:** 6" W × 9" H
- **Bleed:** 0.125" on all sides
- **Safe margin:** 0.25" from edge
- **Spine width:** ~0.3" (varies by page count)

### Hardcover
- **Dimensions:** 5" W × 8" H (smaller, premium format)
- **Bleed:** 0.125" on all sides
- **Jacket:** Wraps cover + spine + back flap
- **Safe margin:** 0.5" from edge (larger due to dust jacket)

### Digital (E-book)
- **Aspect ratio:** 1:1.5 (standard for Kindle, Apple Books)
- **Resolution:** 1000×1500px minimum (72 DPI for web, 300 DPI for printing)
- **Safety zone:** 5% margin from edges

---

## Top Band (15%)

### Color & Layout
- **Background color:** Category-specific (see color key below)
- **Height:** ~1.35" (paperback 9" × 0.15)
- **Element placement:**
  - "CONCISE" wordmark: left-aligned, 0.5" from top, navy color
  - Accent line: full width, 2-3px, under wordmark
  - Optional visual element: right side (small icon, pattern, or texture)

### Typography
- **Font:** Inter Bold (same as wordmark)
- **Size:** 0.5" (large, statement-making)
- **Case:** ALL CAPS
- **Color:** Navy (#1a2a4d)
- **Spacing:** 0.25" from left edge

---

## Main Content Area (70%)

### Book Title Treatment

**Primary Option: Centered Typography**
- **Font:** Brandon Grotesque Bold or Futura Bold
- **Size:** Title varies by length (1.5"-2.5" tall for standard length)
- **Color:** Navy (#1a2a4d) or white (contrast-dependent)
- **Position:** Vertically centered, horizontal center
- **Line spacing:** 1.2 (tight but readable)

**Layout:**
```
    MCAT ESSENTIALS

    Proven Strategies for Test Day Success

    [Hero image or visual element, 30-50% height]
```

### Secondary Option: Image-Dominant with Type Overlay
- Large hero image (photograph, illustration, or abstract)
- Title positioned as white text overlay, lower half
- Semi-transparent dark layer behind text (for readability)
- Subtitle in smaller text below

**Design approach:**
- Strong contrast between text and image
- Type should feel "floating" on image, not embedded
- Image should relate to subject (MCAT books = medical/science imagery; politics = bold typography or abstract forms)

### Content Requirements
- **Title:** Bold, high-impact, clearly visible from thumbnail
- **Subtitle/tagline:** Optional, supporting context (1-2 lines max)
- **Visual element:** Category-appropriate imagery or pattern
- **No clutter:** Each element serves a purpose

---

## Bottom Band (15%)

### Author & Metadata
- **Height:** ~1.35" (paperback 9" × 0.15)
- **Background:** White or light gray (#f5f5f5) for contrast
- **Text layout:**
  - "by [Pseudonym]" — left-aligned, 0.3" from bottom, 12pt Inter Regular
  - Category/subcategory — right-aligned, 10pt Inter Light (optional, for discovery)
  - Spine text — centered, 8pt (for print binding)

### Example Bottom Band (MCAT category):
```
by [Pseudonym Author]                    MCAT Prep
```

### Example Bottom Band (Politics category):
```
by [Pseudonym Author]           Political Analysis
```

---

## Color Palette by Category

### MCAT / Education (Primary)
- **Top band:** Navy (#1a2a4d)
- **Accent underline:** Electric cyan (#00d9ff)
- **Secondary accent:** Light teal (#e0f9ff)
- **Example:** Medical/scientific imagery, clean typography

### Politics & Analysis (Secondary)
- **Top band:** Navy (#1a2a4d)
- **Accent underline:** Gold/amber (#d4af37) *per CN-009 direction*
- **Secondary accent:** Warm orange (#ff6b35)
- **Example:** Bold typography, contrasting color blocking

### Advice / Self-Help / Practical (Tertiary)
- **Top band:** Navy (#1a2a4d)
- **Accent underline:** Warm coral (#ff6b6b)
- **Secondary accent:** Light coral (#ffe0e0)
- **Example:** Approachable imagery, friendly color scheme

### Science / Reference (Quaternary)
- **Top band:** Navy (#1a2a4d)
- **Accent underline:** Deep purple (#6c5ce7)
- **Secondary accent:** Light purple (#dfe6e9)
- **Example:** Diagrams, infographics, structural imagery

---

## Typography Hierarchy

### Title (Main Book Title)
- **Font:** Brandon Grotesque Bold or Futura Bold
- **Size:** 1.5"-2.5" tall (depends on title length)
- **Color:** Navy (#1a2a4d) or white (high contrast on image)
- **Weight:** Bold (700)
- **Leading:** 1.2

### Subtitle / Descriptor
- **Font:** Inter Regular
- **Size:** 0.5"-0.75" tall
- **Color:** Navy or supporting color
- **Weight:** Regular (400)
- **Leading:** 1.3

### Author Name
- **Font:** Inter Regular
- **Size:** 0.25" tall (12pt)
- **Color:** Navy or supporting color
- **Weight:** Regular (400)

### "CONCISE" Brand Mark
- **Font:** Inter Bold (locked, per logo spec)
- **Size:** 0.5" wide
- **Color:** Navy (top band)
- **Weight:** Bold (700)

---

## Three Example Designs (Phase 1)

### Example 1: MCAT Essentials (Image-Dominant)

```
╔════════════════════════════════════╗
║ CONCISE ════════════════════════   ║  15% top band
║ [Accent cyan underline]            ║
╠════════════════════════════════════╣
║                                    ║
║         MCAT ESSENTIALS            ║  Large title, navy
║    Proven Strategies for           ║  Subtitle
║      Test Day Success              ║
║                                    ║
║    [Hero: Blue gradient +          ║  70% main area
║     stethoscope silhouette]        ║  Medical/science imagery
║                                    ║
╠════════════════════════════════════╣
║ by [Pseudonym Author]       PREP  ║  15% bottom band
╚════════════════════════════════════╝
```

**Design notes:**
- Navy title on light hero image
- Medical/science color scheme (blue, cyan accents)
- Clean, trustworthy, education-forward

### Example 2: Trump Book (Bold Typography)

```
╔════════════════════════════════════╗
║ CONCISE ════════════════════════   ║  15% top band
║ [Accent gold underline]            ║
╠════════════════════════════════════╣
║                                    ║
║   TRUMP BEFORE                     ║  Large, bold, left-aligned
║   AIPAC MONEY                      ║  Political positioning
║                                    ║
║   A Candidate's First Year         ║  Subtitle
║   and the Capture That Followed    ║
║                                    ║
║   [Abstract: Bold black +          ║  70% main area
║    gold geometric pattern]         ║  Political design language
║                                    ║
╠════════════════════════════════════╣
║ by [Pseudonym Author]  POLITICS   ║  15% bottom band
╚════════════════════════════════════╝
```

**Design notes:**
- Gold accent per CN-009 founder direction
- Bold, contrarian positioning
- Abstract/geometric imagery (no photos, avoid sensitivity)
- Strong color blocking

### Example 3: Practical Advice (Approachable)

```
╔════════════════════════════════════╗
║ CONCISE ════════════════════════   ║  15% top band
║ [Accent coral underline]           ║
╠════════════════════════════════════╣
║                                    ║
║      HOW TO STUDY BETTER           ║  Title, centered
║   Science-Backed Tactics for       ║
║    Retention & Achievement         ║
║                                    ║
║    [Hero: Warm imagery +           ║  70% main area
║     open book, coffee cup]         ║  Approachable design
║                                    ║
╠════════════════════════════════════╣
║ by [Pseudonym Author]      ADVICE ║  15% bottom band
╚════════════════════════════════════╝
```

**Design notes:**
- Warm color scheme (coral accent)
- Approachable, friendly imagery
- Practical, actionable positioning
- High readability at small size

---

## File Requirements

### Deliverables
- [ ] Figma design file with master cover template
- [ ] 3 example cover designs (MCAT, Politics, Advice)
- [ ] Spine & back cover templates
- [ ] PNG exports (1000×1500px, 300 DPI)
- [ ] PDF file for print vendor (CMYK color space, bleeds included)

### Folder Structure
```
concise/brand/assets/
├── book-covers/
│   ├── template/
│   │   ├── concise-cover-template-6x9.figma
│   │   ├── concise-cover-template-5x8.figma
│   │   └── concise-cover-template-digital.figma
│   ├── examples/
│   │   ├── mcat-essentials-cover.png
│   │   ├── mcat-essentials-cover.pdf
│   │   ├── trump-book-cover.png
│   │   ├── trump-book-cover.pdf
│   │   ├── advice-cover.png
│   │   └── advice-cover.pdf
│   └── backcovers/
│       ├── back-cover-template.figma
│       └── [backs for each example]
```

---

## Design Checklist

- [ ] Top band color correct for category
- [ ] "CONCISE" wordmark positioned correctly (0.5" from top)
- [ ] Accent underline matches category color
- [ ] Title is bold, high-impact, reads well at thumbnail size
- [ ] Main content area uses category imagery/color scheme
- [ ] Bottom band has author name + category
- [ ] Text contrast passes WCAG AA standard (4.5:1 minimum)
- [ ] No clipping or text overflow at bleed edges
- [ ] Spine text is readable (if applicable)
- [ ] PDF color space is CMYK (for print)
- [ ] All fonts are embedded or outlined in PDF

---

## Notes for Designer

1. **Pseudonym privacy:** Never add real founder name or credentials
2. **Trump book sensitivity:** Keep visual treatment abstract/typographic, avoid inflammatory imagery
3. **Print quality:** If ordering physical samples, work with local printer to proof colors before mass production
4. **Digital consistency:** Ensure covers look good as thumbnails (Kindle, Apple Books, website)
5. **Future expansion:** Design should scale to 10+ additional titles without excessive redesign

---

**Created:** 2026-05-03 — Brand & Design (CON-3 execution)

**Designer assigned:** [Pending — Brand/Design agent to implement]

**Template locked:** Yes. Any changes require founder approval.
