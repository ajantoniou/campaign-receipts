# CON-26 — Hero Image Generation & Merge

**Status:** `todo`
**Priority:** high
**Blocker:** CON-20 (landing page) — image generation not yet started
**Owner:** Brand/Designer (generation) + CTO (merge)
**Created:** 2026-05-03 (from CEO review comment on CON-20)

---

## Objective

Generate hero image from CON-12 image prompts and merge into SEALED landing page. Currently, hero section uses placeholder gradient. Once founder generates images via Midjourney or Claude Gen, swap gradient for real image.

## Current State (CON-20)
- Hero section: `/app/sealed/page.tsx` lines 69-77
- Placeholder: `bg-gradient-to-br from-blue-900/40 via-slate-900 to-slate-950`
- Ready for image swap (no other changes needed)

## Scope

### Phase 1: Image Generation (Founder/Designer)
**Input:** 8 image prompts from CON-12:
1. Archive/Time-Capsule Hero (sealed envelope, redacted text)
2. Campaign Rally (crowd silhouettes, no faces)
3. Redacted Document Reveal (un-redaction)
4. Empty Podium with Flag (no crowd)
5. Typewriter + Quote (flat-lay historian aesthetic)
6. Timeline Visual (2015→2026 infographic)
7. Sealed Envelope Close-Up (macro, wax seal)
8. American Iconography as Archive (museum exhibit)

**Tools:** Midjourney, Claude Gen, or other image gen tool

**Output:** 1 hero image for landing page
- Format: JPG or PNG
- Aspect ratio: 16:9 (1920×1080 minimum)
- File size: < 500KB (optimized for web)
- Aesthetic: Archive/document/2016-campaign themed (no faces)

### Phase 2: Image Merge (CTO)
**Task:** Replace placeholder gradient with generated image

**Steps:**
1. Receive image file from founder
2. Place in `public/images/hero-sealed.jpg`
3. Update line 72 in `app/sealed/page.tsx`:
   ```tsx
   // OLD:
   <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-slate-900 to-slate-950" />

   // NEW:
   <div
     className="absolute inset-0 bg-cover bg-center"
     style={{ backgroundImage: 'url(/images/hero-sealed.jpg)' }}
   />
   ```
4. Adjust overlay darkness if needed (add `bg-black/30` to `<div>` below)
5. Build locally: `npm run build`
6. Test: `npm run dev` → verify image loads, text readable
7. Commit and push to main
8. Verify Render deployment

**Detailed guide:** See `CON-20-HERO-IMAGE-MERGE-GUIDE.md` in repo

## Acceptance Criteria
- [ ] 1 hero image generated from CON-12 prompts
- [ ] Image placed in `public/images/hero-sealed.jpg`
- [ ] `page.tsx` updated with image URL
- [ ] Builds successfully (`npm run build` passes)
- [ ] Dev server loads image without errors
- [ ] Hero text remains readable on image
- [ ] Responsive design verified (mobile + desktop)
- [ ] Deployed to Render and verified live

## Dependencies
- **Blocker:** Founder must run image generation
- **Related:** CON-12 (image prompts), CON-20 (landing page)

## Estimates
- Image generation: 30-60 min (depends on tool + iterations)
- Image merge: 30 min (CTO)
- Testing + deployment: 20 min
- **Total:** ~2 hours

## Timeline
- **Best case:** Founder generates today → CTO merges tomorrow
- **Safe case:** Soft-launch with gradient, replace image within week

## Notes
- Gradient is acceptable for soft-launch (low-traffic phase)
- Replace with real image BEFORE paid traffic (ads, email campaigns)
- Archive aesthetic must be maintained (no faces per hard rules)
- Optimized for fast loading (< 500KB)

---

**Phase 1 Owner:** Founder / Brand Designer (image generation)
**Phase 2 Owner:** CTO (ac0726ce) (image merge + deploy)
**Status:** Awaiting image generation signal from founder
