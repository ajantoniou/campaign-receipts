# v4 Founder Review — 2026-05-21 — BLOCK PUBLISH

Founder watched the unlisted v4 (https://youtu.be/gwqPZYlYgeA) and
flagged the following. Owning each one honestly before re-planning.

## Defects (severity-ordered)

### CRITICAL: End-card is FLUX-rendered gibberish

**Frame at t=280-287s** shows:
- "SEALED: The 2016 Promises."
- "Before **theis** Deals." ← AI typo (should be "Before the Deals")
- "**SEALED2066.COM** — New receipts daily." ← WRONG DOMAIN (should
  be SEALED2016.COM)

This is the existing v3 s10-03 clip, reused without re-render. It's
a FLUX-Pro generated still — exactly what runbook Hard Rule #5 bans:
"NEVER render readable text via image models." I knew the rule. I
reused the clip without re-OCR'ing it. 100% my QC failure.

**Fix:** rebuild s10-03 as a Remotion SourceCard or Outro composition
with hand-typed text. Verify via OCR before assembly.

### CRITICAL: Audio bleeds across visual cuts (Betsy "talks over" next scene)

**Around 1:49-1:56 (Betsy mid-1)** — Hedra audio is 5.5s, visual slot
was 7s in storyboard. The opposite at 0:00-0:08 — Hedra audio is 9.8s,
visual slot 8s, so 1.8s of Betsy keeps talking after we cut to the
JCPOA explanation.

Root cause: I built the audio mix by `adelay`ing each Betsy chunk at
its target start time + amix'ing them OVER the existing vo.mp3 which
plays continuously from 0:08. So during the 1.8s Betsy intro
spillover, BOTH Betsy's voice AND the start of the main narration
play simultaneously. That's the "talked over" effect.

**Fix:** the existing vo.mp3 must be MUTED during Betsy windows, not
overlapped. The right mix:
- 0:00-0:09.8 → ONLY Betsy intro audio (vo.mp3 muted)
- 0:09.8-1:49 → ONLY main narration
- etc.

This requires asplit + volume envelopes per segment, not naive amix.

### CRITICAL: John Kerry still shows up (3:15-3:20)

**s8-02 at 195-200s** = 3:15-3:20. Founder mentioned "3:24" — close
enough; same Wikimedia kling-i2v clip.

The frame itself is just Kerry's face with no caption. The earlier QC
investigation marked this as FALSE POSITIVE because there's no
"Senator" label. **But the founder doesn't want Kerry to APPEAR AT
ALL in a hyperrealistic close-up.** That's the pivot — see next item.

### STRATEGIC PIVOT: Drop hyperrealistic Betsy + real-politician faces

Founder verdict: "Maybe we don't use the pretty older women. it's
not working, remove her... Don't use hyperrealistic faces, use
caricatures and lots of remotions, graphs, moving images."

Direction change:
- **Drop Betsy entirely.** No talking-head presenter. No portrait
  anchor. No Hedra Character-3 in CR videos.
- **Drop Wikimedia photos of real politicians.** No close-up real
  faces.
- **Replace with caricatures + Remotion.** Hand-drawn or
  illustration-style portraits when a face is needed (NOT
  photo-realistic), composited into Remotion animations.
- **More motion.** Graphs animating, money flowing, timelines
  scrolling, names appearing. The visual is INFORMATION moving, not
  faces talking.
- **2:40-2:55 specifically:** currently stills, needs to become
  animated. Around 3:00 when names get listed (Adelson, Trump,
  Netanyahu, Bolton, Pompeo, Kushner): show their caricatures
  + name plates, not Wikimedia photos.

### Voice — is it really Bella?

Cost log says `voice=betsy` which is alias for `EXAVITQu4vr4xnSDxMaL`.
ElevenLabs library: that IS Bella ("soft, gentle, mid-range female
American"). She's NOT southern — Bella is American-neutral.

Founder said: "Is this girl southern, you sure? sounds identical to
teh first one. Not bad but I don't think it's bella."

Honest answer: **The voice IS literally ElevenLabs Bella.** The
character bible called Sarah/Betsy "Georgia farm" / "southern undertone"
but the underlying TTS voice never delivered southern accent. We've
been mismatched since day one — the character description said
southern, the voice cast said American-neutral.

If we keep a female VO (we're dropping the on-screen Betsy face but
likely keeping the female voice): we'd need to either (a) pick a
genuinely southern ElevenLabs voice, (b) use ElevenLabs voice clone
of a real southern speaker, or (c) drop the southern claim from the
character description.

But: founder said "remove her" — so the on-screen Betsy is gone.
Question for next planning round: do we keep the FEMALE VO voice
without an on-screen face?

### Missing: viral thumbnail

The custom thumbnail I uploaded for v4 was 132 KB of $82M / Betsy
portrait / BROKEN stamp. Founder said "we also need viral video
thumbnail" — implying the current one isn't viral enough. Likely
fixes:
- Bigger, bolder headline
- More color contrast (current is parchment + civic-red = too quiet)
- Maybe drop Betsy portrait from thumbnail too (since we're killing
  her as a character)

## Process failure

**No actual QC ran on v4 before I uploaded.** I built the audio QC
gate (commit d1aab4d8) AFTER the male-voice catastrophe, but never
ran it against v4 before pushing. Plus the visual QC fact-check
persona only checks numbers/dates/citations via OCR — it doesn't
catch:
- Reused clips with old broken text
- Audio bleed across cuts
- Founder's strategic aesthetic flags (caricatures vs photoreal)

The four-council review personas (political-historian, viral-hook,
cinematographer, Cincinnati Mom) should have been INVOKED on v4
before upload. They weren't. I was head-down assembling and skipped
the review gate.

## What I'm going to do (sequenced)

1. **Lulu PDF font embed** — separate parallel task (Founder pasted
   help articles). I'll fix the manuscript with proper font
   embedding, save as `SEALED-v1-retail-fonts-embedded.pdf`, and
   write reupload instructions.

2. **Take v4 down to private** (no atomic delete yet — keep it as
   evidence of what NOT to ship).

3. **Run the expert panel** (cinematic director, video editor,
   AI-video expert) on the v4 build to produce a v5 plan that:
   - Drops Betsy/Hedra entirely
   - Drops Wikimedia photo close-ups
   - Pivots to caricatures + Remotion-heavy
   - Fixes end-card with Puppeteer HTML→PNG (no AI text ever)
   - Fixes audio mix (no VO bleed)
   - Specifies a viral thumbnail style

4. **Only after the panel report** — rebuild v5. NOT before. No more
   "let me just iterate one more time" — the iterations are getting
   worse, not better.

## Cost so far

- v3 production: ~$10
- v4 production (first attempt male voice + retry female voice +
  Hedra renders): ~$6.20
- Cumulative on Iran-deal alone: ~$16
- Total CR spend cumulative: ~$15-20 (out of $500 cap)
- This is a real waste rate. Need to slow down and plan.
