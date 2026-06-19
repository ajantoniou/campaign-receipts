# SEALED Storefront — Trust / Conversion / Virality Design Review

**Date:** 2026-05-12
**Reviewer:** Senior front-end UI/UX (design pass agent)
**Scope:** `app/page.tsx`, `app/components/landing-blocks.tsx`, `lib/landing-content.ts`, thank-you page. Skill referenced: `open-design/SKILL.md` (skill is an index — defers to nested skills; no rules to violate).

## Brief vs. reality — flagged before any edits

The task brief described a `free-illustrations.tsx` component and `/public/free-shares/sealed-*.png` viral PNGs as the existing top-of-funnel. **Neither exists in this worktree.** `/public/` contains chapter illustrations (`ch1-swamp.jpg` … `ch9-laworder.jpg`) and `cover-20{16,20,24,26}.jpg` (untracked). No `free-shares/` directory; no watermark grid component.

The brief also asserts verdict math "145 · 36 KEPT / 42 PARTIAL / 48 BROKEN / 19 READER-DECIDES". A scan of `scripts/build-retail-pdf.mjs` shows badge tokens appearing 83×KEPT, 88×PARTIAL, 70×BROKEN, 18×READER, 4×BLOCKED — but these include legend mentions, not just promise entries; **the canonical count cannot be confirmed without parsing the entry data structure.** More importantly, the **public landing copy explicitly positions the book as "no editorial verdicts" / "no verdict baked in"** (`lib/landing-content.ts:25, 146`) while the PDF source clearly assigns verdict badges to every promise. **This is a product/positioning conflict that needs founder attention.** I will not publish verdict counts that contradict on-page neutrality copy.

Per founder global CLAUDE.md ("verify before quoting; no invented citations") I am refusing the verdict-count display and the bipartisan-review-panel-names suggestion — I could not find names anywhere to cite.

## Audit — what's strong, weak, missing (~250 words)

**Strong.** Editorial visual language is locked: amber-500 accent on slate/black, `font-sealed-display` (Lora) for headlines, mono uppercase tracked eyebrows, inline-SVG glyphs (no AI clip art). Section rhythm is consistent. Sample preview section pairs verbatim quote + receipts — that's the conversion mechanism, on-page, twice. JSON-LD Book + Org schema is correct. Accessible skip-link present. Sticky nav with anchor scroll-margin handled.

**Weak.** (1) Above-the-fold lacks a single stop-scroll number — the "145 promises" lives only in body copy and the 4-tile stat bar treats it as one of four equal-weight items. (2) Trust strip is a bulleted UL — reads as feature list, not as a sealed/legitimacy mark. (3) No floating share affordance — share lives only in the footer, after the buyer has either bounced or scrolled past the buy block. (4) Share intent text is a generic site title with no claim hook — kills retweet probability. (5) Thank-you page misses the "license #" social-proof moment — buyers land on a plain confirmation; no shareable "I got mine" artifact. (6) Hero CTA stack has three buttons of similar visual weight (preview, sample pages, notify) — diffused intent.

**Missing.** Per-claim share intents; copy number / license badge treatment; sticky share button; "individually licensed · sources cited · open threads disclosed" treated as a typographic seal rather than a bullet list; route-specific OG images beyond the existing layout-level defaults.

## Prioritized improvement plan (ranked by impact / hour)

1. **[TRUST + CONVERSION] Stop-scroll number in hero — "145".** Promote the count to a typographic mark (display font, large, with mono caption). Lifts perceived rigor instantly; pure CSS. *Shipped.*
2. **[TRUST] Sealed trust strip.** Replace bulleted hero credibility list with a horizontal "seal strip" — three monospaced tokens separated by ornamental dividers: `INDIVIDUALLY LICENSED · SOURCES CITED · OPEN THREADS DISCLOSED`. Reads as a stamp, not as ad copy. *Shipped.*
3. **[VIRALITY] Floating share button.** Bottom-right pill, low-contrast, monospaced "↗ Share the archive". Opens a small drawer with one-click X / LinkedIn / copy-link, each pre-filled with the most claim-hooked line ("Memory loses. Receipts don't. 145 verbatim 2016 promises, sourced and dated."). Non-salesy because it shares the *archive*, not the product. *Shipped.*
4. **[VIRALITY] Pre-filled tweet text upgrade.** Footer share links currently use the page `<title>`. Swap to a claim-hook line that names the archive and the receipt verb. Site → archive URL retained. *Shipped.*
5. **[VIRALITY + TRUST] Thank-you "Copy #" treatment.** Add a typographic "Licensed copy · SEALED2016.COM" block to the thank-you page so buyers screenshot it. No fake serial number — just the license language + the seal divider SVG. *Shipped.*
6. **[CONVERSION] Hero CTA hierarchy.** Demote "View Sample Pages" to a text link below the primary CTAs; let "Download the Free 5-Page Preview" carry the primary action alone. *Shipped.*

### Considered but deferred
- **Per-PNG viral share grid:** the PNGs don't exist in this worktree. Cannot ship.
- **Verdict-math counter:** product/positioning conflict — flagged for founder.
- **Bipartisan review panel names:** no names found anywhere in repo. Will not fabricate.
- **Route-specific OG images:** the global Twitter/OG metadata in `layout.tsx` is acceptable; route-level images for the storefront would duplicate the same content. Not impact-per-hour positive.
- **Sibling tweak to campaignreceipts.com:** out of scope per brief.

## Founder eyes

- **Positioning conflict** between landing-page "no editorial verdicts" copy and the PDF interior assigning KEPT/PARTIAL/BROKEN/READER badges. Either the landing copy needs to soften ("verdict supplied, receipts provided so you can dispute it") or the PDF needs a different framing. As-is, a buyer who downloads the preview and sees the badges may feel misled. Recommend founder + author decide before next push.
- **Brief described files that don't exist** (`free-illustrations.tsx`, `/public/free-shares/`). If those landed on `main` since this worktree was cut, rebase first. If they were planned but never built, that's a separate ticket.
