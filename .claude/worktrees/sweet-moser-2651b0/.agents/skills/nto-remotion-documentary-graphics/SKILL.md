---
name: nto-remotion-documentary-graphics
description: Use this skill whenever NTO/New Testament Only uses Remotion for episode graphics, quote cards, canon comparisons, timelines, source cards, subscribe cards, or explanatory animations. This skill prevents cheap 1995-game / PowerPoint / moving-board visuals by enforcing fixed documentary boards, internal-only animation, typography hierarchy, visual QC, and an explicit tool-choice gate that rejects Remotion when AI video, licensed stock, or cinematic footage is the better tool.
---

# NTO Remotion Documentary Graphics

Remotion is allowed in NTO only when it makes information clearer. It is not a substitute for cinematic footage.

The desired look is premium documentary information design: calm, legible, anchored, restrained. If it looks like a 1995 video game, PowerPoint, clip art, or a web dashboard, reject it and use a different tool.

## Tool Choice Gate

Before building a Remotion card, classify the beat:

| Beat type | Use Remotion? | Better tool |
| --- | --- | --- |
| Timeline, canon list, source citation, quote comparison, map label, textual contrast | Yes | Remotion |
| Marcion-specific story beat, Roman church conflict, scribes copying texts, shipbuilder identity, emotional rejection | No | Seedance / Kling / Higgsfield AI video |
| Atmosphere, room texture, desert, parchment, lamp, wind, water | Usually no | AI video or licensed stock |
| Human faces, bodies, walking, gesture, emotion | No | AI video / character-motion |
| Static mood fill because the editor needs coverage | No | Rewrite storybook; use AI or licensed stock |

If Remotion is not clearly the right tool, write `REJECT_REMOTION_USE_AI_OR_STOCK` in the visual plan and name the replacement tool.

## Fixed-Board Rule

The board stays fixed in frame.

Do not apply whole-screen:

- ken burns
- moving crop
- zoompan
- sinusoidal x/y crop
- handheld drift
- fake camera shake
- board-scale pulsing

Animate only internal elements:

- arrows
- underlines
- stamps
- timeline ticks
- labels
- cards sliding inside the board
- highlight boxes
- chained links
- source tabs
- subtle grain or dust

Storybook filter for Remotion cards should normally be:

```text
scale=1920:1080:flags=lanczos,noise=alls=2:allf=t,format=yuv420p
```

If `freezedetect` complains, add internal animation or temporal texture inside the Remotion render. Do not move the whole board.

## Visual Standard

Every NTO Remotion card must pass these checks:

- It looks like a serious documentary graphic, not a game UI.
- Text is readable at 1080p and still readable in a 480px-wide contact sheet.
- No text overlaps. No cropped top bars. No bottom labels crashing together.
- There are no glowing neon outlines, bevels, fake 3D buttons, arcade colors, or glossy UI panels.
- The palette is restrained: parchment, ink, dark wood, warm stone, muted red for rejection/removed, muted green for kept.
- Typography has hierarchy: one headline, one supporting line, small labels only where nonessential.
- The board is not crowded. If the idea needs more than 3-4 text groups, split it into multiple cards.
- The card explains one idea only.

## Animation Grammar

Use 2-4 internal moves per card:

1. Establish the board.
2. Reveal the key contrast.
3. Mark the verdict or relation.
4. Hold long enough to read.

Good examples:

- `1 Gospel` appears, then arrow points to `4 Gospels`, then `REJECTED` stamps Marcion's side.
- Timeline ticks reveal `144 AD`, `367 AD`, `1945`, then a small highlight lands on the active date.
- `Eye for an eye` fades down while `turn the other cheek` brightens.

Bad examples:

- Whole card slowly zooms around the frame.
- Text floats randomly.
- Every element animates at once.
- A card holds 20+ seconds with no internal change.
- Animated diagram sits on top of busy b-roll and becomes unreadable.

## Render And QC Workflow

1. Render the Remotion clip.
2. Extract three frames: early, middle, late.
3. Inspect those frames at full size and as a small contact sheet.
4. Check for text overlap, cropped text, illegible labels, distracting movement, and cheap-game styling.
5. If the card fails, fix the card or reject Remotion for this beat.

Minimum proof artifact:

```text
_review/<slug>-remotion-qc/contact.jpg
_review/<slug>-remotion-qc/verdict.md
```

The verdict must say one of:

- `PASS_FIXED_BOARD`
- `REVISE_REMOTION`
- `REJECT_REMOTION_USE_AI_OR_STOCK`

## NTO-Specific Rules

- Remotion is for ideas James is explaining, not for emotional story beats.
- Do not use Remotion to avoid spending on AI video when the beat needs a scene.
- Do not use Remotion to cover cheap b-roll.
- Do not use old black-and-white b-roll under Remotion unless the archival look is intentional.
- Keep `NEW TESTAMENT ONLY` brand material restrained and documentary, not YouTuber-gaming.

## When To Pick Another Tool

Use AI video instead when the narration says:

- Marcion was cast out.
- His books were burned.
- He had one Gospel and Paul's letters.
- The church defended four Gospels.
- Paul was separated from the Old Testament.
- The church bound the Old Testament to the New.
- Miriam/James carries emotional weight.

Use Remotion only for the explanatory visual that sits on top of those ideas: labels, diagrams, citations, dates, and contrasts.
