# Concise Book Cover — Figma Master Template

**Status:** PRODUCTION READY (locked specifications)

**Purpose:** Master component library for all Concise book covers

**Figma file:** `concise-book-cover-system.figma` (source)

---

## Master Components Structure

All components inherit from locked base specifications.

### Component Hierarchy

```
📦 Book Cover System
├── 📦 Formats
│   ├── 🔲 Paperback 6x9
│   │   ├── Frame: 6" × 9" (1800px × 2700px @ 300 DPI)
│   │   ├── Bleed: 0.125" all sides (0.375" / 11.25px @ 300 DPI)
│   │   ├── Safe margin: 0.25" (75px @ 300 DPI)
│   │   └── Spine width: variable per book (0.25"–0.5")
│   ├── 🔲 Hardcover 5x8
│   │   ├── Frame: 5" × 8" (1500px × 2400px @ 300 DPI)
│   │   ├── Bleed: 0.125" all sides
│   │   ├── Safe margin: 0.5" (150px @ 300 DPI)
│   │   ├── Dust jacket wrap
│   │   └── Flap overlay
│   └── 🔲 Digital 1:1.5
│       ├── Frame: 1000px × 1500px (72 DPI)
│       ├── Aspect ratio: locked 1:1.5
│       ├── Safe margin: 5%
│       └── Output: Web, Kindle, Apple Books
├── 📦 Bands
│   ├── 🔲 Top Band (15% height)
│   │   ├── Background color: category-specific
│   │   ├── "CONCISE" wordmark (Inter Bold, centered)
│   │   ├── Accent underline (category color, 3px)
│   │   └── Optional icon/pattern (right side)
│   ├── 🔲 Main Content Area (70% height)
│   │   ├── Image placeholder (category-based)
│   │   ├── Title text layout (centered or left-aligned)
│   │   ├── Subtitle text layout (optional)
│   │   └── Visual hierarchy guides
│   └── 🔲 Bottom Band (15% height)
│       ├── Background: white or light gray
│       ├── Author name: "by [Pseudonym]" (left)
│       ├── Category label: right-aligned (optional)
│       └── Spine text: centered (print only)
├── 📦 Typography
│   ├── 🔤 Title / H1
│   │   ├── Font: Brandon Grotesque Bold or Futura Bold
│   │   ├── Size: 1.5"–2.5" (adjust per text length)
│   │   ├── Color: Navy or white (contrast-dependent)
│   │   ├── Line height: 1.2
│   │   └── Letter spacing: normal
│   ├── 🔤 Subtitle / H2
│   │   ├── Font: Inter Regular
│   │   ├── Size: 0.5"–0.75"
│   │   ├── Color: Navy or category accent
│   │   ├── Line height: 1.3
│   │   └── Weight: Regular (400)
│   ├── 🔤 Author / Body
│   │   ├── Font: Inter Regular
│   │   ├── Size: 12pt (0.25")
│   │   ├── Color: Navy
│   │   └── Weight: Regular (400)
│   └── 🔤 "CONCISE" Brand Mark
│       ├── Font: Inter Bold (locked, per logo spec)
│       ├── Size: 0.5" (standard)
│       ├── Color: Navy
│       ├── Letter spacing: -0.02em
│       └── Locked component (never edit)
├── 📦 Colors
│   ├── 🎨 Category: MCAT / Education
│   │   ├── Top band: Navy or light accent
│   │   ├── Accent: Cyan (#00d9ff)
│   │   └── Text: Navy on white
│   ├── 🎨 Category: Politics / Analysis
│   │   ├── Top band: Navy
│   │   ├── Accent: Gold (#d4af37)
│   │   └── Text: Navy or white (contrast-dependent)
│   ├── 🎨 Category: Advice / Self-Help
│   │   ├── Top band: Navy
│   │   ├── Accent: Coral (#ff6b6b)
│   │   └── Text: Navy on white
│   └── 🎨 Category: Science / Reference
│       ├── Top band: Navy
│       ├── Accent: Purple (#6c5ce7)
│       └── Text: Navy on white
└── 📦 Guides & Grids
    ├── 📐 8px baseline grid (web)
    ├── 📐 4px baseline grid (print @ 300 DPI)
    ├── 📐 Bleed guides (red outlines)
    ├── 📐 Safe margin guides (blue outlines)
    └── 📐 Text baseline guides
```

