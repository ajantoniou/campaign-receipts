# CON-26-child-cto-swap-hero — CTO Child Issue

**Parent Issue:** CON-26 SEALED hero image — generate + swap into landing page
**Child Issue Type:** CTO — Implementation
**Priority:** High (blocks CON-20 landing page launch)
**Status:** Ready to implement (awaiting founder image selection from CON-26)
**Estimated Effort:** 1 hour
**Created:** 2026-05-03
**Created By:** Brand & Design agent

---

## Objective

Replace the placeholder gradient background in the SEALED landing page hero section with the finalized hero image asset. This is a 1-line CSS change + mobile breakpoint addition.

---

## Acceptance Criteria

- [x] Founder has selected Option A (Sealed Envelope) OR Option B (Rally Silhouettes)
- [ ] Hero image file copied/verified in place at `app/sealed/public/hero/`
- [ ] `page.tsx:23` updated with image URL (replacing gradient)
- [ ] Mobile breakpoint added for responsive crop
- [ ] Hero renders correctly on desktop (1920×1080 viewport)
- [ ] Hero renders correctly on mobile (375×667 viewport)
- [ ] Text overlay remains legible over image
- [ ] No console errors or warnings
- [ ] Changes committed to git
- [ ] Landing page deployed to staging/production

---

## Technical Specification

**File to modify:** `companies/concise/app/sealed/page.tsx`

**Current state (line 20-28):**
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

**New state (after swap):**
```tsx
{/* Hero Section */}
<section className="relative w-full h-screen flex items-center justify-center overflow-hidden">
  {/* Hero background image — desktop */}
  <div
    className="absolute inset-0 bg-cover bg-center hidden md:block"
    style={{
      backgroundImage: `url('/hero/hero-sealed-envelope-1920x1080.webp')`
    }}
  />

  {/* Hero background image — mobile */}
  <div
    className="absolute inset-0 bg-cover bg-center md:hidden"
    style={{
      backgroundImage: `url('/hero/hero-sealed-envelope-750x1000.webp')`
    }}
  />

  {/* Subtle document texture overlay */}
  <div className="absolute inset-0 opacity-5" style={{
    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,.03) 2px, rgba(255,255,255,.03) 4px)'
  }} />
```

**Selection confirmed by CEO (2026-05-03 16:12):**
- ✅ **Option A selected:** `sealed-envelope` (code example above already updated)

---

## Image Assets Available

**Option A: Sealed Envelope**
- Desktop: `companies/concise/app/sealed/public/hero/hero-sealed-envelope-1920x1080.webp` (9.4 KB)
- Mobile: `companies/concise/app/sealed/public/hero/hero-sealed-envelope-750x1000.webp` (3.2 KB)
- MD5 (Desktop): `9ce09a8ab389cde91bec4a71da3079f7`

**Option B: Rally Silhouettes**
- Desktop: `companies/concise/app/sealed/public/hero/hero-rally-silhouettes-1920x1080.webp` (65.0 KB)
- Mobile: `companies/concise/app/sealed/public/hero/hero-rally-silhouettes-750x1000.webp` (24.6 KB)
- MD5 (Desktop): `b5269cea33356a4cad90b3535dbaeb3a`

All images are verified:
- ✅ Faceless (no Trump, no founder, no real people)
- ✅ No anti-Semitic framing
- ✅ Platform-safe (Stripe/Lemon Squeezy)
- ✅ Web-optimized (WebP, target file sizes met)

See `HERO_MANIFEST.md` for full specifications.

---

## Implementation Checklist

### Step 1: Verify Image Selection ✅
- [x] **CEO selected Option A (Sealed Envelope)** — 2026-05-03 16:12
- [x] Image files exist at `app/sealed/public/hero/hero-sealed-envelope-*.webp`
- [x] File sizes verified: 9.4 KB (desktop), 3.2 KB (mobile)

### Step 2: Update page.tsx
- [ ] Remove gradient placeholder at line 23
- [ ] Add desktop background image div with `hidden md:block` class
- [ ] Add mobile background image div with `md:hidden` class
- [ ] Verify image URLs point to correct files

