# Components — AgentCompanies

Every primitive in the family vocabulary. Build these in your codebase before composing pages. Source-of-truth implementations live in `references/campaign-receipts-*.{jsx,css}`.

---

## Wordmark

`<Site>·<Word>` with a 7px ink dot replacing the middle space.

**Anatomy:**
- `display: inline-flex; align-items: baseline; gap: 6px`
- Wordmark: Instrument Serif 22px, tracking `-0.015em`, color `--ink`
- Dot: 7×7px circle, `background: var(--ink)`, `transform: translateY(-4px)` (sit visually centered with cap-height)
- Optional tag pill: Geist Mono 10px, uppercase, tracking `0.16em`, color `--ink-3`, `border: 1px solid var(--line)`, padding `3px 6px`, radius 3px, `transform: translateY(-2px)`

**Props:** `size`, `tag` (e.g. `BETA`, `v3`), `inverse` (swaps to paper-on-ink for dark surfaces)

---

## Stamp (verdict)

The signature component. A pill with the verdict's color setting border + text + leading dot, all via `currentColor`.

**Anatomy (base):**
- `display: inline-flex; align-items: center; gap: 8px`
- Geist Mono 11px, uppercase, tracking `0.15em`, weight 600
- `padding: 8px 12px`
- `border: 1.5px solid currentColor`
- `border-radius: 4px`
- Leading 7×7px dot in `background: currentColor`

**Five kinds** — each sets `color` to the verdict stroke and `background` to the verdict tint:
- `kept`     → color `--kept`,    bg `--kept-tint`
- `partial`  → color `--partial`, bg `--partial-tint`
- `broken`   → color `--broken`,  bg `--broken-tint`
- `pending`  → color `--pending`, bg `--pending-tint`
- `decide`   → color `--decide`,  bg `--decide-tint`

**Modifiers:**
- `lg` → 14px font, `padding: 10px 16px`, tracking `0.18em`
- `tilted` → **the signature variant.** `transform: rotate(-3deg)`, `border-style: double; border-width: 3px`, `padding: 12px 18px`, `box-shadow: 0 0 0 2px var(--paper), 0 0 0 3.5px currentColor`. This creates the rubber-stamp ring effect.

**Props:** `kind`, `lg`, `tilted`, `children` (override label)

---

## Tag

Mono micro-pill for inline labels (party affiliation, category, status).

**Anatomy:**
- `display: inline-flex; align-items: center; gap: 6px`
- Geist Mono 10px, uppercase, tracking `0.14em`
- `padding: 4px 8px`, `border-radius: 3px`
- `border: 1px solid var(--line)`, color `--ink-3`, bg `--paper`

**Party variants** (use intentionally — these are the only place red/blue-coded tints appear, and only as muted background tints on a tiny chip):
- `party-r` → color `--broken`, border `--broken-bg`, bg `--broken-tint`
- `party-d` → color `--pending`, border `--pending-bg`, bg `--pending-tint`
- `party-i` → color `--decide`, border `--decide-bg`, bg `--decide-tint`

---

## Button

Two variants. Always pill-shaped.

**Primary:**
- `background: var(--ink); color: var(--paper)`
- `padding: 14px 22px; border-radius: 999px`
- Geist 14px, weight 500
- `border: 1px solid var(--ink)`
- Hover: `background: var(--ink-2)`

**Secondary:**
- `background: transparent; color: var(--ink)`
- `padding: 13px 21px; border-radius: 999px`
- Geist 14px, weight 500
- `border: 1px solid var(--line)`
- Hover: `border-color: var(--ink); background: var(--paper-2)`

Both: `display: inline-flex; align-items: center; gap: 8px` for arrow icons / kbd hints.

---

## Receipt

**The hero component.** Used on landing hero, share tiles, about page worksheets, detail pages. Don't reinvent it for any data-row context.

**Anatomy (top to bottom):**

1. **Perforated top edge** (`::before`)
   - `position: absolute; top: -6px; left: 0; right: 0; height: 12px`
   - `background-image: radial-gradient(circle at 6px 6px, var(--paper) 6px, transparent 6px)`
   - `background-size: 14px 12px; background-repeat: repeat-x`

2. **Head** (`padding: 22px 26px 14px; border-bottom: 1.5px dashed var(--line)`)
   - Flex between, items flex-start
   - Left: mono ID (10px uppercase tracking 0.16em color --ink-3) + Instrument Serif title (26px tracking -0.01em, max-width 80%)
   - Right: category + party Tag (right-aligned)

