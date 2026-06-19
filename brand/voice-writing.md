# Voice writing — write FOR the voice, not generic copy

> **Binding for every script author** (human or agent): long-form and shorts share
> **one ElevenLabs voice (Jessica / Sarah)**. Prose differs by **length and pace**,
> not by switching to a second character. If the words don't match how Jessica sounds,
> TTS will read stiff even when the facts are right.

## Audience (non-negotiable)

**Who:** Former, present, and future **voters** — not reporters, not Hill staffers, not policy wonks.

**Reading level:** **6th grade.** Short sentences. Everyday words. One idea per sentence.

| Instead of | Write |
|------------|--------|
| https://campaignreceipts.com/... | "link in the description below" (never speak URLs) |
| campaignreceipts.com/politician/foo | same — URL on screen + in description only |
| multilateral framework | seven-country deal |
| enrichment limitations | cap on nuclear fuel |
| Republican-aligned committees | GOP groups (spell out once if needed) |
| independent expenditures | outside attack ads paid by groups that aren't the candidate's campaign — then **"In other words, …"** |
| Schedule E / IE filing | the form for those outside attack ads — then **"That means …"** |
| super-PAC | a committee that can take unlimited checks — then **"In other words, …"** |
| AIPAC (spoken) | **AY-pack** in VO (sounds like "A-pack" / "ey-pack" — not "AI pac"), or spell out *American Israel Public Affairs Committee* once then "the lobby". Never bare `AIPAC` in **VO:** lines. On-screen cards may still say AIPAC. |
| pursuant to / wherein | (delete — use "under the deal" / "the rule said") |

**Visual pairing:** Voters want **explainers** — maps, arrows, tables, charts (`brand/visual-explainer-policy.md`). Do not write copy that assumes a face close-up will carry the beat.

| Surface | Voice (ElevenLabs) | Character | Env key |
|---------|-------------------|-----------|---------|
| **Long-form** (3–12 min) | **Jessica** | **Sarah** — receipt reader | `CR_ELEVENLABS_SARAH_VOICE_ID` → `jessica` / `cgSgspJ2msm6clMCkdW9` |
| **Shorts** (≤60 s) | **Jessica** (same) | **Sarah** — tighter, same kitchen-table tone | Same key (optional alias `CR_ELEVENLABS_SHORTS_VOICE_ID` should match Sarah if set) |

**Retired for this channel:** Aria / separate “hook voice” / street-persona copy (“listen, our friend Trump…”). It fights Jessica and reads annoyed on Shorts.

Auditions: `brand/voice-ab-test/index.html`

TTS settings (long + short): `stability=0.55`, `similarity_boost=0.82`, `style=0.20`, `speed=0.93`, `model=eleven_multilingual_v2` or `eleven_turbo_v2_5` for shorts. (Founder lock 2026-05-26: similarity raised 0.75→0.82 for tighter fingerprint on chunked renders; style aligned 0.15→0.20 to match `betsy-character-bible.md`. See `eng/strategy/cr-voice-settings-decision-2026-05-26.md`.)

---

## Sarah / Jessica — long-form and shorts

**Who she is:** A smart neighbor in the South — not a news anchor, not a podcast bro, not a professor. She explains the **paper trail** like she's walking you through a folder at the kitchen table. Warm, unhurried, teacher cadence on long-form; on Shorts she's **the same person**, just faster and shorter. She trusts numbers more than adjectives.

**Write so Jessica can read it naturally**

- **Sentence rhythm:** Medium sentences. Then a short one. Then the number.
- **Open with context + stakes**, not outrage. No "what they don't want you to know." No tribal framing.
- **Spell out numbers for TTS:** "eighty-two million dollars," "May eighth, twenty eighteen."
- **Expand acronyms once** when the short mentions them: "Executive Order thirteen eight ninety-nine."
- **Pauses:** `[pause]` or paragraph breaks before a big reveal (long-form); rarely needed in Shorts.
- **Tone words:** receipt, on the record, the book says, here's the paper, we follow the source.
- **Avoid:** sarcasm, glee, "corrupt," "evil," meme language, fake street dialect, second voice personas, question-stacking clickbait.

