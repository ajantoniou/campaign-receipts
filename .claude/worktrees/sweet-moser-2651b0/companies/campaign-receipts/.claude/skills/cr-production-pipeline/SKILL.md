---
name: cr-production-pipeline
description: Run the canonical Campaign Receipts production pipeline end-to-end for BOTH programs on the @CampaignReceiptsYoutube channel — SEALED 2016 (145-promise audit) and CR new-news (single-race finance receipts). Spawns one specialist subagent per stage; each specialist's persona IS the gate. No council REVISE loops, no story-score-100 binding gates. Use when the founder says "produce SEALED promise N" / "make a CR new-news piece on RACE" / "make me a short on TOPIC" / "run the pipeline" or after a topic brief lands. Reads eng/PIPELINE-STEPS-AND-OWNERS.md as the canonical step→owner table and .claude/skills/cr-production-pipeline/stages.yaml as the machine-readable stage list.
---

# Campaign Receipts Production Pipeline Skill

This skill orchestrates the canonical 31-stage pipeline documented in `companies/campaign-receipts/eng/CR-PRODUCTION-PIPELINE-v4.md`. It spawns persona subagents stage by stage, enforces hard-fail gates between them, and stops at the points where the founder must intervene (manual YouTube Studio upload, council overrides, KILL verdicts).

**Single skill, two programs:** SEALED 2016 (parchment audit) and CR new-news (navy single-race receipts). Selected via `--program sealed | cr-new-news`. Same gates, same QC, same /watch passes, same `pipeline-state.py` driver — only cosmetic + playlist + thumb template differ.

---

## When to use

- Founder says "produce SEALED promise #N" / "make a SEALED LF on TOPIC" / "make a SEALED short on TOPIC"
- Founder says "make a CR new-news piece on RACE" / "build the Massie/Bush follow-up" / "do the next race"
- A topic brief lands in `briefs/<date>-<slug>-topic-brief.md`
- After analytics review on a prior piece says "do the next one"
- **Any shorts work** — re-cut, audit, batch-produce, single short. Direct invocation of `cut-shorts-v2.py` / `produce-short-generic.mjs` / `render-text-short.mjs` is forbidden.
- **Any re-render / re-splice** — surgical fixes go through the skill so Stage 19 / 24 / 25 / 26 gates run.
- **Any metadata push to YouTube** (`youtube-upload.py --update-meta`) — must enter via Stage 30 so the post-publish /watch QC runs.

## NO DIRECT SCRIPT INVOCATION

Founder lock 2026-05-24 (after an agent shipped 3 broken shorts by calling `cut-shorts-v2.py` directly): the skill is the **only** entry point for any stage that has a downstream hard-fail gate. Even surgical "I just want to fix one frame" work goes through the skill — `pipeline-state.py resume --from-stage N` exists for this.

---

## What the founder needs to supply

Minimum input to start a piece:

1. **Topic brief** — what's this piece about? 2-5 sentences. The `story-investigator` (Stage 2) extracts tension from this.
2. **Slug** — kebab-case:
   - SEALED: `sealed-NNN-<topic>` (e.g. `sealed-018-china-currency`)
   - CR new-news: `cr-<race>-<politician>-<seat>` (e.g. `cr-massie-gallrein-primary`)
3. **Program** — `sealed` or `cr-new-news`.
4. **Mode** — `longform` (with Betsy/Jessica VO) or `short` (text + music + b-roll, NO VO per 2026-05-24 lock).
5. **(Optional) Receipt terms** — `<!-- RECEIPTS: china, treasury-report, fec-id -->` header for the fact-check gate.

If any of #1–4 is missing, ASK before starting any stages. Do NOT guess.

---

## How the skill runs (operator manual)

### 1. Initialize state

```bash
python3 scripts/pipeline/pipeline-state.py init \
  --slug <slug> --program <sealed|cr-new-news> --mode <longform|short> \
  --brief briefs/<date>-<slug>-topic-brief.md
```

Creates `_review/pipeline-state-<slug>.json` with all 31 stages as PENDING. LF-only stages auto-SKIPPED for short mode via `only_when`.

### 2. Loop until done

```bash
NEXT=$(python3 scripts/pipeline/pipeline-state.py next --slug <slug>)
echo "$NEXT" | jq .
# stage_id, name, kind, persona, job, inputs, output, tool, model, cost_cap_usd,
# blocking, override_flag, never_overridable, pause_reason, halt_on_verdict
```