3. **Body** (`padding: 16px 26px 14px`)
   - Series of **RRow** components (key/value with dotted leader)
   - Optional `<hr class="receipt-divider">` (dashed) between row groups

4. **Verdict band** (`padding: 18px 26px 22px; background: var(--paper-2); border-top: 1.5px dashed var(--line)`)
   - Flex row: tilted Stamp + sans body copy explaining the verdict

5. **Footer** (`padding: 12px 26px 18px`)
   - Mono 10px uppercase tracking 0.14em, color --ink-3
   - Flex between: manifesto line (★ Receipts, not rhetoric) + canonical URL (`campaignreceipts.com / RCPT-ID`)

6. **Perforated bottom edge** (`::after`) — same as top, positioned `bottom: -6px`

**Card container:**
- `background: var(--paper); border: 1px solid var(--line)`
- `border-radius: var(--r-lg)`
- `position: relative; overflow: hidden`
- `box-shadow: var(--shadow-paper)`
- `font-family: var(--mono)` (default body inherits mono; selectively override to sans for the verdict body and footer human-text)

**`compact` prop**: drops the secondary block (receipts cited / last audited / editor) — used in share tiles where space is tight.

---

## RRow (Receipt Row — k/v with dotted leader)

The receipt's body-row primitive. Also reusable for any specification list (about page methodology, source ledger).

**Anatomy:**
- `display: flex; align-items: baseline; padding: 7px 0; font-size: 12px`
- **Key** (`.k`): Geist Mono 10px uppercase tracking 0.1em color `--ink-3`, `flex-shrink: 0`
- **Leader** (`.leader`): `flex: 1; margin: 0 8px; border-bottom: 1.5px dotted var(--line); transform: translateY(-3px)`
- **Value** (`.v`): Geist Mono 12px (default) weight 500 color `--ink`, right-aligned. `mono={false}` switches family to Geist sans.

---

## StatTile

The viral-ready stat card.

**Anatomy:**
- `background: var(--paper); border: 1px solid var(--line); border-radius: var(--r-lg)`
- `padding: 28px 28px 26px; position: relative; overflow: hidden`

Top to bottom:
1. **Meta row**: Geist Mono 10px uppercase tracking 0.16em color `--ink-3`, with leading 6×6 ink-3 dot
2. **Number**: Instrument Serif 76px tracking `-0.03em` line-height 1, margin-top 18px. Optional `<small>` suffix at 28px color `--ink-3` for units (`%`, `/282`)
3. **Label**: Geist 14px color `--ink-2` line-height 1.4, max-width 280px

**Modifiers:**
- `fill={'kept'|'partial'|'broken'|'pending'}` → swaps card bg to the verdict's tint
- `corner` prop → top-right micro-chip: mono 9px uppercase, `border: 1px solid var(--line); padding: 4px 7px; border-radius: 3px` (use for "↗ +312 this mo" / "Audited" / "Verified" callouts)

---

## Leaderboard + BoardRow

A ranked table that doubles as a viral share artifact.

**Container** (`.board`):
- `background: var(--paper); border: 1px solid var(--line); border-radius: var(--r-lg); overflow: hidden`

**Header row** (`.board-head`):
- `grid-template-columns: 40px 1fr 100px 100px 100px 110px`
- `padding: 14px 24px`
- Geist Mono 10px uppercase tracking 0.14em color `--ink-3`
- `background: var(--paper-2); border-bottom: 1px solid var(--line)`

**Data row** (`.board-row`):
- Same grid, `padding: 18px 24px; align-items: center`
- `border-bottom: 1px solid var(--line-soft)` (none on last)
- Hover: `background: var(--paper-2)`

**Cell anatomy:**
- **Rank**: Geist Mono 13px color `--ink-3` weight 500 (`#01`, `#02`, zero-padded)
- **Name**: flex row gap 12px. Avatar 32×32 circle, `background: var(--paper-3); border: 1px solid var(--line)`, initials in Geist Mono 11px color `--ink-2`. Name text Instrument Serif 20px tracking `-0.01em`. Sub-text below: Geist sans 11px uppercase tracking 0.1em color `--ink-3` + inline party Tag.
- **Counts** (kept/partial/broken): Geist Mono 14px weight 500. **Each colored to its verdict** (`.count.kept` → color `--kept`, etc.)
- **Distribution**: 6px stacked horizontal bar (`border-radius: 99px; overflow: hidden`), segments in verdict colors with `width: ${pct}%`. Below: Geist Mono 10px color `--ink-3` showing total ("64 promises").

