# Kerry caption + 90% chart — founder-flagged claims investigation

> Investigated 2026-05-21 by direct frame extraction from
> `_build/sealed-aipac-iran-deal-v2/master-with-sarah.mp4`.
> Frames saved at `_build/sealed-aipac-iran-deal-v2/qc-frames/`.

## Claim 1: "showed Senator Kerry in the 3 minute+ mark"

**Frame:** s8-02 at 3:02 (`qc-frames/s8-02-kerry.jpg`)
**Verdict:** FALSE POSITIVE — no caption present.

The frame is the Wikimedia Kerry photo (kling-i2v animated), full-face,
gray hair, dark suit, US flag lapel pin. No on-screen text labeling him
"Senator" or "Secretary of State." Image is consistent with SecState-era
(2013-2017) given the gray hair and ceremonial flag pin.

Founder may have mentally captioned the frame based on:
- Long-form memory of Kerry as Senator (1985-2013)
- A VO line at that timestamp that referenced his Senate-era voting record

Recommendation: no visual fix needed on the Kerry frame itself. If the
VO at this beat refers to him as anything other than "Secretary Kerry"
or "Secretary of State Kerry" in a JCPOA context, that's a separate VO
issue — verify in the Scribe transcript.

## Claim 2: "after deal chart was 90% then you showed 60%"

**Frames:**
- s2-01 at 0:13 (`qc-frames/s2-01-bar-chart-90pct.jpg`)
- s9-03 at 3:37 (`qc-frames/s9-03-source-60pct.jpg`)

**Verdict:** STRUCTURAL FAIL despite QC literal-pass.

The s2-01 chart shows two bars:
- Small blue bar labeled "3.67% / UNDER DEAL"
- Tall red bar labeled "90% / WEAPONS-GRADE THRESHOLD"

The label is literally correct (90% IS the weapons-grade threshold; it's
not claimed as Iran's actual level). But the visual reads as "Iran
reached 90%" because:
1. The asymmetry is extreme (the 90% bar is ~5× the height of 3.67%)
2. "WEAPONS-GRADE THRESHOLD" is in small subtitle type below the "90%"
3. The actual post-withdrawal figure (60%) doesn't appear until 3:37 —
   210 seconds later, in a text-only source card

A casual viewer at 0:13 takes away "Iran reached 90%." The literal QC
pass on this clip was misleading because the QC checked "is 90% labeled
correctly" but not "does the composition imply something different than
what it labels."

**Fix for v4:** rebuild s2-01 as Remotion ChartBar showing the actual
progression — 3.67% (under deal) → 60% (after withdrawal). 90% appears,
if at all, as a faint horizontal dashed reference line, NOT a competing
bar, and only after 60% has been shown.

**Promoted to QC rule** (`personas/council/05-fact-check-qc.md` updated
2026-05-21): "weapons-grade threshold reference can only appear AFTER
the actual figure (60%) has been shown" — closes the
literally-correct-but-structurally-misleading gap.

## Net impact on v4 storyboard

- s8-02 Kerry: no changes
- s2-01 enrichment chart: REBUILD via Remotion ChartBar with corrected
  composition. New props:
  ```json
  {
    "bars": [
      {"label": "Under JCPOA",          "value": 3.67, "suffix": "%", "color": "civic-blue"},
      {"label": "After US withdrawal",  "value": 60,   "suffix": "%", "color": "civic-red"}
    ],
    "reference_lines": [
      {"value": 90, "label": "weapons-grade threshold", "style": "dashed-faint"}
    ],
    "yAxisLabel": "URANIUM ENRICHMENT %",
    "maxValue": 100
  }
  ```