For each stage:
- **`kind: persona`** → spawn Agent subagent loaded with the `.md` at `persona` as system prompt. Pass `job` + `inputs`. Verify it writes to `output`.
- **`kind: tool`** → run the Bash command in `tool`. Verify exit 0 and `output` exists.
- **`kind: gate`** → run `tool` (optionally with `persona` for human verdicts). On non-zero exit:
  - `never_overridable: true` → STOP, surface violation, escalate to founder.
  - `override_flag` set → ASK founder for explicit override; log to council report.
- **`kind: manual`** → pause and surface `pause_reason` to founder. Wait for action.

Then mark:
```bash
python3 scripts/pipeline/pipeline-state.py mark --slug <slug> --stage <id> --verdict PASS
```

### 3. Status / resume / re-roll

```bash
python3 scripts/pipeline/pipeline-state.py status --slug <slug>
python3 scripts/pipeline/pipeline-state.py resume --slug <slug> --from-stage 24
```

### 4. Cache-hit detection

`next` auto-marks stages PASS if their declared `output` path already exists on disk. The loop is idempotent — re-running after a kill picks up where it left off.

---

## Persona subagent spawning

**Founder rule 2026-05-24 (NEVER OVERRIDE):** the main orchestrator must spawn an Agent subagent loaded with the persona's `.md` for every persona-named stage (script, council, QC `/watch`, storyboard, photo selection, generative prompts). The orchestrator does NOT do persona work itself.

**Founder rule 2026-05-25 (NEVER PRE-FILTER):** the orchestrator must NOT pre-filter the design space for a specialist. No "pick from these 4 options" menus to founder when a specialist owns the call. Spawn the subagent with the LIVE artifact (title, script, storyboard) + open brief + ALL options visible. The specialist decides. Founder sees the result + can re-brief if wrong.

**Founder rule 2026-05-25 (PUSHBACK = RE-BRIEF):** when founder pushes back on a specialist's output ("shouldn't it be X?"), that is NOT a question the orchestrator answers. Re-spawn the subagent with the founder's pushback as new context + open decision space + instruction to DECIDE the right answer (which may or may not be X). Trust the specialist's judgment over the orchestrator's tactical instinct.

Specific patterns:
- **Thumbnail designer** always reads the LIVE TITLE first; composition is theirs to pick (solo / 2-face collision / VS / 3-way split / geographic / faceless). The orchestrator does NOT pre-pick portrait OR layout.
- **Title strategist** spawn with episode facts + keyword space + brand pattern. Orchestrator does NOT suggest titles.
- **Score composer** spawn with locked VO + storyboard. Orchestrator does NOT suggest where ta-da hits or which instruments.
- **Storyboard director** spawn with locked script. Orchestrator does NOT pre-pick which shots get Wikipedia vs Remotion vs Kling.

See portfolio memory `feedback_orchestrator_never_overrides_subagent_specialty.md` for the full doctrine + the Rabb PA-3 incident that triggered this lock.

Spawn pattern (kind=persona):

```
Agent({
  subagent_type: "general-purpose",
  description: "<stage name>",
  prompt: """
You are the <persona name>. Your full system prompt is in <persona path>.
Read that file, then perform your job for slug <slug> (program=<program>, mode=<mode>).

JOB: <job from stages.yaml>
INPUTS: <inputs from stages.yaml — read these files before doing anything>
OUTPUT: write your artifact to <output from stages.yaml>

Do not skip steps. Do not produce artifacts outside your declared OUTPUT.
"""
})
```

For QC `/watch` stages (25, 26), use a `qc-engineer` subagent that loads `personas/qc-engineer.md` AND invokes the `/watch` skill on the master.

---

## Per-program deltas

| Step | SEALED | CR new-news |
|------|--------|-------------|
| Slug pattern | `sealed-NNN-<topic>` | `cr-<race>-<politician>-<seat>` |
| Thumb template | `sealed-short` / `sealed` | `cr-new-news-short` / `cr-new-news` |
| CTA card | `145 PROMISES · SEALED2016.COM` | `campaignreceipts.com/race/<slug>` |
| Playlist | `Sealed2016` (auto-resolved) | `CR new-news` |
| Story-investigator framing | "What did this promise cost or deliver?" | "Who paid for this race? What did they buy?" |
| All gates / personas / QC | Identical | Identical |

The orchestrator passes `--program` through to stages that branch on it (mainly Stage 20 thumb + Stage 30 metadata).

---

## Doctrine (founder lock 2026-05-25)

