# SEALED 60-Sec Movie Hook — v2 Script

Three-act narrated companion film. Total runtime: 60s ±3s. Format: 1920×1080 master, 9:16 auto-crop, 15s ultra-hook cut.

## NT Ministry persona direction (synthesized)

- **series-architect:** Three-act spine holds. Tighten Act 1: one canonical promise carries the cold open, then a rapid pair. Reserve dramatic weight for the 145-count reveal.
- **james-the-narrator:** Calm, plainspoken, slightly tired. Short sentences, then a longer one that lands. Documentary register — 60 Minutes, not evangelist. No theatrical inflection. ElevenLabs "Adam" (narrator preset, stability 0.55, similarity 0.75).
- **video-producer:** Compress title hold (3s → 1.5s). Give scoreboard +2s (8s → 10s) so numbers register on first read. Per-tile 200ms staggered reveal would be ideal but is out of scope for ffmpeg-only build; we hold the static scoreboard 10s instead.
- **design-expert:** Caption band opacity 0.78 → 0.55 to stop fighting the parchment palette. End-card wordmark +24px top margin for breathing room.
- **youtube-virality-expert:** Open on a number, not a date. "145 PROMISES." in frame one is the curiosity gap. Date moves to second 2. First 3 seconds = the entire hook-rate decision.

Persistent burned-in lower-third (Acts 1–2): `Voice-over reads verbatim 2016 campaign quotes. Source page in description.`

Safe zone: load-bearing content inside center 1080px column of the 1920 master.

---

## Act 1 — THE PROMISE (0:00 – 0:18)

| t       | Visual                                | On-screen text                                                       | Narration (Adam / ElevenLabs)                                  |
|---------|---------------------------------------|----------------------------------------------------------------------|-----------------------------------------------------------------|
| 0:00–02 | Cold open: "145 PROMISES."            | huge serif "145 PROMISES." / sub: "He made them. We kept the list." | (silent — let the number land)                                  |
| 0:02–04 | Cut to dated parchment frame          | "JUNE 16, 2015" / sub: "He came down the escalator."                | "June sixteenth, two thousand fifteen."                         |
| 0:04–10 | Ken-burns on `ch1-swamp.jpg`          | Caption: "I will drain the swamp."                                   | "I will drain the swamp in Washington."                          |
| 0:10–14 | Ken-burns on `ch4-healthcare.jpg`     | Caption: "Repeal and replace Obamacare."                             | "Repeal and replace Obamacare."                                 |
| 0:14–18 | Ken-burns on `ch7-china.jpg`          | Caption: "Bring back our jobs."                                      | "Bring back our jobs."                                          |

## Act 2 — THE RECEIPT (0:18 – 0:38)

| t       | Visual                            | On-screen text                                                                          | Narration                                                                 |
|---------|-----------------------------------|------------------------------------------------------------------------------------------|----------------------------------------------------------------------------|
| 0:18–23 | 2×2 cover grid (16/20/24/26)      | Overlay: "2016. 2020. 2024. 2026."                                                       | "For ten years, we kept the receipts."                                    |
| 0:23–28 | Parchment ledger frame            | "He made 145 promises." / "We tracked every one."                                        | "One hundred forty-five promises. We tracked every one."                  |
| 0:28–38 | Scorecard (4 tiles)               | 46 KEPT / 51 PARTIAL / 40 BROKEN / 8 READER-DECIDES                                      | "Forty-six kept. Fifty-one partial. Forty broken. Eight, you decide."     |

## Act 3 — THE ARCHIVE (0:38 – 0:60)

| t       | Visual                                          | On-screen text                                              | Narration                                                            |
|---------|-------------------------------------------------|--------------------------------------------------------------|-----------------------------------------------------------------------|
| 0:38–44 | Ken-burns on `policy-trade-2024-screenshot.png` | Caption: "Then in 2024 he ran again."                       | "Then in twenty-twenty-four, he ran again."                          |
| 0:44–48 | Ken-burns on `policy-economy-2024-screenshot.png` | Caption: "We preserved those promises too."                | "We preserved that platform too."                                    |
| 0:48–52 | Live donaldjtrump.com (donate shell)            | (silent reveal)                                              | (1.5s breath — silence carries the visual)                           |
| 0:52–56 | Text zoom over donate shell                     | "THEY DELETED THE PLATFORM." / "WE KEPT IT."                | "They deleted the platform. We kept it."                             |
| 0:56–60 | Parchment end-card                              | "SEALED2016.COM" / "campaignreceipts.com / sources"          | (silent — wordmark holds)                                            |

---

## Audio design

- ElevenLabs "Adam" (voice_id `pNInz6obpgDQGcFmaJgB`), model `eleven_multilingual_v2`, stability 0.55, similarity 0.75, style 0.0.
- Per-line MP3s generated then aligned to t-marks above via ffmpeg `adelay` + `amix`.
- Single VO track normalized to -16 LUFS. No music bed in v2 (would compete with narration register).
- Acts 1+2 lower-third visible; Act 3 transitions to end-card framing (no lower-third on final beats — matches v1).

## What changed v1 → v2

1. Cold open is "145 PROMISES." (number-first hook) instead of "JUNE 16, 2015."
2. Narration added (Adam, ElevenLabs) reading verbatim 2016 quotes + minimal editorial linkers.
3. Title hold 3s → 1.5s.
4. Scoreboard 8s → 10s.
5. Caption band opacity 0.78 → 0.55.
6. End-card breathing room +24px above wordmark.
7. 15-sec ultra-hook variant added (`sealed-hook-v2-15s.mp4`): cold-open + scoreboard + end-card only, no narration first beat.

## Asset manifest

Reuses v1 assets exclusively:
- `public/ch1-swamp.jpg`, `ch4-healthcare.jpg`, `ch7-china.jpg`
- `public/cover-2016.jpg` through `cover-2026.jpg`
- `companies/campaign-receipts/public/sources/policy-trade-2024-screenshot.png`, `policy-economy-2024-screenshot.png`
- `public/movie/_build/live-donaldjtrump.png` (reused if present from v1 render)

Generated at render time:
- Typography frames (Puppeteer)
- `_build/vo/*.mp3` per-line narration (ElevenLabs)
- `_build/vo-master.mp3` (ffmpeg-aligned VO track)
