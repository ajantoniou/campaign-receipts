# Lulu Re-upload — Font Embedding Fix (2026-05-21)

**Ticket:** Lulu #888906 — "UPP Order Line Item Error / Text block will not RIP"
**Project ID:** `84d7e29` — *v2 SEALED: The 2016 Promises — Before the Deals*
**Status:** Fixed in `scripts/build-retail-pdf.mjs`. Ready to re-upload.

## What Lulu reported

> "Cannot extract the embedded font 'T3Font_0'. Some characters may not display or print correctly."

`T3Font_0` is a Type 3 (bitmap) font. Lulu's print RIP cannot process Type 3 fonts even when they are technically embedded.

## Root cause

The retail HTML contained two emoji entities used as decorative icons:

- `&#x1F4A1;` (light bulb) — prefix on every "A-ha Moment" callout label (14 instances)
- `&#x1F4CD;` (pushpin) — prefix on every `.rail` location/date line (15 instances)

Headless Chrome (Puppeteer) renders these via **AppleColorEmoji**, which is a Type 3 bitmap font on macOS. The result was a PDF that `pdffonts` reported as having `AppleColorEmoji` as a Type 3 + Custom-encoding font — Lulu's exact rejection condition.

All other fonts (Palatino, Times New Roman, Courier New) were already correctly embedded as CID TrueType subsets.

## The fix

Removed both emoji entities from `scripts/build-retail-pdf.mjs`. Book content is unchanged — the emoji were purely decorative prefixes on already-styled, already-labeled spans (".aha-label" still reads "A-ha Moment" in colored small-caps; ".rail-icon" is now an empty span and the rail line begins with its first text token).

Regenerated PDF.

## Verification

`pdffonts artifacts/SEALED-v1-retail.pdf` — every font now shows:

```
type=CID TrueType   encoding=Identity-H   emb=yes  sub=yes  uni=yes
```

**Zero Type 3 fonts. Zero AppleColorEmoji.** This is the configuration Lulu's RIP requires.

## Fixed PDF

```
/Applications/DrAntoniou Projects/AgentCompanies/companies/concise-sealed/artifacts/SEALED-v1-retail.pdf
```

Filename unchanged (matches the same Lulu listing).

## Re-upload steps

1. Log into Lulu: <https://www.lulu.com/account/projects> (use the same account that owns project `84d7e29`).
2. Find the project: *SEALED: The 2016 Promises — Before the Deals* (v2). Click **Edit**.
3. Step to **Interior** in the project wizard.
4. Click **Choose a different file** (or "Replace") and upload the fixed PDF above.
5. Lulu auto-runs its preflight. Wait for the green "Your file passed our checks" banner.
6. Click **Save & Continue** through Cover (no change) and pricing.
7. Submit a new print proof order or re-attempt the original order.

**Cost:** Lulu re-validation is free. Only the eventual print order has a cost (which Lulu already refunded on the failed run).

## Expected preflight result

- No font-embedding error.
- No "Cannot extract embedded font" warning.
- Page count, trim size (6×9), and margins identical to v2 — same listing, same cover, same SKU.

## If it still fails

If Lulu's preflight rejects the new file with a *different* font error (highly unlikely given the pdffonts output above), the escalation path is:

1. Re-run `pdffonts` on the rejected file and capture the full report.
2. Install Ghostscript (`brew install ghostscript`) and post-process the PDF to convert all remaining fonts to outlines:

   ```bash
   gs -sDEVICE=pdfwrite -dPDFSETTINGS=/prepress -dCompatibilityLevel=1.4 \
      -dEmbedAllFonts=true -dSubsetFonts=true -dNoOutputFonts=true \
      -sOutputFile=artifacts/SEALED-v1-retail-outlines.pdf \
      -dNOPAUSE -dBATCH artifacts/SEALED-v1-retail.pdf
   ```

   `-dNoOutputFonts=true` converts every glyph to vector paths — the nuclear option. File size grows ~20-30% but no font can be rejected because there are no fonts left.

3. If even that fails, reply to Lulu ticket #888906 with the new pdffonts report and ask them to flag the specific glyph/font.
