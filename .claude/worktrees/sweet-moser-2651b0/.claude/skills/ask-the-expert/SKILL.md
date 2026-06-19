---
name: ask-the-expert
description: Use whenever the agent is about to decide, pick, choose, select, design, write, name, title, thumbnail, hook, copy, pricing, strategy, prompt, photo, music cue, audit, or review anything in a domain where a specialist persona exists. Also triggers when the agent is tempted to pre-filter options into a menu for the founder, or to answer founder pushback on a specialist's output. Open brief in, expert decision out — the orchestrator never overrides the subagent's specialty.
---

# Ask The Expert — never override the specialist subagent

The main orchestrating agent **never produces persona-owned artifacts directly
and never pre-filters the design space for a specialist subagent**. The
persona exists BECAUSE they have judgment in their domain. Pre-filtering,
pre-deciding, or solo-shipping removes that judgment and produces generic
Claude-voice slop.

This is a portfolio-wide doctrine (CR, SEALED, NTO, HealthBrew, EstimateProof,
and every future sister company). Founder lock 2026-05-24 + 2026-05-25.

## When this skill triggers

The agent is about to:

- **Make a decision** in a domain where a specialist persona exists (title,
  thumbnail, hook, script line, storyboard shot, music cue, photo, generative
  prompt, design, pricing, copy, layout, brand voice, QC verdict).
- **Pre-filter options** into a menu for the founder ("AOC face vs Stanford
  face vs split?"). This is the anti-pattern. The specialist owns the call.
- **Answer founder pushback** on a specialist's output ("shouldn't it show
  X?"). That's a re-brief for the specialist, NOT a question the orchestrator
  answers.
- **Solo-ship** a public artifact (content, code, comms, design).

If any of those apply: STOP. Run the 6-step protocol.

## The 6-step protocol

1. **Read the pipeline doc** for the current stage (e.g. `eng/PRODUCTION-PIPELINE-v1.md`
   for CR/SEALED, `PRODUCTION-PIPELINE-v3.md` for NTO).
2. **Identify the owner persona** named in that stage's row.
3. **Read the persona's `.md` file** at `personas/<name>.md` (or
   `personas/council/<name>.md`).
4. **Spawn an `Agent` subagent** with `subagent_type: general-purpose`,
   passing: persona content + task + inputs + **OPEN decision space**
   (no pre-filters in the persona's domain).
5. **Verify** the output artifact exists at the declared path.
6. **Report to founder** what shipped + WHY, citing the subagent's reasoning.

If the founder pushes back: **re-spawn the subagent** with the pushback
as new context + open space + instruction to DECIDE the right answer (not
necessarily what the founder suggested). Do NOT answer the pushback yourself.

## The two patterns to STOP

### 1. Pre-filtered option menu to founder when a specialist owns the call

- WRONG: "Do you want AOC face or Stanford face or split-screen?"
- RIGHT: Spawn `thumbnail-designer` with the LIVE title + episode facts +
  all available portraits + brand pattern. They pick. Founder sees the
  result and can re-brief if wrong.

### 2. Answering founder pushback in a specialist's domain

- WRONG: Founder says "shouldn't it show Pennsylvania campaign?" → orchestrator
  edits the prompt to add PA imagery.
- RIGHT: Re-spawn `thumbnail-designer` with founder pushback as new context,
  open composition space, instruction to decide. They might pick PA — or
  something better (the actual Rabb PA-3 win was a 2-face collision the
  founder hadn't suggested).

## Concrete examples (always spawn the specialist)

| Task | Specialist persona | Founder must not see |
|------|--------------------|----------------------|
| Episode title | `title-strategist` | a menu of 4 titles |
| Thumbnail | `thumbnail-designer` (reads LIVE title) | "AOC vs Stanford?" |
| Script | `cr-new-news-writer`, `nto-content-writer` | orchestrator's draft |
| Hook line | the script writer persona | pre-written hook |
| Storyboard | `video-producer` | pre-picked shot types |
| Photo selection | `cinematic-broll-director` | menu of photos |
| Generative prompts | `visual-prompt-engineer` (defers to banana-pro-director / cinema-worldbuilder skills) | orchestrator's prompt text |
| Music cues | `score-composer` | pre-suggested ta-da hits |
| Cadence / pauses | `cadence-director` | manual `[pause:Xms]` edits |
| Empathy pass | `empathy-editor` then `jk-rowling-storyteller` | orchestrator-edited acknowledgments |
| Storytelling pass | `personas/council/19-mrbeast-viral-producer.md` | orchestrator's "tighter version" |
| QC `/watch` | `qc-engineer` (uses /watch internally) | orchestrator's frame-by-frame |
| Web copy / UX | `web-ux-director` | pre-written button labels |
| Brand voice | `voice-of-the-brand` rules | LinkedIn-voice copy |
| Pricing / monetization | `monetization-architect`, `ceo` | orchestrator's price pick |

## Canonical incident (Rabb PA-3 thumbnail)

1. `title-strategist` picked "AOC Beat AIPAC's $3.5M Attack On Chris Rabb".
2. Orchestrator noticed thumb-title mismatch.
3. **WRONG MOVE:** orchestrator asked founder "AOC face vs Stanford face
   vs split?"
4. Founder picked AOC-solo from the menu.
5. Orchestrator spawned `thumbnail-designer` with constraint already locked.
6. Subagent executed dutifully inside the box.
7. Founder asked "shouldn't you show PA campaign or candidate1 vs candidate2?"
8. **RIGHT MOVE (re-brief):** re-spawned `thumbnail-designer` with the
   pushback + 8 starter compositions + "invent your own" — produced the
   actual right answer: AOC + Stanford 2-face collision, which neither the
   orchestrator nor the founder had suggested.

Lesson: the orchestrator removed the specialist's judgment twice (pre-filter
menu, then locked constraint). Open brief in, expert decision out.

## Exception — mechanical / syntactic gates

The orchestrator MAY run these directly because they are tool calls
executing on artifacts a specialist already produced. They are NOT design
decisions:

- `scripts/pipeline/script-qc.py`
- `scripts/pipeline/validate-storyboard.py`
- `youtube-upload.py --update-meta` (after subagent decided the metadata)
- `git push` to deploy a Render service
- `npm run build`, `next build`, type-check, lint
- Any pre-flight check (jq devDeps audit, /tokens/verify, env presence)

If the script's exit code is the answer, the orchestrator runs it. If a
human-judgment call sits in front of the script, spawn the specialist
first.

## Hard rule

> The specialist's persona IS the gate. No downstream council vote. No
> orchestrator override. No founder option-menu. Trust the specialist's
> output; ship what they decide; the founder can override but the
> orchestrator cannot.

Related memory:
- `feedback_never_main_agent_for_persona_work.md`
- `feedback_orchestrator_never_overrides_subagent_specialty.md`
- `feedback_no_council_gates_assign_to_experts.md`
