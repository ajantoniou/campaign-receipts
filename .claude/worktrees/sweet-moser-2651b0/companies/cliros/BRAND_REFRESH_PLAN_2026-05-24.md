# Cliros Brand Refresh — Design Plan
**Date:** 2026-05-24
**Author:** Brand + Product Design
**Status:** Plan only — no code yet. Hand to coding agent after founder sign-off.
**Audience benchmark:** Harvey.ai (gravitas, restraint), Wachtell/Latham (institutional), Sotheby's $20M listings (warm luxury), Patek Philippe (heirloom craft).

The current site (`companies/cliros/app/src/app/page.tsx`, `globals.css`) reads as a generic "warm-neutral SaaS." It must read as **an expensive Atlanta law firm that happens to ship software** — paper, ink, gold rule, one quiet pop of Georgia orange.

---

## 1. Color Tokens

Replace the current `--background`/`--landing-*` block. New roles:

| Role | Hex | Usage |
|---|---|---|
| `--paper` | **`#EFE7D6`** | Page background. Warm legal-pad beige, NOT cream, NOT yellow. |
| `--paper-deep` | `#E4D9C2` | Section bands, hero gradient base. |
| `--paper-edge` | `#D6C9AC` | Hairline borders against paper. |
| `--ink` | **`#0B0B0C`** | Headlines, primary text. True near-black, not navy. |
| `--ink-soft` | `#2A2622` | Body. Slight brown bias to sit on paper. |
| `--ink-muted` | `#5B5247` | Sub-copy, captions. |
| `--gold` | **`#B08740`** | Rule lines, dividers, monogram strokes. Antique brass — not yellow. |
| `--gold-foil` | `#D9B57A` | Hover states, hairline highlights, foil-stamp gradient top. |
| `--gold-deep` | `#7A5A23` | Foil-stamp gradient bottom, pressed states. |
| `--orange-ga` | **`#BA4A1F`** | THE accent. Hero hook word + primary CTA only. Bulldog orange, oxidized. |
| `--orange-ga-ink` | `#8C3514` | Orange text on paper (AA contrast). |
| `--obsidian` | `#15110C` | Footer + select dark blocks (warm black, not pure). |
| `--seal-red` | `#7C1C1C` | Reserved for "verified" / pledge seal only. |

