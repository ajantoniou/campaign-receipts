# Caricature Placement Plan — cr-tx-senate-2026-superpacs

**Role:** Cinematic B-Roll Director + Thumbnail Designer (visual lead)
**Date:** 2026-06-01
**Founder direction (2026-06-01):** "Show candidate pictures — no reason not to for public figures. Show John Nau too. Pictures help connect the dots. Loved the b-roll of the candidate. Show Reid Hoffman image too."
**Decision:** Add book-style ink CARICATURES (in `public/brand/caricatures/`) of the named public figures so each NAME on screen gets a FACE next to its DOLLAR figure. No photoreal AI faces, no Wikimedia photos in-body — the cached caricatures are the canonical CR illustrated-mugshot style and match the navy/parchment in-video palette.

---

## Art-direction principles (apply to every placement)

1. **One face per beat, max two** (MoneyFlow source-vs-destination is the only 2-face case). Never crowd a card with text + money + two-plus heads.
2. **The caricature sits OPPOSITE the money / text weight** — it fills the empty plate margin, never overlaps the centered title/body or the big number.
3. **Connect the dots = name + face + dollar share one frame.** The viewer hears "John Nau," reads "John Nau," sees Nau's face, and sees "$7.9M" — four signals, one identity lock.
4. **Caricatures are chest-up on a near-transparent cream/white ground.** They must be matted into the navy plate cleanly: render them with a soft feathered edge / drop shadow so the cream paper doesn't read as a hard rectangle against navy. (Implementation note for orchestrator — see "TextSlate change required" below.)
5. **Steady hold only** — a 6% ken-burns push-in over the beat duration is allowed; NO jitter/shake (matches REMOTION-ONLY render doctrine).

---

## Per-figure placement table

| # | Figure | caricature_slug | Beat it appears on (NAMES them) | clip_id | How it appears | Screen position | Dollar it connects to |
|---|--------|-----------------|----------------------------------|---------|----------------|-----------------|----------------------|
| 1 | Ken Paxton | `ken-paxton` | The backfire punchline — "$39M against him; he won 64%" | **r1-06-he-won-result** (CountUp, "Paxton won / 64%") | corner inset over CountUp | bottom-RIGHT inset, ~26% frame-height | `64%` + the $39.3M-against him (the win that the money lost) |
| 2 | John Nau | `john-nau` | Beer-billionaire / Cornyn's money man | **r1-02-cornyn-nau** (TextSlate, "To protect John Cornyn") | inset in text card | bottom-LEFT margin (title is centered) | leads into `$7.9M` on the very next clip (r1-03) |
| 3 | John Cornyn | `john-cornyn` | "Built to protect John Cornyn — already had the job" | **r1-02-cornyn-nau** (same TextSlate) | SECOND inset beside Nau | bottom-RIGHT margin (mirror of Nau) | the seat the $39.3M was defending |
| 4 | James Talarico | `james-talarico` | "Lone Star Rising… money to lift up James Talarico" | **r2-01-walk-across** (TextSlate, "Lone Star Rising") | inset in text card | bottom-RIGHT margin | the $7.96M FOR him (paid out on r2-02 next) |
| 5 | Reid Hoffman | `reid-hoffman` | "one name behind it is Reid Hoffman… California" | **r2-02-lonestar-flow** (MoneyFlow) | SOURCE-node portrait | LEFT, anchored to the source card (left 6%) | `$1.5M` source check (his name+amount IS the source node) |
| 6 | Jasmine Crockett | `jasmine-crockett` | "$9M on ads AGAINST his rival Jasmine Crockett" | **r2-02-lonestar-flow** (same MoneyFlow) | DESTINATION-node portrait | RIGHT, beside the "Against Jasmine Crockett" card | `$8.95M` against her (the target of the money) |
| 7 | Wesley Hunt | `wesley-hunt` | NOT NAMED in v6 script — see disposition below | — | — | — | — |

