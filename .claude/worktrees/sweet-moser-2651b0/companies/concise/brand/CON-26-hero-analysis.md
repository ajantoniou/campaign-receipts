# CON-26: SEALED Hero Image — Analysis & Selections

**Issue:** CON-26 SEALED hero image — generate + swap into landing page
**Owner:** Brand & Design
**Status:** Image selections complete, generation pending
**Last Updated:** 2026-05-03

---

## Executive Summary

From the 8 queued image-generation prompts in `trump-book-rename.md` (lines 236-325), I've selected the **top-2 strongest hero candidates** for the SEALED landing page.

**Selection Criteria:**
- ✅ 16:9 aspect ratio (hero-ready)
- ✅ Faceless (no Trump, no people, no founder)
- ✅ Archival/time-capsule aesthetic alignment
- ✅ Platform-safe (payment processor friendly, no controversy)
- ✅ Web-optimized (high contrast, clear visual hierarchy)

---

## Top-2 Candidates (For Founder Selection)

### **PICK 1: Sealed Envelope (Archive/Time-Capsule Hero)** ⭐ PRIMARY RECOMMENDATION

**Source Prompt:** `Prompt 1: Archive/Time-Capsule Hero` (lines 236-245)

**Visual Description:**
- Heavy manila envelope labeled "SEALED — 2016 CAMPAIGN ARCHIVE"
- Resting on aged oak desk with wax seal (unbroken)
- Embossed eagle insignia on red wax seal
- Official stamp in corner
- Faded typed pages with black redaction bars surrounding envelope
- 1960s government archive photography aesthetic
- Sepia + blue ink overlay
- Dramatic desk lamp lighting (long shadows)
- No people visible

**Aspect:** 16:9 landscape, high contrast, archival quality

**Why This Is Strongest:**
1. **Visual Uniqueness:** Sealed envelope is iconic, immediately communicates "archive" without text
2. **Landing Page Alignment:** Mirrors mockup (trump-book-rename.md lines 63-76) which specifically mentions "redacted document texture overlay"
3. **Emotional Impact:** Tactile, premium feel (wax seal, oak desk, detail)
4. **Faceless Safety:** Zero people = zero platform risk
5. **Premium Positioning:** Auction-house aesthetic signals $22 price point credibility
6. **Metaphorical Fit:** "Sealed" title + sealed envelope = perfect visual synergy

**Generation Notes:**
- High detail required (wax seal imperfections, redaction bars)
- Color palette: Sepia, cream/manila, blue ink, black redactions
- Lighting: Dramatic raking light for seal depth

---

### **PICK 2: Campaign Rally Silhouettes (Energy & Patriotism)**  ⭐ STRONG ALTERNATIVE

**Source Prompt:** `Prompt 2: Campaign Rally (Crowd Only, No Faces)` (lines 247-256)

**Visual Description:**
- 2016 campaign rally crowd seen from BEHIND the stage
- Thousands of attendees in silhouette (raised hands)
- Podium in soft focus center-middle
- American flag backdrop
- Red/white/blue stage lighting dominant
- No faces visible (all silhouettes only)
- Documentary photography style
- Grainy film stock quality
- Early 2010s digital camera aesthetic

**Aspect:** 16:9 landscape, film grain, patriotic color palette

**Why This Is Strong:**
1. **Faceless Guarantee:** 100% silhouettes = impossible to identify individuals
2. **Emotional Energy:** Conveys rally excitement + crowd power without Trump imagery
3. **Patriotic Framing:** Red/white/blue dominant = American context (not Trump-specific)
4. **Platform Safety:** Documentary style, grainy, clearly archive footage aesthetic
5. **Alternative Hook:** If founder prefers "movement" visual over "document" visual

**Generation Notes:**
- Requires massive crowd (thousands in silhouette)
- Camera angle critical (must be FROM BEHIND stage looking outward at crowd)
- Color dominance: Red, white, blue stage lights
- No individual faces visible at any zoom level

---

## Comparison Matrix

| Criteria | Sealed Envelope | Rally Silhouettes |
|----------|-----------------|-------------------|
| **Aspect Ratio** | 16:9 ✅ | 16:9 ✅ |
| **Faceless** | ✅ (objects only) | ✅✅ (silhouettes) |
| **Archival Feel** | ✅✅ (premium) | ✅ (documentary) |
| **Uniqueness** | ✅✅ (iconic) | ✅ (familiar genre) |
| **Platform Safety** | ✅ (objects) | ✅ (silhouettes) |
| **Generation Difficulty** | Medium (detail) | High (crowd scale) |
| **Hero Fit** | Exceptional | Very Good |
| **Brand Positioning** | Premium/Intellectual | Populist/Movement |

---

## Generation Path

### Step 1: Generate Both Candidates
- Use Claude image generation (Midjourney fallback if needed)
- Strict constraint: FACELESS (no Trump, no people, no founder)
- 1920x1080 hero crop + 750x1000 mobile crop for each

### Step 2: Quality Assurance
- [ ] Check for any human faces (zoom to 100%, verify all silhouettes/objects)
- [ ] Verify no anti-Semitic framing or hateful imagery
- [ ] Confirm archival aesthetic (color, grain, lighting match brief)
- [ ] Test web rendering (contrast, text overlay legibility)

### Step 3: Optimization for Web
- Save as `.webp` (best compression)
- Desktop: `hero-sealed-1920x1080.webp` (~300-400 KB)
- Mobile: `hero-sealed-750x1000.webp` (~150-200 KB)
- Directory: `companies/concise/app/sealed/public/hero/`
- Create manifest: `HERO_MANIFEST.md` (image URLs, checksum, alt text)

### Step 4: CTO Child Issue
- File: CON-26-child-cto-swap-hero
- Task: Replace gradient at `page.tsx:23` with image asset
- Add mobile breakpoint (`md:` responsive class)
- 1-line change + testing

---

## Hard Rules (Non-Negotiable)

✅ **FACELESS ABSOLUTELY** — No Trump face, no founder face, no real-person likenesses
✅ **NO ANTI-SEMITIC FRAMING** — Zero tolerance; regenerate if any composition hints at stereotypes
✅ **PLATFORM SAFE** — Must pass Stripe/payment processor content review
✅ **ARCHIVAL AESTHETIC** — Vintage, historical, document-focused (not modern design)

---

## Founder Decision Point

**I am submitting BOTH candidates for your review.**

- **Pick 1: Sealed Envelope** = Premium, iconic, unique positioning
- **Pick 2: Rally Silhouettes** = Energy, patriotic, familiar (safer fallback)

Once you select, we'll:
1. Generate the final hero image(s)
2. Optimize for web + place in directory
3. File CTO child issue for page swap

**Next Action:** Founder approval on image direction → Image generation → CTO issue filed → Landing page live

---

## Files & References

- **Parent Issue:** CON-20 SEALED landing currently using placeholder gradient
- **Image Prompts Source:** `companies/concise/brand/trump-book-rename.md` lines 234-325
- **Landing Page:** `companies/concise/app/sealed/page.tsx` line 23 (gradient placeholder)
- **Mockup Reference:** `companies/concise/brand/trump-book-rename.md` lines 53-230 (landing page mockup with hero)

---

Generated by Brand & Design agent (CON-26)
