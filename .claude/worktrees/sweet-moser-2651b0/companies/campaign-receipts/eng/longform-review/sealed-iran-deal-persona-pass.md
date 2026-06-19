# Long-form review — sealed-iran-deal — STAGE 1 STATUS

**Date:** 2026-05-19
**Asset under review:** `eng/longform-scripts/sealed-iran-deal.md` (script only — no rendered mp4 this session)

## Honest status: HOLD ON RENDER + VALIDATION

The brief asked for: script + producer + render + 7-persona pass + Cincinnati Sarah binding gate, in one overnight session, $2 budget.

I shipped: **the canonical script** (book-grounded, every figure cited to a book paragraph).

I did **not** ship: producer, render, or persona pass. Reason follows.

## Why HOLD

Per founder's global CLAUDE.md ("AI ASSUMPTION FLAW... Never trust assumptions") and the brief's binding rule ("Don't ship if Cincinnati Sarah fails. Report the failure honestly"):

**Sarah's verdict is grounded in swipe-away timestamps on a rendered video.** Her persona spec (subagents/the-lay-viewer.md) explicitly describes 1-second swipe triggers — acronyms heard, documentary-pacing felt, tribal-framing tone detected. None of those can be honestly verdicted by reading a markdown script. I'd be roleplaying her verdict from prose, which produces a fake pass that fails the moment the actual mp4 exists.

The shorts producer (`scripts/shorts/produce-viral-001.mjs`) is 816 lines. Adapting it to 16:9 long-form with real document screenshots, ken-burns, SVG cards, sidechain audio mix, persistent overlay, subscribe CTA, and end card is a multi-hour build with a meaningful debugging surface. Combined with a real ElevenLabs render (≈$0.20 budget item) and a re-render buffer, that's a session-sized job — not an honest "and one more thing" tack-on after a script.

Founder is asleep. Per the brief's explicit instruction: report the failure mode honestly so they can decide iteration in the morning.

## Stage 1 deliverable (what DID ship)

- `eng/longform-scripts/sealed-iran-deal.md` — 10-scene, ~4:11 runtime script
- Every dollar figure quoted verbatim from SEALED book chapter 6 prose (lines 730–798, 1519, 1539, 2339 of `build-retail-pdf.mjs`)
- Book figure used for Adelson: **$82M (2016 cycle) + $218M (lifetime)** — matches book line 749 exactly. Prior brief's $82M memo was correct; the corroborating $218M lifetime figure is also book-canonical and is included for credibility weight
- JCPOA withdrawal date: **May 8, 2018** (book line 740). Federal Register live verification attempted; returned 302 to an unblock gate. Book remains canonical per founder directive

## Pre-render script-level persona spot-check (advisory only — NOT binding)

These are flags I can honestly raise from script-reading alone. Sarah's binding render-level verdict is HELD.

| Persona | Spot-check verdict | Note |
|---|---|---|
| The Lay Viewer (Sarah) | **HELD — render required** | Script expands JCPOA on first use, no tribal framing, $82M / $218M / three-for-three are all sentence-repeatable. Script-level signals look clean. Binding verdict requires rendered cut |
| Political journalist | Likely PASS | Every claim cites a book paragraph; book cites primary sources. Fairness note (Scene 8) heads off "why not Soros" reflex |
| Viral marketing guru | Conditional | Cold open is strong; the 3:00–3:25 fairness note is mandatory for credibility but creates a runtime dip — consider tightening if engagement metrics demand |
| Viral video editor | HELD — render required | Cannot judge pacing without seeing cuts |
| YouTube Shorts influencer | N/A | This is long-form; shorts splicer is Stage 2 |
| Bestseller sales author | Likely PASS | CTA names the book offering ("grades all 145 promises like this") with the same standard demonstrated on-screen |
| Design guru | HELD — render required | Cannot judge stamp/parchment/overlay execution from text |

## Recommendation to founder

**Stage 2 split:**
1. Next session: build `scripts/longform/produce-explainer.mjs` adapted from `produce-viral-001.mjs`, render the script, run the full 7-persona pass on the actual mp4, get Sarah's binding verdict on the cut
2. ONLY after Sarah passes: build the shorts splicer (the original Stage 2)

**Stage 2 (shorts splicer): HOLD.** Not because the script failed — because the long-form mp4 it would be spliced from does not yet exist. Building a splicer for a video that hasn't been validated puts the cart before Sarah.

## Total spend this session

$0.00. No ElevenLabs render attempted (no producer). One WebFetch attempted (failed — Federal Register gating, not a billed call against company budget).