---

## clip_id → caricature_slug mappings (machine-readable for the orchestrator)

These are the exact `caricature_slug` props to add to each clip in `eng/storyboards/cr-tx-senate-2026-superpacs.json`. Some clips carry TWO portraits, so the mechanism must accept a list (see implementation note).

```
r1-02-cornyn-nau     → caricature_slug: ["john-nau", "john-cornyn"]   (Nau bottom-left, Cornyn bottom-right)
r1-06-he-won-result  → caricature_slug: "ken-paxton"                  (bottom-right corner inset)
r2-01-walk-across    → caricature_slug: "james-talarico"             (bottom-right inset)
r2-02-lonestar-flow  → caricature_slug: ["reid-hoffman", "jasmine-crockett"]  (source=hoffman, dest[0]=crockett)
```

Single-portrait beats can use the existing scalar `caricature_slug` prop; the two two-portrait beats need a small extension (below).

---

## Per-beat composition detail

### r1-02-cornyn-nau — Nau + Cornyn dual inset (TextSlate, on AI plate)
- Title "To protect John Cornyn" is centered (TextSlate `padding: 0 160px` leaves both side margins empty).
- **Nau** caricature: bottom-LEFT, sized ~26% of frame height, feathered, drifts up 6% over the 22s beat. He is the one putting in the money — left = source-of-money read.
- **Cornyn** caricature: bottom-RIGHT, same size — he is the one being protected (the seat).
- Reads as: money-man (Nau, left) → protects → incumbent (Cornyn, right), with the title between them. This is the cleanest "connect the dots" frame in the video.
- Both insets must sit BELOW the body text baseline; if the body wraps to 3 lines, drop inset height to ~22% so heads clear the text. **The orchestrator should screenshot-verify this beat specifically.**

### r1-03-nau-countup — (no portrait)
- Pure `$7.9M` CountUp. Nau's face is already locked from the prior beat; adding it here would crowd the number. Leave clean. The face-to-number link is carried by adjacency (Nau on r1-02 → his $7.9M on r1-03).

### r1-06-he-won-result — Paxton victory inset (CountUp "64%")
- Big `64%` + "Paxton won" centered. Paxton caricature bottom-RIGHT corner, ~26% height, so the loud number and his face share the win frame.
- NOTE: r1-05 (the 6s WFAA fair-use victory soundbite) already shows real Paxton footage immediately before. The caricature on r1-06 is the *illustrated* echo of that win — keep it; it reinforces identity through the punchline, doesn't duplicate (one is live news, one is the CR ink stamp).

### r2-01-walk-across — Talarico inset (TextSlate, on AI plate)
- "Lone Star Rising" title centered; Talarico bottom-RIGHT (~26% height). He is who the money LIFTS UP — right-side "destination/beneficiary" read, mirroring Nau's left-side "source" read on r1-02 for visual rhyme.

### r2-02-lonestar-flow — Hoffman (source) + Crockett (target) on MoneyFlow
- MoneyFlow already has a SOURCE node on the LEFT (6%) and DESTINATION cards on the RIGHT.
- **Hoffman** caricature: matted INTO / directly ABOVE the source node (left), so his face = the "$1.5M / Reid Hoffman / California" check. Strongest dot-connect: the source of the money has a face now.
- **Crockett** caricature: beside the top destination card ("Against Jasmine Crockett · $8.95M") on the right — the money is flying at her face via the existing animated arrow.
- This turns the abstract money-flow diagram into "this man's check → aimed at this woman." Highest-value placement in the piece.

---

## Wesley Hunt — disposition (FLAG, do not invent)

