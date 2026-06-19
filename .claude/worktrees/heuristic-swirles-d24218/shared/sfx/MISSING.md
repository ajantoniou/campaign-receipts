# SFX gaps — items to source manually before YouTube long-form launch

Curated 2026-05-21 against
`companies/campaign-receipts/personas/sfx-specialist.md`.

All 7 mandatory cues have at least one candidate downloaded, **but one is
flagged for founder review and several are mp3 previews rather than
lossless masters.**

## Hard gap

### `scene-sting-f-minor.wav` — NO confirmed F-minor key match

The persona requires a sting tuned to **F minor** to match the music bed.
None of the CC0 cinematic stings I found on Freesound publish their key.
I downloaded two placeholders:

- `scene-sting-candidate-cinematic-impact.mp3` — Jofae "Cinematic Low
  Pitch Impact" (CC0). Tonally dark but key not declared. Reads more
  "impact" than "sustained note".
- `scene-sting-candidate-piano-f.mp3` — pinkyfinger "Piano F.wav" (CC0).
  Single F natural piano note. **The persona explicitly bans piano
  stabs**, so this is a fallback only.

**Action for founder:** either (a) commission a 250ms F-minor sting from
the music bed composer (this is a 5-minute job in Logic / Ableton — pluck
F + Ab + C as a dyad, fade in/out), or (b) accept the Jofae impact and
re-pitch it to F2 in apply-sfx.mjs at runtime.

Promising lead I didn't have time to confirm:
- SilverIllusionist's "Cinematic Stings" pack
  (https://freesound.org/people/SilverIllusionist/packs/35496/) — worth
  combing individually for a key match.

## Format caveat — mp3 previews, not WAV masters

Freesound's full WAV downloads require a free account login, which I
couldn't authenticate from this agent session. Every downloaded asset is
the **public hq.mp3 preview** from `cdn.freesound.org/previews/...` —
same audio content, mp3-compressed (~192 kbps). This is fine for editing
reference and almost certainly fine for the final mux at -22 dB or
lower, but if the founder wants the lossless WAV masters for archival,
each `<asset>.attribution.json` includes the source_url; log in to
Freesound and grab the WAV.

## Soft gaps / taste notes

### `verdict-stamp-hit.mp3`
I.fekry's "traditional stamp.wav" is 1.59s — way longer than the 120ms
target. Trim the attack-only portion in apply-sfx.mjs. The first ~80ms
is the stamp impact; everything after is desk resonance, which we
probably don't want under a verdict reveal (would compete with the bass
drop firing under the same beat).

### `subbass-drop.mp3` vs `subbass-drop-2.mp3`
Kept both. AlexLane (Moog Sub 37 impact) is tighter and lands closer to
the persona's 200ms decay spec; david_werecat's "Bass Drop Huge" is
deeper but has a longer tail. Use AlexLane as default and
`subbass-drop-2.mp3` only on the biggest reveal of each video.

### `moneyflow-whoosh.mp3` choice
The brightest whoosh I found (Vilkas_Sound's "VS_Short Whoosh 7") is
CC-BY 4.0 and skews "AI explainer" — I skipped it. Sadiquecat's metal
tea strainer foley fits the persona's "paper-airy, not aggressive" line
better. Kept Kinoton (bamboo) and AudioPapkin (cinematic) as variants.

### `room-tone-cinematic.mp3`
richwise's empty-office tone has a faint **periodic beep** from office
equipment every few seconds. Either EQ-notch the beep frequency or
pick a beep-free 10-30s segment when looping. Backup option if the beep
proves intractable:
- klankbeeld "room-tone quiet 01" (CC-BY 4.0, requires attribution) at
  https://freesound.org/people/klankbeeld/sounds/171740/

## What is NOT in this folder

- Nothing from Pixabay. Pixabay is behind a Cloudflare challenge that
  blocks unauthenticated fetches from this environment. Several promising
  Pixabay candidates exist (e.g. their "Typewriter click" #41042) — if
  the Freesound previews are insufficient, the founder can grab WAVs
  manually from Pixabay sound-effects pages in a browser session.
- Nothing from Incompetech. Kevin MacLeod's catalog leans toward full
  tracks rather than single stings; couldn't find a 250ms F-minor cue
  in the time budget. Worth a deeper dive if the placeholder sting
  doesn't work.
- Nothing AI-generated, nothing from Epidemic Sound, nothing from
  YouTube Audio Library — per persona hard rules.
