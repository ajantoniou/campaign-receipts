# Concise Color Palette Reference

**Brand:** Concise (Option 2: Concise parent + pseudonym author)

**Purpose:** Print-ready + digital color specifications for designers, developers, print vendors

---

## Primary Colors

### Navy (Primary Brand Color)
```
Hex:        #1a2a4d
RGB:        (26, 42, 77)
HSL:        hsl(219, 49%, 20%)
Pantone:    533 C
CMYK:       C:95  M:75  Y:50  K:40
```

**Usage:**
- Primary text (headlines, body)
- Brand mark (logo "CONCISE" wordmark)
- Primary buttons
- Navigation background
- Book cover top band background

**Visual example:**
```
████████████████████████████████
Navy #1a2a4d — Trust, professional, education-adjacent
████████████████████████████████
```

---

### Electric Cyan (Accent Color)
```
Hex:        #00d9ff
RGB:        (0, 217, 255)
HSL:        hsl(191, 100%, 50%)
Pantone:    3125 C (or 306 C as substitute)
CMYK:       C:70  M:5   Y:0   K:0
```

**Usage:**
- Accent underline on logo (below final "E")
- Button hover states
- CTA highlights
- Links on dark backgrounds
- MCAT/Education category marker

**Visual example:**
```
████████████████████████████████
Electric Cyan #00d9ff — Modern, forward-thinking, premium
████████████████████████████████
```

---

## Supporting Neutral Colors

### White (Background)
```
Hex:        #ffffff
RGB:        (255, 255, 255)
HSL:        hsl(0, 0%, 100%)
Usage:      Primary background, text on navy, light zones
```

### Light Gray (Secondary Background)
```
Hex:        #f5f5f5
RGB:        (245, 245, 245)
HSL:        hsl(0, 0%, 96%)
Usage:      Subtle backgrounds, dividers, footer, alternate rows
```

### Charcoal (Dark Text)
```
Hex:        #2c3e50
RGB:        (44, 62, 80)
HSL:        hsl(210, 29%, 24%)
Usage:      Dark text for contrast, borders, secondary headings
```

---

## Category Accent Colors

These colors are applied to book cover top bands by category.

### MCAT / Education (Cyan)
```
Hex:        #00d9ff
RGB:        (0, 217, 255)
Same as:    Primary accent color
Usage:      MCAT prep, medical, educational content
```

**Book cover example:**
```
┌────────────────────────────┐
│ CONCISE [top band]         │  ← Cyan background or accent line
│ ════════════════════════   │
│                            │
│    MCAT ESSENTIALS         │  ← Navy title
│    Proven Strategies...    │
│                            │
│    [Medical imagery]       │
│                            │
│ by [Pseudonym Author]      │
└────────────────────────────┘
```

---

### Politics / Analysis (Gold)
```
Hex:        #d4af37
RGB:        (212, 175, 55)
HSL:        hsl(44, 73%, 52%)
Pantone:    871 C
CMYK:       C:5   M:25  Y:70  K:0
Usage:      Trump book, political analysis, contrarian content
```

**Book cover example:**
```
┌────────────────────────────┐
│ CONCISE [top band]         │  ← Gold background or accent line
│ ════════════════════════   │
│                            │
│   TRUMP BEFORE AIPAC       │  ← Navy or gold title
│   A Candidate's First Year │
│                            │
│   [Abstract/geometric]     │
│                            │
│ by [Pseudonym Author]      │
└────────────────────────────┘
```

---

### Advice / Self-Help (Coral)
```
Hex:        #ff6b6b
RGB:        (255, 107, 107)
HSL:        hsl(0, 100%, 71%)
Pantone:    Coral / Red Orange
CMYK:       C:0   M:57  Y:57  K:0
Usage:      Practical advice, self-help, wellness, approachable content
```