---

## MethodCard

The methodology step card (used in methodology grids and how-it-works sections).

**Anatomy:**
- `background: var(--paper); border: 1px solid var(--line); border-radius: var(--r-lg); padding: 28px`
- Top: Geist Mono 11px tracking 0.14em color `--ink-3`, format `— 01` (em-dash + zero-padded number), margin-bottom 28px
- H3: Instrument Serif 28px tracking `-0.01em` line-height 1.1 weight 400, margin-bottom 12px
- Body: Geist 14px color `--ink-2` line-height 1.55

Optional decorative: giant Roman numeral watermark in top-right (Instrument Serif 88px, color `--ink`, opacity 0.12) for "principle" cards.

---

## QuoteTile

Pull-quote card. Used on landing for press validation, on share tiles as the tweet-graphic.

**Anatomy:**
- `background: var(--paper); border: 1px solid var(--line); border-radius: var(--r-lg)`
- `padding: 32px 32px 24px; position: relative; box-shadow: var(--shadow-paper)`

Layers:
1. **Decorative quote mark** (`.qmark`): Instrument Serif 80px line-height 0.5, color `--partial` opacity 0.4, `position: absolute; top: 36px; left: 28px`
2. **Blockquote**: Instrument Serif 26px tracking `-0.01em` line-height 1.25, `padding-left: 22px` to clear the quote glyph, margin `12px 0 22px`, color `--ink`
3. **Attribution row** (`.qsrc`): Geist Mono 10px uppercase tracking 0.14em color `--ink-3`, `border-top: 1.5px dashed var(--line); padding-top: 14px`. Flex row with author left, source right.

**Share-tile variant** (1080×1080):
- `--ink` background, `--paper` text
- Quote glyph 200px in amber `--partial` opacity 0.6
- Blockquote 64px Instrument Serif
- Attribution row 14px mono, opacity 0.6, with leading em-dash and dot-separators between fields
- Tilted Stamp + verdict context strip at bottom
- Wordmark + URL stamp inside the crop

---

## ShareTile (1080-sized social artifacts)

Standalone OG-image-style components. Render server-side as PNGs via Satori, `@vercel/og`, or Playwright at the dimensions below. **Every tile must include the wordmark + canonical URL inside the crop area.**

| Tile | Dimensions | Layout |
|---|---|---|
| **TileBigStat** | 1080×1080 | Mono eyebrow top-left + tilted Stamp top-right → giant Instrument Serif number (360px) with `<sup>/total</sup>` → Instrument Serif sentence (56px) → mono sources line → brand stamp bottom-left |
| **TileReceiptCard** | 1080×1350 | Wordmark + RCPT ID top → full Receipt component (compact) → 3-col footer stats with mono labels + Instrument Serif values → centered canonical URL |
| **TileLeaderboard** | 1080×1350 | Mono eyebrow → 72px H2 hook → 5 ranked rows (Instrument Serif rank number on left, name+bar in middle, big score on right) → brand stamp |
| **TileQuote** | 1080×1080 | Inverted (`--ink` bg, `--paper` text) → mono eyebrow → 200px amber quote glyph → 64px Instrument Serif blockquote → mono attribution row → bottom strip with tilted Stamp + verdict context + brand stamp |

**Brand stamp** (inside every share tile):
```
[Wordmark] | campaignreceipts.com
```
Wordmark in Instrument Serif 20px, separator pipe is a `1px var(--line)` left border, URL in Geist Mono 11px uppercase tracking 0.16em color `--ink-3`.

---

## Nav

**Anatomy:**
- `display: flex; align-items: center; justify-content: space-between`
- `padding: 22px 48px; border-bottom: 1px solid var(--line); background: var(--paper)`
- `position: sticky; top: 0; z-index: 50`

Three regions:
- **Left**: Wordmark (with optional `BETA` tag)
- **Center**: 6 nav links, `gap: 30px`. Each: Geist 14px color `--ink-2`, `border-bottom: 1px solid transparent` (active or hover → border `--ink` + color `--ink`)
- **Right**: Pill CTA — primary button anatomy + Cmd-K hint (`⌘K` opacity 0.5)