---

## Component Specifications (Master)

### Top Band Component

**Figma element:** `TopBand-[Category]`

**Properties:**
- Height: 15% of total frame height
- Background: Category accent color (with navy fallback)
- Children:
  - `WordmarkConcise` (locked component, 0.5" width)
  - `AccentUnderline` (3px stroke, category color)
  - `OptionalIcon` (right side, decorative)

**Text inside:**
- Position: 0.5" from top, left-aligned
- Font: Inter Bold
- Size: 0.5" (48pt)
- Color: Navy (#1a2a4d)
- Letter spacing: -0.02em

**Constraints:**
- Width: stretch (full frame width)
- Height: fixed (lock at 15% calculation)
- Padding: 0.25" all sides (safe margin)

---

### Main Content Area Component

**Figma element:** `MainContent-[Style]`

**Properties:**
- Height: 70% of total frame height
- Background: White or book-specific color
- Children:
  - Image placeholder (70% of area)
  - Title text frame
  - Subtitle text frame
  - Visual hierarchy guides

**Text layout options:**
1. **Centered (standard):** Title centered vertically + horizontally
2. **Left-aligned (variant):** Title left-aligned, 0.75" from edge
3. **Overlay (variant):** Title overlaid on image, white text, semi-transparent background

**Image placeholder:**
- Aspect ratio: flexible (image fills area)
- Mask: rounded corners (optional, 8px recommended)
- Overlay: optional semi-transparent dark layer (for text readability)

**Constraints:**
- Width: stretch
- Height: fixed (lock at 70% calculation)
- Padding: 0.5" all sides (safe margin inside this area)

---

### Bottom Band Component

**Figma element:** `BottomBand`

**Properties:**
- Height: 15% of total frame height
- Background: White (#ffffff) or light gray (#f5f5f5)
- Children:
  - Author text (left-aligned)
  - Category label (right-aligned, optional)
  - Spine text (centered, print only)

**Text specifications:**
- Author: "by [Pseudonym]"
  - Font: Inter Regular
  - Size: 12pt
  - Color: Navy (#1a2a4d)
  - Position: 0.5" from left, 0.5" from bottom
- Category (optional):
  - Font: Inter Light
  - Size: 10pt
  - Color: Navy
  - Position: 0.5" from right, 0.5" from bottom
- Spine (print only):
  - Font: Inter Regular
  - Size: 8pt
  - Color: Navy
  - Orientation: vertical (rotated 90°)
  - Position: centered on spine edge

**Constraints:**
- Width: stretch
- Height: fixed (lock at 15% calculation)
- Padding: 0.25" all sides

---

## Master Component Usage

### Creating a New Cover (Copy + Modify)

1. **Duplicate master frame:**
   - Right-click `Paperback 6x9` → "Duplicate"
   - Rename: `[BookTitle]-[Category]-Cover`

2. **Update top band:**
   - Select `TopBand-[Category]`
   - Change background color to category accent
   - Update "CONCISE" wordmark color (usually navy)
   - Update accent underline color (category-specific)

3. **Update main content:**
   - Replace image placeholder with book art
   - Update title text (Brandon Grotesque Bold)
   - Update subtitle (Inter Regular, optional)
   - Adjust title position based on image contrast

4. **Update bottom band:**
   - Set author name: "by [Pseudonym Author Name]"
   - Set category label (right side, optional)
   - Set spine text if printing

5. **Export:**
   - PNG (1000×1500px, web version)
   - PDF (CMYK, with bleeds for print)

### Quick Variant Creation

Use **Figma component variants** (requires Figma 2023+):

```
TopBand
├── Category=MCAT (cyan accent)
├── Category=Politics (gold accent)
├── Category=Advice (coral accent)
└── Category=Science (purple accent)

MainContent
├── Style=Centered
├── Style=LeftAligned
└── Style=Overlay

BottomBand
├── Layout=StandardLeft
└── Layout=RightAlignedCategory
```

---

## Typography Master Components

### Heading Component (Title)

**Figma element:** `Typography-Heading-Title`

**Properties:**
- Font family: Brandon Grotesque Bold (or Futura Bold substitute)
- Font size: variable (1.5"–2.5" depending on text length)
- Weight: 700 (Bold)
- Color: Navy or white (managed by variant)
- Letter spacing: 0 (normal)
- Line height: 1.2

**Variants:**
- `Color=Navy` (default)
- `Color=White` (for dark backgrounds)
- `Size=Small` (1.5")
- `Size=Medium` (2")
- `Size=Large` (2.5")

---

### Body Component (Subtitle)

**Figma element:** `Typography-Body-Subtitle`

**Properties:**
- Font family: Inter Regular
- Font size: 12pt–18pt (0.5"–0.75")
- Weight: 400 (Regular)
- Color: Navy
- Line height: 1.3
- Letter spacing: 0

**Variants:**
- `Size=Small` (12pt)
- `Size=Medium` (14pt)
- `Size=Large` (16pt)

---

### Author Component (Small)

**Figma element:** `Typography-Body-Author`

**Properties:**
- Font family: Inter Regular
- Font size: 12pt
- Weight: 400
- Color: Navy
- Line height: 1
- Letter spacing: 0

---

## Color Swatches Master Components

**Figma element:** `ColorSwatch-[Category]`

Create color swatch components for each category:

```
ColorSwatch-Navy
├── Background: Navy (#1a2a4d)
├── Label: "Navy #1a2a4d"
└── Text: White (for contrast)

ColorSwatch-Cyan
├── Background: Cyan (#00d9ff)
├── Label: "Cyan #00d9ff"
└── Text: Navy (for contrast)

ColorSwatch-Gold
├── Background: Gold (#d4af37)
├── Label: "Gold #d4af37"
└── Text: Navy (for contrast)

ColorSwatch-Coral
├── Background: Coral (#ff6b6b)
├── Label: "Coral #ff6b6b"
└── Text: Navy (for contrast)

ColorSwatch-Purple
├── Background: Purple (#6c5ce7)
├── Label: "Purple #6c5ce7"
└── Text: White (for contrast)
```

---

## Grid & Guides Settings

### Web (72 DPI)
- Base unit: 8px
- Baseline grid: 8px
- Column grid: 12 columns, 8px gutter

### Print (300 DPI)
- Base unit: 4px (@ 300 DPI, equivalent to 8px @ 72 DPI)
- Baseline grid: 4px
- Guides:
  - Red outlines: bleed boundaries (0.125" from edge)
  - Blue outlines: safe margin (0.25"–0.5" from edge)
  - Gray guides: column/baseline alignment

---

## Export Settings

### Web PNG
```
Format:     PNG
Resolution: 1x (1000px wide), 2x (2000px wide)
Background: Transparent
Color space: sRGB
Quality:    100%
```

### Print PDF
```
Format:     PDF
Resolution: 300 DPI minimum
Color space: CMYK
Bleeds:     Include 0.125" bleed on all sides
Fonts:      Embedded or outlined (no subset)
Quality:    Maximum
```

### Social Media (Optional)
```
Format:     PNG
Resolution: 1000px wide (square crop for Instagram)
Aspect:     1:1 (square)
Color space: sRGB
```

---

## Locked Elements (Never Edit)

- ✅ "CONCISE" wordmark (logo component)
- ✅ Color hex codes (no substitutes)
- ✅ Typography specs (font families, letter spacing)
- ✅ Margin/padding guides
- ✅ Aspect ratios (especially digital 1:1.5)

---

## Version Control

- **Template version:** 1.0
- **Last updated:** 2026-05-03
- **Created for:** Concise brand Option 2 execution
- **Compatible with:** Figma (all versions with components support)

---

## Handoff Checklist

Before sending to developer/print:
- [ ] All text is final (no "Lorem ipsum" remaining)
- [ ] Images are high-resolution (300 DPI for print, 72 DPI for web)
- [ ] Colors are verified against color-variables.json
- [ ] Bleeds are included in PDF exports
- [ ] Fonts are embedded/outlined in PDFs
- [ ] Safe margins respected (no content bleeds beyond guides)
- [ ] Contrast ratios verified (WCAG AA minimum)
- [ ] File naming follows convention: `[BookTitle]-[Category]-Cover`

---

**Created:** 2026-05-03 — Brand & Design (CON-3 execution)

**Status:** PRODUCTION READY — Master template locked