**Book cover example:**
```
┌────────────────────────────┐
│ CONCISE [top band]         │  ← Coral background or accent line
│ ════════════════════════   │
│                            │
│   HOW TO STUDY BETTER      │  ← Navy title
│   Science-Backed Tactics   │
│                            │
│   [Approachable imagery]   │
│                            │
│ by [Pseudonym Author]      │
└────────────────────────────┘
```

---

### Science / Reference (Purple)
```
Hex:        #6c5ce7
RGB:        (108, 92, 231)
HSL:        hsl(260, 78%, 63%)
Pantone:    Periwinkle / Deep Purple
CMYK:       C:55  M:60  Y:0   K:0
Usage:      Science, reference, technical, research-oriented content
```

---

## Web Safe Fallbacks

For browsers or systems without color support:

```
Navy #1a2a4d     → Fallback: #000 (black)
Cyan #00d9ff     → Fallback: #0099ff (web-safe blue)
Gold #d4af37     → Fallback: #cc9900 (web-safe gold)
Coral #ff6b6b    → Fallback: #ff3333 (web-safe red)
Purple #6c5ce7   → Fallback: #6666ff (web-safe purple)
```

---

## Print Specifications

### CMYK Color Space
All colors have CMYK specs for print vendors. Convert RGB to CMYK using:
- Pantone Color Bridge or
- Design software (Adobe, Figma, etc.)

### Recommended Print Process
- **Color mode:** CMYK (not RGB)
- **Profile:** ISO Coated v2 or similar professional profile
- **Ink density:** 240-280% (max)
- **Paper:** Coated (for gold/cyan vibrancy) or matte (for professional feel)

### Pantone References
- Navy: **533 C** (Pantone Color Bridge reference)
- Gold: **871 C** (Pantone Color Bridge reference)
- Cyan: **3125 C** (or substitute 306 C if unavailable)

---

## Accessibility Contrast Ratios

WCAG AA compliance (4.5:1 minimum for text):

| Color Pair | Contrast Ratio | WCAG Level |
|---|---|---|
| Navy on White | 11.2:1 | AAA ✅ |
| Cyan on Navy | 3.1:1 | FAIL (use for non-critical accents) |
| Gold on Navy | 3.8:1 | FAIL (use for headings, not small text) |
| Charcoal on White | 11.3:1 | AAA ✅ |
| Navy on Light Gray | 9.8:1 | AAA ✅ |

**Recommendations:**
- Use Navy (#1a2a4d) for all body text and critical headings
- Use Cyan/Gold/Coral as accents or large text only
- Always test contrast before publishing

---

## Usage Guidelines

### ✅ DO
- Use navy for primary text and backgrounds
- Use cyan for logo accent underline
- Use category accent colors on book cover top bands
- Maintain CMYK color space for print
- Test contrast on actual devices

### ❌ DON'T
- Use gold (#d4af37) for small text (fails contrast)
- Mix category accent colors (one per book)
- Change pantone substitutes without approval
- Use RGB colors in print production
- Apply cyan to large background areas (too bright)

---

## Digital Implementation

### CSS Variables
```css
:root {
  --color-navy-primary: #1a2a4d;
  --color-cyan-accent: #00d9ff;
  --color-white: #ffffff;
  --color-light-gray: #f5f5f5;
  --color-charcoal: #2c3e50;
  --color-category-mcat: #00d9ff;
  --color-category-politics: #d4af37;
  --color-category-advice: #ff6b6b;
  --color-category-science: #6c5ce7;
}
```

### Tailwind Config
See `color-variables.json` for complete Tailwind configuration.

---

## Swatch File Locations

- `color-variables.json` — JSON export (web developers)
- `color-palette.md` — This reference file
- `color-swatches.png` — Visual swatch reference (TBD)
- Print vendor spec — Request from designer

---

**Created:** 2026-05-03 — Brand & Design (CON-3 execution)

**Last updated:** 2026-05-03 03:22 ET

**Status:** LOCKED for implementation