### Long-form only — STORYLINE (not bullets)

**Binding pipeline:** `brand/storytelling-pipeline.md` — Screenwriter → JK → MrBeast → storyline editor → `script-storyteller-gate.py` before TTS.

Sarah tells **one story** in connected sentences. The viewer should feel walked through a folder, not read a list of receipts.

**Banned on long-form VO:**
- Date-stamp chains: "May fourteenth, twenty eighteen — ribbon-cutting. Jared attended."
- Staccato fragments: "Delay it. Not yet. Done." / "Same calendar day. Two receipts."
- Three or more sentences in a row under six words each
- Scenes that start cold with a date and no "so / but / then" bridge from the prior beat
- **Telegraph bullets:** "The front is emotion. The back is the committee." — say it in one flowing scene instead
- **Assuming the viewer already knows the race** — name the office, the state, and why a primary matters before the first FEC line

**Required:**
- **Bridge sentences** between beats: "That pattern ended when…", "But the story doesn't end at the ribbon…", "So how does the book score it?"
- **"In other words" after jargon:** independent expenditures, Schedule E, super-PAC, outside spending — the next sentence must say what it *means for a voter*
- **Open loops for retention:** tease the next beat before finishing the current one — see `personas/storyline-editor.md` § Pass C
- **Minimum ~3 flowing sentences per scene** before the visual cuts (Iran deal script is the template: `eng/longform-scripts/sealed-iran-deal.md`)
- Read the full VO aloud: if it sounds like PowerPoint bullets, rewrite before TTS

- Slower setup; expand acronyms once in plain English.
- No TikTok hook grammar in a twelve-minute script.

### Shorts only (same voice, different edit)

- **First line = number + stakes + one insight promise** — still Sarah, not a different character.
- **Shorter sentences** than long-form; cut the fairness paragraph.
- **CTA last 3–5 s:** story completion — "Full audit — SEALED twenty sixteen dot com."
- **Do not** paste long-form paragraphs and trim; **write the short from scratch** in Sarah's register.

**Sample long-form lines**

```text
In twenty fifteen, seven countries signed a deal that froze Iran's nuclear program.
Three years later, one president tore it up — alone.
Tonight, the receipt for who paid him to do it.
```

**Sample short lines (Jessica / Sarah — not Aria)**

```text
Eighty-two million dollars. Three Trump promises — all on the record.
Here's how the money lines up with the votes.

May eighth, twenty eighteen — the Iran deal: torn up.
May fourteenth — the embassy: moved.
December twenty nineteen — the campus rule: expanded.
Three for three. Full receipts at SEALED twenty sixteen dot com.
```

---

## Writer checklist (before handoff to TTS)

| Check | Long-form | Short |
|-------|-----------|-------|
| Voice in header? | `Voice: jessica (Sarah)` | `Voice: jessica (Sarah)` |
| Same person as long-form? | Yes | Yes — not a second hook voice |
| First 10 words | Context + stakes, calm | Number + stakes + "here's how…" |
| Numbers spelled for speech? | Yes | Yes |
| Street dialect / annoyed hook? | No | **No** |
| Copied from the other format? | **Must be NO** | **Must be NO** |

---

## Pipeline hooks

- Long-form: `elevenlabs-tts.py --script eng/longform-scripts/<slug>.md --voice jessica`
- Short: `elevenlabs-tts.py --text "..." --voice jessica --piece <slug>-short` (or `--shorts` → same Jessica lock)
- Storyboard `voice` field = `jessica`; shorts script under `eng/shorts-scripts/`

Council review should flag copy that sounds like a **different character**, not just wrong facts.
