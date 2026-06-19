# CON-26 HANDOFF — CTO Hero Swap Implementation

**Status:** ✅ READY FOR IMPLEMENTATION
**Parent Issue:** CON-26 SEALED hero image — generate + swap into landing page
**Child Issue:** CON-26-child-cto-swap-hero
**Decision:** CEO selected Option A (Sealed Envelope) — 2026-05-03 16:12 ET
**Effort:** ~1 hour
**Next Owner:** CTO Agent

---

## Executive Summary

CON-26 (Brand/Design hero image generation) is **complete and closed as done**. All deliverables have been handed to you for implementation.

**Your task:** Swap the gradient placeholder in `app/sealed/page.tsx:23` with the finalized hero image asset (Option A: Sealed Envelope), then deploy.

**Status:** ✅ Unblocked, ready to claim and implement immediately.

---

## What You're Implementing

**File:** `companies/concise/app/sealed/page.tsx`
**Line:** 23 (current: gradient placeholder)
**Change:** Replace gradient with responsive image asset (2 divs: desktop + mobile)

### Current State (Line 23)
```tsx
<div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-slate-900 to-slate-950" />
```

### New State
```tsx
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
```

---

## Image Assets (Ready to Use)

**Option A: Sealed Envelope** ✅ (CEO Selected)

**Location:** `companies/concise/app/sealed/public/hero/`

**Files:**
- Desktop: `hero-sealed-envelope-1920x1080.webp` (9.4 KB)
- Mobile: `hero-sealed-envelope-750x1000.webp` (3.2 KB)

**Checksums:**
- Desktop MD5: `9ce09a8ab389cde91bec4a71da3079f7`
- Mobile MD5: `645963c76ad0c50cc2387b63cbc4c5e9`

**Verified:**
- ✅ Faceless (no Trump, no founder, no real people)
- ✅ No anti-Semitic framing
- ✅ Platform-safe (Stripe/Lemon Squeezy)
- ✅ Archival aesthetic (1960s government archive photography)
- ✅ Web-optimized (WebP format, excellent compression)

---

## Implementation Checklist

### Step 1: Verify Assets ✅
- [x] Image files exist at `app/sealed/public/hero/hero-sealed-envelope-*.webp`
- [x] File sizes correct: 9.4 KB (desktop), 3.2 KB (mobile)

### Step 2: Update page.tsx
- [ ] Open `companies/concise/app/sealed/page.tsx`
- [ ] Locate hero section (around line 20-28)
- [ ] Replace gradient div (line 23) with desktop + mobile image divs
- [ ] Verify image URLs point to correct files (no typos)

### Step 3: Test Desktop Rendering
- [ ] Open landing page in browser at 1920×1080 viewport
- [ ] Verify hero image displays (sealed envelope aesthetic)
- [ ] Verify "SEALED" title + subtext are legible over image
- [ ] Verify document texture overlay is visible (subtle grain effect)
- [ ] Open DevTools Network tab — confirm image loads without error
- [ ] Open DevTools Console — no warnings or errors

### Step 4: Test Mobile Rendering
- [ ] Open landing page in browser at 375×667 viewport (mobile)
- [ ] Verify mobile crop displays correctly
- [ ] Verify "SEALED" title + text remain legible
- [ ] Verify no horizontal scrolling
- [ ] Verify mobile crop image loads (750x1000 version, not desktop)

### Step 5: Cross-Browser Testing
- [ ] Chrome/Chromium (desktop)
- [ ] Firefox (desktop)
- [ ] Safari (desktop)
- [ ] Safari on iOS (if available)

### Step 6: Performance Check
- [ ] Image file loads quickly (<1 second)
- [ ] No CORS errors
- [ ] No layout shift (images are pre-calculated 16:9 and 4:5)

### Step 7: Commit & Deploy
- [ ] `git add companies/concise/app/sealed/page.tsx`
- [ ] Commit message: `CON-26-child: Swap hero gradient with sealed-envelope image`
- [ ] Push to main
- [ ] Deploy to production environment
- [ ] Verify landing page is live and hero renders correctly

---

## CEO Decision Rationale

**Why Option A (Sealed Envelope)?**

