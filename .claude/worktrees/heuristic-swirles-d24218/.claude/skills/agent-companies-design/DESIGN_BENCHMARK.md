# Design Benchmark — AgentCompanies

The full visual system for the portfolio. Read this once; reuse across every sibling site. Per-site variations are noted inline.

## Metaphor

**Paper audit document.** Every surface should feel like a primary-source artifact you'd find in a court filing, an FOIA response, or a published methodology worksheet. Not a SaaS dashboard. Not a venture-funded landing page. The signals:

- **Perforated edges** on receipt-style cards
- **Dotted leaders** between key/value pairs (the `…` between a name and a page number in an index)
- **Dashed dividers** between document sections
- **Tilted, double-bordered verdict stamps** (rubber-stamp aesthetic)
- **Mono micro-caps** everywhere data labels live
- **Italic Instrument Serif** for editorial emphasis and pull-quotes
- **Real-feeling document IDs** (`RCPT-2016-008-v3`, `CR-DISPUTE-XX`, `WORKSHEET v3`)

## Palette

Three paper variants. Pick one per site, never mix. All share the same ink and verdict colors.

### Paper — Warm (default for Campaign Receipts)
| Token | Hex |
|---|---|
| `--paper`     | `#FAF6EF` |
| `--paper-2`   | `#F4EEDF` |
| `--paper-3`   | `#EBE3D0` |
| `--line`      | `#E0D8C3` |
| `--line-soft` | `#ECE5D2` |

### Paper — Cool (alt option, fintech-coded)
| Token | Hex |
|---|---|
| `--paper`     | `#F4F6F8` |
| `--paper-2`   | `#EAEEF2` |
| `--paper-3`   | `#DDE3EA` |
| `--line`      | `#D6DCE3` |
| `--line-soft` | `#E5EAF0` |

### Paper — Sage (editorial / nature)
| Token | Hex |
|---|---|
| `--paper`     | `#F5F7F2` |
| `--paper-2`   | `#E9EEE2` |
| `--paper-3`   | `#DCE3D0` |
| `--line`      | `#CFD7C0` |
| `--line-soft` | `#E0E6D5` |

### Ink (same across all paper variants — adjust by ±1 step if needed)
| Token | Warm | Cool | Sage |
|---|---|---|---|
| `--ink`   | `#1A1815` | `#161A1E` | `#171A14` |
| `--ink-2` | `#3D3833` | `#363C42` | `#363C30` |
| `--ink-3` | `#6E665C` | `#5F676E` | `#65695B` |
| `--mute`  | `#9A9082` | `#8A919A` | `#8E9385` |

### Verdict palette — FIXED across all sites

This is the family's emotional core. **Never vary these across sites.** They're intentionally not red/blue to keep nonpartisan framing.

| Verdict | Stroke (color) | Bg | Tint (fills) | Use |
|---|---|---|---|---|
| **Kept**     | `#4F7A4B` (sage)  | `#DCE8D2` | `#EEF3E2` | Promises kept, claims met, positives |
| **Partial**  | `#A37222` (amber) | `#F1DDB3` | `#F6EAC9` | Partial / mixed verdicts |
| **Broken**   | `#A8423E` (coral) | `#F1CFCC` | `#F4DDDA` | Broken / overrun / negatives |
| **Pending**  | `#4F6480` (slate) | `#D2DBE6` | `#E1E7EE` | In progress, live tracking |
| **You Decide** | `#5C5246` (olive)| `#DCD3BF`| `#E8E0CC` | Ambiguous, contested, neutral |

Rename labels per site (e.g. EstimateProof might use "Met / Close / Over"), but keep the 5-tier structure and these exact colors.

### Highlight tint (the hero underline color — vary per site)
- Default: Amber `--partial-bg: #F1DDB3`
- Rose alt: `#F1CCC6`
- Blue alt: `#C8D4E6`

## Typography

### Families — FIXED

| Family | Use | Weights |
|---|---|---|
| **Instrument Serif** | Display, headlines, blockquotes, big numbers | 400 (italic for em) |
| **Geist**            | Body, UI labels, CTAs | 300 / 400 / 500 / 600 / 700 |
| **Geist Mono**       | Receipt data, eyebrows, IDs, dates, micro-caps | 400 / 500 |

Load via Google Fonts:
```
https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@0,400;1,400&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap
```

### Scale

**Display (Instrument Serif):**
| Element | Size | Line-height | Tracking |
|---|---|---|---|
| Hero H1                  | 84–92px | 0.95 | -0.025em |
| Section H2               | 56–72px | 1.0  | -0.02em  |
| Card / Method H3         | 24–32px | 1.1  | -0.01em  |
| Receipt title            | 22–26px | 1.15 | -0.01em  |
| Stat number (in tile)    | 76px    | 1.0  | -0.03em  |
| Stat number (share tile) | 220–360px | 0.9 | -0.04em |
| Blockquote (body)        | 26px    | 1.25 | -0.01em  |
| Blockquote (share tile)  | 64px    | 1.15 | -0.015em |

**Body (Geist):**
| Element | Size | Line-height | Weight |
|---|---|---|---|
| Lede           | 18–22px | 1.5  | 400 |
| Body           | 14–16px | 1.55–1.65 | 400 |
| UI label / CTA | 13–14px | 1.0  | 500 |
| Meta caption   | 12px    | 1.4  | 400 |

**Micro-caps (Geist Mono):**
- 10–11px, `text-transform: uppercase`, `letter-spacing: 0.14–0.18em`, color `--ink-3`
- The recurring "audit document" texture — use on every eyebrow, ID, date, table header, footer mark
- Wider tracking (0.18–0.22em) for footer manifesto lines: `RECEIPTS / NOT / RHETORIC`

