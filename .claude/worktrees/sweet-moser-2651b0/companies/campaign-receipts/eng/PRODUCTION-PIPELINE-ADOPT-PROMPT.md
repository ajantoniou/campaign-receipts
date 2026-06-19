# CR-Pipeline → Sister-Company Adopt Prompt

This prompt is what you (the founder, or an agent on their behalf) paste into a sister YouTube company in the AgentCompanies portfolio when you want to adopt the same end-to-end production pipeline doctrine that Campaign Receipts uses.

Sister-company examples that could adopt this: **NTO** (already has its own v3 — this is the model CR was based on; for reference only), **HealthBrew Longevity**, **SEALED 2016** (currently runs under CR's pipeline; could split out), and any future single-narrator video channel.

---

## How to use

1. Paste everything below the `---` line into a fresh Claude Code session inside the target company's folder (e.g., `companies/healthbrew-longevity/`).
2. Replace the four `<<TOKEN>>` placeholders with company-specific values.
3. Let the session run — it will create the pipeline doc, the skill wrapper, and the missing personas.
4. Verify by running the new skill on a small test brief before committing to a real episode.

---

## The prompt

You are adopting the Campaign Receipts production-pipeline doctrine for **<<COMPANY_NAME>>** (e.g., HealthBrew Longevity). Your job: produce three files (and any missing personas) so this company has a one-command pipeline orchestrator just like Campaign Receipts' `/cr-production-pipeline`.

### Inputs you need before starting

- **<<COMPANY_NAME>>** — human name (e.g., "HealthBrew Longevity")
- **<<COMPANY_SLUG>>** — folder name under `companies/` (e.g., `healthbrew-longevity`)
- **<<NARRATOR_VOICE>>** — ElevenLabs voice + persona file path (e.g., "Brian / `personas/brian-the-narrator.md`")
- **<<CHANNEL_FRAMING>>** — 1-line description of what the channel does (e.g., "longevity science explained simply, weekly")

### Step 1: Read the CR template

Read these CR files in full as your template:

- `companies/campaign-receipts/eng/CR-PRODUCTION-PIPELINE-v4.md` (the 38-step canonical table)
- `companies/campaign-receipts/.claude/skills/cr-production-pipeline/SKILL.md` (the orchestrator)
- `companies/campaign-receipts/personas/visual-prompt-engineer.md` (generative-only persona)
- `companies/campaign-receipts/personas/cinematic-broll-director.md` (library-selection persona)

Note: the CR pipeline is itself derived from NTO's `PRODUCTION-PIPELINE-v3.md`. If your sister-company is closer to NTO's multi-character podcast format than CR's single-narrator data-explainer format, also read `companies/NTO/PRODUCTION-PIPELINE-v3.md` as a second reference.

### Step 2: Audit what the sister company already has

```bash
ls companies/<<COMPANY_SLUG>>/personas/
ls companies/<<COMPANY_SLUG>>/scripts/pipeline/ 2>/dev/null || ls companies/<<COMPANY_SLUG>>/scripts/
ls companies/<<COMPANY_SLUG>>/eng/ 2>/dev/null
```

For each CR persona, identify the sister-company equivalent OR mark "MISSING — create new":

| CR persona | Sister-company equivalent |
|------------|---------------------------|
| `betsy-the-narrator.md` (Jessica VO settings) | <<NARRATOR_VOICE>> |
| `story-investigator.md` | check `personas/` for equivalent |
| `audience-demand-strategist.md` | check |
| `cr-new-news-writer.md` | rename to `<<company>>-content-writer.md` |
| `storyline-editor.md` | check |
| `storyteller-score-rubric.md` | check |
| `empathy-editor.md` | check |
| `qc-engineer.md` | check |
| `video-producer.md` | check |
| `sfx-specialist.md` | check |
| `analytics-tracker.md` | check |
| `council/*.md` (11 members) | check — sister may have a different council |
| `viral-panel/*.md` (7 members) | check — packaging/title/thumb personas |
| `visual-prompt-engineer.md` (NEW in CR) | likely MISSING — copy from CR |
| `cinematic-broll-director.md` (NEW in CR) | likely MISSING — copy from CR |

Pipeline scripts to inventory:

- TTS: `elevenlabs-tts.py` with `--chunked` flag
- Audio QC: `qc_spoken.py`, `audio-qc.py`
- Storyboard: `validate-storyboard.py`, `produce-from-storyboard.py`
- Generative: `fal-stills-gen.py`, `fal-kling-i2v.py`, `fal-video-premium.py`
- Remotion: `render-remotion.mjs`, `render-text-cards.mjs` (with per-episode isolation `remotion/src/episodes/<slug>/`)
- Upload: `youtube-upload.py` (must have `--update-meta` flag — see CR `youtube-upload.py` for the canonical implementation), `pre-upload-pack.py`, `update-published-youtube.py`
- Shorts: `render-text-short.mjs` (NEW — text-card-over-broll renderer; replaces voice-clip shorts) + `qc-shorts-format.py` (NEW — letterbox/VO/aspect detector)

### Step 3: Produce the three files

#### File 1: `companies/<<COMPANY_SLUG>>/eng/CR-PRODUCTION-PIPELINE-v4.md`

Mirror the CR doc's structure exactly. Replace:
- Episode slug pattern (`cr-<lastname>-<seat>-<context>` → your channel's slug convention)
- Narrator persona reference (`betsy-the-narrator.md` → <<NARRATOR_VOICE>>)
- Channel-specific failure modes table (drop CR's URANIUM-chart row; add YOUR channel's past shipping failures)
- Tool-strength matrix (mostly identical; remove tools you don't use; add company-specific tools — e.g., Higgsfield Soul-ID if you've trained a presenter avatar)
- Doctrine line 4 (acronym mispronunciation) — replace CR's `A.I.P.A.C.` example with whatever acronyms YOUR channel mispronounces (every TTS company has its own list)
- Doctrine line 5 (politician faces) — replace with YOUR channel's "what's banned in visual" rule (e.g., HealthBrew might ban "before/after weight-loss photos" or "doctor-in-white-coat AI faces")
- Shorts doctrine — keep the text+b-roll+music HARD rule unless your channel has a different reason to allow VO shorts

#### File 2: `companies/<<COMPANY_SLUG>>/.claude/skills/<<company-slug>>-production-pipeline/SKILL.md`

Copy CR's SKILL.md verbatim. Find-and-replace:
- `cr-production-pipeline` → `<<company-slug>>-production-pipeline`
- `Campaign Receipts` → <<COMPANY_NAME>>
- `companies/campaign-receipts/` → `companies/<<COMPANY_SLUG>>/`
- `betsy-the-narrator.md` → <<NARRATOR_VOICE>>
- `cr-new-news` / `sealed-2016` (program list) → your channel's program list
- The "NO DIRECT SCRIPT INVOCATION" script list — verify each script exists in your company's `scripts/pipeline/`
- The `Cori Bush / Massie / AIPAC` examples → equivalent examples from your channel

#### File 3: `companies/<<COMPANY_SLUG>>/eng/PRODUCTION-PIPELINE-ADOPT-PROMPT.md`

Copy THIS file verbatim with the same find-and-replace. Your sister company can in turn adopt-prompt their sister company.

### Step 4: Create missing personas

For every persona marked MISSING in Step 2:
- If it's a generic persona (visual-prompt-engineer, cinematic-broll-director, qc-engineer): copy the CR version verbatim, just update channel-specific examples (no real politicians → your channel's "no AI faces of <protected category>" rule).
- If it's a channel-specific persona (story-investigator, content-writer, viral-panel/02-thumbnail-designer): rewrite the channel-specific sections.

### Step 5: Verify

Run a smoke test:

1. Invoke the new skill: `/<<company-slug>>-production-pipeline` with a tiny test brief (one paragraph, no real production spend).
2. Watch the skill confirm the 4 inputs and reach Stage 1.
3. Cancel at Stage 1 — don't spend money on the test.
4. If it asked the right questions and pointed at the right files, the skill is wired.

Run a one-stage isolated test:

1. Invoke Stage 12 only (TTS readability lint) on an existing script in your company.
2. Verify exit code matches expected PASS/FAIL.

If both smoke tests pass, the pipeline is adopted. Commit the three files + any new personas.

### Step 6: Document the adoption

Append to `shared/portfolio-hub/platforms-and-tools.md` under "Production pipelines":

```
- <<COMPANY_NAME>> — `/<<company-slug>>-production-pipeline` (adopted from cr-production-pipeline 2026-MM-DD)
```

---

## What this adopt prompt deliberately does NOT do

- It does NOT migrate channel-specific scripts (those stay in the originating company)
- It does NOT share API keys (root `.env` already handles that)
- It does NOT couple the two companies' personas — they evolve independently after adoption
- It does NOT enforce a shared "pipeline version" — each company tracks its own `PRODUCTION-PIPELINE-vN.md`

The doctrine is shared; the operational details stay per-company.

---

## Cross-references

- Source pipeline doctrine: `companies/campaign-receipts/eng/CR-PRODUCTION-PIPELINE-v4.md`
- Source skill: `companies/campaign-receipts/.claude/skills/cr-production-pipeline/SKILL.md`
- Grandparent doctrine (NTO, the original): `companies/NTO/PRODUCTION-PIPELINE-v3.md`
- Portfolio hub (where to log adoption): `shared/portfolio-hub/platforms-and-tools.md`
