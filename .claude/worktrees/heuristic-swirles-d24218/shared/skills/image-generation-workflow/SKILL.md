---
name: image-generation-workflow
description: >
  How to get images for landing pages, social posts, ad creative, email
  templates, and other visual deliverables. Two paths: founder-loop
  (queue prompts in `image-prompt-queue.md`, founder generates in
  Claude.ai/Midjourney) and API-loop (call `infrastructure/scripts/
  generate-image.py` for automation, $5/day portfolio cap). Faceless
  rule applies absolutely. Use whenever your work product needs an
  image, illustration, or campaign visual.
---

# Image Generation Workflow

Claude.ai's image generation requires human-in-the-loop. Midjourney requires Discord. Both can't be called from agent code directly. So the portfolio uses two paths depending on urgency and automation needs.

## When to use

Trigger on any of these moments:

- Landing page hero needs a visual
- Email template needs a header/banner
- Social post needs a 1080×1080 or 9:16 asset
- Book cover or product cover needs design
- Newsletter needs an inline illustration
- Ad creative for paid testing (Phase 2+)

## When NOT to use

- A logo / wordmark (that's Brand & Marketing's identity work, not Designer's image gen)
- A photograph of a real person (faceless rule prohibits)
- Stock-photo-replacement that requires paid licensing without Chief Accountant approval
- Image-heavy content where you should ship with placeholders first and add images last

## Faceless rule (absolute, always)

❌ NEVER prompt for "founder" or "Alex Antoniou" or any real-name reference
❌ Photorealistic humans that resemble founder
❌ Founder's actual face/voice/likeness in any form

✅ Stylized human figures (silhouettes, illustrations, abstract figures)
✅ Photorealistic humans NOT resembling founder
✅ Animation, motion graphics, abstract art
✅ Document/archive aesthetic
✅ Vintage poster aesthetic

## Path A: Founder-loop (preferred when not time-critical)

The founder runs prompts in Claude.ai or Midjourney; agents queue prompts in advance.

### Workflow

1. **Designer drafts prompt** following the format below
2. **Append to `companies/<co>/design/image-prompt-queue.md`** (one prompt per block)
3. **CEO surfaces in next Q4hr brief** with count of new prompts
4. **CoS includes count in next FOUNDER_ACTIONS.md** with a one-line summary
5. **Founder generates** in Claude.ai or Midjourney (~5-10 min/batch)
6. **Founder drops images** in `companies/<co>/design/assets/`
7. **Designer wires images** into pages, replacing styled placeholders

### Prompt block format

```markdown
## Prompt #N — <short label> — <YYYY-MM-DD>

**Intended use:** {landing page hero / email header / 1080×1080 social / book cover / etc.}
**Dimensions / aspect:** {16:9 1920×1080 / 1:1 1080×1080 / etc.}
**Tool target:** {Midjourney / Claude.ai / either}
**Brand notes:** {palette refs, typography overlay if any, tone}
**Faceless check:** {confirm: no human faces required, OR stylized only}
**Rights:** {confirm: no copyrighted IP, no celebrity likenesses unless stylized}

**Prompt:**
"{Full prompt text — direction, style, lighting, composition, mood, references, negative prompts}"
```

## Path B: API-loop (when automation needed)

Use `infrastructure/scripts/generate-image.py` to call OpenAI / Grok / Anthropic APIs. Costs are tracked.

### Usage

```bash
python3 /Applications/DrAntoniou\ Projects/AgentCompanies/infrastructure/scripts/generate-image.py \
  --provider {openai|grok|anthropic} \
  --prompt "Vintage 2016 campaign poster style, document archive aesthetic, sealed envelope" \
  --out /Applications/DrAntoniou\ Projects/AgentCompanies/companies/concise/design/assets/trump-hero-1.png \
  --company concise
```

The script:
- Loads `.env` for the relevant API key
- Calls the API
- Writes the resulting image to `--out`
- Appends a JSONL line to `infrastructure/scripts/.image-gen-costs.jsonl` with: timestamp, provider, prompt-hash, $cost, company, output-path

### Provider preference

Default order (subject to availability):
1. **OpenAI DALL-E 3** — most reliable, $0.040/standard 1024×1024 image
2. **Grok (xAI image gen)** — fallback, similar cost profile
3. **Anthropic image gen** — verify availability before each call; not yet GA at last check

### Cost cap

Portfolio-wide image-gen API spend is capped at **$5/day** until founder raises. The script enforces this — if today's accumulated spend in `.image-gen-costs.jsonl` is already over $5, the script aborts with a clear error.

If you genuinely need to exceed: surface to CoS via your standup with cost projection. CoS escalates to founder.

## Don't bottleneck on images

If a landing page needs an image you don't have, **ship the page with a styled placeholder.** Use:
- Gradient block with brand colors
- Brand-color rectangle with subtle pattern
- Simple SVG icon or geometric shape

Mark the slot in code with `<!-- IMAGE QUEUED: prompt-N -->`. Replace with real image once it arrives via Path A or Path B. Don't block deploy on imagery.

## Quality checklist before queueing

Before adding to queue or running API:

- [ ] Does this image actually unblock revenue? (Hero on a paying-customer page = yes; "nice to have" decoration = no)
- [ ] Could I ship with a placeholder instead?
- [ ] Have I checked the day's image-gen cost log? Am I close to the $5 cap?
- [ ] Is the prompt specific enough that the result will be usable on first try? (Vague prompts waste budget on retries.)
- [ ] Faceless check: explicit "no human faces" or "stylized only" in the prompt?

## Related skills

- `agent-autonomy-doctrine` — when to act vs escalate (image-gen API cap is one such gate)
- `goal-first-briefing-format` — how to surface image-prompt-queue counts in CEO briefs

## Severity

This is a **revenue-adjacent skill.** Most landing pages need at least one image. Most email templates need a header. Without a working image-gen workflow, the portfolio's revenue thesis stalls. Use this skill correctly = revenue moves; ignore it = pages ship with placeholders forever.

See `BIBLE.md` § 8 for the policy statement and `shared/personas/designer.md` for the canonical Designer doctrine.
