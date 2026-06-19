# Concise Website — Mockup & Component Specifications

**Status:** DESIGN SPECIFICATIONS (ready for Figma mockup + development)

**Primary use case:** Direct-sale landing page + product catalog

**Target audience:** Pre-med students (MCAT), political readers, lifelong learners

---

## Site Structure

```
Concise Website
├── Header (sticky)
├── Hero Section
├── Featured Products Grid
├── Category Filters
├── Footer
└── Product Detail (individual pages, not in scope)
```

---

## Header Component

### Layout
```
┌─────────────────────────────────────────────────┐
│ [CONCISE logo] | Shop | About | Contact | [🔍]  │  ← Sticky header
└─────────────────────────────────────────────────┘
```

### Specifications

**Height:** 80px (desktop), 64px (mobile)

**Elements (left to right):**
1. **Logo (CONCISE wordmark)**
   - File: `logo-concise-primary-navy.svg`
   - Size: 48px height (scales with header)
   - Alignment: Left, 24px padding from edge
   - Interactive: Click → home page

2. **Navigation menu (horizontal)**
   - Menu items: Shop | About | Contact
   - Font: Inter Regular, 14pt
   - Color: Navy (#1a2a4d)
   - Spacing: 40px between items
   - Hover state: Color change to cyan (#00d9ff) or underline
   - Active state: Cyan underline (3px)
   - Mobile: Hamburger menu (three lines)

3. **Search icon (optional)**
   - Icon: Magnifying glass (24px)
   - Color: Navy
   - Position: Right side, 24px padding
   - Hover: Cyan color
   - Interactive: Opens search modal/bar

**Background:**
- Color: White (#ffffff)
- Border bottom: 1px solid light gray (#f5f5f5)
- Shadow: Optional subtle drop shadow (0px 2px 8px rgba(0,0,0,0.05))

**Responsive behavior:**
- Desktop: Full horizontal navigation
- Tablet (768px): Hamburger menu
- Mobile (375px): Hamburger menu, single logo, no search icon (move to mobile search)

---

## Hero Section

### Layout
```
┌──────────────────────────────────────────┐
│                                          │
│   HERO IMAGE OR GRADIENT BACKGROUND     │
│                                          │
│          Concise curates and             │
│       elevates the best educational     │
│        books — written by experts,       │
│       designed for direct readers.       │
│                                          │
│            [ Browse Books ]              │  ← CTA button
│                                          │
└──────────────────────────────────────────┘
```

### Specifications

**Height:** 500px (desktop), 350px (mobile)

**Background:**
- Option 1: Navy gradient (#1a2a4d → lighter shade)
- Option 2: Navy solid + abstract geometric pattern (cyan accents)
- Option 3: Hero image (book stack, workspace, learning environment)
- Note: Keep it clean, no photo clutter

**Text overlay (centered):**
- **Tagline:** "Concise curates and elevates the best educational books — written by experts, designed for direct readers."
  - Font: Inter Regular
  - Size: 18pt (desktop), 14pt (mobile)
  - Color: White (#ffffff)
  - Line height: 1.4
  - Max width: 600px
  - Text alignment: Center

**CTA Button:**
- Text: "Browse Books" or "Explore Catalog"
- Button style:
  - Background: Navy (#1a2a4d)
  - Text: White (#ffffff)
  - Border: 2px solid cyan (#00d9ff)
  - Padding: 16px 32px
  - Border radius: 4px (square-ish, modern)
  - Font: Inter Bold, 14pt
  - Hover state: Background cyan, text navy (inverted colors)
  - Active state: Slight inset shadow

**Position:**
- Centered, 24px below tagline
- Interactive: Links to product grid or filters

---

## Featured Products Grid

### Layout (Desktop)
```
┌────────────────────────────────────────────────┐
│ FEATURED BOOKS                                 │
├────────────────────────────────────────────────┤
│                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │          │  │          │  │          │   │
│  │ [Cover]  │  │ [Cover]  │  │ [Cover]  │   │
│  │          │  │          │  │          │   │
│  │ Title... │  │ Title... │  │ Title... │   │
│  │ $19.99   │  │ $19.99   │  │ $19.99   │   │
│  │[Add Cart]│  │[Add Cart]│  │[Add Cart]│   │
│  └──────────┘  └──────────┘  └──────────┘   │
│                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ [Cover]  │  │ [Cover]  │  │ [Cover]  │   │
│  │ ...      │  │ ...      │  │ ...      │   │
│  └──────────┘  └──────────┘  └──────────┘   │
│                                                │
│                 [ View All ]                  │
└────────────────────────────────────────────────┘
```

### Specifications

**Section width:** Full width with 40px padding (desktop), 20px (mobile)

**Grid layout:**
- Desktop: 3 columns
- Tablet: 2 columns
- Mobile: 1 column
- Gutter: 24px

**Product Card Component:**
- **Dimensions:** 200px × 300px (desktop)
- **Elements (top to bottom):**

  1. **Book cover image**
     - Size: 200px × 280px (6×9 aspect ratio)
     - Border: Optional subtle shadow or border (1px light gray)
     - Hover effect: Slight zoom (scale 1.05) + shadow deepens

  2. **Product info (below image)**
     - Title: Inter Bold, 14pt, navy, max 2 lines, ellipsis if overflow
     - Category: Inter Light, 10pt, navy, secondary color
     - Price: Inter Bold, 16pt, navy
     - Position: 12px padding below image

  3. **Add to Cart button**
     - Style: Navy background, white text, cyan border (2px)
     - Text: "Add to Cart" or "$19.99 — Buy Now"
     - Padding: 8px 16px
     - Font: Inter Bold, 12pt
     - Border radius: 3px
     - Hover: Cyan background, navy text
     - Position: Bottom of card

**Card spacing:**
- Padding around cards: 12px
- Gutter between cards: 24px

**Hover states:**
- Card lifts slightly (0px → 8px shadow)
- Image zooms 5%
- Button changes color (cyan background)

---

## Category Filters (Sidebar or Top Bar)

### Layout
```
FILTER BY CATEGORY:
[✓ All] [MCAT] [Politics] [Advice] [Science]
```

### Specifications

**Position:**
- Desktop: Above product grid, left-aligned
- Mobile: Dropdown selector (collapsible)

**Filter buttons:**
- All (default, selected)
- MCAT / Education (cyan underline)
- Politics / Analysis (gold underline)
- Advice / Self-Help (coral underline)
- Science / Reference (purple underline)

**Styling:**
- Font: Inter Regular, 12pt
- Color: Navy text, white background
- Selected state: Navy background, white text, colored bottom border (3px, category color)
- Hover: Light gray background
- Spacing: 12px between buttons

**Functionality:**
- Click to filter products
- Multiple selection (optional, or radio-button single-select)
- Reset button (optional)

---

## Footer

### Layout
```
┌─────────────────────────────────────────┐
│ [CONCISE logo]                          │
│                                         │
│ SHOP         ABOUT        CONTACT       │
│ - MCAT       - Team       - Email       │
│ - Politics   - Mission    - Support     │
│ - Advice     - Brand      - FAQ         │
│ - All Books                             │
│                                         │
│ FOLLOW US: [f] [𝕏] [📷]                 │
│                                         │
│ © 2026 Concise. All rights reserved.   │
│ Privacy Policy | Terms of Service      │
│                                         │
└─────────────────────────────────────────┘
```

### Specifications

**Background:** Navy (#1a2a4d)

**Text color:** White (#ffffff)

**Content sections (columns):**

1. **Logo/Brand**
   - CONCISE wordmark (white version)
   - Size: 48px
   - Position: Top-left
   - Optional: "Curated books for direct readers" tagline (14pt, gray)

2. **Shop (column)**
   - Links: MCAT, Politics, Advice, All Books
   - Font: Inter Regular, 12pt
   - Link hover: Cyan color (#00d9ff)

3. **About (column)**
   - Links: Team, Mission, Brand, FAQ
   - Font: Inter Regular, 12pt
   - Link hover: Cyan color

4. **Contact (column)**
   - Links: Email, Support, FAQ, Feedback
   - Email: support@concisereads.com
   - Font: Inter Regular, 12pt
   - Link hover: Cyan color

5. **Social Media**
   - Icons: Facebook, Twitter/X, Instagram
   - Size: 24px
   - Color: White (hover → cyan)
   - Spacing: 12px between icons
   - Position: Top-right or bottom

6. **Legal/Copyright**
   - Text: © 2026 Concise. All rights reserved.
   - Font: Inter Light, 10pt
   - Color: Light gray (#d0d0d0)
   - Links: Privacy Policy, Terms of Service (hover → cyan)

**Responsive:**
- Desktop: 4-5 columns
- Mobile: Stacked sections, full width
- Spacing: 40px padding (desktop), 20px (mobile)

---

## Component Library (Figma)

Create reusable components for development:

```
📦 Buttons
├── 🔘 Primary CTA (Navy bg, cyan border)
├── 🔘 Secondary (White bg, navy text)
└── 🔘 Ghost (No background, navy text, hover underline)

📦 Product Card
├── 🔲 Standard (3 column layout)
├── 🔲 Featured (larger, with description)
└── 🔲 Small (thumbnail, compact)

📦 Filter Buttons
├── 🔘 Category Filter
└── 🔘 Selected State

📦 Typography
├── 🔤 H1 (Hero headline)
├── 🔤 H2 (Section title)
├── 🔤 H3 (Product title)
└── 🔤 Body (Regular text)

📦 Colors
├── 🎨 Navy swatch
├── 🎨 Cyan swatch
├── 🎨 Category accents
└── 🎨 Neutral grays

📦 Input Fields
├── 🔍 Search bar
├── 📧 Email input (for newsletter signup)
└── ☑️ Checkbox
```

---

## Design System Documentation

**Font stack:**
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
             Helvetica, Arial, sans-serif;
```

**Color variables:**
```css
--color-navy: #1a2a4d;
--color-cyan: #00d9ff;
--color-white: #ffffff;
--color-light-gray: #f5f5f5;
--color-category-mcat: #00d9ff;
--color-category-politics: #d4af37;
--color-category-advice: #ff6b6b;
--color-category-science: #6c5ce7;
```

**Spacing scale (8px base):**
```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-2xl: 40px;
```

**Border radius:**
```css
--radius-sm: 2px;
--radius-md: 4px;
--radius-lg: 8px;
```

**Shadows:**
```css
--shadow-sm: 0 2px 4px rgba(0,0,0,0.05);
--shadow-md: 0 4px 8px rgba(0,0,0,0.08);
--shadow-lg: 0 8px 16px rgba(0,0,0,0.12);
```

---

## Mockup Deliverables

1. **Desktop mockup** (1440px wide)
   - Header + Hero + Product grid + Footer
   - Showing all major sections

2. **Mobile mockup** (375px wide)
   - Responsive layout
   - Hamburger menu open state
   - Stacked product grid (1 column)

3. **Component variations**
   - Button states (default, hover, active)
   - Product card states (default, hover)
   - Filter button states (unselected, selected, hover)

4. **Interactive prototype** (Figma)
   - Links between pages (if applicable)
   - Hover states animated
   - Category filter interaction

---

## Content Placeholder (To Be Updated)

**Hero tagline:** "Concise curates and elevates the best educational books — written by experts, designed for direct readers."

**Featured products (examples):**
1. MCAT Essentials — $19.99
2. Trump Before AIPAC Money — $24.99
3. How to Study Better — $16.99

**Navigation links (example structure):**
- Shop: MCAT, Politics, Advice, All Books
- About: Team, Mission, Brand, FAQ
- Contact: Support email, feedback form

---

## Developer Handoff Notes

When handing off to development:
- [ ] Export Figma components as React/Vue components if applicable
- [ ] Provide CSS variables and design tokens JSON
- [ ] Document all interactive states (hover, active, focus)
- [ ] Ensure accessibility: alt text for images, ARIA labels, keyboard nav
- [ ] Test responsive breakpoints: 375px, 768px, 1024px, 1440px
- [ ] Verify color contrast ratios (WCAG AA minimum)
- [ ] Set up form validation for email signup
- [ ] Optimize images: 72 DPI web, responsive srcset for product covers
- [ ] Configure product links to detail pages / cart integration

---

**Created:** 2026-05-03 — Brand & Design (CON-3 execution)

**Status:** DESIGN SPECIFICATIONS LOCKED (ready for Figma mockup + development)

**Next step:** Create Figma mockup based on these specs