---

## Footer

**Anatomy:**
- `padding: 64px 48px 36px; background: var(--ink); color: var(--paper)`
- 5-column grid: `1.5fr 1fr 1fr 1fr 1fr`, gap 48px
- Column 1: inverse Wordmark + tagline paragraph + mono copyright/version
- Columns 2–5: Geist Mono 11px uppercase tracking 0.16em opacity 0.6 `h4` labels + Geist 14px link list (links at opacity 0.7, hover opacity 1)
- Bottom strip (after `1px solid rgba(250,246,239,0.15)` divider): flex between. Manifesto line in mono caps `RECEIPTS / NOT / RHETORIC` + funding disclosure right.

---

## Source list

For about/methodology pages and worksheet renders. Lists primary-source documents that justify a verdict.

**Anatomy:**
- `<ul>` with no list style
- Each `<li>`: `padding: 10px 0; border-bottom: 1px dotted var(--line); display: flex; align-items: baseline; gap: 14px`
- Geist Mono 12px color `--ink-2`
- **Source-tag chip** (left): mono 10px uppercase tracking 0.14em, color `--ink-3`, `border: 1px solid var(--line); padding: 2px 6px; border-radius: 3px`. Common tags: `CBP`, `GAO`, `EO`, `Vid`, `Doc`, `Bill`, `Court`.
- **Label** (middle, flex 1): color `--ink`
- **Date** (right): mono 10px color `--ink-3` tracking 0.06em

---

## Press strip

Horizontal flex of "as cited by" publication marks.

**Anatomy:**
- `padding: 36px 48px; background: var(--paper-2); border-bottom: 1px solid var(--line)`
- Flex row, gap 56px, align center
- Left: Geist Mono 10px uppercase tracking 0.18em color `--ink-3` label
- Logos: alternating Instrument Serif italic (for editorial brands — Atlantic, ProPublica, Reuters) and Geist 13px bold uppercase tracking 0.22em (for wire services — POLITICO, AP, NPR)

Replace typeset placeholders with real licensed SVG logos before launch.

---

## Composition: how primitives combine into pages

See `references/campaign-receipts-landing.jsx`, `pricing.jsx`, `about.jsx` for canonical compositions. Section pattern is consistent:

```
.section {
  padding: 96px 48px;
  border-bottom: 1px solid var(--line);
}
```

Each section opens with:
1. **Section eyebrow** — mono with leading 24×1 dash line
2. **H2** — Instrument Serif 56px
3. **Lede** — Geist 18px color `--ink-2`, max-width 640px, margin-bottom 56px

Alternate section backgrounds between `--paper` and `--paper-2` for visual rhythm. Never more than 2 colors in a row.

---

## CSS class index (from `references/campaign-receipts-styles.css`)

If porting verbatim, these are the canonical class names:

- `.wordmark`, `.wordmark .dot`, `.wordmark .mono-tag`
- `.nav`, `.nav-links`, `.nav-cta`
- `.hero`, `.hero-eyebrow`, `.hero-sub`, `.hero-actions`, `.hero-meta`, `h1.headline`, `h1.headline .underline`
- `.btn-primary`, `.btn-secondary`
- `.receipt`, `.receipt-head`, `.receipt-body`, `.receipt-row`, `.receipt-divider`, `.receipt-verdict`, `.receipt-foot`
- `.receipt-row .k / .leader / .v`
- `.stamp`, `.stamp.kept/partial/broken/pending/decide`, `.stamp-lg`, `.stamp-tilted`
- `.section`, `.section-eyebrow`, `.lede`
- `.stat-tile`, `.stat-tile .meta/num/lbl/corner-mark`, `.stat-tile.fill-{kept,partial,broken,pending}`
- `.board`, `.board-head`, `.board-row`, `.bar`, `.bar .seg.{kept,partial,broken,pending}`
- `.method-grid`, `.method-card`
- `.press`, `.press-logos`
- `.foot`, `.foot-grid`, `.foot-bottom`
- `.price-grid`, `.price-card`, `.price-card.featured`, `.pprice`, `.feats`
- `.quote-tile`, `.qmark`, `.qsrc`
- `.source-list`, `.src-tag`, `.src-date`
- `.share-tile`, `.brand-stamp`
- `.bignum`, `.tag`, `.tag.party-{r,d,i}`
- `.dotted-divider`, `.kbd`, `.read-bar`