**Pipelines are sequences of TASKS assigned to SPECIALIST SUBAGENTS. The
specialist's persona IS the gate — its output IS the artifact.** No council
REVISE loops, no story-score-100 binding gates, no fact-check-as-blocker.
If the founder doesn't like the result, founder calls it. See
`feedback_no_council_gates_assign_to_experts.md`.

## Hard MECHANICAL gates (catch defects no specialist can detect)

These are NEVER OVERRIDABLE because they check regex / ffprobe / OCR
output, not subjective quality:

| Gate | Stage | Script | Catches |
|------|-------|--------|---------|
| TTS readability lint | 13 | `elevenlabs-tts.py --lint-only` | Bare AIPAC, banned phrases, URL leaks, sentence >30 words |
| Storyboard validator | 19 | `validate-storyboard.py` | Missing files, wrong-aspect, schema errors |
| Master visual QC ×2 | 25, 26 | `qc-visual-master.py` + `/watch` | Wrong b-roll, garble, mismatched stamps |
| Shorts no-VO | 27 | `qc-shorts-no-vo.py` | Any speech in shorts audio |

## Advisory passes (NEVER block re-renders)

These produce reports the founder reads + decides on. They DO NOT trigger
loop-back to earlier stages:

| Pass | Stage | What it does |
|------|-------|--------------|
| Research pack | 6 | Owns fact accuracy AT SOURCE; not a downstream gate |
| Council script review | 11 | Generates report; founder reads; specialist subagents at Steps 7-10 were the real gates |
| Pre-ship council panel | 28 | Generates report; qc-engineer at Stages 25+26 was the real gate |

## REMOVED 2026-05-25 (council-loop incidents on Rabb PA-3 episode)

- `--founder-override-script-council` flag → no longer needed; Step 11 is advisory
- `--founder-override-master-council` flag → no longer needed; Step 28 is advisory
- "story-score 100/100 binding" gate → optional self-check rubric only
- "copy-lock requires 4 upstream PASSes" gate → cache marker only
- "Step 2.95 fact-check-as-binding-gate" (briefly added, immediately removed) → moved into Step 6 research-pack subagent's job
- "Step 2.9b hook-strength gate" (briefly added, immediately removed) → moved into Step 10 MrBeast subagent's prompt

---

## Pause-and-wait stages

Stage 29 (`kind: manual`) pauses for founder Studio upload. Surface `pause_reason`; wait for new video ID(s) in `eng/youtube-meta/studio-uploads-pending.json`.

Stage 31 (72h analytics) has a `pause_reason` — wait 72h after Stage 30. Safe to defer to a separate session; state machine survives.

---

## Files this skill creates / requires

**Reads (source of truth):**
- `eng/CR-PRODUCTION-PIPELINE-v4.md` — prose doctrine
- `.claude/skills/cr-production-pipeline/stages.yaml` — machine-readable stage list
- `personas/*.md` + `personas/council/*.md` + `personas/viral-panel/*.md`

**Writes (per-piece):**
- `_review/pipeline-state-<slug>.json`
- `briefs/<date>-<slug>-{story-extraction,validation,virality}.md`
- `research/<date>-<slug>-{sources,fact-check-pre}.md`
- `content/scripts/<slug>-v{1..5}-*.md`
- `eng/storyboards/<slug>{,-prompts,-broll-selections}.json`
- `_build/<slug>/{vo-v2.mp3, music_bed.m4a, thumbnail.jpg, clips/, _rem-*.mp4}`
- `public/longform/<slug>.mp4` OR `public/shorts/<slug>.mp4`
- `_review/qc-visual-<slug>-pass{1,2}.md`
- `reports/council/<slug>-{<date>,master}.md`
- `reports/episodes/<slug>-72hr.md`

**Touches (shared aggregates):**
- `eng/PUBLISHED-YOUTUBE.md`
- `scripts/.external-costs.jsonl`
- `eng/youtube-meta/studio-uploads-pending.json`

---

## Sister skills

- `banana-pro-director` + `cinema-worldbuilder` — authoritative for visual prompt craft
- `/watch` — invoked by qc-engineer at Stages 25, 26
- `/remember` — capture new failure modes (becomes a row in v4.md "Failure modes locked into doctrine")

---

## When NOT to use

- One-off Q about a published video → just answer
- Typo in `PUBLISHED-YOUTUBE.md` → just edit
- Analytics on a live video → use `youtube-analytics-snapshot.py` directly
- Doctrine / persona file edits → just edit the `.md`

The pipeline is for PRODUCING + SHIPPING content. Maintenance edits go around it.