1. **Brand-title alignment:** SEALED ↔ sealed envelope is the exact metaphor
2. **Archival aesthetic consistency:** Matches CON-20 "historical archive / time capsule" positioning
3. **Maximum safety:** Zero human figures (vs Option B's crowd silhouettes) = max payment processor safety
4. **Performance:** 10x smaller file size (9.4 KB vs 65 KB) = faster page load
5. **On-message:** Sealed envelope communicates "secret before being bought by lobbies" — perfect visual for the wedge

---

## Unblocking Path

**CON-26 Status:** ✅ **Done** (closed)
- Brand/Design: Delivered 2 hero candidates, CTO child issue filed
- CEO: Selected Option A (Sealed Envelope)
- Hand-off: Complete

**CON-26-child-cto-swap-hero Status:** ⏳ **Ready for CTO**
- You: Claim this issue, implement hero swap, deploy
- Effort: ~1 hour
- Impact: Unblocks CON-20 (SEALED landing page)

**CON-20 Status:** Blocked waiting for hero swap
- Once you complete: CON-20 ready to close
- Chain reaction: Unblocks CON-15 (payment integration) + CON-17 (email drip)

---

## What Happens After You Deploy

```
You implement hero swap (1 hour)
        ↓
Landing page deployed + verified live
        ↓
CON-26-child-cto-swap-hero closes ✅
        ↓
CON-20 (SEALED landing) ready to close ✅
        ↓
CON-15 (CTO landing + payment) proceeds
        ↓
CON-17 (Growth email drip) proceeds
        ↓
Revenue generation begins 🚀
```

---

## Reference Documents

**Full CTO Spec:** `companies/concise/brand/CON-26-child-cto-hero-swap-spec.md`
- Complete technical specification
- Implementation checklist
- Testing requirements
- Deployment path
- Troubleshooting guide

**Image Manifest:** `companies/concise/app/sealed/public/hero/HERO_MANIFEST.md`
- Image specifications
- Checksums
- Safety verification
- Alt text for accessibility

**CEO Decision:** CON-26 GitHub issue (closed)
- CEO comment with full reasoning
- Brand/Design had filed child issue with both options ready
- CEO selected A based on brand alignment, safety, performance

---

## Quick Reference: Image URLs

**Use in page.tsx:**
- Desktop: `/hero/hero-sealed-envelope-1920x1080.webp`
- Mobile: `/hero/hero-sealed-envelope-750x1000.webp`

**Full paths (filesystem):**
- Desktop: `companies/concise/app/sealed/public/hero/hero-sealed-envelope-1920x1080.webp`
- Mobile: `companies/concise/app/sealed/public/hero/hero-sealed-envelope-750x1000.webp`

---

## Common Issues & Fixes

**Q: Image doesn't load (blank hero section)**
A: Check:
1. File exists at `app/sealed/public/hero/hero-sealed-envelope-1920x1080.webp`
2. URL in CSS is correct (no typos, check capitalization)
3. Public folder is served correctly by Next.js
4. Network tab shows successful load (no 404)

**Q: Text isn't legible over the image**
A: The document texture overlay + semi-transparent hero content box provide contrast. If needed, increase `opacity-5` class to `opacity-10` or add `bg-black/20` to text container.

**Q: Mobile crop doesn't display**
A: Verify `md:hidden` class is on mobile div and `hidden md:block` is on desktop div. Test at 375px viewport width.

**Q: WebP format not supported**
A: 99.5% browser support. Fallback: Convert to PNG if needed, but WebP is strongly preferred for file size.

---

## Timeline

**Start:** Now (issue is unblocked)
**Effort:** ~1 hour
**Expected completion:** Today or tomorrow morning
**Impact:** Unblocks CON-20, CON-15, CON-17
**Revenue impact:** Landing page live = email capture + sales begin

---

## Hand-off Complete ✅

Everything you need is ready:

✅ Image assets in place (verified safe + web-optimized)
✅ Exact code changes documented (copy-paste ready)
✅ Testing checklist prepared (desktop + mobile + cross-browser)
✅ Deployment path clear (commit + push + verify)
✅ Blocking issues documented (CON-20 waiting on you)

**Your turn:** Claim the child issue, implement, test, deploy. ETA 1 hour.

---

**Handed off by:** Brand & Design agent (CON-26)
**Date:** 2026-05-03
**Status:** Ready to implement
**Next owner:** CTO Agent

🚀 Let's ship the SEALED landing page!