Wesley Hunt is in the script's RECEIPTS header line but is **NOT named anywhere in the v6 spoken VO** (verified — no "Hunt" in `cr-tx-senate-2026-superpacs-v6-cadence.md`). Per cinematic-director doctrine ("the beat that NAMES them") and the AI-assumption rule, **I will NOT place a Hunt caricature on any beat** — there is no named moment to anchor it to, and dropping a face the narrator never says breaks the name→face→dollar contract.
- `wesley-hunt.png` stays cached/unused for this episode.
- If the founder wants Hunt in (he was a GOP runoff figure), that requires a SCRIPT change first (a named line + his role/dollar), then a beat to host him — not a silent visual insert. Escalate as a script decision, not a visual one.

---

## TextSlate / mechanism change REQUIRED (note for orchestrator to implement)

`produce-from-storyboard.py` resolves `caricature_slug` → copies the portrait into `remotion/public/cr-portraits/` and passes a `portrait` prop. **TextSlate does NOT currently render a `portrait` prop** (confirmed by reading `remotion/src/compositions/TextSlate.tsx` — no portrait handling). Three changes needed:

1. **TextSlate: add an optional `portraits` prop** — `Array<{ slug: string; corner: "bl" | "br"; heightPct?: number }>`. Render each as an `<Img>` matted into the named corner of the AbsoluteFill, BELOW the centered text block, with:
   - feathered/soft edge (radial-gradient mask) or a subtle drop shadow so the cream paper ground doesn't read as a hard rectangle on navy;
   - a 6% ken-burns push-in over the beat (same easing as `cardDrift`);
   - default `heightPct` 26, auto-reduced when `body` wraps ≥3 lines (or expose it per-beat).
   - It must composite ABOVE the `backgroundVideo` + scrim but visually behind/around the text — the gradient scrim already darkens center bands, so place portraits in the brighter lower-corner regions (keeps the black-frame gate margin and gives the ink art a light ground).

2. **MoneyFlow: add optional `source.portraitSlug` and per-destination `portraitSlug`** — render the portrait adjacent to (above/left of) the source node and beside the destination card respectively. Same feather/shadow treatment.

3. **`caricature_slug` must accept a LIST** for r1-02 (Nau+Cornyn) and r2-02 (Hoffman+Crockett). Either accept an array and map positionally, or add an explicit per-clip `portraits` block in the storyboard that the producer passes straight through. The explicit-block route is cleaner and avoids positional ambiguity — recommended:

```json
"portraits": [
  { "slug": "john-nau",    "corner": "bl", "heightPct": 24 },
  { "slug": "john-cornyn", "corner": "br", "heightPct": 24 }
]
```

4. **Black-frame gate (Stage 24.5):** unchanged — it runs on composited output; the ink portraits ADD luma to the lower corners, so they only help clear the gate. No new risk.

---

## Thumbnail note (Thumbnail Designer hat)

No change requested, but consistency check: the storyboard thumbnail still points at `public/photos/wikipedia/ken-paxton.jpg` (a Wikipedia PHOTO) while the in-video figures are now ink caricatures. For brand cohesion the thumbnail SHOULD use the `ken-paxton` **caricature** (`public/brand/caricatures/ken-paxton.png`) per the canonical CR thumbnail layout ("right 40%: book-style caricature, NOT a kling/photo"). Recommend swapping `thumbnail.portrait` → the caricature. **VERDICT on that swap: REVISE** (low-effort, raises cohesion). Flagging only — not in scope to render here.

---

## Summary for orchestrator

- 6 of 7 caricatures placed; Wesley Hunt held (not named in VO — script decision, escalate).
- 4 clips get portraits: `r1-02-cornyn-nau` (Nau+Cornyn), `r1-06-he-won-result` (Paxton), `r2-01-walk-across` (Talarico), `r2-02-lonestar-flow` (Hoffman+Crockett).
- Requires: TextSlate `portraits` prop + MoneyFlow portrait slots + list-form `caricature_slug`/`portraits` block in storyboard.
- Screenshot-verify `r1-02` (dual inset vs 3-line body) and `r2-02` (faces vs money-flow arrows) before master assembly.
- Recommend thumbnail portrait → ken-paxton caricature for cohesion.
