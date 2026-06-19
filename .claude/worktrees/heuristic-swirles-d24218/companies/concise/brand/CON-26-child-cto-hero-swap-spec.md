# CTO Child Issue Specification: CON-26-child-cto-swap-hero

**Parent Issue:** CON-26 SEALED hero image — generate + swap into landing page
**Child Issue Type:** CTO — Implementation
**Priority:** High (blocks landing page launch)
**Estimated Effort:** 1 hour
**Status:** READY TO FILE (awaiting Brand/Design hero image delivery)

---

## Task: Replace Hero Gradient with Image Asset

Replace the placeholder gradient background in the SEALED landing page hero section (`app/sealed/page.tsx:23`) with the finalized hero image.

---

## Current State

**File:** `companies/concise/app/sealed/page.tsx`
**Line:** 23

```tsx
// Placeholder gradient background (to be replaced with hero image)
<div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-slate-900 to-slate-950" />
```

---

## Deliverable: Replace with Image

**Input:** Hero image file (one of two options from CON-26 Brand/Design)
- `hero-sealed-envelope-1920x1080.webp` (desktop) OR `hero-rally-silhouettes-1920x1080.webp` (desktop)
- Mobile crop: `*-750x1000.webp`

**Output:** `page.tsx:23` updated with:

```tsx
// Hero background image with responsive crops
<div
  className="absolute inset-0 bg-cover bg-center"
  style={{
    backgroundImage: `url('/hero/hero-${selectedImageName}-1920x1080.webp')`,
    // Mobile breakpoint handled below
  }}
/>

// Mobile breakpoint (add in mobile breakpoint section)
<div
  className="absolute inset-0 md:hidden bg-cover bg-center"
  style={{
    backgroundImage: `url('/hero/hero-${selectedImageName}-750x1000.webp')`,
  }}
/>
```

---

## Implementation Checklist

- [ ] **Step 1:** Confirm hero image file name from Brand/Design
  - Which option selected? (Sealed Envelope or Rally Silhouettes)
  - File path: `companies/concise/app/sealed/public/hero/<filename>`

- [ ] **Step 2:** Update `page.tsx:23`
  - Remove gradient placeholder
  - Add `bg-cover bg-center` classes
  - Add `backgroundImage` style pointing to webp file

- [ ] **Step 3:** Add mobile breakpoint
  - Add `md:hidden` class to mobile crop div
  - Mobile crop uses `750x1000.webp` variant
  - Ensure mobile readability of hero text overlay

- [ ] **Step 4:** Test hero rendering
  - Desktop: 1920×1080 viewport (image fills hero section)
  - Tablet: 1024×768 viewport (scaling test)
  - Mobile: 375×667 viewport (mobile crop renders correctly)
  - Text overlay legibility: Confirm "SEALED" title + copy readable over image

- [ ] **Step 5:** Verify image loading
  - Network tab: webp files load without errors
  - No console warnings (CORS, size, etc.)
  - Image optimization: File sizes ~350 KB (desktop), ~180 KB (mobile)

- [ ] **Step 6:** Commit + deploy
  - Commit `page.tsx` changes
  - Deploy to landing page environment (sealed.concise.enterprises or sealedbook.com)
  - Verify landing page live (check hero renders at brand.sealed.enterprises)

---

## Code Change (Exact Pattern)

**Current (lines 20-28):**
```tsx
{/* Hero Section */}
<section className="relative w-full h-screen flex items-center justify-center overflow-hidden">
  {/* Placeholder gradient background (to be replaced with hero image) */}
  <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-slate-900 to-slate-950" />

  {/* Subtle document texture overlay */}
  <div className="absolute inset-0 opacity-5" style={{
    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,.03) 2px, rgba(255,255,255,.03) 4px)'
  }} />
```

**New (after brand/design delivers image):**
```tsx
{/* Hero Section */}
<section className="relative w-full h-screen flex items-center justify-center overflow-hidden">
  {/* Hero background image — desktop */}
  <div
    className="absolute inset-0 bg-cover bg-center hidden md:block"
    style={{
      backgroundImage: `url('/hero/hero-[IMAGE_NAME]-1920x1080.webp')`
    }}
  />

  {/* Hero background image — mobile */}
  <div
    className="absolute inset-0 bg-cover bg-center md:hidden"
    style={{
      backgroundImage: `url('/hero/hero-[IMAGE_NAME]-750x1000.webp')`
    }}
  />

  {/* Subtle document texture overlay */}
  <div className="absolute inset-0 opacity-5" style={{
    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,.03) 2px, rgba(255,255,255,.03) 4px)'
  }} />
```

**Placeholder:** Replace `[IMAGE_NAME]` with either:
- `sealed-envelope` (if Sealed Envelope selected)
- `rally-silhouettes` (if Rally Silhouettes selected)

---

## Dependencies & Blockers

**Blocked By:** CON-26 (Brand/Design) — Image generation + optimization
- Status: ⏳ Waiting for hero image(s) to be generated
- Unblock Condition: Brand/Design delivers hero image to `companies/concise/app/sealed/public/hero/`

**Unblocks:** CON-20 (SEALED landing page closure)
- Once hero swap complete, CON-20 is ready for final validation + launch

---

## File References

- **Landing Page:** `companies/concise/app/sealed/page.tsx`
- **Hero Directory:** `companies/concise/app/sealed/public/hero/`
- **Hero Manifest:** `companies/concise/app/sealed/public/hero/HERO_MANIFEST.md`
- **Image Selection Analysis:** `companies/concise/brand/CON-26-hero-analysis.md`
- **Image Prompts:** `companies/concise/brand/trump-book-rename.md` (lines 234-325)

---

## Ready to File?

**YES.** This specification is complete and ready for CTO to action once Brand/Design delivers the hero image.

**Action:** File as child issue under CON-26 once Brand/Design approves image direction + generates assets.

---

Prepared by: Brand & Design agent (CON-26)
Date: 2026-05-03