### Step 3: Test Desktop Rendering
- [ ] Open in browser at 1920×1080 viewport
- [ ] Verify hero image fills entire section
- [ ] Verify "SEALED" title and text are legible over image
- [ ] Verify document texture overlay is visible
- [ ] Check Network tab for image load (no errors)
- [ ] Check Console for warnings/errors

### Step 4: Test Mobile Rendering
- [ ] Open in browser at 375×667 viewport (mobile breakpoint)
- [ ] Verify mobile crop image displays correctly
- [ ] Verify "SEALED" title and text remain legible
- [ ] Verify no horizontal scrolling
- [ ] Check image loads with correct file (750x1000 version)

### Step 5: Cross-browser Verification
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile Safari (if available)

### Step 6: Commit & Deploy
- [ ] Git add `page.tsx`
- [ ] Commit with message: "CON-26-child: Swap hero gradient with [option] image"
- [ ] Push to main/staging
- [ ] Deploy to production environment
- [ ] Verify landing page live

---

## Deployment Path

**Landing page URL:** `https://sealed.concise.enterprises` (or `sealedbook.com` if domain selected)

**Expected result:**
- Hero section displays actual image (not gradient)
- Mobile users see optimized crop
- Desktop users see full 1920×1080 image
- Text overlay readable on both
- No performance issues (images <65 KB)

---

## Selection Confirmed ✅

**CEO Decision (2026-05-03 16:12):** Option A (Sealed Envelope)

**Selected Asset:**
- Desktop: `hero-sealed-envelope-1920x1080.webp` (9.4 KB)
- Mobile: `hero-sealed-envelope-750x1000.webp` (3.2 KB)

**CEO Reasoning:**
- Brand-title alignment: SEALED ↔ sealed envelope is the exact metaphor
- Archival aesthetic consistency with CON-20 "historical archive" positioning
- Maximum safety: zero human figures (vs Option B with crowd silhouettes)
- Performance: 10x smaller file size (9.4 KB vs 65 KB)
- On-message: sealed envelope communicates "secret before being bought by lobbies"

**Status:** ✅ UNBLOCKED — Ready for CTO implementation immediately

**Next:** CTO can proceed with hero swap using the Option A assets

---

## Unblocks

**Unblocks:** CON-20 (SEALED landing page closure)
- Once hero swap complete, CON-20 is ready for final validation + launch

---

## Reference Documents

- **Parent issue analysis:** `brand/CON-26-hero-analysis.md`
- **Founder decision:** `brand/CON-26-FOUNDER-APPROVAL.md`
- **Image manifest:** `app/sealed/public/hero/HERO_MANIFEST.md`
- **Full CTO spec:** `brand/CON-26-child-cto-hero-swap-spec.md`

---

## Timeline

```
CEO Decision:         ✅ COMPLETE (2026-05-03 16:12)
                      Option A (Sealed Envelope) selected

CTO implementation:   NOW (unblocked, ready to claim)
                      1 hour effort (straightforward swap)
                      Image files: hero-sealed-envelope-{1920x1080,750x1000}.webp

Deployment:          Immediately after testing passes
                      Landing page live
                      Revenue path unblocked ✅
```

---

## Questions / Clarifications

**Q: What if the image doesn't display?**
A: Check:
1. File exists at correct path
2. URL in CSS is correct (no typos)
3. Public folder is served correctly
4. WebP format is supported (99.5% browsers support it)
5. Network tab shows successful image load

**Q: What if text isn't legible over the image?**
A: The document texture overlay + semi-transparent hero content box (lines 32-38) provide contrast. If additional opacity is needed, increase the `opacity-5` class to `opacity-10` or higher.

**Q: Can I test both images before choosing?**
A: Yes. Request founder to approve both and swap them sequentially to compare. Each swap is a 1-line change.

---

## Ready to Proceed?

This issue is **ready to implement** once founder selects image option from CON-26.

**Next action:** Founder replies to CON-26 with "Option A" or "Option B" → CTO updates this issue with selection → CTO implements immediately

---

**Created by:** Brand & Design agent (CON-26)
**Date:** 2026-05-03
**Status:** 🔴 BLOCKED on founder image selection (CON-26)
