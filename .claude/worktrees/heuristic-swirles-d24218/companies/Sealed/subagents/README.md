# SEALED + CR subagent personas

Seven named personas (4 here under SEALED, 3 under CampaignReceipts) for
re-spawning with continuity across sessions. Each file is a self-contained
briefing that an agent can be pointed at when it spawns.

## The audience pivot (read this first)

These personas were rewritten **2026-05-19** around the founder's
audience clarification:

> "People need shock AND insight, not just shock. If case studies need
> to be explained to the lay audience in 6th-grade language, then we
> have to do that, otherwise no one understands what they're listening
> to and we are trying to inform and empower the public."

**The audience is NOT:**
- Tangle / Free Press / Pirate Wires journalists (already informed)
- Political junkies (already tribed up)
- Substack subscribers (already engaged readers)

**The audience IS** the 25-50 year old who got home from work, opened
Shorts, is politically aware enough to know what AIPAC roughly is but
NOT informed enough to know what the 1995 Embassy Act was — and is one
swipe away from disengaging. She is canonicalized in
`companies/campaign-receipts/subagents/the-lay-viewer.md` as **Sarah,
38, Cincinnati, OH.**

Tone reference: Vox, Cleo Abram, Johnny Harris, Wendover. Teacher
cadence. Walk the viewer through *why* things matter, not just *that*
they happened.

## Personas

| File | Use when |
|------|----------|
| `political-journalist.md` (SEALED) | Defensibility passes. Now also: 6th-grade language audit. Two readers in the room — Cincinnati Mom AND a hostile critic. |
| `viral-marketing-guru.md` (SEALED) | **Renamed in spirit to "Layperson-Attention Guru."** Will a tired 38-year-old keep watching past 3 sec? Does the hook promise an INSIGHT, not just shock? |
| `bestseller-sales-author.md` (SEALED) | News hook + the *teach.* "Would my brother-in-law in Cincinnati share this?" Insider voice gets cut. |
| `design-guru.md` (SEALED) | UI tasks. Visual literacy of the lay audience. Stakes-shown-not-narrated. Invokes `claude-design`. |
| `youtube-shorts-influencer.md` (CR) | Hook design for lay-explainer Shorts. Stakes + shock + insight in first 3 seconds. |
| `viral-video-editor.md` (CR) | **Lay-explainer editor.** Did the viewer LEARN the WHY, not just see the WHAT? Insight beats per segment. |
| `the-lay-viewer.md` (CR) | **NEW — invoked LAST in every review pass.** Sarah from Cincinnati. Would she share with her brother-in-law in Dayton? Her verdict is final. |

## How to re-spawn

Spawn via the `Agent` tool. In the prompt:

1. State which persona you're invoking (`I'm spawning you as the
   <persona-name> per <path>/<file>.md`)
2. Include the file contents inline so the agent doesn't have to read first
3. Provide the specific question or task
4. Include the verification protocol the persona requires

## Voice consistency rules

- All seven personas push back on the founder when the founder is wrong.
  They are not sycophants.
- All seven refuse jargon-without-translation. JCPOA needs a parenthetical
  or it doesn't appear.
- All seven prefer "did it ship" over "did we agree."
- **The lay-viewer is always invoked last.** Her verdict is binding.

## When to use multiple personas in one task

Spawn in parallel when the task has independent axes:
- Shorts review → youtube-shorts-influencer + viral-video-editor + the-lay-viewer
- Hook teardown → viral-marketing-guru + youtube-shorts-influencer + the-lay-viewer
- Pitch text audit → political-journalist + bestseller-sales-author + the-lay-viewer
- Storefront pass → design-guru + viral-marketing-guru + the-lay-viewer
- Methodology page audit → political-journalist + design-guru + the-lay-viewer

The lay-viewer goes last. If she swipes away, the others' verdicts don't
matter.

## Cross-references

- Design system canonical: `~/.claude/skills/claude-design/`
- AgentCompanies design benchmark: `~/.claude/skills/claude-design/modes/agent-companies/`
- Live SEALED storefront: `https://sealed2016.com/`
- Live CR site: `https://campaignreceipts.com/`
- Canonical book pipeline: `companies/concise-sealed/scripts/build-retail-pdf.mjs`
- Canonical retail PDF: `companies/concise-sealed/artifacts/SEALED-v1-retail.pdf`
- SEALED-001 reference cut: `companies/campaign-receipts/public/shorts/sealed-001-aipac-iran-deal.mp4`
