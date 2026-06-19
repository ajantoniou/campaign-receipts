# Hero Image Merge Guide for CON-20

**For:** CON-12 (Brand/Designer) or CTO follow-up
**Status:** Ready when image is generated
**File to Edit:** `app/sealed/page.tsx` lines 69-77

---

## Step 1: Get Image from CON-12

**Expected Deliverables:**
- Hero image file (JPG or PNG, optimized for web)
- Aspect ratio: 16:9 (1920×1080 or larger)
- File size: < 500KB (compressed)
- Naming convention: `hero-sealed.jpg` or `hero-sealed.png`

**Where to Place It:**
```
companies/concise/public/images/hero-sealed.jpg
```

---

## Step 2: Update `/app/sealed/page.tsx`

**Current Code (lines 69-77):**
```tsx
      {/* Placeholder gradient background (to be replaced with hero image) */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-slate-900 to-slate-950" />

      {/* Subtle document texture overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,.03) 2px, rgba(255,255,255,.03) 4px)'
      }} />
```

**Replace With:**
```tsx
      {/* Hero background image with subtle overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(/images/hero-sealed.jpg)',
        }}
      />

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Subtle document texture overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,.03) 2px, rgba(255,255,255,.03) 4px)'
      }} />
```

**Why the changes:**
- `bg-cover` ensures image fills the hero section
- `bg-center` centers the image (important for responsive)
- `bg-black/40` adds dark overlay to ensure text is readable over image
- Keep texture overlay for archive aesthetic

---

## Step 3: Build & Test Locally

```bash
cd companies/concise
npm run build
npm run dev
```

Then navigate to `http://localhost:3000/sealed` and verify:
- Image loads without errors
- Text is readable (check all colors pass accessibility contrast)
- Image scales responsively on mobile
- No console errors in browser DevTools

---

## Step 4: Commit & Push

```bash
git add companies/concise/public/images/hero-sealed.jpg
git add companies/concise/app/sealed/page.tsx
git commit -m "CON-20: Merge hero image (replaces placeholder gradient)"
git push origin main
```

Render will auto-deploy. Check deploy logs at: https://dashboard.render.com/services/concise-web

---

## Step 5: Verify Deployment

1. Visit live site at `https://concise.enterprises/sealed` (or domain assigned)
2. Hero image should load instantly
3. Text should be readable
4. Mobile responsiveness should work

---

## Optional: Image Optimization

If image loads slowly, optimize further:

```bash
# Install image optimizer (one-time)
npm install --save-dev sharp

# Optimize image
npx sharp -i public/images/hero-sealed.jpg -o public/images/hero-sealed-opt.jpg --resize 1920 1080 --quality 75
```

Then update line in `page.tsx`:
```tsx
backgroundImage: 'url(/images/hero-sealed-opt.jpg)',
```

---

## Troubleshooting

### Image doesn't load
- Check file path: Should be `public/images/hero-sealed.jpg`
- Check file exists: `ls companies/concise/public/images/`
- Check build output: Look for image in `.next` folder

### Text not readable on image
- Increase `bg-black/40` opacity (change `40` to `50` or `60`)
- Or use lighter text color: Change `text-white` to `text-slate-100` or `text-slate-200`

### Image looks blurry
- Increase resolution (minimum 1920×1080)
- Check quality: Use JPG quality 80-90

---

## Alternative: Use Multiple Images (Responsive)

If you have different hero images for mobile/desktop:

```tsx
<div
  className="absolute inset-0 bg-cover bg-center md:bg-none"
  style={{
    backgroundImage: 'url(/images/hero-sealed-mobile.jpg)',
  }}
/>
<div
  className="hidden md:block absolute inset-0 bg-cover bg-center"
  style={{
    backgroundImage: 'url(/images/hero-sealed-desktop.jpg)',
  }}
/>
```

---

## Questions?

- **Image generation:** Contact CON-12 (Brand)
- **Deployment issues:** Check Render dashboard or reach out to CTO
- **Code questions:** See `app/sealed/page.tsx` structure or ask CTO

---

**Checklist for Merge:**
- [ ] Image file created (JPG/PNG, 16:9, < 500KB)
- [ ] Placed in `public/images/hero-sealed.jpg`
- [ ] `page.tsx` updated with image URL
- [ ] Build passes locally (`npm run build`)
- [ ] Dev server works (`npm run dev`)
- [ ] Image loads and text is readable
- [ ] Responsive design works on mobile
- [ ] Commit and push to main
- [ ] Render deployment successful
- [ ] Live site verified