## Spacing

- **Section vertical padding (desktop)**: 96px
- **Section horizontal padding (desktop)**: 48px
- **Card padding**: 28–36px
- **Gap between cards in a grid**: 20px
- **Gap inside a card** (header → body → footer): 14–22px

## Radii

| Token | Value | Use |
|---|---|---|
| `--r-sm` | 4px  | Tags, stamps, small chips |
| `--r`    | 8px  | Default for inputs, small cards |
| `--r-lg` | 14px | Cards, receipts, large containers |
| —        | 999px | Buttons (pill), eyebrow pills, party tags |

## Shadows

```css
--shadow-paper: 0 1px 0 rgba(26,24,21,0.04),
                0 12px 28px -18px rgba(26,24,21,0.18);
```

Apply to elevated cards (Receipts, share tiles). Avoid heavy shadows — the system reads as flat paper.

## Patterns & Textures

### Dotted-grid hero background
```css
background-image: radial-gradient(circle at 1px 1px, rgba(26,24,21,0.07) 1px, transparent 0);
background-size: 28px 28px;
opacity: 0.35;
mask-image: linear-gradient(to bottom, transparent, black 25%, black 75%, transparent);
```

### Perforated edges (Receipt cards)
```css
.receipt::before, .receipt::after {
  content: ""; position: absolute; left: 0; right: 0; height: 12px;
  background-image: radial-gradient(circle at 6px 6px, var(--paper) 6px, transparent 6px);
  background-size: 14px 12px;
  background-repeat: repeat-x;
}
.receipt::before { top: -6px; }
.receipt::after  { bottom: -6px; }
```

### Dotted leader (between key and value)
```css
.receipt-row .leader {
  flex: 1; margin: 0 8px;
  border-bottom: 1.5px dotted var(--line);
  transform: translateY(-3px);
}
```

### Pulse dot (live indicator)
```css
@keyframes pulse {
  0%   { transform: scale(0.9); opacity: 0.5; }
  100% { transform: scale(1.8); opacity: 0; }
}
```

## Voice & Copy

### Manifesto lines (use sparingly, one per surface max)
- "**Receipts, not rhetoric.**"
- "**Every promise. Every receipt.**"
- "**Bring receipts.**" (CTA voice)

### Tone rules
- **Editorial, dry, source-cite-y.** Never partisan. Never moralizing.
- **Use Instrument Serif italic for emphasis,** not bold sans. Italic in serif reads "editorial." Bold sans reads "marketing."
- **Lead with concrete numbers** in paragraph copy. ("282 promises. 1,114 sources. 14 corrections, all logged.")
- **Use mono micro-caps for any metadata** the reader doesn't need to read in full — dates, IDs, source counts. These create the "scanned document" texture without forcing attention.
- **Disclose disclosures.** Funding policy, party-affiliation history of editors, correction log — say it loudly. Transparency is the trust mechanism.

### Headline patterns
- "**Every X. Every Y.**" (the family hook structure)
- "**X. *not Y.*** " (manifesto with italic counterpoint)
- "**Look it up. *Bring receipts.*** " (CTA closer)
- "**We've been wrong, in public.**" (the trust-through-humility move)

### Numeric formatting
- Tabular nums (`font-variant-numeric: tabular-nums`) on any column-aligned data
- Comma separators above 9,999
- Percentages with one decimal (`48.2%` not `48%`)
- Dollar amounts in mono for receipts/ledgers, in Instrument Serif for hero stats

## Brand wordmark template

`<Site>·<Word>` with a 7px ink dot replacing the middle space. Inline-flex baseline-aligned. Dot has `transform: translateY(-4px)` to sit visually centered with the cap height. Optional micro-cap tag pill (e.g. `BETA`, `v3`) appended right.

For each site:
- **Campaign·Receipts** — paper-warm palette, amber highlight
- **Sealed·2016** — paper-warm palette, coral wax-seal accent
- **Estimate·Proof** — paper-cool palette, slate highlight (estimates have a numerical, fintech feel)

## Layout grids

- **Desktop landing**: 1440 wide, 48px horizontal padding, content max 1344
- **Hero**: 2-column 1.05fr / 1fr OR centered single-column for non-product pages (pricing/about)
- **Stat grid**: 4 columns at 1440, 2 at 1024, 1 below 768
- **Method grid**: 3 columns at 1440, 2 at 1024, 1 below 768
- **Comparison table**: borders use `--line-soft` between rows (denser than `--line` between sections)

## Responsive rules

| Breakpoint | Changes |
|---|---|
| ≥1280px      | Designed grids as-is |
| 768–1279px   | Hero → 1 col (receipt below copy). H2 → 40px. StatTile grid → 2 cols. Method → 2 cols. Hide Distribution column on Leaderboard. Footer → 2 cols. |
| <768px       | Nav → hamburger. All grids → 1 col. Hero H1 → 56px. H2 → 32px. Stat number → 56px. Pricing tiers stack. Comparison table → per-tier mobile cards. |

The Receipt component should **never shrink below 320px wide** — render a simple-list fallback below that.

---

## Open variations worth exploring per site

When designing a new sibling, these are reasonable axes to vary:
- **Hero metaphor**: book mock (SEALED) / ledger book / court filing / invoice / methodology worksheet
- **Receipt field set**: which 5–7 K/V rows live in the body
- **Verdict labels**: rename to fit the domain
- **Press strip composition**: editorial italic + small-caps wire-service mix
- **Trust hero**: "what makes us non-negotiable?" — corrections log? source ledger? methodology rubric? funding disclosure?

Hold everything else constant.
