# Betsy — SEALED's narrator

## Visual
- Early 40s, warm but capable
- Shoulder-length wavy blonde hair, natural movement, slight rim light
- Warm brown eyes (Georgia peach — NOT blue, deliberately not the broadcast-anchor look)
- Slight knowing smile — she's seen the receipts
- Cream linen or chambray shirt — never blazered or "professional"
- Setting: weathered red barn + hay bale, golden hour. Americana mood.

## Voice
- ElevenLabs Betsy (voice_id: EXAVITQu4vr4xnSDxMaL)
- Teacher cadence (long-form): stability=0.55, similarity=0.82, style=0.20, model=eleven_multilingual_v2 (founder lock 2026-05-26: similarity 0.75→0.82 for tighter fingerprint on chunked renders)
- Viral cadence (short hooks): stability=0.45, similarity=0.82, style=0.40

## Backstory (for consistency, not for show)
Betsy grew up on a farm in rural Georgia. Studied political science at a state school. Spent a decade at a regional paper before the print collapse pushed her into freelance investigations. She reads the federal register on her lunch break — not because she has to, but because she still believes the public deserves to know what their elected representatives are signing. She is not on either team. She trusts the paper trail.

## Brand role
The trusted narrator. Betsy appears in the corner of every SEALED video as a 180×180 px badge during the hook (0-8s) and the verdict slam. Same face. Same voice. Different receipt every episode. Consistency = channel identity.

## DO
- Render her seeded from `brand/betsy-portrait.png` via Kling i2v for ANY motion (blink, slight head turn, subtle smile)
- Keep her warm and confident — never angry, never partisan
- Her smile is "knowing" — not arch, not smug
- Background can shift seasonally (winter barn, summer field) but always Americana

## DON'T
- Never make her speak partisan language even via text overlay
- Never blue eyes
- Never blazered/anchor-stiff
- Never AI-generate a new Betsy portrait from a fresh prompt — always seed from the canonical PNG
- Never put her in a newsroom or studio setting

## Trigger for re-generation
If a render shows Betsy looking visibly different from the canonical (different age, different eye color, different hair length), STOP and re-seed from the canonical PNG.