Kill: `--peach*`, `--rose`, `--accent`/`--accent-light` (blue), `--landing-accent` (#C45A2E). Migrate any `peach` usage to `--orange-ga`.

**Gold-foil gradient** (for rule lines, monogram strokes, the pledge seal):
`linear-gradient(180deg, #D9B57A 0%, #B08740 50%, #7A5A23 100%)`.

---

## 2. Type Pairing (Google Fonts, both free)

- **Display serif:** **Cormorant Garamond** — weights 500 / 600. Tight tracking (`-0.015em`). Used for H1/H2, hero headline, section titles. Conveys old-money law-firm letterhead. Loaded via `next/font/google` with `display: 'swap'` and preloaded.
- **Sub-serif (small caps, eyebrows):** **Cormorant SC** — 500. For eyebrow labels ("PRACTICE AREAS", "FOR ATTORNEYS — STATEWIDE GEORGIA").
- **Body sans:** **Inter Tight** — 400 / 500 / 600. Use over Geist (current `--font-geist-sans`). Inter Tight has the tighter rhythm we want against the serif.
- **Mono (rare — receipt numbers, file numbers):** **JetBrains Mono** 400, letter-spaced `0.04em`.

Hierarchy:
- H1 hero: Cormorant Garamond 600, **clamp(56px, 7vw, 96px)**, line-height 1.02, tracking -0.02em.
- H2: Cormorant Garamond 600, **clamp(36px, 4vw, 56px)**, line-height 1.08.
- Eyebrow: Cormorant SC 500, 13px, tracking 0.18em, color `--gold-deep`.
- Body: Inter Tight 400, 17/28.
- CTA label: Inter Tight 600, 15px, tracking 0.04em, ALL CAPS.

Drop the "warm grain" backgrounds. Restraint = expense.

---

## 3. Hero Composition

**Layout (desktop, 1440):** full-bleed photographic plate, **70vh minimum, 820px max**. Photograph occupies 100% width. Inside it, a **centered "card"** is NOT used — instead, the headline + search bar are placed **bottom-left** in a 640px column with **48px of negative space** between the photograph's right edge and the page gutter. Above the photo, a **1px `--gold` rule** runs full-bleed; below it, another 1px `--gold` rule. The photograph is held between two foil lines like a plate in a monograph.

**Image direction (commission, not stock):** see §7.

**Overlay treatment:** A bottom-left vignette `linear-gradient(95deg, rgba(11,11,12,0.72) 0%, rgba(11,11,12,0.35) 45%, transparent 70%)` so the serif headline reads on top of the photograph without an opaque box.

**Eyebrow** (small caps, gold): `THE GEORGIA CLOSING ATTORNEY'S DESK — EST. 2026`

**Headline** (Cormorant Garamond 600, color `--paper`):
> Title work, prepared in the time it takes to **pour the coffee.**

— where **"pour the coffee"** is set in `--orange-ga` italic, no underline. That's the ONE pop of bulldog orange in the entire viewport.

**Sub-headline** (Inter Tight 400, 18px, `--paper` at 80%):
> Cliros runs the courthouse trip, the title chain, and the commitment draft for Georgia residential closings. You sign the opinion.

**Single CTA — search bar only.** A paper-colored input, 56px tall, full 640px wide, gold 1px border, gold-foil 4px left accent strip. Placeholder: *"Enter a Georgia property address to begin"*. Right-side submit button: filled `--orange-ga`, ink-white label, **"OPEN FILE →"**. No "talk to founder," no "see how it works," no "watch demo." If they want more, they scroll.

**After-search behavior:** the photograph crossfades to a sheet of foolscap with **blurred teaser facts** (parcel ID, deed history count, mortgage chain count, three exception flags). Over the blur, a single email-gate card: *"Send this title preview to your inbox"* — one email field, **"SEND PREVIEW"** in orange. No password. The actual report sits behind the email click → magic-link signup.

---

## 4. Header Treatment

- **Background:** `--paper` with a 1px `--gold` bottom rule (no shadow).
- **Height:** 76px desktop / 60px mobile.
- **Logo (left):** **140px wide** wordmark using `/logo.svg` (currently rendered at 28px in `page.tsx` — that is the bug). On scroll past 80px, header compresses to 60px and logo to 108px.
- **Nav (center-left, beside logo, 32px gap):** Inter Tight 500, 14px, `--ink-soft`. Items: **Practice** · **Counties** · **Pricing** · **Pledge**. Active/hover: 1px gold underline, 4px offset.
- **Top-right CTA:** Single ghost button **"SIGN IN"** (Inter Tight 600, 13px, gold 1px border, transparent fill, ink label) + a secondary filled orange **"OPEN A FILE"** (44px tall, identical to hero CTA style, smaller). Two buttons total — admit only one is the entry point; the orange one wins by color.
- No phone number in header. No "Book demo." No badges.

---

## 5. Footer Treatment

`--obsidian` background, `--paper` text. Top edge: 1px `--gold-foil` rule.

Four-column layout (desktop), stacking on mobile:

1. **Brand column.** `logo-white.svg` at **32px tall**. Beneath: 11px small-caps gold eyebrow *"CLIROS, PBC"*. Then the address block (Inter Tight 13/20, `--paper` 75%):
   > 999 Peachtree Street NE
   > Suite 2300
   > Atlanta, Georgia 30309
   > hello@cliros.ai · (404) ###-####
2. **Practice.** Links: Residential Closings · Refi Title Work · Commitment Letters · Counties (159).
3. **Firm.** About · The 10% Pledge · Security · Careers · Press.
4. **Legal.** Terms · Privacy · State Bar of Georgia · Trust Account.

**Bottom rail** (single line, 12px, `--paper` 55%):
- Left: `© 2026 Cliros, PBC. Attorney advertising. Past results do not guarantee future outcomes.`
- Center: a **gold-foil pledge seal** — circular monogram with `10%` inside two gold rings, label *"GIVING PLEDGE — 10% of revenue to Georgia legal-aid"*, ~28px tall, taps to the AboutAndPledge anchor.
- Right: **"Made with ♥ in the USA 🇺🇸"** — Inter Tight 11px, heart in `--orange-ga`, flag emoji native. Subtle, single line, no box.

---

## 6. Component Patterns (restyle, don't rewrite)

Universal rules: every section is bracketed top and bottom by a **1px `--gold` rule** running the full content width (max 1200px). Section padding 120px desktop / 72px mobile. Cards never have shadows on paper; they use **1px `--paper-edge`** borders and `--paper` (or `--paper-deep` for elevation).

- **`ValuePropStrip`** — Becomes a *"Of counsel to Georgia attorneys"* eyebrow band. Three columns separated by gold vertical rules. Each: small-caps eyebrow, Cormorant 28px stat, one-line caption. No icons. No emojis.
- **`HowItWorksSteps`** — Three "file folders" stacked diagonally. Each step is a `--paper-deep` card with a gold-foil tab at top showing the step number in Cormorant SC (I., II., III.). Title in serif, body in sans. Connecting line: gold dashed `4 4`.
- **`ImpactStats`** — Large Cormorant numerals (96px, `--ink`), 1px gold underline, small-caps label below in `--gold-deep`. Four across, no card chrome, separated by 1px gold verticals. Felt: an annual-report page.
- **`Security`** — Single column, centered, max 720px. Eyebrow *"TRUST & CUSTODY"*. Body. A row of monochrome compliance marks (SOC 2 in progress, ALTA Best Practices, State Bar of GA) rendered as **embossed gold-foil outlines**, not full-color logos.
- **`Pricing`** — Two tiers only: **"Per File — $149"** and **"Firm Subscription — call"**. Receipt-style card: paper, gold rule top + bottom, Cormorant price, dotted gold leader lines between line items (`Title search ............ included`). No "Most popular" ribbon. Restraint.
- **`FAQ`** — Single-column accordion, 1px gold rule between items, plus/minus indicator in `--gold`. Question in Cormorant 22px, answer in Inter Tight.
- **`AboutAndPledge`** — Two-column: left is a tall portrait of the founder (B&W, sepia-toned to match paper), right is the pledge statement in Cormorant 28px with a gold-foil 10% medallion. Quietly proud, not garish. Pledge copy: *"Ten percent of every closing fee underwrites Georgia legal aid — because a house should not be lost for want of a lawyer."*
- **`CTA`** — Repeat the hero pattern: a single search bar on `--paper-deep` with a `--gold` frame. NOT a "Book a demo" block.
- **`Footer`** — see §5.

---

## 7. Imagery Guidance — Hero (commission via higgsfield-generate / GPT Image 2)

Three directions, pick ONE for launch:

**A. "The Signing Desk" (recommended).**
> Overhead 3/4 view of a walnut partner-desk in an Atlanta law office at 7:45am. Hand-stitched leather portfolio open, a signed warranty deed on cream legal paper, a Montblanc Meisterstück 149 fountain pen resting on the page, a brass banker's lamp with green glass shade just lit, a porcelain coffee cup steaming on a coaster. Soft amber window light from a Georgia magnolia outside, slight haze. Shallow depth of field. Color graded toward warm beige + brass. No people, no logos visible. 16:9, 2880×1620.

**B. "The Title Cabinet."**
> Eye-level shot of a tall oak file cabinet labeled with brass plates COBB · FULTON · DEKALB · GWINNETT. One drawer slightly open, manila folders with red string ties visible. Late-afternoon sun stripes across the cabinet face. Pure object photography, museum-quiet.

**C. "Peachtree Street, 7am."**
> Wide-angle ground-level of the Hurt Building / Candler Building stone facade on Peachtree at dawn, brass plaque "ATTORNEYS AT LAW" in foreground focus, street empty, soft golden hour. Use only if A and B feel too interior.

All three: shot warm, slight film grain, **NEVER** a handshake, NEVER a smiling stock-photo lawyer, NEVER a laptop on screen.

---

## 8. KILL List (current landing)

- Drop the `landing-grid-bg` graph-paper background. Plain `--paper` only.
- Drop the `landing-desk-surface` linear-gradient mock — replace with real commissioned photograph (§7).
- Drop the `landing-aol-stamp` animation in hero (it can live on a product-screenshot section deeper, but not at the top).
- Remove the blue (`--accent: #2563EB`) entirely from the marketing surface.
- Remove the peach palette (`--peach*`). Migrate to `--orange-ga`.
- Remove any "Talk to founder," "Watch 90-second demo," "See how it works" CTA above the fold. ONE search bar wins.
- Remove the existing tiny logo render (`width={28}` in `page.tsx`) — header logo is now 140px.
- Remove decorative emojis from value-prop strip, FAQ icons, etc. — the only emoji in the entire surface is the 🇺🇸 in the footer rail.

---

## 9. Logo Plan

- **Keep** the existing courthouse/serif "Cliros" wordmark in `app/public/logo.svg` and `logo-white.svg` — the mark itself reads correctly; it's the *scaling* that's broken.
- Audit needed: open both SVGs and confirm (a) viewBox set so the wordmark scales cleanly to 140px wide without cropping, (b) stroke colors mapped to `currentColor` (or hardcoded `--ink` / `--paper`), so the same file works on paper and obsidian backgrounds, (c) no embedded raster fallbacks.
- Add a **monogram lockup** (`logo-mark.svg`) — a single `C` set in Cormorant 600 inside a gold-foil double-ring, ~64px square. Used for: favicon, app icon, social share avatar, the pledge seal, the loading spinner. This is the asset the brand will live or die by on small surfaces; the wordmark is too horizontal for 32×32.
- Scales of use (canonical):
  - Header wordmark: **140px wide** (108px when scrolled).
  - Footer wordmark: **32px tall** (white variant).
  - Favicon / app icon: monogram, 32 / 192 / 512.
  - Social share OG: monogram top-left at 96px, headline below.
- Do NOT redesign the wordmark this sprint — scaling + monogram add unlocks 95% of the perceived quality lift.

---

## Handoff Checklist

1. Land tokens in `globals.css` (§1) + add Cormorant/Inter Tight via `next/font/google` in `app/layout.tsx`.
2. Refactor `Header.tsx` per §4. Fix the `width={28}` logo bug.
3. Rebuild hero in `page.tsx` per §3 — commission Image A (§7) first; ship behind a beige placeholder if not ready.
4. Restyle components in order: ValuePropStrip → HowItWorksSteps → ImpactStats → Security → Pricing → FAQ → AboutAndPledge → CTA → Footer.
5. Drop kills (§8) in the same PR.
6. Add `logo-mark.svg` and wire favicon set.
7. Verify on iPhone 14, MBP 14", and a 1080p external — beige must read as beige, not yellow, on each.

— end —
