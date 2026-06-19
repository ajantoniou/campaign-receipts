# Open Design export handoff template

Use this template the moment a layout or asset is exported from the Open Design workspace. Paste the filled-in version directly into the issue that will carry the implementation work so the CTO (or other engineer) can claim it without extra back-and-forth.

## 1. Export summary
- **Component / feature:** _e.g., SEALED landing hero + CTA cluster_
- **Purpose:** _Why this export exists (e.g., “introduces sealed envelope hero to reinforce the “before foreign lobby capture” wedge”)._
- **Status:** _Final, under review, tweak requested, etc._
- **Exported by:** _Agent name / pseudonym_  
- **Open Design snapshot:** _share link or export filename (ZIP / TODL)_
- **Export date (UTC):** _2026-05-xx hh:mm_
- **Open Design version:** _nexu-io/open-design@<tag> or commit hash_

## 2. Package contents
| Asset | File name in export | Format / size | Intended use | Notes |
|-|-|-|-|-|
| Primary desktop layout | `sealed-hero-1920x1080.png` | PNG / 1920×1080 | Replacement hero background | Exported with `z=0.7` grain overlay |
| Mobile crop | `sealed-hero-750x1000.png` | PNG / 750×1000 | Mobile hero background (4:5) | Use md:hidden/hidden classes as in spec |
| Utility texture | `paper-texture.webp` | WebP / 1.2 MB | Overlay on cards | Apply `mix-blend-screen` if needed |
| Fonts / docs | `Concise-Brand-Fonts-Readme.md` | MD | Font families, weight pairing | Use same tokens as Next.js theme |

Add rows for every file you export. If the sheet is longer, paste extra rows below the table and include the paths to the zipped export bundle.

## 3. Design specs
- **Typography:** _List font families + weights (e.g., “Concise Sans Bold 48, Concise Sans Regular 18”)._
- **Color palette:** _Hex + usage (chart). Example: `#0B1A3B` hero background, `#F4EDE4` text box background, `#FED400` accent.)_
- **Spacing:** _Breakpoints / gaps / grid notes..._
- **Interaction states:** _Buttons, hover/active feedback, link underlines, focus rings, etc._
- **Accessibility:** _Contrast ratios, alt text (if not auto), emphasis on faceless rule._

## 4. Implementation notes
1. **Responsive stacking:** Desktop hero uses `md:block` + absolute stacking (see `app/sealed/page.tsx`). Mobile version lives inside `md:hidden`.
2. **Hero copy:** Keep CTA copy exactly as shown in export. Use HTML `aria-label` on CTA if text is visual-only.
3. **Textures + overlays:** Drop the exported texture into `public/hero/textures` and load via CSS `background-image`.
4. **Fonts:** Add any new `@font-face` declarations or use existing tokens described in `brand/brand-tokens.md`.
5. **Optimization:** Source files include both PNG and WebP; prefer WebP in production but keep PNG as fallback. Include `loading="eager"` on hero backgrounds to avoid CLS.
6. **Faceless policy:** All imagery must stay faceless; if anything changes, re-run due diligence with the CEO before pushing.

## 5. QA checklist
- [ ] Export previews match the latest Open Design frames (double-check share link + timestamp).
- [ ] Image files are in `app/<component>/public/…` before referencing them.
- [ ] Hero text, CTA, and overlays sit above exported textures (z-index spec included in `opened layout`).
- [ ] Layout responds at 1280px, 1024px, 768px, 480px breakpoints without clipping.
- [ ] Colors + spacing match Open Design values (use Chrome devtools to confirm hex).
- [ ] Exported fonts / weights load in Next.js without layout shift (use `next/font` token if available).
- [ ] Screenshot(s) uploaded to the issue (desktop + mobile), referencing `Open Design` share for comparison.

## 6. Outstanding dependencies
- **Images pending:** _List any assets still generating (e.g., “CTA button micro-interaction exported next heartbeat”)._
- **CEO approval:** _If this export touches a hard rule (Trump book cover variants, Palestine palette, etc.), note the decision required and routing (e.g., “CEO must sign off before production hero swaps”)._
- **Other agents:** _List follow-up actions (e.g., "Growth: confirm email copy matches hero line before hero goes live")._

## 7. Next steps & owner
- **Next owner:** _Agent (e.g., CTO) assigned in issue._
- **Implementation issue:** _Link or reference (e.g., `CON-XX-child-cto-hero-swap`)._
- **Target deploy / release:** _Optional release window or milestone._
- **Verification note:** _Where to log checks (issue comment, `deploys/` folder, etc.)._
Align this section with the issue naming / milestone workflow already in the repo.

## 8. Attachments & references
- **Export ZIP (Open Design bundle):** `brand/exports/open-design/<name>.zip`
- **Open Design share / branch:** _Link to the workspace view or share URL (prefill with `open-design share` output)._
- **Related specs:** `brand/CON-26-...` or `brand/brand-tokens.md` for tokens, whichever is relevant.
- **Image checksums:** record MD5 for hero assets if needed.

For every new Open Design export, copy this template, fill in the blanks, and paste the completed version into the issue before claiming implementation.
